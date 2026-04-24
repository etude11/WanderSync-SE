# Disruption Subsystem Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the disruption subsystem with flight dedup, full ACTIVE→RESOLVED lifecycle, SSE real-time delivery, user acknowledgment, and a rule-based + LLM suggestion pipeline.

**Architecture:** State machine on `DisruptionEvent.status` drives lifecycle transitions in the existing `runPoll()` cron. An in-process rxjs `Subject` (DisruptionEventBus) bridges new events to per-user SSE streams. A Chain of Responsibility (`RuleBasedHandler → LLMHandler → FallbackHandler`) powers the suggestions endpoint.

**Tech Stack:** NestJS, Prisma/PostgreSQL, ioredis, rxjs (already installed), `@anthropic-ai/sdk` (new), React + TypeScript, EventSource (browser native).

**All commits authored by:** Ishaan Romil — `GIT_AUTHOR_NAME="Fane1824" GIT_AUTHOR_EMAIL="ishaan.romil@gmail.com" GIT_COMMITTER_NAME="Fane1824" GIT_COMMITTER_EMAIL="ishaan.romil@gmail.com"`

---

## File Map

### Backend — New Files
| File | Responsibility |
|---|---|
| `src/modules/disruption/disruption-event-bus.service.ts` | In-process rxjs Subject; broadcasts new/resolved DisruptionEvents |
| `src/modules/disruption/disruption-stream.service.ts` | Subscribes to event bus, filters by user's bookings, returns Observable |
| `src/modules/disruption/guards/sse-jwt.guard.ts` | Validates JWT from `?token=` query param for EventSource connections |
| `src/modules/disruption/suggestions/suggestion-handler.interface.ts` | `SuggestionHandler` interface for Chain of Responsibility |
| `src/modules/disruption/suggestions/rule-based.handler.ts` | Lookup-table suggestions parameterized with booking details |
| `src/modules/disruption/suggestions/llm.handler.ts` | Claude Haiku API call with prompt caching + Redis cache |
| `src/modules/disruption/suggestions/fallback.handler.ts` | Always-succeeds generic suggestions |
| `src/modules/disruption/suggestions/disruption-suggestions.service.ts` | Orchestrates the handler chain |

### Backend — Modified Files
| File | What Changes |
|---|---|
| `prisma/schema.prisma` | Add `DisruptionStatus` enum, `status`/`resolvedAt`/`dedupKey` to `DisruptionEvent`, add `DisruptionAck` model |
| `src/modules/disruption/disruption.service.ts` | Flight dedup, auto-resolution pass, severity bug fix, `acknowledge()`, `getSuggestions()` |
| `src/modules/disruption/disruption-publisher.service.ts` | Include `status` + `resolvedAt` in stream; emit to event bus |
| `src/modules/disruption/disruption.controller.ts` | Add `GET stream`, `POST :id/ack`, `GET :id/suggestions` |
| `src/modules/disruption/disruption.module.ts` | Register all new providers |

### Frontend — New Files
| File | Responsibility |
|---|---|
| `frontend/src/hooks/useDisruptionStream.ts` | EventSource → merges events into state |
| `frontend/src/components/Disruption/DisruptionCard.tsx` | Single disruption card with Acknowledge + Suggestions toggle |
| `frontend/src/components/Disruption/SuggestionsPanel.tsx` | Fetches + renders `/disruptions/:id/suggestions` |

### Frontend — Modified Files
| File | What Changes |
|---|---|
| `frontend/src/types/index.ts` | Add `status`, `resolvedAt`, `isAcknowledged` to `Disruption`; fix `severityLabel()` |
| `frontend/src/services/disruptionAPI.ts` | Add `ack()`, `suggestions()` |
| `frontend/src/components/Disruption/DisruptionList.tsx` | ACTIVE / PAST sections; use `DisruptionCard` |
| `frontend/src/pages/DisruptionPage.tsx` | Wire `useDisruptionStream`; remove manual Refresh |
| `frontend/src/components/Layout/TopNavbar.tsx` | Unacknowledged count badge on disruptions link |
| `frontend/src/components/Itinerary/BookingCard.tsx` | Inline "View alert" link when `booking.disrupted` |

---

## Task 1 — Prisma Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update schema**

Replace the existing `DisruptionEvent` model with:

```prisma
enum DisruptionStatus {
  ACTIVE
  RESOLVED
}

model DisruptionEvent {
  id             String           @id @default(uuid())
  type           DisruptionType
  severity       Int
  description    String
  flightIata     String?
  affectedOrigin String?
  status         DisruptionStatus @default(ACTIVE)
  resolvedAt     DateTime?
  dedupKey       String?
  publishedAt    DateTime         @default(now())
  acks           DisruptionAck[]
}

model DisruptionAck {
  id      String          @id @default(uuid())
  userId  String
  eventId String
  ackedAt DateTime        @default(now())
  event   DisruptionEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([userId, eventId])
  @@index([userId])
}
```

- [ ] **Step 2: Generate and run migration**

```bash
cd WanderSync-SE
npx prisma migrate dev --name disruption-lifecycle
```

Expected output: `Your database is now in sync with your schema.`

- [ ] **Step 3: Commit**

```bash
cd WanderSync-SE
GIT_AUTHOR_NAME="Fane1824" GIT_AUTHOR_EMAIL="ishaan.romil@gmail.com" \
GIT_COMMITTER_NAME="Fane1824" GIT_COMMITTER_EMAIL="ishaan.romil@gmail.com" \
git add prisma/schema.prisma prisma/migrations/ && \
git commit -m "add disruption lifecycle status, ack table, and dedup key"
```

---

## Task 2 — Fix Severity Scale Bug (Frontend + Service)

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `src/modules/disruption/disruption.service.ts` (simulateDemoDisruption)
- Modify: `frontend/src/components/Disruption/AlternativeSuggestions.tsx`

- [ ] **Step 1: Fix `severityLabel()` in types**

In `frontend/src/types/index.ts`, replace the `severityLabel` function and `Disruption` interface:

```typescript
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
```

- [ ] **Step 2: Fix severity values in `simulateDemoDisruption`**

In `src/modules/disruption/disruption.service.ts`, update the demo simulation method. The current code incorrectly uses `severity: 60` and `severity: 45` (a 1–100 scale bug). Change to 1–4:

```typescript
async simulateDemoDisruption(userId: string): Promise<DisruptionEvent> {
  const flight = await this.prisma.bookingRecord.findFirst({
    where: { itinerary: { userId }, type: BookingType.FLIGHT },
    orderBy: { createdAt: 'asc' },
  });
  const anyBooking = !flight
    ? await this.prisma.bookingRecord.findFirst({ where: { itinerary: { userId } } })
    : null;

  const dedupKey = flight
    ? `flight:${flight.providerRef}:FLIGHT_DELAY`
    : `weather:${anyBooking?.origin ?? 'DEL'}:demo`;

  const event = await this.prisma.disruptionEvent.create({
    data: flight
      ? {
          type: 'FLIGHT_DELAY',
          severity: 2,
          description: `Delay detected for flight ${flight.providerRef}`,
          flightIata: flight.providerRef,
          affectedOrigin: null,
          dedupKey,
        }
      : {
          type: 'WEATHER_ALERT',
          severity: 3,
          description: `Weather alert for ${anyBooking?.origin ?? 'DEL'}`,
          flightIata: null,
          affectedOrigin: anyBooking?.origin ?? 'DEL',
          dedupKey,
        },
  });
  await this.publisher.publish(event);
  return event;
}
```

