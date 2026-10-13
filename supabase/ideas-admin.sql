-- Add private ideas and administrator account deletion to the existing database.
begin;
create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  title text not null check(char_length(trim(title)) between 3 and 100),
  body text not null check(char_length(trim(body)) between 10 and 2000),
  status text not null default 'new' check(status in ('new','reviewing','done')),
  created_at timestamptz not null default now()
);
create index if not exists ideas_author_date on public.ideas(user_id,created_at desc);
alter table public.ideas enable row level security;
revoke all on public.ideas from public,anon,authenticated;
grant select on public.ideas to authenticated;
drop policy if exists private_ideas on public.ideas;
create policy private_ideas on public.ideas for select to authenticated
using(public.is_school_member() and (user_id=auth.uid() or public.is_school_admin()));

create or replace function public.submit_idea(p_title text,p_body text) returns uuid
language plpgsql security definer set search_path='' as $$
declare idea_id uuid;
begin
  if not public.is_school_member() then raise exception 'verified_account_required'; end if;
  if p_title is null or char_length(trim(p_title)) not between 3 and 100
    or p_body is null or char_length(trim(p_body)) not between 10 and 2000 then raise exception 'invalid_idea'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,62302702));
  if (select count(*) from public.ideas where user_id=auth.uid() and created_at>now()-interval '24 hours')>=5
    then raise exception 'idea_limit'; end if;
  insert into public.ideas(user_id,title,body) values(auth.uid(),trim(p_title),trim(p_body)) returning id into idea_id;
  return idea_id;
end $$;

create or replace function public.admin_list_ideas()
returns table(id uuid,title text,body text,status text,created_at timestamptz,author_name text)
language plpgsql security definer set search_path='' as $$
begin
  if not public.is_school_admin() then raise exception 'admin_access_required'; end if;
  return query select i.id,i.title,i.body,i.status,i.created_at,p.name from public.ideas i
    left join public.profiles p on p.id=i.user_id order by i.created_at desc,i.id limit 200;
end $$;
create or replace function public.admin_set_idea_status(p_id uuid,p_status text) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not public.is_school_admin() then raise exception 'admin_access_required'; end if;
  if p_status is null or p_status not in ('new','reviewing','done') then raise exception 'invalid_idea_status'; end if;
  update public.ideas set status=p_status where id=p_id;
  if not found then raise exception 'idea_not_found'; end if;
end $$;

create or replace function public.admin_delete_user(p_id uuid,p_confirmation text) returns void
language plpgsql security definer set search_path='' as $$
declare target record;
begin
  perform pg_advisory_xact_lock(62302701);
  if not public.is_school_admin() then raise exception 'admin_access_required'; end if;
  if p_id=auth.uid() then raise exception 'use_profile_delete'; end if;
  select p.is_owner,p.is_admin,u.email into target from public.profiles p join auth.users u on u.id=p.id where p.id=p_id for update of p;
  if not found then raise exception 'user_not_found'; end if;
  if target.is_owner then raise exception 'owner_protected'; end if;
  if p_confirmation is null or lower(trim(p_confirmation))<>lower(target.email) then raise exception 'confirmation_required'; end if;
  if target.is_admin and not exists(select 1 from public.profiles p join auth.users u on u.id=p.id
    where p.id<>p_id and p.is_admin and u.email_confirmed_at is not null) then raise exception 'last_admin'; end if;
  delete from auth.users where id=p_id;
end $$;
revoke all on function public.submit_idea(text,text),public.admin_list_ideas(),public.admin_set_idea_status(uuid,text),public.admin_delete_user(uuid,text) from public,anon,authenticated;
grant execute on function public.submit_idea(text,text),public.admin_list_ideas(),public.admin_set_idea_status(uuid,text),public.admin_delete_user(uuid,text) to authenticated;
notify pgrst,'reload schema';
commit;
