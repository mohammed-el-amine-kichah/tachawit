-- One permissive policy per table, role and action (the database advisor's
-- multiple_permissive_policies warning): each overlapping policy is evaluated on every row.
-- Access is unchanged; the pgTAP suite in supabase/tests covers every rule below.

-- audio_clips
drop policy "Admins manage audio_clips" on public.audio_clips;
drop policy "Everyone reads published audio" on public.audio_clips;
create policy "Guests read public audio_clips" on public.audio_clips for select to anon using (status = 'published' and exists (select 1 from public.speakers s where s.id = audio_clips.speaker_id and s.consent_given));
create policy "Members read public audio_clips, admins read all" on public.audio_clips for select to authenticated
  using ((status = 'published' and exists (select 1 from public.speakers s where s.id = audio_clips.speaker_id and s.consent_given)) or (select public.is_admin()));
create policy "Admins add audio_clips" on public.audio_clips for insert to authenticated with check ((select public.is_admin()));
create policy "Admins edit audio_clips" on public.audio_clips for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete audio_clips" on public.audio_clips for delete to authenticated using ((select public.is_admin()));

-- culture_notes
drop policy "Admins manage culture_notes" on public.culture_notes;
drop policy "Everyone reads published culture_notes" on public.culture_notes;
create policy "Guests read public culture_notes" on public.culture_notes for select to anon using (status = 'published');
create policy "Members read public culture_notes, admins read all" on public.culture_notes for select to authenticated
  using ((status = 'published') or (select public.is_admin()));
create policy "Admins add culture_notes" on public.culture_notes for insert to authenticated with check ((select public.is_admin()));
create policy "Admins edit culture_notes" on public.culture_notes for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete culture_notes" on public.culture_notes for delete to authenticated using ((select public.is_admin()));

-- entries
drop policy "Admins manage entries" on public.entries;
drop policy "Everyone reads published entries" on public.entries;
create policy "Guests read public entries" on public.entries for select to anon using (status = 'published');
create policy "Members read public entries, admins read all" on public.entries for select to authenticated
  using ((status = 'published') or (select public.is_admin()));
create policy "Admins add entries" on public.entries for insert to authenticated with check ((select public.is_admin()));
create policy "Admins edit entries" on public.entries for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete entries" on public.entries for delete to authenticated using ((select public.is_admin()));

-- lessons
drop policy "Admins manage lessons" on public.lessons;
drop policy "Everyone reads published lessons" on public.lessons;
create policy "Guests read public lessons" on public.lessons for select to anon using (status = 'published');
create policy "Members read public lessons, admins read all" on public.lessons for select to authenticated
  using ((status = 'published') or (select public.is_admin()));
create policy "Admins add lessons" on public.lessons for insert to authenticated with check ((select public.is_admin()));
create policy "Admins edit lessons" on public.lessons for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete lessons" on public.lessons for delete to authenticated using ((select public.is_admin()));

-- levels
drop policy "Admins manage levels" on public.levels;
drop policy "Everyone reads published levels of published units" on public.levels;
create policy "Guests read public levels" on public.levels for select to anon using (status = 'published' and exists (select 1 from public.units u where u.id = levels.unit_id and u.status = 'published'));
create policy "Members read public levels, admins read all" on public.levels for select to authenticated
  using ((status = 'published' and exists (select 1 from public.units u where u.id = levels.unit_id and u.status = 'published')) or (select public.is_admin()));
create policy "Admins add levels" on public.levels for insert to authenticated with check ((select public.is_admin()));
create policy "Admins edit levels" on public.levels for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete levels" on public.levels for delete to authenticated using ((select public.is_admin()));

-- quizzes
drop policy "Admins manage quizzes" on public.quizzes;
drop policy "Everyone reads published quizzes" on public.quizzes;
create policy "Guests read public quizzes" on public.quizzes for select to anon using (status = 'published');
create policy "Members read public quizzes, admins read all" on public.quizzes for select to authenticated
  using ((status = 'published') or (select public.is_admin()));