- [ ] **Step 3: Fix type bug in AlternativeSuggestions stub**

In `frontend/src/components/Disruption/AlternativeSuggestions.tsx`, the stub compares `disruption.severity === 'CRITICAL'` but severity is a number. This component will be fully replaced in Task 12 (SuggestionsPanel), but fix the crash for now:

```typescript
function getSuggestions(disruption: Disruption): string[] {
  if (disruption.severity >= 4) {
    return ['Contact airline for rebooking', 'Check travel insurance', 'Monitor real-time updates'];
  }
  return ['Check for alternative flights', 'Update hotel check-in accordingly'];
}
```

- [ ] **Step 4: Commit**

```bash
cd WanderSync-SE
GIT_AUTHOR_NAME="Fane1824" GIT_AUTHOR_EMAIL="ishaan.romil@gmail.com" \
GIT_COMMITTER_NAME="Fane1824" GIT_COMMITTER_EMAIL="ishaan.romil@gmail.com" \
git add frontend/src/types/index.ts \
        frontend/src/components/Disruption/AlternativeSuggestions.tsx \
        src/modules/disruption/disruption.service.ts && \
git commit -m "fix severity scale: backend uses 1-4 not 1-100"
```

---

## Task 3 — Flight Event Deduplication

**Files:**
- Modify: `src/modules/disruption/disruption.service.ts`

- [ ] **Step 1: Add dedup logic to `runPoll()`**

In `disruption.service.ts`, replace the `allDisruptions.map` block inside `runPoll()` with the version below. The key change: generate a `dedupKey` for each detection and skip if a Redis entry already exists (flight events 30 min, weather already has its own 24h dedup):

```typescript
await Promise.allSettled(
  allDisruptions.map(async (d) => {
    // Deduplicate weather events (existing logic, unchanged)
    if (d.affectedOrigin && !d.flightIata) {
      const key = `disruption-weather-seen:${d.affectedOrigin}:${d.description.toLowerCase().replace(/\s+/g, '-').slice(0, 50)}`;
      const result = await this.redis.client.set(key, '1', 'EX', 86400, 'NX');
      if (result === null) return;
    }

    // Deduplicate flight events (new logic)
    let dedupKey: string | null = null;
    if (d.flightIata) {
      dedupKey = `flight:${d.flightIata}:${d.type}`;
      const flightDedupResult = await this.redis.client.set(
        `disruption-flight-seen:${dedupKey}`, '1', 'EX', 1800, 'NX',
      );
      if (flightDedupResult === null) return;
    }

    const event = await this.prisma.disruptionEvent.create({
      data: {
        type: d.type,
        severity: d.severity,
        description: d.description,
        flightIata: d.flightIata ?? null,
        affectedOrigin: d.affectedOrigin ?? null,
        dedupKey,
      },
    });

    if (d.flightIata) {
      await this.prisma.bookingRecord.updateMany({
        where: { providerRef: d.flightIata, disrupted: false },
        data: { disrupted: true },
      });
    } else if (d.affectedOrigin) {
      await this.prisma.bookingRecord.updateMany({
        where: { origin: d.affectedOrigin, disrupted: false },
        data: { disrupted: true },
      });
    }

    await this.publisher.publish(event);
  }),
);
```

- [ ] **Step 2: Commit**

```bash
cd WanderSync-SE
GIT_AUTHOR_NAME="Fane1824" GIT_AUTHOR_EMAIL="ishaan.romil@gmail.com" \
GIT_COMMITTER_NAME="Fane1824" GIT_COMMITTER_EMAIL="ishaan.romil@gmail.com" \
git add src/modules/disruption/disruption.service.ts && \
git commit -m "deduplicate flight disruption events with 30-min Redis TTL"
```

---

## Task 4 — Auto-Resolution Pass + Publisher Update

**Files:**
- Modify: `src/modules/disruption/disruption.service.ts`
- Modify: `src/modules/disruption/disruption-publisher.service.ts`

- [ ] **Step 1: Update publisher to include `status` and `resolvedAt`**

Replace `disruption-publisher.service.ts` entirely:

```typescript
import { Injectable } from '@nestjs/common';
import { DisruptionEvent } from '@prisma/client';
import { RedisService } from '../../database/redis.service';

@Injectable()
export class DisruptionPublisherService {
  private static readonly STREAM_KEY = 'disruption-events';

  constructor(private readonly redis: RedisService) {}

  async publish(event: DisruptionEvent): Promise<void> {
    await this.redis.client.xadd(
      DisruptionPublisherService.STREAM_KEY,
      '*',
      'eventId',       event.id,
      'type',          event.type,
      'severity',      String(event.severity),
      'description',   event.description,
      'flightIata',    event.flightIata ?? '',
      'affectedOrigin', event.affectedOrigin ?? '',
      'status',        event.status,
      'resolvedAt',    event.resolvedAt?.toISOString() ?? '',
      'publishedAt',   event.publishedAt.toISOString(),
    );
  }
}
```

- [ ] **Step 2: Add auto-resolution pass to `runPoll()`**

At the end of `runPoll()`, after the existing `Promise.allSettled` block, add:

```typescript
// Resolution pass — check if any ACTIVE events have cleared
const activeEvents = await this.prisma.disruptionEvent.findMany({
  where: { status: 'ACTIVE' },
});

if (activeEvents.length > 0) {
  const activeFlightIatas = activeEvents
    .filter(e => e.flightIata)
    .map(e => e.flightIata!);
  const activeOrigins = activeEvents
    .filter(e => e.affectedOrigin && !e.flightIata)
    .map(e => e.affectedOrigin!);

  const [reCheckedFlights, reCheckedWeather] = await Promise.allSettled([
    activeFlightIatas.length > 0
      ? this.flightAdapter.checkFlights(activeFlightIatas)
      : Promise.resolve([]),
    activeOrigins.length > 0
      ? this.weatherAdapter.checkWeather(activeOrigins)
      : Promise.resolve([]),
  ]);

  const stillActiveFlightIatas = new Set(
    (reCheckedFlights.status === 'fulfilled' ? reCheckedFlights.value : [])
      .filter(d => d.flightIata)
      .map(d => d.flightIata!),
  );
  const stillActiveOrigins = new Set(
    (reCheckedWeather.status === 'fulfilled' ? reCheckedWeather.value : [])
      .filter(d => d.affectedOrigin)
      .map(d => d.affectedOrigin!),
  );

  await Promise.allSettled(
    activeEvents.map(async (event) => {
      const isStillActive = event.flightIata
        ? stillActiveFlightIatas.has(event.flightIata)
        : event.affectedOrigin
          ? stillActiveOrigins.has(event.affectedOrigin)
          : false;

      if (!isStillActive) {
        const resolved = await this.prisma.disruptionEvent.update({
          where: { id: event.id },
          data: { status: 'RESOLVED', resolvedAt: new Date() },
        });
        // Clear flight dedup key so future occurrences are detected fresh
        if (event.dedupKey) {
          await this.redis.client.del(`disruption-flight-seen:${event.dedupKey}`);
        }
        await this.publisher.publish(resolved);
      }
    }),
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd WanderSync-SE
GIT_AUTHOR_NAME="Fane1824" GIT_AUTHOR_EMAIL="ishaan.romil@gmail.com" \
GIT_COMMITTER_NAME="Fane1824" GIT_COMMITTER_EMAIL="ishaan.romil@gmail.com" \
git add src/modules/disruption/disruption.service.ts \
        src/modules/disruption/disruption-publisher.service.ts && \
git commit -m "auto-resolve disruption events when underlying condition clears"
```

