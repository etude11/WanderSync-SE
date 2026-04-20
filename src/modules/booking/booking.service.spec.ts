import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BookingType, Role } from '@prisma/client';
import { BookingService } from './booking.service';
import { ProviderRegistryService } from './provider-registry.service';
import { IBookingStrategy, NormalizedBooking } from './strategies/booking-strategy.interface';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';

const makeNormalized = (ref: string): NormalizedBooking => ({
  providerRef: ref,
  type: BookingType.FLIGHT,
  departureTime: new Date('2026-06-01T10:00:00Z'),
  arrivalTime: new Date('2026-06-01T12:00:00Z'),
  origin: 'DEL',
  destination: 'BOM',
  rawData: {},
});

const mockItinerary = { id: 'itin1', userId: 'user1', title: 'Trip', createdAt: new Date(), updatedAt: new Date() };
const mockBooking = {
  id: 'b1', itineraryId: 'itin1', provider: 'aviationstack',
  providerRef: 'AI101', type: BookingType.FLIGHT,
  departureTime: new Date(), arrivalTime: new Date(),
  origin: 'DEL', destination: 'BOM', disrupted: false, rawData: {}, createdAt: new Date(),
};

describe('BookingService', () => {
  let service: BookingService;
  let prisma: jest.Mocked<Pick<PrismaService, 'itinerary' | 'bookingRecord'>>;
  let redis: { client: { get: jest.Mock; set: jest.Mock } };
  let registry: ProviderRegistryService;
  let strategy: jest.Mocked<IBookingStrategy>;

  beforeEach(() => {
    strategy = {
      providerKey: 'aviationstack',
      bookingType: BookingType.FLIGHT,
      fetchAndNormalize: jest.fn(),
    };
    registry = new ProviderRegistryService();
    registry.register(strategy);

    prisma = {
      itinerary: { findUnique: jest.fn() } as never,
      bookingRecord: {
        findMany: jest.fn(),
        upsert: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      } as never,
    };

    redis = { client: { get: jest.fn(), set: jest.fn() } };

    service = new BookingService(
      registry,
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
    );

    jest.clearAllMocks();
  });

  it('throws NotFoundException when itinerary does not exist', async () => {
    (prisma.itinerary.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.aggregate('itin1', 'user1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ForbiddenException when userId does not match itinerary owner', async () => {
    (prisma.itinerary.findUnique as jest.Mock).mockResolvedValue({ ...mockItinerary, userId: 'other' });
    await expect(service.aggregate('itin1', 'user1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('calls strategy with relevant providerRefs and upserts results', async () => {
    (prisma.itinerary.findUnique as jest.Mock).mockResolvedValue(mockItinerary);
    (prisma.bookingRecord.findMany as jest.Mock).mockResolvedValue([mockBooking]);
    (redis.client.get as jest.Mock).mockResolvedValue(null);
    strategy.fetchAndNormalize.mockResolvedValue([makeNormalized('AI101')]);
    (prisma.bookingRecord.upsert as jest.Mock).mockResolvedValue(mockBooking);
    (prisma.bookingRecord.findMany as jest.Mock)
      .mockResolvedValueOnce([mockBooking])
      .mockResolvedValue([mockBooking]);

    const result = await service.aggregate('itin1', 'user1');
    expect(strategy.fetchAndNormalize).toHaveBeenCalledWith(['AI101']);
    expect(prisma.bookingRecord.upsert).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('uses cache when available and skips strategy call', async () => {
    (prisma.itinerary.findUnique as jest.Mock).mockResolvedValue(mockItinerary);
    (prisma.bookingRecord.findMany as jest.Mock).mockResolvedValue([mockBooking]);
    (redis.client.get as jest.Mock).mockResolvedValue(
      JSON.stringify([makeNormalized('AI101')])
    );
    (prisma.bookingRecord.upsert as jest.Mock).mockResolvedValue(mockBooking);
    (prisma.bookingRecord.findMany as jest.Mock).mockResolvedValue([mockBooking]);

    await service.aggregate('itin1', 'user1');
    expect(strategy.fetchAndNormalize).not.toHaveBeenCalled();
  });
});
