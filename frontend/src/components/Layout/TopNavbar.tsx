import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDisruptionStore } from '@/store/disruptionStore';

/* Icons */
const BellIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);
const UserIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const LogOutIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function TopNavbar() {
  const { user, logout } = useAuth();
  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Traveller';
  const disruptions = useDisruptionStore(s => s.disruptions);
  const unackedCount = disruptions.filter(d => d.status === 'ACTIVE' && !d.isAcknowledged).length;

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-dust-grey/50 bg-platinum/95 sticky top-0 z-30" style={{ backdropFilter: 'blur(8px)' }}>
      <Link to="/dashboard" className="font-serif text-xl font-semibold tracking-tight text-charcoal cursor-pointer select-none">
        Wander<span style={{ color: '#d77a61' }}>Sync</span>
      </Link>

      <div className="flex items-center gap-1">
        <Link
          to="/disruptions"
          className="relative p-2 rounded-lg text-charcoal/50 hover:text-charcoal hover:bg-dust-grey/30 transition-colors duration-150 cursor-pointer"
          title="Disruptions"
        >
          <BellIcon />
          {unackedCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#c96248] rounded-full border-2 border-platinum"></span>
          )}
        </Link>

        <div className="flex items-center gap-2 ml-2 pl-3 border-l border-dust-grey/50">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(215,122,97,0.15)', color: '#d77a61' }}>
            <UserIcon />
          </div>
          <span className="text-sm font-medium text-charcoal/70 max-w-[120px] truncate">{displayName}</span>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-charcoal/40 hover:text-charcoal/70 hover:bg-dust-grey/30 transition-colors duration-150 cursor-pointer"
            title="Sign out"
          >
            <LogOutIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
