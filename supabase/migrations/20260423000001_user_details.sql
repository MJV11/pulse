-- user_details table
create table if not exists public.user_details (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  user_name  text,
  bio        text,
  sports     text[]                    not null default '{}',
  rating     numeric(4, 2),
  created_at timestamptz               not null default now(),
  updated_at timestamptz               not null default now()
);

create trigger set_user_details_updated_at
  before update on public.user_details
  for each row execute function public.set_updated_at();

alter table public.user_details enable row level security;

-- Anyone authenticated can read any profile
create policy "Authenticated users can read user_details"
  on public.user_details for select
  to authenticated
  using (true);

-- Users can insert their own row
create policy "Users can insert own user_details"
  on public.user_details for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can update their own row
create policy "Users can update own user_details"
  on public.user_details for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
