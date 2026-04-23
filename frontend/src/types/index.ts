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

export interface Booking {
  id: string;
  itineraryId: string;
  type: BookingType;
  provider: string;
  providerRef: string;
  rawData: Record<string, unknown>;
  disrupted: boolean;
  departureTime: string;
  arrivalTime: string;
  origin: string;
  destination: string;
  createdAt: string;
}

export interface Itinerary {
  id: string;
  userId: string;
  title: string;
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
