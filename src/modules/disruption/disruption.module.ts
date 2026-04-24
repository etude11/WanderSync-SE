import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FlightTrackerAdapter } from './adapters/flight-tracker.adapter';
import { WeatherAlertAdapter } from './adapters/weather-alert.adapter';
import { DisruptionPublisherService } from './disruption-publisher.service';
import { DisruptionService } from './disruption.service';
import { DisruptionController } from './disruption.controller';
import { DisruptionSuggestionsService } from './suggestions/disruption-suggestions.service';
import { RuleBasedHandler } from './suggestions/handlers/rule-based.handler';
import { LLMHandler } from './suggestions/handlers/llm.handler';
import { FallbackHandler } from './suggestions/handlers/fallback.handler';
import { DisruptionEventBus } from './disruption-event-bus.service';
import { DisruptionStreamService } from './disruption-stream.service';

@Module({
  imports: [ConfigModule],
  controllers: [DisruptionController],
  providers: [
    {
      provide: FlightTrackerAdapter,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new FlightTrackerAdapter(config),
    },
    {
      provide: WeatherAlertAdapter,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new WeatherAlertAdapter(config),
    },
    DisruptionPublisherService,
    DisruptionService,
    DisruptionEventBus,
    DisruptionStreamService,
    RuleBasedHandler,
    LLMHandler,
    FallbackHandler,
    DisruptionSuggestionsService,
  ],
  exports: [DisruptionService],
})
export class DisruptionModule {}
