import { Injectable } from '@nestjs/common';
import { BookingType } from '@prisma/client';
import { IBookingStrategy, NormalizedBooking } from './booking-strategy.interface';

export type HotelResult = {
  id: string;
  name: string;
  city: string;
  rating: number;
  pricePerNight: number;
};

const HOTELS: HotelResult[] = [
  { id: 'HILTON-LHR',      name: 'Hilton London Heathrow',        city: 'LON', rating: 4, pricePerNight: 185 },
  { id: 'MARRIOTT-DXB',    name: 'Dubai Marriott Harbour Hotel',  city: 'DXB', rating: 5, pricePerNight: 230 },
  { id: 'FOUR-NYC',        name: 'Four Seasons New York',         city: 'NYC', rating: 5, pricePerNight: 680 },
  { id: 'NOVOTEL-PAR',     name: 'Novotel Paris Centre',          city: 'PAR', rating: 4, pricePerNight: 160 },
  { id: 'MARINA-SIN',      name: 'Marina Bay Sands',              city: 'SIN', rating: 5, pricePerNight: 520 },
  { id: 'TAJ-BOM',         name: 'Taj Mahal Palace Mumbai',       city: 'BOM', rating: 5, pricePerNight: 310 },
  { id: 'IMPERIAL-DEL',    name: 'The Imperial New Delhi',        city: 'DEL', rating: 5, pricePerNight: 275 },
  { id: 'PENINSULA-HKG',   name: 'The Peninsula Hong Kong',       city: 'HKG', rating: 5, pricePerNight: 490 },
  { id: 'ADLON-BER',       name: 'Hotel Adlon Kempinski Berlin',  city: 'BER', rating: 5, pricePerNight: 350 },
  { id: 'BEAU-GVA',        name: 'Beau-Rivage Geneva',            city: 'GVA', rating: 5, pricePerNight: 420 },
  { id: 'SHERATON-FRA',    name: 'Sheraton Frankfurt Airport',    city: 'FRA', rating: 4, pricePerNight: 195 },
  { id: 'MANDARIN-BKK',    name: 'Mandarin Oriental Bangkok',     city: 'BKK', rating: 5, pricePerNight: 290 },
  { id: 'ATLANTIS-DXB',    name: 'Atlantis The Palm Dubai',       city: 'DXB', rating: 5, pricePerNight: 380 },
  { id: 'CLARIDGES-LON',   name: "Claridge's London",             city: 'LON', rating: 5, pricePerNight: 740 },
  { id: 'SHANGRI-SIN',     name: 'Shangri-La Singapore',          city: 'SIN', rating: 5, pricePerNight: 390 },
  { id: 'IBIS-PAR',        name: 'ibis Paris Gare du Nord',       city: 'PAR', rating: 3, pricePerNight: 95  },
  { id: 'HYATT-NYC',       name: 'Grand Hyatt New York',          city: 'NYC', rating: 4, pricePerNight: 340 },
  { id: 'ITC-DEL',         name: 'ITC Maurya New Delhi',          city: 'DEL', rating: 5, pricePerNight: 240 },
  { id: 'RITZ-PAR',        name: 'The Ritz Paris',                city: 'PAR', rating: 5, pricePerNight: 1100},
  { id: 'RADISSON-BER',    name: 'Radisson Blu Berlin',           city: 'BER', rating: 4, pricePerNight: 145 },
];

const INDEX = new Map<string, HotelResult>(HOTELS.map((h) => [h.id, h]));

@Injectable()
export class HotelBookingStrategy implements IBookingStrategy {
  readonly providerKey = 'hotel-sim';
  readonly bookingType = BookingType.HOTEL;

  async fetchAndNormalize(refs: string[]): Promise<NormalizedBooking[]> {
    return refs
      .map((ref) => INDEX.get(ref))
      .filter((h): h is HotelResult => h !== undefined)
      .map((h) => ({
        providerRef: h.id,
        type: BookingType.HOTEL,
        departureTime: new Date(),
        arrivalTime: new Date(Date.now() + 86400000),
        origin: h.city,
        destination: h.city,
        rawData: h as unknown as Record<string, unknown>,
      }));
  }

  search(city: string, _checkIn: string, _checkOut: string): HotelResult[] {
    const upper = city.toUpperCase();
    return HOTELS.filter((h) => h.city === upper || h.name.toUpperCase().includes(upper));
  }
}
