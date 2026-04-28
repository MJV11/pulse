-- user_details table
create table if not exists public.user_details (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  user_name   text,
  bio         text,
  birthday    date,
  sports      text[]                    not null default '{}',
  rating      numeric(4, 2),
  -- How the user identifies. NULL until they've gone through onboarding.
  gender      text,
  -- Who the user wants to see in discovery. NULL until set.
  looking_for text,
  created_at  timestamptz               not null default now(),
  updated_at  timestamptz               not null default now()
);

-- For databases that already had this table before `birthday` / gender
-- columns were added, bring them in line with the new shape.
alter table public.user_details
  add column if not exists birthday    date,
  add column if not exists gender      text,
  add column if not exists looking_for text;

-- Sanity check: birthday can't be in the future and the user has to be a
-- plausible human age (under 120). Drop-and-recreate so re-running this
-- migration is idempotent.
alter table public.user_details
  drop constraint if exists user_details_birthday_check;
alter table public.user_details
  add constraint user_details_birthday_check
  check (birthday is null or (birthday <= current_date and birthday >= current_date - interval '120 years'));

-- Gender + dating-preference enums kept as text + check constraints (rather
-- than a Postgres enum type) so the set can be expanded without an
-- ALTER TYPE dance across environments.
alter table public.user_details
  drop constraint if exists user_details_gender_check;
alter table public.user_details
  add constraint user_details_gender_check
  check (gender is null or gender in ('man', 'woman', 'nonbinary'));

alter table public.user_details
  drop constraint if exists user_details_looking_for_check;
alter table public.user_details
  add constraint user_details_looking_for_check
  check (looking_for is null or looking_for in ('man', 'woman', 'nonbinary', 'all'));

drop trigger if exists set_user_details_updated_at on public.user_details;
create trigger set_user_details_updated_at
  before update on public.user_details
  for each row execute function public.set_updated_at();

alter table public.user_details enable row level security;

-- Anyone authenticated can read any profile
drop policy if exists "Authenticated users can read user_details" on public.user_details;
create policy "Authenticated users can read user_details"
  on public.user_details for select
  to authenticated
  using (true);

-- Users can insert their own row
drop policy if exists "Users can insert own user_details" on public.user_details;
create policy "Users can insert own user_details"
  on public.user_details for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can update their own row
drop policy if exists "Users can update own user_details" on public.user_details;
create policy "Users can update own user_details"
  on public.user_details for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
