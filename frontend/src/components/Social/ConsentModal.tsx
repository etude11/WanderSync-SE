import type { NearbyTraveler } from '@/types';

const XIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const ShieldIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

interface ConsentModalProps {
  traveler: NearbyTraveler;
  onConsent: () => Promise<void>;
  onClose: () => void;
}

export default function ConsentModal({ traveler, onConsent, onClose }: ConsentModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/25 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-sm mx-4 animate-scale-in shadow-card-hover">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span style={{ color: '#d77a61' }}><ShieldIcon /></span>
            <h2 className="font-serif text-base font-semibold text-charcoal">Privacy Consent</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-charcoal/40 hover:text-charcoal hover:bg-dust-grey/30 transition-colors cursor-pointer">
            <XIcon />
          </button>
        </div>

        <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(216,180,160,0.14)', border: '1px solid rgba(216,180,160,0.35)' }}>
          <p className="text-xs text-charcoal/65 leading-relaxed">
            By connecting, you allow this traveller to see your approximate city-level location during the overlapping period{' '}
            <strong className="text-charcoal/80">{traveler.region}</strong>.
            Your precise location is never shared without full mutual consent.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onConsent}
            className="btn-primary flex-1 py-2.5 text-sm"
          >
            Allow City-Level
          </button>
          <button onClick={onClose} className="btn-secondary px-5 text-sm">Decline</button>
        </div>
      </div>
    </div>
  );
}
