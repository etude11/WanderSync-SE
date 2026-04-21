import axios from 'axios';
import { WeatherAlertAdapter } from './weather-alert.adapter';
import { DisruptionType } from '@prisma/client';

jest.mock('axios');
const mockedGet = axios.get as jest.MockedFunction<typeof axios.get>;

const makeOWMResponse = (alerts: unknown[] = []) => ({
  data: { alerts },
});

describe('WeatherAlertAdapter', () => {
  let adapter: WeatherAlertAdapter;

  beforeEach(() => {
    adapter = new WeatherAlertAdapter('test-owm-key');
    jest.clearAllMocks();
  });

  it('returns empty array immediately when origins is empty', async () => {
    const result = await adapter.checkWeather([]);
    expect(result).toEqual([]);
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('skips unknown IATA codes with a warning (no axios call)', async () => {
    const result = await adapter.checkWeather(['XYZ']);
    expect(result).toEqual([]);
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('returns empty when OWM response has no alerts field', async () => {
    mockedGet.mockResolvedValue({ data: {} });
    const result = await adapter.checkWeather(['DEL']);
    expect(result).toEqual([]);
  });

  it('returns empty when OWM alerts array is empty', async () => {
    mockedGet.mockResolvedValue(makeOWMResponse([]));
    const result = await adapter.checkWeather(['DEL']);
    expect(result).toEqual([]);
  });

  it('maps extreme keyword to severity 4', async () => {
    mockedGet.mockResolvedValue(makeOWMResponse([{ event: 'Extreme Tornado Warning', description: 'danger', tags: [], sender_name: 'NWS', start: 0, end: 0 }]));
    const result = await adapter.checkWeather(['DEL']);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe(DisruptionType.WEATHER_ALERT);
    expect(result[0].severity).toBe(4);
    expect(result[0].affectedOrigin).toBe('DEL');
  });

  it('maps storm/warning keyword to severity 3', async () => {
    mockedGet.mockResolvedValue(makeOWMResponse([{ event: 'Severe Thunderstorm Warning', description: 'hail', tags: [], sender_name: 'NWS', start: 0, end: 0 }]));
    const result = await adapter.checkWeather(['BOM']);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe(3);
  });

  it('filters out alerts with severity < 3 (watch/advisory = 2)', async () => {
    mockedGet.mockResolvedValue(makeOWMResponse([{ event: 'Heat Advisory', description: 'hot', tags: [], sender_name: 'NWS', start: 0, end: 0 }]));
    const result = await adapter.checkWeather(['DEL']);
    expect(result).toEqual([]);
  });

  it('filters out alerts with severity 1 (unknown keywords)', async () => {
    mockedGet.mockResolvedValue(makeOWMResponse([{ event: 'Fog Notification', description: 'foggy', tags: [], sender_name: 'NWS', start: 0, end: 0 }]));
    const result = await adapter.checkWeather(['DEL']);
    expect(result).toEqual([]);
  });

  it('handles axios error gracefully (circuit fallback, returns empty)', async () => {
    mockedGet.mockRejectedValue(new Error('network error'));
    const result = await adapter.checkWeather(['DEL']);
    expect(result).toEqual([]);
  });
});
