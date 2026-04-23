-- Initial schema
-- Add your tables here. Example below:

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Example table — delete or rename as needed
create table if not exists public.examples (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at on row changes
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_examples_updated_at
  before update on public.examples
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.examples enable row level security;

-- Allow authenticated users to read all rows (adjust as needed)
create policy "Authenticated users can read examples"
  on public.examples for select
  to authenticated
  using (true);
