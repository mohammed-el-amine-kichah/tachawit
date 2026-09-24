begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

select results_eq(
  $$ select title ->> 'en', status::text from public.units where slug = 'first-words' $$,
  $$ values ('First Words & Greetings', 'published') $$,
  'the sample unit is seeded and published'
);

select results_eq(
  $$ select l.type::text, count(*)::int from public.levels l
     join public.units u on u.id = l.unit_id
     where u.slug = 'first-words' and l.status = 'published'
     group by l.type order by l.type $$,
  $$ values ('lesson', 3), ('quiz', 1) $$,
  'the sample unit has three lesson levels and one quiz level'
);

select is_empty(
  $$ select 1 from public.levels l
     left join public.lessons le on le.id = l.lesson_id
     left join public.quizzes q on q.id = l.quiz_id
     where l.status = 'published'
       and coalesce(le.status, q.status) is distinct from 'published' $$,
  'every published lesson/quiz level points at published content'
);

select is_empty(
  $$ select 1 from public.lessons where status = 'published' and jsonb_array_length(steps) = 0 $$,
  'no published lesson is empty'
);

select is_empty(
  $$ select 1 from public.quizzes where status = 'published' and jsonb_array_length(questions) = 0 $$,
  'no published quiz is empty'
);

select is_empty(
  $$ select r.id from public.lessons l, public.referenced_entry_ids(l.steps) r(id)
     where not exists (select 1 from public.entries e where e.id = r.id and e.status = 'published')
     union
     select r.id from public.quizzes q, public.referenced_entry_ids(q.questions) r(id)
     where not exists (select 1 from public.entries e where e.id = r.id and e.status = 'published') $$,
  'lessons and quizzes only reference published entries'
);

select is_empty(
  $$ select 1 from public.entries e
     where e.status = 'published'
       and not exists (select 1 from public.audio_clips a where a.entry_id = e.id and a.status = 'published') $$,
  'every sample entry has published audio'
);

select is_empty(
  $$ select 1 from public.audio_clips a join public.speakers s on s.id = a.speaker_id
     where a.status = 'published' and not s.consent_given $$,
  'all published audio has speaker consent'
);

select is_empty(
  $$ select 1 from public.entries where coalesce(notes, '') not like '[PLACEHOLDER]%' $$,
  'every seeded entry is clearly marked as placeholder content'
);

select isnt_empty(
  $$ select 1 from public.audio_clips where jsonb_array_length(coalesce(word_timestamps, '[]')) > 1 $$,
  'at least one clip has word timestamps to exercise karaoke highlighting'
);

select * from finish();
rollback;
