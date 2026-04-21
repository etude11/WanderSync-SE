import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DisruptionType } from '@prisma/client';
import axios from 'axios';
import CircuitBreaker from 'opossum';
import { DetectedDisruption } from './flight-tracker.adapter';
import { IATA_COORDINATES } from './iata-coordinates';

type OWMAlert = {
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
};

type OWMResponse = {
  alerts?: OWMAlert[];
};

@Injectable()
export class WeatherAlertAdapter {
  private readonly logger = new Logger(WeatherAlertAdapter.name);
  private readonly apiKey: string;
  private readonly breaker: CircuitBreaker<[number, number], OWMResponse | null>;
  private static readonly BASE = 'https://api.openweathermap.org/data/3.0/onecall';

  constructor(apiKeyOrConfig: string | ConfigService) {
    this.apiKey =
      typeof apiKeyOrConfig === 'string'
        ? apiKeyOrConfig
        : (apiKeyOrConfig.get<string>('openweathermap.apiKey') ?? '');

    this.breaker = new CircuitBreaker(this.doFetch.bind(this), {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
    });
    this.breaker.fallback(() => null);
    this.breaker.on('open', () =>
      this.logger.warn('WeatherAlertAdapter: circuit open'),
    );
  }

  async checkWeather(origins: string[]): Promise<DetectedDisruption[]> {
    if (origins.length === 0) return [];

    const disruptions: DetectedDisruption[] = [];

    await Promise.allSettled(
      origins.map(async (origin) => {
        const coords = IATA_COORDINATES[origin];
        if (!coords) {
          this.logger.warn(`WeatherAlertAdapter: unknown IATA code ${origin}`);
          return;
        }

        const response = await this.breaker.fire(coords.lat, coords.lon);
        if (!response) return;

        const alerts = response.alerts ?? [];
        for (const alert of alerts) {
          const severity = mapOWMSeverity(alert.event, alert.tags ?? []);
          if (severity >= 3) {
            disruptions.push({
              type: DisruptionType.WEATHER_ALERT,
              severity,
              description: alert.event,
              affectedOrigin: origin,
            });
          }
        }
      }),
    );

    return disruptions;
  }

  private async doFetch(lat: number, lon: number): Promise<OWMResponse | null> {
    const { data } = await axios.get<OWMResponse>(WeatherAlertAdapter.BASE, {
      params: {
        lat,
        lon,
        exclude: 'minutely,hourly,daily',
        appid: this.apiKey,
      },
      timeout: 5000,
    });
    return data;
  }
}

export function mapOWMSeverity(event: string, tags: string[]): number {
  const text = `${event} ${tags.join(' ')}`.toLowerCase();
  if (/extreme|tornado|hurricane|cyclone/.test(text)) return 4;
  if (/severe|warning|storm|flood|blizzard/.test(text)) return 3;
  if (/watch|advisory|moderate/.test(text)) return 2;
  return 1;
}
