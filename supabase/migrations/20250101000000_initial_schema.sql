-- =========================================
-- Extensions
-- =========================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =========================================
-- Profiles
-- =========================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  display_name text,
  preferred_language text not null default 'pl' check (preferred_language in ('pl','en')),
  preferred_currency text not null default 'EUR',
  email_notifications_enabled boolean not null default true,
  reminder_days_before int not null default 3 check (reminder_days_before between 0 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================
-- Templates (system templates w DB)
-- =========================================
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_pl text not null,
  name_en text not null,
  description_pl text,
  description_en text,
  suggested_countries text[],
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.template_checklist_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  category_pl text not null,
  category_en text not null,
  item_pl text not null,
  item_en text not null,
  order_index int not null default 0
);

create table public.template_vignettes (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  country text not null,
  suggested_duration text,
  order_index int not null default 0
);

-- =========================================
-- Trips
-- =========================================
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  country_from text,
  country_to text,
  date_start date,
  date_end date,
  notes text,
  template_id uuid references public.templates(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_dates_order check (date_end is null or date_start is null or date_end >= date_start)
);

-- =========================================
-- Trip members (collaborative)
-- =========================================
create table public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','editor')),
  created_at timestamptz not null default now(),
  unique(trip_id, user_id)
);

-- =========================================
-- Trip invitations
-- =========================================
create table public.trip_invitations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  invited_email text not null,
  invited_by uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('editor')),
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  status text not null default 'pending' check (status in ('pending','accepted','rejected','expired','cancelled')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

-- =========================================
-- Waypoints
-- =========================================
create table public.waypoints (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  order_index int not null,
  city text not null,
  country text,
  note text,
  created_at timestamptz not null default now()
);

-- =========================================
-- Vignettes (per trip)
-- =========================================
create table public.vignettes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  country text not null,
  duration text,
  cost numeric(10,2) not null default 0,
  currency text not null default 'EUR',
  purchase_url text,
  note text,
  created_at timestamptz not null default now()
);

-- =========================================
-- Fuel calculations (1:1 z trip)
-- =========================================
create table public.fuel_calculations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references public.trips(id) on delete cascade,
  car_model text,
  consumption numeric(5,2) check (consumption is null or consumption > 0),
  tank_size numeric(5,2) check (tank_size is null or tank_size > 0),
  total_distance numeric(8,2) check (total_distance is null or total_distance >= 0),
  start_with_full_tank boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================
-- Fuel price segments
-- =========================================
create table public.fuel_price_segments (
  id uuid primary key default gen_random_uuid(),
  fuel_calculation_id uuid not null references public.fuel_calculations(id) on delete cascade,
  country text not null,
  price_per_liter numeric(6,3) not null check (price_per_liter > 0),
  currency text not null default 'EUR',
  order_index int not null default 0
);

-- =========================================
-- Checklist items
-- =========================================
create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category text not null,
  item text not null,
  is_done boolean not null default false,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

-- =========================================
-- Expenses
-- =========================================
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category text not null check (category in ('transport','accommodation','food','activities','vignettes','fuel','other')),
  label text not null,
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'EUR',
  created_at timestamptz not null default now()
);

-- =========================================
-- Currency rates (cache z frankfurter.app, baza EUR)
-- =========================================
create table public.currency_rates (
  code text primary key,
  rate_to_eur numeric(12,6) not null check (rate_to_eur > 0),
  updated_at timestamptz not null default now()
);

-- Insert initial seed rates (1:1 dla EUR, pozostałe cron zaktualizuje)
insert into public.currency_rates (code, rate_to_eur) values
  ('EUR', 1.000000),
  ('PLN', 4.300000),
  ('HUF', 400.000000),
  ('CZK', 25.000000),
  ('CHF', 0.950000),
  ('GBP', 0.850000),
  ('USD', 1.080000),
  ('SEK', 11.500000),
  ('NOK', 11.800000),
  ('DKK', 7.460000),
  ('RON', 4.970000),
  ('BGN', 1.955800),
  ('HRK', 7.530000)
on conflict (code) do nothing;

-- =========================================
-- Indexes
-- =========================================
create index idx_trips_owner on public.trips(owner_id);
create index idx_trips_dates on public.trips(date_start, date_end);
create index idx_trip_members_user on public.trip_members(user_id);
create index idx_trip_members_trip on public.trip_members(trip_id);
create index idx_waypoints_trip on public.waypoints(trip_id, order_index);
create index idx_vignettes_trip on public.vignettes(trip_id);
create index idx_fuel_segments_calc on public.fuel_price_segments(fuel_calculation_id, order_index);
create index idx_checklist_trip on public.checklist_items(trip_id, category, order_index);
create index idx_expenses_trip on public.expenses(trip_id);
create index idx_invitations_email_status on public.trip_invitations(invited_email, status);
create index idx_invitations_token on public.trip_invitations(token);
create index idx_invitations_trip on public.trip_invitations(trip_id);
