import { useState } from 'react';
import type { BookingType } from '@/types';

interface AddBookingData {
  providerRef: string;
  type: BookingType;
  departureTime: string;
  arrivalTime: string;
  origin: string;
  destination: string;
}

interface AddBookingModalProps {
  itineraryId: string;
  onAdd: (data: AddBookingData) => Promise<void>;
  onClose: () => void;
}

const TYPES: { value: BookingType; label: string }[] = [
  { value: 'FLIGHT',    label: 'Flight' },
  { value: 'HOTEL',     label: 'Hotel' },
  { value: 'TRANSPORT', label: 'Transport' },
];

const XIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function toLocalDT(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function offsetHours(hours: number): Date {
  return new Date(Date.now() + hours * 3600 * 1000);
}

type FlightPreset = { label: string; ref: string; origin: string; dest: string; depOffsetHours: number; durHours: number };
type HotelPreset  = { label: string; ref: string; city: string; checkInOffsetHours: number; nights: number };
type TransPreset  = { label: string; ref: string; origin: string; dest: string; depOffsetHours: number; durHours: number };

const FLIGHT_PRESETS: FlightPreset[] = [
  { label: 'BA175 DEL→LHR', ref: 'BA175',  origin: 'DEL', dest: 'LHR', depOffsetHours: 7 * 24,     durHours: 9 },
  { label: 'EK506 BOM→DXB', ref: 'EK506',  origin: 'BOM', dest: 'DXB', depOffsetHours: 7 * 24 + 4, durHours: 3 },
  { label: 'AI101 DEL→BOM', ref: 'AI101',  origin: 'DEL', dest: 'BOM', depOffsetHours: 3 * 24,     durHours: 2 },
];
const HOTEL_PRESETS: HotelPreset[] = [
  { label: 'Hilton London',  ref: 'HILTON-LHR',   city: 'LHR', checkInOffsetHours: 7 * 24, nights: 3 },
  { label: 'Marriott Dubai', ref: 'MARRIOTT-DXB',  city: 'DXB', checkInOffsetHours: 7 * 24, nights: 2 },
];
const TRANSPORT_PRESETS: TransPreset[] = [
  { label: 'Eurostar LON→PAR', ref: 'EUROSTAR-7821', origin: 'LON', dest: 'PAR', depOffsetHours: 8 * 24, durHours: 2 },
  { label: 'ICE Train FRA→MUC', ref: 'ICE-592',      origin: 'FRA', dest: 'MUC', depOffsetHours: 9 * 24, durHours: 3 },
];

export default function AddBookingModal({ onAdd, onClose }: AddBookingModalProps) {
  const [type, setType]               = useState<BookingType>('FLIGHT');
  const [providerRef, setProviderRef] = useState('');
  const [origin, setOrigin]           = useState('');
  const [destination, setDest]        = useState('');
  const [departure, setDeparture]     = useState('');
  const [arrival, setArrival]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const applyFlight = (p: FlightPreset) => {
    setProviderRef(p.ref);
    setOrigin(p.origin);
    setDest(p.dest);
    setDeparture(toLocalDT(offsetHours(p.depOffsetHours)));
    setArrival(toLocalDT(offsetHours(p.depOffsetHours + p.durHours)));
  };
  const applyHotel = (p: HotelPreset) => {
    setProviderRef(p.ref);
    setOrigin(p.city);
    setDest(p.city);
    setDeparture(toLocalDT(offsetHours(p.checkInOffsetHours)));
    setArrival(toLocalDT(offsetHours(p.checkInOffsetHours + p.nights * 24)));
  };
  const applyTransport = (p: TransPreset) => {
    setProviderRef(p.ref);
    setOrigin(p.origin);
    setDest(p.dest);
    setDeparture(toLocalDT(offsetHours(p.depOffsetHours)));
    setArrival(toLocalDT(offsetHours(p.depOffsetHours + p.durHours)));
  };

  const resetFields = (newType: BookingType) => {
    setType(newType);
    setProviderRef(''); setOrigin(''); setDest(''); setDeparture(''); setArrival(''); setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!providerRef.trim()) { setError('Reference is required'); return; }
    if (!origin.trim() || !destination.trim()) { setError('Origin/city fields are required'); return; }
    if (!departure || !arrival) { setError('Date/time fields are required'); return; }
    if (new Date(arrival) <= new Date(departure)) { setError('End time must be after start time'); return; }

    setLoading(true);
    try {
      await onAdd({
        providerRef:   providerRef.trim().toUpperCase(),
        type,
        departureTime: new Date(departure).toISOString(),
        arrivalTime:   new Date(arrival).toISOString(),
        origin:        origin.trim().toUpperCase(),
        destination:   destination.trim().toUpperCase(),
      });
      onClose();
    } catch {
      setError('Failed to add booking. Check the details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const isHotel = type === 'HOTEL';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/30 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-md mx-4 animate-scale-in shadow-card-hover">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-lg font-semibold text-charcoal">Add Booking</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-charcoal/40 hover:text-charcoal hover:bg-dust-grey/30 transition-colors cursor-pointer">
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-semibold text-charcoal/55 mb-1.5 tracking-wide">Type</label>
            <select
              value={type}
              onChange={(e) => resetFields(e.target.value as BookingType)}
              className="input-field cursor-pointer"
            >
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Quick-fill chips */}
          <div>
            <p className="text-[10px] font-semibold text-charcoal/35 mb-1.5 tracking-widest uppercase">Quick fill</p>
            <div className="flex flex-wrap gap-1.5">
              {type === 'FLIGHT' && FLIGHT_PRESETS.map((p) => (
                <button key={p.ref} type="button" onClick={() => applyFlight(p)}
                  className="text-[11px] px-2 py-1 rounded-full border border-dust-grey/60 bg-white text-charcoal/60 hover:border-burnt-peach/40 hover:text-burnt-peach transition-colors cursor-pointer font-mono">
                  {p.label}
                </button>
              ))}
              {type === 'HOTEL' && HOTEL_PRESETS.map((p) => (
                <button key={p.ref} type="button" onClick={() => applyHotel(p)}
                  className="text-[11px] px-2 py-1 rounded-full border border-dust-grey/60 bg-white text-charcoal/60 hover:border-burnt-peach/40 hover:text-burnt-peach transition-colors cursor-pointer">
                  {p.label}
                </button>
              ))}
              {type === 'TRANSPORT' && TRANSPORT_PRESETS.map((p) => (
                <button key={p.ref} type="button" onClick={() => applyTransport(p)}
                  className="text-[11px] px-2 py-1 rounded-full border border-dust-grey/60 bg-white text-charcoal/60 hover:border-burnt-peach/40 hover:text-burnt-peach transition-colors cursor-pointer font-mono">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference field */}
          <div>
            <label className="block text-xs font-semibold text-charcoal/55 mb-1.5 tracking-wide">
              {type === 'FLIGHT' ? 'Flight number' : type === 'HOTEL' ? 'Hotel name' : 'Ticket / Reference'}
              <span className="ml-1 font-normal text-charcoal/35">
                {type === 'FLIGHT' ? '(e.g. BA175)' : type === 'HOTEL' ? '(e.g. Hilton London)' : '(e.g. EUROSTAR-7821)'}
              </span>
            </label>
            <input
              type="text"
              value={providerRef}
              onChange={(e) => setProviderRef(e.target.value)}
              placeholder={type === 'FLIGHT' ? 'e.g. BA175' : type === 'HOTEL' ? 'e.g. Hilton London' : 'e.g. EUROSTAR-7821'}
              maxLength={50}
              className="input-field font-mono"
              autoFocus
            />
          </div>

          {/* Origin / Destination */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal/55 mb-1.5 tracking-wide">
                {isHotel ? 'City code' : 'From'}
                <span className="ml-1 font-normal text-charcoal/35">{isHotel ? '(e.g. LHR)' : '(IATA)'}</span>
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value);
                  if (isHotel) setDest(e.target.value);
                }}
                placeholder={isHotel ? 'e.g. LHR' : 'e.g. DEL'}
                maxLength={10}
                className="input-field font-mono"
              />
            </div>
            {!isHotel && (
              <div>
                <label className="block text-xs font-semibold text-charcoal/55 mb-1.5 tracking-wide">
                  To <span className="font-normal text-charcoal/35">(IATA)</span>
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDest(e.target.value)}
                  placeholder="e.g. LHR"
                  maxLength={10}
                  className="input-field font-mono"
                />
              </div>
            )}
          </div>

          {/* Departure / Arrival (or Check-in / Check-out) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal/55 mb-1.5 tracking-wide">
                {isHotel ? 'Check-in' : 'Departure'}
              </label>
              <input
                type="datetime-local"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal/55 mb-1.5 tracking-wide">
                {isHotel ? 'Check-out' : 'Arrival'}
              </label>
              <input
                type="datetime-local"
                value={arrival}
                onChange={(e) => setArrival(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium rounded-lg px-3 py-2" style={{ background: 'rgba(215,122,97,0.08)', color: '#c96248', border: '1px solid rgba(215,122,97,0.22)' }}>
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5 text-sm">
              {loading ? (
                <><span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Adding…</>
              ) : 'Add Booking'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary px-5 text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
