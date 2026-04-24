import { useState } from 'react';
import type { Booking, BookingType } from '@/types';
import BookingCard from './BookingCard';

interface TimelineViewProps {
  bookings: Booking[];
  onRemoveBooking?: (id: string) => void;
}

type Filter = BookingType | 'ALL';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL',       label: 'All' },
  { value: 'FLIGHT',    label: 'Flights' },
  { value: 'HOTEL',     label: 'Hotels' },
  { value: 'TRANSPORT', label: 'Transport' },
];

export default function TimelineView({ bookings, onRemoveBooking }: TimelineViewProps) {
  const [filter, setFilter] = useState<Filter>('ALL');

  const sorted = [...bookings].sort(
    (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
  );

  const visible = filter === 'ALL' ? sorted : sorted.filter((b) => b.type === filter);

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors cursor-pointer ${
              filter === f.value
                ? 'border-burnt-peach/50 bg-burnt-peach/10 text-burnt-peach'
                : 'border-dust-grey/60 bg-white text-charcoal/50 hover:border-dust-grey hover:text-charcoal/70'
            }`}
          >
            {f.label}
            {f.value !== 'ALL' && (
              <span className="ml-1 opacity-60">
                ({sorted.filter((b) => b.type === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-10 rounded-2xl border border-dashed border-dust-grey/60 bg-white/50">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(216,180,160,0.18)' }}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#d8b4a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-charcoal/50">
            {filter === 'ALL' ? 'No bookings yet' : `No ${filter.toLowerCase()} bookings`}
          </p>
          <p className="text-xs text-charcoal/35 mt-1">
            {filter === 'ALL'
              ? 'Add a flight, hotel, or transport booking to build your timeline.'
              : 'Try a different filter or add a new booking.'}
          </p>
        </div>
      ) : (
        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-[9px] top-4 bottom-4 w-px" style={{ background: 'linear-gradient(to bottom, rgba(215,122,97,0.40), rgba(216,180,160,0.25), transparent)' }} />

          <div className="space-y-3">
            {visible.map((booking, i) => (
              <div key={booking.id} className="relative animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <div
                  className="absolute -left-[31px] top-4 w-2.5 h-2.5 rounded-full border-2 border-white"
                  style={{
                    background: booking.disrupted ? '#d77a61' : '#dbd3d8',
                    boxShadow: booking.disrupted ? '0 0 6px rgba(215,122,97,0.5)' : 'none',
                  }}
                />
                <BookingCard booking={booking} onRemove={onRemoveBooking} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
