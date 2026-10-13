-- Fix the Supabase Auth varchar(255) email return type.
-- Keep existing privileges and administrator checks unchanged.
begin;
create or replace function public.admin_list_students(p_search text default '')
returns table(id uuid,name text,email text,is_admin boolean,is_owner boolean,confirmed boolean)
language plpgsql security definer set search_path='' as $$
begin
  if not public.is_school_admin() then raise exception 'admin_access_required'; end if;
  return query select p.id,p.name,u.email::text,p.is_admin,p.is_owner,u.email_confirmed_at is not null
    from public.profiles p join auth.users u on u.id=p.id
    where position(lower(left(coalesce(p_search,''),254)) in lower(p.name||' '||u.email))>0
    order by p.is_owner desc,p.is_admin desc,p.name,p.id limit 100;
end $$;

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
notify pgrst,'reload schema';
commit;
