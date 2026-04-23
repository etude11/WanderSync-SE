import api from './api';
import type { Itinerary, Booking, BookingType } from '@/types';

export const itineraryAPI = {
  list: () => api.get<Itinerary[]>('/itineraries'),

  get: (id: string) => api.get<Itinerary>(`/itineraries/${id}`),

  create: (data: { title: string }) =>
    api.post<Itinerary>('/itineraries', data),

  update: (id: string, data: Partial<{ title: string }>) =>
    api.patch<Itinerary>(`/itineraries/${id}`, data),

  remove: (id: string) => api.delete(`/itineraries/${id}`),

  addBooking: (itineraryId: string, data: {
    providerRef: string;
    type: BookingType;
    departureTime: string;
    arrivalTime: string;
    origin: string;
    destination: string;
  }) => api.post<Booking>(`/itineraries/${itineraryId}/bookings`, data),

  removeBooking: (itineraryId: string, bookingId: string) =>
    api.delete(`/itineraries/${itineraryId}/bookings/${bookingId}`),
};
