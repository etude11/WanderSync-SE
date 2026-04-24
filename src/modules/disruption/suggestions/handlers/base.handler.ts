import { DisruptionEvent, BookingRecord } from '@prisma/client';

export interface SuggestionContext {
  event: DisruptionEvent;
  booking: BookingRecord | null;
}

export interface SuggestionHandler {
  setNext(handler: SuggestionHandler): SuggestionHandler;
  handle(ctx: SuggestionContext): Promise<string[]>;
}

export abstract class BaseSuggestionHandler implements SuggestionHandler {
  private nextHandler: SuggestionHandler | null = null;

  public setNext(handler: SuggestionHandler): SuggestionHandler {
    this.nextHandler = handler;
    return handler;
  }

  public async handle(ctx: SuggestionContext): Promise<string[]> {
    if (this.nextHandler) {
      return this.nextHandler.handle(ctx);
    }
    return [];
  }
}
