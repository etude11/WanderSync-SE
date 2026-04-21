import type { Disruption } from '@/types';

interface AlertBannerProps {
  disruptions: Disruption[];
}

export default function AlertBanner({ disruptions }: AlertBannerProps) {
  const active = disruptions.filter((d) => !d.resolved);
  if (active.length === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-lg bg-red-950/60 border border-red-800/50 animate-slide-up">
      <span className="text-lg">⚡</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-300">
          {active.length} active disruption{active.length !== 1 ? 's' : ''} detected
        </p>
        <p className="text-xs text-red-400/80 truncate">{active[0].description}</p>
      </div>
    </div>
  );
}
