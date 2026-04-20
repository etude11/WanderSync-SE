import { Injectable } from '@nestjs/common';
import { BookingType } from '@prisma/client';
import { IBookingStrategy, NormalizedBooking } from './booking-strategy.interface';

@Injectable()
export class HotelBookingStrategy implements IBookingStrategy {
  readonly providerKey = 'hotel-stub';
  readonly bookingType = BookingType.HOTEL;

  async fetchAndNormalize(_refs: string[]): Promise<NormalizedBooking[]> {
    return [];
  }
}
