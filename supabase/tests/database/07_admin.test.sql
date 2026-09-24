begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'amina@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'admin@test.local');
update public.profiles set role = 'admin' where id = '22222222-2222-4222-8222-222222222222';

select is(
  (select email from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  'amina@test.local', 'a new profile carries the account email (so admins can find people)'
);

update auth.users set email = 'amina.b@test.local' where id = '11111111-1111-4111-8111-111111111111';
select is(
  (select email from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  'amina.b@test.local', 'the profile email follows changes to the account email'
);

-- Learner ---------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);

select throws_ok(
  $$ update public.profiles set email = 'spoof@test.local' where id = '11111111-1111-4111-8111-111111111111' $$,
  '42501', null, 'a learner cannot change the email shown to admins'
);
select is_empty(
  $$ select 1 from public.profiles where email = 'admin@test.local' $$,
  'a learner cannot see other people''s emails'
);
reset role;

-- Admin -----------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}', true);

select isnt_empty(
  $$ select 1 from public.profiles where email = 'amina.b@test.local' $$,
  'an admin can find a learner by email'
);
select lives_ok(
  $$ insert into public.speakers (display_name, consent_given, consent_date) values ('Yamina', true, current_date) $$,
  'an admin can record a speaker with consent'
);
select throws_ok(
  $$ insert into public.speakers (display_name, consent_given) values ('No date', true) $$,
  '23514', null, 'consent needs a date'
);
reset role;

select * from finish();
rollback;
