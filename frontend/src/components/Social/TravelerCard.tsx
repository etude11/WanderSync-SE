import type { NearbyTraveler } from '@/types';

interface TravelerCardProps {
  traveler: NearbyTraveler;
  onConnect: (t: NearbyTraveler) => void;
}

export default function TravelerCard({ traveler, onConnect }: TravelerCardProps) {
  return (
    <div className="card flex items-center justify-between gap-4 animate-slide-in-right hover:border-slate-700 transition-colors">
      <div>
        <p className="text-sm font-medium text-slate-200">📍 {traveler.region}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {new Date(traveler.overlapStart).toLocaleDateString()} – {new Date(traveler.overlapEnd).toLocaleDateString()}
        </p>
      </div>
      {traveler.consentGiven ? (
        <span className="text-xs text-emerald-400 font-medium">Connected</span>
      ) : (
        <button
          onClick={() => onConnect(traveler)}
          className="text-xs btn-secondary px-3 py-1.5"
        >
          Connect
        </button>
      )}
    </div>
  );
}
