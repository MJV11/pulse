// deno-lint-ignore-file no-explicit-any
import { getServiceClient } from './supabase.ts';

/**
 * Server-side Strava helpers used by the API routes.
 *
 * Two responsibilities:
 *   1. Keep a per-user access token fresh — Strava access tokens expire every
 *      ~6 hours, so before each Strava API call we check the cached
 *      `expires_at` and call the refresh endpoint when needed.
 *   2. Compile a 14-day rolling activity summary per sport_type plus the
 *      athlete's self-reported FTP, persisting both to Postgres.
 */

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
// Pad token expiry by 60s so we don't get caught racing the clock.
const REFRESH_GRACE_MS = 60 * 1000;
// Throttle stats syncs to once an hour per user.
const SYNC_THROTTLE_MS = 60 * 60 * 1000;

interface StravaCredentials {
  clientId: string;
  clientSecret: string;
}

function getStravaCredentials(): StravaCredentials | null {
  const clientId = Deno.env.get('STRAVA_CLIENT_ID');
  const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

interface StravaConnectionRow {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  ftp: number | null;
  last_synced_at: string | null;
}

interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
}

interface StravaAthleteResponse {
  id: number;
  ftp?: number | null;
  username?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  profile?: string | null;
}

interface StravaActivitySummary {
  id: number;
  sport_type: string;
  moving_time: number;
  start_date: string;
}

/**
 * Fetches the user's strava_connections row and refreshes the access token
 * if it has expired (or is about to). Returns `null` when the user has no
 * connection or when Strava server credentials aren't configured.
 */
export async function getValidStravaConnection(
  userId: string,
): Promise<StravaConnectionRow | null> {
  const creds = getStravaCredentials();
  if (!creds) {
    console.warn('Strava credentials not configured — skipping token refresh');
    return null;
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('strava_connections')
    .select('user_id, access_token, refresh_token, expires_at, ftp, last_synced_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching strava_connections for refresh:', error);
    return null;
  }
  if (!data) return null;

  const row = data as StravaConnectionRow;
  const expiresMs = Date.parse(row.expires_at);
  if (Number.isFinite(expiresMs) && expiresMs - REFRESH_GRACE_MS > Date.now()) {
    return row;
  }

  // Token is expired (or close to it) — refresh it.
  const refreshed = await refreshAccessToken(row.refresh_token, creds);
  if (!refreshed) return null;

  const newRow: StravaConnectionRow = {
    ...row,
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
  };

  const { error: updateError } = await supabase
    .from('strava_connections')
    .update({
      access_token: newRow.access_token,
      refresh_token: newRow.refresh_token,
      expires_at: newRow.expires_at,
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('Failed to persist refreshed Strava token:', updateError);
    return null;
  }

  return newRow;
}

async function refreshAccessToken(
  refreshToken: string,
  creds: StravaCredentials,
): Promise<StravaTokenResponse | null> {
  try {
    const res = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) {
      console.error('Strava token refresh failed:', res.status, await res.text());
      return null;
    }
    return (await res.json()) as StravaTokenResponse;
  } catch (err) {
    console.error('Unexpected error refreshing Strava token:', err);
    return null;
  }
}

interface AggregatedSportStats {
  sport_type: string;
  activity_count_14d: number;
  total_seconds_14d: number;
  latest_activity_at: string;
}

/**
 * Pulls all of the user's activities in the last 14 days from Strava and
 * groups them by `sport_type`. Pages through results 200 at a time so an
 * unusually active user still gets a complete count.
 */
async function fetchRecentActivities(
  accessToken: string,
): Promise<StravaActivitySummary[]> {
  const afterUnix = Math.floor((Date.now() - FOURTEEN_DAYS_MS) / 1000);
  const all: StravaActivitySummary[] = [];
  let page = 1;
  // Hard cap pagination at 5 pages (1000 activities) — defensive guard.
  while (page <= 5) {
    const url = new URL(`${STRAVA_API_BASE}/athlete/activities`);
    url.searchParams.set('after', String(afterUnix));
    url.searchParams.set('per_page', '200');
    url.searchParams.set('page', String(page));

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      console.error('Strava activities fetch failed:', res.status, await res.text());
      break;
    }
    const batch = (await res.json()) as StravaActivitySummary[];
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 200) break;
    page += 1;
  }
  return all;
}

function aggregateBySportType(
  activities: StravaActivitySummary[],
): AggregatedSportStats[] {
  const map = new Map<string, AggregatedSportStats>();
  for (const a of activities) {
    if (!a.sport_type) continue;
    const existing = map.get(a.sport_type);
    if (existing) {
      existing.activity_count_14d += 1;
      existing.total_seconds_14d += a.moving_time ?? 0;
      if (a.start_date > existing.latest_activity_at) {
        existing.latest_activity_at = a.start_date;
      }
    } else {
      map.set(a.sport_type, {
        sport_type: a.sport_type,
        activity_count_14d: 1,
        total_seconds_14d: a.moving_time ?? 0,
        latest_activity_at: a.start_date,
      });
    }
  }
  return Array.from(map.values());
}

