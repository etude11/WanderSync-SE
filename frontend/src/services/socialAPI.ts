import api from './api';
import type { NearbyTraveler } from '@/types';

export const socialAPI = {
  nearby: (itineraryId: string) =>
    api.get<NearbyTraveler[]>(`/social/nearby/${itineraryId}`),

  consent: (targetUserId: string) =>
    api.post('/social/consent', { targetUserId }),
};
