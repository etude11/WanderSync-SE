import type { Disruption } from '@/types';

const BoltIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
  </svg>
);

interface AlertBannerProps {
  disruptions: Disruption[];
}

export default function AlertBanner({ disruptions }: AlertBannerProps) {
  const active = disruptions.filter((d) => !d.resolved);
  if (active.length === 0) return null;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl border animate-slide-up"
      style={{ background: 'rgba(215,122,97,0.08)', borderColor: 'rgba(215,122,97,0.28)' }}
    >
      <span style={{ color: '#d77a61', marginTop: '1px' }}><BoltIcon /></span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: '#c96248' }}>
          {active.length} active disruption{active.length !== 1 ? 's' : ''} detected
        </p>
        <p className="text-xs mt-0.5 text-charcoal/50 truncate">{active[0].description}</p>
      </div>
    </div>
  );
}