---

## Task 5 — In-Process Event Bus + SSE Stream Service

**Files:**
- Create: `src/modules/disruption/disruption-event-bus.service.ts`
- Create: `src/modules/disruption/disruption-stream.service.ts`
- Modify: `src/modules/disruption/disruption-publisher.service.ts`

- [ ] **Step 1: Create DisruptionEventBus**

Create `src/modules/disruption/disruption-event-bus.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { DisruptionEvent } from '@prisma/client';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class DisruptionEventBus {
  private readonly subject = new Subject<DisruptionEvent>();

  readonly events$: Observable<DisruptionEvent> = this.subject.asObservable();

  emit(event: DisruptionEvent): void {
    this.subject.next(event);
  }
}
```

- [ ] **Step 2: Wire event bus into publisher**

Update `disruption-publisher.service.ts` to also emit to the in-process bus:

```typescript
import { Injectable } from '@nestjs/common';
import { DisruptionEvent } from '@prisma/client';
import { RedisService } from '../../database/redis.service';
import { DisruptionEventBus } from './disruption-event-bus.service';

@Injectable()
export class DisruptionPublisherService {
  private static readonly STREAM_KEY = 'disruption-events';

  constructor(
    private readonly redis: RedisService,
    private readonly eventBus: DisruptionEventBus,
  ) {}

  async publish(event: DisruptionEvent): Promise<void> {
    await this.redis.client.xadd(
      DisruptionPublisherService.STREAM_KEY,
      '*',
      'eventId',        event.id,
      'type',           event.type,
      'severity',       String(event.severity),
      'description',    event.description,
      'flightIata',     event.flightIata ?? '',
      'affectedOrigin', event.affectedOrigin ?? '',
      'status',         event.status,
      'resolvedAt',     event.resolvedAt?.toISOString() ?? '',
      'publishedAt',    event.publishedAt.toISOString(),
    );
    // Emit to in-process bus for SSE delivery
    this.eventBus.emit(event);
  }
}
```

- [ ] **Step 3: Create DisruptionStreamService**

Create `src/modules/disruption/disruption-stream.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import { DisruptionEvent } from '@prisma/client';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma.service';
import { DisruptionEventBus } from './disruption-event-bus.service';

@Injectable()
export class DisruptionStreamService {
  constructor(
    private readonly eventBus: DisruptionEventBus,
    private readonly prisma: PrismaService,
  ) {}

  async streamForUser(userId: string): Promise<Observable<MessageEvent>> {
    const bookings = await this.prisma.bookingRecord.findMany({
      where: { itinerary: { userId } },
      select: { providerRef: true, origin: true },
    });

    const flightRefs = new Set(bookings.map((b) => b.providerRef));
    const origins = new Set(bookings.map((b) => b.origin));

    return this.eventBus.events$.pipe(
      filter(
        (event: DisruptionEvent) =>
          (event.flightIata != null && flightRefs.has(event.flightIata)) ||
          (event.affectedOrigin != null && origins.has(event.affectedOrigin)),
      ),
      map((event: DisruptionEvent): MessageEvent => ({
        id: event.id,
        data: {
          id:             event.id,
          type:           event.type,
          severity:       event.severity,
          description:    event.description,
          flightIata:     event.flightIata,
          affectedOrigin: event.affectedOrigin,
          status:         event.status,
          resolvedAt:     event.resolvedAt?.toISOString() ?? null,
          publishedAt:    event.publishedAt.toISOString(),
          isAcknowledged: false,
        },
      })),
    );
  }
}
```

- [ ] **Step 4: Commit**

```bash
cd WanderSync-SE
GIT_AUTHOR_NAME="Fane1824" GIT_AUTHOR_EMAIL="ishaan.romil@gmail.com" \
GIT_COMMITTER_NAME="Fane1824" GIT_COMMITTER_EMAIL="ishaan.romil@gmail.com" \
git add src/modules/disruption/disruption-event-bus.service.ts \
        src/modules/disruption/disruption-stream.service.ts \
        src/modules/disruption/disruption-publisher.service.ts && \
git commit -m "add in-process event bus and SSE stream service"
```

---

## Task 6 — SSE Guard + New Controller Endpoints

**Files:**
- Create: `src/modules/disruption/guards/sse-jwt.guard.ts`
- Modify: `src/modules/disruption/disruption.controller.ts`
- Modify: `src/modules/disruption/disruption.service.ts` (add `acknowledge`, `getSuggestions`, update `findMine`)

- [ ] **Step 1: Create SSE JWT guard**

Create `src/modules/disruption/guards/sse-jwt.guard.ts`:

```typescript
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SseJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token: string | undefined = req.query?.token;
    if (!token) throw new UnauthorizedException();
    try {
      req.user = this.jwtService.verify(token, {
        secret: this.config.get<string>('jwt.secret'),
      });
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
```

- [ ] **Step 2: Add `acknowledge` and `findMine` update to service**

Add these methods to `DisruptionService` in `disruption.service.ts`:

```typescript
async acknowledge(eventId: string, userId: string): Promise<void> {
  await this.prisma.disruptionAck.upsert({
    where: { userId_eventId: { userId, eventId } },
    create: { userId, eventId },
    update: {},
  });
}

async findMine(userId: string): Promise<(DisruptionEvent & { isAcknowledged: boolean })[]> {
  const bookings = await this.prisma.bookingRecord.findMany({
    where: { itinerary: { userId } },
    select: { providerRef: true, origin: true, type: true },
  });

  if (bookings.length === 0) return [];

  const flightRefs = bookings
    .filter((b) => b.type === BookingType.FLIGHT)
    .map((b) => b.providerRef);
  const origins = [...new Set(bookings.map((b) => b.origin))];

  const events = await this.prisma.disruptionEvent.findMany({
    where: {
      OR: [
        { flightIata: { in: flightRefs } },
        { affectedOrigin: { in: origins } },
      ],
    },
    include: { acks: { where: { userId }, select: { id: true } } },
    orderBy: { publishedAt: 'desc' },
  });

  return events.map(({ acks, ...event }) => ({
    ...event,
    isAcknowledged: acks.length > 0,
  }));
}
```