export interface StravaSyncResult {
  /** True when we actually called Strava; false when we skipped due to throttling. */
  refreshed: boolean;
  /** Reason returned when refreshed=false. */
  reason?:
    | 'not_connected'
    | 'not_configured'
    | 'token_refresh_failed'
    | 'throttled';
  ftp?: number | null;
  stats?: AggregatedSportStats[];
}

/**
 * Compiles the 14-day per-sport-type stats for a user and persists them. By
 * default this is throttled to once per hour per user — pass `force: true`
 * to bypass the throttle (e.g. on first connect).
 */
export async function syncStravaStats(
  userId: string,
  options: { force?: boolean } = {},
): Promise<StravaSyncResult> {
  const supabase = getServiceClient();

  const connection = await getValidStravaConnection(userId);
  if (!connection) {
    // Distinguish "not connected" from "credentials missing / refresh failed"
    const { data } = await supabase
      .from('strava_connections')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (!data) return { refreshed: false, reason: 'not_connected' };
    if (!getStravaCredentials()) return { refreshed: false, reason: 'not_configured' };
    return { refreshed: false, reason: 'token_refresh_failed' };
  }

  if (!options.force && connection.last_synced_at) {
    const lastMs = Date.parse(connection.last_synced_at);
    if (Number.isFinite(lastMs) && Date.now() - lastMs < SYNC_THROTTLE_MS) {
      return { refreshed: false, reason: 'throttled', ftp: connection.ftp };
    }
  }

  // Fetch athlete (for FTP) and activities in parallel
  const [athleteRes, activities] = await Promise.all([
    fetch(`${STRAVA_API_BASE}/athlete`, {
      headers: { Authorization: `Bearer ${connection.access_token}` },
    }),
    fetchRecentActivities(connection.access_token),
  ]);

  let ftp: number | null = connection.ftp;
  if (athleteRes.ok) {
    const athlete = (await athleteRes.json()) as StravaAthleteResponse;
    ftp = typeof athlete.ftp === 'number' ? athlete.ftp : null;
  } else {
    console.warn('Strava athlete fetch failed:', athleteRes.status);
  }

  const aggregated = aggregateBySportType(activities);

  // Replace the user's stats wholesale: delete then insert. Cleaner than
  // reconciling deletes when sport types fall out of the 14d window.
  const { error: deleteErr } = await supabase
    .from('strava_activity_stats')
    .delete()
    .eq('user_id', userId);
  if (deleteErr) {
    console.error('Failed to clear old strava_activity_stats:', deleteErr);
  }

  if (aggregated.length > 0) {
    const rows = aggregated.map((s) => ({ user_id: userId, ...s }));
    const { error: insertErr } = await supabase
      .from('strava_activity_stats')
      .insert(rows);
    if (insertErr) {
      console.error('Failed to insert strava_activity_stats:', insertErr);
    }
  }

  const { error: updateErr } = await supabase
    .from('strava_connections')
    .update({ ftp, last_synced_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (updateErr) {
    console.error('Failed to update strava_connections sync metadata:', updateErr);
  }

  return { refreshed: true, ftp, stats: aggregated };
}

interface StravaSnapshot {
  strava_ftp: number | null;
  strava_stats: AggregatedSportStats[];
}

/**
 * Bulk-fetches Strava FTP + 14-day stats for a list of users so other API
 * routes (matches, conversations) can present the same shape the discovery
 * feed already exposes. Returns a Map keyed by user_id; users with no Strava
 * data simply get `{ strava_ftp: null, strava_stats: [] }`.
 */
export async function fetchStravaSnapshots(
  userIds: string[],
): Promise<Map<string, StravaSnapshot>> {
  const out = new Map<string, StravaSnapshot>();
  if (userIds.length === 0) return out;

  const supabase = getServiceClient();

  const [{ data: connections }, { data: stats }] = await Promise.all([
    supabase
      .from('strava_connections')
      .select('user_id, ftp')
      .in('user_id', userIds),
    supabase
      .from('strava_activity_stats')
      .select('user_id, sport_type, activity_count_14d, total_seconds_14d, latest_activity_at')
      .in('user_id', userIds)
      .order('activity_count_14d', { ascending: false }),
  ]);

  for (const id of userIds) {
    out.set(id, { strava_ftp: null, strava_stats: [] });
  }

  for (const c of (connections ?? []) as Array<{ user_id: string; ftp: number | null }>) {
    const entry = out.get(c.user_id);
    if (entry) entry.strava_ftp = c.ftp;
  }

  for (const s of (stats ?? []) as Array<{
    user_id: string;
    sport_type: string;
    activity_count_14d: number;
    total_seconds_14d: number;
    latest_activity_at: string | null;
  }>) {
    const entry = out.get(s.user_id);
    if (entry) {
      entry.strava_stats.push({
        sport_type: s.sport_type,
        activity_count_14d: s.activity_count_14d,
        total_seconds_14d: s.total_seconds_14d,
        latest_activity_at: s.latest_activity_at ?? '',
      });
    }
  }

  return out;
}
