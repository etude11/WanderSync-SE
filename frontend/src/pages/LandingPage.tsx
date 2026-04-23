import { Link } from 'react-router-dom';
import { useRef, useCallback, useEffect, useState } from 'react';
import FlightAnimation from '@/components/Shared/FlightAnimation';
import { useScrollReveal } from '@/hooks/useScrollReveal';

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

/* ── Demo timeline data ─────────────────────────────────────────────────────── */
const DEMO = [
  { type: 'flight',    label: 'JFK → LHR',       detail: 'AA 106 · Jun 12, 08:45',  bad: false },
  { type: 'hotel',     label: 'The Shard Hotel',  detail: 'Jun 12-15 · London',      bad: false },
  { type: 'flight',    label: 'LHR → CDG',        detail: 'BA 303 · Jun 15, 14:20',  bad: true  },
  { type: 'transport', label: 'Eurostar to Paris', detail: 'Jun 15 · Rerouted',       bad: false },
];
const typeIcon: Record<string, React.ReactNode> = {
  flight:    <Plane className="w-3.5 h-3.5" />,
  hotel:     <Hotel className="w-3.5 h-3.5" />,
  transport: <Bus   className="w-3.5 h-3.5" />,
};

const FEATURES = [
  { icon: <Calendar className="w-5 h-5" />, accent: '#d8b4a0', title: 'Unified Itinerary', desc: 'Flights, hotels, and transport aggregated into one chronological timeline.' },
  { icon: <Bolt     className="w-5 h-5" />, accent: '#d77a61', title: 'Disruption Alerts',  desc: 'Real-time flight monitoring with proactive re-routing suggestions.' },
  { icon: <Users    className="w-5 h-5" />, accent: '#223843', title: 'Social Discovery',   desc: 'Find travellers with overlapping itineraries — privacy-first.' },
  { icon: <Shield   className="w-5 h-5" />, accent: '#b4a8b0', title: 'Secure by Design',   desc: 'Your data stays protected with modern encryption and JWT authentication.' },
];

/* ── 3D Tilt Hero Card ─────────────────────────────────────────────────────── */
function HeroCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    card.style.transform = `rotateY(${dx * 7}deg) rotateX(${-dy * 5}deg) translateZ(8px)`;
    card.style.boxShadow = `${-dx * 12}px ${dy * 8}px 48px rgba(34,56,67,0.14), 0 4px 32px rgba(34,56,67,0.08)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'rotateY(0deg) rotateX(0deg) translateZ(0)';
    card.style.boxShadow = '0 4px 32px rgba(34,56,67,0.08)';
  }, []);

  return (
    <div className="tilt-wrapper">
      <div
        ref={cardRef}
        className="tilt-card card shadow-card"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Card header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-charcoal/45" />
            <span className="text-[11px] font-semibold text-charcoal/45 tracking-widest uppercase">Europe · Jun 12-18</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(215,122,97,0.12)', color: '#d77a61', border: '1px solid rgba(215,122,97,0.25)' }}>Live</span>
        </div>

        {/* Timeline */}
        <div className="relative pl-6">
          <div className="timeline-line" />
          <div className="space-y-3">
            {DEMO.map((item, i) => (
              <div key={i} className="relative">
                <div
                  className="absolute -left-6 top-2 w-2.5 h-2.5 rounded-full border-2 border-white"
                  style={{ background: item.bad ? '#d77a61' : '#dbd3d8', boxShadow: item.bad ? '0 0 6px rgba(215,122,97,0.5)' : 'none' }}
                />
                <div
                  className="rounded-xl px-3 py-2 border transition-colors"
                  style={item.bad
                    ? { background: 'rgba(215,122,97,0.08)', borderColor: 'rgba(215,122,97,0.22)' }
                    : { background: 'rgba(239,241,243,0.7)',  borderColor: 'rgba(219,211,216,0.5)' }}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span style={{ color: item.bad ? '#d77a61' : '#223843', opacity: item.bad ? 1 : 0.5 }}>{typeIcon[item.type]}</span>
                    <span className="text-sm font-semibold" style={{ color: item.bad ? '#d77a61' : '#223843' }}>{item.label}</span>
                    {item.bad && <Bolt className="w-3 h-3 ml-auto" style={{ color: '#d77a61' }} />}
                  </div>
                  <p className="text-[11px] font-mono" style={{ color: '#223843', opacity: 0.38 }}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert row */}
        <div className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2 border" style={{ background: 'rgba(215,122,97,0.07)', borderColor: 'rgba(215,122,97,0.20)' }}>
          <Bolt className="w-3.5 h-3.5 shrink-0" style={{ color: '#d77a61' }} />
          <p className="text-[11px] font-semibold leading-tight" style={{ color: '#c96248' }}>Flight delay detected - alternative route suggested</p>
        </div>
      </div>
    </div>
  );
}

/* ── Reveal wrapper: applies is-visible on intersection ─────────────────────── */
function Reveal({ children, className = '', delay = 0, direction = 'up' }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
}) {
  const cls = direction === 'left' ? 'reveal-left' : direction === 'right' ? 'reveal-right' : 'reveal-on-scroll';
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`${cls}${visible ? ' is-visible' : ''} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

