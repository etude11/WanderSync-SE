import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { itineraryAPI } from '@/services/itineraryAPI';
import { disruptionAPI } from '@/services/disruptionAPI';
import type { Itinerary, Disruption } from '@/types';
import AlertBanner from '@/components/Disruption/AlertBanner';
import TimelineView from '@/components/Itinerary/TimelineView';
import LoadingSpinner from '@/components/Shared/LoadingSpinner';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      itineraryAPI.list().then((r) => setItineraries(r.data)),
      disruptionAPI.mine().then((r) => setDisruptions(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const latest = itineraries[0];

  if (loading) return <LoadingSpinner size="lg" className="h-64" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-sm text-slate-400 mt-1">Here's your travel overview</p>
      </div>

      <AlertBanner disruptions={disruptions} />

      {latest ? (
        <div>
          <h2 className="text-base font-semibold text-slate-300 mb-3">
            {latest.title} · Timeline
          </h2>
          <TimelineView bookings={latest.bookings} />
        </div>
      ) : (
        <p className="text-sm text-slate-500">No itineraries yet. Head to Itinerary to create one.</p>
      )}
    </div>
  );
}
