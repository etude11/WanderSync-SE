import { Injectable } from '@nestjs/common';
import { DisruptionEvent } from '@prisma/client';
import { RedisService } from '../../database/redis.service';
import { DisruptionEventBus } from './disruption-event-bus.service';

@Injectable()
export class DisruptionPublisherService {
  private static readonly STREAM_KEY = 'disruption-events';

  constructor(
    private readonly redis: RedisService,
    private readonly eventBus: DisruptionEventBus,
  ) {}

  async publish(event: DisruptionEvent): Promise<void> {
    await this.redis.client.xadd(
      DisruptionPublisherService.STREAM_KEY,
      '*',
      'eventId',        event.id,
      'type',           event.type,
      'severity',       String(event.severity),
      'description',    event.description,
      'flightIata',     event.flightIata ?? '',
      'affectedOrigin', event.affectedOrigin ?? '',
      'status',         event.status,
      'resolvedAt',     event.resolvedAt?.toISOString() ?? '',
      'publishedAt',    event.publishedAt.toISOString(),
    );
    this.eventBus.emit(event);
  }
}
