// Auth
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'TRAVELLER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn?: number;
}

// Itinerary
export type BookingType = 'FLIGHT' | 'HOTEL' | 'TRANSPORT';
export type BookingStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'DISRUPTED';

export interface Booking {
  id: string;
  itineraryId: string;
  type: BookingType;
  providerKey: string;
  providerRef: string;
  data: Record<string, unknown>;
  disrupted: boolean;
  createdAt: string;
}

export interface Itinerary {
  id: string;
  userId: string;
  title: string;
  startDate: string;
  endDate: string;
  bookings: Booking[];
  createdAt: string;
  updatedAt: string;
}

// Disruptions
export type DisruptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Disruption {
  id: string;
  itineraryId: string;
  bookingId: string;
  type: string;
  severity: DisruptionSeverity;
  description: string;
  detectedAt: string;
  resolved: boolean;
}

// Social
export interface NearbyTraveler {
  id: string;
  region: string;
  overlapStart: string;
  overlapEnd: string;
  consentGiven: boolean;
}

// API
export interface ApiError {
  message: string;
  statusCode: number;
}
