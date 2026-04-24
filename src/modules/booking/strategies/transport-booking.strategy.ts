import { Injectable } from '@nestjs/common';
import { BookingType } from '@prisma/client';
import { IBookingStrategy, NormalizedBooking } from './booking-strategy.interface';

export type TransportRoute = {
  id: string;
  carrier: string;
  type: string;
  origin: string;
  destination: string;
  durationHours: number;
};

const ROUTES: TransportRoute[] = [
  { id: 'EUROSTAR-9001', carrier: 'Eurostar',          type: 'TRAIN', origin: 'LON', destination: 'PAR', durationHours: 2.3 },
  { id: 'EUROSTAR-9002', carrier: 'Eurostar',          type: 'TRAIN', origin: 'LON', destination: 'BRU', durationHours: 2.0 },
  { id: 'ICE-592',       carrier: 'Deutsche Bahn ICE', type: 'TRAIN', origin: 'FRA', destination: 'MUC', durationHours: 3.2 },
  { id: 'ICE-101',       carrier: 'Deutsche Bahn ICE', type: 'TRAIN', origin: 'BER', destination: 'MUC', durationHours: 4.0 },
  { id: 'TGV-6201',      carrier: 'SNCF TGV',          type: 'TRAIN', origin: 'PAR', destination: 'LYS', durationHours: 2.0 },
  { id: 'TGV-8710',      carrier: 'SNCF TGV',          type: 'TRAIN', origin: 'PAR', destination: 'MCE', durationHours: 5.5 },
  { id: 'SHIN-700',      carrier: 'JR Shinkansen',     type: 'TRAIN', origin: 'TYO', destination: 'OSA', durationHours: 2.5 },
  { id: 'SHIN-701',      carrier: 'JR Shinkansen',     type: 'TRAIN', origin: 'OSA', destination: 'HRS', durationHours: 1.5 },
  { id: 'NXPR-401',      carrier: 'Nexpress Coach',    type: 'BUS',   origin: 'LON', destination: 'EDI', durationHours: 9.0 },
  { id: 'FLIXBUS-300',   carrier: 'FlixBus',           type: 'BUS',   origin: 'PAR', destination: 'AMS', durationHours: 5.5 },
  { id: 'FLIXBUS-301',   carrier: 'FlixBus',           type: 'BUS',   origin: 'BER', destination: 'HAM', durationHours: 2.5 },
  { id: 'FERRY-IST',     carrier: 'Istanbul Ferries',  type: 'FERRY', origin: 'IST', destination: 'IZM', durationHours: 4.0 },
  { id: 'FERRY-GRK',     carrier: 'Hellenic Seaways',  type: 'FERRY', origin: 'ATH', destination: 'HER', durationHours: 9.5 },
  { id: 'RAJDHANI-12',   carrier: 'Indian Railways',   type: 'TRAIN', origin: 'DEL', destination: 'BOM', durationHours: 16.0},
  { id: 'AMTRAK-86',     carrier: 'Amtrak',            type: 'TRAIN', origin: 'NYC', destination: 'WAS', durationHours: 3.0 },
];

const INDEX = new Map<string, TransportRoute>(ROUTES.map((r) => [r.id, r]));

@Injectable()
export class TransportBookingStrategy implements IBookingStrategy {
  readonly providerKey = 'transport-sim';
  readonly bookingType = BookingType.TRANSPORT;

  async fetchAndNormalize(refs: string[]): Promise<NormalizedBooking[]> {
    return refs
      .map((ref) => INDEX.get(ref))
      .filter((r): r is TransportRoute => r !== undefined)
      .map((r) => ({
        providerRef: r.id,
        type: BookingType.TRANSPORT,
        departureTime: new Date(),
        arrivalTime: new Date(Date.now() + r.durationHours * 3600000),
        origin: r.origin,
        destination: r.destination,
        rawData: r as unknown as Record<string, unknown>,
      }));
  }

  searchRoutes(type: string, origin: string, destination: string): TransportRoute[] {
    return ROUTES.filter((r) => {
      const matchType = !type || r.type === type;
      const matchOrigin = !origin || r.origin === origin;
      const matchDest = !destination || r.destination === destination;
      return matchType && matchOrigin && matchDest;
    });
  }
}
