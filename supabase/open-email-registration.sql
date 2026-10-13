-- Existing NIS Eagles database: allow valid personal and school emails.
-- Contact numbers are private, unverified profile data. No SMS provider is used.
begin;
alter table public.profiles add column if not exists contact_phone text;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='profile_contact_phone_format' and conrelid='public.profiles'::regclass) then
    alter table public.profiles add constraint profile_contact_phone_format
      check(contact_phone is null or contact_phone ~ '^\+[1-9][0-9]{7,14}$');
  end if;
end $$;

create or replace function public.is_valid_account_email(p_email text) returns boolean
language sql immutable set search_path='' as $$
  select coalesce(p_email is not null and char_length(p_email)<=254
    and char_length(split_part(p_email,'@',1)) between 1 and 64
    and split_part(p_email,'@',1) not like '.%'
    and split_part(p_email,'@',1) not like '%.'
    and split_part(p_email,'@',1) not like '%..%'
    and lower(p_email) ~ '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
    and lower(p_email) ~ '\.([a-z]{2,63}|xn--[a-z0-9-]{1,59})$',false);
$$;
create or replace function public.enforce_account_email() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if not public.is_valid_account_email(new.email) then raise exception 'A valid email address is required.'; end if;
  return new;
end $$;
drop trigger if exists school_email_only on auth.users;
drop trigger if exists account_email_only on auth.users;
create trigger account_email_only before insert or update of email on auth.users
for each row execute function public.enforce_account_email();

-- Preserve the existing helper name used by policies and account-management RPCs.
-- Membership still requires a real Auth user and confirmed email; domain is unrestricted.
create or replace function public.is_school_member() returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from auth.users u where u.id=auth.uid()
    and u.email_confirmed_at is not null and public.is_valid_account_email(u.email));
$$;
create or replace function public.create_student_profile() returns trigger
language plpgsql security definer set search_path='' as $$
declare contact text;
begin
  contact:=nullif(trim(new.raw_user_meta_data->>'contact_phone'),'');
  if contact is not null and contact !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'invalid_contact_phone'; end if;
  -- Null preserves compatibility with existing accounts and older clients during rollout.
  -- Browser registration requires a number; it is never used as proof of identity.
  insert into public.profiles(id,name,contact_phone)
  values(new.id,trim(coalesce(new.raw_user_meta_data->>'name','Student')),contact);
  return new;
end $$;
create or replace function public.set_my_contact_phone(p_phone text) returns void
language plpgsql security definer set search_path='' as $$
declare contact text;
begin
  if not public.is_school_member() then raise exception 'verified_account_required'; end if;
  contact:=nullif(trim(p_phone),'');
  if contact is not null and contact !~ '^\+[1-9][0-9]{7,14}$' then raise exception 'invalid_contact_phone'; end if;
  update public.profiles set contact_phone=contact where id=auth.uid();
  update auth.users set raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb)||jsonb_build_object('contact_phone',contact) where id=auth.uid();
end $$;

-- Keep the older directory RPC compatible with existing deployments.
create or replace function public.admin_list_contacts(p_search text default '')
returns table(id uuid,name text,email text,is_admin boolean,is_owner boolean,confirmed boolean,contact_phone text)
language plpgsql security definer set search_path='' as $$
begin
  if not public.is_school_admin() then raise exception 'admin_access_required'; end if;
  return query select p.id,p.name,u.email::text,p.is_admin,p.is_owner,u.email_confirmed_at is not null,p.contact_phone
    from public.profiles p join auth.users u on u.id=p.id
    where position(lower(left(coalesce(p_search,''),254)) in lower(p.name||' '||u.email))>0
    order by p.is_owner desc,p.is_admin desc,p.name,p.id limit 100;
end $$;

revoke all on function public.is_valid_account_email(text),public.enforce_account_email(),public.create_student_profile() from public,anon,authenticated;
revoke all on function public.set_my_contact_phone(text),public.admin_list_contacts(text) from public,anon,authenticated;
grant execute on function public.set_my_contact_phone(text),public.admin_list_contacts(text) to authenticated;
-- Existing column grants do not give clients direct access to edit roles or contact fields.
notify pgrst,'reload schema';
commit;
