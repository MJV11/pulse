-- ── Strava connections ───────────────────────────────────────────────────────
-- One row per Pulse user who has linked their Strava account. Tokens are
-- only ever read by the Edge Function via the service role; RLS deliberately
-- has no policies so authenticated clients can't read tokens directly.
create table if not exists public.strava_connections (
  user_id              uuid          primary key references auth.users (id) on delete cascade,
  strava_athlete_id    bigint        not null unique,
  access_token         text          not null,
  refresh_token        text          not null,
  expires_at           timestamptz   not null,
  scope                text,
  athlete_username     text,
  athlete_firstname    text,
  athlete_lastname     text,
  athlete_profile_url  text,
  -- Self-reported FTP from the athlete's Strava profile (in watts). Refreshed
  -- on each stats sync. Null means the athlete hasn't set one in Strava.
  ftp                  integer,
  -- When we last successfully ran a stats sync for this user. Null until the
  -- first sync completes. Used to throttle re-syncs (see backend syncStravaStats).
  last_synced_at       timestamptz,
  connected_at         timestamptz   not null default now(),
  updated_at           timestamptz   not null default now()
);

-- Bring older databases in line with the current shape.
alter table public.strava_connections
  add column if not exists ftp            integer,
  add column if not exists last_synced_at timestamptz;

alter table public.strava_connections enable row level security;

-- No policies are defined: all reads/writes go through the Edge Function
-- using the service role key, which bypasses RLS. This keeps OAuth tokens
-- out of reach of authenticated client sessions.

-- Touch updated_at on every update
create or replace function public.strava_connections_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists strava_connections_updated_at on public.strava_connections;
create trigger strava_connections_updated_at
  before update on public.strava_connections
  for each row
  execute function public.strava_connections_set_updated_at();

-- ── Strava activity stats ────────────────────────────────────────────────────
-- One row per (user, sport_type) summarising the last 14 days of activity.
-- Refreshed by the backend on a throttle whenever a connected user logs in.
-- Reads are open to any authenticated user (stats are part of the public
-- profile); writes go through the Edge Function with the service role.
create table if not exists public.strava_activity_stats (
  user_id             uuid          not null references auth.users (id) on delete cascade,
  -- Strava's `sport_type` field, e.g. 'Ride', 'Run', 'TrailRun', 'VirtualRide'.
  -- Kept as free text rather than an enum so newly added Strava sport types
  -- flow through without a migration.
  sport_type          text          not null,
  activity_count_14d  integer       not null default 0,
  total_seconds_14d   bigint        not null default 0,
  -- Most recent activity start time of this sport_type within the 14d window.
  -- Null means no activity in that window — stale rows like this are pruned
  -- on each sync.
  latest_activity_at  timestamptz,
  updated_at          timestamptz   not null default now(),
  primary key (user_id, sport_type)
);

create index if not exists strava_activity_stats_user_id_idx
  on public.strava_activity_stats (user_id);

drop trigger if exists strava_activity_stats_updated_at on public.strava_activity_stats;
create trigger strava_activity_stats_updated_at
  before update on public.strava_activity_stats
  for each row
  execute function public.strava_connections_set_updated_at();

alter table public.strava_activity_stats enable row level security;

-- Anyone authenticated can read all stats (same visibility as user_details).
drop policy if exists "Authenticated users can read strava_activity_stats"
  on public.strava_activity_stats;
create policy "Authenticated users can read strava_activity_stats"
  on public.strava_activity_stats
  for select
  to authenticated
  using (true);

-- Writes intentionally have no policy — only the service role can write,
-- which bypasses RLS.
