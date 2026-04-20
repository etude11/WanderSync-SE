# WanderSync — Implementation Design Specification

**Team 15 | TypeScript (NestJS) Modular Monolith**

This document is the single reference for implementation. It is grounded in the architecture decisions (ADR-001–004), tactics (Task 3), and subsystem boundaries (Task 1) already established. Everything here is concrete and actionable; nothing is aspirational.

---

## 1. Tech Stack

| Layer | Choice | Grounding |
|---|---|---|
| Framework | **NestJS** (TypeScript) | Module/Provider system maps 1-to-1 to 7 subsystems; Guards implement CoR AuthHandler; Interceptors implement CoR AuditLogHandler |
| ORM | **Prisma** + PostgreSQL | Type-safe, schema-first, migration system |
| Cache / Streams | **Redis** via `ioredis` | Tactic 1 (cache TTL) + Tactic 4 (Redis Streams persistence) |
| Auth | `@nestjs/jwt` + `passport-jwt` + `bcrypt` | ADR-004: stateless JWT, 24-hour expiry, bcrypt storage |
| Validation | `class-validator` + `class-transformer` | CoR SchemaValidationHandler via NestJS `ValidationPipe` |
| HTTP client | `axios` | External API calls (AviationStack, OpenWeatherMap) |
| Circuit breaker | `opossum` | Tactic 2: retry with open-circuit fallback |
| Testing | `jest` + `supertest` | NFR: ≥60% line coverage on core service functions |

---

## 2. Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Enums ────────────────────────────────────────────────────────────────────

enum Role {
  TRAVELLER
  ADMIN
}

enum BookingType {
  FLIGHT
  HOTEL
  TRANSPORT
}

enum DisruptionType {
  FLIGHT_DELAY
  FLIGHT_CANCELLATION
  WEATHER_ALERT
  FLIGHT_DIVERSION
}

enum ConsentLevel {
  NONE
  PENDING
  CITY_LEVEL
  PRECISE
}

// ── Models ───────────────────────────────────────────────────────────────────

model User {
  id                String           @id @default(uuid())
  email             String           @unique
  passwordHash      String
  displayName       String
  role              Role             @default(TRAVELLER)
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  itineraries       Itinerary[]
  consentsInitiated ConsentState[]   @relation("UserA")
  consentsReceived  ConsentState[]   @relation("UserB")
  notifications     NotificationLog[]
}

model Itinerary {
  id        String          @id @default(uuid())
  userId    String
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
  bookings  BookingRecord[]
}

model BookingRecord {
  id            String      @id @default(uuid())
  itineraryId   String
  itinerary     Itinerary   @relation(fields: [itineraryId], references: [id], onDelete: Cascade)
  provider      String      // e.g. "aviationstack" | "amadeus" | "manual"
  providerRef   String      // Flight IATA number, hotel booking ref, etc.
  type          BookingType
  departureTime DateTime
  arrivalTime   DateTime
  origin        String      // IATA code or city name
  destination   String
  disrupted     Boolean     @default(false)
  rawData       Json        // Full provider response snapshot; schema-agnostic
  createdAt     DateTime    @default(now())

  @@index([itineraryId, departureTime]) // Timeline assembly: sorted by departure
  @@index([providerRef])               // Fast lookup when disruption event arrives
}

model DisruptionEvent {
  id             String         @id @default(uuid())
  type           DisruptionType
  severity       Int            // 1–4 (matches OWM event_level; ≥3 = critical)
  description    String
  flightIata     String?        // Populated for FLIGHT_* disruption types
  affectedOrigin String?        // IATA or city; used to cross-reference bookings
  publishedAt    DateTime       @default(now())
}

model ConsentState {
  id        String       @id @default(uuid())
  userAId   String
  userBId   String
  userA     User         @relation("UserA", fields: [userAId], references: [id])
  userB     User         @relation("UserB", fields: [userBId], references: [id])
  state     ConsentLevel @default(NONE)
  updatedAt DateTime     @updatedAt

  @@unique([userAId, userBId]) // Canonical direction: lower UUID = userA
}

