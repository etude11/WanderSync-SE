'use strict';
/**
 * WanderSync Mock Travel API
 * Independent microservice — drop-in replacement for:
 *   AviationStack  →  /v1/flights  +  /v1/flights/search
 *   OpenWeatherMap →  /data/3.0/onecall
 *   Hotels         →  /hotels
 *   Transport      →  /transport
 *
 * Start: node server.cjs  (or npm start)
 * Port:  MOCK_API_PORT env var, default 3002
 */

const http = require('http');
const url  = require('url');
const PORT = Number(process.env.MOCK_API_PORT) || 3002;

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns an ISO string for today (or today + daysOffset) at h:mm IST (UTC+5:30).
 * e.g. ist(14, 30) → today at 14:30 IST
 */
function ist(h, m, days) {
  days = days || 0;
  const utcMinutes = h * 60 + (m || 0) - 330 + days * 1440;
  const today      = new Date();
  const midnight   = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return new Date(midnight.getTime() + utcMinutes * 60000).toISOString();
}

// Keep for unknown-IATA placeholder only
function hoursFromNow(h) {
  return new Date(Date.now() + h * 3_600_000).toISOString();
}

// ─── Flight Database ─────────────────────────────────────────────────────────
// flight_status: 'active' | 'cancelled' | 'diverted' | 'incident'
// delay: minutes (null = on-time)

