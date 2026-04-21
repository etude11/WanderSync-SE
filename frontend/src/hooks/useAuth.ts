import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/services/authAPI';

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(
    async (email: string, password: string) => {
      const { data: tokenData } = await authAPI.login(email, password);
      localStorage.setItem('access_token', tokenData.accessToken);
      const { data: userData } = await authAPI.me();
      setAuth(userData, tokenData.accessToken);
      navigate('/dashboard');
    },
    [setAuth, navigate]
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      await authAPI.register(email, password, displayName);
      // auto-login after successful registration
      const { data: tokenData } = await authAPI.login(email, password);
      localStorage.setItem('access_token', tokenData.accessToken);
      const { data: userData } = await authAPI.me();
      setAuth(userData, tokenData.accessToken);
      navigate('/dashboard');
    },
    [setAuth, navigate]
  );

  const logout = useCallback(() => {
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);

  return { user, token, isAuthenticated, login, register, logout };
}
