-- NIS Eagles: run once in a new Supabase project's SQL Editor.
-- Authentication owns email + password hashes; never store raw passwords here.
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 60),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create function public.enforce_school_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is null or lower(new.email) !~ '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@hbalm\.nis\.edu\.kz$' then
    raise exception 'Only @hbalm.nis.edu.kz school accounts are allowed.';
  end if;
  return new;
end;
$$;
create trigger school_email_only before insert or update of email on auth.users
for each row execute function public.enforce_school_email();

create function public.create_student_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,name) values(new.id, trim(coalesce(new.raw_user_meta_data->>'name','Student')));
  return new;
end;
$$;
create trigger new_school_student after insert on auth.users
for each row execute function public.create_student_profile();

create function public.is_school_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from auth.users u where u.id = auth.uid()
    and u.email_confirmed_at is not null
    and lower(u.email) ~ '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@hbalm\.nis\.edu\.kz$');
$$;
create function public.is_school_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_school_member() and exists(select 1 from public.profiles where id = auth.uid() and is_admin);
$$;

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 3 and 60),
  description text not null check (char_length(trim(description)) between 20 and 500),
  category text not null check (category in ('Creative','Academic','Technology','Sports','Community')),
  meeting text not null check (char_length(trim(meeting)) between 3 and 100),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  member_count integer not null default 0 check(member_count >= 0),
  created_at timestamptz not null default now()
);
create unique index club_name_unique on public.clubs(lower(trim(name)));
create index club_owner_index on public.clubs(owner_id);
create table public.club_members (
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(club_id,user_id)
);
create index member_user_index on public.club_members(user_id);

create function public.update_member_count() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.clubs set member_count = member_count + 1 where id = new.club_id;
    return new;
  else
    update public.clubs set member_count = member_count - 1 where id = old.club_id;
    return old;
  end if;
end;
$$;
create trigger membership_count after insert or delete on public.club_members
for each row execute function public.update_member_count();
create function public.add_club_founder() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.club_members(club_id,user_id) values(new.id,new.owner_id);
  return new;
end;
$$;
create trigger founder_membership after insert on public.clubs
for each row execute function public.add_club_founder();

create view public.club_directory with (security_invoker = true) as
select id,name,description,category,meeting,owner_id,created_at,member_count from public.clubs;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check(char_length(trim(title)) between 3 and 100),
  description text not null check(char_length(trim(description)) between 10 and 1000),
  starts_at timestamptz not null,
  location text not null check(char_length(trim(location)) between 2 and 100),
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create index upcoming_events_index on public.events(starts_at) where published;
create table public.shanyraks (
  id integer primary key,
  name text not null unique,
  points integer not null default 0 check(points >= 0)
);
insert into public.shanyraks(id,name) values
  (2,'Алаш'),(3,'Алматы'),(4,'Алтын емел'),(5,'Атамекен'),
  (6,'Болашақ'),(7,'Есентай'),(8,'Жалын'),(9,'Жас Қанат'),(10,'Жетіген'),
  (11,'Алмалы'),(12,'Көктөбе'),(13,'Медеу'),(14,'Сарыарқа'),(15,'Сұңқар'),
  (16,'Тұлпар'),(17,'Тұран'),(18,'Үшқоңыр'),(19,'Хан тәңірі'),(20,'Шымбұлақ');

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.events enable row level security;
alter table public.shanyraks enable row level security;

-- Explicit grants: browser clients cannot promote themselves or forge member counts.
revoke all on public.profiles,public.clubs,public.club_members,public.events,public.shanyraks,public.club_directory from anon,authenticated;
grant select on public.clubs,public.club_directory,public.events,public.shanyraks to anon,authenticated;
grant select on public.profiles,public.club_members to authenticated;
grant insert(name,description,category,meeting,owner_id) on public.clubs to authenticated;
grant update(name,description,category,meeting) on public.clubs to authenticated;
grant delete on public.clubs to authenticated;
grant insert(club_id,user_id),delete on public.club_members to authenticated;
grant insert(title,description,starts_at,location,published),update(title,description,starts_at,location,published),delete on public.events to authenticated;
grant update(points) on public.shanyraks to authenticated;

create policy own_profile on public.profiles for select to authenticated
using(id = auth.uid() and public.is_school_member());
create policy public_clubs on public.clubs for select to anon,authenticated using(true);
create policy school_create_club on public.clubs for insert to authenticated
with check(public.is_school_member() and owner_id = auth.uid());
create policy owner_edit_club on public.clubs for update to authenticated
using(public.is_school_member() and owner_id = auth.uid()) with check(owner_id = auth.uid());
create policy owner_or_admin_delete_club on public.clubs for delete to authenticated
using((public.is_school_member() and owner_id = auth.uid()) or public.is_school_admin());
create policy private_membership on public.club_members for select to authenticated
using(public.is_school_member() and user_id = auth.uid());
create policy school_join_club on public.club_members for insert to authenticated
with check(public.is_school_member() and user_id = auth.uid());
create policy school_leave_club on public.club_members for delete to authenticated
using(public.is_school_member() and user_id = auth.uid() and exists(
  select 1 from public.clubs where id = club_id and owner_id <> auth.uid()));
create policy published_events on public.events for select to anon,authenticated
using(published or public.is_school_admin());
create policy admin_create_event on public.events for insert to authenticated
with check(public.is_school_admin() and starts_at > now());
create policy admin_edit_event on public.events for update to authenticated
using(public.is_school_admin()) with check(public.is_school_admin());
create policy admin_delete_event on public.events for delete to authenticated using(public.is_school_admin());
create policy public_shanyraks on public.shanyraks for select to anon,authenticated using(true);
create policy admin_scores on public.shanyraks for update to authenticated
using(public.is_school_admin()) with check(public.is_school_admin());

revoke all on function public.enforce_school_email(),public.create_student_profile(),public.update_member_count(),public.add_club_founder() from public,anon,authenticated;
revoke all on function public.is_school_member(),public.is_school_admin() from public;
grant execute on function public.is_school_member(),public.is_school_admin() to anon,authenticated;
commit;
