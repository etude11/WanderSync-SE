import { useState } from 'react';
import type { NearbyTraveler } from '@/types';
import TravelerCard from './TravelerCard';
import ConsentModal from './ConsentModal';
import EmptyState from '@/components/Shared/EmptyState';
import { socialAPI } from '@/services/socialAPI';

interface NearbyTravelersProps {
  travelers: NearbyTraveler[];
  onUpdate: () => void;
}

export default function NearbyTravelers({ travelers, onUpdate }: NearbyTravelersProps) {
  const [selected, setSelected] = useState<NearbyTraveler | null>(null);

  const handleConsent = async () => {
    if (!selected) return;
    await socialAPI.consent(selected.id);
    setSelected(null);
    onUpdate();
  };

  if (travelers.length === 0) {
    return (
      <EmptyState
        icon="🌍"
        title="No nearby travelers"
        description="When travelers with overlapping itineraries are found, they'll appear here."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {travelers.map((t) => (
          <TravelerCard key={t.id} traveler={t} onConnect={setSelected} />
        ))}
      </div>
      {selected && (
        <ConsentModal
          traveler={selected}
          onConsent={handleConsent}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
