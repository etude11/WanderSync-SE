import { NavLink } from 'react-router-dom';

/* SVG nav icons */
const GridIcon = () => (
  <svg className="w-4.5 h-4.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const CalendarIcon = () => (
  <svg className="w-4.5 h-4.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const BoltIcon = () => (
  <svg className="w-4.5 h-4.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
  </svg>
);
const UsersIcon = () => (
  <svg className="w-4.5 h-4.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const BellIcon = () => (
  <svg className="w-4.5 h-4.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const NAV = [
  { to: '/dashboard',     label: 'Dashboard',    Icon: GridIcon },
  { to: '/itinerary',     label: 'Itinerary',    Icon: CalendarIcon },
  { to: '/disruptions',   label: 'Disruptions',  Icon: BoltIcon },
  { to: '/social',        label: 'Social',       Icon: UsersIcon },
  { to: '/notifications', label: 'Notifications', Icon: BellIcon },
];

export default function SideNavigation() {
  return (
    <nav className="w-52 shrink-0 border-r border-dust-grey/50 bg-white py-5 px-2 flex flex-col gap-0.5">
      {NAV.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
              isActive
                ? 'bg-burnt-peach/10 text-burnt-peach border border-burnt-peach/20'
                : 'text-charcoal/55 hover:text-charcoal hover:bg-dust-grey/30'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span style={{ color: isActive ? '#d77a61' : undefined }}><Icon /></span>
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