const FLIGHTS = {
  // ── DEL → BOM  (2h 15min) ─────────────────────────────────────────────────
  WS101:   { origin: 'DEL', dest: 'BOM', dep: hoursFromNow(1),  arr: hoursFromNow(3.25), status: 'active',    delay: 75,   airline: 'WanderSync Air' },
  AI202:   { origin: 'DEL', dest: 'BOM', dep: hoursFromNow(3),  arr: hoursFromNow(5.25), status: 'active',    delay: null, airline: 'Air India' },
  '6E301': { origin: 'DEL', dest: 'BOM', dep: hoursFromNow(5),  arr: hoursFromNow(7.25), status: 'active',    delay: null, airline: 'IndiGo' },
  SG401:   { origin: 'DEL', dest: 'BOM', dep: hoursFromNow(8),  arr: hoursFromNow(10.25), status: 'active',   delay: null, airline: 'SpiceJet' },

  // ── DEL → DXB  (3h 30min) ─────────────────────────────────────────────────
  IX201:   { origin: 'DEL', dest: 'DXB', dep: ist(8,  0),  arr: ist(11, 30), status: 'cancelled', delay: null, airline: 'Air India Express' },
  AI412:   { origin: 'DEL', dest: 'DXB', dep: ist(14, 0),  arr: ist(17, 30), status: 'active',    delay: null, airline: 'Air India' },
  EK510:   { origin: 'DEL', dest: 'DXB', dep: ist(23, 0),  arr: ist(2,  30, 1), status: 'active', delay: null, airline: 'Emirates' },

  // ── DEL → LHR  (9h 30min) ─────────────────────────────────────────────────
  AI112:   { origin: 'DEL', dest: 'LHR', dep: ist(10, 0),  arr: ist(19, 30), status: 'active',    delay: 240,  airline: 'Air India' },
  BA302:   { origin: 'DEL', dest: 'LHR', dep: ist(16, 0),  arr: ist(1,  30, 1), status: 'active', delay: null, airline: 'British Airways' },

  // ── DEL → SIN  (5h 45min) ─────────────────────────────────────────────────
  SQ101:   { origin: 'DEL', dest: 'SIN', dep: ist(11, 0),  arr: ist(16, 45), status: 'active',    delay: null, airline: 'Singapore Airlines' },
  AI570:   { origin: 'DEL', dest: 'SIN', dep: ist(18, 0),  arr: ist(23, 45), status: 'active',    delay: null, airline: 'Air India' },

  // ── BOM → DXB  (3h 15min) ─────────────────────────────────────────────────
  EK502:   { origin: 'BOM', dest: 'DXB', dep: ist(7,  0),  arr: ist(10, 15), status: 'active',    delay: null, airline: 'Emirates' },
  IX401:   { origin: 'BOM', dest: 'DXB', dep: ist(13, 0),  arr: ist(16, 15), status: 'cancelled', delay: null, airline: 'Air India Express' },

  // ── BOM → SIN  (6h) ───────────────────────────────────────────────────────
  SQ202:   { origin: 'BOM', dest: 'SIN', dep: ist(9,  0),  arr: ist(15, 0),  status: 'active',    delay: 90,   airline: 'Singapore Airlines' },
  '6E810': { origin: 'BOM', dest: 'SIN', dep: ist(16, 0),  arr: ist(22, 0),  status: 'active',    delay: null, airline: 'IndiGo' },

  // ── DEL → BLR  (2h 45min) ─────────────────────────────────────────────────
  UK601:   { origin: 'DEL', dest: 'BLR', dep: ist(8,  0),  arr: ist(10, 45), status: 'diverted',  delay: null, airline: 'Vistara' },
  AI221:   { origin: 'DEL', dest: 'BLR', dep: ist(12, 0),  arr: ist(14, 45), status: 'active',    delay: null, airline: 'Air India' },
  '6E540': { origin: 'DEL', dest: 'BLR', dep: ist(17, 30), arr: ist(20, 15), status: 'active',    delay: null, airline: 'IndiGo' },

  // ── BLR → MAA  (1h) ───────────────────────────────────────────────────────
  SG701:   { origin: 'BLR', dest: 'MAA', dep: ist(9,  30), arr: ist(10, 30), status: 'active',    delay: null, airline: 'SpiceJet' },
  '6E902': { origin: 'BLR', dest: 'MAA', dep: ist(15, 0),  arr: ist(16, 0),  status: 'active',    delay: null, airline: 'IndiGo' },

  // ── DEL → CCU  (2h 30min) ─────────────────────────────────────────────────
  AI303:   { origin: 'DEL', dest: 'CCU', dep: ist(8,  30), arr: ist(11, 0),  status: 'active',    delay: 60,   airline: 'Air India' },
  '6E450': { origin: 'DEL', dest: 'CCU', dep: ist(14, 0),  arr: ist(16, 30), status: 'active',    delay: null, airline: 'IndiGo' },

  // ── DEL → HYD  (2h 15min) ─────────────────────────────────────────────────
  AI181:   { origin: 'DEL', dest: 'HYD', dep: ist(10, 0),  arr: ist(12, 15), status: 'active',    delay: null, airline: 'Air India' },
  UK720:   { origin: 'DEL', dest: 'HYD', dep: ist(15, 0),  arr: ist(17, 15), status: 'diverted',  delay: null, airline: 'Vistara' },

  // ── BOM → CCU  (2h 45min) ─────────────────────────────────────────────────
  AI441:   { origin: 'BOM', dest: 'CCU', dep: ist(9,  0),  arr: ist(11, 45), status: 'active',    delay: null, airline: 'Air India' },
  '6E620': { origin: 'BOM', dest: 'CCU', dep: ist(17, 0),  arr: ist(19, 45), status: 'active',    delay: null, airline: 'IndiGo' },

  // ── DEL → JFK  (14h) ──────────────────────────────────────────────────────
  AI101:   { origin: 'DEL', dest: 'JFK', dep: ist(6,  0),  arr: ist(20, 0),  status: 'active',    delay: null, airline: 'Air India' },
  UA801:   { origin: 'DEL', dest: 'JFK', dep: ist(22, 0),  arr: ist(12, 0, 1), status: 'active',  delay: null, airline: 'United Airlines' },

  // ── DEL → NRT  (9h 30min) ─────────────────────────────────────────────────
  AI307:   { origin: 'DEL', dest: 'NRT', dep: ist(8,  0),  arr: ist(17, 30), status: 'active',    delay: null, airline: 'Air India' },
  NH901:   { origin: 'DEL', dest: 'NRT', dep: ist(21, 0),  arr: ist(6,  30, 1), status: 'active', delay: null, airline: 'ANA' },
};

// ─── Hotel Database ──────────────────────────────────────────────────────────
// 3 hotels per city across 10 cities

