begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'learner@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'admin@test.local');
update public.profiles set role = 'admin' where id = '22222222-2222-4222-8222-222222222222';

-- Learner ------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);
select throws_ok(
  $$ select public.reorder_levels('70000000-0000-4000-8000-000000000001',
       array['80000000-0000-4000-8000-000000000004', '80000000-0000-4000-8000-000000000001',
             '80000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000003']::uuid[]) $$,
  '42501', null, 'learners cannot reorder the map'
);
reset role;

-- Admin --------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}', true);
select lives_ok(
  $$ select public.reorder_levels('70000000-0000-4000-8000-000000000001',
       array['80000000-0000-4000-8000-000000000004', '80000000-0000-4000-8000-000000000001',
             '80000000-0000-4000-8000-000000000002', '80000000-0000-4000-8000-000000000003']::uuid[]) $$,
  'an admin reorders levels even though positions are unique per unit'
);
select results_eq(
  $$ select id::text from public.levels where unit_id = '70000000-0000-4000-8000-000000000001' order by position $$,
  $$ values ('80000000-0000-4000-8000-000000000004'), ('80000000-0000-4000-8000-000000000001'),
            ('80000000-0000-4000-8000-000000000002'), ('80000000-0000-4000-8000-000000000003') $$,
  'levels follow the new order'
);
select throws_ok(
  $$ select public.reorder_levels('70000000-0000-4000-8000-000000000001',
       array['80000000-0000-4000-8000-000000000001']::uuid[]) $$,
  '22023', null, 'the new order must list every level of the unit exactly once'
);

insert into public.units (id, slug, position, title) values ('70000000-0000-4000-8000-000000000002', 'second', 1, '{"en": "Second"}');
select lives_ok(
  $$ select public.reorder_units(array['70000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000001']::uuid[]) $$,
  'an admin reorders units'
);
select results_eq(
  $$ select slug from public.units order by position $$,
  $$ values ('second'), ('first-words') $$,
  'units follow the new order'
);
reset role;

select * from finish();
rollback;
