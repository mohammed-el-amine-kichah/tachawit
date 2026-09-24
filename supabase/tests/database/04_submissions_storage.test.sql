begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'amina@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'admin@test.local');
update public.profiles set role = 'admin' where id = '22222222-2222-4222-8222-222222222222';

-- Guest ------------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select lives_ok(
  $$ insert into public.submissions (kind, text_latin, translations, contributor_name)
     values ('word', 'tasekkurt', '{"en": "partridge"}', 'Guest') $$,
  'a guest can suggest a word'
);
select throws_ok(
  $$ insert into public.submissions (kind, text_latin, status) values ('word', 'x', 'approved') $$,
  '42501', null, 'a guest cannot self-approve a submission'
);
select throws_ok(
  $$ insert into public.submissions (kind, audio_path, audio_consent) values ('recording', 'pending/a.webm', false) $$,
  '23514', null, 'a recording needs the contributor''s consent'
);
select is_empty($$ select 1 from public.submissions $$, 'a guest cannot read submissions');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('audio', 'hack.m4a') $$,
  '42501', null, 'a guest cannot upload learner audio'
);
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('submissions', 'pending/guest.webm') $$,
  'a guest can upload a recording for review'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('submissions', 'approved/guest.webm') $$,
  '42501', null, 'guest recordings can only go to the pending folder'
);
reset role;

-- Learner ----------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);

select lives_ok(
  $$ insert into public.submissions (kind, message, submitter_id)
     values ('correction', 'Typo in lesson 1', '11111111-1111-4111-8111-111111111111') $$,
  'a learner can send a correction'
);
select results_eq(
  $$ select message from public.submissions $$,
  $$ values ('Typo in lesson 1') $$,
  'a learner sees only their own submissions'
);
select throws_ok(
  $$ insert into public.submissions (kind, message, submitter_id)
     values ('correction', 'Pretending', '22222222-2222-4222-8222-222222222222') $$,
  '42501', null, 'a learner cannot submit in someone else''s name'
);
reset role;

-- Admin ------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}', true);

select is((select count(*)::int from public.submissions), 2, 'an admin sees every submission');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('audio', 'admin/clip.m4a') $$,
  'an admin can upload learner audio'
);
reset role;

select * from finish();
rollback;
