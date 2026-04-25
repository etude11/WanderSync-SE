import { Injectable } from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import { DisruptionEvent } from '@prisma/client';
import { merge, Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma.service';
import { DisruptionEventBus } from './disruption-event-bus.service';

@Injectable()
export class DisruptionStreamService {
  private readonly directSubjects = new Map<string, Subject<DisruptionEvent>>();

  constructor(
    private readonly eventBus: DisruptionEventBus,
    private readonly prisma: PrismaService,
  ) {}

  private getOrCreateDirectSubject(userId: string): Subject<DisruptionEvent> {
    if (!this.directSubjects.has(userId)) {
      this.directSubjects.set(userId, new Subject<DisruptionEvent>());
    }
    return this.directSubjects.get(userId)!;
  }

  pushDirectlyToUser(userId: string, event: DisruptionEvent): void {
    this.getOrCreateDirectSubject(userId).next(event);
  }

  async streamForUser(userId: string): Promise<Observable<MessageEvent>> {
    const bookings = await this.prisma.bookingRecord.findMany({
      where: { itinerary: { userId } },
      select: { providerRef: true, origin: true },
    });

    const flightRefs = new Set(bookings.map((b) => b.providerRef));
    const origins = new Set(bookings.map((b) => b.origin));

    const toMessageEvent = (event: DisruptionEvent): MessageEvent => ({
      id: event.id,
      data: JSON.stringify({
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
      }),
    });

    const filtered$ = this.eventBus.events$.pipe(
      filter(
        (event: DisruptionEvent) =>
          (event.flightIata != null && flightRefs.has(event.flightIata)) ||
          (event.affectedOrigin != null && origins.has(event.affectedOrigin)),
      ),
      map(toMessageEvent),
    );

    const direct$ = this.getOrCreateDirectSubject(userId).pipe(
      map(toMessageEvent),
    );

    return merge(filtered$, direct$);
  }
}
