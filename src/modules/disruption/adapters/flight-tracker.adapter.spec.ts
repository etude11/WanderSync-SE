import axios from 'axios';
import { FlightTrackerAdapter } from './flight-tracker.adapter';
import { DisruptionType } from '@prisma/client';

jest.mock('axios');
const mockedGet = axios.get as jest.MockedFunction<typeof axios.get>;

const makeFlightResponse = (overrides: Record<string, unknown> = {}) => ({
  data: {
    data: [{
      flight: { iata: 'AI101' },
      flight_status: 'active',
      departure: { scheduled: '2026-06-01T10:00:00+00:00', iata: 'DEL', delay: null },
      arrival: { scheduled: '2026-06-01T12:00:00+00:00', iata: 'BOM' },
      ...overrides,
    }],
  },
});

describe('FlightTrackerAdapter', () => {
  let adapter: FlightTrackerAdapter;

  beforeEach(() => {
    adapter = new FlightTrackerAdapter('test-key');
    jest.clearAllMocks();
  });

  it('returns empty array immediately when refs is empty', async () => {
    const result = await adapter.checkFlights([]);
    expect(result).toEqual([]);
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('returns empty when flight is active with no delay', async () => {
    mockedGet.mockResolvedValue(makeFlightResponse());
    const result = await adapter.checkFlights(['AI101']);
    expect(result).toEqual([]);
  });

  it('detects FLIGHT_DELAY when departure.delay > 30', async () => {
    mockedGet.mockResolvedValue(makeFlightResponse({ departure: { scheduled: '2026-06-01T10:00:00+00:00', iata: 'DEL', delay: 45 } }));
    const result = await adapter.checkFlights(['AI101']);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(DisruptionType.FLIGHT_DELAY);
    expect(result[0].severity).toBe(2);
    expect(result[0].flightIata).toBe('AI101');
  });

  it('does NOT detect delay when departure.delay === 30 (boundary)', async () => {
    mockedGet.mockResolvedValue(makeFlightResponse({ departure: { scheduled: '2026-06-01T10:00:00+00:00', iata: 'DEL', delay: 30 } }));
    const result = await adapter.checkFlights(['AI101']);
    expect(result).toEqual([]);
  });

  it('detects FLIGHT_CANCELLATION when flight_status is cancelled', async () => {
    mockedGet.mockResolvedValue(makeFlightResponse({ flight_status: 'cancelled' }));
    const result = await adapter.checkFlights(['AI101']);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(DisruptionType.FLIGHT_CANCELLATION);
    expect(result[0].severity).toBe(4);
  });

  it('detects FLIGHT_CANCELLATION when flight_status is incident', async () => {
    mockedGet.mockResolvedValue(makeFlightResponse({ flight_status: 'incident' }));
    const result = await adapter.checkFlights(['AI101']);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(DisruptionType.FLIGHT_CANCELLATION);
    expect(result[0].severity).toBe(4);
  });

  it('detects FLIGHT_DIVERSION when flight_status is diverted', async () => {
    mockedGet.mockResolvedValue(makeFlightResponse({ flight_status: 'diverted' }));
    const result = await adapter.checkFlights(['AI101']);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(DisruptionType.FLIGHT_DIVERSION);
    expect(result[0].severity).toBe(3);
  });

  it('returns empty when API returns no data for a ref', async () => {
    mockedGet.mockResolvedValue({ data: { data: [] } });
    const result = await adapter.checkFlights(['ZZ999']);
    expect(result).toEqual([]);
  });

  it('returns partial results when one ref throws (allSettled)', async () => {
    mockedGet
      .mockResolvedValueOnce(makeFlightResponse({ flight_status: 'cancelled' }))
      .mockRejectedValueOnce(new Error('network error'));
    const result = await adapter.checkFlights(['AI101', 'XX999']);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(DisruptionType.FLIGHT_CANCELLATION);
  });
});
