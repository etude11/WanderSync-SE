import { Injectable } from '@nestjs/common';
import { DisruptionEvent } from '@prisma/client';
import { DisruptionEventBus } from './disruption-event-bus.service';

@Injectable()
export class DisruptionPublisherService {
  constructor(
    private readonly eventBus: DisruptionEventBus,
  ) {}

  async publish(event: DisruptionEvent): Promise<void> {
    // Redis Streams (xadd) not used — in-memory EventBus drives SSE directly
    this.eventBus.emit(event);
  }
}
