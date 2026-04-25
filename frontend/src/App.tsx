import { useEffect } from 'react';
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
import NotificationsPage from '@/pages/NotificationsPage';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/services/authAPI';

export default function App() {
  const { token, user, setAuth, clearAuth } = useAuthStore();

  // Rehydrate user object after page refresh — token persists in localStorage
  // but Zustand state (user) is lost; re-fetch profile once on mount.
  useEffect(() => {
    if (token && !user) {
      authAPI.me()
        .then(res => setAuth(res.data, token))
        .catch(() => clearAuth());
    }
  }, []);

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
            <Route path="/dashboard"     element={<DashboardPage />} />
            <Route path="/itinerary"     element={<ItineraryPage />} />
            <Route path="/disruptions"   element={<DisruptionPage />} />
            <Route path="/social"        element={<SocialPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
