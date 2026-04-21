import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BookingType } from '@prisma/client';
import { ItineraryService } from './itinerary.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';

const mockItinerary = {
  id: 'itin1', userId: 'user1', title: 'India Trip',
  createdAt: new Date(), updatedAt: new Date(), bookings: [],
};

const mockBooking = {
  id: 'b1', itineraryId: 'itin1', provider: 'aviationstack',
  providerRef: 'AI101', type: BookingType.FLIGHT,
  departureTime: new Date('2026-06-01T10:00:00Z'),
  arrivalTime: new Date('2026-06-01T12:00:00Z'),
  origin: 'DEL', destination: 'BOM', disrupted: false, rawData: {}, createdAt: new Date(),
};

describe('ItineraryService', () => {
  let service: ItineraryService;
  let prisma: {
    itinerary: {
      findMany: jest.Mock; create: jest.Mock; findUnique: jest.Mock;
      update: jest.Mock; delete: jest.Mock;
    };
    bookingRecord: { create: jest.Mock; delete: jest.Mock; findFirst: jest.Mock };
  };
  let redis: { client: { get: jest.Mock; set: jest.Mock; del: jest.Mock } };

  beforeEach(() => {
    prisma = {
      itinerary: {
        findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(),
        update: jest.fn(), delete: jest.fn(),
      },
      bookingRecord: { create: jest.fn(), delete: jest.fn(), findFirst: jest.fn() },
    };
    redis = { client: { get: jest.fn(), set: jest.fn(), del: jest.fn() } };
    service = new ItineraryService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
    );
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates and returns new itinerary', async () => {
      prisma.itinerary.create.mockResolvedValue(mockItinerary);
      const result = await service.create('user1', { title: 'India Trip' });
      expect(result.title).toBe('India Trip');
      expect(prisma.itinerary.create).toHaveBeenCalledWith({
        data: { userId: 'user1', title: 'India Trip' },
      });
    });
  });

  describe('findTimeline', () => {
    it('returns cached timeline on cache hit', async () => {
      redis.client.get.mockResolvedValue(JSON.stringify([mockBooking]));
      const result = await service.findTimeline('itin1', 'user1');
      expect(result).toHaveLength(1);
      expect(prisma.itinerary.findUnique).not.toHaveBeenCalled();
    });

    it('queries DB and caches on cache miss', async () => {
      redis.client.get.mockResolvedValue(null);
      prisma.itinerary.findUnique.mockResolvedValue({
        ...mockItinerary,
        bookings: [mockBooking],
      });
      const result = await service.findTimeline('itin1', 'user1');
      expect(result).toHaveLength(1);
      expect(redis.client.set).toHaveBeenCalledWith(
        'itinerary:itin1',
        expect.any(String),
        'EX',
        300,
      );
    });

    it('throws ForbiddenException when user does not own itinerary', async () => {
      redis.client.get.mockResolvedValue(null);
      prisma.itinerary.findUnique.mockResolvedValue({ ...mockItinerary, userId: 'other' });
      await expect(service.findTimeline('itin1', 'user1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFoundException when itinerary does not exist', async () => {
      redis.client.get.mockResolvedValue(null);
      prisma.itinerary.findUnique.mockResolvedValue(null);
      await expect(service.findTimeline('itin1', 'user1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('addBooking', () => {
    it('creates booking and invalidates cache', async () => {
      prisma.itinerary.findUnique.mockResolvedValue(mockItinerary);
      prisma.bookingRecord.create.mockResolvedValue(mockBooking);
      await service.addBooking('itin1', 'user1', {
        providerRef: 'AI101', type: BookingType.FLIGHT,
        departureTime: '2026-06-01T10:00:00Z', arrivalTime: '2026-06-01T12:00:00Z',
        origin: 'DEL', destination: 'BOM',
      });
      expect(prisma.bookingRecord.create).toHaveBeenCalled();
      expect(redis.client.del).toHaveBeenCalledWith('itinerary:itin1');
    });

    it('throws ForbiddenException when user does not own itinerary', async () => {
      prisma.itinerary.findUnique.mockResolvedValue({ ...mockItinerary, userId: 'other' });
      await expect(
        service.addBooking('itin1', 'user1', {
          providerRef: 'AI101', type: BookingType.FLIGHT,
          departureTime: '2026-06-01T10:00:00Z', arrivalTime: '2026-06-01T12:00:00Z',
          origin: 'DEL', destination: 'BOM',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('removeBooking', () => {
    it('deletes booking and invalidates cache', async () => {
      prisma.bookingRecord.findFirst.mockResolvedValue({
        ...mockBooking, itinerary: { userId: 'user1' },
      });
      prisma.bookingRecord.delete.mockResolvedValue(mockBooking);
      await service.removeBooking('itin1', 'b1', 'user1');
      expect(prisma.bookingRecord.delete).toHaveBeenCalledWith({ where: { id: 'b1' } });
      expect(redis.client.del).toHaveBeenCalledWith('itinerary:itin1');
    });
  });
});
