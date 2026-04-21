import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FlightTrackerAdapter } from './adapters/flight-tracker.adapter';
import { WeatherAlertAdapter } from './adapters/weather-alert.adapter';
import { DisruptionPublisherService } from './disruption-publisher.service';
import { DisruptionService } from './disruption.service';
import { DisruptionController } from './disruption.controller';

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
  ],
  exports: [DisruptionService],
})
export class DisruptionModule {}
