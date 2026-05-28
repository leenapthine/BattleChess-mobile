-- =========================================
-- BATTLECHESS DATABASE SCHEMA
-- Run in Supabase SQL Editor. Idempotent-safe to re-run is NOT guaranteed.
-- =========================================

-- 1. PROFILES TABLE
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "profiles_read_all" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- =========================================

-- 2. GAMES TABLE
create table public.games (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  guest_id uuid references auth.users(id) on delete set null,
  host_name text not null,
  guest_name text,
  status text not null default 'waiting'
    check (status in ('waiting', 'army_select', 'active', 'finished', 'abandoned')),
  point_cap int not null,
  host_army jsonb,
  guest_army jsonb,
  game_state jsonb,
  winner_id uuid references auth.users(id) on delete set null,
  last_action_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index games_status_idx on public.games(status);
create index games_host_idx on public.games(host_id);
create index games_guest_idx on public.games(guest_id);

alter table public.games enable row level security;

create policy "games_read_lobby" on public.games
  for select using (
    auth.role() = 'authenticated'
    and (
      status = 'waiting'
      or auth.uid() = host_id
      or auth.uid() = guest_id
    )
  );

create policy "games_insert_as_host" on public.games
  for insert with check (auth.uid() = host_id);

-- Allow updating if you're host, guest, OR joining a waiting game
create policy "games_update_participants" on public.games
  for update using (
    auth.uid() = host_id
    or auth.uid() = guest_id
    or (status = 'waiting' and guest_id is null)
  );

create policy "games_delete_participants" on public.games
  for delete using (auth.uid() = host_id or auth.uid() = guest_id);

-- =========================================

-- 3. CHAT_MESSAGES TABLE
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'lobby',
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  message text not null check (length(message) <= 500),
  created_at timestamptz default now() not null
);

create index chat_channel_created_idx on public.chat_messages(channel, created_at desc);

alter table public.chat_messages enable row level security;

create policy "chat_read_all" on public.chat_messages
  for select using (auth.role() = 'authenticated');

create policy "chat_insert_own" on public.chat_messages
  for insert with check (auth.uid() = user_id);

-- =========================================

-- 4. AUTO-UPDATE updated_at on games
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger games_updated_at
  before update on public.games
  for each row execute function update_updated_at();

-- =========================================

-- 5. ENABLE REALTIME
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.chat_messages;
