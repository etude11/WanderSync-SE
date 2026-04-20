import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProviderRegistryService } from './provider-registry.service';
import { AviationstackFlightStrategy } from './strategies/aviationstack-flight.strategy';
import { HotelBookingStrategy } from './strategies/hotel-booking.strategy';
import { TransportBookingStrategy } from './strategies/transport-booking.strategy';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';

@Module({
  imports: [ConfigModule],
  controllers: [BookingController],
  providers: [
    ProviderRegistryService,
    {
      provide: AviationstackFlightStrategy,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new AviationstackFlightStrategy(config),
    },
    HotelBookingStrategy,
    TransportBookingStrategy,
    BookingService,
    {
      provide: 'BOOKING_STRATEGY_REGISTRATION',
      inject: [
        ProviderRegistryService,
        AviationstackFlightStrategy,
        HotelBookingStrategy,
        TransportBookingStrategy,
      ],
      useFactory: (
        registry: ProviderRegistryService,
        flight: AviationstackFlightStrategy,
        hotel: HotelBookingStrategy,
        transport: TransportBookingStrategy,
      ) => {
        registry.register(flight);
        registry.register(hotel);
        registry.register(transport);
      },
    },
  ],
  exports: [BookingService],
})
export class BookingModule {}
