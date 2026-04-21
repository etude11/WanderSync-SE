import { useEffect, useState } from 'react';
import { disruptionAPI } from '@/services/disruptionAPI';
import type { Disruption } from '@/types';
import AlertBanner from '@/components/Disruption/AlertBanner';
import DisruptionList from '@/components/Disruption/DisruptionList';
import LoadingSpinner from '@/components/Shared/LoadingSpinner';

export default function DisruptionPage() {
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    disruptionAPI.mine().then((r) => setDisruptions(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="h-64" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Disruptions</h1>
      <AlertBanner disruptions={disruptions} />
      <DisruptionList disruptions={disruptions} />
    </div>
  );
}
