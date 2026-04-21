import type { Booking } from '@/types';
import ProviderBadge from './ProviderBadge';

interface BookingCardProps {
  booking: Booking;
  onRemove?: (id: string) => void;
}

export default function BookingCard({ booking, onRemove }: BookingCardProps) {
  return (
    <div
      className={`relative card flex items-start gap-4 animate-slide-in-right transition-all duration-200 hover:border-slate-700 ${
        booking.disrupted ? 'border-red-800/60 bg-red-950/20' : ''
      }`}
    >
      {booking.disrupted && (
        <span className="absolute top-2 right-2 text-xs bg-red-900/70 text-red-300 border border-red-700 px-2 py-0.5 rounded-full">
          Disrupted
        </span>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <ProviderBadge providerKey={booking.providerKey} type={booking.type} />
        </div>
        <p className="text-sm text-slate-300 font-mono truncate">Ref: {booking.providerRef}</p>
        <p className="text-xs text-slate-500 mt-1">{new Date(booking.createdAt).toLocaleDateString()}</p>
      </div>

      {onRemove && (
        <button
          onClick={() => onRemove(booking.id)}
          className="text-slate-600 hover:text-red-400 transition-colors text-sm"
        >
          ✕
        </button>
      )}
    </div>
  );
}
