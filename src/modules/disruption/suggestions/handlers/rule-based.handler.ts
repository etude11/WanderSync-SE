import { Injectable } from '@nestjs/common';
import { DisruptionType } from '@prisma/client';
import { BaseSuggestionHandler } from './base.handler';
import { SuggestionContext } from './base.handler';

@Injectable()
export class RuleBasedHandler extends BaseSuggestionHandler {
  public async handle(ctx: SuggestionContext): Promise<string[]> {
    const { event, booking } = ctx;
    const suggestions: string[] = [];
    const airline = booking?.providerRef?.substring(0, 2) || 'your airline';
    const origin = booking?.origin || event.affectedOrigin || 'your origin';

    if (event.type === DisruptionType.FLIGHT_CANCELLATION) {
      if (event.severity === 4) {
        suggestions.push(`Request full refund from ${airline}`);
        suggestions.push(`Search alternative routes from ${origin}`);
        suggestions.push(`File travel insurance claim`);
      } else if (event.severity === 3) {
        suggestions.push(`Contact ${airline} for rebooking on next available flight`);
        suggestions.push(`Check for partner airline options`);
      }
    } else if (event.type === DisruptionType.FLIGHT_DELAY) {
      if (event.severity === 2) {
        suggestions.push(`Monitor ${event.flightIata || 'flight'} status updates`);
        suggestions.push(`Notify hotel/transfers about delay`);
      } else if (event.severity >= 3) {
        suggestions.push(`Request meal voucher if delay exceeds 3 hours (EU261 rights)`);
        suggestions.push(`Contact ${airline} for accommodation if overnight`);
      }
    } else if (event.type === DisruptionType.WEATHER_ALERT) {
      if (event.severity === 3) {
        suggestions.push(`Check if ${airline} offers free rebooking for weather events`);
        suggestions.push(`Contact accommodation in ${origin} for flexibility`);
      } else if (event.severity === 4) {
        suggestions.push(`Consider postponing travel from ${origin}`);
        suggestions.push(`Contact all ground transport providers`);
      }
    }

    if (suggestions.length >= 2) {
      return suggestions;
    }

    return super.handle(ctx);
  }
}
