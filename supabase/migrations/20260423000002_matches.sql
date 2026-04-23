-- matches table
create table if not exists public.matches (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users (id) on delete cascade,
  match_user_id  uuid        not null references auth.users (id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- prevent duplicate pairs in either direction
  constraint unique_match unique (user_id, match_user_id)
);

create trigger set_matches_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

alter table public.matches enable row level security;

-- Users can see matches they are a participant of
create policy "Users can read own matches"
  on public.matches for select
  to authenticated
  using (user_id = auth.uid() or match_user_id = auth.uid());

-- Users can only create matches where they are the initiator
create policy "Users can insert own matches"
  on public.matches for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can delete their own matches (unmatch)
create policy "Users can delete own matches"
  on public.matches for delete
  to authenticated
  using (user_id = auth.uid());
