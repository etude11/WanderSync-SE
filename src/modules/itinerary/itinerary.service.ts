import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BookingRecord, Itinerary } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { AddBookingDto } from '../booking/dto/add-booking.dto';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';

@Injectable()
export class ItineraryService {
  private static readonly TIMELINE_TTL = 300;
  private readonly logger = new Logger(ItineraryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
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

  async summarize(itineraryId: string, userId: string): Promise<{ summary: string }> {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: itineraryId },
      include: { bookings: { orderBy: { departureTime: 'asc' } } },
    });
    if (!itinerary) throw new NotFoundException('Itinerary not found');
    if (itinerary.userId !== userId) throw new ForbiddenException('Access denied');

    const cacheKey = `itinerary-summary:${itineraryId}`;
    const cached = await this.redis.client.get(cacheKey);
    if (cached) return { summary: cached };

    const apiKey = this.config.get<string>('gemini.apiKey');
    if (!apiKey || itinerary.bookings.length === 0) {
      return { summary: this.buildFallbackSummary(itinerary.title, itinerary.bookings) };
    }

    const bookingLines = itinerary.bookings.map((b) => {
      const dep = new Date(b.departureTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
      const arr = new Date(b.arrivalTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
      return `  - [${b.type}] ${b.providerRef}: ${b.origin} → ${b.destination}, dep ${dep}, arr ${arr}`;
    }).join('\n');

    const prompt = [
      `You are a travel assistant. Write a friendly, concise 3-5 sentence summary of this trip itinerary for the traveler.`,
      `Include highlights like destinations, travel modes, and overall trip duration. Be warm and informative.`,
      ``,
      `Trip: "${itinerary.title}"`,
      `Bookings:`,
      bookingLines,
    ].join('\n');

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { maxOutputTokens: 512, temperature: 0.7 } });
      const result = await model.generateContent(prompt);
      const summary = result.response.text().trim();
      await this.redis.client.set(cacheKey, summary, 'EX', 300);
      return { summary };
    } catch (e) {
      this.logger.error(`Gemini summary failed: ${(e as Error).message}`);
      return { summary: this.buildFallbackSummary(itinerary.title, itinerary.bookings) };
    }
  }

  private buildFallbackSummary(title: string, bookings: BookingRecord[]): string {
    if (bookings.length === 0) return `Your trip "${title}" has no bookings yet.`;
    const first = bookings[0];
    const last = bookings[bookings.length - 1];
    const depDate = new Date(first.departureTime).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' });
    const arrDate = new Date(last.arrivalTime).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' });
    return `Your trip "${title}" starts on ${depDate} from ${first.origin} and ends on ${arrDate} at ${last.destination}, with ${bookings.length} booking(s).`;
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
