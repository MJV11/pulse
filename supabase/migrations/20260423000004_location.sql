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
--
-- When `exclude_user_id` is supplied we also enforce *mutual* eligibility for
-- both gender and age:
--   • the searcher's `looking_for` must be 'all' (or unset) or match the
--     candidate's gender — and vice-versa
--   • the candidate's computed age must fall within the searcher's preferred
--     age range — and vice-versa
-- Either side missing a birthday → that directional age check is skipped
-- (permissive), so brand-new users stay visible while filling in their profile.
DROP FUNCTION IF EXISTS public.nearby_users;
create or replace function public.nearby_users(
  lat                float8,
  lng                float8,
  radius_miles       float8  default 50,
  exclude_user_id    uuid    default null,
  searcher_min_age   integer default null,
  searcher_max_age   integer default null
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
  with searcher as (
    select gender, looking_for, birthday
    from public.user_details
    where user_id = exclude_user_id
  )
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
  left join searcher s on true
  where
    ud.location is not null
    --and (exclude_user_id is null or ud.user_id <> exclude_user_id)
    and ST_DWithin(
      ud.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_miles * 1609.344  -- convert miles → metres
    )
    -- Gender: searcher's looking_for must include this candidate's gender
    and (
      exclude_user_id is null
      or s.looking_for is null
      or s.looking_for = 'all'
      or s.looking_for = ud.gender
    )
    -- Gender: candidate's looking_for must include the searcher's gender (mutual)
    and (
      exclude_user_id is null
      or ud.looking_for is null
      or ud.looking_for = 'all'
      or ud.looking_for = s.gender
    )
    -- Age: candidate's age must be >= searcher's minimum preference
    and (
      searcher_min_age is null
      or ud.birthday is null
      or extract(year from age(current_date, ud.birthday)) >= searcher_min_age
    )
    -- Age: candidate's age must be <= searcher's maximum preference
    and (
      searcher_max_age is null
      or ud.birthday is null
      or extract(year from age(current_date, ud.birthday)) <= searcher_max_age
    )
    -- Age: searcher's age must be >= candidate's minimum preference (mutual)
    and (
      exclude_user_id is null
      or s.birthday is null
      or extract(year from age(current_date, s.birthday)) >= ud.min_age_pref
    )
    -- Age: searcher's age must be <= candidate's maximum preference (mutual)
    and (
      exclude_user_id is null
      or s.birthday is null
      or extract(year from age(current_date, s.birthday)) <= ud.max_age_pref
    )
  order by distance_miles asc;
$$;


-- Wraps nearby_users so the API never has to parse a WKB geography value.
-- Looks up the calling user's stored location and age prefs via a single row
-- fetch, then delegates to nearby_users.
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
  v_lat     float8;
  v_lng     float8;
  v_min_age integer;
  v_max_age integer;
begin
  select
    ST_Y(ud.location::geometry),
    ST_X(ud.location::geometry),
    ud.min_age_pref,
    ud.max_age_pref
  into v_lat, v_lng, v_min_age, v_max_age
  from public.user_details ud
  where ud.user_id = p_user_id;

  -- User has no stored location yet — return empty result set
  if v_lat is null then
    return;
  end if;

  return query
    select * from public.nearby_users(
      v_lat, v_lng, radius_miles, p_user_id, v_min_age, v_max_age
    );
end;
$$;
