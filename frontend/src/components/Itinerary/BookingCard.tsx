import type { Booking, BookingType } from '@/types';
import { useDisruptionStore } from '@/store/disruptionStore';
import AlertBanner from '@/components/Disruption/AlertBanner';

const PlaneIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z" />
  </svg>
);
const HotelIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14M3 21h18M9 21V12h6v9" />
    <rect x="9" y="7" width="2" height="2" /><rect x="13" y="7" width="2" height="2" />
  </svg>
);
const BusIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M8 6v6M15 6v6M2 12h19.6" />
    <path d="M5 18v2m14-2v2" />
  </svg>
);
const BoltIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const TYPE_META: Record<BookingType, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  FLIGHT:    { icon: <PlaneIcon />, label: 'Flight',    color: '#223843', bg: 'rgba(34,56,67,0.08)' },
  HOTEL:     { icon: <HotelIcon />, label: 'Hotel',     color: '#9a6030', bg: 'rgba(216,180,160,0.22)' },
  TRANSPORT: { icon: <BusIcon />,   label: 'Transport', color: '#5c4a8a', bg: 'rgba(219,211,216,0.30)' },
};

interface BookingCardProps {
  booking: Booking;
  onRemove?: (id: string) => void;
}

export default function BookingCard({ booking, onRemove }: BookingCardProps) {
  const meta = TYPE_META[booking.type] ?? TYPE_META.FLIGHT;
  const disruptions = useDisruptionStore(s => s.disruptions);
  const activeDisruptions = disruptions.filter(d => 
    d.status === 'ACTIVE' && !d.isAcknowledged &&
    (d.flightIata === booking.providerRef || d.affectedOrigin === booking.origin)
  );

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`relative rounded-xl px-4 py-3 border transition-all duration-200 ${
          booking.disrupted
            ? 'border-burnt-peach/30 bg-burnt-peach/5'
            : 'border-dust-grey/60 bg-white hover:border-dust-grey hover:shadow-soft'
        }`}
      >
      {booking.disrupted && (
        <span className="absolute top-2.5 right-3 flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(215,122,97,0.12)', color: '#d77a61', border: '1px solid rgba(215,122,97,0.25)' }}>
          <BoltIcon /> Disrupted
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.bg, color: meta.color }}>
          {meta.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: meta.color, opacity: 0.7 }}>{meta.label}</span>
          </div>
          <p className="text-sm font-semibold text-charcoal font-mono">{booking.providerRef} · {booking.origin} → {booking.destination}</p>
          <p className="text-xs text-charcoal/40 mt-0.5 font-sans">{new Date(booking.departureTime).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        {onRemove && (
          <button
            onClick={() => onRemove(booking.id)}
            className="p-1.5 rounded-lg text-charcoal/30 hover:text-burnt-peach hover:bg-burnt-peach/8 transition-colors duration-150 cursor-pointer shrink-0 mt-0.5"
            title="Remove booking"
          >
            <TrashIcon />
          </button>
        )}
      </div>
      </div>
      
      {booking.disrupted && activeDisruptions.length > 0 && (
        <AlertBanner disruptions={activeDisruptions} />
      )}
    </div>
  );
}