const HOTELS = [
  // DEL
  { id: 'TAJ-DEL',      city: 'DEL', name: 'Taj Palace New Delhi',    stars: 5, pricePerNight: 280, checkIn: '14:00', checkOut: '11:00' },
  { id: 'HYATT-DEL',    city: 'DEL', name: 'Grand Hyatt New Delhi',   stars: 5, pricePerNight: 240, checkIn: '15:00', checkOut: '12:00' },
  { id: 'IBIS-DEL',     city: 'DEL', name: 'ibis New Delhi Aerocity', stars: 3, pricePerNight: 70,  checkIn: '14:00', checkOut: '11:00' },
  // BOM
  { id: 'TAJ-BOM',      city: 'BOM', name: 'Taj Mahal Palace Mumbai', stars: 5, pricePerNight: 320, checkIn: '14:00', checkOut: '11:00' },
  { id: 'MARRIOTT-BOM', city: 'BOM', name: 'JW Marriott Mumbai',      stars: 5, pricePerNight: 260, checkIn: '15:00', checkOut: '12:00' },
  { id: 'GINGER-BOM',   city: 'BOM', name: 'Ginger Mumbai Airport',   stars: 3, pricePerNight: 65,  checkIn: '14:00', checkOut: '11:00' },
  // BLR
  { id: 'ITC-BLR',      city: 'BLR', name: 'ITC Windsor Bangalore',   stars: 5, pricePerNight: 200, checkIn: '14:00', checkOut: '11:00' },
  { id: 'LEELA-BLR',    city: 'BLR', name: 'The Leela Palace Bangalore', stars: 5, pricePerNight: 230, checkIn: '15:00', checkOut: '12:00' },
  { id: 'LEMON-BLR',    city: 'BLR', name: 'Lemon Tree Bangalore',    stars: 3, pricePerNight: 75,  checkIn: '14:00', checkOut: '11:00' },
  // DXB
  { id: 'BURL-DXB',     city: 'DXB', name: 'Burj Al Arab',            stars: 7, pricePerNight: 900, checkIn: '15:00', checkOut: '12:00' },
  { id: 'FOUR-DXB',     city: 'DXB', name: 'Four Seasons DIFC',       stars: 5, pricePerNight: 380, checkIn: '14:00', checkOut: '11:00' },
  { id: 'IBIS-DXB',     city: 'DXB', name: 'ibis Dubai Al Barsha',    stars: 3, pricePerNight: 85,  checkIn: '14:00', checkOut: '11:00' },
  // LHR
  { id: 'CLARD-LHR',    city: 'LHR', name: "Claridge's London",       stars: 5, pricePerNight: 450, checkIn: '15:00', checkOut: '12:00' },
  { id: 'SOFITEL-LHR',  city: 'LHR', name: 'Sofitel London Heathrow', stars: 4, pricePerNight: 180, checkIn: '14:00', checkOut: '11:00' },
  { id: 'TRAVE-LHR',    city: 'LHR', name: 'Travelodge London City',  stars: 2, pricePerNight: 90,  checkIn: '15:00', checkOut: '11:00' },
  // SIN
  { id: 'MARINA-SIN',   city: 'SIN', name: 'Marina Bay Sands',        stars: 5, pricePerNight: 520, checkIn: '15:00', checkOut: '11:00' },
  { id: 'SHANG-SIN',    city: 'SIN', name: 'Shangri-La Singapore',    stars: 5, pricePerNight: 310, checkIn: '14:00', checkOut: '12:00' },
  { id: 'FRAGRANT-SIN', city: 'SIN', name: 'Fragrant Court Singapore',stars: 3, pricePerNight: 120, checkIn: '14:00', checkOut: '11:00' },
  // MAA
  { id: 'ITC-MAA',      city: 'MAA', name: 'ITC Grand Chola Chennai', stars: 5, pricePerNight: 180, checkIn: '14:00', checkOut: '11:00' },
  { id: 'RADS-MAA',     city: 'MAA', name: 'Radisson Blu Chennai',    stars: 4, pricePerNight: 120, checkIn: '14:00', checkOut: '11:00' },
  { id: 'FOLIO-MAA',    city: 'MAA', name: 'Folio Suites Chennai',    stars: 3, pricePerNight: 60,  checkIn: '14:00', checkOut: '11:00' },
  // HYD
  { id: 'TRIDENT-HYD',  city: 'HYD', name: 'Trident Hyderabad',       stars: 5, pricePerNight: 170, checkIn: '14:00', checkOut: '12:00' },
  { id: 'NOVOTEL-HYD',  city: 'HYD', name: 'Novotel Hyderabad Airport',stars: 4, pricePerNight: 110, checkIn: '14:00', checkOut: '11:00' },
  { id: 'LEMON-HYD',    city: 'HYD', name: 'Lemon Tree Hyderabad',    stars: 3, pricePerNight: 65,  checkIn: '15:00', checkOut: '11:00' },
  // CCU
  { id: 'OBERO-CCU',    city: 'CCU', name: 'The Oberoi Grand Kolkata',stars: 5, pricePerNight: 160, checkIn: '14:00', checkOut: '12:00' },
  { id: 'ITC-CCU',      city: 'CCU', name: 'ITC Sonar Kolkata',       stars: 5, pricePerNight: 155, checkIn: '14:00', checkOut: '11:00' },
  { id: 'IBIS-CCU',     city: 'CCU', name: 'ibis Kolkata',            stars: 3, pricePerNight: 58,  checkIn: '14:00', checkOut: '11:00' },
  // SYD
  { id: 'FOUR-SYD',     city: 'SYD', name: 'Four Seasons Sydney',     stars: 5, pricePerNight: 420, checkIn: '15:00', checkOut: '12:00' },
  { id: 'PARK-SYD',     city: 'SYD', name: 'Park Hyatt Sydney',       stars: 5, pricePerNight: 480, checkIn: '15:00', checkOut: '11:00' },
  { id: 'IBIS-SYD',     city: 'SYD', name: 'ibis Sydney Airport',     stars: 3, pricePerNight: 130, checkIn: '14:00', checkOut: '11:00' },
];

