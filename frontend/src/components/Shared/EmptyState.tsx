interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const DefaultIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4l3 3" />
  </svg>
);

export default function EmptyState({ icon = <DefaultIcon />, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center rounded-2xl border border-dashed border-dust-grey/60 bg-white/50 animate-fade-in">
      <div className="w-12 h-12 rounded-2xl mb-3 flex items-center justify-center" style={{ background: 'rgba(216,180,160,0.18)', color: '#d8b4a0' }}>
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-charcoal mb-1">{title}</h3>
      {description && <p className="text-xs text-charcoal/45 max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}
