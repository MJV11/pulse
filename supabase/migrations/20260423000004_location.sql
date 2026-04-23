-- Enable PostGIS for geographic distance queries
create extension if not exists postgis;

-- Add location column to user_details
alter table public.user_details
  add column if not exists location geography(Point, 4326);

-- Spatial index for fast radius searches
create index if not exists user_details_location_idx
  on public.user_details using gist (location);

-- ── Helper: update a user's stored location ──────────────────────────────────
-- Called from the API after login via RPC so the geography value is built
-- server-side and we avoid passing raw WKT through the REST layer.
create or replace function public.update_user_location(
  p_user_id  uuid,
  p_lat      float8,
  p_lng      float8
)
returns void
language sql
security definer
as $$
  insert into public.user_details (user_id, location)
  values (
    p_user_id,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  )
  on conflict (user_id)
  do update set location = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
$$;

-- ── Helper: find nearby users within a radius ─────────────────────────────────
create or replace function public.nearby_users(
  lat              float8,
  lng              float8,
  radius_miles     float8  default 50,
  exclude_user_id  uuid    default null
)
returns table (
  user_id        uuid,
  user_name      text,
  bio            text,
  sports         text[],
  rating         numeric,
  distance_miles float8
)
language sql
stable
security definer
as $$
  select
    ud.user_id,
    ud.user_name,
    ud.bio,
    ud.sports,
    ud.rating,
    ST_Distance(
      ud.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) / 1609.344 as distance_miles
  from public.user_details ud
  where
    ud.location is not null
    and (exclude_user_id is null or ud.user_id <> exclude_user_id)
    and ST_DWithin(
      ud.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_miles * 1609.344  -- convert miles → metres
    )
  order by distance_miles asc;
$$;
