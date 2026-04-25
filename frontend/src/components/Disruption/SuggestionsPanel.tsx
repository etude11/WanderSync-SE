import { useState, useEffect } from 'react';
import { disruptionAPI } from '@/services/disruptionAPI';
import LoadingSpinner from '../Shared/LoadingSpinner';

export default function SuggestionsPanel({ eventId }: { eventId: string }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    disruptionAPI.suggestions(eventId)
      .then(res => setSuggestions(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <LoadingSpinner size="sm" className="h-12" />;

  if (error) {
    return (
      <div className="mt-3 bg-white/80 rounded-lg p-3 text-sm text-charcoal/60">
        Could not load suggestions. Please try again.
      </div>
    );
  }

  return (
    <div className="mt-3 bg-white/80 rounded-lg p-3 text-sm">
      <p className="font-semibold text-charcoal mb-2">Recommended Actions:</p>
      <ul className="list-disc pl-5 space-y-1 text-charcoal/80">
        {suggestions.map((sug, i) => (
          <li key={i}>{sug}</li>
        ))}
      </ul>
    </div>
  );
}