model NotificationLog {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  eventId     String   // References DisruptionEvent.id (soft ref, no FK)
  channel     String   // "in-app" | "email"
  deliveredAt DateTime @default(now())
  success     Boolean
  read        Boolean  @default(false)

  @@index([userId, deliveredAt])
}
```

**Key constraints:**

- `onDelete: Cascade` on Itinerary → BookingRecord: deleting an itinerary cleans all bookings atomically.
- `@@index([providerRef])` on BookingRecord: O(log n) lookup when a disruption event arrives carrying a flight IATA code.
- `ConsentState @@unique([userAId, userBId])`: prevents duplicate rows. Canonical ordering enforced in service code (lower UUID string = userA).
- `rawData Json`: provider schema changes do not break stored records; old records retain their snapshot.

---

## 3. API Endpoints

All endpoints are prefixed with `/api/v1`. JWT = `Authorization: Bearer <token>` required. Ownership checks are enforced **in the service layer**, not the gateway (IDOR prevention per Tactic 3 / ADR-002).

### Auth — `/auth`

```
POST   /auth/register       Body: { email, password, displayName }
POST   /auth/login          Body: { email, password } → { accessToken, expiresIn: 86400 }
GET    /auth/me             [JWT] → UserProfile
PATCH  /auth/me             [JWT] Body: { displayName? }
```

### Itinerary — `/itineraries`

```
GET    /itineraries                          [JWT] → Itinerary[]
POST   /itineraries                          [JWT] Body: { title }
GET    /itineraries/:id                      [JWT + ownership] → BookingRecord[] sorted by departureTime (Redis cached, 5-min TTL)
PATCH  /itineraries/:id                      [JWT + ownership] Body: { title }
DELETE /itineraries/:id                      [JWT + ownership] (cascade deletes bookings; purges cache key)
POST   /itineraries/:id/bookings             [JWT + ownership] Body: AddBookingDto (invalidates cache)
DELETE /itineraries/:id/bookings/:bookingId  [JWT + ownership]
```

### Booking Aggregation — `/bookings`

```
GET    /bookings/aggregate?itineraryId=X     [JWT] → triggers all registered strategies, merges, upserts to DB
GET    /bookings/:id                         [JWT + ownership]
DELETE /bookings/:id                         [JWT + ownership]
```

### Disruption — `/disruptions`

```
GET    /disruptions/mine        [JWT] → DisruptionEvent[] affecting current user's bookings
POST   /disruptions/simulate    [JWT + ADMIN] Body: DisruptionEventDto → injects directly to Redis Streams (used for 20 test cases)
GET    /disruptions             [JWT + ADMIN] → paginated event log
```

### Social — `/social`

```
GET    /social/matches                [JWT] → UserMatch[] at city-level (Tactic 5 masking always applied)
GET    /social/profile/:userId        [JWT] → profile; location resolution depends on ConsentState
POST   /social/consent/:userId        [JWT] → initiate; auto-elevates to CITY_LEVEL if reverse row exists with state=PENDING
PATCH  /social/consent/:userId        [JWT] Body: { action: "accept" | "reject" }
DELETE /social/consent/:userId        [JWT] → revoke; both rows reset to NONE
```

### Notifications — `/notifications`

```
GET    /notifications           [JWT] → NotificationLog[] paginated, newest first
PATCH  /notifications/:id/read  [JWT + ownership]
```

---

## 4. File / Folder Structure

```
WanderSync-SE/
├── src/
│   ├── main.ts                               # Bootstrap, global ValidationPipe, exception filter
│   ├── app.module.ts                         # Imports all domain modules + GlobalModule
│   ├── config/
│   │   └── configuration.ts                 # Typed env config (port, DATABASE_URL, REDIS_URL, API keys)
│   ├── database/
│   │   ├── prisma.service.ts                # PrismaClient singleton (OnModuleInit/Destroy lifecycle)
│   │   └── redis.service.ts                 # ioredis client (cache + Streams), shared across modules
│   ├── common/                              # Subsystem 1 — API Gateway / CoR chain
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts            # CoR: AuthHandler — validates JWT, returns 401
│   │   │   └── roles.guard.ts               # CoR: coarse Role AuthZ (TRAVELLER/ADMIN)
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts       # CoR: AuditLogHandler — logs userId + endpoint
│   │   │   └── transform.interceptor.ts     # Wraps response in { data, statusCode }
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts     # Uniform error shape
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts           # CoR: SchemaValidationHandler (class-validator)
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts    # Extracts User from JWT payload on request
│   │   │   └── roles.decorator.ts           # @Roles(Role.ADMIN) metadata decorator
│   │   └── middleware/
│   │       └── rate-limit.middleware.ts     # CoR: RateLimitHandler — Redis counter per IP
│   └── modules/
│       ├── auth/                            # Subsystem 2: Auth & User Management
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts              # register (bcrypt hash), login (JWT sign), profile CRUD
│       │   ├── strategies/
│       │   │   └── jwt.strategy.ts          # passport-jwt: extracts userId + role from payload
│       │   └── dto/
│       │       ├── register.dto.ts
│       │       └── login.dto.ts
│       ├── itinerary/                       # Subsystem 4: Itinerary Management
│       │   ├── itinerary.module.ts
│       │   ├── itinerary.controller.ts
│       │   ├── itinerary.service.ts         # CRUD + Redis cache + ownership enforcement
│       │   └── dto/
│       │       ├── create-itinerary.dto.ts
│       │       └── add-booking.dto.ts
│       ├── booking/                         # Subsystem 3: Booking Aggregation — Strategy Pattern
│       │   ├── booking.module.ts
│       │   ├── booking.controller.ts
│       │   ├── booking.service.ts           # Context: iterates registry.getAll(), merges BookingRecord[]
│       │   ├── provider-registry.service.ts # Map<string, IBookingStrategy>; populated at module init
│       │   ├── strategies/
│       │   │   ├── booking-strategy.interface.ts         # IBookingStrategy: fetchAndNormalize(userId)
│       │   │   ├── aviationstack-flight.strategy.ts      # ACTIVE: AviationStack REST client
│       │   │   ├── hotel-booking.strategy.ts             # STUB: returns [] until provider integrated
│       │   │   └── transport-booking.strategy.ts         # STUB: returns [] until provider integrated
│       │   └── dto/
│       │       └── booking-record.dto.ts
│       ├── disruption/                      # Subsystem 5: Disruption Detection
│       │   ├── disruption.module.ts
│       │   ├── disruption.controller.ts
│       │   ├── disruption.service.ts        # @Cron every 60s; polls adapters; cross-refs BookingRecord
│       │   ├── disruption-publisher.service.ts  # XADD disruption-events stream
│       │   ├── adapters/
│       │   │   ├── flight-tracker.adapter.ts    # AviationStack HTTP + opossum circuit breaker
│       │   │   └── weather-alert.adapter.ts     # OWM One Call 3.0 HTTP + opossum circuit breaker
│       │   └── dto/
│       │       └── disruption-event.dto.ts
│       ├── notification/                    # Subsystem 7: Notification Service
│       │   ├── notification.module.ts
│       │   ├── notification.controller.ts
│       │   └── notification.service.ts      # XREADGROUP consumer on disruption-events; writes NotificationLog
│       └── social/                          # Subsystem 6: Social Synchronisation
│           ├── social.module.ts
│           ├── social.controller.ts
│           ├── social.service.ts            # Geospatial matching, consent state machine
│           ├── location-masking.service.ts  # Tactic 5: truncates coords to city centroid when consent ≠ PRECISE
│           └── dto/
│               ├── consent.dto.ts
│               └── social-match.dto.ts
├── prisma/
│   └── schema.prisma
├── test/
│   ├── auth.e2e-spec.ts
│   ├── booking.e2e-spec.ts
│   ├── disruption.e2e-spec.ts
│   └── social.e2e-spec.ts
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 5. Provider Extensibility Catalogue

