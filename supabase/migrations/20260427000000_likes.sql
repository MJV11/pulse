-- ── Likes table ──────────────────────────────────────────────────────────────
create table if not exists public.likes (
  id             uuid        primary key default gen_random_uuid(),
  from_user_id   uuid        not null references auth.users (id) on delete cascade,
  to_user_id     uuid        not null references auth.users (id) on delete cascade,
  created_at     timestamptz not null default now(),
  constraint unique_like unique (from_user_id, to_user_id)
);

alter table public.likes enable row level security;

create policy "Users can insert own likes"
  on public.likes for insert
  to authenticated
  with check (from_user_id = auth.uid());

create policy "Users can view likes involving them"
  on public.likes for select
  to authenticated
  using (from_user_id = auth.uid() or to_user_id = auth.uid());

-- ── process_like: record a like and create a match when mutual ────────────────
-- Returns a single row: { matched bool, match_id uuid }.
create or replace function public.process_like(
  p_from uuid,
  p_to   uuid
)
returns table (matched boolean, match_id uuid)
language plpgsql
security definer
as $$
declare
  v_mutual   boolean := false;
  v_match_id uuid;
  v_low      uuid;
  v_high     uuid;
begin
  -- Record the like (idempotent — re-liking is a no-op)
  insert into public.likes (from_user_id, to_user_id)
  values (p_from, p_to)
  on conflict (from_user_id, to_user_id) do nothing;

  -- Check for the reverse like (mutual)
  if exists (
    select 1 from public.likes
    where from_user_id = p_to and to_user_id = p_from
  ) then
    v_mutual := true;

    -- Store the match with canonical ordering (smaller UUID text first) so
    -- the unique constraint prevents duplicate rows for the same pair.
    if p_from < p_to then
      v_low := p_from; v_high := p_to;
    else
      v_low := p_to; v_high := p_from;
    end if;

    insert into public.matches (user_id, match_user_id)
    values (v_low, v_high)
    on conflict (user_id, match_user_id) do nothing
    returning id into v_match_id;

    -- If the match row already existed, fetch its id
    if v_match_id is null then
      select id into v_match_id
      from public.matches
      where user_id = v_low and match_user_id = v_high;
    end if;
  end if;

  return query select v_mutual, v_match_id;
end;
$$;
