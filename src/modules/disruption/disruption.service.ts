import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingType, DisruptionEvent } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { DetectedDisruption, FlightTrackerAdapter } from './adapters/flight-tracker.adapter';
import { WeatherAlertAdapter } from './adapters/weather-alert.adapter';
import { DisruptionPublisherService } from './disruption-publisher.service';
import { SimulateDisruptionDto } from './dto/simulate-disruption.dto';

@Injectable()
export class DisruptionService {
  private readonly logger = new Logger(DisruptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly flightAdapter: FlightTrackerAdapter,
    private readonly weatherAdapter: WeatherAlertAdapter,
    private readonly publisher: DisruptionPublisherService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async runPoll(): Promise<void> {
    const bookings = await this.prisma.bookingRecord.findMany({
      where: { disrupted: false, departureTime: { gt: new Date() } },
      include: { itinerary: { select: { userId: true } } },
    });

    const flightRefs = bookings
      .filter((b) => b.type === BookingType.FLIGHT)
      .map((b) => b.providerRef);

    const uniqueOrigins = [
      ...new Set(
        bookings.filter((b) => b.type !== BookingType.FLIGHT).map((b) => b.origin),
      ),
    ];

    const [flightResult, weatherResult] = await Promise.allSettled([
      this.flightAdapter.checkFlights(flightRefs),
      this.weatherAdapter.checkWeather(uniqueOrigins),
    ]);

    const allDisruptions: DetectedDisruption[] = [
      ...(flightResult.status === 'fulfilled' ? flightResult.value : []),
      ...(weatherResult.status === 'fulfilled' ? weatherResult.value : []),
    ];

    await Promise.allSettled(
      allDisruptions.map(async (d) => {
        if (d.affectedOrigin && !d.flightIata) {
          const key = `disruption-weather-seen:${d.affectedOrigin}:${d.description.toLowerCase().replace(/\s+/g, '-').slice(0, 50)}`;
          const result = await this.redis.client.set(key, '1', 'EX', 86400, 'NX');
          if (result === null) return;
        }

        const event = await this.prisma.disruptionEvent.create({
          data: {
            type: d.type,
            severity: d.severity,
            description: d.description,
            flightIata: d.flightIata ?? null,
            affectedOrigin: d.affectedOrigin ?? null,
          },
        });

        if (d.flightIata) {
          await this.prisma.bookingRecord.updateMany({
            where: { providerRef: d.flightIata, disrupted: false },
            data: { disrupted: true },
          });
        } else if (d.affectedOrigin) {
          await this.prisma.bookingRecord.updateMany({
            where: { origin: d.affectedOrigin, disrupted: false },
            data: { disrupted: true },
          });
        }

        await this.publisher.publish(event);
      }),
    );
  }

  async simulateDemoDisruption(userId: string): Promise<DisruptionEvent> {
    const flight = await this.prisma.bookingRecord.findFirst({
      where: { itinerary: { userId }, type: BookingType.FLIGHT },
      orderBy: { createdAt: 'asc' },
    });
    const anyBooking = !flight
      ? await this.prisma.bookingRecord.findFirst({ where: { itinerary: { userId } } })
      : null;

    const event = await this.prisma.disruptionEvent.create({
      data: flight
        ? {
            type: 'FLIGHT_DELAY',
            severity: 60,
            description: `Delay detected for flight ${flight.providerRef}`,
            flightIata: flight.providerRef,
            affectedOrigin: null,
          }
        : {
            type: 'SEVERE_WEATHER',
            severity: 45,
            description: `Weather alert for ${anyBooking?.origin ?? 'DEL'}`,
            flightIata: null,
            affectedOrigin: anyBooking?.origin ?? 'DEL',
          },
    });
    await this.publisher.publish(event);
    return event;
  }

  async simulateDisruption(dto: SimulateDisruptionDto): Promise<DisruptionEvent> {
    const event = await this.prisma.disruptionEvent.create({
      data: {
        type: dto.type,
        severity: dto.severity,
        description: dto.description,
        flightIata: dto.flightIata ?? null,
        affectedOrigin: dto.affectedOrigin ?? null,
      },
    });
    await this.publisher.publish(event);
    return event;
  }

  async findMine(userId: string): Promise<DisruptionEvent[]> {
    const bookings = await this.prisma.bookingRecord.findMany({
      where: { itinerary: { userId } },
      select: { providerRef: true, origin: true, type: true },
    });

    if (bookings.length === 0) return [];

    const flightRefs = bookings
      .filter((b) => b.type === BookingType.FLIGHT)
      .map((b) => b.providerRef);
    const origins = [...new Set(bookings.map((b) => b.origin))];

    return this.prisma.disruptionEvent.findMany({
      where: {
        OR: [
          { flightIata: { in: flightRefs } },
          { affectedOrigin: { in: origins } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findAll(page: number, limit: number): Promise<{ data: DisruptionEvent[]; total: number }> {
    const [data, total] = await Promise.all([
      this.prisma.disruptionEvent.findMany({
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.disruptionEvent.count(),
    ]);
    return { data, total };
  }
}
