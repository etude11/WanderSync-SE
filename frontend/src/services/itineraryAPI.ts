import api from './api';
import type { Itinerary, Booking, BookingType } from '@/types';

export type HotelResult = {
  id: string;
  name: string;
  city: string;
  rating: number;
  pricePerNight: number;
};

export type TransportRoute = {
  id: string;
  carrier: string;
  type: string;
  origin: string;
  destination: string;
  durationHours: number;
};

export type FlightLookup = {
  providerRef: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
};

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

  lookupFlight: (ref: string) =>
    api.get<FlightLookup>(`/bookings/lookup/flight?ref=${encodeURIComponent(ref)}`),

  lookupHotel: (city: string, checkIn: string, checkOut: string) =>
    api.get<HotelResult[]>(`/bookings/lookup/hotel?city=${encodeURIComponent(city)}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`),

  lookupTransport: (type: string, origin: string, destination: string) =>
    api.get<TransportRoute[]>(`/bookings/lookup/transport?type=${encodeURIComponent(type)}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`),

  summarize: (id: string) =>
    api.post<{ summary: string }>(`/itineraries/${id}/summarize`),
};
