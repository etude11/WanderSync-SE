import { Link } from 'react-router-dom';
import FlightAnimation from '@/components/Shared/FlightAnimation';

/* ── SVG Icons ─────────────────────────────────────────────────────────────── */
const Arrow = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
);
const Calendar = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);
const Bolt = ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" /></svg>
);
const Users = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const Plane = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z" /></svg>
);
const Hotel = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14" /><path d="M3 21h18" /><path d="M9 21V12h6v9" /><rect x="9" y="7" width="2" height="2" /><rect x="13" y="7" width="2" height="2" /></svg>
);
const Bus = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M8 6v6M15 6v6M2 12h19.6M18 18h2a1 1 0 0 0 1-1v-5H3v5a1 1 0 0 0 1 1h2" /><path d="M5 18v2m14-2v2" /></svg>
);
const Shield = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>
);

/* ── Demo data ─────────────────────────────────────────────────────────────── */
const DEMO = [
  { type: 'flight',    label: 'JFK → LHR',       detail: 'AA 106 · Jun 12, 08:45',  bad: false },
  { type: 'hotel',     label: 'The Shard Hotel',  detail: 'Jun 12–15 · London',      bad: false },
  { type: 'flight',    label: 'LHR → CDG',        detail: 'BA 303 · Jun 15, 14:20',  bad: true  },
  { type: 'transport', label: 'Eurostar to Paris', detail: 'Jun 15 · Rerouted',       bad: false },
];
const typeIcon: Record<string, React.ReactNode> = {
  flight: <Plane className="w-3.5 h-3.5" />, hotel: <Hotel className="w-3.5 h-3.5" />, transport: <Bus className="w-3.5 h-3.5" />,
};

const FEATURES = [
  { icon: <Calendar className="w-5 h-5" />, accent: '#d8b4a0', title: 'Unified Itinerary', desc: 'Flights, hotels, and transport aggregated into one chronological timeline.' },
  { icon: <Bolt className="w-5 h-5" />,     accent: '#223843', title: 'Disruption Alerts',  desc: 'Real-time flight monitoring with proactive re-routing suggestions.' },
  { icon: <Users className="w-5 h-5" />,    accent: '#d77a61', title: 'Social Discovery',   desc: 'Find travelers with overlapping itineraries — privacy-first.' },
  { icon: <Shield className="w-5 h-5" />,   accent: '#dbd3d8', title: 'Secure by Design',   desc: 'Bcrypt hashing, JWT sessions, and HTTPS-only communication.' },
];

