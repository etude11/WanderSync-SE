import { Injectable } from '@nestjs/common';
import { DisruptionEvent } from '@prisma/client';
import { RedisService } from '../../database/redis.service';

@Injectable()
export class DisruptionPublisherService {
  private static readonly STREAM_KEY = 'disruption-events';

  constructor(private readonly redis: RedisService) {}

  async publish(event: DisruptionEvent): Promise<void> {
    await this.redis.client.xadd(
      DisruptionPublisherService.STREAM_KEY,
      '*',
      'eventId', event.id,
      'type', event.type,
      'severity', String(event.severity),
      'description', event.description,
      'flightIata', event.flightIata ?? '',
      'affectedOrigin', event.affectedOrigin ?? '',
      'publishedAt', event.publishedAt.toISOString(),
    );
  }
}
