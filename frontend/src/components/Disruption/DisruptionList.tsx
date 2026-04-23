import type { Disruption, DisruptionSeverityLabel } from '@/types';
import { severityLabel } from '@/types';

const SEV_META: Record<DisruptionSeverityLabel, { label: string; color: string; bg: string; border: string }> = {
  LOW:      { label: 'Low',      color: '#9a6030', bg: 'rgba(216,180,160,0.18)', border: 'rgba(216,180,160,0.40)' },
  MEDIUM:   { label: 'Medium',   color: '#b06020', bg: 'rgba(215,122,97,0.10)', border: 'rgba(215,122,97,0.25)' },
  HIGH:     { label: 'High',     color: '#d77a61', bg: 'rgba(215,122,97,0.14)', border: 'rgba(215,122,97,0.35)' },
  CRITICAL: { label: 'Critical', color: '#c96248', bg: 'rgba(215,122,97,0.18)', border: 'rgba(215,122,97,0.45)' },
};

const BoltIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
  </svg>
);
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

  return (
    <div className="space-y-3">
      {disruptions.map((d, i) => {
        const sev = SEV_META[severityLabel(d.severity)];
        return (
          <div
            key={d.id}
            className="rounded-xl px-4 py-3.5 border animate-fade-in"
            style={{ background: sev.bg, borderColor: sev.border, animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start gap-2.5">
              <span style={{ color: sev.color, marginTop: '2px' }}><BoltIcon /></span>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-charcoal">{d.type.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: sev.border, color: sev.color }}>{sev.label}</span>
                </div>
                <p className="text-xs text-charcoal/60 leading-relaxed">{d.description}</p>
                <p className="text-[11px] text-charcoal/35 mt-1.5 font-mono">
                  {new Date(d.publishedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
