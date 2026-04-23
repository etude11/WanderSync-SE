import { useState } from 'react';
import type { BookingType } from '@/types';

interface AddBookingModalProps {
  itineraryId: string;
  onAdd: (data: { providerKey: string; providerRef: string; type: BookingType }) => Promise<void>;
  onClose: () => void;
}

const PROVIDERS: { key: string; type: BookingType; label: string }[] = [
  { key: 'aviationstack', type: 'FLIGHT',    label: 'AviationStack (Flight)' },
  { key: 'hotel-stub',    type: 'HOTEL',     label: 'Hotel (stub)' },
  { key: 'transport-stub',type: 'TRANSPORT', label: 'Transport (stub)' },
];

const XIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function AddBookingModal({ onAdd, onClose }: AddBookingModalProps) {
  const [providerKey, setProviderKey] = useState(PROVIDERS[0].key);
  const [providerRef, setProviderRef] = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const selected = PROVIDERS.find((p) => p.key === providerKey)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerRef.trim()) { setError('Reference is required'); return; }
    setLoading(true);
    setError('');
    try {
      await onAdd({ providerKey: selected.key, providerRef: providerRef.trim(), type: selected.type });
      onClose();
    } catch {
      setError('Failed to add booking. Check the reference and try again.');
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
          <div>
            <label className="block text-xs font-semibold text-charcoal/55 mb-1.5 tracking-wide">Provider</label>
            <select
              value={providerKey}
              onChange={(e) => setProviderKey(e.target.value)}
              className="input-field cursor-pointer"
            >
              {PROVIDERS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal/55 mb-1.5 tracking-wide">
              Provider Reference
              <span className="ml-1 font-normal text-charcoal/35">(e.g. AA123 for flights)</span>
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
