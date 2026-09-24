-- Progress for signed-in learners. All functions run as SECURITY INVOKER: row level security
-- still applies, so a learner can only ever touch their own rows.

-- Streak after an activity on p_today. Mirrors nextStreak() in src/lib/progress/streak.ts.
create function public.next_streak(
  p_current integer,
  p_longest integer,
  p_last date,
  p_today date,
  out current_streak integer,
  out longest_streak integer,
  out last_active_on date
)
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_last is not null and p_today <= p_last then
    current_streak := p_current;
    longest_streak := p_longest;
    last_active_on := p_last;
    return;
  end if;
  current_streak := case when p_today - p_last = 1 then p_current + 1 else 1 end;
  longest_streak := greatest(p_longest, current_streak);
  last_active_on := p_today;
end;
$$;

-- Guards shared by the functions below.
create function public.require_learner(p_today date)
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'Sign in to save progress to your account' using errcode = 'insufficient_privilege';
  end if;
  -- p_today is the learner's local date. Allow for time zones, and for progress made offline
  -- that syncs a few days later (an earlier date never extends a streak).
  if p_today is null or p_today not between current_date - 7 and current_date + 1 then
    raise exception 'Invalid activity date' using errcode = 'invalid_parameter_value';
  end if;
  return uid;
end;
$$;

-- XP (capped per activity) and streak for an activity on p_today.
create function public.log_activity(p_xp integer, p_today date)
returns public.learner_stats
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := public.require_learner(p_today);
  stats public.learner_stats;
  streak record;
begin
  insert into public.learner_stats (user_id) values (uid) on conflict (user_id) do nothing;
  select * into stats from public.learner_stats where user_id = uid for update;
  select * into streak from public.next_streak(stats.current_streak, stats.longest_streak, stats.last_active_on, p_today);

  update public.learner_stats
  set xp = xp + least(greatest(coalesce(p_xp, 0), 0), 100),
      current_streak = streak.current_streak,
      longest_streak = streak.longest_streak,
      last_active_on = streak.last_active_on
  where user_id = uid
  returning * into stats;
  return stats;
end;
$$;

-- A finished lesson or quiz: best stars, attempts, XP, streak, and its words scheduled for review.
create function public.complete_level(
  p_level_id uuid,
  p_stars integer,
  p_xp integer,
  p_entry_ids uuid[],
  p_today date
)
returns public.learner_stats
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := public.require_learner(p_today);
begin
  -- Row level security hides drafts, so this also rejects unpublished levels.
  if not exists (select 1 from public.levels where id = p_level_id) then
    raise exception 'Level % is not available', p_level_id using errcode = 'no_data_found';
  end if;

  insert into public.level_progress (user_id, level_id, stars, attempts, completed_at)
  values (uid, p_level_id, least(greatest(coalesce(p_stars, 0), 0), 3), 1, now())
  on conflict (user_id, level_id) do update
  set stars = greatest(public.level_progress.stars, excluded.stars),
      attempts = public.level_progress.attempts + 1,
      completed_at = coalesce(public.level_progress.completed_at, excluded.completed_at);

  insert into public.srs_items (user_id, entry_id, due_at)
  select uid, e.id, now() + interval '1 day'
  from public.entries e
  where e.id = any ((coalesce(p_entry_ids, '{}'::uuid[]))[1:200])
  on conflict (user_id, entry_id) do nothing;

  return public.log_activity(p_xp, p_today);
end;
$$;

-- On sign-up or sign-in, fold the progress a guest made on this device into their account.
-- Unknown or unpublished levels and entries are ignored; best results win.
create function public.merge_guest_progress(p_snapshot jsonb, p_today date)
returns public.learner_stats
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := public.require_learner(p_today);
  guest_streak jsonb := coalesce(p_snapshot -> 'streak', '{}'::jsonb);
  stats public.learner_stats;
begin
  insert into public.level_progress (user_id, level_id, stars, attempts, completed_at)
  select uid,
         l.id,
         least(greatest(coalesce((v ->> 'stars')::integer, 0), 0), 3),
         greatest(coalesce((v ->> 'attempts')::integer, 1), 1),
         (v ->> 'completedAt')::timestamptz
  from jsonb_each(coalesce(p_snapshot -> 'levels', '{}'::jsonb)) as j(k, v)
  join public.levels l on l.id::text = j.k
  on conflict (user_id, level_id) do update
  set stars = greatest(public.level_progress.stars, excluded.stars),
      attempts = public.level_progress.attempts + excluded.attempts,
      completed_at = least(public.level_progress.completed_at, excluded.completed_at);

  insert into public.srs_items (user_id, entry_id, ease, interval_days, repetitions, lapses, due_at, last_reviewed_at)
  select uid,
         e.id,
         greatest(coalesce((v ->> 'ease')::real, 2.5), 1.3),
         greatest(coalesce((v ->> 'intervalDays')::integer, 0), 0),
         greatest(coalesce((v ->> 'repetitions')::integer, 0), 0),
         greatest(coalesce((v ->> 'lapses')::integer, 0), 0),
         coalesce((v ->> 'dueAt')::timestamptz, now()),
         (v ->> 'lastReviewedAt')::timestamptz
  from jsonb_each(coalesce(p_snapshot -> 'srs', '{}'::jsonb)) as j(k, v)
  join public.entries e on e.id::text = j.k
  on conflict (user_id, entry_id) do update
  set ease = excluded.ease,
      interval_days = excluded.interval_days,
      repetitions = excluded.repetitions,
      lapses = excluded.lapses,
      due_at = excluded.due_at,
      last_reviewed_at = excluded.last_reviewed_at
  where excluded.last_reviewed_at is not null
    and (public.srs_items.last_reviewed_at is null or excluded.last_reviewed_at > public.srs_items.last_reviewed_at);

  insert into public.learner_stats (user_id) values (uid) on conflict (user_id) do nothing;
  update public.learner_stats
  set xp = xp + least(greatest(coalesce((p_snapshot ->> 'xp')::integer, 0), 0), 10000),
      longest_streak = greatest(longest_streak, coalesce((guest_streak ->> 'longest')::integer, 0)),
      current_streak = case
        when (guest_streak ->> 'lastActiveOn')::date > coalesce(last_active_on, '-infinity'::date)
          then coalesce((guest_streak ->> 'current')::integer, current_streak)
        else current_streak
      end,
      last_active_on = greatest(last_active_on, (guest_streak ->> 'lastActiveOn')::date)
  where user_id = uid
  returning * into stats;
  return stats;
end;
$$;

-- Only signed-in learners call these; guests keep their progress on the device.
revoke execute on function public.log_activity(integer, date) from public, anon;
revoke execute on function public.complete_level(uuid, integer, integer, uuid[], date) from public, anon;
revoke execute on function public.merge_guest_progress(jsonb, date) from public, anon;
revoke execute on function public.require_learner(date) from public, anon;
grant execute on function public.log_activity(integer, date) to authenticated;
grant execute on function public.complete_level(uuid, integer, integer, uuid[], date) to authenticated;
grant execute on function public.merge_guest_progress(jsonb, date) to authenticated;
grant execute on function public.require_learner(date) to authenticated;
