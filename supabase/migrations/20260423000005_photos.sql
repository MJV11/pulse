-- ── Avatar URL on user_details ──────────────────────────────────────────────
alter table public.user_details
  add column if not exists avatar_url text;

-- ── Profile gallery photos ────────────────────────────────────────────────────
create table if not exists public.profile_photos (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  storage_path text        not null,
  position     integer     not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.profile_photos enable row level security;

create policy "Authenticated users can view any profile photos"
  on public.profile_photos for select
  to authenticated
  using (true);

create policy "Users can insert own profile photos"
  on public.profile_photos for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete own profile photos"
  on public.profile_photos for delete
  to authenticated
  using (user_id = auth.uid());

-- ── Storage buckets ───────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- ── Avatars bucket policies ───────────────────────────────────────────────────
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── Gallery bucket policies ───────────────────────────────────────────────────
create policy "Anyone can view gallery photos"
  on storage.objects for select
  using (bucket_id = 'gallery');

create policy "Users can upload own gallery photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'gallery'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own gallery photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'gallery'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
