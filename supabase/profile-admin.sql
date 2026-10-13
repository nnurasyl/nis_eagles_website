-- NIS Eagles: additive migration for an existing school database.
-- Apply once in the Supabase SQL Editor. Safe to run again.
begin;
alter table public.profiles add column if not exists is_owner boolean not null default false;
create unique index if not exists one_school_owner on public.profiles(is_owner) where is_owner;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='owner_requires_admin' and conrelid='public.profiles'::regclass) then
    alter table public.profiles add constraint owner_requires_admin check(not is_owner or is_admin);
  end if;
end $$;

create or replace function public.set_my_name(p_name text) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not public.is_school_member() then raise exception 'school_access_required'; end if;
  if p_name is null or char_length(trim(p_name)) not between 2 and 60 then raise exception 'invalid_name'; end if;
  update public.profiles set name=trim(p_name) where id=auth.uid();
  update auth.users set raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb)||jsonb_build_object('name',trim(p_name)) where id=auth.uid();
end $$;

create or replace function public.delete_my_account(p_confirmation text) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(62302701);
  if not public.is_school_member() then raise exception 'school_access_required'; end if;
  if not exists(select 1 from auth.users where id=auth.uid() and lower(email)=lower(trim(p_confirmation))) then raise exception 'confirmation_required'; end if;
  if exists(select 1 from public.profiles where id=auth.uid() and is_owner) then raise exception 'transfer_owner_first'; end if;
  if exists(select 1 from public.profiles where id=auth.uid() and is_admin)
    and not exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id<>auth.uid() and p.is_admin and u.email_confirmed_at is not null)
    then raise exception 'last_admin'; end if;
  delete from auth.users where id=auth.uid();
end $$;

create or replace function public.admin_list_students(p_search text default '')
returns table(id uuid,name text,email text,is_admin boolean,is_owner boolean,confirmed boolean)
language plpgsql security definer set search_path='' as $$
begin
  if not public.is_school_admin() then raise exception 'admin_access_required'; end if;
  return query select p.id,p.name,u.email,p.is_admin,p.is_owner,u.email_confirmed_at is not null
    from public.profiles p join auth.users u on u.id=p.id
    where position(lower(left(coalesce(p_search,''),254)) in lower(p.name||' '||u.email))>0
    order by p.is_owner desc,p.is_admin desc,p.name,p.id limit 100;
end $$;

create or replace function public.admin_set_role(p_id uuid,p_admin boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(62302701);
  if not public.is_school_admin() then raise exception 'admin_access_required'; end if;
  if p_admin is null then raise exception 'invalid_role'; end if;
  if p_id=auth.uid() then raise exception 'cannot_change_own_role'; end if;
  if exists(select 1 from public.profiles where id=p_id and is_owner) then raise exception 'owner_protected'; end if;
  if not exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=p_id and u.email_confirmed_at is not null) then raise exception 'verified_account_required'; end if;
  update public.profiles set is_admin=p_admin where id=p_id;
end $$;

create or replace function public.transfer_school_owner(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(62302701);
  if not public.is_school_admin() or not exists(select 1 from public.profiles where id=auth.uid() and is_owner) then raise exception 'owner_access_required'; end if;
  if p_id=auth.uid() or not exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=p_id and p.is_admin and u.email_confirmed_at is not null) then raise exception 'verified_admin_required'; end if;
  update public.profiles set is_owner=false where id=auth.uid();
  update public.profiles set is_owner=true where id=p_id;
end $$;

revoke all on function public.set_my_name(text),public.delete_my_account(text),public.admin_list_students(text),public.admin_set_role(uuid,boolean),public.transfer_school_owner(uuid) from public,anon,authenticated;
grant execute on function public.set_my_name(text),public.delete_my_account(text),public.admin_list_students(text),public.admin_set_role(uuid,boolean),public.transfer_school_owner(uuid) to authenticated;

