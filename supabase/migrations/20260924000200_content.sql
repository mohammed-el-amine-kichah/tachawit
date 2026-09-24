-- Learning content: everything here is managed from /admin and read by learners only once published.

create type public.level_type as enum ('lesson', 'quiz', 'review', 'boss', 'story');
create type public.map_theme as enum ('aures_peaks', 'cedar_forest', 'cliff_villages', 'palm_groves');
create type public.part_of_speech as enum (
  'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction',
  'interjection', 'numeral', 'particle', 'phrase', 'expression'
);
create type public.culture_category as enum (
  'music', 'jewelry', 'history', 'yennayer', 'food', 'crafts', 'daily_life', 'other'
);

-- Regions (dialect / village tags) ------------------------------------------------

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (public.is_localized_text(name)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Speakers ------------------------------------------------------------------------

create table public.speakers (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (btrim(display_name) <> ''),
  region_id uuid references public.regions (id) on delete set null,
  village text,
  consent_given boolean not null default false,
  consent_date date,
  public_bio jsonb check (public_bio is null or public.is_localized_text(public_bio)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint speakers_consent_has_date check (not consent_given or consent_date is not null)
);

comment on column public.speakers.display_name is 'Real name or pseudonym, as the speaker chose.';

-- Entries (words and phrases) -----------------------------------------------------

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  text_latin text not null check (btrim(text_latin) <> ''),
  text_arabic text,
  text_tifinagh text,
  translations jsonb not null check (public.is_localized_text(translations)),
  part_of_speech public.part_of_speech,
  region_id uuid references public.regions (id) on delete set null,
  notes text,
  image_path text,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.entries.text_latin is 'Stored exactly as entered; never normalised.';

create index entries_text_latin_idx on public.entries (lower(text_latin));
create index entries_region_idx on public.entries (region_id);

-- Audio clips ---------------------------------------------------------------------

create table public.audio_clips (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references public.entries (id) on delete cascade,
  speaker_id uuid not null references public.speakers (id) on delete restrict,
  storage_path text not null unique,
  slow_storage_path text,
  original_path text,
  mime_type text not null default 'audio/mp4',
  duration_ms integer check (duration_ms > 0),
  transcript text,
  word_timestamps jsonb check (word_timestamps is null or jsonb_typeof(word_timestamps) = 'array'),
  is_primary boolean not null default false,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.audio_clips.storage_path is 'Web-friendly file in the public "audio" bucket.';
comment on column public.audio_clips.original_path is 'Untouched upload in the private "audio-originals" bucket.';
comment on column public.audio_clips.word_timestamps is '[{word, startMs, endMs?}] for karaoke highlighting.';

create index audio_clips_entry_idx on public.audio_clips (entry_id);
create index audio_clips_speaker_idx on public.audio_clips (speaker_id);
create unique index audio_clips_one_primary_per_entry on public.audio_clips (entry_id) where is_primary;

-- Lessons and quizzes (ordered steps/questions as typed JSON, validated with Zod) --

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null check (public.is_localized_text(title)),
  steps jsonb not null default '[]' check (jsonb_typeof(steps) = 'array'),
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null check (public.is_localized_text(title)),
  questions jsonb not null default '[]' check (jsonb_typeof(questions) = 'array'),
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Units and levels (the map) ------------------------------------------------------

create table public.units (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position integer not null check (position >= 0),
  title jsonb not null check (public.is_localized_text(title)),
  description jsonb check (description is null or public.is_localized_text(description)),
  map_theme public.map_theme not null default 'aures_peaks',
  cover_image_path text,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint units_position_key unique (position) deferrable initially immediate
);

create table public.levels (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete cascade,
  position integer not null check (position >= 0),
  type public.level_type not null,
  title jsonb check (title is null or public.is_localized_text(title)),
  lesson_id uuid references public.lessons (id) on delete restrict,
  quiz_id uuid references public.quizzes (id) on delete restrict,
  unlock_rule jsonb not null default '{"type": "previous_completed"}'
    check (jsonb_typeof(unlock_rule) = 'object' and unlock_rule ? 'type'),
  map_x double precision not null default 0.5 check (map_x between 0 and 1),
  map_y double precision not null default 0.5 check (map_y between 0 and 1),
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint levels_unit_position_key unique (unit_id, position) deferrable initially immediate,
  constraint levels_content_matches_type check (
    (lesson_id is null or type in ('lesson', 'story'))
    and (quiz_id is null or type in ('quiz', 'boss'))
  ),
  constraint levels_published_has_content check (
    status = 'draft'
    or type = 'review'
    or (type in ('lesson', 'story') and lesson_id is not null)
    or (type in ('quiz', 'boss') and quiz_id is not null)
  )
);

comment on column public.levels.map_x is 'Horizontal node position on the unit map, normalised 0..1.';
comment on column public.levels.map_y is 'Vertical node position on the unit map, normalised 0..1.';

create index levels_lesson_idx on public.levels (lesson_id);
create index levels_quiz_idx on public.levels (quiz_id);

-- Culture notes -------------------------------------------------------------------

create table public.culture_notes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category public.culture_category not null default 'other',
  title jsonb not null check (public.is_localized_text(title)),
  summary jsonb check (summary is null or public.is_localized_text(summary)),
  body jsonb not null default '{}' check (jsonb_typeof(body) = 'object'),
  cover_image_path text,
  unit_id uuid references public.units (id) on delete set null,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.culture_notes.body is 'Rich text document per locale: {"en": <doc>, "fr": <doc>, ...}.';

-- Timestamps --------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'regions', 'speakers', 'entries', 'audio_clips', 'lessons', 'quizzes', 'units', 'levels', 'culture_notes'
  ] loop
    execute format(
      'create trigger %1$s_set_updated_at before update on public.%1$I
       for each row execute function public.set_updated_at()', t);
  end loop;

  foreach t in array array['entries', 'audio_clips', 'lessons', 'quizzes', 'units', 'levels', 'culture_notes'] loop
    execute format(
      'create trigger %1$s_set_published_at before insert or update of status on public.%1$I
       for each row execute function public.set_published_at()', t);
  end loop;
end;
$$;

-- Integrity guards --------------------------------------------------------------
-- Learners must never reach a published item that points at something unpublished.

-- Every entry id a lesson or quiz payload references (entryId, entryIds[], distractorEntryIds[]).
create function public.referenced_entry_ids(payload jsonb)
returns setof uuid
language sql
immutable
set search_path = ''
as $$
  select distinct (ref #>> '{}')::uuid
  from (
    select jsonb_path_query(payload, 'lax $.**.entryId') as ref
    union all
    select jsonb_path_query(payload, 'lax $.**.entryIds[*]')
    union all
    select jsonb_path_query(payload, 'lax $.**.distractorEntryIds[*]')
  ) as refs
  where jsonb_typeof(ref) = 'string';
$$;

create function public.guard_content_entries_published()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  payload jsonb := coalesce(to_jsonb(new) -> 'steps', to_jsonb(new) -> 'questions');
  missing uuid;
begin
  if new.status = 'published' then
    select r.id into missing
    from public.referenced_entry_ids(payload) as r(id)
    where not exists (select 1 from public.entries e where e.id = r.id and e.status = 'published')
    limit 1;

    if missing is not null then
      raise exception 'Cannot publish: entry % is missing or still a draft', missing
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger lessons_guard_entries
  before insert or update on public.lessons
  for each row execute function public.guard_content_entries_published();

create trigger quizzes_guard_entries
  before insert or update on public.quizzes
  for each row execute function public.guard_content_entries_published();

create function public.guard_entry_unpublish()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.status = 'published' then
    return new;
  end if;

  if old.status = 'published' and (
    exists (
      select 1 from public.lessons l
      where l.status = 'published' and old.id in (select public.referenced_entry_ids(l.steps))
    ) or exists (
      select 1 from public.quizzes q
      where q.status = 'published' and old.id in (select public.referenced_entry_ids(q.questions))
    )
  ) then
    raise exception 'Entry % is used by a published lesson or quiz; unpublish that first', old.id
      using errcode = 'check_violation';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger entries_guard_unpublish
  before update of status or delete on public.entries
  for each row execute function public.guard_entry_unpublish();

create function public.guard_level_content_published()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and (
    (new.lesson_id is not null
      and not exists (select 1 from public.lessons where id = new.lesson_id and status = 'published'))
    or (new.quiz_id is not null
      and not exists (select 1 from public.quizzes where id = new.quiz_id and status = 'published'))
  ) then
    raise exception 'Cannot publish level: its lesson or quiz is still a draft'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger levels_guard_content
  before insert or update on public.levels
  for each row execute function public.guard_level_content_published();

create function public.guard_level_content_unpublish()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'published' and new.status <> 'published' and exists (
    select 1 from public.levels
    where status = 'published'
      and (lesson_id = old.id or quiz_id = old.id)
  ) then
    raise exception 'This is used by a published level; unpublish the level first'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger lessons_guard_unpublish
  before update of status on public.lessons
  for each row execute function public.guard_level_content_unpublish();

create trigger quizzes_guard_unpublish
  before update of status on public.quizzes
  for each row execute function public.guard_level_content_unpublish();

-- Consent: audio is only published for speakers with recorded consent.
create function public.guard_audio_consent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and not exists (
    select 1 from public.speakers where id = new.speaker_id and consent_given
  ) then
    raise exception 'Cannot publish audio: the speaker has no recorded consent'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger audio_clips_guard_consent
  before insert or update on public.audio_clips
  for each row execute function public.guard_audio_consent();

create function public.unpublish_audio_on_consent_revoked()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.consent_given and not new.consent_given then
    update public.audio_clips set status = 'draft' where speaker_id = new.id and status = 'published';
  end if;
  return new;
end;
$$;

create trigger speakers_consent_revoked
  after update of consent_given on public.speakers
  for each row execute function public.unpublish_audio_on_consent_revoked();

-- Row level security ------------------------------------------------------------

alter table public.regions enable row level security;
alter table public.speakers enable row level security;
alter table public.entries enable row level security;
alter table public.audio_clips enable row level security;
alter table public.lessons enable row level security;
alter table public.quizzes enable row level security;
alter table public.units enable row level security;
alter table public.levels enable row level security;
alter table public.culture_notes enable row level security;

create policy "Everyone reads regions"
  on public.regions for select to anon, authenticated
  using (true);

create policy "Everyone reads speakers who gave consent"
  on public.speakers for select to anon, authenticated
  using (consent_given);

create policy "Everyone reads published audio"
  on public.audio_clips for select to anon, authenticated
  using (
    status = 'published'
    and exists (select 1 from public.speakers s where s.id = speaker_id and s.consent_given)
  );

create policy "Everyone reads published levels of published units"
  on public.levels for select to anon, authenticated
  using (
    status = 'published'
    and exists (select 1 from public.units u where u.id = unit_id and u.status = 'published')
  );

do $$
declare
  t text;
begin
  foreach t in array array['entries', 'lessons', 'quizzes', 'units', 'culture_notes'] loop
    execute format(
      'create policy "Everyone reads published %1$s" on public.%1$I
       for select to anon, authenticated using (status = ''published'')', t);
  end loop;

  foreach t in array array[
    'regions', 'speakers', 'entries', 'audio_clips', 'lessons', 'quizzes', 'units', 'levels', 'culture_notes'
  ] loop
    execute format(
      'create policy "Admins manage %1$s" on public.%1$I
       for all to authenticated
       using ((select public.is_admin()))
       with check ((select public.is_admin()))', t);
  end loop;
end;
$$;
