import { DisruptionPublisherService } from './disruption-publisher.service';
import { DisruptionEventBus } from './disruption-event-bus.service';
import { DisruptionType } from '@prisma/client';

const makeEvent = (overrides: Partial<{ flightIata: string | null; affectedOrigin: string | null }> = {}) => ({
  id: 'evt-1',
  type: DisruptionType.FLIGHT_DELAY,
  severity: 2,
  description: 'Flight delayed 45 min',
  flightIata: 'AI101' as string | null,
  affectedOrigin: null as string | null,
  publishedAt: new Date('2026-06-01T10:00:00Z'),
  status: 'ACTIVE',
  resolvedAt: null,
  ...overrides,
});

describe('DisruptionPublisherService', () => {
  let service: DisruptionPublisherService;
  let eventBus: { emit: jest.Mock };

  beforeEach(() => {
    eventBus = { emit: jest.fn() };
    service = new DisruptionPublisherService(eventBus as unknown as DisruptionEventBus);
    jest.clearAllMocks();
  });

  it('emits event to the in-memory event bus', async () => {
    const event = makeEvent();
    await service.publish(event as any);
    expect(eventBus.emit).toHaveBeenCalledTimes(1);
    expect(eventBus.emit).toHaveBeenCalledWith(event);
  });

  it('emits correct event type', async () => {
    const event = makeEvent();
    await service.publish(event as any);
    const [emitted] = eventBus.emit.mock.calls[0];
    expect(emitted.type).toBe(DisruptionType.FLIGHT_DELAY);
    expect(emitted.id).toBe('evt-1');
  });

  it('emits event with null flightIata as-is', async () => {
    const event = makeEvent({ flightIata: null });
    await service.publish(event as any);
    const [emitted] = eventBus.emit.mock.calls[0];
    expect(emitted.flightIata).toBeNull();
  });

  it('emits event with null affectedOrigin as-is', async () => {
    const event = makeEvent({ affectedOrigin: null });
    await service.publish(event as any);
    const [emitted] = eventBus.emit.mock.calls[0];
    expect(emitted.affectedOrigin).toBeNull();
  });
});
