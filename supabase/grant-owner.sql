-- Run after profile-admin.sql. This grants ownership; it does not bypass email confirmation.
begin;
do $$ begin
  if not exists(select 1 from auth.users where lower(email)='qurmangali_n63@hbalm.nis.edu.kz') then raise exception 'The school account must be registered first.'; end if;
  if exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.is_owner and lower(u.email)<>'qurmangali_n63@hbalm.nis.edu.kz') then raise exception 'An owner already exists. Use the profile panel to transfer ownership.'; end if;
  update public.profiles set is_admin=true,is_owner=true where id=(select id from auth.users where lower(email)='qurmangali_n63@hbalm.nis.edu.kz');
end $$;
commit;
