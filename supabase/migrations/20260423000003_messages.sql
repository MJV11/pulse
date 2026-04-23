-- messages table
create or replace function public.set_modified_at()
returns trigger
language plpgsql
as $$
begin
  new.modified_at = now();
  return new;
end;
$$;

create table if not exists public.messages (
  id            uuid        primary key default gen_random_uuid(),
  from_user_id  uuid        not null references auth.users (id) on delete cascade,
  to_user_id    uuid        not null references auth.users (id) on delete cascade,
  content       text        not null,
  reacted_with  text,
  created_at    timestamptz not null default now(),
  modified_at   timestamptz not null default now()
);

create index if not exists messages_from_user_idx on public.messages (from_user_id);
create index if not exists messages_to_user_idx   on public.messages (to_user_id);
create index if not exists messages_created_at_idx on public.messages (created_at);

create trigger set_messages_modified_at
  before update on public.messages
  for each row execute function public.set_modified_at();

alter table public.messages enable row level security;

-- Both participants can read messages in their thread
create policy "Participants can read messages"
  on public.messages for select
  to authenticated
  using (from_user_id = auth.uid() or to_user_id = auth.uid());

-- Sender can only insert messages from themselves
create policy "Users can send messages"
  on public.messages for insert
  to authenticated
  with check (from_user_id = auth.uid());

-- Sender can edit their own messages (content + reaction)
create policy "Users can update own messages"
  on public.messages for update
  to authenticated
  using (from_user_id = auth.uid())
  with check (from_user_id = auth.uid());

-- Sender can delete their own messages
create policy "Users can delete own messages"
  on public.messages for delete
  to authenticated
  using (from_user_id = auth.uid());
