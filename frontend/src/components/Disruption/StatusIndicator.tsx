import type { DisruptionSeverity } from '@/types';

const config: Record<DisruptionSeverity, { color: string; label: string }> = {
  LOW:      { color: 'bg-yellow-400', label: 'Low' },
  MEDIUM:   { color: 'bg-orange-400', label: 'Medium' },
  HIGH:     { color: 'bg-red-500', label: 'High' },
  CRITICAL: { color: 'bg-red-700 animate-pulse', label: 'Critical' },
};

export default function StatusIndicator({ severity }: { severity: DisruptionSeverity }) {
  const { color, label } = config[severity];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-medium text-slate-400">{label}</span>
    </span>
  );
}
