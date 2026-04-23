import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { itineraryAPI } from '@/services/itineraryAPI';
import { disruptionAPI } from '@/services/disruptionAPI';
import type { Itinerary, Disruption } from '@/types';
import AlertBanner from '@/components/Disruption/AlertBanner';
import TimelineView from '@/components/Itinerary/TimelineView';
import LoadingSpinner from '@/components/Shared/LoadingSpinner';

/* Icons */
const CalendarIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const BoltIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
  </svg>
);
const ArrowIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const PlusIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      itineraryAPI.list().then((r) => setItineraries(r.data)),
      disruptionAPI.mine().then((r) => setDisruptions(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="h-64" />;

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Traveller';
  const activeDisruptions = disruptions.filter((d) => !d.resolved);
  const latest = itineraries[0] ?? null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-charcoal">
          Welcome back, <em className="not-italic" style={{ color: '#d77a61' }}>{displayName}</em>
        </h1>
        <p className="text-sm text-charcoal/50 mt-1 font-normal">Here's your travel overview</p>
      </div>

      {/* Alert banner (only when disruptions exist) */}
      {activeDisruptions.length > 0 && <AlertBanner disruptions={disruptions} />}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Itineraries', value: itineraries.length, icon: <CalendarIcon />, accent: '#d8b4a0', link: '/itinerary' },
          { label: 'Disruptions', value: activeDisruptions.length, icon: <BoltIcon />, accent: activeDisruptions.length > 0 ? '#d77a61' : '#dbd3d8', link: '/disruptions' },
          { label: 'Bookings', value: itineraries.reduce((s, i) => s + (i.bookings?.length ?? 0), 0), icon: <CalendarIcon />, accent: '#223843', link: '/itinerary' },
        ].map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="card-hover cursor-pointer no-underline"
            style={{ textDecoration: 'none' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.accent}18`, color: stat.accent }}>
                {stat.icon}
              </div>
              <ArrowIcon />
            </div>
            <div className="font-serif text-3xl font-semibold text-charcoal">{stat.value}</div>
            <div className="text-xs text-charcoal/45 font-semibold tracking-wide mt-0.5">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Latest itinerary timeline */}
      {latest ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold text-charcoal">
              {latest.title}
              <span className="ml-2 text-xs font-sans font-normal text-charcoal/40">· Latest itinerary</span>
            </h2>
            <Link to="/itinerary" className="text-xs font-semibold cursor-pointer flex items-center gap-1" style={{ color: '#d77a61' }}>
              View all <ArrowIcon />
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-dust-grey/50 p-5">
            <TimelineView bookings={latest.bookings ?? []} />
          </div>
        </div>
      ) : (
        <div className="text-center py-14 rounded-2xl border border-dashed border-dust-grey/60 bg-white/50">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(216,180,160,0.18)', color: '#d8b4a0' }}>
            <PlusIcon />
          </div>
          <p className="text-sm font-medium text-charcoal/55">No itineraries yet</p>
          <p className="text-xs text-charcoal/35 mt-1 mb-4">Create your first itinerary to start tracking your journey.</p>
          <Link to="/itinerary" className="btn-primary text-sm px-5 py-2 inline-flex">
            Create Itinerary <ArrowIcon />
          </Link>
        </div>
      )}
    </div>
  );
}
