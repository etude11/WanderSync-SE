import { Injectable } from '@nestjs/common';
import { DisruptionEvent } from '@prisma/client';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class DisruptionEventBus {
  private readonly subject = new Subject<DisruptionEvent>();

  readonly events$: Observable<DisruptionEvent> = this.subject.asObservable();

  emit(event: DisruptionEvent): void {
    this.subject.next(event);
  }
}
