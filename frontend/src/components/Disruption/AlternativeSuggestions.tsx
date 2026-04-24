import type { Disruption } from '@/types';

interface AlternativeSuggestionsProps {
  disruption: Disruption;
}

// Stub suggestions — real logic would come from the backend disruption module
function getSuggestions(disruption: Disruption): string[] {
  if (disruption.severity >= 4) {
    return ['Contact airline for rebooking', 'Check travel insurance', 'Monitor real-time updates'];
  }
  return ['Check for alternative flights', 'Update hotel check-in accordingly'];
}

export default function AlternativeSuggestions({ disruption }: AlternativeSuggestionsProps) {
  const suggestions = getSuggestions(disruption);

  return (
    <div className="mt-3 pl-4 border-l-2 border-brand-700">
      <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Suggestions</p>
      <ul className="space-y-1">
        {suggestions.map((s) => (
          <li key={s} className="text-sm text-slate-300 flex items-start gap-2">
            <span className="text-brand-400 mt-0.5">→</span> {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
