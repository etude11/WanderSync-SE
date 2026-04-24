import { Injectable } from '@nestjs/common';
import { RuleBasedHandler } from './handlers/rule-based.handler';
import { LLMHandler } from './handlers/llm.handler';
import { FallbackHandler } from './handlers/fallback.handler';
import { SuggestionContext } from './handlers/base.handler';

@Injectable()
export class DisruptionSuggestionsService {
  constructor(
    private readonly ruleBased: RuleBasedHandler,
    private readonly llm: LLMHandler,
    private readonly fallback: FallbackHandler,
  ) {
    this.ruleBased.setNext(this.llm).setNext(this.fallback);
  }

  async suggest(ctx: SuggestionContext): Promise<string[]> {
    return this.ruleBased.handle(ctx);
  }
}
