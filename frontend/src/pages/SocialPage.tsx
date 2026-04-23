const GlobeIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export default function SocialPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-charcoal">Social</h1>
        <p className="text-sm text-charcoal/45 mt-0.5">Discover travellers with overlapping journeys</p>
      </div>

      <div className="text-center py-20 rounded-2xl border border-dashed border-dust-grey/60 bg-white/50">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(219,211,216,0.22)', color: '#dbd3d8' }}>
          <GlobeIcon />
        </div>
        <p className="text-sm font-semibold text-charcoal/60">Coming Soon</p>
        <p className="text-xs text-charcoal/35 mt-1.5 max-w-xs mx-auto leading-relaxed">
          Social discovery is planned for a future release. You'll be able to find anonymised travellers with overlapping itineraries.
        </p>
      </div>
    </div>
  );
}
