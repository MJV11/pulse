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
  first_photo_path   text,
  latitude           float8,
  longitude          float8,
  premium_expires_at timestamptz,
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
    ud.created_at,
    ud.updated_at
  from public.user_details ud
  left join public.premium_users pu on pu.user_id = ud.user_id
  where ud.user_id = p_user_id;
$$;
