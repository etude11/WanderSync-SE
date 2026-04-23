import { Outlet } from 'react-router-dom';
import TopNavbar from './TopNavbar';
import SideNavigation from './SideNavigation';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-platinum">
      <TopNavbar />
      <div className="flex flex-1 overflow-hidden">
        <SideNavigation />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
