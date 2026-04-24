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

// Disruptions — matches DisruptionEvent on backend
export type DisruptionSeverityLabel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Disruption {
  id: string;
  type: string;
  severity: number;           // 1–4 from backend
  description: string;
  flightIata: string | null;
  affectedOrigin: string | null;
  status: 'ACTIVE' | 'RESOLVED';
  resolvedAt: string | null;
  isAcknowledged: boolean;
  publishedAt: string;
}

export function severityLabel(n: number): DisruptionSeverityLabel {
  if (n === 1) return 'LOW';
  if (n === 2) return 'MEDIUM';
  if (n === 3) return 'HIGH';
  return 'CRITICAL';
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
