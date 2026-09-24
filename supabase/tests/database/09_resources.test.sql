begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

-- Fixtures (as the postgres superuser)
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'learner@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'admin@test.local');
update public.profiles set role = 'admin' where id = '22222222-2222-4222-8222-222222222222';

insert into public.resources (id, platform, name, url, summary, status) values
  ('eeeeeeee-0000-4000-8000-000000000001', 'youtube', 'Published channel', 'https://www.youtube.com/@example', '{"en": "Songs"}', 'published'),
  ('eeeeeeee-0000-4000-8000-000000000002', 'tiktok', 'Draft account', 'https://www.tiktok.com/@example', '{"en": "Clips"}', 'draft');

select isnt(
  (select published_at from public.resources where id = 'eeeeeeee-0000-4000-8000-000000000001'),
  null, 'publishing a resource stamps published_at'
);
select throws_ok(
  $$ insert into public.resources (platform, name, url, summary) values ('youtube', 'x', 'javascript:alert(1)', '{"en": "x"}') $$,
  '23514', null, 'a resource link must be https'
);
select throws_ok(
  $$ insert into public.resources (platform, name, url, summary) values ('youtube', '  ', 'https://youtu.be/x', '{"en": "x"}') $$,
  '23514', null, 'a resource needs a name'
);

-- Anonymous visitor ---------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select results_eq(
  $$ select name from public.resources $$, array['Published channel'], 'anon sees only published resources'
);
select throws_ok(
  $$ insert into public.resources (platform, name, url, summary) values ('youtube', 'x', 'https://youtu.be/x', '{"en": "x"}') $$,
  '42501', null, 'anon cannot add resources'
);
reset role;

-- Learner --------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);

select results_eq(
  $$ select name from public.resources $$, array['Published channel'], 'learner sees only published resources'
);
select throws_ok(
  $$ insert into public.resources (platform, name, url, summary) values ('youtube', 'x', 'https://youtu.be/x', '{"en": "x"}') $$,
  '42501', null, 'learner cannot add resources'
);
update public.resources set name = 'hacked';
delete from public.resources;
reset role;
select is((select count(*)::int from public.resources where name = 'hacked'), 0, 'learner cannot edit resources');
select is((select count(*)::int from public.resources where id::text like 'eeeeeeee-%'), 2, 'learner cannot delete resources');

-- Admin ----------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}', true);

select is((select count(*)::int from public.resources where id::text like 'eeeeeeee-%'), 2, 'admin sees drafts too');
update public.resources set status = 'published' where id = 'eeeeeeee-0000-4000-8000-000000000002';
select is(
  (select status::text from public.resources where id = 'eeeeeeee-0000-4000-8000-000000000002'),
  'published', 'admin can publish a resource'
);
reset role;

select * from finish();
rollback;
