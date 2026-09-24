begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'amina@test.local', '{"full_name": "Amina"}'),
  ('33333333-3333-4333-8333-333333333333', 'yacine@test.local', '{}'),
  ('22222222-2222-4222-8222-222222222222', 'admin@test.local', '{}');
update public.profiles set role = 'admin' where id = '22222222-2222-4222-8222-222222222222';

select results_eq(
  $$ select role::text, display_name from public.profiles where id = '11111111-1111-4111-8111-111111111111' $$,
  $$ values ('learner', 'Amina') $$,
  'signing up creates a learner profile named from the auth metadata'
);

-- Yacine already has some progress
insert into public.level_progress (user_id, level_id, stars, completed_at)
  select '33333333-3333-4333-8333-333333333333', id, 2, now() from public.levels order by position limit 1;
insert into public.learner_stats (user_id, xp) values ('33333333-3333-4333-8333-333333333333', 120);

-- Learner Amina ----------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);

select results_eq(
  $$ select id from public.profiles $$,
  $$ values ('11111111-1111-4111-8111-111111111111'::uuid) $$,
  'a learner can only read their own profile'
);
select lives_ok(
  $$ update public.profiles set display_name = 'Amina B.' where id = '11111111-1111-4111-8111-111111111111' $$,
  'a learner can rename themselves'
);
select throws_ok(
  $$ update public.profiles set role = 'admin' where id = '11111111-1111-4111-8111-111111111111' $$,
  '42501', null, 'a learner cannot make themselves admin'
);

select lives_ok(
  $$ insert into public.level_progress (user_id, level_id, stars, completed_at)
     select '11111111-1111-4111-8111-111111111111', id, 3, now() from public.levels order by position limit 1 $$,
  'a learner can record their own progress'
);
select throws_ok(
  $$ insert into public.level_progress (user_id, level_id, stars)
     select '33333333-3333-4333-8333-333333333333', id, 3 from public.levels order by position offset 1 limit 1 $$,
  '42501', null, 'a learner cannot write progress for someone else'
);
select throws_ok(
  $$ update public.level_progress set stars = 4 where user_id = '11111111-1111-4111-8111-111111111111' $$,
  '23514', null, 'stars are capped at 3'
);
select is_empty(
  $$ select 1 from public.level_progress where user_id <> '11111111-1111-4111-8111-111111111111' $$,
  'a learner cannot read anyone else''s progress'
);
select is_empty($$ select 1 from public.learner_stats $$, 'a learner cannot read anyone else''s stats');
select lives_ok(
  $$ insert into public.learner_stats (user_id, xp, current_streak, last_active_on)
     values ('11111111-1111-4111-8111-111111111111', 30, 1, current_date) $$,
  'a learner can create their own stats'
);
select lives_ok(
  $$ insert into public.srs_items (user_id, entry_id)
     select '11111111-1111-4111-8111-111111111111', id from public.entries limit 1 $$,
  'a learner can start reviewing an entry'
);
select throws_ok(
  $$ insert into public.srs_items (user_id, entry_id)
     select '33333333-3333-4333-8333-333333333333', id from public.entries limit 1 $$,
  '42501', null, 'a learner cannot write review data for someone else'
);
update public.learner_stats set xp = 99999 where user_id = '33333333-3333-4333-8333-333333333333';
reset role;
select is(
  (select xp from public.learner_stats where user_id = '33333333-3333-4333-8333-333333333333'),
  120, 'a learner cannot change someone else''s XP'
);

-- Admin ------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}', true);

select is((select count(*)::int from public.profiles), 3, 'an admin can read every profile');
select isnt_empty($$ select 1 from public.level_progress $$, 'an admin can read learner progress for stats');
select lives_ok(
  $$ update public.profiles set role = 'admin' where id = '33333333-3333-4333-8333-333333333333' $$,
  'an admin can promote another user'
);
reset role;

select * from finish();
rollback;