// ─── Weather Database ─────────────────────────────────────────────────────────
// Keyed by IATA. Airports with active alerts (severity ≥ 3) trigger WEATHER_ALERT
// events in WanderSync's disruption pipeline.

const WEATHER = {
  // ── Disruption-triggering (severity 3-4) ──────────────────────────────────
  DEL: { alerts: [{ sender_name: 'India Meteorological Department', event: 'Severe Thunderstorm Warning', tags: ['Thunderstorm', 'Storm'], desc: 'Severe thunderstorms with heavy rain and strong winds expected. Ground holds likely.' }] },
  BOM: { alerts: [{ sender_name: 'India Meteorological Department', event: 'Cyclone Watch',               tags: ['Cyclone', 'Extreme'],    desc: 'Tropical cyclone forming in Arabian Sea. Possible airport closure 18-24h.' }] },
  LHR: { alerts: [{ sender_name: 'UK Met Office',                   event: 'Dense Fog Advisory',          tags: ['Fog', 'Warning'],       desc: 'Dense fog reducing visibility below 200m. Significant delays expected at LHR.' }] },
  DXB: { alerts: [{ sender_name: 'UAE National Centre of Meteorology', event: 'Severe Dust Storm Warning', tags: ['Dust', 'Storm', 'Severe'], desc: 'Severe dust storm reducing visibility. All ground operations suspended.' }] },

  // ── Clear / no disruption ─────────────────────────────────────────────────
  BLR: { alerts: [] }, MAA: { alerts: [] }, HYD: { alerts: [] }, CCU: { alerts: [] },
  GOI: { alerts: [] }, COK: { alerts: [] }, PNQ: { alerts: [] }, AMD: { alerts: [] },
  IXC: { alerts: [] }, LKO: { alerts: [] }, JAI: { alerts: [] }, ATQ: { alerts: [] },
  BBI: { alerts: [] }, TRV: { alerts: [] },
  JFK: { alerts: [] }, LAX: { alerts: [] }, SIN: { alerts: [] }, CDG: { alerts: [] },
  FRA: { alerts: [] }, NRT: { alerts: [] }, ICN: { alerts: [] }, SYD: { alerts: [] },
};

// ─── IATA → lat/lon (matches iata-coordinates.ts in main app) ────────────────
const IATA_COORDS = {
  DEL: [28.6139, 77.2090], BOM: [19.0896, 72.8656], BLR: [12.9716, 77.5946],
  MAA: [13.0827, 80.2707], CCU: [22.5726, 88.3639], HYD: [17.3850, 78.4867],
  COK: [9.9312, 76.2673],  GOI: [15.2993, 74.1240], PNQ: [18.5204, 73.8567],
  AMD: [23.0225, 72.5714], IXC: [30.7046, 76.7179], LKO: [26.8467, 80.9462],
  JAI: [26.9124, 75.7873], ATQ: [31.7754, 74.7994], BBI: [20.2961, 85.8245],
  TRV: [8.5241, 76.9366],
  LHR: [51.4700, -0.4543], JFK: [40.6413, -73.7781], LAX: [33.9425, -118.4081],
  SIN: [1.3644, 103.9915], DXB: [25.2532, 55.3657], CDG: [49.0097, 2.5479],
  FRA: [50.0379, 8.5622],  NRT: [35.7720, 140.3929], ICN: [37.4602, 126.4407],
  SYD: [-33.9399, 151.1753],
};

