-- Public contributions (words, regional variations, corrections, recordings) awaiting admin review.

create type public.submission_kind as enum ('word', 'variation', 'correction', 'recording');
create type public.submission_status as enum ('pending', 'approved', 'rejected');

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  kind public.submission_kind not null,
  status public.submission_status not null default 'pending',
  text_latin text,
  text_arabic text,
  text_tifinagh text,
  translations jsonb check (translations is null or public.is_localized_text(translations)),
  region_id uuid references public.regions (id) on delete set null,
  village text check (char_length(village) <= 120),
  related_entry_id uuid references public.entries (id) on delete set null,
  message text check (char_length(message) <= 2000),
  audio_path text,
  audio_consent boolean not null default false,
  contributor_name text check (char_length(contributor_name) <= 80),
  contributor_email text check (char_length(contributor_email) <= 254),
  submitter_id uuid references public.profiles (id) on delete set null,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_entry_id uuid references public.entries (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submissions_audio_needs_consent check (audio_path is null or audio_consent),
  constraint submissions_not_empty check (
    text_latin is not null or audio_path is not null or message is not null
  )
);

comment on column public.submissions.audio_path is 'Recording in the private "submissions" bucket, under pending/.';
comment on column public.submissions.contributor_email is 'Optional, only visible to admins, used to follow up.';

create index submissions_status_idx on public.submissions (status, created_at);

create trigger submissions_set_updated_at
  before update on public.submissions
  for each row execute function public.set_updated_at();

alter table public.submissions enable row level security;

-- Guests (submitter_id null) and signed-in learners (their own id) can submit, but only as pending.
create policy "Anyone submits pending suggestions"
  on public.submissions for insert to anon, authenticated
  with check (
    status = 'pending'
    and submitter_id is not distinct from (select auth.uid())
    and reviewed_by is null
    and reviewed_at is null
    and review_note is null
    and created_entry_id is null
  );

create policy "Learners read their own submissions"
  on public.submissions for select to authenticated
  using (submitter_id = (select auth.uid()));

create policy "Admins manage submissions"
  on public.submissions for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