Note: Remove the old `findMine` method and replace with this one (the signature changes to include `isAcknowledged`).

- [ ] **Step 3: Update controller with all new endpoints**

Replace `disruption.controller.ts` entirely:

```typescript
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Param,
  Post,
  Query,
  Req,
  Res,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Observable } from 'rxjs';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { SimulateDisruptionDto } from './dto/simulate-disruption.dto';
import { DisruptionService } from './disruption.service';
import { DisruptionStreamService } from './disruption-stream.service';
import { SseJwtGuard } from './guards/sse-jwt.guard';

@Controller('disruptions')
export class DisruptionController {
  constructor(
    private readonly disruptionService: DisruptionService,
    private readonly streamService: DisruptionStreamService,
  ) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.disruptionService.findMine(user.userId);
  }

  @Sse('stream')
  @UseGuards(SseJwtGuard)
  async stream(@Req() req: any): Promise<Observable<MessageEvent>> {
    return this.streamService.streamForUser(req.user.userId);
  }

  @Post(':id/ack')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  acknowledge(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.disruptionService.acknowledge(id, user.userId);
  }

  @Get(':id/suggestions')
  @UseGuards(JwtAuthGuard)
  getSuggestions(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.disruptionService.getSuggestions(id, user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.disruptionService.findAll(Number(page), Number(limit));
  }

  @Post('simulate-demo')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  simulateDemo(@CurrentUser() user: AuthenticatedUser) {
    return this.disruptionService.simulateDemoDisruption(user.userId);
  }

  @Post('simulate')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  simulate(@Body() dto: SimulateDisruptionDto) {
    return this.disruptionService.simulateDisruption(dto);
  }
}
```

- [ ] **Step 4: Commit**

```bash
cd WanderSync-SE
GIT_AUTHOR_NAME="Fane1824" GIT_AUTHOR_EMAIL="ishaan.romil@gmail.com" \
GIT_COMMITTER_NAME="Fane1824" GIT_COMMITTER_EMAIL="ishaan.romil@gmail.com" \
git add src/modules/disruption/guards/sse-jwt.guard.ts \
        src/modules/disruption/disruption.controller.ts \
        src/modules/disruption/disruption.service.ts && \
git commit -m "add SSE stream, acknowledgment, and suggestions endpoints"
```

---

## Task 7 — Suggestions Service (Chain of Responsibility)

**Files:**
- Create: `src/modules/disruption/suggestions/suggestion-handler.interface.ts`
- Create: `src/modules/disruption/suggestions/rule-based.handler.ts`
- Create: `src/modules/disruption/suggestions/llm.handler.ts`
- Create: `src/modules/disruption/suggestions/fallback.handler.ts`
- Create: `src/modules/disruption/suggestions/disruption-suggestions.service.ts`
- Modify: `src/modules/disruption/disruption.service.ts` (add `getSuggestions`)

- [ ] **Step 1: Install Anthropic SDK**

```bash
cd WanderSync-SE
npm install @anthropic-ai/sdk
```

Expected: `added 1 package` (or similar).

- [ ] **Step 2: Add `ANTHROPIC_API_KEY` to environment config**

In `.env` (and `.env.example`), add:
```
ANTHROPIC_API_KEY=your_key_here
```

In `src/config/configuration.ts` (or wherever the app config factory is), add:
```typescript
anthropic: {
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
},
```

- [ ] **Step 3: Create `SuggestionContext` interface and `SuggestionHandler` interface**

Create `src/modules/disruption/suggestions/suggestion-handler.interface.ts`:

```typescript
import { DisruptionEvent, BookingRecord } from '@prisma/client';

export interface SuggestionContext {
  event: DisruptionEvent;
  booking: BookingRecord | null;
}

export interface SuggestionHandler {
  handle(ctx: SuggestionContext, next: () => Promise<string[]>): Promise<string[]>;
}
```

- [ ] **Step 4: Create IATA airline prefix map**

Create `src/modules/disruption/suggestions/iata-airlines.ts`:

```typescript
export const IATA_AIRLINE_NAMES: Record<string, string> = {
  AA: 'American Airlines',
  AI: 'Air India',
  BA: 'British Airways',
  DL: 'Delta Air Lines',
  EK: 'Emirates',
  EY: 'Etihad Airways',
  G8: 'Go First',
  IG: 'Air Italy',
  IK: 'Air Asia India',
  IX: 'Air India Express',
  LH: 'Lufthansa',
  QF: 'Qantas',
  QR: 'Qatar Airways',
  SG: 'SpiceJet',
  SQ: 'Singapore Airlines',
  UA: 'United Airlines',
  UK: 'Vistara',
  '6E': 'IndiGo',
};

export function airlineFromIata(iata: string): string {
  const prefix = iata.slice(0, 2).toUpperCase();
  return IATA_AIRLINE_NAMES[prefix] ?? iata;
}
```

- [ ] **Step 5: Create RuleBasedHandler**

Create `src/modules/disruption/suggestions/rule-based.handler.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { DisruptionType } from '@prisma/client';
import { SuggestionContext, SuggestionHandler } from './suggestion-handler.interface';
import { airlineFromIata } from './iata-airlines';

type RuleKey = `${DisruptionType}:${number}`;

const RULES: Partial<Record<RuleKey, (ctx: SuggestionContext) => string[]>> = {
  'FLIGHT_CANCELLATION:4': ({ event, booking }) => {
    const airline = event.flightIata ? airlineFromIata(event.flightIata) : 'your airline';
    const origin = booking?.origin ?? event.affectedOrigin ?? 'your origin';
    return [
      `Request a full refund from ${airline}`,
      `Search for alternative routes departing from ${origin}`,
      'File a claim with your travel insurance provider',
      'Contact your accommodation about flexible check-in if plans change',
    ];
  },
  'FLIGHT_CANCELLATION:3': ({ event }) => {
    const airline = event.flightIata ? airlineFromIata(event.flightIata) : 'your airline';
    return [
      `Contact ${airline} to rebook on the next available flight`,
      'Check for partner airline availability on the same route',
      'Review your travel insurance policy for cancellation cover',
    ];
  },
  'FLIGHT_DELAY:3': ({ event }) => {
    const airline = event.flightIata ? airlineFromIata(event.flightIata) : 'your airline';
    return [
      'Request a meal voucher if delay exceeds 3 hours (EU261 rights apply)',
      `Contact ${airline} for overnight accommodation if delay extends past midnight`,
      'Notify your hotel and ground transfers of the updated arrival time',
    ];
  },
  'FLIGHT_DELAY:2': ({ event }) => [
    `Monitor ${event.flightIata ?? 'your flight'} status for further updates`,
    'Notify your hotel reception and any transfer services of the delay',
  ],
  'FLIGHT_DIVERSION:3': ({ event }) => {
    const airline = event.flightIata ? airlineFromIata(event.flightIata) : 'your airline';
    return [
      `Contact ${airline} for ground transport from the diversion airport`,
      'Check if your travel insurance covers diversion-related costs',
      'Alert your accommodation about the revised arrival time',
    ];
  },
  'WEATHER_ALERT:4': ({ booking }) => {
    const origin = booking?.origin ?? 'your departure city';
    return [
      `Consider postponing or rebooking travel departing from ${origin}`,
      'Contact all ground transport providers to reschedule pickups',
      'Check airline weather waiver policies for fee-free rebooking',
      'Monitor official weather service advisories for updates',
    ];
  },
  'WEATHER_ALERT:3': ({ booking }) => {
    const origin = booking?.origin ?? 'your departure city';
    return [
      `Check if your airline offers free rebooking for weather events from ${origin}`,
      'Contact your accommodation about flexible check-in or date changes',
      'Stay updated via the local meteorological authority',
    ];
  },
};

@Injectable()
export class RuleBasedHandler implements SuggestionHandler {
  async handle(ctx: SuggestionContext, next: () => Promise<string[]>): Promise<string[]> {
    const key = `${ctx.event.type}:${ctx.event.severity}` as RuleKey;
    const ruleFn = RULES[key];
    if (ruleFn) {
      return ruleFn(ctx);
    }
    return next();
  }
}
```