The `IBookingStrategy` interface (`booking/strategies/booking-strategy.interface.ts`) is the only contract. Adding a new provider requires exactly **2 file changes**: one new strategy class + one registry entry in `provider-registry.service.ts`. Zero changes to `BookingAggregationService` or any other module (NFR5).

### Status Legend

| Badge | Meaning |
|---|---|
| **ACTIVE** | Implemented, free API, running in prototype |
| **STUB** | Class scaffolded, returns `[]`, no real API call |
| **FUTURE / FREE** | Free API exists; promote to ACTIVE with an API key |
| **FUTURE / PAID** | Requires paid subscription |
| **FUTURE / PARTNER** | Requires commercial or government partnership |

---

### 5a. Flight Providers

| Provider | Status | API Access | Strategy Class | Key Endpoint / Notes |
|---|---|---|---|---|
| **AviationStack** | **ACTIVE** | Free: 100 req/mo, no credit card | `AviationstackFlightStrategy` | `GET https://api.aviationstack.com/v1/flights?access_key=KEY&flight_iata={iata}` — Response fields used: `flight_status`, `departure.delay`, `departure.scheduled`, `arrival.scheduled`. Disruption triggers: `status ∈ {cancelled, incident, diverted}` or `delay > 30`. |
| **Amadeus for Developers** | FUTURE / FREE (sandbox) | Free sandbox; production requires partner sign-off | `AmadeusFlightStrategy` | OAuth2 token: `POST https://test.api.amadeus.com/v1/security/oauth2/token`. Search: `GET /v1/shopping/flight-offers?originLocationCode=DEL&destinationLocationCode=BOM&departureDate=YYYY-MM-DD&adults=1`. Best candidate for a production-grade free-tier flight strategy. |
| **AirLabs** | FUTURE / FREE | Free: 100 req/day | `AirlabsFlightStrategy` | `GET https://airlabs.co/api/v9/flights?flight_iata={iata}&api_key=KEY`. Can supplement AviationStack when free quota is exhausted. |
| **Skyscanner (via RapidAPI)** | FUTURE / PAID | ~$10–50/month (RapidAPI) | `SkyscannerFlightStrategy` | `GET https://skyscanner-api.p.rapidapi.com/v3/flights/live/search/create`. Good for flight search; does not provide live status. |
| **MakeMyTrip (MMT)** | FUTURE / PARTNER | No public API; B2B partnership required | `MMTFlightStrategy` | Internal partner endpoint (undocumented publicly). India's largest OTA. Cannot be self-onboarded. `providerRef` in `BookingRecord` would store MMT booking ID once partnership is in place. |
| **GoIbibo** | FUTURE / PARTNER | Partner API only | `GoibiboFlightStrategy` | Owned by MakeMyTrip Group since 2016; same API ecosystem and access restrictions as MMT. |
| **IRCTC (Indian Railways)** | FUTURE / PARTNER | Official: government-gated. Third-party wrappers available on RapidAPI | `IRCTCTrainStrategy` | Third-party: `GET https://irctc1.p.rapidapi.com/api/v3/trainBetweenStations?fromStationCode=NDLS&toStationCode=BCT&dateOfJourney=YYYY-MM-DD`. **Schema change required**: add `TRAIN` to `BookingType` enum + `BookingRecord` migration before promoting to ACTIVE. |

