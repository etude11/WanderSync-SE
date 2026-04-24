import { useEffect, useState } from 'react';
import { itineraryAPI } from '@/services/itineraryAPI';
import type { Itinerary, Booking, BookingType } from '@/types';
import TimelineView from '@/components/Itinerary/TimelineView';
import AddBookingModal from '@/components/Itinerary/AddBookingModal';
import LoadingSpinner from '@/components/Shared/LoadingSpinner';

/* Icons */
const PlusIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);


export default function ItineraryPage() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [selected, setSelected]       = useState<Itinerary | null>(null);
  const [showModal, setShowModal]     = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const [newTitle, setNewTitle]       = useState('');
  const [creating, setCreating]       = useState(false);
  const [loading, setLoading]         = useState(true);

  const load = () =>
    itineraryAPI.list().then((r) => {
      setItineraries(r.data);
      setSelected((prev) => r.data.find((i) => i.id === prev?.id) ?? r.data[0] ?? null);
    });

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const sortByDep = (bookings: Booking[]) =>
    [...bookings].sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());

  const handleAddBooking = async (data: { providerRef: string; type: BookingType; departureTime: string; arrivalTime: string; origin: string; destination: string }) => {
    if (!selected) return;
    const r = await itineraryAPI.addBooking(selected.id, data);
    const newBooking = r.data;
    setItineraries((prev) =>
      prev.map((it) => it.id === selected.id
        ? { ...it, bookings: sortByDep([...(it.bookings ?? []), newBooking]) }
        : it
      )
    );
    setSelected((prev) => prev
      ? { ...prev, bookings: sortByDep([...(prev.bookings ?? []), newBooking]) }
      : prev
    );
  };

  const handleRemoveBooking = async (bookingId: string) => {
    if (!selected) return;
    const previousBookings = selected.bookings ?? [];
    const updated = { ...selected, bookings: previousBookings.filter((b) => b.id !== bookingId) };
    setSelected(updated);
    setItineraries((prev) => prev.map((it) => it.id === selected.id ? updated : it));
    try {
      await itineraryAPI.removeBooking(selected.id, bookingId);
    } catch {
      setSelected((prev) => prev ? { ...prev, bookings: previousBookings } : prev);
      setItineraries((prev) => prev.map((it) => it.id === selected.id ? { ...it, bookings: previousBookings } : it));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this itinerary and all its bookings?')) return;
    const remaining = itineraries.filter((it) => it.id !== id);
    setItineraries(remaining);
    setSelected((prev) => prev?.id === id ? (remaining[0] ?? null) : prev);
    await itineraryAPI.remove(id);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await itineraryAPI.create({ title: newTitle.trim() });
      setNewTitle('');
      setShowCreate(false);
      await load();
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="h-64" />;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-charcoal">Itinerary</h1>
          <p className="text-sm text-charcoal/45 mt-0.5">Manage your travel plans</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm flex items-center gap-2 cursor-pointer">
          <PlusIcon /> New Itinerary
        </button>
      </div>

      {/* Create inline form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="card flex items-center gap-3 animate-scale-in">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Trip title (e.g. Europe 2026)"
            className="input-field flex-1"
            autoFocus
          />
          <button type="submit" disabled={creating} className="btn-primary text-sm px-4 py-2">
            {creating ? 'Creating…' : 'Create'}
          </button>
          <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
        </form>
      )}

      {itineraries.length === 0 ? (
        <div className="text-center py-14 rounded-2xl border border-dashed border-dust-grey/60 bg-white/50">
          <p className="text-sm font-medium text-charcoal/55">No itineraries yet</p>
          <p className="text-xs text-charcoal/35 mt-1">Click "New Itinerary" to create your first trip.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Sidebar: itinerary list */}
          <div className="lg:col-span-1 space-y-2">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-charcoal/40 mb-3">Your Trips</h2>
            {itineraries.map((it) => (
              <div
                key={it.id}
                className={`rounded-xl px-3.5 py-3 border cursor-pointer transition-all duration-150 ${
                  selected?.id === it.id
                    ? 'border-burnt-peach/30 bg-burnt-peach/6'
                    : 'border-dust-grey/60 bg-white hover:border-dust-grey hover:shadow-soft'
                }`}
                onClick={() => setSelected(it)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-charcoal truncate">{it.title}</span>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(it.id); }}
                      className="p-1 rounded-md text-charcoal/30 hover:text-burnt-peach transition-colors cursor-pointer"
                      title="Delete itinerary"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-charcoal/40 mt-0.5">
                  {it.bookings?.length ?? 0} booking{(it.bookings?.length ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>

          {/* Main: timeline */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="bg-white rounded-2xl border border-dust-grey/50 p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-serif text-lg font-semibold text-charcoal flex items-center gap-2">
                    {selected.title}
                    <span className="text-xs font-sans font-normal text-charcoal/35">· Timeline</span>
                  </h2>
                  <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusIcon /> Add Booking
                  </button>
                </div>
                <TimelineView bookings={selected.bookings ?? []} onRemoveBooking={handleRemoveBooking} />
              </div>
            ) : null}
          </div>
        </div>
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
