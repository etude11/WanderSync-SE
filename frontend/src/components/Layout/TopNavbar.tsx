import { useAuth } from '@/hooks/useAuth';

export default function TopNavbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
      <span className="text-lg font-semibold tracking-tight text-white">
        Wander<span className="text-brand-400">Sync</span>
      </span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-400">{user?.email}</span>
        <button onClick={logout} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
          Sign out
        </button>
      </div>
    </header>
  );
}
