import { Injectable } from '@nestjs/common';
import { BookingType } from '@prisma/client';
import { IBookingStrategy, NormalizedBooking } from './booking-strategy.interface';

@Injectable()
export class TransportBookingStrategy implements IBookingStrategy {
  readonly providerKey = 'transport-stub';
  readonly bookingType = BookingType.TRANSPORT;

  async fetchAndNormalize(_refs: string[]): Promise<NormalizedBooking[]> {
    return [];
  }
}
