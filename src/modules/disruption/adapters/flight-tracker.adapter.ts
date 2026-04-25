import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DisruptionType } from '@prisma/client';
import axios from 'axios';
import CircuitBreaker from 'opossum';

type AviationStackFlight = {
  flight: { iata: string };
  flight_status: string;
  departure: { scheduled: string; iata: string; delay: number | null };
  arrival: { scheduled: string; iata: string };
};

export type DetectedDisruption = {
  type: DisruptionType;
  severity: number;
  description: string;
  flightIata?: string;
  affectedOrigin?: string;
};

@Injectable()
export class FlightTrackerAdapter {
  private readonly logger = new Logger(FlightTrackerAdapter.name);
  private readonly apiKey: string;
  private readonly base: string;
  private readonly breaker: CircuitBreaker<[string], AviationStackFlight | null>;

  constructor(apiKeyOrConfig: string | ConfigService) {
    if (typeof apiKeyOrConfig === 'string') {
      this.apiKey = apiKeyOrConfig;
      this.base = 'http://api.aviationstack.com/v1/flights';
    } else {
      this.apiKey = apiKeyOrConfig.get<string>('aviationstack.apiKey') ?? '';
      this.base = apiKeyOrConfig.get<string>('aviationstack.baseUrl') ?? 'http://api.aviationstack.com/v1/flights';
    }

    this.breaker = new CircuitBreaker(this.doFetch.bind(this), {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
    });
    this.breaker.fallback(() => null);
    this.breaker.on('open', () =>
      this.logger.warn('FlightTrackerAdapter: circuit open'),
    );
  }

  async checkFlights(refs: string[]): Promise<DetectedDisruption[]> {
    if (refs.length === 0) return [];

    const results = await Promise.allSettled(
      refs.map((iata) => this.breaker.fire(iata)),
    );

    const disruptions: DetectedDisruption[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'rejected' || r.value === null) continue;
      const d = this.classify(refs[i], r.value);
      if (d) disruptions.push(d);
    }
    return disruptions;
  }

  private classify(iata: string, f: AviationStackFlight): DetectedDisruption | null {
    if (f.flight_status === 'cancelled' || f.flight_status === 'incident') {
      return {
        type: DisruptionType.FLIGHT_CANCELLATION,
        severity: 4,
        description: `Flight ${iata} ${f.flight_status}`,
        flightIata: iata,
      };
    }
    if (f.flight_status === 'diverted') {
      return {
        type: DisruptionType.FLIGHT_DIVERSION,
        severity: 3,
        description: `Flight ${iata} diverted`,
        flightIata: iata,
      };
    }
    if (f.departure.delay !== null && f.departure.delay > 30) {
      return {
        type: DisruptionType.FLIGHT_DELAY,
        severity: 2,
        description: `Flight ${iata} delayed ${f.departure.delay} min`,
        flightIata: iata,
      };
    }
    return null;
  }

  private async doFetch(iata: string): Promise<AviationStackFlight | null> {
    const { data } = await axios.get<{ data: AviationStackFlight[] }>(
      this.base,
      { params: { access_key: this.apiKey, flight_iata: iata }, timeout: 5000 },
    );
    return data.data?.[0] ?? null;
  }
}
