import type { Disruption } from '@/types';
import StatusIndicator from './StatusIndicator';
import AlternativeSuggestions from './AlternativeSuggestions';
import EmptyState from '@/components/Shared/EmptyState';

interface DisruptionListProps {
  disruptions: Disruption[];
}

export default function DisruptionList({ disruptions }: DisruptionListProps) {
  if (disruptions.length === 0) {
    return (
      <EmptyState
        icon="✅"
        title="No disruptions"
        description="Your itinerary looks clear. We'll alert you if anything changes."
      />
    );
  }

  return (
    <div className="space-y-4">
      {disruptions.map((d) => (
        <div key={d.id} className="card animate-slide-up">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="text-sm font-semibold text-slate-200">{d.type}</p>
              <p className="text-xs text-slate-400 mt-0.5">{d.description}</p>
            </div>
            <StatusIndicator severity={d.severity} />
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Detected {new Date(d.detectedAt).toLocaleString()}
          </p>
          {!d.resolved && <AlternativeSuggestions disruption={d} />}
          {d.resolved && (
            <span className="text-xs text-emerald-400 font-medium">Resolved</span>
          )}
        </div>
      ))}
    </div>
  );
}
