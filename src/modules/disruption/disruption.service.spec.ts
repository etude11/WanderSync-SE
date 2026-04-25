import { NotFoundException } from '@nestjs/common';
import { BookingType, DisruptionType } from '@prisma/client';
import { DisruptionService } from './disruption.service';
import { FlightTrackerAdapter, DetectedDisruption } from './adapters/flight-tracker.adapter';
import { WeatherAlertAdapter } from './adapters/weather-alert.adapter';
import { DisruptionPublisherService } from './disruption-publisher.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';

const mockBookingFlight = {
  id: 'b1', itineraryId: 'itin1', provider: 'aviationstack',
  providerRef: 'AI101', type: BookingType.FLIGHT,
  origin: 'DEL', destination: 'BOM',
  departureTime: new Date(Date.now() + 86400000),
  arrivalTime: new Date(Date.now() + 93600000),
  disrupted: false, rawData: {}, createdAt: new Date(),
  itinerary: { userId: 'user1' },
};

const mockDisruptionEvent = {
  id: 'evt-1', type: DisruptionType.FLIGHT_DELAY, severity: 2,
  description: 'Flight AI101 delayed 45 min', flightIata: 'AI101',
  affectedOrigin: null, publishedAt: new Date(),
};

describe('DisruptionService', () => {
  let service: DisruptionService;
  let prisma: jest.Mocked<Pick<PrismaService, 'bookingRecord' | 'disruptionEvent'>>;
  let redis: { client: { get: jest.Mock; set: jest.Mock } };
  let flightAdapter: jest.Mocked<FlightTrackerAdapter>;
  let weatherAdapter: jest.Mocked<WeatherAlertAdapter>;
  let publisher: jest.Mocked<DisruptionPublisherService>;

  beforeEach(() => {
    prisma = {
      bookingRecord: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      } as never,
      disruptionEvent: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      } as never,
    };

    redis = { client: { get: jest.fn(), set: jest.fn().mockResolvedValue('OK') } };

    flightAdapter = { checkFlights: jest.fn() } as never;
    weatherAdapter = { checkWeather: jest.fn() } as never;
    publisher = { publish: jest.fn() } as never;
    const suggestionsService = { getSuggestions: jest.fn().mockResolvedValue([]) } as never;
    const streamService = { pushDirectlyToUser: jest.fn() } as never;

    service = new DisruptionService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
      flightAdapter,
      weatherAdapter,
      publisher,
      suggestionsService,
      streamService,
    );

    jest.clearAllMocks();
  });

  describe('runPoll', () => {
    it('queries only future undisrupted bookings', async () => {
      (prisma.bookingRecord.findMany as jest.Mock).mockResolvedValue([]);
      flightAdapter.checkFlights.mockResolvedValue([]);
      weatherAdapter.checkWeather.mockResolvedValue([]);
      await service.runPoll();
      expect(prisma.bookingRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ disrupted: false }),
        }),
      );
    });

    it('passes flight providerRefs to flightAdapter', async () => {
      (prisma.bookingRecord.findMany as jest.Mock).mockResolvedValue([mockBookingFlight]);
      flightAdapter.checkFlights.mockResolvedValue([]);
      weatherAdapter.checkWeather.mockResolvedValue([]);
      await service.runPoll();
      expect(flightAdapter.checkFlights).toHaveBeenCalledWith(['AI101']);
    });

    it('persists DisruptionEvent and marks booking disrupted on detection', async () => {
      (prisma.bookingRecord.findMany as jest.Mock).mockResolvedValue([mockBookingFlight]);
      const disruption: DetectedDisruption = {
        type: DisruptionType.FLIGHT_DELAY, severity: 2,
        description: 'Flight AI101 delayed 45 min', flightIata: 'AI101',
      };
      flightAdapter.checkFlights.mockResolvedValue([disruption]);
      weatherAdapter.checkWeather.mockResolvedValue([]);
      (prisma.disruptionEvent.create as jest.Mock).mockResolvedValue(mockDisruptionEvent);
      (prisma.bookingRecord.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.runPoll();

      expect(prisma.disruptionEvent.create).toHaveBeenCalled();
      expect(prisma.bookingRecord.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ providerRef: 'AI101' }) }),
      );
      expect(publisher.publish).toHaveBeenCalledWith(mockDisruptionEvent);
    });

    it('skips weather disruption when Redis NX returns null (dedup)', async () => {
      const weatherBooking = { ...mockBookingFlight, type: BookingType.HOTEL, providerRef: 'H1', origin: 'DEL' };
      (prisma.bookingRecord.findMany as jest.Mock).mockResolvedValue([weatherBooking]);
      flightAdapter.checkFlights.mockResolvedValue([]);
      const weatherDisruption: DetectedDisruption = {
        type: DisruptionType.WEATHER_ALERT, severity: 3,
        description: 'Severe Thunderstorm Warning', affectedOrigin: 'DEL',
      };
      weatherAdapter.checkWeather.mockResolvedValue([weatherDisruption]);
      (redis.client.set as jest.Mock).mockResolvedValue(null); // NX failed — already exists

      await service.runPoll();

      expect(prisma.disruptionEvent.create).not.toHaveBeenCalled();
    });

    it('continues processing when one disruption fails (allSettled)', async () => {
      (prisma.bookingRecord.findMany as jest.Mock).mockResolvedValue([mockBookingFlight]);
      const disruption: DetectedDisruption = {
        type: DisruptionType.FLIGHT_CANCELLATION, severity: 4,
        description: 'Cancelled', flightIata: 'AI101',
      };
      flightAdapter.checkFlights.mockResolvedValue([disruption]);
      weatherAdapter.checkWeather.mockResolvedValue([]);
      (prisma.disruptionEvent.create as jest.Mock).mockRejectedValue(new Error('db error'));

      await expect(service.runPoll()).resolves.not.toThrow();
    });

    it('returns without error when no bookings exist', async () => {
      (prisma.bookingRecord.findMany as jest.Mock).mockResolvedValue([]);
      flightAdapter.checkFlights.mockResolvedValue([]);
      weatherAdapter.checkWeather.mockResolvedValue([]);
      await expect(service.runPoll()).resolves.not.toThrow();
    });
  });

  describe('simulateDisruption', () => {
    it('creates DisruptionEvent directly without calling adapters', async () => {
      (prisma.disruptionEvent.create as jest.Mock).mockResolvedValue(mockDisruptionEvent);
      const dto = { type: DisruptionType.FLIGHT_DELAY, severity: 2, description: 'test', flightIata: 'AI101' };

      await service.simulateDisruption(dto);

      expect(prisma.disruptionEvent.create).toHaveBeenCalled();
      expect(flightAdapter.checkFlights).not.toHaveBeenCalled();
      expect(weatherAdapter.checkWeather).not.toHaveBeenCalled();
    });

    it('publishes event to Redis Stream', async () => {
      (prisma.disruptionEvent.create as jest.Mock).mockResolvedValue(mockDisruptionEvent);
      const dto = { type: DisruptionType.FLIGHT_DELAY, severity: 2, description: 'test' };

      await service.simulateDisruption(dto);

      expect(publisher.publish).toHaveBeenCalledWith(mockDisruptionEvent);
    });

    it('does NOT mark any booking disrupted', async () => {
      (prisma.disruptionEvent.create as jest.Mock).mockResolvedValue(mockDisruptionEvent);
      const dto = { type: DisruptionType.FLIGHT_DELAY, severity: 2, description: 'test', flightIata: 'AI101' };

      await service.simulateDisruption(dto);

      expect(prisma.bookingRecord.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('findMine', () => {
    it('queries DisruptionEvents using both flightIata and affectedOrigin OR', async () => {
      (prisma.bookingRecord.findMany as jest.Mock).mockResolvedValue([mockBookingFlight]);
      (prisma.disruptionEvent.findMany as jest.Mock).mockResolvedValue([]);

      await service.findMine('user1');

      expect(prisma.disruptionEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });

    it('returns empty array when user has no bookings', async () => {
      (prisma.bookingRecord.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.disruptionEvent.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findMine('user1');
      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('returns paginated events', async () => {
      (prisma.disruptionEvent.findMany as jest.Mock).mockResolvedValue([mockDisruptionEvent]);
      (prisma.disruptionEvent.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll(1, 20);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