create temporary table eagles_migration_state(needs_leaders boolean) on commit drop;
insert into eagles_migration_state select not exists(select 1 from information_schema.columns where table_schema='public' and table_name='shanyraks' and column_name='leader_name');
alter table public.shanyraks add column if not exists leader_name text;
alter table public.shanyraks add column if not exists active boolean not null default true;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='shanyrak_name_length' and conrelid='public.shanyraks'::regclass) then
    alter table public.shanyraks add constraint shanyrak_name_length check(char_length(trim(name)) between 2 and 60);
    alter table public.shanyraks add constraint shanyrak_leader_length check(leader_name is null or char_length(trim(leader_name)) between 2 and 100);
  end if;
end $$;
create sequence if not exists public.shanyraks_id_seq;
alter sequence public.shanyraks_id_seq owned by public.shanyraks.id;
alter table public.shanyraks alter column id set default nextval('public.shanyraks_id_seq');
select setval('public.shanyraks_id_seq',greatest(coalesce((select max(id) from public.shanyraks),0),1));
update public.shanyraks set active=false where name='Алатау';
drop policy if exists public_shanyraks on public.shanyraks;
create policy public_shanyraks on public.shanyraks for select to anon,authenticated using(active or public.is_school_admin());
drop policy if exists admin_create_shanyrak on public.shanyraks;
create policy admin_create_shanyrak on public.shanyraks for insert to authenticated with check(public.is_school_admin());
grant insert(name,points,leader_name,active),update(name,points,leader_name,active) on public.shanyraks to authenticated;
grant usage on sequence public.shanyraks_id_seq to authenticated;
drop policy if exists owner_edit_club on public.clubs;
create policy owner_edit_club on public.clubs for update to authenticated
using((public.is_school_member() and owner_id=auth.uid()) or public.is_school_admin())
with check((public.is_school_member() and owner_id=auth.uid()) or public.is_school_admin());

create table if not exists public.government_members(id text primary key,name text check(name is null or char_length(trim(name)) between 2 and 100));
alter table public.government_members enable row level security;
revoke all on public.government_members from anon,authenticated;
grant select on public.government_members to anon,authenticated;
grant update(name) on public.government_members to authenticated;
drop policy if exists public_government on public.government_members;
create policy public_government on public.government_members for select to anon,authenticated using(true);
drop policy if exists admin_edit_government on public.government_members;
create policy admin_edit_government on public.government_members for update to authenticated using(public.is_school_admin()) with check(public.is_school_admin());
-- Initial leader/team values are appended below; existing edited values are preserved.

update public.shanyraks s set leader_name=v.leader from (values
('Алаш','Назаркина Алима Станиславовна'),
('Алматы','Бекетаева Альнура'),
('Алтын емел','Сыдық Әбубәкір'),
('Атамекен','Қуатұлы Дәулет'),
('Болашақ','Сламхан Арайлым'),
('Есентай','Рахимжанова Аиша'),
('Жалын','Жүніс Ғабиден'),
('Жас Қанат','Дулатұлы Дияр'),
('Жетіген','Мейрамқызы Айсана'),
('Алмалы','Өмірбек Инеш'),
('Көктөбе','Калдарбек Амина'),
('Медеу','Пугач Матвей Александрович'),
('Сарыарқа','Зейнелхан Эниша'),
('Сұңқар','Нұрмұханбет Ерзат Ерғанатұлы'),
('Тұлпар','Давлятов Дамир Салаватович'),
('Тұран','Құмархан Арын'),
('Үшқоңыр','Сәтбек Алуа'),
('Хан тәңірі','Жұман Фариза'),
('Шымбұлақ','Пархат Нұрбибі')) v(name,leader) where s.name=v.name and (select needs_leaders from eagles_migration_state);
insert into public.government_members(id,name) values
('president','Тоқтанәлі Айша'),
('vice','Айдынұлы Болат'),
('speaker','Разах Аружан'),
('secretary','Спандияр Арайлым'),
('it','Құрманғали Нұрасыл'),
('external','Сейтбек Ақбаян'),
('media','Берекетова Анель'),
('culture','Әбдіқаш Кәусар'),
('education','Асылхан Айсұлу'),
('internal','Бекбай Айзере'),
('sport','Капиз Даниал'),
('ecology','Сәрсенбек Камилла'),
('finance','Әбдіқайым Гүлжауһар') on conflict(id) do nothing;
commit;
