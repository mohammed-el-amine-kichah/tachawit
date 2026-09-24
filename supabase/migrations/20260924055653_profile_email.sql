-- Admins need to find people (e.g. to make someone an admin). Emails live in auth.users, which the
-- API cannot read, so profiles keep a read-only copy. Row level security already limits profiles
-- to their owner and admins.

alter table public.profiles add column email text;

update public.profiles p set email = u.email from auth.users u where u.id = p.id;

create index profiles_email_idx on public.profiles (lower(email));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 60),
    new.email
  );
  return new;
end;
$$;

create function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

-- Roles change only by admins, and the email copy never changes through the API.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if new.email is distinct from old.email then
      raise exception 'The email comes from the account and cannot be edited here' using errcode = 'insufficient_privilege';
    end if;
    if new.role is distinct from old.role and not public.is_admin() then
      raise exception 'Only admins can change roles' using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end;
$$;

-- Trigger functions are not meant to be called through the API.
revoke execute on function public.sync_profile_email() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
