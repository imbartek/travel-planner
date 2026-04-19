# 03 — Database schema

## Konfiguracja Supabase

- Region: `eu-central-1` (Frankfurt) — najbliżej Polski
- Auth: email/password, bez OAuth na MVP
- Email templates (confirmation, password reset) — używaj domyślnych Supabase na start, customize later
- Site URL: `http://localhost:3000` (dev), produkcyjny URL na Vercel (prod)

## Migracje

Wszystkie w `supabase/migrations/` z konwencją `YYYYMMDDHHMMSS_name.sql`.

---

## Migration 1: Initial schema

Plik: `20250101000000_initial_schema.sql`

```sql
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

-- Uwaga: kolumna trips.template_id referencuje templates, a templates jest tworzona później w tej samej migracji.
-- Jeśli Postgres narzeka na kolejność, rozbij trips.template_id na ALTER TABLE ... ADD COLUMN po utworzeniu templates.

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
```

**Uwaga o kolejności:** `trips.template_id` referencuje `templates`, który jest tworzony później w tej samej migracji. W praktyce: przenieś `create table templates` przed `create table trips`, ALBO stwórz `trips` bez kolumny `template_id` i dodaj ją jako `ALTER TABLE` po utworzeniu `templates`. Polecam pierwszą opcję — czystsze.

---

## Migration 2: Functions and triggers

Plik: `20250101000002_functions_triggers.sql`

```sql
-- =========================================
-- Update updated_at trigger
-- =========================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trips_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

create trigger fuel_calculations_updated_at
  before update on public.fuel_calculations
  for each row execute function public.set_updated_at();

-- =========================================
-- Auto-create profile on signup
-- =========================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================
-- Auto-add owner to trip_members on trip create
-- =========================================
create or replace function public.handle_new_trip()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_trip_created
  after insert on public.trips
  for each row execute function public.handle_new_trip();

-- =========================================
-- Helper functions for RLS
-- =========================================
create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists(
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_trip_owner(p_trip_id uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists(
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = auth.uid() and role = 'owner'
  );
$$;

-- =========================================
-- RPC: accept invitation
-- =========================================
create or replace function public.accept_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_invitation public.trip_invitations%rowtype;
  v_user_email text;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select email into v_user_email from auth.users where id = v_user_id;

  select * into v_invitation from public.trip_invitations where token = p_token;
  if not found then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;

  if v_invitation.status != 'pending' then
    raise exception 'Invitation already processed' using errcode = 'P0001';
  end if;

  if v_invitation.expires_at < now() then
    update public.trip_invitations set status = 'expired' where id = v_invitation.id;
    raise exception 'Invitation expired' using errcode = 'P0001';
  end if;

  if lower(v_invitation.invited_email) != lower(v_user_email) then
    raise exception 'Email mismatch' using errcode = 'P0001';
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (v_invitation.trip_id, v_user_id, v_invitation.role)
  on conflict (trip_id, user_id) do nothing;

  update public.trip_invitations
  set status = 'accepted', responded_at = now()
  where id = v_invitation.id;

  return v_invitation.trip_id;
end;
$$;

-- =========================================
-- RPC: seed default checklist for a trip (z template lub default)
-- =========================================
-- Używana gdy user tworzy trip bez templatu — aplikuje default checklist.
-- Gdy tworzy z templatu — client side kopiuje z template_checklist_items.

create or replace function public.seed_default_checklist(p_trip_id uuid, p_locale text default 'pl')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_trip_member(p_trip_id) then
    raise exception 'Access denied' using errcode = '42501';
  end if;

  -- Lista zdefiniowana w kodzie w lib/constants/checklist-defaults.ts
  -- ALE, dla pewności seeding na poziomie DB — tabela default_checklist.
  insert into public.checklist_items (trip_id, category, item, order_index)
  select p_trip_id,
         case when p_locale = 'en' then category_en else category_pl end,
         case when p_locale = 'en' then item_en else item_pl end,
         order_index
  from public.default_checklist_items
  order by category_pl, order_index;
end;
$$;
```

---

## Migration 3: Default checklist (seeded)

Plik: `20250101000003_seed_default_checklist.sql`