---

### 5b. Hotel Providers

| Provider | Status | API Access | Strategy Class | Key Endpoint / Notes |
|---|---|---|---|---|
| **Booking.com Affiliate API** | FUTURE / FREE (with approval) | Free; apply at `partner.booking.com` (1–2 weeks approval) | `BookingComHotelStrategy` | `GET https://distribution-xml.booking.com/2.9/json/hotels?hotel_ids={id}`. Provides hotel details, availability, and pricing. |
| **Expedia EPS Rapid** | FUTURE / PAID | Enterprise agreement required | `ExpediaHotelStrategy` | `GET https://test.ean.com/v3/properties/availability`. Not viable for prototype; documented for post-launch roadmap. |
| **Agoda** | FUTURE / PARTNER | Partner access via YCS Partner Portal only | `AgodaHotelStrategy` | No self-signup. Strong Southeast Asia coverage. Requires YCS partnership. |
| **OYO Rooms** | FUTURE / PARTNER | No public API | `OYOHotelStrategy` | India-focused budget hotel aggregator. Partner-only. |

---

### 5c. Transport Providers

| Provider | Status | API Access | Strategy Class | Key Endpoint / Notes |
|---|---|---|---|---|
| **Uber (Price Estimates)** | FUTURE / FREE | Free developer account; OAuth2 app registration at `developer.uber.com` | `UberTransportStrategy` | `GET https://api.uber.com/v1.2/estimates/price?start_latitude=&start_longitude=&end_latitude=&end_longitude=`. Returns fare estimates only — does not provide booking records. Useful for route cost planning. |
| **Ola (India)** | FUTURE / PARTNER | Limited developer API via Ola Developer Program | `OlaTransportStrategy` | `POST https://devapi.olacabs.com/v1/products`. India-focused. Category estimates only; no booking management access. |
| **Rapido (India)** | FUTURE / PARTNER | No public API or developer program | `RapidoTransportStrategy` | Bike-taxi service. Documented for awareness; no technical path to integration without business partnership. |

