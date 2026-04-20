import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingType } from '@prisma/client';
import axios from 'axios';
import { IBookingStrategy, NormalizedBooking } from './booking-strategy.interface';

type AviationStackFlight = {
  flight: { iata: string };
  flight_status: string;
  departure: { scheduled: string; iata: string; delay: number | null };
  arrival: { scheduled: string; iata: string };
};

@Injectable()
export class AviationstackFlightStrategy implements IBookingStrategy {
  readonly providerKey = 'aviationstack';
  readonly bookingType = BookingType.FLIGHT;

  private readonly apiKey: string;
  private static readonly BASE = 'http://api.aviationstack.com/v1/flights';

  constructor(apiKeyOrConfig: string | ConfigService) {
    this.apiKey =
      typeof apiKeyOrConfig === 'string'
        ? apiKeyOrConfig
        : (apiKeyOrConfig.get<string>('aviationstack.apiKey') ?? '');
  }

  async fetchAndNormalize(refs: string[]): Promise<NormalizedBooking[]> {
    if (refs.length === 0) return [];

    const results = await Promise.allSettled(refs.map((iata) => this.fetchOne(iata)));
    return results
      .filter((r): r is PromiseFulfilledResult<NormalizedBooking | null> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((v): v is NormalizedBooking => v !== null);
  }

  private async fetchOne(iata: string): Promise<NormalizedBooking | null> {
    const { data } = await axios.get<{ data: AviationStackFlight[] }>(
      AviationstackFlightStrategy.BASE,
      { params: { access_key: this.apiKey, flight_iata: iata } },
    );

    const flight = data.data?.[0];
    if (!flight) return null;

    return {
      providerRef: iata,
      type: BookingType.FLIGHT,
      departureTime: new Date(flight.departure.scheduled),
      arrivalTime: new Date(flight.arrival.scheduled),
      origin: flight.departure.iata,
      destination: flight.arrival.iata,
      rawData: flight as unknown as Record<string, unknown>,
    };
  }
}
