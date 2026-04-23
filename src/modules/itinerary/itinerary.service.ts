import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingRecord, Itinerary } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { AddBookingDto } from '../booking/dto/add-booking.dto';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';

@Injectable()
export class ItineraryService {
  private static readonly TIMELINE_TTL = 300;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async listAll(userId: string): Promise<(Itinerary & { bookings: BookingRecord[] })[]> {
    return this.prisma.itinerary.findMany({
      where: { userId },
      include: { bookings: { orderBy: { departureTime: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateItineraryDto): Promise<Itinerary> {
    return this.prisma.itinerary.create({
      data: { userId, title: dto.title },
    });
  }

  async findTimeline(itineraryId: string, userId: string): Promise<BookingRecord[]> {
    const cacheKey = `itinerary:${itineraryId}`;
    const cached = await this.redis.client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as BookingRecord[];
    }

    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: itineraryId },
      include: { bookings: { orderBy: { departureTime: 'asc' } } },
    });

    if (!itinerary) throw new NotFoundException('Itinerary not found');
    if (itinerary.userId !== userId) throw new ForbiddenException('Access denied');

    await this.redis.client.set(
      cacheKey,
      JSON.stringify(itinerary.bookings),
      'EX',
      ItineraryService.TIMELINE_TTL,
    );

    return itinerary.bookings;
  }

  async update(itineraryId: string, userId: string, dto: UpdateItineraryDto): Promise<Itinerary> {
    await this.assertOwnership(itineraryId, userId);
    return this.prisma.itinerary.update({
      where: { id: itineraryId },
      data: { ...(dto.title ? { title: dto.title } : {}) },
    });
  }

  async remove(itineraryId: string, userId: string): Promise<void> {
    await this.assertOwnership(itineraryId, userId);
    await this.redis.client.del(`itinerary:${itineraryId}`);
    await this.prisma.itinerary.delete({ where: { id: itineraryId } });
  }

  async addBooking(
    itineraryId: string,
    userId: string,
    dto: AddBookingDto,
  ): Promise<BookingRecord> {
    await this.assertOwnership(itineraryId, userId);
    const booking = await this.prisma.bookingRecord.create({
      data: {
        itineraryId,
        provider: 'manual',
        providerRef: dto.providerRef,
        type: dto.type,
        departureTime: new Date(dto.departureTime),
        arrivalTime: new Date(dto.arrivalTime),
        origin: dto.origin,
        destination: dto.destination,
        rawData: {},
      },
    });
    await this.redis.client.del(`itinerary:${itineraryId}`);
    return booking;
  }

  async removeBooking(
    itineraryId: string,
    bookingId: string,
    userId: string,
  ): Promise<void> {
    const booking = await this.prisma.bookingRecord.findFirst({
      where: { id: bookingId, itineraryId },
      include: { itinerary: { select: { userId: true } } },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    const it = (booking as BookingRecord & { itinerary: { userId: string } }).itinerary;
    if (it.userId !== userId) throw new ForbiddenException('Access denied');

    await this.prisma.bookingRecord.delete({ where: { id: bookingId } });
    await this.redis.client.del(`itinerary:${itineraryId}`);
  }

  private async assertOwnership(itineraryId: string, userId: string): Promise<void> {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: itineraryId },
      select: { userId: true },
    });
    if (!itinerary) throw new NotFoundException('Itinerary not found');
    if (itinerary.userId !== userId) throw new ForbiddenException('Access denied');
  }
}
