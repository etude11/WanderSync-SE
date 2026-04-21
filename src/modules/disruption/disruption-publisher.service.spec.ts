import { DisruptionPublisherService } from './disruption-publisher.service';
import { RedisService } from '../../database/redis.service';
import { DisruptionType } from '@prisma/client';

const makeEvent = (overrides: Partial<{ flightIata: string | null; affectedOrigin: string | null }> = {}) => ({
  id: 'evt-1',
  type: DisruptionType.FLIGHT_DELAY,
  severity: 2,
  description: 'Flight delayed 45 min',
  flightIata: 'AI101' as string | null,
  affectedOrigin: null as string | null,
  publishedAt: new Date('2026-06-01T10:00:00Z'),
  ...overrides,
});

describe('DisruptionPublisherService', () => {
  let service: DisruptionPublisherService;
  let redis: { client: { xadd: jest.Mock } };

  beforeEach(() => {
    redis = { client: { xadd: jest.fn().mockResolvedValue('1234-0') } };
    service = new DisruptionPublisherService(redis as unknown as RedisService);
    jest.clearAllMocks();
  });

  it('calls xadd with the correct stream key', async () => {
    await service.publish(makeEvent());
    expect(redis.client.xadd).toHaveBeenCalledTimes(1);
    const [streamKey, id] = (redis.client.xadd as jest.Mock).mock.calls[0] as string[];
    expect(streamKey).toBe('disruption-events');
    expect(id).toBe('*');
  });

  it('serializes all fields as strings', async () => {
    await service.publish(makeEvent());
    const args: string[] = (redis.client.xadd as jest.Mock).mock.calls[0];
    const fields: Record<string, string> = {};
    for (let i = 2; i < args.length; i += 2) {
      fields[args[i]] = args[i + 1];
    }
    expect(typeof fields['severity']).toBe('string');
    expect(fields['severity']).toBe('2');
    expect(fields['eventId']).toBe('evt-1');
    expect(fields['type']).toBe(DisruptionType.FLIGHT_DELAY);
  });

  it('serializes null flightIata as empty string', async () => {
    await service.publish(makeEvent({ flightIata: null }));
    const args: string[] = (redis.client.xadd as jest.Mock).mock.calls[0];
    const fields: Record<string, string> = {};
    for (let i = 2; i < args.length; i += 2) fields[args[i]] = args[i + 1];
    expect(fields['flightIata']).toBe('');
  });

  it('serializes null affectedOrigin as empty string', async () => {
    await service.publish(makeEvent({ affectedOrigin: null }));
    const args: string[] = (redis.client.xadd as jest.Mock).mock.calls[0];
    const fields: Record<string, string> = {};
    for (let i = 2; i < args.length; i += 2) fields[args[i]] = args[i + 1];
    expect(fields['affectedOrigin']).toBe('');
  });

  it('serializes publishedAt as ISO string', async () => {
    const event = makeEvent();
    await service.publish(event);
    const args: string[] = (redis.client.xadd as jest.Mock).mock.calls[0];
    const fields: Record<string, string> = {};
    for (let i = 2; i < args.length; i += 2) fields[args[i]] = args[i + 1];
    expect(fields['publishedAt']).toBe(event.publishedAt.toISOString());
  });
});
