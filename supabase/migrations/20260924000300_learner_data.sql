-- Learner progress: owned by each learner; admins can read it for stats.

create table public.level_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  level_id uuid not null references public.levels (id) on delete cascade,
  stars smallint not null default 0 check (stars between 0 and 3),
  attempts integer not null default 0 check (attempts >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, level_id)
);

create index level_progress_level_idx on public.level_progress (level_id);

create table public.learner_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_active_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Spaced-repetition state per learner and entry (SM-2 style).
create table public.srs_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  entry_id uuid not null references public.entries (id) on delete cascade,
  ease real not null default 2.5 check (ease >= 1.3),
  interval_days integer not null default 0 check (interval_days >= 0),
  repetitions integer not null default 0 check (repetitions >= 0),
  lapses integer not null default 0 check (lapses >= 0),
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, entry_id)
);

create index srs_items_due_idx on public.srs_items (user_id, due_at);
create index srs_items_entry_idx on public.srs_items (entry_id);

do $$
declare
  t text;
begin
  foreach t in array array['level_progress', 'learner_stats', 'srs_items'] loop
    execute format(
      'create trigger %1$s_set_updated_at before update on public.%1$I
       for each row execute function public.set_updated_at()', t);

    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy "Learners manage their own %1$s" on public.%1$I
       for all to authenticated
       using (user_id = (select auth.uid()))
       with check (user_id = (select auth.uid()))', t);

    execute format(
      'create policy "Admins read all %1$s" on public.%1$I
       for select to authenticated
       using ((select public.is_admin()))', t);
  end loop;
end;
$$;
