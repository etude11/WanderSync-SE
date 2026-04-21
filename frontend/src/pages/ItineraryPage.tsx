import { useEffect, useState } from 'react';
import { itineraryAPI } from '@/services/itineraryAPI';
import type { Itinerary, BookingType } from '@/types';
import TimelineView from '@/components/Itinerary/TimelineView';
import AddBookingModal from '@/components/Itinerary/AddBookingModal';
import LoadingSpinner from '@/components/Shared/LoadingSpinner';
import EmptyState from '@/components/Shared/EmptyState';

export default function ItineraryPage() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [selected, setSelected] = useState<Itinerary | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () =>
    itineraryAPI.list().then((r) => {
      setItineraries(r.data);
      setSelected((prev) => r.data.find((i) => i.id === prev?.id) ?? r.data[0] ?? null);
    });

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const handleAddBooking = async (data: { providerKey: string; providerRef: string; type: BookingType }) => {
    if (!selected) return;
    await itineraryAPI.addBooking(selected.id, data);
    await load();
  };

  const handleRemoveBooking = async (bookingId: string) => {
    await itineraryAPI.removeBooking(bookingId);
    await load();
  };

  if (loading) return <LoadingSpinner size="lg" className="h-64" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Itinerary</h1>
        {selected && (
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
            + Add Booking
          </button>
        )}
      </div>

      {itineraries.length === 0 ? (
        <EmptyState
          icon="🗓️"
          title="No itineraries"
          description="Create an itinerary to get started."
        />
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {itineraries.map((it) => (
              <button
                key={it.id}
                onClick={() => setSelected(it)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  selected?.id === it.id
                    ? 'bg-brand-600/20 border-brand-600/40 text-brand-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {it.title}
              </button>
            ))}
          </div>

          {selected && (
            <TimelineView bookings={selected.bookings} onRemoveBooking={handleRemoveBooking} />
          )}
        </>
      )}

      {showModal && selected && (
        <AddBookingModal
          itineraryId={selected.id}
          onAdd={handleAddBooking}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