create policy "Admins add quizzes" on public.quizzes for insert to authenticated with check ((select public.is_admin()));
create policy "Admins edit quizzes" on public.quizzes for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete quizzes" on public.quizzes for delete to authenticated using ((select public.is_admin()));

-- regions
drop policy "Admins manage regions" on public.regions;
drop policy "Everyone reads regions" on public.regions;
create policy "Guests read public regions" on public.regions for select to anon using (true);
create policy "Members read public regions, admins read all" on public.regions for select to authenticated
  using ((true) or (select public.is_admin()));
create policy "Admins add regions" on public.regions for insert to authenticated with check ((select public.is_admin()));
create policy "Admins edit regions" on public.regions for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete regions" on public.regions for delete to authenticated using ((select public.is_admin()));

-- speakers
drop policy "Admins manage speakers" on public.speakers;
drop policy "Everyone reads speakers who gave consent" on public.speakers;
create policy "Guests read public speakers" on public.speakers for select to anon using (consent_given);
create policy "Members read public speakers, admins read all" on public.speakers for select to authenticated
  using ((consent_given) or (select public.is_admin()));
create policy "Admins add speakers" on public.speakers for insert to authenticated with check ((select public.is_admin()));
create policy "Admins edit speakers" on public.speakers for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete speakers" on public.speakers for delete to authenticated using ((select public.is_admin()));

-- units
drop policy "Admins manage units" on public.units;
drop policy "Everyone reads published units" on public.units;
create policy "Guests read public units" on public.units for select to anon using (status = 'published');
create policy "Members read public units, admins read all" on public.units for select to authenticated
  using ((status = 'published') or (select public.is_admin()));
create policy "Admins add units" on public.units for insert to authenticated with check ((select public.is_admin()));
create policy "Admins edit units" on public.units for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete units" on public.units for delete to authenticated using ((select public.is_admin()));

-- learner_stats
drop policy "Admins read all learner_stats" on public.learner_stats;
drop policy "Learners manage their own learner_stats" on public.learner_stats;
create policy "Learners read their own learner_stats, admins read all" on public.learner_stats for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Learners add their own learner_stats" on public.learner_stats for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Learners edit their own learner_stats" on public.learner_stats for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Learners delete their own learner_stats" on public.learner_stats for delete to authenticated using (user_id = (select auth.uid()));

-- level_progress
drop policy "Admins read all level_progress" on public.level_progress;
drop policy "Learners manage their own level_progress" on public.level_progress;
create policy "Learners read their own level_progress, admins read all" on public.level_progress for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Learners add their own level_progress" on public.level_progress for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Learners edit their own level_progress" on public.level_progress for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Learners delete their own level_progress" on public.level_progress for delete to authenticated using (user_id = (select auth.uid()));

-- srs_items
drop policy "Admins read all srs_items" on public.srs_items;
drop policy "Learners manage their own srs_items" on public.srs_items;
create policy "Learners read their own srs_items, admins read all" on public.srs_items for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Learners add their own srs_items" on public.srs_items for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Learners edit their own srs_items" on public.srs_items for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Learners delete their own srs_items" on public.srs_items for delete to authenticated using (user_id = (select auth.uid()));

-- profiles
drop policy "Admins read every profile" on public.profiles;
drop policy "Users read their own profile" on public.profiles;
drop policy "Admins update every profile" on public.profiles;
drop policy "Users update their own profile" on public.profiles;
create policy "Users read their own profile, admins read all" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "Users edit their own profile, admins edit all" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- submissions: everyone (admins included) submits through the same pending-only rule.
drop policy "Admins manage submissions" on public.submissions;
drop policy "Learners read their own submissions" on public.submissions;
create policy "Learners read their own submissions, admins read all" on public.submissions for select to authenticated
  using (submitter_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins review submissions" on public.submissions for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete submissions" on public.submissions for delete to authenticated using ((select public.is_admin()));
