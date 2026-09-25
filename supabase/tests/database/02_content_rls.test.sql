begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

-- Fixtures (as the postgres superuser)
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'learner@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'admin@test.local'),
  ('cccccccc-0000-4000-8000-000000000001', 'speaker@test.local');
update public.profiles set role = 'admin' where id = '22222222-2222-4222-8222-222222222222';

insert into public.units (id, slug, position, title, status) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'draft-unit', 900, '{"en": "Draft unit"}', 'draft');
insert into public.levels (unit_id, position, type, status) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 0, 'review', 'published');
insert into public.entries (id, text_latin, translations, status) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'draft-word', '{"en": "draft"}', 'draft');
insert into public.lessons (id, title, status) values
  ('dddddddd-0000-4000-8000-000000000001', '{"en": "Draft lesson"}', 'draft');
insert into public.speakers (id, display_name, consent_given) values
  ('cccccccc-0000-4000-8000-000000000001', 'No consent yet', false);
insert into public.audio_clips (speaker_id, storage_path, status) values
  ('cccccccc-0000-4000-8000-000000000001', 'test/no-consent.m4a', 'draft');

-- Anonymous visitor ---------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select is_empty($$ select 1 from public.units where status <> 'published' $$, 'anon sees no draft units');
select isnt_empty($$ select 1 from public.units $$, 'anon sees published units');
select is_empty(
  $$ select 1 from public.levels where unit_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  'anon cannot see levels of a draft unit, even published ones'
);
select is_empty($$ select 1 from public.entries where status <> 'published' $$, 'anon sees no draft entries');
select is_empty($$ select 1 from public.speakers where not consent_given $$, 'anon sees no speaker without consent');
select is_empty($$ select 1 from public.audio_clips where status <> 'published' $$, 'anon sees no draft audio');
select throws_ok(
  $$ insert into public.entries (text_latin, translations) values ('x', '{"en": "x"}') $$,
  '42501', null, 'anon cannot create entries'
);
update public.units set slug = 'hacked' where slug = 'first-words';
reset role;
select is((select count(*)::int from public.units where slug = 'hacked'), 0, 'anon cannot update units');

-- Learner --------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);

select is_empty($$ select 1 from public.entries where status <> 'published' $$, 'learner sees no draft entries');
select is_empty($$ select 1 from public.lessons where status <> 'published' $$, 'learner sees no draft lessons');
select throws_ok(
  $$ insert into public.lessons (title) values ('{"en": "Mine"}') $$,
  '42501', null, 'learner cannot create lessons'
);
delete from public.entries;
reset role;
select isnt_empty($$ select 1 from public.entries $$, 'learner cannot delete entries');

-- Admin ----------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}', true);

select isnt_empty($$ select 1 from public.entries where status = 'draft' $$, 'admin sees draft entries');
select isnt_empty($$ select 1 from public.speakers where not consent_given $$, 'admin sees every speaker');
select lives_ok(
  $$ insert into public.entries (text_latin, translations) values ('new-word', '{"en": "new"}') $$,
  'admin can create entries'
);

-- Consent rules (enforced by triggers, whoever the caller is) ----------------
-- Consent is given and withdrawn by the speakers themselves; publishing is the admin's.
select throws_ok(
  $$ update public.audio_clips set status = 'published' where storage_path = 'test/no-consent.m4a' $$,
  '23514', null, 'audio cannot be published for a speaker without consent'
);
select set_config('request.jwt.claims', '{"sub": "cccccccc-0000-4000-8000-000000000001", "role": "authenticated"}', true);
update public.speakers set consent_given = true where id = 'cccccccc-0000-4000-8000-000000000001';
select set_config('request.jwt.claims', '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}', true);
select lives_ok(
  $$ update public.audio_clips set status = 'published' where storage_path = 'test/no-consent.m4a' $$,
  'audio can be published once consent is recorded'
);
select set_config('request.jwt.claims', '{"sub": "cccccccc-0000-4000-8000-000000000001", "role": "authenticated"}', true);
update public.speakers set consent_given = false where id = 'cccccccc-0000-4000-8000-000000000001';
select set_config('request.jwt.claims', '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}', true);
select is(
  (select status::text from public.audio_clips where storage_path = 'test/no-consent.m4a'),
  'draft', 'revoking consent unpublishes the speaker''s audio'
);

-- Publish guards: learners never see a published item pointing at a draft ---
select throws_ok(
  $$ insert into public.lessons (title, steps, status) values
     ('{"en": "Broken"}', '[{"id": "s1", "type": "introduce", "entryId": "bbbbbbbb-0000-4000-8000-000000000001"}]', 'published') $$,
  '23514', null, 'a lesson cannot be published while it uses a draft entry'
);
select throws_ok(
  $$ update public.entries set status = 'draft'
     where id = (select (steps -> 0 ->> 'entryId')::uuid from public.lessons where status = 'published' limit 1) $$,
  '23514', null, 'an entry used by a published lesson cannot be unpublished'
);
select throws_ok(
  $$ insert into public.levels (unit_id, position, type, lesson_id, status)
     select 'aaaaaaaa-0000-4000-8000-000000000001', 1, 'lesson', id, 'published'
     from public.lessons where status = 'draft' limit 1 $$,
  '23514', null, 'a level cannot be published while its lesson is a draft'
);
reset role;

select * from finish();
rollback;