/* ── Hero Card ─────────────────────────────────────────────────────────────── */
function HeroCard() {
  return (
    <div className="card shadow-card-hover animate-float">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-charcoal/50" />
          <span className="text-[11px] font-semibold text-charcoal/50 tracking-widest uppercase">Europe · Jun 12–18</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(215,122,97,0.12)', color: '#d77a61', border: '1px solid rgba(215,122,97,0.25)' }}>Live</span>
      </div>
      <div className="relative pl-6">
        <div className="timeline-line" />
        <div className="space-y-3.5">
          {DEMO.map((item, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-6 top-2 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: item.bad ? '#d77a61' : '#dbd3d8', boxShadow: item.bad ? '0 0 6px rgba(215,122,97,0.5)' : 'none' }} />
              <div className="rounded-xl px-3 py-2 border transition-colors" style={item.bad ? { background: 'rgba(215,122,97,0.08)', borderColor: 'rgba(215,122,97,0.22)' } : { background: 'rgba(239,241,243,0.7)', borderColor: 'rgba(219,211,216,0.5)' }}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span style={{ color: item.bad ? '#d77a61' : '#223843', opacity: item.bad ? 1 : 0.55 }}>{typeIcon[item.type]}</span>
                  <span className="text-sm font-semibold" style={{ color: item.bad ? '#d77a61' : '#223843' }}>{item.label}</span>
                  {item.bad && <Bolt className="w-3 h-3 ml-auto" style={{ color: '#d77a61' }} />}
                </div>
                <p className="text-[11px] font-mono" style={{ color: '#223843', opacity: 0.4 }}>{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2 border" style={{ background: 'rgba(215,122,97,0.07)', borderColor: 'rgba(215,122,97,0.20)' }}>
        <Bolt className="w-3.5 h-3.5 shrink-0" style={{ color: '#d77a61' }} />
        <p className="text-[11px] font-semibold leading-tight" style={{ color: '#c96248' }}>Flight delay detected — alternative route suggested</p>
      </div>
    </div>
  );
}

/* ── Landing Page ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-platinum text-charcoal overflow-x-hidden">

      {/* ─── Navbar ─── solid pastel, no glass */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-12 h-16 bg-platinum border-b border-dust-grey/50">
        <Link to="/" className="font-serif text-xl font-semibold tracking-tight text-charcoal select-none cursor-pointer">
          Wander<span style={{ color: '#d77a61' }}>Sync</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm font-medium text-charcoal/60 hover:text-charcoal transition-colors duration-150 px-3 py-1.5 cursor-pointer">Sign in</Link>
          <Link to="/register" className="btn-primary text-sm px-4 py-2 cursor-pointer">Plan Your Journey <Arrow className="w-3.5 h-3.5" /></Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative px-6 md:px-12 pt-20 pb-28 overflow-hidden">
        {/* Pastel radial bloom — no blur/glass */}
        <div className="absolute inset-0 pointer-events-none bg-pastel-mesh" />
        {/* Dot pattern */}
        <div className="absolute inset-0 pointer-events-none pastel-dots opacity-40" />

        <div className="relative max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Copy */}
          <div className="flex-1 text-center lg:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 mb-7 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide animate-fade-in" style={{ background: 'rgba(216,180,160,0.25)', color: '#a06840', border: '1px solid rgba(216,180,160,0.50)' }}>
              <Plane className="w-3 h-3" /> Luxury Travel Management
            </div>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-[4.25rem] font-light leading-[1.08] tracking-tight text-charcoal mb-6 animate-stagger-1">
              Journey Beyond<br /><em className="not-italic" style={{ color: '#d77a61' }}>the Horizon.</em>
            </h1>
            <p className="text-base text-charcoal/55 leading-relaxed max-w-md mx-auto lg:mx-0 mb-10 animate-stagger-2 font-sans">
              WanderSync unifies your flights, hotels, and transport into a single timeline — and alerts you the moment disruptions arise.
            </p>
            <div className="flex items-center justify-center lg:justify-start gap-3 animate-stagger-3">
              <Link to="/register" className="btn-primary px-7 py-3 text-sm cursor-pointer">Start Planning <Arrow className="w-4 h-4" /></Link>
              <Link to="/login" className="btn-secondary px-7 py-3 text-sm cursor-pointer">Sign in</Link>
            </div>
            <p className="mt-8 text-xs text-charcoal/35 animate-stagger-4">Trusted by modern travellers · HTTPS-only · 85%+ disruption accuracy</p>
          </div>

          {/* Flight visual + card */}
          <div className="flex-1 w-full flex flex-col items-center lg:items-end gap-0 animate-stagger-2">
            <div className="w-full max-w-lg"><FlightAnimation /></div>
            <div className="w-full max-w-md -mt-6 relative z-10 px-2"><HeroCard /></div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── charcoal background */}
      <section className="px-6 md:px-12 py-12" style={{ background: '#223843' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-3 divide-x" style={{ divideColor: 'rgba(255,255,255,0.10)' } as React.CSSProperties}>
          {[{ v: '10K+', l: 'Travellers' }, { v: '150+', l: 'Destinations' }, { v: '99.9%', l: 'Uptime' }].map((s) => (
            <div key={s.l} className="text-center px-6">
              <div className="font-serif text-3xl font-light" style={{ color: '#d8b4a0' }}>{s.v}</div>
              <div className="text-xs font-semibold tracking-widest uppercase mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="px-6 md:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-serif text-4xl font-light text-charcoal mb-3 leading-tight">
              One platform,<br /><em style={{ color: '#d77a61', fontStyle: 'italic' }}>infinite journeys.</em>
            </h2>
            <p className="text-sm text-charcoal/45 max-w-xs mx-auto leading-relaxed">Four core systems working in harmony.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="card-hover" style={{ borderLeftWidth: 3, borderLeftColor: f.accent, animationDelay: `${i * 80}ms` }}>
                <div className="mb-4 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${f.accent}18`, color: f.accent }}>{f.icon}</div>
                <h3 className="font-serif text-lg font-medium text-charcoal mb-2">{f.title}</h3>
                <p className="text-sm text-charcoal/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="px-6 md:px-12 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl font-light text-charcoal text-center mb-14">
            Three steps to <em style={{ color: '#d77a61', fontStyle: 'italic' }}>seamless travel.</em>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: '01', t: 'Create Account', d: 'Sign up in seconds with just your email.' },
              { n: '02', t: 'Link Bookings',  d: 'Connect your flights and hotels automatically.' },
              { n: '03', t: 'Travel Smarter',  d: 'Get real-time alerts and social discovery.' },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="font-serif text-5xl font-light mb-3" style={{ color: '#d8b4a0' }}>{s.n}</div>
                <h3 className="font-serif text-lg font-medium text-charcoal mb-2">{s.t}</h3>
                <p className="text-sm text-charcoal/50 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-6 md:px-12 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl p-12 text-center" style={{ background: 'linear-gradient(135deg, rgba(216,180,160,0.30) 0%, rgba(215,122,97,0.15) 100%)', border: '1px solid rgba(215,122,97,0.20)' }}>
            <div className="font-serif text-4xl font-light text-charcoal mb-4 leading-tight">Ready to take control?</div>
            <p className="text-sm text-charcoal/50 mb-8 leading-relaxed max-w-sm mx-auto">Create a free account and link your first booking in under 5 minutes.</p>
            <Link to="/register" className="btn-primary inline-flex px-8 py-3 text-sm cursor-pointer">Get started free <Arrow className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-6 md:px-12 py-5 flex items-center justify-between text-xs border-t border-dust-grey/50" style={{ color: 'rgba(34,56,67,0.35)' }}>
        <span className="font-serif font-medium">Wander<span style={{ color: '#d77a61' }}>Sync</span><span className="font-sans ml-1">· Team 15</span></span>
        <span>SE Project — 2026</span>
      </footer>
    </div>
  );
}
