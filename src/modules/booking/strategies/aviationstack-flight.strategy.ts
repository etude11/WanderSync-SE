import { Injectable, Logger } from '@nestjs/common';
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

  private readonly logger = new Logger(AviationstackFlightStrategy.name);
  private readonly apiKey: string;
  private readonly base: string;

  constructor(apiKeyOrConfig: string | ConfigService) {
    if (typeof apiKeyOrConfig === 'string') {
      this.apiKey = apiKeyOrConfig;
      this.base = 'http://api.aviationstack.com/v1/flights';
    } else {
      this.apiKey = apiKeyOrConfig.get<string>('aviationstack.apiKey') ?? '';
      this.base = apiKeyOrConfig.get<string>('aviationstack.baseUrl') ?? 'http://api.aviationstack.com/v1/flights';
    }
  }

  async fetchAndNormalize(refs: string[]): Promise<NormalizedBooking[]> {
    if (refs.length === 0) return [];

    const results = await Promise.allSettled(refs.map((iata) => this.fetchOne(iata)));
    results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .forEach((r) => this.logger.warn(`AviationStack fetch failed: ${String(r.reason)}`));
    return results
      .filter((r): r is PromiseFulfilledResult<NormalizedBooking | null> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((v): v is NormalizedBooking => v !== null);
  }

  private async fetchOne(iata: string): Promise<NormalizedBooking | null> {
    const { data } = await axios.get<{ data: AviationStackFlight[] }>(
      this.base,
      { params: { access_key: this.apiKey, flight_iata: iata }, timeout: 5000 },
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
