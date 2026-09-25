-- Speakers are people with an account. Anyone signed in can become a speaker from their profile and
-- gives, or withdraws, consent themselves. Admins no longer create or edit speakers: they pick a
-- consenting user when adding audio.

-- Speakers without an account are removed, with their recordings. Every existing speaker predates
-- accounts, so this clears them all. The audio files stay in storage and can be cleaned up there.
delete from public.audio_clips;
delete from public.speakers;

-- One speaker profile per account, sharing its id.
alter table public.speakers alter column id drop default;
alter table public.speakers
  add constraint speakers_id_fkey foreign key (id) references public.profiles (id) on delete cascade;
comment on column public.speakers.id is 'The speaker''s account (profiles.id).';

-- Deleting an account removes that person's recordings too.
alter table public.audio_clips drop constraint audio_clips_speaker_id_fkey;
alter table public.audio_clips
  add constraint audio_clips_speaker_id_fkey foreign key (speaker_id) references public.speakers (id) on delete cascade;

-- The consent date is the day consent is given, set by the database rather than sent by the client.
create function public.stamp_speaker_consent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not new.consent_given then
    new.consent_date := null;
  elsif tg_op = 'INSERT' or not old.consent_given then
    new.consent_date := current_date;
  else
    new.consent_date := old.consent_date;
  end if;
  return new;
end;
$$;

create trigger speakers_stamp_consent
  before insert or update on public.speakers
  for each row execute function public.stamp_speaker_consent();

-- A speaker withdrawing consent is not an admin, so unpublishing their audio must bypass the
-- admin-only policies on audio_clips.
alter function public.unpublish_audio_on_consent_revoked() security definer;

-- Policies -------------------------------------------------------------------------
drop policy "Members read public speakers, admins read all" on public.speakers;
drop policy "Admins add speakers" on public.speakers;
drop policy "Admins edit speakers" on public.speakers;
drop policy "Admins delete speakers" on public.speakers;

create policy "Members read public speakers and their own, admins read all" on public.speakers for select to authenticated
  using (consent_given or id = (select auth.uid()) or (select public.is_admin()));
create policy "Members become speakers" on public.speakers for insert to authenticated
  with check (id = (select auth.uid()));
create policy "Speakers edit their own profile" on public.speakers for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
