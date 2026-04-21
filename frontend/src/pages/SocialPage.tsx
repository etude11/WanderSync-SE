import { useEffect, useState } from 'react';
import { socialAPI } from '@/services/socialAPI';
import { itineraryAPI } from '@/services/itineraryAPI';
import type { NearbyTraveler, Itinerary } from '@/types';
import NearbyTravelers from '@/components/Social/NearbyTravelers';
import OptInToggle from '@/components/Social/OptInToggle';
import LoadingSpinner from '@/components/Shared/LoadingSpinner';

export default function SocialPage() {
  const [optIn, setOptIn] = useState(false);
  const [travelers, setTravelers] = useState<NearbyTraveler[]>([]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTravelers = async (it: Itinerary) => {
    const r = await socialAPI.nearby(it.id);
    setTravelers(r.data);
  };

  useEffect(() => {
    itineraryAPI
      .list()
      .then((r) => {
        const first = r.data[0] ?? null;
        setItinerary(first);
        if (first) return loadTravelers(first);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="h-64" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Social</h1>
        <OptInToggle enabled={optIn} onChange={setOptIn} />
      </div>

      {!optIn ? (
        <div className="card text-center py-10">
          <p className="text-slate-400 text-sm">Enable social discovery to see nearby travelers.</p>
        </div>
      ) : itinerary ? (
        <NearbyTravelers
          travelers={travelers}
          onUpdate={() => loadTravelers(itinerary)}
        />
      ) : (
        <p className="text-sm text-slate-500">Create an itinerary first to discover nearby travelers.</p>
      )}
    </div>
  );
}
