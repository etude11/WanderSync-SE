import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '🗂️' },
  { to: '/itinerary', label: 'Itinerary', icon: '🗓️' },
  { to: '/disruptions', label: 'Disruptions', icon: '⚡' },
  { to: '/social', label: 'Social', icon: '🤝' },
];

export default function SideNavigation() {
  return (
    <nav className="w-56 shrink-0 border-r border-slate-800 bg-slate-950 py-6 px-3 flex flex-col gap-1">
      {links.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`
          }
        >
          <span>{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