```sql
-- =========================================
-- Default checklist (używana gdy user tworzy trip bez templatu)
-- =========================================
create table public.default_checklist_items (
  id uuid primary key default gen_random_uuid(),
  category_pl text not null,
  category_en text not null,
  item_pl text not null,
  item_en text not null,
  order_index int not null default 0
);

insert into public.default_checklist_items (category_pl, category_en, item_pl, item_en, order_index) values
  -- Dokumenty
  ('Dokumenty','Documents','Dowód osobisty / paszport','ID card / passport',1),
  ('Dokumenty','Documents','Prawo jazdy','Driver license',2),
  ('Dokumenty','Documents','Dowód rejestracyjny','Vehicle registration',3),
  ('Dokumenty','Documents','OC (zielona karta poza UE)','Insurance (green card outside EU)',4),
  ('Dokumenty','Documents','Polisa Assistance','Assistance policy',5),
  ('Dokumenty','Documents','Rezerwacje hoteli','Hotel bookings',6),
  ('Dokumenty','Documents','Karty płatnicze','Payment cards',7),
  ('Dokumenty','Documents','Gotówka (EUR)','Cash (EUR)',8),
  -- Samochód
  ('Samochód','Car','Trójkąt ostrzegawczy','Warning triangle',1),
  ('Samochód','Car','Kamizelka odblaskowa','Reflective vest',2),
  ('Samochód','Car','Apteczka','First aid kit',3),
  ('Samochód','Car','Gaśnica','Fire extinguisher',4),
  ('Samochód','Car','Koło zapasowe / zestaw naprawczy','Spare tire / repair kit',5),
  ('Samochód','Car','Linka holownicza','Tow rope',6),
  ('Samochód','Car','Sprawdzony olej i płyny','Oil and fluids checked',7),
  ('Samochód','Car','Sprawdzone opony i ciśnienie','Tires and pressure checked',8),
  ('Samochód','Car','Winiety','Vignettes',9),
  -- Elektronika
  ('Elektronika','Electronics','Telefon + ładowarka','Phone + charger',1),
  ('Elektronika','Electronics','Ładowarka samochodowa','Car charger',2),
  ('Elektronika','Electronics','Power bank','Power bank',3),
  ('Elektronika','Electronics','Nawigacja / GPS','Navigation / GPS',4),
  ('Elektronika','Electronics','Adapter gniazdka','Plug adapter',5),
  ('Elektronika','Electronics','Kable USB-C / Lightning','USB-C / Lightning cables',6),
  -- Ubrania i osobiste
  ('Ubrania','Clothing','Ubrania na pogodę','Weather-appropriate clothes',1),
  ('Ubrania','Clothing','Kurtka przeciwdeszczowa','Rain jacket',2),
  ('Ubrania','Clothing','Buty wygodne','Comfortable shoes',3),
  ('Ubrania','Clothing','Okulary przeciwsłoneczne','Sunglasses',4),
  ('Ubrania','Clothing','Kosmetyczka','Toiletry bag',5),
  ('Ubrania','Clothing','Ręcznik','Towel',6),
  ('Ubrania','Clothing','Strój kąpielowy','Swimsuit',7),
  -- Apteczka
  ('Apteczka','First aid','Plastry','Plasters',1),
  ('Apteczka','First aid','Środki przeciwbólowe','Painkillers',2),
  ('Apteczka','First aid','Leki na alergię','Allergy meds',3),
  ('Apteczka','First aid','Leki na żołądek','Stomach meds',4),
  ('Apteczka','First aid','Krem z filtrem','Sunscreen',5),
  ('Apteczka','First aid','Środek odstraszający owady','Insect repellent',6),
  ('Apteczka','First aid','Leki stałe','Regular medications',7),
  -- Na drogę
  ('Na drogę','On the road','Woda','Water',1),
  ('Na drogę','On the road','Przekąski','Snacks',2),
  ('Na drogę','On the road','Muzyka / podcasty offline','Music / podcasts offline',3),
  ('Na drogę','On the road','Poduszka podróżna','Travel pillow',4),
  ('Na drogę','On the road','Worki na śmieci','Trash bags',5),
  ('Na drogę','On the road','Chusteczki','Tissues',6);
```

---

## Migration 4: Seed templates

Plik: `20250101000004_seed_templates.sql`

