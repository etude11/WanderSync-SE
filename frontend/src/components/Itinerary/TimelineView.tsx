import type { Booking } from '@/types';
import BookingCard from './BookingCard';

interface TimelineViewProps {
  bookings: Booking[];
  onRemoveBooking?: (id: string) => void;
}

export default function TimelineView({ bookings, onRemoveBooking }: TimelineViewProps) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-10 rounded-2xl border border-dashed border-dust-grey/60 bg-white/50">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(216,180,160,0.18)' }}>
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#d8b4a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-charcoal/50">No bookings yet</p>
        <p className="text-xs text-charcoal/35 mt-1">Add a flight, hotel, or transport booking to build your timeline.</p>
      </div>
    );
  }

  const sorted = [...bookings].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-[9px] top-4 bottom-4 w-px" style={{ background: 'linear-gradient(to bottom, rgba(215,122,97,0.40), rgba(216,180,160,0.25), transparent)' }} />

      <div className="space-y-3">
        {sorted.map((booking, i) => (
          <div key={booking.id} className="relative animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            {/* Timeline dot */}
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
  );
}
