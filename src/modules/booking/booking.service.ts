import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingRecord, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { ProviderRegistryService } from './provider-registry.service';
import { NormalizedBooking } from './strategies/booking-strategy.interface';

@Injectable()
export class BookingService {
  constructor(
    private readonly registry: ProviderRegistryService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async aggregate(itineraryId: string, userId: string): Promise<BookingRecord[]> {
    const itinerary = await this.prisma.itinerary.findUnique({ where: { id: itineraryId } });
    if (!itinerary) throw new NotFoundException('Itinerary not found');
    if (itinerary.userId !== userId) throw new ForbiddenException('Access denied');

    const existing = await this.prisma.bookingRecord.findMany({ where: { itineraryId } });

    await Promise.allSettled(
      this.registry.getAll().map(async (strategy) => {
        const cacheKey = `booking-agg:${userId}:${strategy.providerKey}`;
        const cached = await this.redis.client.get(cacheKey);

        let normalized: NormalizedBooking[];
        if (cached) {
          normalized = JSON.parse(cached) as NormalizedBooking[];
        } else {
          const refs = existing
            .filter((b) => b.type === strategy.bookingType)
            .map((b) => b.providerRef);
          normalized = await strategy.fetchAndNormalize(refs);
          await this.redis.client.set(cacheKey, JSON.stringify(normalized), 'EX', 60);
        }

        await Promise.allSettled(
          normalized.map((n) =>
            this.prisma.bookingRecord.upsert({
              where: {
                itineraryId_providerRef: {
                  itineraryId,
                  providerRef: n.providerRef,
                },
              },
              create: {
                itineraryId,
                provider: strategy.providerKey,
                providerRef: n.providerRef,
                type: n.type,
                departureTime: n.departureTime,
                arrivalTime: n.arrivalTime,
                origin: n.origin,
                destination: n.destination,
                rawData: n.rawData as unknown as Prisma.InputJsonValue,
              },
              update: {
                departureTime: n.departureTime,
                arrivalTime: n.arrivalTime,
                rawData: n.rawData as unknown as Prisma.InputJsonValue,
              },
            }),
          ),
        );
      }),
    );

    return this.prisma.bookingRecord.findMany({
      where: { itineraryId },
      orderBy: { departureTime: 'asc' },
    });
  }

  async findOne(bookingId: string, userId: string): Promise<BookingRecord> {
    const booking = await this.prisma.bookingRecord.findFirst({
      where: { id: bookingId },
      include: { itinerary: { select: { userId: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    const itinerary = (booking as BookingRecord & { itinerary: { userId: string } }).itinerary;
    if (itinerary.userId !== userId) throw new ForbiddenException('Access denied');
    return booking;
  }

  async remove(bookingId: string, userId: string): Promise<void> {
    await this.findOne(bookingId, userId);
    await this.prisma.bookingRecord.delete({ where: { id: bookingId } });
  }
}
