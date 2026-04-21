import type { BookingType } from '@/types';

interface ProviderBadgeProps {
  providerKey: string;
  type: BookingType;
}

const typeColors: Record<BookingType, string> = {
  FLIGHT: 'bg-sky-900/50 text-sky-300 border-sky-700',
  HOTEL: 'bg-violet-900/50 text-violet-300 border-violet-700',
  TRANSPORT: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
};

const typeIcons: Record<BookingType, string> = {
  FLIGHT: '✈️',
  HOTEL: '🏨',
  TRANSPORT: '🚌',
};

export default function ProviderBadge({ providerKey, type }: ProviderBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${typeColors[type]}`}
    >
      {typeIcons[type]} {providerKey}
    </span>
  );
}
