import { useEffect, useState } from 'react';
import { disruptionAPI } from '@/services/disruptionAPI';
import type { Disruption } from '@/types';
import DisruptionList from '@/components/Disruption/DisruptionList';
import LoadingSpinner from '@/components/Shared/LoadingSpinner';

const RefreshIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);
const BoltIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
  </svg>
);

export default function DisruptionPage() {
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [simulating, setSimulating]   = useState(false);

  const load = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const r = await disruptionAPI.mine();
      setDisruptions(r.data);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner size="lg" className="h-64" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-charcoal">Disruptions</h1>
          <p className="text-sm text-charcoal/45 mt-0.5">
            {disruptions.length > 0
              ? `${disruptions.length} alert${disruptions.length !== 1 ? 's' : ''}`
              : 'All systems clear'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSimulating(true);
              disruptionAPI.simulateDemo().then(() => load(true)).finally(() => setSimulating(false));
            }}
            disabled={simulating || refreshing}
            className="btn-secondary text-sm flex items-center gap-2 cursor-pointer"
            style={simulating ? {} : { color: '#d77a61', borderColor: 'rgba(215,122,97,0.35)' }}
          >
            <span className={simulating ? 'animate-pulse' : ''}><BoltIcon /></span>
            {simulating ? 'Simulating…' : 'Simulate Disruption'}
          </button>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn-secondary text-sm flex items-center gap-2 cursor-pointer"
          >
            <span className={refreshing ? 'animate-spin' : ''}><RefreshIcon /></span>
            Refresh
          </button>
        </div>
      </div>

      <DisruptionList disruptions={disruptions} />
    </div>
  );
}