- [ ] **Step 6: Create LLMHandler**

Create `src/modules/disruption/suggestions/llm.handler.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { SuggestionContext, SuggestionHandler } from './suggestion-handler.interface';

@Injectable()
export class LLMHandler implements SuggestionHandler {
  private readonly logger = new Logger(LLMHandler.name);
  private readonly client: Anthropic;

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('anthropic.apiKey') ?? '',
    });
  }

  async handle(ctx: SuggestionContext, next: () => Promise<string[]>): Promise<string[]> {
    try {
      const { event, booking } = ctx;
      const origin = booking?.origin ?? event.affectedOrigin ?? 'unknown';
      const destination = booking?.destination ?? 'unknown';
      const departure = booking?.departureTime?.toISOString() ?? 'unknown';

      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: [
          {
            type: 'text',
            text: 'You are a travel disruption assistant for WanderSync. Given a travel disruption, return 3-4 concise, actionable suggestions as a JSON array of strings. Each suggestion should be specific to the disruption details provided. Respond ONLY with a valid JSON array, no explanation.',
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `Disruption: ${event.type.replace(/_/g, ' ')} (severity ${event.severity}/4)\nDescription: ${event.description}\nRoute: ${origin} → ${destination}\nDeparture: ${departure}\n\nReturn a JSON array of 3-4 actionable suggestions.`,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]';
      const parsed: string[] = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return next();
    } catch (err) {
      this.logger.warn(`LLMHandler failed: ${(err as Error).message}`);
      return next();
    }
  }
}
```

- [ ] **Step 7: Create FallbackHandler**

Create `src/modules/disruption/suggestions/fallback.handler.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { SuggestionContext, SuggestionHandler } from './suggestion-handler.interface';

@Injectable()
export class FallbackHandler implements SuggestionHandler {
  async handle(_ctx: SuggestionContext, _next: () => Promise<string[]>): Promise<string[]> {
    return [
      'Check the airline website for the latest flight status',
      'Contact your travel agent for rebooking assistance',
      'Review your travel insurance policy for applicable coverage',
    ];
  }
}
```

- [ ] **Step 8: Create DisruptionSuggestionsService**

Create `src/modules/disruption/suggestions/disruption-suggestions.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { SuggestionContext } from './suggestion-handler.interface';
import { RuleBasedHandler } from './rule-based.handler';
import { LLMHandler } from './llm.handler';
import { FallbackHandler } from './fallback.handler';

@Injectable()
export class DisruptionSuggestionsService {
  constructor(
    private readonly ruleBased: RuleBasedHandler,
    private readonly llm: LLMHandler,
    private readonly fallback: FallbackHandler,
  ) {}

  async suggest(ctx: SuggestionContext): Promise<string[]> {
    // Chain: RuleBased → LLM → Fallback
    return this.ruleBased.handle(
      ctx,
      () => this.llm.handle(
        ctx,
        () => this.fallback.handle(ctx, async () => []),
      ),
    );
  }
}
```

- [ ] **Step 9: Add `getSuggestions` to DisruptionService**

In `disruption.service.ts`, inject `DisruptionSuggestionsService` and add:

At the top, add to constructor:
```typescript
// Add to constructor parameters:
private readonly suggestionsService: DisruptionSuggestionsService,
```

Add this import at the top of the file:
```typescript
import { DisruptionSuggestionsService } from './suggestions/disruption-suggestions.service';
import { NotFoundException } from '@nestjs/common';
```

Add this method to the class:
```typescript
async getSuggestions(eventId: string, userId: string): Promise<string[]> {
  const cacheKey = `suggestions:${eventId}`;
  const cached = await this.redis.client.get(cacheKey);
  if (cached) return JSON.parse(cached) as string[];

  const event = await this.prisma.disruptionEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new NotFoundException(`DisruptionEvent ${eventId} not found`);

  const booking = event.flightIata
    ? await this.prisma.bookingRecord.findFirst({
        where: { providerRef: event.flightIata, itinerary: { userId } },
      })
    : event.affectedOrigin
      ? await this.prisma.bookingRecord.findFirst({
          where: { origin: event.affectedOrigin, itinerary: { userId } },
        })
      : null;

  const suggestions = await this.suggestionsService.suggest({ event, booking });
  await this.redis.client.set(cacheKey, JSON.stringify(suggestions), 'EX', 3600);
  return suggestions;
}
```

- [ ] **Step 10: Commit**

```bash
cd WanderSync-SE
GIT_AUTHOR_NAME="Fane1824" GIT_AUTHOR_EMAIL="ishaan.romil@gmail.com" \
GIT_COMMITTER_NAME="Fane1824" GIT_COMMITTER_EMAIL="ishaan.romil@gmail.com" \
git add src/modules/disruption/suggestions/ \
        src/modules/disruption/disruption.service.ts \
        package.json package-lock.json && \
git commit -m "add rule-based + LLM suggestion pipeline with Redis caching"
```

---

## Task 8 — Module Registration

**Files:**
- Modify: `src/modules/disruption/disruption.module.ts`

- [ ] **Step 1: Update module to register all new providers**

