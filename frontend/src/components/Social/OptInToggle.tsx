const ShieldIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </svg>
);

interface OptInToggleProps {
  enabled: boolean;
  onChange: (v: boolean) => void;
}

export default function OptInToggle({ enabled, onChange }: OptInToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl border transition-all duration-200 cursor-pointer"
      style={enabled
        ? { background: 'rgba(215,122,97,0.10)', borderColor: 'rgba(215,122,97,0.30)', color: '#d77a61' }
        : { background: 'white', borderColor: 'rgba(219,211,216,0.70)', color: 'rgba(34,56,67,0.55)' }
      }
      aria-pressed={enabled}
    >
      <ShieldIcon />
      {enabled ? 'Discovery On' : 'Discovery Off'}
      {/* Toggle pill */}
      <span
        className="ml-1 inline-flex w-8 h-4 rounded-full relative transition-all duration-200"
        style={{ background: enabled ? '#d77a61' : '#dbd3d8' }}
      >
        <span
          className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: enabled ? '18px' : '2px' }}
        />
      </span>
    </button>
  );
}
