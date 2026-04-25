import { useState } from 'react';
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
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const TYPE_META: Record<BookingType, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  FLIGHT:    { icon: <PlaneIcon />, label: 'Flight',    color: '#223843', bg: 'rgba(34,56,67,0.08)' },
  HOTEL:     { icon: <HotelIcon />, label: 'Hotel',     color: '#9a6030', bg: 'rgba(216,180,160,0.22)' },
  TRANSPORT: { icon: <BusIcon />,   label: 'Transport', color: '#5c4a8a', bg: 'rgba(219,211,216,0.30)' },
};

function fmt(date: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', ...opts });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/40 shrink-0">{label}</span>
      <span className="text-xs text-charcoal/70 font-mono text-right">{value}</span>
    </div>
  );
}

interface BookingCardProps {
  booking: Booking;
  onRemove?: (id: string) => void;
}

export default function BookingCard({ booking, onRemove }: BookingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[booking.type] ?? TYPE_META.FLIGHT;
  const disruptions = useDisruptionStore(s => s.disruptions);
  const activeDisruptions = disruptions.filter(d =>
    d.status === 'ACTIVE' && !d.isAcknowledged &&
    (d.flightIata === booking.providerRef || d.affectedOrigin === booking.origin)
  );

  const depDate  = fmt(booking.departureTime, { day: '2-digit', month: 'short', year: 'numeric' });
  const depTime  = fmt(booking.departureTime, { hour: '2-digit', minute: '2-digit' });
  const arrDate  = fmt(booking.arrivalTime,   { day: '2-digit', month: 'short', year: 'numeric' });
  const arrTime  = fmt(booking.arrivalTime,   { hour: '2-digit', minute: '2-digit' });

  const durationMs  = new Date(booking.arrivalTime).getTime() - new Date(booking.departureTime).getTime();
  const durationHrs = Math.floor(durationMs / 3600000);
  const durationMin = Math.round((durationMs % 3600000) / 60000);
  const duration    = durationHrs > 0 ? `${durationHrs}h ${durationMin}m` : `${durationMin}m`;

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`relative rounded-xl border transition-all duration-200 overflow-hidden ${
          booking.disrupted
            ? 'border-burnt-peach/30 bg-burnt-peach/5'
            : 'border-dust-grey/60 bg-white hover:border-dust-grey hover:shadow-soft'
        }`}
      >
        {/* Clickable header row */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full text-left px-4 py-3 cursor-pointer"
        >
          {booking.disrupted && (
            <span className="absolute top-2.5 right-10 flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(215,122,97,0.12)', color: '#d77a61', border: '1px solid rgba(215,122,97,0.25)' }}>
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
              <p className="text-xs text-charcoal/40 mt-0.5 font-sans">{depDate} · {depTime}</p>
            </div>

            <span className="text-charcoal/30 mt-1 shrink-0">
              <ChevronIcon open={expanded} />
            </span>
          </div>
        </button>

        {/* Expanded detail panel */}
        {expanded && (
          <div className="px-4 pb-3 pt-0 border-t border-dust-grey/40 space-y-1.5 animate-fade-in">
            <DetailRow label="Reference"  value={booking.providerRef} />
            <DetailRow label="From"       value={booking.origin} />
            <DetailRow label="To"         value={booking.destination} />
            <DetailRow label={booking.type === 'HOTEL' ? 'Check-in' : 'Departure'} value={`${depDate} · ${depTime}`} />
            <DetailRow label={booking.type === 'HOTEL' ? 'Check-out' : 'Arrival'}  value={`${arrDate} · ${arrTime}`} />
            <DetailRow label="Duration"   value={duration} />
            <DetailRow label="Status"     value={booking.disrupted ? 'Disrupted' : 'On Schedule'} />

            {onRemove && (
              <div className="pt-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(booking.id); }}
                  className="flex items-center gap-1.5 text-[11px] text-charcoal/35 hover:text-burnt-peach transition-colors cursor-pointer"
                >
                  <TrashIcon /> Remove booking
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {booking.disrupted && activeDisruptions.length > 0 && (
        <AlertBanner disruptions={activeDisruptions} />
      )}
    </div>
  );
}