Replace `disruption.module.ts` entirely:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { FlightTrackerAdapter } from './adapters/flight-tracker.adapter';
import { WeatherAlertAdapter } from './adapters/weather-alert.adapter';
import { DisruptionEventBus } from './disruption-event-bus.service';
import { DisruptionPublisherService } from './disruption-publisher.service';
import { DisruptionService } from './disruption.service';
import { DisruptionStreamService } from './disruption-stream.service';
import { DisruptionController } from './disruption.controller';
import { SseJwtGuard } from './guards/sse-jwt.guard';
import { RuleBasedHandler } from './suggestions/rule-based.handler';
import { LLMHandler } from './suggestions/llm.handler';
import { FallbackHandler } from './suggestions/fallback.handler';
import { DisruptionSuggestionsService } from './suggestions/disruption-suggestions.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
      }),
    }),
  ],
  controllers: [DisruptionController],
  providers: [
    {
      provide: FlightTrackerAdapter,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new FlightTrackerAdapter(config),
    },
    {
      provide: WeatherAlertAdapter,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new WeatherAlertAdapter(config),
    },
    DisruptionEventBus,
    DisruptionPublisherService,
    DisruptionStreamService,
    DisruptionService,
    SseJwtGuard,
    RuleBasedHandler,
    LLMHandler,
    FallbackHandler,
    DisruptionSuggestionsService,
  ],
  exports: [DisruptionService],
})
export class DisruptionModule {}
```

- [ ] **Step 2: Commit**

```bash
cd WanderSync-SE
GIT_AUTHOR_NAME="Fane1824" GIT_AUTHOR_EMAIL="ishaan.romil@gmail.com" \
GIT_COMMITTER_NAME="Fane1824" GIT_COMMITTER_EMAIL="ishaan.romil@gmail.com" \
git add src/modules/disruption/disruption.module.ts && \
git commit -m "register new disruption providers in module"
```

- [ ] **Step 3: Verify backend compiles and starts**

```bash
cd WanderSync-SE
npm run lint
```

Expected: No errors. If there are errors, fix them before continuing.

---

## Task 9 — Frontend Types + API Service Update

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/services/disruptionAPI.ts`

- [ ] **Step 1: Update disruptionAPI service**

Replace `frontend/src/services/disruptionAPI.ts`:

```typescript
import api from './api';
import type { Disruption } from '@/types';

export const disruptionAPI = {
  mine: () => api.get<Disruption[]>('/disruptions/mine'),
  all: () => api.get<Disruption[]>('/disruptions'),
  simulate: (bookingId: string) => api.post('/disruptions/simulate', { bookingId }),
  simulateDemo: () => api.post<Disruption>('/disruptions/simulate-demo'),
  ack: (id: string) => api.post<void>(`/disruptions/${id}/ack`),
  suggestions: (id: string) => api.get<string[]>(`/disruptions/${id}/suggestions`),
};
```

- [ ] **Step 2: Commit**

```bash
cd WanderSync-SE
GIT_AUTHOR_NAME="Fane1824" GIT_AUTHOR_EMAIL="ishaan.romil@gmail.com" \
GIT_COMMITTER_NAME="Fane1824" GIT_COMMITTER_EMAIL="ishaan.romil@gmail.com" \
git add frontend/src/types/index.ts frontend/src/services/disruptionAPI.ts && \
git commit -m "update disruption types and API client for lifecycle fields"
```

---

## Task 10 — SSE Hook

**Files:**
- Create: `frontend/src/hooks/useDisruptionStream.ts`

- [ ] **Step 1: Create the hook**

Create `frontend/src/hooks/useDisruptionStream.ts`:

```typescript
import { useEffect } from 'react';
import type { Disruption } from '@/types';

// Gets the JWT token from localStorage (where the api service stores it)
function getToken(): string | null {
  return localStorage.getItem('access_token');
}

export function useDisruptionStream(
  onEvent: (disruption: Disruption) => void,
): void {
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const backendUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
    const url = `${backendUrl}/disruptions/stream?token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);

    source.onmessage = (e: MessageEvent) => {
      try {
        const disruption: Disruption = JSON.parse(e.data);
        onEvent(disruption);
      } catch {
        // malformed event — ignore
      }
    };

    source.onerror = () => {
      // EventSource reconnects automatically; no action needed
    };

    return () => {
      source.close();
    };
  // onEvent reference must be stable (wrap in useCallback at call site)
  }, [onEvent]);
}
```

**Note:** The `onEvent` callback passed to this hook must be wrapped in `useCallback` at the call site to avoid reconnecting on every render.

- [ ] **Step 2: Check where access token is stored**

Run this to find where the token is stored:

```bash
cd WanderSync-SE
rg "access_token\|accessToken\|setItem\|localStorage" frontend/src --include="*.ts" --include="*.tsx" -l
```

If the token key differs from `access_token`, update `getToken()` in the hook to match.

- [ ] **Step 3: Commit**

```bash
cd WanderSync-SE
GIT_AUTHOR_NAME="Fane1824" GIT_AUTHOR_EMAIL="ishaan.romil@gmail.com" \
GIT_COMMITTER_NAME="Fane1824" GIT_COMMITTER_EMAIL="ishaan.romil@gmail.com" \
git add frontend/src/hooks/useDisruptionStream.ts && \
git commit -m "add useDisruptionStream hook for real-time SSE delivery"
```

---

## Task 11 — DisruptionCard + Updated DisruptionList + DisruptionPage

**Files:**
- Create: `frontend/src/components/Disruption/DisruptionCard.tsx`
- Modify: `frontend/src/components/Disruption/DisruptionList.tsx`
- Modify: `frontend/src/pages/DisruptionPage.tsx`

- [ ] **Step 1: Create DisruptionCard**

Create `frontend/src/components/Disruption/DisruptionCard.tsx`:

```typescript
import { useState } from 'react';
import type { Disruption, DisruptionSeverityLabel } from '@/types';
import { severityLabel } from '@/types';
import { disruptionAPI } from '@/services/disruptionAPI';
import SuggestionsPanel from './SuggestionsPanel';

const SEV_META: Record<DisruptionSeverityLabel, { label: string; color: string; bg: string; border: string }> = {
  LOW:      { label: 'Low',      color: '#9a6030', bg: 'rgba(216,180,160,0.18)', border: 'rgba(216,180,160,0.40)' },
  MEDIUM:   { label: 'Medium',   color: '#b06020', bg: 'rgba(215,122,97,0.10)', border: 'rgba(215,122,97,0.25)' },
  HIGH:     { label: 'High',     color: '#d77a61', bg: 'rgba(215,122,97,0.14)', border: 'rgba(215,122,97,0.35)' },
  CRITICAL: { label: 'Critical', color: '#c96248', bg: 'rgba(215,122,97,0.18)', border: 'rgba(215,122,97,0.45)' },
};

const BoltIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
  </svg>
);
const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface DisruptionCardProps {
  disruption: Disruption;
  style?: React.CSSProperties;
  onAcknowledged?: (id: string) => void;
}

