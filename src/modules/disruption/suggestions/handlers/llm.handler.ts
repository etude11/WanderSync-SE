import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import axios from 'axios';
import { BaseSuggestionHandler, SuggestionContext } from './base.handler';

type AltFlight = {
  iata: string;
  airline: string;
  departure: string;   // ISO
  arrival: string;     // ISO
  status: string;
  delay: number | null;
};

@Injectable()
export class LLMHandler extends BaseSuggestionHandler {
  private readonly logger = new Logger(LLMHandler.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  // ── Fetch alternative flights from the mock microservice ─────────────────
  private async fetchAlternatives(origin: string, destination: string, excludeIata: string): Promise<AltFlight[]> {
    const base = this.config.get<string>('mockApi.baseUrl') ?? 'http://localhost:3002';
    try {
      const { data } = await axios.get<{ data: unknown[] }>(`${base}/v1/flights/search`, {
        params: { origin, destination, exclude_iata: excludeIata },
        timeout: 3000,
      });
      return (data.data ?? []).map((f: any) => ({
        iata:      f.flight?.iata ?? '',
        airline:   f.flight?.airline?.name ?? 'Unknown',
        departure: f.departure?.scheduled ?? '',
        arrival:   f.arrival?.scheduled ?? '',
        status:    f.flight_status ?? 'unknown',
        delay:     f.departure?.delay ?? null,
      }));
    } catch {
      return [];
    }
  }

  // ── Look up a single flight's origin/destination from the mock API ────────
  private async fetchFlightRoute(iata: string): Promise<{ origin: string; destination: string } | null> {
    const base = this.config.get<string>('mockApi.baseUrl') ?? 'http://localhost:3002';
    try {
      const { data } = await axios.get<{ data: unknown[] }>(`${base}/v1/flights`, {
        params: { flight_iata: iata },
        timeout: 3000,
      });
      const flight = (data.data ?? [])[0] as any;
      if (!flight) return null;
      const origin      = flight.departure?.iata ?? '';
      const destination = flight.arrival?.iata   ?? '';
      if (!origin || !destination) return null;
      return { origin, destination };
    } catch {
      return null;
    }
  }

  // ── Format alternatives as readable list for Gemini ──────────────────────
  private formatAlts(alts: AltFlight[]): string {
    if (alts.length === 0) return 'No alternatives found on this route.';
    return alts
      .map(a => {
        const dep = new Date(a.departure).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
        const arr = new Date(a.arrival).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
        const statusStr = a.status === 'cancelled' ? 'CANCELLED' :
                          a.status === 'diverted'  ? 'DIVERTED'  :
                          a.delay ? `delayed ${a.delay} min` : 'on-time';
        return `  • ${a.iata} (${a.airline}) dep ${dep} → arr ${arr} [${statusStr}]`;
      })
      .join('\n');
  }

  // ── Build Gemini prompt ──────────────────────────────────────────────────
  private buildPrompt(ctx: SuggestionContext, alts: AltFlight[]): string {
    const { event, booking } = ctx;
    const isFlightDisruption = event.type === 'FLIGHT_DELAY' || event.type === 'FLIGHT_CANCELLATION' || event.type === 'FLIGHT_DIVERSION';

    const systemPrompt = `You are the WanderSync travel disruption assistant. Your ONLY job is to suggest 3 specific, actionable alternatives for a disrupted traveler.
Respond ONLY with a valid JSON object — no markdown, no code fences, no explanation:
{ "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"] }
Each suggestion must be concrete and reference specific flight IATAs or times where available.
Rank suggestions by best fit for the traveler's constraint.
Do not answer anything outside of travel disruption management.`;

    let userMsg: string;

    if (isFlightDisruption && booking && alts.length > 0) {
      const neededBy = booking.arrivalTime
        ? new Date(booking.arrivalTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
        : 'as soon as possible';
      userMsg = [
        `DISRUPTED BOOKING:`,
        `  Flight: ${event.flightIata ?? 'unknown'}`,
        `  Route: ${booking.origin} → ${booking.destination}`,
        `  Original departure: ${new Date(booking.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}`,
        `  Traveler needs to arrive by: ${neededBy}`,
        `  Disruption: ${event.type} — ${event.description}`,
        ``,
        `AVAILABLE ALTERNATIVES ON ${booking.origin} → ${booking.destination}:`,
        this.formatAlts(alts),
        ``,
        `Suggest the 3 best options for the traveler. Reference specific flight IATAs and times. Exclude cancelled/diverted flights unless no alternative exists.`,
      ].join('\n');
    } else if (isFlightDisruption && !booking && alts.length > 0) {
      // No booking record for this user, but we fetched alternatives from the mock API
      userMsg = [
        `DISRUPTED FLIGHT: ${event.flightIata ?? 'unknown'}`,
        `  Disruption: ${event.type} — ${event.description}`,
        `  Severity: ${event.severity}/5`,
        ``,
        `AVAILABLE ALTERNATIVES:`,
        this.formatAlts(alts),
        ``,
        `Suggest the 3 best options. Reference specific flight IATAs and times. Exclude cancelled/diverted flights unless no alternative exists.`,
      ].join('\n');
    } else if (event.type === 'WEATHER_ALERT' && booking) {
      userMsg = [
        `WEATHER DISRUPTION AT ${event.affectedOrigin ?? booking.origin}:`,
        `  Severity: ${event.severity}/5`,
        `  Alert: ${event.description}`,
        `  Affected booking: ${booking.type} from ${booking.origin}`,
        alts.length > 0 ? `\nALTERNATIVE FLIGHTS FROM ${booking.origin}:\n${this.formatAlts(alts)}` : '',
        ``,
        `Suggest 3 actionable steps for the traveler to handle this weather disruption.`,
      ].filter(Boolean).join('\n');
    } else {
      userMsg = [
        `Disruption type: ${event.type}`,
        `Severity: ${event.severity}/5`,
        `Description: ${event.description}`,
        event.flightIata     ? `Flight: ${event.flightIata}` : null,
        event.affectedOrigin ? `Affected origin: ${event.affectedOrigin}` : null,
      ].filter(Boolean).join('\n');
    }

    return JSON.stringify({ system: systemPrompt, user: userMsg });
  }

  // ── Main handler ──────────────────────────────────────────────────────────
  public async handle(ctx: SuggestionContext): Promise<string[]> {
    const apiKey = this.config.get<string>('gemini.apiKey');
    if (!apiKey) {
      this.logger.warn('No Gemini API key configured, skipping LLM handler');
      return super.handle(ctx);
    }

    try {
      const { event, booking } = ctx;
      const isFlightDisruption = ['FLIGHT_DELAY', 'FLIGHT_CANCELLATION', 'FLIGHT_DIVERSION'].includes(event.type);
      const isWeather          = event.type === 'WEATHER_ALERT';

      // Fetch alternatives — always try to get real flight data from the mock API
      let alts: AltFlight[] = [];
      if (booking && isFlightDisruption) {
        alts = await this.fetchAlternatives(booking.origin, booking.destination, event.flightIata ?? '');
      } else if (!booking && isFlightDisruption && event.flightIata) {
        // No booking record for this user — look up the flight's route from the mock API directly
        const route = await this.fetchFlightRoute(event.flightIata);
        if (route) {
          alts = await this.fetchAlternatives(route.origin, route.destination, event.flightIata);
        }
      } else if (isWeather && booking) {
        // For weather, fetch flights departing from affected origin (any destination)
        alts = await this.fetchAlternatives(booking.origin, '', '');
      }

      const promptData  = JSON.parse(this.buildPrompt(ctx, alts));
      const genAI       = new GoogleGenerativeAI(apiKey);
      const model       = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: promptData.system,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              suggestions: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
            },
            required: ['suggestions'],
          },
          maxOutputTokens: 1024,
          temperature: 0.3,
        },
      });

      const result = await model.generateContent(promptData.user);
      let text = result.response.text().trim();
      // Strip markdown code fences (thinking models may wrap despite JSON mode)
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\r?\n?/, '').replace(/\r?\n?```$/, '').trim();
      }
      // Fallback: extract first JSON object if preamble text was prepended
      if (!text.startsWith('{')) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) text = match[0];
      }
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
        this.logger.log(`LLM returned ${parsed.suggestions.length} suggestion(s) with ${alts.length} alternative(s) queried`);
        return parsed.suggestions as string[];
      }
    } catch (e) {
      this.logger.error(`Gemini LLM handler failed: ${(e as Error).message}`);
    }

    return super.handle(ctx);
  }
}
