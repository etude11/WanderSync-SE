import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/* Icons */
const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
  ) : (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88A3 3 0 1 0 14.12 14.12M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
  );

const MailIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);

const PlaneIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z" /></svg>
);

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-platinum flex items-center justify-center px-4 relative overflow-hidden">

      {/* Pastel blooms — solid, no blur */}
      <div className="absolute pointer-events-none" style={{ top: '-80px', left: '-60px', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(216,180,160,0.22) 0%, transparent 70%)' }} />
      <div className="absolute pointer-events-none" style={{ bottom: '-60px', right: '-60px', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(215,122,97,0.13) 0%, transparent 70%)' }} />

      {/* Dot pattern */}
      <div className="absolute inset-0 pointer-events-none pastel-dots opacity-30" />

      {/* Decorative plane */}
      <div className="absolute top-16 right-16 text-desert-sand/30 animate-float hidden md:block">
        <PlaneIcon />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">

        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block font-serif text-2xl font-semibold tracking-tight select-none cursor-pointer text-charcoal">
            Wander<span style={{ color: '#d77a61' }}>Sync</span>
          </Link>
          <p className="mt-2 text-sm text-charcoal/45">Welcome back</p>
        </div>

        {/* Card — solid white, no glass */}
        <div className="rounded-2xl p-7 shadow-card bg-white border border-dust-grey/60">

          {/* Error */}
          {error && (
            <div role="alert" aria-live="polite" className="mb-5 flex items-start gap-2.5 rounded-xl px-3.5 py-3 animate-scale-in" style={{ background: 'rgba(215,122,97,0.08)', border: '1px solid rgba(215,122,97,0.25)' }}>
              <svg className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#d77a61' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="text-sm" style={{ color: '#c96248' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-charcoal/55 mb-1.5 tracking-wide">Email address</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(34,56,67,0.35)' }}><MailIcon /></span>
                <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field pl-10" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-charcoal/55 mb-1.5 tracking-wide">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(34,56,67,0.35)' }}><LockIcon /></span>
                <input id="password" type={showPwd ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-field pl-10 pr-11" />
                <button type="button" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors cursor-pointer" style={{ color: 'rgba(34,56,67,0.40)' }}><EyeIcon open={showPwd} /></button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm mt-2">
              {loading ? (<><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Signing in…</>) : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-5 pt-5 border-t border-dust-grey/50">
            <p className="text-center text-xs" style={{ color: 'rgba(34,56,67,0.40)' }}>
              No account?{' '}<Link to="/register" className="font-semibold transition-colors cursor-pointer" style={{ color: '#d77a61' }}>Create one</Link>
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px]" style={{ color: 'rgba(34,56,67,0.30)' }}>Your account is kept safe with secure sign-in.</p>
      </div>
    </div>
  );
}
