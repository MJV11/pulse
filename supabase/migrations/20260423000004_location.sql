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
-- Returns the full user_details row as a jsonb blob (with the binary `location`
-- column stripped) plus a couple of computed scalars. Returning jsonb keeps
-- the function forward-compatible: any new column added to user_details
-- automatically appears in the response without needing a migration here.
DROP FUNCTION IF EXISTS public.nearby_users;
create or replace function public.nearby_users(
  lat              float8,
  lng              float8,
  radius_miles     float8  default 50,
  exclude_user_id  uuid    default null
)
returns table (
  user_data        jsonb,
  first_photo_path text,
  distance_miles   float8
)
language sql
stable
security definer
as $$
  select
    (to_jsonb(ud) - 'location') as user_data,
    (
      select pp.storage_path
      from public.profile_photos pp
      where pp.user_id = ud.user_id
      order by pp.position asc, pp.created_at asc
      limit 1
    ) as first_photo_path,
    ST_Distance(
      ud.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) / 1609.344 as distance_miles
  from public.user_details ud
  where
    ud.location is not null
    -- and (exclude_user_id is null or ud.user_id <> exclude_user_id)
    and ST_DWithin(
      ud.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_miles * 1609.344  -- convert miles → metres
    )
  order by distance_miles asc;
$$;


-- Wraps nearby_users so the API never has to parse a WKB geography value.
-- Looks up the calling user's stored location via ST_X/ST_Y, then delegates
-- to the existing nearby_users function.
DROP FUNCTION IF EXISTS public.discovery_feed;
create or replace function public.discovery_feed(
  p_user_id    uuid,
  radius_miles float8 default 50
)
returns table (
  user_data        jsonb,
  first_photo_path text,
  distance_miles   float8
)
language plpgsql
stable
security definer
as $$
declare
  v_lat float8;
  v_lng float8;
begin
  select
    ST_Y(ud.location::geometry),
    ST_X(ud.location::geometry)
  into v_lat, v_lng
  from public.user_details ud
  where ud.user_id = p_user_id;

  -- User has no stored location yet — return empty result set
  if v_lat is null then
    return;
  end if;

  return query
    select * from public.nearby_users(v_lat, v_lng, radius_miles, p_user_id);
end;
$$;
