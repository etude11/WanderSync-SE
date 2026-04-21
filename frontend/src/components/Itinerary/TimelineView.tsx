import type { Booking } from '@/types';
import BookingCard from './BookingCard';
import EmptyState from '@/components/Shared/EmptyState';

interface TimelineViewProps {
  bookings: Booking[];
  onRemoveBooking?: (id: string) => void;
}

export default function TimelineView({ bookings, onRemoveBooking }: TimelineViewProps) {
  if (bookings.length === 0) {
    return (
      <EmptyState
        icon="✈️"
        title="No bookings yet"
        description="Add a flight, hotel, or transport booking to see your timeline."
      />
    );
  }

  const sorted = [...bookings].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="relative pl-10">
      <div className="timeline-line" />
      <div className="space-y-4">
        {sorted.map((booking, i) => (
          <div key={booking.id} className="relative">
            {/* Timeline dot */}
            <div
              className={`absolute -left-[34px] top-4 w-3 h-3 rounded-full border-2 transition-colors duration-300 ${
                booking.disrupted
                  ? 'bg-red-500 border-red-400'
                  : 'bg-brand-500 border-brand-400'
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            />
            <BookingCard booking={booking} onRemove={onRemoveBooking} />
          </div>
        ))}
      </div>
    </div>
  );
}
