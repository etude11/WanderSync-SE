# WanderSync

Dynamic itinerary management, real-time disruption detection, and social travel coordination.

**Stack:** NestJS · PostgreSQL · Redis · React 19 · Prisma · TypeScript

---

## Prerequisites

- Node.js 20+
- pnpm (`npm i -g pnpm`)
- PostgreSQL running locally
- Redis running locally

---

## Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/etude11/WanderSync-SE.git
cd WanderSync-SE

pnpm install          # backend
cd frontend && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/wandersync
JWT_SECRET=any-long-random-string

# Optional but needed for live disruption data
AVIATIONSTACK_API_KEY=
OWM_API_KEY=
GEMINI_API_KEY=
```

### 3. Create the database

```bash
# In psql or your PostgreSQL client:
CREATE DATABASE wandersync;
```

### 4. Run migrations

```bash
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

### 5. Start Redis

**macOS / Linux:**
```bash
redis-server
```

**Windows (native):**
```powershell
redis-server.exe
```

---

## Running the App

Open two terminals.

**Terminal 1 — Backend:**
```bash
pnpm run start:dev
# Runs on http://localhost:3000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser. The frontend proxies all `/api/*` requests to the backend automatically.

---

## Running Tests

```bash
pnpm run test          # unit tests
pnpm run test:cov      # with coverage report
pnpm run test:e2e      # end-to-end (requires backend running)
```

---

## Production Build

```bash
pnpm run build
node dist/main.js
```
