import axios from 'axios';
import { AviationstackFlightStrategy } from './aviationstack-flight.strategy';
import { BookingType } from '@prisma/client';

jest.mock('axios');
const mockedGet = axios.get as jest.MockedFunction<typeof axios.get>;

describe('AviationstackFlightStrategy', () => {
  let strategy: AviationstackFlightStrategy;

  beforeEach(() => {
    strategy = new AviationstackFlightStrategy('test-api-key');
    jest.clearAllMocks();
  });

  it('has providerKey "aviationstack" and bookingType FLIGHT', () => {
    expect(strategy.providerKey).toBe('aviationstack');
    expect(strategy.bookingType).toBe(BookingType.FLIGHT);
  });

  it('returns empty array when refs list is empty', async () => {
    const result = await strategy.fetchAndNormalize([]);
    expect(result).toEqual([]);
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('normalises a successful flight response', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: [{
          flight: { iata: 'AI101' },
          flight_status: 'active',
          departure: {
            scheduled: '2026-05-01T10:00:00+00:00',
            iata: 'DEL',
            delay: null,
          },
          arrival: {
            scheduled: '2026-05-01T12:00:00+00:00',
            iata: 'BOM',
          },
        }],
      },
    });

    const result = await strategy.fetchAndNormalize(['AI101']);
    expect(result).toHaveLength(1);
    expect(result[0].providerRef).toBe('AI101');
    expect(result[0].origin).toBe('DEL');
    expect(result[0].destination).toBe('BOM');
    expect(result[0].type).toBe(BookingType.FLIGHT);
    expect(result[0].departureTime).toEqual(new Date('2026-05-01T10:00:00+00:00'));
    expect(result[0].arrivalTime).toEqual(new Date('2026-05-01T12:00:00+00:00'));
    expect(result[0].rawData).toMatchObject({ flight_status: 'active' });
  });

  it('skips refs where API returns no data', async () => {
    mockedGet.mockResolvedValueOnce({ data: { data: [] } });
    const result = await strategy.fetchAndNormalize(['ZZ999']);
    expect(result).toEqual([]);
  });

  it('returns results for good refs even when one ref rejects', async () => {
    mockedGet
      .mockRejectedValueOnce(new Error('network timeout'))
      .mockResolvedValueOnce({
        data: {
          data: [{
            flight: { iata: 'AI101' },
            flight_status: 'active',
            departure: { scheduled: '2026-05-01T10:00:00+00:00', iata: 'DEL', delay: null },
            arrival: { scheduled: '2026-05-01T12:00:00+00:00', iata: 'BOM' },
          }],
        },
      });

    const result = await strategy.fetchAndNormalize(['BAD_REF', 'AI101']);
    expect(result).toHaveLength(1);
    expect(result[0].providerRef).toBe('AI101');
  });
});