```sql
-- =========================================
-- Templates (5 systemowych)
-- =========================================
insert into public.templates (slug, name_pl, name_en, description_pl, description_en, suggested_countries, is_system) values
  ('road-trip-europe',
   'Road trip po Europie',
   'European road trip',
   'Wielodniowa podróż przez kilka krajów Schengen. Zawiera sugestie winiet i rozbudowaną checklistę.',
   'Multi-day trip through several Schengen countries. Includes vignette suggestions and extensive checklist.',
   array['CZ','AT','SI','HU','SK'],
   true),
  ('city-break',
   'City break',
   'City break',
   'Krótka podróż 2-3 dniowa do jednego miasta. Lżejsza checklista.',
   'Short 2-3 day trip to a single city. Lighter checklist.',
   null,
   true),
  ('mountain-weekend',
   'Weekend w górach',
   'Mountain weekend',
   'Weekendowy wypad w góry z dodatkowymi pozycjami w checkliście (łańcuchy, ciepła odzież).',
   'Weekend mountain trip with additional checklist items (chains, warm clothing).',
   null,
   true),
  ('family-with-child',
   'Podróż z dzieckiem',
   'Family trip with child',
   'Rozbudowana checklista o pozycje dla rodzica z dzieckiem (foteliki, pampersy, zabawki).',
   'Extended checklist with items for parent and child (car seat, diapers, toys).',
   null,
   true),
  ('outside-eu',
   'Podróż poza UE',
   'Trip outside EU',
   'Paszport, zielona karta, dodatkowe ubezpieczenie — checklista dla wyjazdu poza Unię.',
   'Passport, green card, extra insurance — checklist for travel outside the EU.',
   null,
   true);

-- Dodaj template_checklist_items dla każdego template
-- (skróty tutaj — Claude Code wygeneruje pełne insety per template)
-- Przykład: mountain-weekend dodaje do defaultów: łańcuchy na koła, skafander, kijki trekkingowe itp.
-- family-with-child dodaje: fotelik, pampersy, mokre chusteczki, butelka, smoczek, ulubiona zabawka, kocyk

-- Dodaj template_vignettes dla road-trip-europe:
insert into public.template_vignettes (template_id, country, suggested_duration, order_index)
select id, 'AT', '10 dni', 1 from public.templates where slug = 'road-trip-europe'
union all select id, 'SK', '10 dni', 2 from public.templates where slug = 'road-trip-europe'
union all select id, 'SI', '7 dni', 3 from public.templates where slug = 'road-trip-europe'
union all select id, 'HU', '10 dni', 4 from public.templates where slug = 'road-trip-europe';
```

**Uwaga dla Claude Code:** rozbuduj `template_checklist_items` per template z konkretnymi pozycjami. Bazuj na defaultowej checkliście + dodaj specyficzne dla danego template'u.

---

## Migration 5: RLS policies

Plik: `20250101000001_rls_policies.sql` (mimo numeru, wykonaj jako ostatnią — po funkcjach)

