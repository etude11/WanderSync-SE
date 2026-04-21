import api from './api';
import type { AuthTokens, User } from '@/types';

export const authAPI = {
  register: (email: string, password: string, displayName: string) =>
    api.post<AuthTokens>('/auth/register', { email, password, displayName }),

  login: (email: string, password: string) =>
    api.post<AuthTokens>('/auth/login', { email, password }),

  me: () => api.get<User>('/auth/me'),
};
