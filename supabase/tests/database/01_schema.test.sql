begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

-- Every concept from the spec has a table
select has_table('public', t, format('table public.%s exists', t))
from unnest(array[
  'profiles', 'regions', 'units', 'levels', 'entries', 'speakers', 'audio_clips',
  'lessons', 'quizzes', 'culture_notes', 'level_progress', 'learner_stats',
  'srs_items', 'submissions'
]) as t;

select is_empty(
  $$ select tablename from pg_tables where schemaname = 'public' and not rowsecurity $$,
  'row level security is enabled on every public table'
);

select enum_has_labels('public', 'content_status', array['draft', 'published'], 'content_status enum');
select enum_has_labels('public', 'level_type', array['lesson', 'quiz', 'review', 'boss', 'story'], 'level_type enum');
select enum_has_labels('public', 'app_role', array['learner', 'admin'], 'app_role enum');

select results_eq(
  $$ select id, public from storage.buckets
     where id in ('audio', 'audio-originals', 'images', 'submissions') order by id $$,
  $$ values ('audio', true), ('audio-originals', false), ('images', true), ('submissions', false) $$,
  'storage buckets exist; only learner-facing media is public'
);

-- Multilingual text validation used by check constraints
select ok(public.is_localized_text('{"en": "Water", "dz": "الما"}'), 'localized text accepts known locales');
select ok(not public.is_localized_text('{}'), 'localized text needs at least one translation');
select ok(not public.is_localized_text('{"en": "  "}'), 'localized text rejects blank-only values');
select ok(not public.is_localized_text('{"es": "Agua"}'), 'localized text rejects unknown locales');
select ok(not public.is_localized_text('"Water"'), 'localized text must be an object');

select throws_ok(
  $$ insert into public.units (slug, position, title) values ('bad-title', 999, '{"xx": "?"}') $$,
  '23514', null, 'units reject malformed titles'
);

select throws_ok(
  $$ insert into public.levels (unit_id, position, type, map_x, map_y)
     select id, 999, 'review', 1.5, 0.5 from public.units limit 1 $$,
  '23514', null, 'levels reject map positions outside 0..1'
);

select throws_ok(
  $$ insert into public.levels (unit_id, position, type, status)
     select id, 998, 'lesson', 'published' from public.units limit 1 $$,
  '23514', null, 'a published lesson level must point to a lesson'
);

select * from finish();
rollback;
