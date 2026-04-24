import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { BaseSuggestionHandler } from './base.handler';
import { SuggestionContext } from './base.handler';

@Injectable()
export class LLMHandler extends BaseSuggestionHandler {
  private readonly logger = new Logger(LLMHandler.name);
  private readonly client: Anthropic;

  constructor(private readonly config: ConfigService) {
    super();
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY') || process.env.ANTHROPIC_API_KEY || 'empty',
    });
  }

  public async handle(ctx: SuggestionContext): Promise<string[]> {
    try {
      if (this.client.apiKey === 'empty') {
        this.logger.warn('No Anthropic API Key found, skipping LLM handler');
        return super.handle(ctx);
      }
      
      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        system: "You are a travel assistant for WanderSync. Provide exactly 3 short, actionable suggestions for a disrupted traveler in a JSON array format like { \"suggestions\": [\"sug1\", \"sug2\", \"sug3\"] }. Do not include any other text.",
        messages: [{
          role: 'user',
          content: `Disruption: ${ctx.event.type}, Severity: ${ctx.event.severity}, Description: ${ctx.event.description}, Flight: ${ctx.event.flightIata}, Origin: ${ctx.event.affectedOrigin}`
        }]
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(text);
      if (parsed.suggestions && Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
        return parsed.suggestions;
      }
    } catch (e) {
      this.logger.error(`LLM Handler failed: ${(e as Error).message}`);
    }

    return super.handle(ctx);
  }
}