// ─── Transport Routes ─────────────────────────────────────────────────────────
const TRANSPORT = [
  { id: 'TRAIN-DEL-BOM', type: 'TRAIN',  origin: 'DEL', dest: 'BOM', name: 'Rajdhani Express',  dep: hoursFromNow(6),  arr: hoursFromNow(22), price: 45 },
  { id: 'BUS-DEL-JAI',   type: 'BUS',    origin: 'DEL', dest: 'JAI', name: 'RSRTC Volvo',       dep: hoursFromNow(3),  arr: hoursFromNow(8),  price: 12 },
  { id: 'TRAIN-BOM-PNQ', type: 'TRAIN',  origin: 'BOM', dest: 'PNQ', name: 'Deccan Queen',      dep: hoursFromNow(5),  arr: hoursFromNow(9),  price: 15 },
  { id: 'FERRY-COK-LKW', type: 'FERRY',  origin: 'COK', dest: 'GOI', name: 'Kerala Backwaters', dep: hoursFromNow(8),  arr: hoursFromNow(16), price: 20 },
  { id: 'TRAIN-DEL-LKO', type: 'TRAIN',  origin: 'DEL', dest: 'LKO', name: 'Shatabdi Express',  dep: hoursFromNow(4),  arr: hoursFromNow(10), price: 18 },
  { id: 'BUS-BLR-MAA',   type: 'BUS',    origin: 'BLR', dest: 'MAA', name: 'KSRTC Airavata',    dep: hoursFromNow(5),  arr: hoursFromNow(12), price: 14 },
  { id: 'TRAIN-CCU-BBI', type: 'TRAIN',  origin: 'CCU', dest: 'BBI', name: 'Howrah-Bhubaneswar',dep: hoursFromNow(3),  arr: hoursFromNow(9),  price: 16 },
];

// ─── Response helpers ─────────────────────────────────────────────────────────

function flightToAviationStack(iata, f) {
  return {
    flight:        { iata, number: iata.replace(/[A-Z]+/, ''), airline: { name: f.airline } },
    flight_status: f.status,
    departure:     { scheduled: f.dep, iata: f.origin, delay: f.delay },
    arrival:       { scheduled: f.arr, iata: f.dest,   delay: null },
  };
}

function owmAlert(iata, alertData) {
  const now = Math.floor(Date.now() / 1000);
  return alertData.alerts.map(a => ({
    sender_name: a.sender_name,
    event:       a.event,
    start:       now,
    end:         now + 7200,
    description: a.desc,
    tags:        a.tags,
  }));
}

// Find the IATA code closest to the given lat/lon
function nearestIata(lat, lon) {
  let best = null, bestDist = Infinity;
  for (const [code, [clat, clon]] of Object.entries(IATA_COORDS)) {
    const d = Math.hypot(clat - lat, clon - lon);
    if (d < bestDist) { bestDist = d; best = code; }
  }
  return best;
}

// ─── Request Router ──────────────────────────────────────────────────────────