export default function DisruptionCard({ disruption, style, onAcknowledged }: DisruptionCardProps) {
  const [acking, setAcking] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sev = SEV_META[severityLabel(disruption.severity)];
  const isResolved = disruption.status === 'RESOLVED';

  const handleAck = async () => {
    setAcking(true);
    try {
      await disruptionAPI.ack(disruption.id);
      onAcknowledged?.(disruption.id);
    } finally {
      setAcking(false);
    }
  };

  return (
    <div
      className="rounded-xl px-4 py-3.5 border animate-fade-in"
      style={{ background: sev.bg, borderColor: sev.border, opacity: isResolved || disruption.isAcknowledged ? 0.6 : 1, ...style }}
    >
      <div className="flex items-start gap-2.5">
        <span style={{ color: sev.color, marginTop: '2px' }}><BoltIcon /></span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-semibold text-charcoal">{disruption.type.replace(/_/g, ' ')}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: sev.border, color: sev.color }}>{sev.label}</span>
            {isResolved && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Resolved</span>
            )}
            {disruption.isAcknowledged && !isResolved && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Acknowledged</span>
            )}
          </div>
          <p className="text-xs text-charcoal/60 leading-relaxed">{disruption.description}</p>
          <p className="text-[11px] text-charcoal/35 mt-1.5 font-mono">
            {new Date(disruption.publishedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            {isResolved && disruption.resolvedAt && (
              <> · Resolved {new Date(disruption.resolvedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</>
            )}
          </p>

          {/* Action row */}
          {!disruption.isAcknowledged && !isResolved && (
            <div className="flex items-center gap-3 mt-2.5">
              <button
                onClick={() => setShowSuggestions(v => !v)}
                className="text-xs font-medium underline underline-offset-2 cursor-pointer"
                style={{ color: sev.color }}
              >
                {showSuggestions ? 'Hide suggestions' : 'Get suggestions'}
              </button>
              <button
                onClick={handleAck}
                disabled={acking}
                className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border cursor-pointer transition-opacity"
                style={{ borderColor: sev.border, color: sev.color, opacity: acking ? 0.5 : 1 }}
              >
                <CheckIcon /> {acking ? 'Acknowledging…' : 'Acknowledge'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showSuggestions && <SuggestionsPanel disruptionId={disruption.id} />}
    </div>
  );
}
```

- [ ] **Step 2: Update DisruptionList**

Replace `frontend/src/components/Disruption/DisruptionList.tsx`:

```typescript
import type { Disruption } from '@/types';
import DisruptionCard from './DisruptionCard';

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface DisruptionListProps {
  disruptions: Disruption[];
  onAcknowledged?: (id: string) => void;
}

export default function DisruptionList({ disruptions, onAcknowledged }: DisruptionListProps) {
  const active = disruptions.filter(d => d.status === 'ACTIVE' && !d.isAcknowledged);
  const past = disruptions.filter(d => d.status === 'RESOLVED' || d.isAcknowledged);

  if (disruptions.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl border border-dashed border-dust-grey/60 bg-white/50">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(219,211,216,0.25)' }}>
          <CheckIcon />
        </div>
        <p className="text-sm font-medium text-charcoal/55">All clear</p>
        <p className="text-xs text-charcoal/35 mt-1">No disruptions detected. We'll alert you if anything changes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-charcoal/40 uppercase tracking-wider mb-3">Active</h2>
          <div className="space-y-3">
            {active.map((d, i) => (
              <DisruptionCard
                key={d.id}
                disruption={d}
                style={{ animationDelay: `${i * 60}ms` }}
                onAcknowledged={onAcknowledged}
              />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <details>
            <summary className="text-xs font-semibold text-charcoal/40 uppercase tracking-wider mb-3 cursor-pointer select-none list-none flex items-center gap-1">
              <span>Past / Acknowledged</span>
              <span className="text-charcoal/30 font-mono">({past.length})</span>
            </summary>
            <div className="space-y-3 mt-3">
              {past.map((d, i) => (
                <DisruptionCard
                  key={d.id}
                  disruption={d}
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
          </details>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update DisruptionPage to wire SSE**

Replace `frontend/src/pages/DisruptionPage.tsx`:

```typescript
import { useCallback, useEffect, useState } from 'react';
import { disruptionAPI } from '@/services/disruptionAPI';
import type { Disruption } from '@/types';
import DisruptionList from '@/components/Disruption/DisruptionList';
import LoadingSpinner from '@/components/Shared/LoadingSpinner';
import { useDisruptionStream } from '@/hooks/useDisruptionStream';

const BoltIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
  </svg>
);

export default function DisruptionPage() {
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [loading, setLoading]         = useState(true);
  const [simulating, setSimulating]   = useState(false);

  const load = async () => {
    try {
      const r = await disruptionAPI.mine();
      setDisruptions(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // SSE: merge incoming events into local state
  const handleStreamEvent = useCallback((incoming: Disruption) => {
    setDisruptions(prev => {
      const idx = prev.findIndex(d => d.id === incoming.id);
      if (idx >= 0) {
        // Update existing (e.g., status changed to RESOLVED)
        const next = [...prev];
        next[idx] = incoming;
        return next;
      }
      // New disruption — prepend
      return [incoming, ...prev];
    });
  }, []);

  useDisruptionStream(handleStreamEvent);

  const handleAcknowledged = useCallback((id: string) => {
    setDisruptions(prev =>
      prev.map(d => d.id === id ? { ...d, isAcknowledged: true } : d),
    );
  }, []);

  const activeCount = disruptions.filter(d => d.status === 'ACTIVE' && !d.isAcknowledged).length;

  if (loading) return <LoadingSpinner size="lg" className="h-64" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-charcoal">Disruptions</h1>
          <p className="text-sm text-charcoal/45 mt-0.5">
            {activeCount > 0
              ? `${activeCount} active alert${activeCount !== 1 ? 's' : ''}`
              : 'All systems clear'}
          </p>
        </div>
        <button
          onClick={() => {
            setSimulating(true);
            disruptionAPI.simulateDemo().then(r => {
              setDisruptions(prev => [r.data, ...prev]);
            }).finally(() => setSimulating(false));
          }}
          disabled={simulating}
          className="btn-secondary text-sm flex items-center gap-2 cursor-pointer"
          style={simulating ? {} : { color: '#d77a61', borderColor: 'rgba(215,122,97,0.35)' }}
        >
          <span className={simulating ? 'animate-pulse' : ''}><BoltIcon /></span>
          {simulating ? 'Simulating…' : 'Simulate Disruption'}
        </button>
      </div>

      <DisruptionList disruptions={disruptions} onAcknowledged={handleAcknowledged} />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd WanderSync-SE
GIT_AUTHOR_NAME="Fane1824" GIT_AUTHOR_EMAIL="ishaan.romil@gmail.com" \
GIT_COMMITTER_NAME="Fane1824" GIT_COMMITTER_EMAIL="ishaan.romil@gmail.com" \
git add frontend/src/components/Disruption/DisruptionCard.tsx \
        frontend/src/components/Disruption/DisruptionList.tsx \
        frontend/src/pages/DisruptionPage.tsx && \
git commit -m "replace disruption UI with card-based lifecycle view and SSE wiring"
```

---

## Task 12 — SuggestionsPanel

**Files:**
- Create: `frontend/src/components/Disruption/SuggestionsPanel.tsx`

- [ ] **Step 1: Create SuggestionsPanel**

Create `frontend/src/components/Disruption/SuggestionsPanel.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { disruptionAPI } from '@/services/disruptionAPI';

interface SuggestionsPanelProps {
  disruptionId: string;
}

const ArrowIcon = () => (
  <svg className="w-3 h-3 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default function SuggestionsPanel({ disruptionId }: SuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    disruptionAPI.suggestions(disruptionId)
      .then(r => setSuggestions(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [disruptionId]);

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-current/10">
        <p className="text-xs text-charcoal/40 animate-pulse">Loading suggestions…</p>
      </div>
    );
  }

  if (error || suggestions.length === 0) {
    return (
      <div className="mt-3 pt-3 border-t border-current/10">
        <p className="text-xs text-charcoal/40">No suggestions available.</p>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-current/10">
      <p className="text-[10px] font-semibold text-charcoal/40 uppercase tracking-wider mb-2">Suggestions</p>
      <ul className="space-y-1.5">
        {suggestions.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-charcoal/65 leading-relaxed">
            <span className="text-charcoal/40 mt-0.5 shrink-0"><ArrowIcon /></span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd WanderSync-SE
GIT_AUTHOR_NAME="Fane1824" GIT_AUTHOR_EMAIL="ishaan.romil@gmail.com" \
GIT_COMMITTER_NAME="Fane1824" GIT_COMMITTER_EMAIL="ishaan.romil@gmail.com" \
git add frontend/src/components/Disruption/SuggestionsPanel.tsx && \
git commit -m "add SuggestionsPanel component wired to backend suggestions endpoint"
```

---

## Task 13 — Nav Badge + BookingCard Inline Alert

**Files:**
- Modify: `frontend/src/components/Layout/TopNavbar.tsx`
- Modify: `frontend/src/components/Itinerary/BookingCard.tsx`

- [ ] **Step 1: Add disruption badge to TopNavbar**

In `frontend/src/components/Layout/TopNavbar.tsx`, this requires access to active disruption count. The simplest approach is to store it in a shared state. Check if there's a Zustand store or context already; if not, use a simple module-level store:

Add after imports in `TopNavbar.tsx`:

```typescript
import { Link, useLocation } from 'react-router-dom';
```

(Replace existing `Link` import if already there — add `useLocation`.)

Add the `DisruptionBadge` component and a lightweight disruption count hook before the `TopNavbar` component:

```typescript
// Simple signal — DisruptionPage updates this via a custom event
function useUnacknowledgedCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const handler = (e: Event) => {
      setCount((e as CustomEvent<number>).detail);
    };
    window.addEventListener('disruption-count-update', handler);
    return () => window.removeEventListener('disruption-count-update', handler);
  }, []);
  return count;
}
```

Add `import { useState, useEffect } from 'react';` at the top of the file.

In the `TopNavbar` component body, add:

```typescript
const unacknowledgedCount = useUnacknowledgedCount();
```

Add a Disruptions nav link with badge after the `BellIcon` button:

```typescript
<Link
  to="/disruptions"
  className="relative p-2 rounded-lg text-charcoal/50 hover:text-charcoal hover:bg-dust-grey/30 transition-colors duration-150 cursor-pointer"
  title="Disruptions"
>
  <BoltNavIcon />
  {unacknowledgedCount > 0 && (
    <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white" style={{ background: '#d77a61' }}>
      {unacknowledgedCount > 9 ? '9+' : unacknowledgedCount}
    </span>
  )}
</Link>
```

Add `BoltNavIcon` near the other icon components:

```typescript
const BoltNavIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
  </svg>
);
```

In `DisruptionPage.tsx`, add this after the `handleAcknowledged` callback:

```typescript
// Sync count to nav badge via custom event
useEffect(() => {
  window.dispatchEvent(
    new CustomEvent('disruption-count-update', { detail: activeCount }),
  );
}, [activeCount]);
```

- [ ] **Step 2: Update BookingCard with inline disruption link**

In `frontend/src/components/Itinerary/BookingCard.tsx`, replace the existing `{booking.disrupted && ...}` badge with a link:

```typescript
// Add to imports:
import { Link } from 'react-router-dom';
```

Replace the existing disrupted badge span:

```typescript
{booking.disrupted && (
  <Link
    to="/disruptions"
    className="absolute top-2.5 right-3 flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
    style={{ background: 'rgba(215,122,97,0.12)', color: '#d77a61', border: '1px solid rgba(215,122,97,0.25)' }}
    title="View disruption details"
  >
    <BoltIcon /> View alert
  </Link>
)}
```

- [ ] **Step 3: Commit**

```bash
cd WanderSync-SE
GIT_AUTHOR_NAME="Fane1824" GIT_AUTHOR_EMAIL="ishaan.romil@gmail.com" \
GIT_COMMITTER_NAME="Fane1824" GIT_COMMITTER_EMAIL="ishaan.romil@gmail.com" \
git add frontend/src/components/Layout/TopNavbar.tsx \
        frontend/src/components/Itinerary/BookingCard.tsx \
        frontend/src/pages/DisruptionPage.tsx && \
git commit -m "add disruption count badge to nav and inline alert on booking cards"
```

---

## Verification

- [ ] **Backend: compile check**
  ```bash
  cd WanderSync-SE && npm run lint
  ```
  Expected: no TypeScript errors.

- [ ] **Backend: run existing tests**
  ```bash
  cd WanderSync-SE && npm test -- --testPathPattern=disruption
  ```
  Expected: all existing disruption tests pass.

- [ ] **Start dev stack**
  ```bash
  cd WanderSync-SE && .\start-dev.ps1
  ```

- [ ] **Severity bug fix**: Open DevTools console, navigate to `/disruptions`. Simulate a disruption. Confirm the severity badge shows `MEDIUM` (severity 2) or `HIGH` (severity 3), not `LOW`.

- [ ] **SSE real-time**: With the disruptions page open, simulate a disruption via the button. Verify a new card appears without clicking Refresh. Check Network tab → `disruptions/stream` shows EventStream type.

- [ ] **Acknowledge**: Click "Acknowledge" on an active disruption. Verify the card moves to the "Past / Acknowledged" section. Reload the page — verify the card still shows as acknowledged.

- [ ] **Suggestions**: Click "Get suggestions" on a disruption card. Verify suggestions load and display. Check backend logs for `RuleBasedHandler` or `LLMHandler` usage.

- [ ] **Auto-resolution**: Simulate a disruption, then wait for the next poll cycle (up to 1 min). If the simulated flight no longer shows as disrupted in AviationStack (or use `POST /disruptions/simulate` as admin with a real IATA that resolves), verify the card shows `RESOLVED` badge.

- [ ] **Nav badge**: With active unacknowledged disruptions, verify the bolt icon in the nav shows a count badge. Acknowledging all disruptions clears it.

- [ ] **BookingCard link**: Navigate to `/itinerary`. If a booking has `disrupted: true`, verify it shows "View alert" which links to `/disruptions`.
