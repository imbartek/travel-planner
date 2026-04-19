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
create or replace function public.seed_default_checklist(p_trip_id uuid, p_locale text default 'pl')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_trip_member(p_trip_id) then
    raise exception 'Access denied' using errcode = '42501';
  end if;

  insert into public.checklist_items (trip_id, category, item, order_index)
  select p_trip_id,
         case when p_locale = 'en' then category_en else category_pl end,
         case when p_locale = 'en' then item_en else item_pl end,
         order_index
  from public.default_checklist_items
  order by category_pl, order_index;
end;
$$;
