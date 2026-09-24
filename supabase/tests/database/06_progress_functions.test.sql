begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

-- Streak rules (mirrors src/lib/progress/streak.ts) -------------------------------
select results_eq($$ select * from public.next_streak(0, 0, null, '2026-09-24') $$,
  $$ values (1, 1, '2026-09-24'::date) $$, 'a first active day starts the streak at 1');
select results_eq($$ select * from public.next_streak(5, 5, '2026-09-23', '2026-09-24') $$,
  $$ values (6, 6, '2026-09-24'::date) $$, 'the next day grows the streak');
select results_eq($$ select * from public.next_streak(3, 7, '2026-09-24', '2026-09-24') $$,
  $$ values (3, 7, '2026-09-24'::date) $$, 'the same day changes nothing');
select results_eq($$ select * from public.next_streak(9, 12, '2026-09-20', '2026-09-24') $$,
  $$ values (1, 12, '2026-09-24'::date) $$, 'a missed day restarts at 1 and keeps the longest');
select results_eq($$ select * from public.next_streak(2, 2, '2026-09-24', '2026-09-22') $$,
  $$ values (2, 2, '2026-09-24'::date) $$, 'an earlier date is ignored');

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'amina@test.local'),
  ('33333333-3333-4333-8333-333333333333', 'yacine@test.local');

-- Guests cannot write progress to the database --------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select throws_ok(
  $$ select public.complete_level('80000000-0000-4000-8000-000000000001', 3, 10, '{}', current_date) $$,
  '42501', null, 'guests keep progress locally, not in the database'
);
reset role;

-- Learner -----------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);

select lives_ok(
  $$ select public.complete_level('80000000-0000-4000-8000-000000000001', 2, 10,
       array['30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002']::uuid[], current_date) $$,
  'a learner completes a level'
);
select results_eq(
  $$ select stars, attempts, completed_at is not null from public.level_progress
     where level_id = '80000000-0000-4000-8000-000000000001' $$,
  $$ values (2::smallint, 1, true) $$, 'the completion is recorded'
);
select results_eq(
  $$ select xp, current_streak, last_active_on from public.learner_stats $$,
  $$ values (10, 1, current_date) $$, 'XP and the streak start'
);
select is(
  (select count(*)::int from public.srs_items where due_at > now()), 2,
  'the level''s words are scheduled for review tomorrow'
);

select lives_ok(
  $$ select public.complete_level('80000000-0000-4000-8000-000000000001', 1, 500,
       array['30000000-0000-4000-8000-000000000001']::uuid[], current_date) $$,
  'a learner replays a level'
);
select results_eq(
  $$ select stars, attempts from public.level_progress where level_id = '80000000-0000-4000-8000-000000000001' $$,
  $$ values (2::smallint, 2) $$, 'replays keep the best stars and count attempts'
);
select results_eq(
  $$ select xp, current_streak from public.learner_stats $$,
  $$ values (110, 1) $$, 'XP per activity is capped at 100 and the same day keeps the streak'
);
select is((select count(*)::int from public.srs_items), 2, 'replaying does not duplicate review items');

select throws_ok(
  $$ select public.complete_level('80000000-0000-4000-8000-000000000001', 3, 10, '{}', current_date + 5) $$,
  '22023', null, 'a date far from today is rejected'
);
select throws_ok(
  $$ select public.complete_level('90000000-0000-4000-8000-000000000000', 3, 10, '{}', current_date) $$,
  'P0002', null, 'an unknown or unpublished level is rejected'
);

select lives_ok($$ select public.log_activity(6, current_date) $$, 'a review session logs XP');
select is((select xp from public.learner_stats), 116, 'review XP is added');

-- Merging a guest's local progress into the account ------------------------------------
select lives_ok(
  $$ select public.merge_guest_progress('{
       "version": 1,
       "levels": {
         "80000000-0000-4000-8000-000000000001": {"stars": 3, "attempts": 2, "completedAt": "2026-09-01T10:00:00Z"},
         "80000000-0000-4000-8000-000000000002": {"stars": 1, "attempts": 1, "completedAt": "2026-09-02T10:00:00Z"},
         "not-a-level": {"stars": 3, "attempts": 1, "completedAt": "2026-09-02T10:00:00Z"}
       },
       "xp": 40,
       "streak": {"current": 3, "longest": 5, "lastActiveOn": null},
       "srs": {
         "30000000-0000-4000-8000-000000000007": {"ease": 2.5, "intervalDays": 6, "repetitions": 2, "lapses": 0,
            "dueAt": "2026-10-01T10:00:00Z", "lastReviewedAt": "2026-09-25T10:00:00Z"}
       }
     }'::jsonb, current_date) $$,
  'a guest''s progress merges into their new account'
);
select results_eq(
  $$ select level_id::text, stars, attempts from public.level_progress order by level_id $$,
  $$ values ('80000000-0000-4000-8000-000000000001', 3::smallint, 4), ('80000000-0000-4000-8000-000000000002', 1::smallint, 1) $$,
  'merged levels keep the best stars, add attempts, and ignore unknown levels'
);
select results_eq(
  $$ select xp, longest_streak from public.learner_stats $$,
  $$ values (156, 5) $$, 'guest XP is added and the longest streak kept'
);
select is((select count(*)::int from public.srs_items), 3, 'guest review items are merged');
reset role;

-- Nobody can write someone else's progress through these functions -------------------
select is(
  (select count(*)::int from public.level_progress where user_id = '33333333-3333-4333-8333-333333333333'), 0,
  'another learner is untouched'
);

select * from finish();
rollback;
