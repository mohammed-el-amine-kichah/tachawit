begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'yamina@test.local'),
  ('33333333-3333-4333-8333-333333333333', 'other@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'admin@test.local');
update public.profiles set role = 'admin' where id = '22222222-2222-4222-8222-222222222222';

-- A member becomes a speaker ------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);

select throws_ok(
  $$ insert into public.speakers (id, display_name) values ('33333333-3333-4333-8333-333333333333', 'Not me') $$,
  '42501', null, 'a member cannot make someone else a speaker'
);
select lives_ok(
  $$ insert into public.speakers (id, display_name, consent_given, consent_date)
     values ('11111111-1111-4111-8111-111111111111', 'Yamina', true, '2000-01-01') $$,
  'a member becomes a speaker and gives consent'
);
select is(
  (select consent_date from public.speakers where id = '11111111-1111-4111-8111-111111111111'),
  current_date, 'the consent date is the day consent is given, whatever the client sends'
);
select lives_ok(
  $$ update public.speakers set village = 'Menaa' where id = '11111111-1111-4111-8111-111111111111' $$,
  'a speaker edits their own profile'
);
select is(
  (select consent_date from public.speakers where id = '11111111-1111-4111-8111-111111111111'),
  current_date, 'editing the profile keeps the consent date'
);
reset role;

-- The admin attaches and publishes audio ------------------------------------------
insert into public.audio_clips (speaker_id, storage_path, status) values
  ('11111111-1111-4111-8111-111111111111', 'test/yamina.m4a', 'published');

-- The speaker withdraws consent ---------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);
update public.speakers set consent_given = false where id = '11111111-1111-4111-8111-111111111111';
select isnt_empty(
  $$ select 1 from public.speakers where id = '11111111-1111-4111-8111-111111111111' and consent_date is null $$,
  'a speaker still sees their own profile after withdrawing consent'
);
reset role;

select is(
  (select status::text from public.audio_clips where storage_path = 'test/yamina.m4a'),
  'draft', 'withdrawing consent unpublishes the speaker''s audio'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}', true);
select is_empty(
  $$ select 1 from public.speakers where id = '11111111-1111-4111-8111-111111111111' $$,
  'other members do not see a speaker without consent'
);
reset role;

delete from auth.users where id = '11111111-1111-4111-8111-111111111111';
select is_empty(
  $$ select 1 from public.audio_clips where storage_path = 'test/yamina.m4a' $$,
  'deleting an account removes that person''s recordings'
);

select * from finish();
rollback;
