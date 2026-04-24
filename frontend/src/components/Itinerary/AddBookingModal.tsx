import { useState } from 'react';
import type { BookingType } from '@/types';
import { itineraryAPI, type HotelResult, type TransportRoute } from '@/services/itineraryAPI';

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

const TYPES: { value: BookingType; label: string; icon: string }[] = [
  { value: 'FLIGHT',    label: 'Flight',    icon: '✈' },
  { value: 'HOTEL',     label: 'Hotel',     icon: '🏨' },
  { value: 'TRANSPORT', label: 'Transport', icon: '🚆' },
];

const TRANSPORT_TYPES = ['TRAIN', 'BUS', 'FERRY'];

const XIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const SearchIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const SpinIcon = () => (
  <span className="h-3.5 w-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin inline-block" />
);
const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function toLocalDT(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function dateToDateTime(date: string, time: string): string {
  return date ? `${date}T${time}` : '';
}

export default function AddBookingModal({ onAdd, onClose }: AddBookingModalProps) {
  const [type, setType]               = useState<BookingType>('FLIGHT');
  const [providerRef, setProviderRef] = useState('');
  const [origin, setOrigin]           = useState('');
  const [destination, setDest]        = useState('');
  const [departure, setDeparture]     = useState('');
  const [arrival, setArrival]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  // Flight lookup
  const [flightRef, setFlightRef]       = useState('');
  const [flightLoading, setFL]          = useState(false);
  const [flightError, setFLError]       = useState('');
  const [flightFound, setFlightFound]   = useState(false);

  // Hotel search
  const [hotelCity, setHotelCity]         = useState('');
  const [hotelCheckIn, setHotelCheckIn]   = useState('');
  const [hotelCheckOut, setHotelCheckOut] = useState('');
  const [hotelResults, setHotelResults]   = useState<HotelResult[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<HotelResult | null>(null);
  const [hotelLoading, setHL]             = useState(false);
  const [hotelError, setHotelError]       = useState('');

  // Transport search
  const [transType, setTransType]       = useState('TRAIN');
  const [transOrigin, setTransOrigin]   = useState('');
  const [transDest, setTransDest]       = useState('');
  const [transResults, setTransResults] = useState<TransportRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);
  const [transLoading, setTL]           = useState(false);
  const [transError, setTransError]     = useState('');

  const resetFields = (newType: BookingType) => {
    setType(newType);
    setProviderRef(''); setOrigin(''); setDest('');
    setDeparture(''); setArrival(''); setError('');
    setFlightRef(''); setFLError(''); setFlightFound(false);
    setHotelCity(''); setHotelCheckIn(''); setHotelCheckOut('');
    setHotelResults([]); setSelectedHotel(null); setHotelError('');
    setTransOrigin(''); setTransDest(''); setTransResults([]); setSelectedRoute(null); setTransError('');
  };

  /* ── Flight ── */
  const handleFlightLookup = async () => {
    if (!flightRef.trim()) return;
    setFL(true); setFLError(''); setFlightFound(false);
    try {
      const r = await itineraryAPI.lookupFlight(flightRef.trim());
      const f = r.data;
      setProviderRef(f.providerRef);
      setOrigin(f.origin);
      setDest(f.destination);
      setDeparture(toLocalDT(f.departureTime));
      setArrival(toLocalDT(f.arrivalTime));
      setFlightFound(true);
    } catch {
      setFLError('Flight not found. Enter details manually below.');
    } finally {
      setFL(false);
    }
  };

  /* ── Hotel ── */
  const handleHotelSearch = async () => {
    if (!hotelCity.trim()) return;
    setHL(true); setHotelError(''); setHotelResults([]); setSelectedHotel(null);
    try {
      const r = await itineraryAPI.lookupHotel(hotelCity.trim(), hotelCheckIn, hotelCheckOut);
      if (r.data.length === 0) setHotelError('No hotels found. Try LON, DXB, NYC, PAR, SIN, DEL…');
      else setHotelResults(r.data);
    } catch {
      setHotelError('Search failed. Try a 3-letter city code.');
    } finally {
      setHL(false);
    }
  };

  const applyHotel = (h: HotelResult) => {
    setSelectedHotel(h);
    setProviderRef(h.id);
    setOrigin(h.city);
    setDest(h.city);
    setHotelResults([]);
    if (hotelCheckIn)  setDeparture(dateToDateTime(hotelCheckIn, '14:00'));
    if (hotelCheckOut) setArrival(dateToDateTime(hotelCheckOut, '11:00'));
  };

  /* ── Transport ── */
  const handleTransportSearch = async () => {
    setTL(true); setTransError(''); setTransResults([]); setSelectedRoute(null);
    try {
      const r = await itineraryAPI.lookupTransport(transType, transOrigin.trim(), transDest.trim());
      if (r.data.length === 0) setTransError('No routes found. Try LON→PAR, FRA→MUC, NYC→WAS…');
      else setTransResults(r.data);
    } catch {
      setTransError('Search failed.');
    } finally {
      setTL(false);
    }
  };

  const applyTransport = (route: TransportRoute) => {
    setSelectedRoute(route);
    setProviderRef(route.id);
    setOrigin(route.origin);
    setDest(route.destination);
    setTransResults([]);
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!providerRef.trim()) { setError('Please look up a booking above first'); return; }
    if (!origin.trim() || !destination.trim()) { setError('Origin/destination are required'); return; }
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
      setError('Failed to add booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isHotel = type === 'HOTEL';
  const isTransport = type === 'TRANSPORT';
  const isFlight = type === 'FLIGHT';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/30 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-scale-in flex flex-col"
           style={{ maxHeight: 'calc(100vh - 32px)' }}>

        {/* Header — fixed */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-dust-grey/40 shrink-0">
          <h2 className="font-serif text-lg font-semibold text-charcoal">Add Booking</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-charcoal/40 hover:text-charcoal hover:bg-dust-grey/30 transition-colors cursor-pointer">
            <XIcon />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <form onSubmit={handleSubmit} className="space-y-4" id="booking-form">

            {/* Type selector — pill style */}
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => resetFields(t.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                    type === t.value
                      ? 'border-burnt-peach/50 bg-burnt-peach/10 text-burnt-peach'
                      : 'border-dust-grey/60 bg-white text-charcoal/50 hover:border-dust-grey hover:text-charcoal/70'
                  }`}
                >
                  <span className="mr-1">{t.icon}</span>{t.label}
                </button>
              ))}
            </div>

            {/* ════════════ FLIGHT ════════════ */}
            {isFlight && (
              <div className="space-y-3">
                <div className="rounded-xl border border-dust-grey/50 bg-slate-50/60 p-3.5 space-y-3">
                  <p className="text-[10px] font-bold text-charcoal/40 tracking-widest uppercase">Search by flight number</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={flightRef}
                      onChange={(e) => { setFlightRef(e.target.value.toUpperCase()); setFlightFound(false); }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleFlightLookup())}
                      placeholder="e.g. BA175, EK506, AI101"
                      maxLength={10}
                      className="input-field flex-1 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleFlightLookup}
                      disabled={flightLoading || !flightRef.trim()}
                      className="btn-primary px-4 flex items-center gap-1.5 shrink-0 text-sm"
                    >
                      {flightLoading ? <SpinIcon /> : flightFound ? <CheckIcon /> : <SearchIcon />}
                      {flightLoading ? 'Looking up…' : flightFound ? 'Found' : 'Lookup'}
                    </button>
                  </div>
                  {flightFound && (
                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <CheckIcon />
                      <span><span className="font-mono font-semibold">{providerRef}</span> — {origin} → {destination} · filled below</span>
                    </div>
                  )}
                  {flightError && <p className="text-xs text-burnt-peach/90">{flightError}</p>}
                </div>

                {/* Manual fields */}
                <div className="space-y-3">
                  <Label>Flight number <Hint>auto-filled or enter manually</Hint></Label>
                  <input type="text" value={providerRef} onChange={(e) => setProviderRef(e.target.value)} placeholder="e.g. BA175" maxLength={10} className="input-field font-mono" />

                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>From <Hint>IATA</Hint></Label>
                      <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="DEL" maxLength={4} className="input-field font-mono" /></div>
                    <div><Label>To <Hint>IATA</Hint></Label>
                      <input type="text" value={destination} onChange={(e) => setDest(e.target.value)} placeholder="LHR" maxLength={4} className="input-field font-mono" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Departure</Label>
                      <input type="datetime-local" value={departure} onChange={(e) => setDeparture(e.target.value)} className="input-field" /></div>
                    <div><Label>Arrival</Label>
                      <input type="datetime-local" value={arrival} onChange={(e) => setArrival(e.target.value)} className="input-field" /></div>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════ HOTEL ════════════ */}
            {isHotel && (
              <div className="space-y-3">
                {/* Search panel */}
                <div className="rounded-xl border border-dust-grey/50 bg-slate-50/60 p-3.5 space-y-3">
                  <p className="text-[10px] font-bold text-charcoal/40 tracking-widest uppercase">Search hotels</p>

                  <div>
                    <Label>City code <Hint>3-letter IATA, e.g. LON · DXB · NYC · PAR · SIN · DEL</Hint></Label>
                    <input
                      type="text"
                      value={hotelCity}
                      onChange={(e) => setHotelCity(e.target.value.toUpperCase())}
                      placeholder="e.g. LON"
                      maxLength={5}
                      className="input-field font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Check-in</Label>
                      <input type="date" value={hotelCheckIn} onChange={(e) => setHotelCheckIn(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <Label>Check-out</Label>
                      <input type="date" value={hotelCheckOut} onChange={(e) => setHotelCheckOut(e.target.value)} className="input-field" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleHotelSearch}
                    disabled={hotelLoading || !hotelCity.trim()}
                    className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                  >
                    {hotelLoading ? <><SpinIcon /> Searching…</> : <><SearchIcon /> Search Hotels</>}
                  </button>

                  {hotelError && <p className="text-xs text-burnt-peach/90">{hotelError}</p>}

                  {hotelResults.length > 0 && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto -mx-1 px-1">
                      {hotelResults.map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => applyHotel(h)}
                          className="w-full text-left px-3 py-2.5 rounded-xl border border-dust-grey/50 bg-white hover:border-burnt-peach/40 hover:bg-burnt-peach/4 transition-colors"
                        >
                          <div className="text-sm font-semibold text-charcoal/80 truncate">{h.name}</div>
                          <div className="text-xs text-charcoal/40 mt-0.5">
                            {'★'.repeat(h.rating)}{'☆'.repeat(5 - h.rating)}
                            <span className="ml-2">${h.pricePerNight}/night</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected hotel confirmation */}
                {selectedHotel && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-green-700 tracking-wide">Selected hotel</p>
                        <p className="text-sm font-semibold text-charcoal/80 mt-0.5">{selectedHotel.name}</p>
                        <p className="text-xs text-charcoal/45">{'★'.repeat(selectedHotel.rating)} · ${selectedHotel.pricePerNight}/night</p>
                      </div>
                      <button type="button" onClick={() => { setSelectedHotel(null); setProviderRef(''); setOrigin(''); setDest(''); setDeparture(''); setArrival(''); }}
                        className="text-xs text-charcoal/40 hover:text-charcoal shrink-0 mt-0.5">Change</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Check-in date</Label>
                        <input type="date" value={departure.split('T')[0]} onChange={(e) => setDeparture(dateToDateTime(e.target.value, '14:00'))} className="input-field" />
                      </div>
                      <div>
                        <Label>Check-out date</Label>
                        <input type="date" value={arrival.split('T')[0]} onChange={(e) => setArrival(dateToDateTime(e.target.value, '11:00'))} className="input-field" />
                      </div>
                    </div>
                  </div>
                )}

                {!selectedHotel && (
                  <p className="text-xs text-charcoal/35 text-center">Search and select a hotel above to continue</p>
                )}
              </div>
            )}

            {/* ════════════ TRANSPORT ════════════ */}
            {isTransport && (
              <div className="space-y-3">
                <div className="rounded-xl border border-dust-grey/50 bg-slate-50/60 p-3.5 space-y-3">
                  <p className="text-[10px] font-bold text-charcoal/40 tracking-widest uppercase">Search routes</p>

                  <div>
                    <Label>Mode</Label>
                    <div className="flex gap-2">
                      {TRANSPORT_TYPES.map((t) => (
                        <button key={t} type="button" onClick={() => setTransType(t)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${transType === t ? 'border-burnt-peach/50 bg-burnt-peach/10 text-burnt-peach' : 'border-dust-grey/60 bg-white text-charcoal/50 hover:text-charcoal/70'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>From <Hint>e.g. LON</Hint></Label>
                      <input type="text" value={transOrigin} onChange={(e) => setTransOrigin(e.target.value.toUpperCase())} placeholder="LON" maxLength={4} className="input-field font-mono" />
                    </div>
                    <div>
                      <Label>To <Hint>e.g. PAR</Hint></Label>
                      <input type="text" value={transDest} onChange={(e) => setTransDest(e.target.value.toUpperCase())} placeholder="PAR" maxLength={4} className="input-field font-mono" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTransportSearch}
                    disabled={transLoading}
                    className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                  >
                    {transLoading ? <><SpinIcon /> Searching…</> : <><SearchIcon /> Find Routes</>}
                  </button>

                  {transError && <p className="text-xs text-burnt-peach/90">{transError}</p>}

                  {transResults.length > 0 && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto -mx-1 px-1">
                      {transResults.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => applyTransport(r)}
                          className="w-full text-left px-3 py-2.5 rounded-xl border border-dust-grey/50 bg-white hover:border-burnt-peach/40 hover:bg-burnt-peach/4 transition-colors"
                        >
                          <div className="text-sm font-semibold text-charcoal/80">{r.carrier}</div>
                          <div className="text-xs text-charcoal/40 mt-0.5 font-mono">{r.origin} → {r.destination} · {r.durationHours}h</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedRoute && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-green-700 tracking-wide">Selected route</p>
                        <p className="text-sm font-semibold text-charcoal/80 mt-0.5">{selectedRoute.carrier}</p>
                        <p className="text-xs text-charcoal/45 font-mono">{selectedRoute.origin} → {selectedRoute.destination} · {selectedRoute.durationHours}h</p>
                      </div>
                      <button type="button" onClick={() => { setSelectedRoute(null); setProviderRef(''); setOrigin(''); setDest(''); setDeparture(''); setArrival(''); }}
                        className="text-xs text-charcoal/40 hover:text-charcoal shrink-0 mt-0.5">Change</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Departure</Label>
                        <input type="datetime-local" value={departure} onChange={(e) => {
                          setDeparture(e.target.value);
                          if (e.target.value) {
                            const arr = new Date(new Date(e.target.value).getTime() + selectedRoute.durationHours * 3600000);
                            setArrival(toLocalDT(arr.toISOString()));
                          }
                        }} className="input-field" />
                      </div>
                      <div>
                        <Label>Arrival <Hint>auto-calculated</Hint></Label>
                        <input type="datetime-local" value={arrival} onChange={(e) => setArrival(e.target.value)} className="input-field" />
                      </div>
                    </div>
                  </div>
                )}

                {!selectedRoute && (
                  <p className="text-xs text-charcoal/35 text-center">Search and select a route above to continue</p>
                )}
              </div>
            )}

            {error && (
              <p className="text-xs font-medium rounded-lg px-3 py-2"
                 style={{ background: 'rgba(215,122,97,0.08)', color: '#c96248', border: '1px solid rgba(215,122,97,0.22)' }}>
                {error}
              </p>
            )}
          </form>
        </div>

        {/* Footer — fixed */}
        <div className="px-5 pb-5 pt-3 border-t border-dust-grey/40 shrink-0 flex gap-2">
          <button
            type="submit"
            form="booking-form"
            disabled={loading || (isHotel && !selectedHotel) || (isTransport && !selectedRoute)}
            className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <><SpinIcon /> Adding…</> : 'Add Booking'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary px-5 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-charcoal/55 mb-1.5 tracking-wide">{children}</label>;
}
function Hint({ children }: { children: React.ReactNode }) {
  return <span className="ml-1 font-normal text-charcoal/35">{children}</span>;
}