/* ── Feature card with 3D tilt ──────────────────────────────────────────────── */
function FeatureCard({ f, delay }: { f: typeof FEATURES[0]; delay: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const dx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const dy = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    card.style.transform = `rotateY(${dx * 5}deg) rotateX(${-dy * 4}deg) translateY(-4px)`;
    card.style.boxShadow = `${-dx * 8}px ${dy * 6}px 40px rgba(34,56,67,0.12)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'rotateY(0deg) rotateX(0deg) translateY(0)';
    card.style.boxShadow = '0 4px 32px rgba(34,56,67,0.08)';
  }, []);

  return (
    <Reveal delay={delay}>
      <div
        ref={cardRef}
        className="tilt-wrapper h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="tilt-card card-hover h-full cursor-pointer"
          style={{ borderLeftWidth: 3, borderLeftColor: f.accent }}
        >
          <div className="mb-4 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${f.accent}20`, color: f.accent }}>
            {f.icon}
          </div>
          <h3 className="font-serif text-lg font-semibold text-charcoal mb-2">{f.title}</h3>
          <p className="text-sm text-charcoal/55 leading-relaxed">{f.desc}</p>
        </div>
      </div>
    </Reveal>
  );
}

/* ── Main Landing Page ──────────────────────────────────────────────────────── */
export default function LandingPage() {
  // Parallax orb on mouse move
  const heroRef = useRef<HTMLElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleHeroMouse = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const orb = orbRef.current;
    if (!orb) return;
    const rect = heroRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    orb.style.background = `radial-gradient(ellipse 55% 50% at ${x}% ${y}%, rgba(216,180,160,0.32) 0%, rgba(215,122,97,0.10) 40%, transparent 70%)`;
  }, []);

  return (
    <div className="min-h-screen bg-platinum text-charcoal overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-12 h-16 bg-platinum/95 border-b border-dust-grey/40" style={{ backdropFilter: 'blur(8px)' }}>
        <Link to="/" className="font-serif text-xl font-semibold tracking-tight text-charcoal select-none cursor-pointer">
          Wander<span style={{ color: '#d77a61' }}>Sync</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm font-medium text-charcoal/60 hover:text-charcoal transition-colors duration-150 px-3 py-1.5 cursor-pointer">Sign in</Link>
          <Link to="/register" className="btn-primary text-sm px-4 py-2 cursor-pointer">Plan Your Journey <Arrow className="w-3.5 h-3.5" /></Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative px-6 md:px-12 pt-16 pb-24 overflow-hidden"
        onMouseMove={handleHeroMouse}
      >
        {/* Dynamic mouse-tracked orb */}
        <div
          ref={orbRef}
          className="absolute inset-0 pointer-events-none transition-all duration-700"
          style={{ background: 'radial-gradient(ellipse 55% 50% at 65% 30%, rgba(216,180,160,0.28) 0%, rgba(215,122,97,0.08) 40%, transparent 70%)' }}
        />
        {/* Dot texture */}
        <div className="absolute inset-0 pointer-events-none pastel-dots opacity-35" />

        <div className="relative max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* ── Copy ── */}
            <div className="flex-1 text-center lg:text-left max-w-xl">
              <div
                className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide animate-fade-in"
                style={{ background: 'rgba(216,180,160,0.22)', color: '#9a6030', border: '1px solid rgba(216,180,160,0.45)' }}
              >
                <Plane className="w-3 h-3" /> Smarter Travel, Together
              </div>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-[4.5rem] font-normal leading-[1.06] tracking-tight text-charcoal mb-5 animate-stagger-1">
                Journey Beyond<br />
                <em className="not-italic" style={{ color: '#d77a61' }}>the Horizon.</em>
              </h1>

              <p className="text-base text-charcoal/65 leading-relaxed max-w-md mx-auto lg:mx-0 mb-8 animate-stagger-2 font-sans font-normal">
                WanderSync unifies your flights, hotels, and transport into a single timeline and alerts you the moment disruptions arise.
              </p>

              <div className="flex items-center justify-center lg:justify-start gap-3 animate-stagger-3">
                <Link to="/register" className="btn-primary px-7 py-3 text-sm cursor-pointer">Start Planning <Arrow className="w-4 h-4" /></Link>
                <Link to="/login"    className="btn-secondary px-7 py-3 text-sm cursor-pointer">Sign in</Link>
              </div>

              <p className="mt-6 text-xs text-charcoal/35 animate-stagger-4 font-normal">Trusted by travellers worldwide · Free to get started</p>

              {/* Inline stats — sits naturally under copy, no floating strip */}
              <div className="mt-10 flex items-center justify-center lg:justify-start gap-8 animate-stagger-5">
                {[{ v: '10K+', l: 'Travellers' }, { v: '150+', l: 'Destinations' }, { v: '99.9%', l: 'Uptime' }].map((s, i) => (
                  <div key={s.l} className="text-center lg:text-left" style={{ borderLeft: i > 0 ? '1px solid rgba(34,56,67,0.12)' : 'none', paddingLeft: i > 0 ? '2rem' : '0' }}>
                    <div className="font-serif text-2xl font-semibold" style={{ color: '#223843' }}>{s.v}</div>
                    <div className="text-[10px] font-semibold tracking-widest uppercase mt-0.5" style={{ color: 'rgba(34,56,67,0.40)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Visual: flight map + 3D card ── */}
            <div className="flex-1 w-full flex flex-col items-center lg:items-end gap-4 animate-stagger-2" style={{ transform: `translateY(${scrollY * 0.04}px)` }}>
              <div className="w-full max-w-lg">
                <FlightAnimation />
              </div>
              <div className="w-full max-w-md px-2">
                <HeroCard />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider mx-6 md:mx-12" />

      {/* ── Features ── */}
      <section className="px-6 md:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="font-serif text-4xl font-normal text-charcoal mb-3 leading-tight">
                One platform,<br /><em style={{ color: '#d77a61', fontStyle: 'italic' }}>infinite journeys.</em>
              </h2>
              <p className="text-sm text-charcoal/50 max-w-xs mx-auto leading-relaxed font-normal">Four core systems working in harmony.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} f={f} delay={i * 90} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 md:px-12 py-20" style={{ background: '#f7f5f4' }}>
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <h2 className="font-serif text-3xl font-normal text-charcoal text-center mb-14">
              Three steps to <em style={{ color: '#d77a61', fontStyle: 'italic' }}>seamless travel.</em>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {/* Connector line on md+ */}
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(216,180,160,0.5), rgba(215,122,97,0.3), rgba(216,180,160,0.5), transparent)' }} />

            {[
              { n: '01', t: 'Create Account', d: 'Sign up in seconds with just your email.' },
              { n: '02', t: 'Link Bookings',  d: 'Connect your flights and hotels automatically.' },
              { n: '03', t: 'Travel Smarter', d: 'Get real-time alerts and social discovery.' },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="text-center relative">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 font-serif text-2xl font-semibold relative z-10"
                    style={{ background: 'white', color: '#d8b4a0', boxShadow: '0 4px 24px rgba(34,56,67,0.08)', border: '1px solid rgba(219,211,216,0.6)' }}
                  >
                    {s.n}
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-charcoal mb-2">{s.t}</h3>
                  <p className="text-sm text-charcoal/55 leading-relaxed font-normal">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 md:px-12 py-20">
        <div className="max-w-2xl mx-auto">
          <Reveal>
            <div
              className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(216,180,160,0.28) 0%, rgba(215,122,97,0.14) 100%)', border: '1px solid rgba(215,122,97,0.18)' }}
            >
              {/* Subtle orb inside CTA */}
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(215,122,97,0.12) 0%, transparent 70%)' }} />
              <div className="font-serif text-4xl font-normal text-charcoal mb-4 leading-tight relative z-10">Ready to take control?</div>
              <p className="text-sm text-charcoal/55 mb-8 leading-relaxed max-w-sm mx-auto font-normal relative z-10">
                Create a free account and link your first booking in under 5 minutes.
              </p>
              <Link to="/register" className="btn-primary inline-flex px-8 py-3 text-sm cursor-pointer relative z-10">
                Get started free <Arrow className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 md:px-12 py-5 flex items-center justify-between text-xs border-t border-dust-grey/50" style={{ color: 'rgba(34,56,67,0.35)' }}>
        <span className="font-serif font-medium">Wander<span style={{ color: '#d77a61' }}>Sync</span><span className="font-sans ml-1">· Team 15</span></span>
        <span>SE Project, 2026</span>
      </footer>
    </div>
  );
}
