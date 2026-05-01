-- ── Pulse Premium subscriptions ─────────────────────────────────────────────
-- One row per user who currently has — or has ever had — Pulse Premium.
-- A user is considered premium iff they have a row here whose
-- `expires_at` is in the future. The application does not delete rows on
-- expiry so we retain churn history; flip `expires_at` instead.
--
-- Writes only happen server-side (e.g. from a billing webhook) using the
-- service role; clients can read their own row but cannot write.

create table if not exists public.premium_users (
  id          uuid          primary key default gen_random_uuid(),
  user_id     uuid          not null unique references auth.users (id) on delete cascade,
  expires_at  timestamptz   not null,
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now()
);

create index if not exists premium_users_expires_at_idx
  on public.premium_users (expires_at);

alter table public.premium_users enable row level security;

-- Users can read their own subscription row (so the client can react to
-- realtime updates if we ever want that). All writes go through the
-- service role from the backend.
drop policy if exists "premium_users_select_own" on public.premium_users;
create policy "premium_users_select_own"
  on public.premium_users
  for select
  using (auth.uid() = user_id);

-- Touch updated_at on every update
create or replace function public.premium_users_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists premium_users_updated_at on public.premium_users;
create trigger premium_users_updated_at
  before update on public.premium_users
  for each row
  execute function public.premium_users_set_updated_at();

-- ── Refresh get_user_profile to surface premium expiry + age prefs ───────────
-- The profile RPC LEFT JOINs premium_users so the frontend gets premium status
-- in the same round-trip as the rest of the profile. Clients derive `isPremium`
-- from `premium_expires_at > now()`.
--
-- Also LEFT JOINs strava_connections (for the athlete's FTP + last sync time)
-- and aggregates strava_activity_stats into a jsonb array so the client gets
-- a per-sport-type stats breakdown without an extra round-trip.

-- Defensive shim: if a database has the older Strava schema (pre `ftp` /
-- `last_synced_at` on `strava_connections`, or no `strava_activity_stats`
-- table at all) and this file is re-run on its own, the function below
-- would fail with "column sc.ftp does not exist" / "relation
-- public.strava_activity_stats does not exist". The same DDL lives in
-- 20260427000001_strava_connections.sql; duplicating it here keeps this
-- migration self-contained.
alter table public.strava_connections
  add column if not exists ftp            integer,
  add column if not exists last_synced_at timestamptz;

create table if not exists public.strava_activity_stats (
  user_id             uuid          not null references auth.users (id) on delete cascade,
  sport_type          text          not null,
  activity_count_14d  integer       not null default 0,
  total_seconds_14d   bigint        not null default 0,
  latest_activity_at  timestamptz,
  updated_at          timestamptz   not null default now(),
  primary key (user_id, sport_type)
);

create index if not exists strava_activity_stats_user_id_idx
  on public.strava_activity_stats (user_id);

alter table public.strava_activity_stats enable row level security;

drop policy if exists "Authenticated users can read strava_activity_stats"
  on public.strava_activity_stats;
create policy "Authenticated users can read strava_activity_stats"
  on public.strava_activity_stats
  for select
  to authenticated
  using (true);

drop function if exists public.get_user_profile;
create or replace function public.get_user_profile(p_user_id uuid)
returns table (
  user_id            uuid,
  user_name          text,
  bio                text,
  birthday           date,
  sports             text[],
  rating             numeric,
  gender             text,
  looking_for        text,
  min_age_pref       integer,
  max_age_pref       integer,
  min_ftp_pref       integer,
  max_ftp_pref       integer,
  require_ftp        boolean,
  first_photo_path   text,
  latitude           float8,
  longitude          float8,
  premium_expires_at timestamptz,
  strava_ftp         integer,
  strava_synced_at   timestamptz,
  strava_stats       jsonb,
  ftp                integer,
  mile_pace_seconds  integer,
  swim_pace_seconds  integer,
  created_at         timestamptz,
  updated_at         timestamptz
)
language sql
stable
security definer
as $$
  select
    ud.user_id,
    ud.user_name,
    ud.bio,
    ud.birthday,
    ud.sports,
    ud.rating,
    ud.gender,
    ud.looking_for,
    ud.min_age_pref,
    ud.max_age_pref,
    ud.min_ftp_pref,
    ud.max_ftp_pref,
    ud.require_ftp,
    (
      select pp.storage_path
      from public.profile_photos pp
      where pp.user_id = ud.user_id
      order by pp.position asc, pp.created_at asc
      limit 1
    ) as first_photo_path,
    ST_Y(ud.location::geometry) as latitude,
    ST_X(ud.location::geometry) as longitude,
    pu.expires_at as premium_expires_at,
    greatest(sc.ftp, ud.ftp) as strava_ftp,
    sc.last_synced_at as strava_synced_at,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'sport_type',         s.sport_type,
            'activity_count_14d', s.activity_count_14d,
            'total_seconds_14d',  s.total_seconds_14d,
            'latest_activity_at', s.latest_activity_at
          )
          order by s.activity_count_14d desc, s.sport_type asc
        )
        from public.strava_activity_stats s
        where s.user_id = ud.user_id
      ),
      '[]'::jsonb
    ) as strava_stats,
    ud.ftp,
    ud.mile_pace_seconds,
    ud.swim_pace_seconds,
    ud.created_at,
    ud.updated_at
  from public.user_details ud
  left join public.premium_users pu on pu.user_id = ud.user_id
  left join public.strava_connections sc on sc.user_id = ud.user_id
  where ud.user_id = p_user_id;
$$;
