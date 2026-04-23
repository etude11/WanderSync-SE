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

export default function AddBookingModal({ onAdd, onClose }: AddBookingModalProps) {
  const [type, setType]               = useState<BookingType>('FLIGHT');
  const [providerRef, setProviderRef] = useState('');
  const [origin, setOrigin]           = useState('');
  const [destination, setDest]        = useState('');
  const [departure, setDeparture]     = useState('');
  const [arrival, setArrival]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!providerRef.trim()) { setError('Reference is required'); return; }
    if (!origin.trim() || !destination.trim()) { setError('Origin and destination are required'); return; }
    if (!departure || !arrival) { setError('Departure and arrival times are required'); return; }
    if (new Date(arrival) <= new Date(departure)) { setError('Arrival must be after departure'); return; }

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
          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-charcoal/55 mb-1.5 tracking-wide">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as BookingType)}
              className="input-field cursor-pointer"
            >
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-semibold text-charcoal/55 mb-1.5 tracking-wide">
              Reference
              <span className="ml-1 font-normal text-charcoal/35">(e.g. AA123)</span>
            </label>
            <input
              type="text"
              value={providerRef}
              onChange={(e) => setProviderRef(e.target.value)}
              placeholder="e.g. AA123"
              className="input-field font-mono"
              autoFocus
            />
          </div>

          {/* Origin / Destination */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal/55 mb-1.5 tracking-wide">
                Origin <span className="font-normal text-charcoal/35">(IATA)</span>
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. DEL"
                maxLength={10}
                className="input-field font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal/55 mb-1.5 tracking-wide">
                Destination <span className="font-normal text-charcoal/35">(IATA)</span>
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
          </div>

          {/* Departure / Arrival */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal/55 mb-1.5 tracking-wide">Departure</label>
              <input
                type="datetime-local"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal/55 mb-1.5 tracking-wide">Arrival</label>
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
