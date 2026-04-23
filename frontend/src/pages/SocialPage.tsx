import { useEffect, useState } from 'react';
import { socialAPI } from '@/services/socialAPI';
import { itineraryAPI } from '@/services/itineraryAPI';
import type { NearbyTraveler, Itinerary } from '@/types';
import NearbyTravelers from '@/components/Social/NearbyTravelers';
import OptInToggle from '@/components/Social/OptInToggle';
import LoadingSpinner from '@/components/Shared/LoadingSpinner';

const UsersIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#dbd3d8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const ShieldOffIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#dbd3d8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

export default function SocialPage() {
  const [optIn, setOptIn]         = useState(false);
  const [travelers, setTravelers] = useState<NearbyTraveler[]>([]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading]     = useState(true);

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-charcoal">Social</h1>
          <p className="text-sm text-charcoal/45 mt-0.5">Discover travellers with overlapping journeys</p>
        </div>
        <OptInToggle enabled={optIn} onChange={setOptIn} />
      </div>

      {/* Content states */}
      {!optIn ? (
        <div className="text-center py-14 rounded-2xl border border-dashed border-dust-grey/60 bg-white/50">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(219,211,216,0.22)' }}>
            <ShieldOffIcon />
          </div>
          <p className="text-sm font-medium text-charcoal/55">Discovery is disabled</p>
          <p className="text-xs text-charcoal/35 mt-1 max-w-xs mx-auto">
            Toggle Discovery On to see anonymised travellers with overlapping city stops. Your precise location is never shared.
          </p>
        </div>
      ) : !itinerary ? (
        <div className="text-center py-14 rounded-2xl border border-dashed border-dust-grey/60 bg-white/50">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(219,211,216,0.22)' }}>
            <UsersIcon />
          </div>
          <p className="text-sm font-medium text-charcoal/55">No itinerary linked</p>
          <p className="text-xs text-charcoal/35 mt-1">Create an itinerary first to discover nearby travellers.</p>
        </div>
      ) : (
        <div>
          {/* Privacy note */}
          <div className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 mb-4" style={{ background: 'rgba(216,180,160,0.12)', border: '1px solid rgba(216,180,160,0.30)' }}>
            <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#9a6030' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            <p className="text-xs text-charcoal/55 leading-relaxed">
              Matches are city-level only. Names and precise locations are never revealed without mutual consent.
            </p>
          </div>

          <NearbyTravelers
            travelers={travelers}
            onUpdate={() => loadTravelers(itinerary)}
          />
        </div>
      )}
    </div>
  );
}
