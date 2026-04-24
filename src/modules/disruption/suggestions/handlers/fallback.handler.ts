import { Injectable } from '@nestjs/common';
import { BaseSuggestionHandler } from './base.handler';
import { SuggestionContext } from './base.handler';

@Injectable()
export class FallbackHandler extends BaseSuggestionHandler {
  public async handle(ctx: SuggestionContext): Promise<string[]> {
    return [
      "Check airline website",
      "Contact your travel agent",
      "Review your travel insurance policy"
    ];
  }
}