---

### 5d. Weather / Disruption Data Sources

These are consumed by `disruption/adapters/`, not `booking/strategies/`. They do **not** implement `IBookingStrategy`.

| Provider | Status | API Access | Adapter Class | Key Endpoint |
|---|---|---|---|---|
| **OpenWeatherMap One Call 3.0** | **ACTIVE** | Free: 1000 calls/day | `WeatherAlertAdapter` | `GET https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&appid=KEY&exclude=current,minutely,hourly,daily` → `alerts[].event`, `.start`, `.end`, `.description` |
| **Tomorrow.io** | FUTURE / FREE | Free: 500 calls/day | `TomorrowIoWeatherAdapter` | `GET https://api.tomorrow.io/v4/weather/realtime?location={lat},{lon}&apikey=KEY`. Superior severe-weather alerting compared to OWM. Drop-in replacement behind the same adapter interface. |

---

## 6. Redis Usage Map

| Key Pattern | TTL | Written by | Read by | Purpose |
|---|---|---|---|---|
| `itinerary:{id}` | 5 min | `ItineraryService` on read | `ItineraryService` on read | Cached sorted timeline; invalidated on any booking mutation |
| `booking-agg:{userId}:{provider}` | 60 sec | `BookingService` after strategy call | `BookingService` before strategy call | Raw provider response cache (Tactic 1) |
| `ratelimit:{ip}` | 60 sec | `RateLimitMiddleware` | `RateLimitMiddleware` | Request counter per IP (Tactic 3 CoR handler) |
| `disruption-events` (Stream) | Persistent | `DisruptionPublisherService` via XADD | `NotificationService` via XREADGROUP (group: `notification`); `ItineraryService` via XREADGROUP (group: `itinerary`) | Tactic 4: durable event log with consumer-group semantics |

---

## 7. Edge Cases

| Scenario | Handling |
|---|---|
| Provider API quota exhausted | `opossum` circuit opens; `BookingService` returns cached data with `providerUnavailable: true` on that provider's segment |
| Disruption arrives for a deleted itinerary | `BookingRecord` lookup by `providerRef` returns empty; `DisruptionEvent` still logged; no `NotificationLog` written |
| Bilateral consent race (both users POST simultaneously) | `@@unique([userAId, userBId])` on `ConsentState` + Prisma transaction; second insert gets `P2002`; service catches and returns 409 |
| `POST /social/consent/:userId` auto-elevation | Service checks for reverse row with `state=PENDING` inside a single Prisma transaction; upgrades both rows to `CITY_LEVEL` atomically |
| JWT expiry during extended journey (NFR6) | Client receives 401; redirects to login. Acknowledged usability debt per ADR-004. No server-side action. |
| New provider onboarding | Create `strategies/<name>.strategy.ts` implementing `IBookingStrategy` + one `registry.register()` call in `provider-registry.service.ts`. Zero other files change. |
| `rawData Json` provider schema evolution | Old records retain their snapshot; new records get updated schema. No migration needed; Prisma `Json` field is schema-agnostic. |
| `TRAIN` booking type for IRCTC | Requires `BookingType` enum addition + `BookingRecord` migration. Isolated to schema + `IRCTCTrainStrategy`. No service changes. |

---

## 8. Environment Variables

```env
# Server
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/wandersync

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=replace-with-strong-secret
JWT_EXPIRY=86400

# External APIs — Active
AVIATIONSTACK_API_KEY=
OWM_API_KEY=

# External APIs — Future (fill when promoting provider to ACTIVE)
AMADEUS_CLIENT_ID=
AMADEUS_CLIENT_SECRET=
AIRLABS_API_KEY=
TOMORROW_IO_API_KEY=
BOOKING_COM_AFFILIATE_ID=
UBER_CLIENT_ID=
UBER_CLIENT_SECRET=
RAPIDAPI_KEY=
```
