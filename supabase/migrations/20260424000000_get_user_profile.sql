-- Returns a user's public profile with location unpacked and first gallery photo path.
DROP FUNCTION IF EXISTS public.get_user_profile;
create or replace function public.get_user_profile(p_user_id uuid)
returns table (
  user_id          uuid,
  user_name        text,
  bio              text,
  birthday         date,
  sports           text[],
  rating           numeric,
  first_photo_path text,
  latitude         float8,
  longitude        float8,
  created_at       timestamptz,
  updated_at       timestamptz
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
    (
      select pp.storage_path
      from public.profile_photos pp
      where pp.user_id = ud.user_id
      order by pp.position asc, pp.created_at asc
      limit 1
    ) as first_photo_path,
    ST_Y(ud.location::geometry) as latitude,
    ST_X(ud.location::geometry) as longitude,
    ud.created_at,
    ud.updated_at
  from public.user_details ud
  where ud.user_id = p_user_id;
$$;
