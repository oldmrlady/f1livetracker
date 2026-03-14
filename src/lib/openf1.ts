const BASE = "https://api.openf1.org/v1";
const TOKEN_URL = "https://api.openf1.org/token";

// In-memory token cache (server process lifetime)
let cachedToken: { value: string; expiresAt: number } | null = null;

function jwtExpiry(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    return (payload.exp ?? 0) * 1000; // ms
  } catch {
    return 0;
  }
}

async function fetchToken(): Promise<string> {
  const username = process.env.OPENF1_USERNAME;
  const password = process.env.OPENF1_PASSWORD;
  if (!username || !password) throw new Error("OPENF1_USERNAME/PASSWORD not set");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
  const data = await res.json();
  const token: string = data.access_token ?? data.token ?? data;
  cachedToken = { value: token, expiresAt: jwtExpiry(token) - 60_000 }; // refresh 1 min early
  return token;
}

async function getAuthHeader(): Promise<string | null> {
  // Static key takes priority
  const staticKey = process.env.OPENF1_API_KEY;
  if (staticKey) return `Bearer ${staticKey}`;

  // Auto-refresh JWT from credentials
  if (process.env.OPENF1_USERNAME && process.env.OPENF1_PASSWORD) {
    if (!cachedToken || Date.now() >= cachedToken.expiresAt) {
      await fetchToken();
    }
    return cachedToken ? `Bearer ${cachedToken.value}` : null;
  }

  return null;
}

export const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
export const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];
export const FASTEST_LAP_POINT = 1;

export interface Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url: string | null;
  country_code: string;
  session_key: number;
}

export interface Position {
  driver_number: number;
  position: number;
  date: string;
  session_key: number;
  meeting_key: number;
}

export interface Session {
  session_key: number;
  session_name: string;
  session_type: string;
  status: string;
  date_start: string;
  date_end: string;
  meeting_key: number;
  year: number;
  circuit_short_name: string;
  country_name: string;
  gmt_offset: string;
}

export interface Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  circuit_short_name: string;
  country_name: string;
  date_start: string;
  year: number;
}

export interface Lap {
  driver_number: number;
  lap_number: number;
  is_pit_out_lap: boolean;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  lap_duration: number | null;
  session_key: number;
}

export interface Stint {
  driver_number: number;
  session_key: number;
  stint_number: number;
  compound: string;
  lap_start: number;
  lap_end: number | null;
}

export class OpenF1AuthError extends Error {
  constructor() {
    super("OpenF1 API requires authentication during a live session.");
    this.name = "OpenF1AuthError";
  }
}

async function get<T>(
  path: string,
  params: Record<string, string | number> = {},
  revalidate: number | false = 10
): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const headers: HeadersInit = {};
  const auth = await getAuthHeader();
  if (auth) headers["Authorization"] = auth;

  const cacheOpts = revalidate === false
    ? { cache: "no-store" as const }
    : { next: { revalidate } };

  const res = await fetch(url.toString(), { headers, ...cacheOpts });

  if (res.status === 401) throw new OpenF1AuthError();
  if (!res.ok) throw new Error(`OpenF1 error: ${res.status}`);
  return res.json();
}

export async function getLatestSession(): Promise<Session | null> {
  const sessions = await get<Session[]>("/sessions", { session_type: "Race" });
  if (!sessions.length) return null;
  const now = Date.now();
  // Prefer a session currently in progress
  const active = sessions.find(
    (s) => new Date(s.date_start).getTime() <= now && new Date(s.date_end).getTime() >= now
  );
  if (active) return active;
  // Otherwise return the most recent session that has already started
  const started = sessions.filter((s) => new Date(s.date_start).getTime() <= now);
  return started.length ? started[started.length - 1] : sessions[0];
}

export async function getSessions(year: number): Promise<Session[]> {
  return get<Session[]>("/sessions", { year, session_type: "Race" });
}

export async function getDrivers(session_key: number): Promise<Driver[]> {
  return get<Driver[]>("/drivers", { session_key });
}

export async function getDriversForMeeting(meeting_key: number): Promise<Driver[]> {
  const all = await get<Driver[]>("/drivers", { meeting_key }, 3600);
  // Deduplicate by driver_number, preferring entries with more complete data
  const best = new Map<number, Driver>();
  for (const d of all) {
    const existing = best.get(d.driver_number);
    if (!existing) { best.set(d.driver_number, d); continue; }
    const score = (d: Driver) => (d.full_name ? 2 : 0) + (d.headshot_url ? 1 : 0);
    if (score(d) > score(existing)) best.set(d.driver_number, d);
  }
  return Array.from(best.values());
}

export async function getLatestPositions(session_key: number): Promise<Position[]> {
  return getFinalPositions(session_key, 10);
}

export async function getPositionsForSession(
  session_key: number,
  revalidate: number | false = 10
): Promise<Position[]> {
  return getFinalPositions(session_key, revalidate);
}

async function getFinalPositions(
  session_key: number,
  revalidate: number | false
): Promise<Position[]> {
  const positions = await get<Position[]>("/position", { session_key }, revalidate);
  const latest = new Map<number, Position>();
  for (const p of positions) {
    const existing = latest.get(p.driver_number);
    if (!existing || new Date(p.date) > new Date(existing.date)) {
      latest.set(p.driver_number, p);
    }
  }
  return Array.from(latest.values()).sort((a, b) => a.position - b.position);
}

export async function getMeetings(year: number): Promise<Meeting[]> {
  return get<Meeting[]>("/meetings", { year });
}

export function positionToPoints(position: number, hasFastestLap = false): number {
  const pts = F1_POINTS[position - 1] ?? 0;
  return pts + (hasFastestLap && position <= 10 ? FASTEST_LAP_POINT : 0);
}
