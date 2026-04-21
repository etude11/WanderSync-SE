import type { NearbyTraveler } from '@/types';

interface ConsentModalProps {
  traveler: NearbyTraveler;
  onConsent: () => Promise<void>;
  onClose: () => void;
}

export default function ConsentModal({ traveler, onConsent, onClose }: ConsentModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card max-w-sm w-full mx-4 animate-slide-up">
        <h2 className="text-lg font-semibold text-white mb-2">Connect with traveler?</h2>
        <p className="text-sm text-slate-400 mb-1">
          This traveler is near <span className="text-slate-300 font-medium">{traveler.region}</span>{' '}
          during your trip.
        </p>
        <p className="text-xs text-slate-500 mb-5">
          By connecting, you both agree to share contact details. This requires mutual consent.
        </p>
        <div className="flex gap-2">
          <button onClick={onConsent} className="btn-primary flex-1">Request connection</button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}
