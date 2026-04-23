import type { BookingType } from '@/types';

const PlaneIcon = () => (
  <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z" />
  </svg>
);
const HotelIcon = () => (
  <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14M3 21h18M9 21V12h6v9" />
    <rect x="9" y="7" width="2" height="2" /><rect x="13" y="7" width="2" height="2" />
  </svg>
);
const BusIcon = () => (
  <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M8 6v6M15 6v6M2 12h19.6" />
    <path d="M5 18v2m14-2v2" />
  </svg>
);

interface ProviderBadgeProps {
  providerKey: string;
  type: BookingType;
}

const META: Record<BookingType, { icon: React.ReactNode; color: string; bg: string }> = {
  FLIGHT:    { icon: <PlaneIcon />, color: '#223843', bg: 'rgba(34,56,67,0.08)' },
  HOTEL:     { icon: <HotelIcon />, color: '#9a6030', bg: 'rgba(216,180,160,0.22)' },
  TRANSPORT: { icon: <BusIcon />,   color: '#5c4a8a', bg: 'rgba(219,211,216,0.30)' },
};

export default function ProviderBadge({ providerKey, type }: ProviderBadgeProps) {
  const meta = META[type] || META.FLIGHT;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase border"
      style={{ background: meta.bg, color: meta.color, borderColor: `${meta.color}20` }}
    >
      {meta.icon} <span className="mt-0.5">{providerKey}</span>
    </span>
  );
}
