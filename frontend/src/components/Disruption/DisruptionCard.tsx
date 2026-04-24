import { useState } from 'react';
import type { Disruption, DisruptionSeverityLabel } from '@/types';
import { severityLabel } from '@/types';
import SuggestionsPanel from './SuggestionsPanel';
import { disruptionAPI } from '@/services/disruptionAPI';
import { useDisruptionStore } from '@/store/disruptionStore';

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

export default function DisruptionCard({ d }: { d: Disruption }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const ackDisruption = useDisruptionStore(s => s.ackDisruption);
  const sev = SEV_META[severityLabel(d.severity)];

  const isResolved = d.status === 'RESOLVED';
  const isPast = isResolved || d.isAcknowledged;

  const handleAck = () => {
    disruptionAPI.ack(d.id).then(() => ackDisruption(d.id)).catch(console.error);
  };

  return (
    <div
      className={`rounded-xl px-4 py-3.5 border animate-fade-in ${isPast ? 'opacity-60 grayscale-[50%]' : ''}`}
      style={{ background: sev.bg, borderColor: sev.border }}
    >
      <div className="flex items-start gap-2.5">
        <span style={{ color: sev.color, marginTop: '2px' }}><BoltIcon /></span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5 justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-charcoal">{d.type.replace(/_/g, ' ')}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: sev.border, color: sev.color }}>
                {isResolved ? 'RESOLVED' : sev.label}
              </span>
            </div>
            {!isPast && (
              <button onClick={handleAck} className="text-xs text-charcoal/60 hover:text-charcoal underline">
                Acknowledge
              </button>
            )}
          </div>
          <p className="text-xs text-charcoal/60 leading-relaxed">{d.description}</p>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[11px] text-charcoal/35 font-mono">
              {new Date(isResolved && d.resolvedAt ? d.resolvedAt : d.publishedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
            <button 
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-[11px] font-medium text-charcoal/80 hover:text-charcoal"
            >
              {showSuggestions ? 'Hide Suggestions' : 'Get Suggestions'}
            </button>
          </div>
          {showSuggestions && <SuggestionsPanel eventId={d.id} />}
        </div>
      </div>
    </div>
  );
}
