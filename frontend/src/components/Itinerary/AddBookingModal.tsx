import { useState } from 'react';
import type { BookingType } from '@/types';

interface AddBookingModalProps {
  itineraryId: string;
  onAdd: (data: { providerKey: string; providerRef: string; type: BookingType }) => Promise<void>;
  onClose: () => void;
}

const PROVIDERS: { key: string; type: BookingType; label: string }[] = [
  { key: 'aviationstack', type: 'FLIGHT', label: 'AviationStack (Flight)' },
  { key: 'hotel-stub', type: 'HOTEL', label: 'Hotel (stub)' },
  { key: 'transport-stub', type: 'TRANSPORT', label: 'Transport (stub)' },
];

export default function AddBookingModal({ onAdd, onClose }: AddBookingModalProps) {
  const [providerKey, setProviderKey] = useState(PROVIDERS[0].key);
  const [providerRef, setProviderRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selected = PROVIDERS.find((p) => p.key === providerKey)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerRef.trim()) { setError('Reference is required'); return; }
    setLoading(true);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md mx-4 animate-slide-up">
        <h2 className="text-lg font-semibold text-white mb-4">Add Booking</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Provider</label>
            <select
              value={providerKey}
              onChange={(e) => setProviderKey(e.target.value)}
              className="input-field"
            >
              {PROVIDERS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Provider Reference</label>
            <input
              type="text"
              value={providerRef}
              onChange={(e) => setProviderRef(e.target.value)}
              placeholder="e.g. AA123"
              className="input-field"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Adding…' : 'Add Booking'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