```sql
-- =========================================
-- Enable RLS
-- =========================================
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_invitations enable row level security;
alter table public.waypoints enable row level security;
alter table public.vignettes enable row level security;
alter table public.fuel_calculations enable row level security;
alter table public.fuel_price_segments enable row level security;
alter table public.checklist_items enable row level security;
alter table public.expenses enable row level security;
alter table public.currency_rates enable row level security;
alter table public.templates enable row level security;
alter table public.template_checklist_items enable row level security;
alter table public.template_vignettes enable row level security;
alter table public.default_checklist_items enable row level security;

-- =========================================
-- Profiles
-- =========================================
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- (insert obsługiwany przez trigger handle_new_user)

-- =========================================
-- Trips
-- =========================================
create policy "Members can view trip"
  on public.trips for select using (public.is_trip_member(id));

create policy "Users can create trips"
  on public.trips for insert with check (auth.uid() = owner_id);

create policy "Members can update trip"
  on public.trips for update using (public.is_trip_member(id));

create policy "Only owner can delete trip"
  on public.trips for delete using (public.is_trip_owner(id));

-- =========================================
-- Trip members
-- =========================================
create policy "Members can view trip members"
  on public.trip_members for select using (public.is_trip_member(trip_id));

create policy "Owner can insert members"
  on public.trip_members for insert with check (
    public.is_trip_owner(trip_id) or
    -- pierwszy wpis (owner) tworzony przez trigger z security definer
    (auth.uid() = user_id and role = 'owner')
  );

create policy "Owner can delete members"
  on public.trip_members for delete using (
    public.is_trip_owner(trip_id) or
    -- user może usunąć siebie (opuścić trip)
    auth.uid() = user_id
  );

-- =========================================
-- Invitations
-- =========================================
create policy "Owner can view invitations"
  on public.trip_invitations for select using (public.is_trip_owner(trip_id));

create policy "Owner can create invitations"
  on public.trip_invitations for insert with check (
    public.is_trip_owner(trip_id) and auth.uid() = invited_by
  );

create policy "Owner can update invitations"
  on public.trip_invitations for update using (public.is_trip_owner(trip_id));

create policy "Owner can delete invitations"
  on public.trip_invitations for delete using (public.is_trip_owner(trip_id));

-- =========================================
-- Waypoints, vignettes, fuel_calculations, checklist_items, expenses
-- (ten sam wzorzec — member może CRUD)
-- =========================================
-- Waypoints
create policy "Members can view waypoints"
  on public.waypoints for select using (public.is_trip_member(trip_id));
create policy "Members can insert waypoints"
  on public.waypoints for insert with check (public.is_trip_member(trip_id));
create policy "Members can update waypoints"
  on public.waypoints for update using (public.is_trip_member(trip_id));
create policy "Members can delete waypoints"
  on public.waypoints for delete using (public.is_trip_member(trip_id));

-- Vignettes
create policy "Members can view vignettes"
  on public.vignettes for select using (public.is_trip_member(trip_id));
create policy "Members can insert vignettes"
  on public.vignettes for insert with check (public.is_trip_member(trip_id));
create policy "Members can update vignettes"
  on public.vignettes for update using (public.is_trip_member(trip_id));
create policy "Members can delete vignettes"
  on public.vignettes for delete using (public.is_trip_member(trip_id));

-- Fuel calculations
create policy "Members can view fuel_calculations"
  on public.fuel_calculations for select using (public.is_trip_member(trip_id));
create policy "Members can insert fuel_calculations"
  on public.fuel_calculations for insert with check (public.is_trip_member(trip_id));
create policy "Members can update fuel_calculations"
  on public.fuel_calculations for update using (public.is_trip_member(trip_id));
create policy "Members can delete fuel_calculations"
  on public.fuel_calculations for delete using (public.is_trip_member(trip_id));

-- Fuel price segments (cascade via fuel_calculations)
create policy "Members can view fuel_price_segments"
  on public.fuel_price_segments for select using (
    exists(select 1 from public.fuel_calculations fc
           where fc.id = fuel_calculation_id and public.is_trip_member(fc.trip_id))
  );
create policy "Members can insert fuel_price_segments"
  on public.fuel_price_segments for insert with check (
    exists(select 1 from public.fuel_calculations fc
           where fc.id = fuel_calculation_id and public.is_trip_member(fc.trip_id))
  );
create policy "Members can update fuel_price_segments"
  on public.fuel_price_segments for update using (
    exists(select 1 from public.fuel_calculations fc
           where fc.id = fuel_calculation_id and public.is_trip_member(fc.trip_id))
  );
create policy "Members can delete fuel_price_segments"
  on public.fuel_price_segments for delete using (
    exists(select 1 from public.fuel_calculations fc
           where fc.id = fuel_calculation_id and public.is_trip_member(fc.trip_id))
  );

-- Checklist
create policy "Members can view checklist"
  on public.checklist_items for select using (public.is_trip_member(trip_id));
create policy "Members can insert checklist"
  on public.checklist_items for insert with check (public.is_trip_member(trip_id));
create policy "Members can update checklist"
  on public.checklist_items for update using (public.is_trip_member(trip_id));
create policy "Members can delete checklist"
  on public.checklist_items for delete using (public.is_trip_member(trip_id));

-- Expenses
create policy "Members can view expenses"
  on public.expenses for select using (public.is_trip_member(trip_id));
create policy "Members can insert expenses"
  on public.expenses for insert with check (public.is_trip_member(trip_id));
create policy "Members can update expenses"
  on public.expenses for update using (public.is_trip_member(trip_id));
create policy "Members can delete expenses"
  on public.expenses for delete using (public.is_trip_member(trip_id));

-- =========================================
-- Currency rates (read-only dla auth, write przez service_role)
-- =========================================
create policy "Anyone authenticated can read currency rates"
  on public.currency_rates for select using (auth.role() = 'authenticated');

-- =========================================
-- Templates (read-only dla auth)
-- =========================================
create policy "Anyone authenticated can read templates"
  on public.templates for select using (auth.role() = 'authenticated');

create policy "Anyone authenticated can read template checklist items"
  on public.template_checklist_items for select using (auth.role() = 'authenticated');

create policy "Anyone authenticated can read template vignettes"
  on public.template_vignettes for select using (auth.role() = 'authenticated');

create policy "Anyone authenticated can read default checklist items"
  on public.default_checklist_items for select using (auth.role() = 'authenticated');
```

---

## Generowanie typów TypeScript

Po wszystkich migracjach:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > lib/supabase/database.types.ts
```

Użyj `Database` typu w Supabase client:

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/database.types'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

## Testowanie RLS

Przed ruszeniem dalej — zrób manualny test:

1. Zarejestruj user A, utwórz trip
2. Zarejestruj user B
3. Spróbuj odczytać trip usera A jako user B — musi zwrócić pustą listę
4. Zaproś B przez invitations, zaakceptuj
5. Teraz B widzi trip i może go edytować
6. Tylko A może go usunąć
