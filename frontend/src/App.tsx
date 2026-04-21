import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from '@/components/Auth/PrivateRoute';
import AppLayout from '@/components/Layout/AppLayout';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import ItineraryPage from '@/pages/ItineraryPage';
import DisruptionPage from '@/pages/DisruptionPage';
import SocialPage from '@/pages/SocialPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/itinerary" element={<ItineraryPage />} />
            <Route path="/disruptions" element={<DisruptionPage />} />
            <Route path="/social" element={<SocialPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
