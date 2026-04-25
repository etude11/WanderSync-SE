import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingType, DisruptionEvent } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { DetectedDisruption, FlightTrackerAdapter } from './adapters/flight-tracker.adapter';
import { WeatherAlertAdapter } from './adapters/weather-alert.adapter';
import { DisruptionPublisherService } from './disruption-publisher.service';
import { DisruptionSuggestionsService } from './suggestions/disruption-suggestions.service';
import { DisruptionStreamService } from './disruption-stream.service';
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
    private readonly suggestionsService: DisruptionSuggestionsService,
    private readonly streamService: DisruptionStreamService,
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
        const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);

        // Deduplicate weather events (24h TTL + DB guard with 2h grace on resolved)
        if (d.affectedOrigin && !d.flightIata) {
          const key = `disruption-weather-seen:${d.affectedOrigin}:${d.description.toLowerCase().replace(/\s+/g, '-').slice(0, 50)}`;
          const result = await this.redis.client.set(key, '1', 'EX', 86400, 'NX');
          if (result === null) return;
          // DB guard — blocks duplicates for ACTIVE or recently-RESOLVED events (2h grace)
          const recentWeather = await this.prisma.disruptionEvent.findFirst({
            where: {
              affectedOrigin: d.affectedOrigin,
              type: d.type,
              OR: [{ status: 'ACTIVE' }, { resolvedAt: { gt: twoHoursAgo } }],
            },
          });
          if (recentWeather) return;
        }

        // Deduplicate flight events (30-min TTL + DB guard with 2h grace on resolved)
        let dedupKey: string | null = null;
        if (d.flightIata) {
          dedupKey = `flight:${d.flightIata}:${d.type}`;
          const flightDedupResult = await this.redis.client.set(
            `disruption-flight-seen:${dedupKey}`, '1', 'EX', 1800, 'NX',
          );
          if (flightDedupResult === null) return;
          // DB guard — blocks duplicates for ACTIVE or recently-RESOLVED events (2h grace)
          const recentFlight = await this.prisma.disruptionEvent.findFirst({
            where: { dedupKey, OR: [{ status: 'ACTIVE' }, { resolvedAt: { gt: twoHoursAgo } }] },
          });
          if (recentFlight) return;

          // CANCELLATION supersedes an existing ACTIVE DELAY for the same flight
          if (d.type === 'FLIGHT_CANCELLATION') {
            const activeDelay = await this.prisma.disruptionEvent.findFirst({
              where: { flightIata: d.flightIata, type: 'FLIGHT_DELAY', status: 'ACTIVE' },
            });
            if (activeDelay) {
              const resolved = await this.prisma.disruptionEvent.update({
                where: { id: activeDelay.id },
                data: { status: 'RESOLVED', resolvedAt: new Date() },
              });
              if (activeDelay.dedupKey) {
                // Grace TTL so the delay doesn't resurface immediately
                await this.redis.client.set(`disruption-flight-seen:${activeDelay.dedupKey}`, '1', 'EX', 7200);
              }
              await this.publisher.publish(resolved);
            }
          }
        }

        const event = await this.prisma.disruptionEvent.create({
          data: {
            type: d.type,
            severity: d.severity,
            description: d.description,
            flightIata: d.flightIata ?? null,
            affectedOrigin: d.affectedOrigin ?? null,
            dedupKey,
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

    // Resolution pass — check if any ACTIVE events have cleared
    const activeEvents = await this.prisma.disruptionEvent.findMany({
      where: { status: 'ACTIVE' },
    });

    if (activeEvents.length > 0) {
      const activeFlightIatas = activeEvents
        .filter((e) => e.flightIata)
        .map((e) => e.flightIata!);
      const activeOrigins = activeEvents
        .filter((e) => e.affectedOrigin && !e.flightIata)
        .map((e) => e.affectedOrigin!);

      const [reCheckedFlights, reCheckedWeather] = await Promise.allSettled([
        activeFlightIatas.length > 0
          ? this.flightAdapter.checkFlights(activeFlightIatas)
          : Promise.resolve([]),
        activeOrigins.length > 0
          ? this.weatherAdapter.checkWeather(activeOrigins)
          : Promise.resolve([]),
      ]);

      const stillActiveFlightIatas = new Set(
        (reCheckedFlights.status === 'fulfilled' ? reCheckedFlights.value : [])
          .filter((d) => d.flightIata)
          .map((d) => d.flightIata!),
      );
      const stillActiveOrigins = new Set(
        (reCheckedWeather.status === 'fulfilled' ? reCheckedWeather.value : [])
          .filter((d) => d.affectedOrigin)
          .map((d) => d.affectedOrigin!),
      );

      await Promise.allSettled(
        activeEvents.map(async (event) => {
          const isStillActive = event.flightIata
            ? stillActiveFlightIatas.has(event.flightIata)
            : event.affectedOrigin
              ? stillActiveOrigins.has(event.affectedOrigin)
              : false;

          if (!isStillActive) {
            const resolved = await this.prisma.disruptionEvent.update({
              where: { id: event.id },
              data: { status: 'RESOLVED', resolvedAt: new Date() },
            });
            if (event.dedupKey) {
              // Keep key alive with 2h grace so the cron doesn't immediately recreate the event
              await this.redis.client.set(`disruption-flight-seen:${event.dedupKey}`, '1', 'EX', 7200);
            }
            await this.publisher.publish(resolved);
          }
        }),
      );
    }
  }

  async simulateDemoDisruption(userId: string): Promise<DisruptionEvent> {
    const flight = await this.prisma.bookingRecord.findFirst({
      where: { itinerary: { userId }, type: BookingType.FLIGHT },
      orderBy: { createdAt: 'asc' },
    });
    const anyBooking = !flight
      ? await this.prisma.bookingRecord.findFirst({ where: { itinerary: { userId } } })
      : null;

    const dedupKey = flight
      ? `flight:${flight.providerRef}:FLIGHT_CANCELLATION`
      : `weather:${anyBooking?.origin ?? 'DEL'}:demo`;

    // Reuse ACTIVE or recently-RESOLVED (2h) event — prevents duplicates on repeated clicks
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
    const existing = await this.prisma.disruptionEvent.findFirst({
      where: { dedupKey, OR: [{ status: 'ACTIVE' }, { resolvedAt: { gt: twoHoursAgo } }] },
    });
    if (existing) {
      // Only re-push ACTIVE events; don't resurface a resolved disruption over SSE
      if (existing.status === 'ACTIVE') {
        this.streamService.pushDirectlyToUser(userId, existing);
      }
      return existing;
    }

    const event = await this.prisma.disruptionEvent.create({
      data: flight
        ? {
            type: 'FLIGHT_CANCELLATION',
            severity: 4,
            description: `Flight ${flight.providerRef} has been cancelled. Please rebook on an alternative flight.`,
            flightIata: flight.providerRef,
            affectedOrigin: null,
            dedupKey,
          }
        : {
            type: 'WEATHER_ALERT',
            severity: 3,
            description: `Weather alert for ${anyBooking?.origin ?? 'DEL'}`,
            flightIata: null,
            affectedOrigin: anyBooking?.origin ?? 'DEL',
            dedupKey,
          },
    });
    await this.publisher.publish(event);
    this.streamService.pushDirectlyToUser(userId, event);
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

  async acknowledge(eventId: string, userId: string): Promise<void> {
    await this.prisma.disruptionAck.upsert({
      where: { userId_eventId: { userId, eventId } },
      create: { userId, eventId },
      update: {},
    });
  }

  async getSuggestions(eventId: string, userId: string): Promise<string[]> {
    const cacheKey = `suggestions:${eventId}`;
    const cached = await this.redis.client.get(cacheKey);
    if (cached) return JSON.parse(cached) as string[];

    const event = await this.prisma.disruptionEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`DisruptionEvent ${eventId} not found`);

    const booking = event.flightIata
      ? await this.prisma.bookingRecord.findFirst({
          where: { providerRef: event.flightIata, itinerary: { userId } },
        })
      : event.affectedOrigin
        ? await this.prisma.bookingRecord.findFirst({
            where: { origin: event.affectedOrigin, itinerary: { userId } },
          })
        : null;

    const suggestions = await this.suggestionsService.suggest({ event, booking });
    await this.redis.client.set(cacheKey, JSON.stringify(suggestions), 'EX', 3600);
    return suggestions;
  }

  async findMine(userId: string): Promise<(DisruptionEvent & { isAcknowledged: boolean })[]> {
    const bookings = await this.prisma.bookingRecord.findMany({
      where: { itinerary: { userId } },
      select: { providerRef: true, origin: true, type: true },
    });

    if (bookings.length === 0) return [];

    const flightRefs = bookings
      .filter((b) => b.type === BookingType.FLIGHT)
      .map((b) => b.providerRef);
    const origins = [...new Set(bookings.map((b) => b.origin))];

    const events = await this.prisma.disruptionEvent.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { flightIata: { in: flightRefs } },
          { affectedOrigin: { in: origins } },
        ],
      },
      include: { acks: { where: { userId }, select: { id: true } } },
      orderBy: { publishedAt: 'desc' },
    });

    return events.map(({ acks, ...event }) => ({
      ...event,
      isAcknowledged: acks.length > 0,
    }));
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
