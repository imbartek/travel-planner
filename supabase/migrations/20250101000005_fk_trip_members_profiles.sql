-- Add direct FK from trip_members.user_id to profiles.id
-- This allows PostgREST to navigate the trip_members -> profiles relationship
alter table public.trip_members
  add constraint trip_members_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;
