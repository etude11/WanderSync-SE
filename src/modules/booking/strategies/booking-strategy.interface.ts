import { BookingType } from '@prisma/client';

export type NormalizedBooking = {
  providerRef: string;
  type: BookingType;
  departureTime: Date;
  arrivalTime: Date;
  origin: string;
  destination: string;
  rawData: Record<string, unknown>;
};

export interface IBookingStrategy {
  readonly providerKey: string;
  readonly bookingType: BookingType;
  fetchAndNormalize(refs: string[]): Promise<NormalizedBooking[]>;
}
