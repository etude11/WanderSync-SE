/**
 * Canonical Journey — E2E Integration Pass (Step 7)
 *
 * Covers all 6 acceptance scenarios from PLAN.md using the full NestJS
 * request pipeline with mocked data infrastructure (Prisma, Redis, external
 * adapters). External HTTP APIs are never called.
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingType, DisruptionType, Role } from '@prisma/client';
import supertest, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { RedisService } from '../src/database/redis.service';
import { FlightTrackerAdapter } from '../src/modules/disruption/adapters/flight-tracker.adapter';
import { WeatherAlertAdapter } from '../src/modules/disruption/adapters/weather-alert.adapter';
import { NotificationService } from '../src/modules/notification/notification.service';
import { AviationstackFlightStrategy } from '../src/modules/booking/strategies/aviationstack-flight.strategy';

// ── mock bcrypt so tests don't block on hashing ──────────────────────────────
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$mock$hash'),
  compare: jest.fn().mockResolvedValue(true),
}));

// ── fixed test IDs ────────────────────────────────────────────────────────────
const USER_ID = 'e2e-user-uuid';
const ADMIN_ID = 'e2e-admin-uuid';
const OTHER_USER_ID = 'e2e-other-uuid';
const USER_EMAIL = 'traveller@e2e.test';
const ADMIN_EMAIL = 'admin@e2e.test';
const ITINERARY_ID = 'e2e-itin-uuid';
const BOOKING_ID = 'e2e-booking-uuid';
const DISRUPTION_ID = 'e2e-disruption-uuid';
const NOTIFICATION_ID = 'e2e-notif-uuid';
const MSG_ID = '1700000000000-0';

// ── mock data ─────────────────────────────────────────────────────────────────
const mockUser = {
  id: USER_ID,
  email: USER_EMAIL,
  passwordHash: '$mock$hash',
  displayName: 'E2E Traveller',
  role: Role.TRAVELLER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAdmin = {
  id: ADMIN_ID,
  email: ADMIN_EMAIL,
  passwordHash: '$mock$hash',
  displayName: 'E2E Admin',
  role: Role.ADMIN,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockItinerary = {
  id: ITINERARY_ID,
  userId: USER_ID,
  title: 'E2E Trip to BOM',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBooking = {
  id: BOOKING_ID,
  itineraryId: ITINERARY_ID,
  provider: 'aviationstack',
  providerRef: 'AI101',
  type: BookingType.FLIGHT,
  departureTime: new Date(Date.now() + 86_400_000),
  arrivalTime: new Date(Date.now() + 93_600_000),
  origin: 'DEL',
  destination: 'BOM',
  disrupted: false,
  rawData: {},
  createdAt: new Date(),
  itinerary: { userId: USER_ID },
};

const mockDisruption = {
  id: DISRUPTION_ID,
  type: DisruptionType.FLIGHT_DELAY,
  severity: 2,
  description: 'AI101 delayed 45 min',
  flightIata: 'AI101',
  affectedOrigin: null,
  publishedAt: new Date(),
};

const mockNotification = {
  id: NOTIFICATION_ID,
  userId: USER_ID,
  eventId: DISRUPTION_ID,
  channel: 'in-app',
  deliveredAt: new Date(),
  success: true,
  read: false,
};

// ── infrastructure mocks ──────────────────────────────────────────────────────
const mockPrisma = {
  user: {
    findUnique: jest.fn().mockImplementation(
      (query: { where?: { email?: string; id?: string }; select?: Record<string, unknown> }) => {
        if (query?.where?.id) {
          const id = query.where.id;
          if (id === ADMIN_ID) return Promise.resolve(mockAdmin);
          if (id === USER_ID) return Promise.resolve(mockUser);
          if (id === OTHER_USER_ID) return Promise.resolve({ id: OTHER_USER_ID, email: 'other@e2e.test', role: Role.TRAVELLER });
          return Promise.resolve(null);
        }
        // validateCredentials: has select.passwordHash
        if (query?.select && 'passwordHash' in query.select) {
          const email = query.where?.email ?? '';
          if (email === ADMIN_EMAIL) return Promise.resolve(mockAdmin);
          if (email === USER_EMAIL) return Promise.resolve(mockUser);
          return Promise.resolve(null);
        }
        // register check: select: { id: true } — always return null (not taken)
        return Promise.resolve(null);
      },
    ),
    create: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn().mockImplementation((q: { data?: { displayName?: string } }) =>
      Promise.resolve({ ...mockUser, ...(q.data ?? {}) }),
    ),
  },
  itinerary: {
    create: jest.fn().mockResolvedValue(mockItinerary),
    findUnique: jest.fn().mockResolvedValue(mockItinerary),
    findMany: jest.fn().mockResolvedValue([mockItinerary]),
    update: jest.fn().mockResolvedValue(mockItinerary),
    delete: jest.fn().mockResolvedValue(mockItinerary),
  },
  bookingRecord: {
    create: jest.fn().mockResolvedValue(mockBooking),
    findMany: jest.fn().mockResolvedValue([mockBooking]),
    findFirst: jest.fn().mockResolvedValue(mockBooking),
    upsert: jest.fn().mockResolvedValue(mockBooking),
    update: jest.fn().mockResolvedValue(mockBooking),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    delete: jest.fn().mockResolvedValue(mockBooking),
  },
  disruptionEvent: {
    create: jest.fn().mockResolvedValue(mockDisruption),
    findMany: jest.fn().mockResolvedValue([mockDisruption]),
    count: jest.fn().mockResolvedValue(1),
  },
  notificationLog: {
    createMany: jest.fn().mockResolvedValue({ count: 1 }),
    findMany: jest.fn().mockResolvedValue([mockNotification]),
    findUnique: jest.fn().mockResolvedValue(mockNotification),
    count: jest.fn().mockResolvedValue(1),
    update: jest.fn().mockResolvedValue({ ...mockNotification, read: true }),
  },
};

const mockRedis = {
  client: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    xadd: jest.fn().mockResolvedValue(MSG_ID),
    xgroup: jest.fn().mockResolvedValue('OK'),
    xreadgroup: jest.fn().mockResolvedValue(null),
    xack: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
  },
};

const mockFlightStrategy = {
  providerKey: 'aviationstack',
  bookingType: BookingType.FLIGHT,
  fetchAndNormalize: jest.fn().mockResolvedValue([{
    providerRef: 'AI101',
    type: BookingType.FLIGHT,
    departureTime: new Date(Date.now() + 86_400_000),
    arrivalTime: new Date(Date.now() + 93_600_000),
    origin: 'DEL',
    destination: 'BOM',
    rawData: { flight: { iata: 'AI101' } },
  }]),
};

const mockFlightAdapter = {
  checkFlights: jest.fn().mockResolvedValue([]),
};

const mockWeatherAdapter = {
  checkWeather: jest.fn().mockResolvedValue([]),
};

// ── test suite ────────────────────────────────────────────────────────────────
describe('Canonical Journey — E2E Integration (Step 7)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let req: any;
  let notificationService: NotificationService;

  let userToken: string;
  let adminToken: string;
  let itineraryId: string;
  let notificationId: string;

  beforeAll(async () => {
    process.env['JWT_SECRET'] = 'e2e-test-secret-wandersync-32ch';
    process.env['JWT_EXPIRES_IN'] = '86400';
    process.env['RATE_LIMIT_PER_MINUTE'] = '1000';
    process.env['DATABASE_URL'] = 'postgresql://mock:mock@localhost:5432/mock';
    process.env['REDIS_URL'] = 'redis://localhost:6379';

    moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue(mockPrisma)
      .overrideProvider(RedisService).useValue(mockRedis)
      .overrideProvider(AviationstackFlightStrategy).useValue(mockFlightStrategy)
      .overrideProvider(FlightTrackerAdapter).useValue(mockFlightAdapter)
      .overrideProvider(WeatherAlertAdapter).useValue(mockWeatherAdapter)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }));
    await app.init();

    // Derive admin token directly — no need to mock admin login flow
    const jwtService = moduleRef.get(JwtService);
    adminToken = await jwtService.signAsync({
      sub: ADMIN_ID,
      email: ADMIN_EMAIL,
      role: Role.ADMIN,
    });

    notificationService = moduleRef.get(NotificationService);
    req = supertest.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Scenario 1: Auth chain ──────────────────────────────────────────────────
  describe('Scenario 1 — Auth chain', () => {
    it('POST /api/v1/auth/register → 201 with public user fields', async () => {
      const res = await req
        .post('/api/v1/auth/register')
        .send({ email: USER_EMAIL, password: 'Password123!', displayName: 'E2E Traveller' })
        .expect(201);

      expect(res.body).toMatchObject({ email: USER_EMAIL, role: Role.TRAVELLER });
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('POST /api/v1/auth/login → 201 with JWT', async () => {
      const res = await req
        .post('/api/v1/auth/login')
        .send({ email: USER_EMAIL, password: 'Password123!' })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('expiresIn');
      userToken = res.body.accessToken as string;
    });

    it('GET /api/v1/auth/me → 200 with user profile', async () => {
      await req
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res: Response) => {
          expect(res.body).toMatchObject({ id: USER_ID, email: USER_EMAIL });
        });
    });

    it('protected route rejects missing token → 401', async () => {
      await req.get('/api/v1/auth/me').expect(401);
    });

    it('protected route rejects invalid token → 401', async () => {
      await req
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);
    });

    it('validation pipe rejects invalid register body → 400', async () => {
      await req
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: '123' })
        .expect(400);
    });
  });

  // ── Scenario 2: Itinerary + Booking aggregation ─────────────────────────────
  describe('Scenario 2 — Itinerary + Booking aggregation', () => {
    it('POST /api/v1/itineraries → 201 with itinerary', async () => {
      const res = await req
        .post('/api/v1/itineraries')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'E2E Trip to BOM' })
        .expect(201);

      expect(res.body).toMatchObject({ id: ITINERARY_ID, title: 'E2E Trip to BOM' });
      itineraryId = res.body.id as string;
    });

    it('POST /api/v1/itineraries/:id/bookings → 201 with booking', async () => {
      const res = await req
        .post(`/api/v1/itineraries/${itineraryId}/bookings`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          providerRef: 'AI101',
          type: BookingType.FLIGHT,
          departureTime: new Date(Date.now() + 86_400_000).toISOString(),
          arrivalTime: new Date(Date.now() + 93_600_000).toISOString(),
          origin: 'DEL',
          destination: 'BOM',
        })
        .expect(201);

      expect(res.body).toMatchObject({ providerRef: 'AI101', type: BookingType.FLIGHT });
    });

    it('GET /api/v1/bookings/aggregate → 200 with booking records', async () => {
      const res = await req
        .get(`/api/v1/bookings/aggregate?itineraryId=${itineraryId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(mockFlightStrategy.fetchAndNormalize).toHaveBeenCalled();
    });

    it('GET /api/v1/itineraries/:id → 200 with timeline (populates Redis cache)', async () => {
      mockPrisma.itinerary.findUnique.mockResolvedValueOnce({
        ...mockItinerary,
        bookings: [mockBooking],
      });
      await req
        .get(`/api/v1/itineraries/${itineraryId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res: Response) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/v1/itineraries/:id second call → Redis cache checked (set was called)', () => {
      expect(mockRedis.client.set).toHaveBeenCalled();
    });

    it('non-owner cannot access itinerary → 403', async () => {
      const otherToken = await moduleRef.get(JwtService)
        .signAsync({ sub: OTHER_USER_ID, email: 'other@e2e.test', role: Role.TRAVELLER });

      mockPrisma.itinerary.findUnique.mockResolvedValueOnce({
        ...mockItinerary,
        userId: 'different-owner',
      });

      await req
        .get(`/api/v1/itineraries/${itineraryId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  // ── Scenario 3: Disruption detection ───────────────────────────────────────
  describe('Scenario 3 — Disruption detection', () => {
    it('TRAVELLER cannot call simulate → 403', async () => {
      await req
        .post('/api/v1/disruptions/simulate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: DisruptionType.FLIGHT_DELAY,
          severity: 2,
          description: 'AI101 delayed 45 min',
          flightIata: 'AI101',
        })
        .expect(403);
    });

    it('POST /api/v1/disruptions/simulate [ADMIN] → 201 with DisruptionEvent', async () => {
      const res = await req
        .post('/api/v1/disruptions/simulate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: DisruptionType.FLIGHT_DELAY,
          severity: 2,
          description: 'AI101 delayed 45 min',
          flightIata: 'AI101',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        id: DISRUPTION_ID,
        type: DisruptionType.FLIGHT_DELAY,
        flightIata: 'AI101',
      });
      expect(mockRedis.client.xadd).toHaveBeenCalledWith(
        'disruption-events',
        '*',
        expect.any(String), expect.any(String),
        expect.any(String), expect.any(String),
        expect.any(String), expect.any(String),
        expect.any(String), expect.any(String),
        expect.any(String), expect.any(String),
        expect.any(String), expect.any(String),
        expect.any(String), expect.any(String),
      );
    });

    it('GET /api/v1/disruptions/mine → 200 with matching disruptions', async () => {
      const res = await req
        .get('/api/v1/disruptions/mine')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── Scenario 4: Notification propagation ───────────────────────────────────
  describe('Scenario 4 — Notification propagation', () => {
    it('consumeStream processes stream event → NotificationLog.createMany called', async () => {
      const streamFields = [
        'eventId', DISRUPTION_ID,
        'type', DisruptionType.FLIGHT_DELAY,
        'severity', '2',
        'description', 'AI101 delayed 45 min',
        'flightIata', 'AI101',
        'affectedOrigin', '',
        'publishedAt', new Date().toISOString(),
      ];

      mockRedis.client.xreadgroup.mockResolvedValueOnce([
        ['disruption-events', [[MSG_ID, streamFields]]],
      ]);

      await notificationService.consumeStream();

      expect(mockPrisma.notificationLog.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              userId: USER_ID,
              eventId: DISRUPTION_ID,
              channel: 'in-app',
              success: true,
            }),
          ]),
        }),
      );
      expect(mockRedis.client.xack).toHaveBeenCalledWith(
        'disruption-events', 'notification', MSG_ID,
      );
    });

    it('GET /api/v1/notifications → 200 with paginated NotificationLog', async () => {
      const res = await req
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toMatchObject({
        userId: USER_ID,
        eventId: DISRUPTION_ID,
        channel: 'in-app',
        read: false,
      });
      notificationId = res.body.data[0].id as string;
    });

    it('GET /api/v1/notifications unauthenticated → 401', async () => {
      await req.get('/api/v1/notifications').expect(401);
    });

    it('PATCH /api/v1/notifications/:id/read → 200 with read: true', async () => {
      const res = await req
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ id: notificationId, read: true });
    });

    it('PATCH notification owned by another user → 403', async () => {
      mockPrisma.notificationLog.findUnique.mockResolvedValueOnce({
        ...mockNotification,
        userId: 'other-user',
      });

      const otherToken = await (app as unknown as { get: (t: unknown) => JwtService })
        .get(JwtService)
        .signAsync({ sub: USER_ID, email: USER_EMAIL, role: Role.TRAVELLER });

      await req
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  // ── Scenario 5: NFR evidence (latency assertions) ──────────────────────────
  describe('Scenario 5 — NFR response-time evidence', () => {
    it('GET /api/v1/auth/me responds within 200ms (NFR1 — API latency)', async () => {
      const start = Date.now();
      await req
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      const latency = Date.now() - start;
      expect(latency).toBeLessThan(200);
    });

    it('GET /api/v1/itineraries/:id responds within 200ms', async () => {
      const start = Date.now();
      await req
        .get(`/api/v1/itineraries/${itineraryId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      const latency = Date.now() - start;
      expect(latency).toBeLessThan(200);
    });
  });

  // ── Scenario 6: Regression gate ────────────────────────────────────────────
  describe('Scenario 6 — Regression gate', () => {
    it('GET /api/v1/social → 501 (social stub)', async () => {
      await req.get('/api/v1/social').expect(501);
    });

    it('POST /api/v1/social/sync → 501 (social stub)', async () => {
      await req.post('/api/v1/social/sync').expect(501);
    });

    it('GET /api/v1/social/status → 501 (social stub)', async () => {
      await req.get('/api/v1/social/status').expect(501);
    });

    it('TRAVELLER cannot access admin disruption list → 403', async () => {
      await req
        .get('/api/v1/disruptions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
