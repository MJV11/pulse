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
  connected_at         timestamptz   not null default now(),
  updated_at           timestamptz   not null default now()
);

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
