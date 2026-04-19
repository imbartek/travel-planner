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
    (auth.uid() = user_id and role = 'owner')
  );

create policy "Owner can delete members"
  on public.trip_members for delete using (
    public.is_trip_owner(trip_id) or
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
-- Waypoints
-- =========================================
create policy "Members can view waypoints"
  on public.waypoints for select using (public.is_trip_member(trip_id));
create policy "Members can insert waypoints"
  on public.waypoints for insert with check (public.is_trip_member(trip_id));
create policy "Members can update waypoints"
  on public.waypoints for update using (public.is_trip_member(trip_id));
create policy "Members can delete waypoints"
  on public.waypoints for delete using (public.is_trip_member(trip_id));

-- =========================================
-- Vignettes
-- =========================================
create policy "Members can view vignettes"
  on public.vignettes for select using (public.is_trip_member(trip_id));
create policy "Members can insert vignettes"
  on public.vignettes for insert with check (public.is_trip_member(trip_id));
create policy "Members can update vignettes"
  on public.vignettes for update using (public.is_trip_member(trip_id));
create policy "Members can delete vignettes"
  on public.vignettes for delete using (public.is_trip_member(trip_id));

-- =========================================
-- Fuel calculations
-- =========================================
create policy "Members can view fuel_calculations"
  on public.fuel_calculations for select using (public.is_trip_member(trip_id));
create policy "Members can insert fuel_calculations"
  on public.fuel_calculations for insert with check (public.is_trip_member(trip_id));
create policy "Members can update fuel_calculations"
  on public.fuel_calculations for update using (public.is_trip_member(trip_id));
create policy "Members can delete fuel_calculations"
  on public.fuel_calculations for delete using (public.is_trip_member(trip_id));

-- =========================================
-- Fuel price segments
-- =========================================
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

-- =========================================
-- Checklist
-- =========================================
create policy "Members can view checklist"
  on public.checklist_items for select using (public.is_trip_member(trip_id));
create policy "Members can insert checklist"
  on public.checklist_items for insert with check (public.is_trip_member(trip_id));
create policy "Members can update checklist"
  on public.checklist_items for update using (public.is_trip_member(trip_id));
create policy "Members can delete checklist"
  on public.checklist_items for delete using (public.is_trip_member(trip_id));

-- =========================================
-- Expenses
-- =========================================
create policy "Members can view expenses"
  on public.expenses for select using (public.is_trip_member(trip_id));
create policy "Members can insert expenses"
  on public.expenses for insert with check (public.is_trip_member(trip_id));
create policy "Members can update expenses"
  on public.expenses for update using (public.is_trip_member(trip_id));
create policy "Members can delete expenses"
  on public.expenses for delete using (public.is_trip_member(trip_id));

-- =========================================
-- Currency rates
-- =========================================
create policy "Anyone authenticated can read currency rates"
  on public.currency_rates for select using (auth.role() = 'authenticated');

-- =========================================
-- Templates
-- =========================================
create policy "Anyone authenticated can read templates"
  on public.templates for select using (auth.role() = 'authenticated');

create policy "Anyone authenticated can read template checklist items"
  on public.template_checklist_items for select using (auth.role() = 'authenticated');

create policy "Anyone authenticated can read template vignettes"
  on public.template_vignettes for select using (auth.role() = 'authenticated');

create policy "Anyone authenticated can read default checklist items"
  on public.default_checklist_items for select using (auth.role() = 'authenticated');
