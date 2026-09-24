-- Contributions go through a server action that records a salted hash of the sender's network
-- address (never the address itself), so repeated submissions can be slowed down.

alter table public.submissions add column client_hash text check (char_length(client_hash) <= 64);

comment on column public.submissions.client_hash is 'Salted SHA-256 of the sender''s IP, for rate limiting only. Never the raw address.';

create index submissions_client_recent_idx on public.submissions (client_hash, created_at desc);

-- Counting recent submissions needs to see rows the sender cannot read (guests read nothing), so
-- this narrow check runs with elevated rights but only ever returns a number for one hash.
create function public.recent_submission_count(p_client_hash text, p_minutes integer)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.submissions
  where client_hash = p_client_hash
    and created_at > now() - make_interval(mins => least(greatest(p_minutes, 1), 1440));
$$;

revoke execute on function public.recent_submission_count(text, integer) from public;
grant execute on function public.recent_submission_count(text, integer) to anon, authenticated;