function handleRequest(req, res) {
  const parsed = url.parse(req.url, true);
  const path   = parsed.pathname;
  const q      = parsed.query;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // ── Health ──────────────────────────────────────────────────────────────────
  if (path === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', version: '1.0.0', service: 'wandersync-mock-travel-api' }));
    return;
  }

  // ── AviationStack: single flight lookup ─────────────────────────────────────
  if (path === '/v1/flights') {
    const iata = String(q.flight_iata || '').toUpperCase();
    const f = FLIGHTS[iata];
    if (!f) {
      // Unknown IATA — return an on-time flight with placeholder data
      const dep = hoursFromNow(4), arr = hoursFromNow(6);
      res.writeHead(200);
      res.end(JSON.stringify({ data: [{ flight: { iata }, flight_status: 'active', departure: { scheduled: dep, iata: 'DEL', delay: null }, arrival: { scheduled: arr, iata: 'BOM', delay: null } }] }));
      console.log(`[MockAPI] /v1/flights?flight_iata=${iata} → unknown IATA, returning placeholder`);
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify({ data: [flightToAviationStack(iata, f)] }));
    console.log(`[MockAPI] /v1/flights  iata=${iata}  status=${f.status}  delay=${f.delay ?? 'none'}`);
    return;
  }

  // ── AviationStack: search alternatives ─────────────────────────────────────
  if (path === '/v1/flights/search') {
    const origin = String(q.origin || '').toUpperCase();
    const dest   = String(q.destination || q.dest || '').toUpperCase();
    const exclude = String(q.exclude_iata || '').toUpperCase();

    const results = Object.entries(FLIGHTS)
      .filter(([iata, f]) => {
        if (iata === exclude) return false;
        if (origin && f.origin !== origin) return false;
        if (dest   && f.dest   !== dest)   return false;
        return true;
      })
      .sort(([, a], [, b]) => new Date(a.dep) - new Date(b.dep))
      .map(([iata, f]) => flightToAviationStack(iata, f));

    res.writeHead(200);
    res.end(JSON.stringify({ data: results }));
    console.log(`[MockAPI] /v1/flights/search  ${origin}→${dest}  exclude=${exclude || 'none'}  found=${results.length}`);
    return;
  }

  // ── OpenWeatherMap: one-call ────────────────────────────────────────────────
  if (path.startsWith('/data/') && path.includes('/onecall')) {
    const lat  = parseFloat(String(q.lat  || '0'));
    const lon  = parseFloat(String(q.lon  || '0'));
    const iata = nearestIata(lat, lon);
    const data = WEATHER[iata] || { alerts: [] };
    const body = { lat, lon, timezone: 'Asia/Kolkata', alerts: owmAlert(iata, data) };
    res.writeHead(200);
    res.end(JSON.stringify(body));
    console.log(`[MockAPI] ${path}  lat=${lat},lon=${lon}  nearest=${iata}  alerts=${data.alerts.length}`);
    return;
  }

  // ── Hotels ──────────────────────────────────────────────────────────────────
  if (path === '/hotels') {
    const city = String(q.city || '').toUpperCase();
    const results = city ? HOTELS.filter(h => h.city === city) : HOTELS;
    res.writeHead(200);
    res.end(JSON.stringify({ data: results }));
    console.log(`[MockAPI] /hotels  city=${city || 'all'}  found=${results.length}`);
    return;
  }

  // ── Transport ───────────────────────────────────────────────────────────────
  if (path === '/transport') {
    const origin = String(q.origin || '').toUpperCase();
    const dest   = String(q.destination || q.dest || '').toUpperCase();
    const type   = String(q.type || '').toUpperCase();
    const results = TRANSPORT.filter(t => {
      if (type   && t.type   !== type)   return false;
      if (origin && t.origin !== origin) return false;
      if (dest   && t.dest   !== dest)   return false;
      return true;
    });
    res.writeHead(200);
    res.end(JSON.stringify({ data: results }));
    console.log(`[MockAPI] /transport  ${origin}→${dest}  type=${type || 'any'}  found=${results.length}`);
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found', path }));
}

// ─── Server ───────────────────────────────────────────────────────────────────
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  const line = '═'.repeat(56);
  console.log(`\n╔${line}╗`);
  console.log(`║   WanderSync Mock Travel API  →  http://localhost:${PORT}   ║`);
  console.log(`╠${line}╣`);
  console.log(`║  GET /health                                           ║`);
  console.log(`║  GET /v1/flights?flight_iata=WS101                     ║`);
  console.log(`║  GET /v1/flights/search?origin=DEL&destination=BOM     ║`);
  console.log(`║  GET /data/3.0/onecall?lat=28.6&lon=77.2               ║`);
  console.log(`║  GET /hotels?city=BOM                                  ║`);
  console.log(`║  GET /transport?origin=DEL&destination=BOM             ║`);
  console.log(`╠${line}╣`);
  console.log(`║  Disruption scenarios:                                 ║`);
  console.log(`║   WS101 (DEL→BOM)  delay 75 min                       ║`);
  console.log(`║   AI112 (DEL→LHR)  delay 240 min                      ║`);
  console.log(`║   IX201 (DEL→DXB)  CANCELLED                          ║`);
  console.log(`║   UK601 (DEL→BLR)  DIVERTED                           ║`);
  console.log(`║   SQ202 (BOM→SIN)  delay 90 min                       ║`);
  console.log(`║   AI303 (DEL→CCU)  delay 60 min                       ║`);
  console.log(`║  Weather alerts: DEL, BOM, LHR, DXB                   ║`);
  console.log(`╚${line}╝\n`);
});
