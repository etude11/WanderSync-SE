import type { Disruption } from '@/types';
import DisruptionCard from './DisruptionCard';

interface DisruptionListProps {
  disruptions: Disruption[];
}

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface DisruptionListProps {
  disruptions: Disruption[];
}

export default function DisruptionList({ disruptions }: DisruptionListProps) {
  if (disruptions.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl border border-dashed border-dust-grey/60 bg-white/50">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(219,211,216,0.25)' }}>
          <CheckIcon />
        </div>
        <p className="text-sm font-medium text-charcoal/55">All clear</p>
        <p className="text-xs text-charcoal/35 mt-1">No disruptions detected. We'll alert you if anything changes.</p>
      </div>
    );
  }

  const active = disruptions.filter(d => d.status === 'ACTIVE' && !d.isAcknowledged);
  const past = disruptions.filter(d => d.status === 'RESOLVED' || d.isAcknowledged);

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-charcoal/60 uppercase tracking-wider mb-2">Active Alerts</h2>
          {active.map(d => <DisruptionCard key={d.id} d={d} />)}
        </div>
      )}
      
      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-charcoal/40 uppercase tracking-wider mb-2">Past Disruptions</h2>
          {past.map(d => <DisruptionCard key={d.id} d={d} />)}
        </div>
      )}
    </div>
  );
}
