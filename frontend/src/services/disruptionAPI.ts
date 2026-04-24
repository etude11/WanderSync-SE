import api from './api';
import type { Disruption } from '@/types';

export const disruptionAPI = {
  mine: () => api.get<Disruption[]>('/disruptions/mine'),
  all: () => api.get<Disruption[]>('/disruptions'),
  simulate: (bookingId: string) => api.post('/disruptions/simulate', { bookingId }),
  simulateDemo: () => api.post<Disruption>('/disruptions/simulate-demo'),
  ack: (id: string) => api.post(`/disruptions/${id}/ack`),
  suggestions: (id: string) => api.get<string[]>(`/disruptions/${id}/suggestions`),
};
