import { Injectable } from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import { DisruptionEvent } from '@prisma/client';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma.service';
import { DisruptionEventBus } from './disruption-event-bus.service';

@Injectable()
export class DisruptionStreamService {
  constructor(
    private readonly eventBus: DisruptionEventBus,
    private readonly prisma: PrismaService,
  ) {}

  async streamForUser(userId: string): Promise<Observable<MessageEvent>> {
    const bookings = await this.prisma.bookingRecord.findMany({
      where: { itinerary: { userId } },
      select: { providerRef: true, origin: true },
    });

    const flightRefs = new Set(bookings.map((b) => b.providerRef));
    const origins = new Set(bookings.map((b) => b.origin));

    return this.eventBus.events$.pipe(
      filter(
        (event: DisruptionEvent) =>
          (event.flightIata != null && flightRefs.has(event.flightIata)) ||
          (event.affectedOrigin != null && origins.has(event.affectedOrigin)),
      ),
      map(
        (event: DisruptionEvent): MessageEvent => ({
          id: event.id,
          data: {
            id:             event.id,
            type:           event.type,
            severity:       event.severity,
            description:    event.description,
            flightIata:     event.flightIata,
            affectedOrigin: event.affectedOrigin,
            status:         event.status,
            resolvedAt:     event.resolvedAt?.toISOString() ?? null,
            publishedAt:    event.publishedAt.toISOString(),
            isAcknowledged: false,
          },
        }),
      ),
    );
  }
}
