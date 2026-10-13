-- Optional integration checks after schema.sql in a disposable test project.
-- This transaction rolls back all fixtures. SQL Editor must use the postgres role.
begin;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('11111111-1111-4111-8111-111111111111','first@hbalm.nis.edu.kz',now(),'{"name":"First Student"}'),
('22222222-2222-4222-8222-222222222222','second@hbalm.nis.edu.kz',now(),'{"name":"Second Student"}'),
('33333333-3333-4333-8333-333333333333','unverified@hbalm.nis.edu.kz',null,'{"name":"Unverified Student"}');
do $$ begin
  begin
    insert into auth.users(id,email,raw_user_meta_data) values(gen_random_uuid(),'outsider@gmail.com','{"name":"Outsider"}');
    raise exception 'FAIL: non-school email was accepted';
  exception when raise_exception then
    if sqlerrm not like 'Only @hbalm.nis.edu.kz%' then raise; end if;
  end;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
insert into public.clubs(name,description,category,meeting,owner_id) values
('Security Test Club','A club used to verify membership permissions.','Academic','Friday, room 204','11111111-1111-4111-8111-111111111111');
do $$ begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'FAIL: profile privacy'; end if;
  if (select member_count from public.clubs where name='Security Test Club') <> 1 then raise exception 'FAIL: founder count'; end if;
  begin
    update public.profiles set is_admin=true where id=auth.uid();
    raise exception 'FAIL: self-promotion accepted';
  exception when insufficient_privilege then null; end;
  begin
    update public.clubs set member_count=99 where name='Security Test Club';
    raise exception 'FAIL: count forgery accepted';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
insert into public.club_members(club_id,user_id) select id,auth.uid() from public.clubs where name='Security Test Club';
do $$ begin
  if (select member_count from public.clubs where name='Security Test Club') <> 2 then raise exception 'FAIL: join count'; end if;
  if (select count(*) from public.club_members) <> 1 then raise exception 'FAIL: membership privacy'; end if;
  begin
    insert into public.events(title,description,location,starts_at,published) values('Not authorized','An event ordinary students cannot publish.','Auditorium',now()+interval '1 day',true);
    raise exception 'FAIL: student published an event';
  exception when insufficient_privilege then null; end;
  delete from public.clubs where name='Security Test Club';
  if not exists(select 1 from public.clubs where name='Security Test Club') then raise exception 'FAIL: non-owner deleted club'; end if;
  update public.shanyraks set points=99 where id=1;
  if (select points from public.shanyraks where id=1) <> 0 then raise exception 'FAIL: ordinary student changed scores'; end if;
end $$;
delete from public.club_members where user_id=auth.uid();
do $$ begin
  if (select member_count from public.clubs where name='Security Test Club') <> 1 then raise exception 'FAIL: leave count'; end if;
end $$;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
do $$ begin
  begin
    insert into public.clubs(name,description,category,meeting,owner_id) values('Unverified Test Club','Unverified accounts must never create a club.','Academic','Friday, room 204',auth.uid());
    raise exception 'FAIL: unverified user created a club';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.profiles set is_admin=true where id='11111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
insert into public.events(title,description,location,starts_at,published)
values('Authorized event','An event correctly published by a school administrator.','Auditorium',now()+interval '1 day',true);
update public.shanyraks set points=10 where id=1;
do $$ begin
  if not exists(select 1 from public.events where title='Authorized event') then raise exception 'FAIL: administrator cannot publish'; end if;
  if (select points from public.shanyraks where id=1) <> 10 then raise exception 'FAIL: administrator cannot update points'; end if;
end $$;
reset role;
rollback;
-- A successful run ends with ROLLBACK and no errors.
