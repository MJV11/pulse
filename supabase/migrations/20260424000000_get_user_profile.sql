-- Returns a user's profile with the geography column unpacked into plain
-- lat/lng floats so the API never has to handle raw WKB values.
create or replace function public.get_user_profile(p_user_id uuid)
returns table (
  user_id    uuid,
  user_name  text,
  bio        text,
  sports     text[],
  rating     numeric,
  avatar_url text,
  latitude   float8,
  longitude  float8,
  created_at timestamptz,
  updated_at timestamptz
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
    ud.avatar_url,
    ST_Y(ud.location::geometry) as latitude,
    ST_X(ud.location::geometry) as longitude,
    ud.created_at,
    ud.updated_at
  from public.user_details ud
  where ud.user_id = p_user_id;
$$;
