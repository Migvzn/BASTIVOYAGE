-- =====================================================
--  BastiVoyage — Supabase schema
--  Run this in your Supabase SQL editor after creating the project.
--  Auth (auth.users) is managed by Supabase Auth automatically.
-- =====================================================

create extension if not exists pgcrypto;

-- Saved trips, owned by a Supabase auth user
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination text not null,
  origin text,
  duration_days int,
  budget_total numeric default 0,
  summary text,
  prompt text,
  plan jsonb not null,
  airbnb_search_link text,
  sources jsonb,
  is_premium boolean default false,
  created_at timestamptz default now()
);

create index if not exists trips_user_id_idx on public.trips(user_id);
create index if not exists trips_created_at_idx on public.trips(created_at desc);

alter table public.trips enable row level security;

-- Users can only see/modify their own trips
create policy "trips_select_own"
  on public.trips for select
  using (auth.uid() = user_id);

create policy "trips_insert_own"
  on public.trips for insert
  with check (auth.uid() = user_id);

create policy "trips_update_own"
  on public.trips for update
  using (auth.uid() = user_id);

create policy "trips_delete_own"
  on public.trips for delete
  using (auth.uid() = user_id);


-- Premium purchases (optional — populated by Stripe webhook with service role)
create table if not exists public.premium_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stripe_session_id text unique,
  stripe_customer_id text,
  email text,
  amount int,
  trip_id uuid references public.trips(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.premium_purchases enable row level security;

-- Users see only their own purchases
create policy "premium_select_own"
  on public.premium_purchases for select
  using (auth.uid() = user_id);
