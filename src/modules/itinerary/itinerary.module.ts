import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ItineraryService } from './itinerary.service';
import { ItineraryController } from './itinerary.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ItineraryController],
  providers: [ItineraryService],
  exports: [ItineraryService],
})
export class ItineraryModule {}
