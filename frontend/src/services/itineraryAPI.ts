import api from './api';
import type { Itinerary, Booking } from '@/types';

export const itineraryAPI = {
  list: () => api.get<Itinerary[]>('/itineraries'),

  get: (id: string) => api.get<Itinerary>(`/itineraries/${id}`),

  create: (data: { title: string; startDate: string; endDate: string }) =>
    api.post<Itinerary>('/itineraries', data),

  update: (id: string, data: Partial<{ title: string; startDate: string; endDate: string }>) =>
    api.patch<Itinerary>(`/itineraries/${id}`, data),

  remove: (id: string) => api.delete(`/itineraries/${id}`),

  addBooking: (itineraryId: string, data: { providerKey: string; providerRef: string; type: string }) =>
    api.post<Booking>(`/itineraries/${itineraryId}/bookings`, data),

  removeBooking: (itineraryId: string, bookingId: string) =>
    api.delete(`/itineraries/${itineraryId}/bookings/${bookingId}`),
};
