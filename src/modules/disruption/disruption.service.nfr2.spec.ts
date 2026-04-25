import { DisruptionType } from '@prisma/client';
import { DisruptionService } from './disruption.service';
import { FlightTrackerAdapter } from './adapters/flight-tracker.adapter';
import { WeatherAlertAdapter } from './adapters/weather-alert.adapter';
import { DisruptionPublisherService } from './disruption-publisher.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';

const makeSimulatePayloads = () => [
  { type: DisruptionType.FLIGHT_DELAY, severity: 2, description: 'AI101 delayed', flightIata: 'AI101' },
  { type: DisruptionType.FLIGHT_CANCELLATION, severity: 4, description: 'AI102 cancelled', flightIata: 'AI102' },
  { type: DisruptionType.FLIGHT_DIVERSION, severity: 3, description: 'AI103 diverted', flightIata: 'AI103' },
  { type: DisruptionType.WEATHER_ALERT, severity: 4, description: 'Tornado Warning DEL', affectedOrigin: 'DEL' },
  { type: DisruptionType.WEATHER_ALERT, severity: 3, description: 'Flood Warning BOM', affectedOrigin: 'BOM' },
  { type: DisruptionType.FLIGHT_DELAY, severity: 2, description: '6E201 delayed', flightIata: '6E201' },
  { type: DisruptionType.FLIGHT_CANCELLATION, severity: 4, description: 'UK802 cancelled', flightIata: 'UK802' },
  { type: DisruptionType.WEATHER_ALERT, severity: 3, description: 'Severe Storm BLR', affectedOrigin: 'BLR' },
  { type: DisruptionType.FLIGHT_DELAY, severity: 2, description: 'SG101 delayed', flightIata: 'SG101' },
  { type: DisruptionType.FLIGHT_DIVERSION, severity: 3, description: 'IX456 diverted', flightIata: 'IX456' },
  { type: DisruptionType.WEATHER_ALERT, severity: 4, description: 'Hurricane Warning LHR', affectedOrigin: 'LHR' },
  { type: DisruptionType.FLIGHT_CANCELLATION, severity: 4, description: 'EK501 cancelled', flightIata: 'EK501' },
  { type: DisruptionType.FLIGHT_DELAY, severity: 2, description: 'BA117 delayed', flightIata: 'BA117' },
  { type: DisruptionType.WEATHER_ALERT, severity: 3, description: 'Blizzard Warning JFK', affectedOrigin: 'JFK' },
  { type: DisruptionType.FLIGHT_DIVERSION, severity: 3, description: 'QR571 diverted', flightIata: 'QR571' },
  { type: DisruptionType.FLIGHT_CANCELLATION, severity: 4, description: 'SQ321 incident', flightIata: 'SQ321' },
  { type: DisruptionType.WEATHER_ALERT, severity: 4, description: 'Extreme Cold LAX', affectedOrigin: 'LAX' },
  { type: DisruptionType.FLIGHT_DELAY, severity: 2, description: 'AA100 delayed', flightIata: 'AA100' },
  { type: DisruptionType.FLIGHT_CANCELLATION, severity: 4, description: 'LH400 cancelled', flightIata: 'LH400' },
  { type: DisruptionType.WEATHER_ALERT, severity: 3, description: 'Cyclone Warning SIN', affectedOrigin: 'SIN' },
];

describe('DisruptionService — NFR2: simulate test harness', () => {
  let service: DisruptionService;
  let createMock: jest.Mock;
  let publishMock: jest.Mock;

  beforeEach(() => {
    createMock = jest.fn().mockImplementation((args: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: Math.random().toString(), publishedAt: new Date(), ...args.data }),
    );
    publishMock = jest.fn().mockResolvedValue(undefined);

    const prisma = {
      bookingRecord: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn() },
      disruptionEvent: { create: createMock, findMany: jest.fn(), count: jest.fn() },
    } as unknown as PrismaService;

    const redis = { client: { get: jest.fn(), set: jest.fn() } } as unknown as RedisService;
    const flightAdapter = { checkFlights: jest.fn().mockResolvedValue([]) } as unknown as FlightTrackerAdapter;
    const weatherAdapter = { checkWeather: jest.fn().mockResolvedValue([]) } as unknown as WeatherAlertAdapter;
    const publisher = { publish: publishMock } as unknown as DisruptionPublisherService;
    const suggestionsService = { getSuggestions: jest.fn().mockResolvedValue([]) } as never;
    const streamService = { pushDirectlyToUser: jest.fn() } as never;

    service = new DisruptionService(prisma, redis, flightAdapter, weatherAdapter, publisher, suggestionsService, streamService);
  });

  it('NFR2: all 20 simulate calls produce a DisruptionEvent and publish to stream', async () => {
    const payloads = makeSimulatePayloads();
    expect(payloads).toHaveLength(20);

    for (const payload of payloads) {
      await service.simulateDisruption(payload);
    }

    expect(createMock).toHaveBeenCalledTimes(20);
    expect(publishMock).toHaveBeenCalledTimes(20);
  });

  it('NFR2: accuracy threshold — at least 17/20 simulated events succeed (85%)', async () => {
    const payloads = makeSimulatePayloads();
    let successCount = 0;

    for (const payload of payloads) {
      try {
        await service.simulateDisruption(payload);
        successCount++;
      } catch {
        // count failure
      }
    }

    expect(successCount).toBeGreaterThanOrEqual(17);
  });
});
