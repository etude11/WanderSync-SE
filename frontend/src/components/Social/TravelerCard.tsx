import type { NearbyTraveler } from '@/types';

const MapPinIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);
const CalendarIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const LinkIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

interface TravelerCardProps {
  traveler: NearbyTraveler;
  onConnect: (t: NearbyTraveler) => void;
}

export default function TravelerCard({ traveler, onConnect }: TravelerCardProps) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

  return (
    <div className="rounded-xl px-4 py-3.5 border border-dust-grey/60 bg-white hover:shadow-soft transition-all duration-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Avatar initial */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-serif text-base font-semibold" style={{ background: 'rgba(216,180,160,0.20)', color: '#9a6030' }}>
            T
          </div>
          <div>
            <p className="text-sm font-semibold text-charcoal">Anonymous Traveller</p>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-charcoal/50">
              <MapPinIcon />
              <span>{traveler.region}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-charcoal/40">
              <CalendarIcon />
              <span>Overlaps {fmt(traveler.overlapStart)} – {fmt(traveler.overlapEnd)}</span>
            </div>
          </div>
        </div>

        {!traveler.consentGiven && (
          <button
            onClick={() => onConnect(traveler)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-150 shrink-0"
            style={{ background: 'rgba(215,122,97,0.10)', color: '#d77a61', border: '1px solid rgba(215,122,97,0.22)' }}
          >
            <LinkIcon /> Connect
          </button>
        )}
        {traveler.consentGiven && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(34,56,67,0.07)', color: '#223843' }}>Connected</span>
        )}
      </div>
    </div>
  );
}
