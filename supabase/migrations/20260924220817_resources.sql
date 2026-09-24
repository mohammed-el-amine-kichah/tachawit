-- Learning resources: links to videos, accounts and pages elsewhere (YouTube, TikTok, Facebook,
-- Instagram) that help learners hear and practise Tachawit. Managed from /admin/resources.

create type public.resource_platform as enum ('youtube', 'tiktok', 'facebook', 'instagram');

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  platform public.resource_platform not null,
  name text not null check (btrim(name) <> '' and char_length(name) <= 120),
  url text not null check (url ~ '^https://' and char_length(url) <= 2048),
  summary jsonb not null check (public.is_localized_text(summary)),
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.resources.name is 'Channel, account or video name, kept as the admin typed it.';
comment on column public.resources.url is 'Plain https link; phones open it in the platform''s app when installed. The app also checks the host matches the platform.';

create trigger resources_set_updated_at before update on public.resources
  for each row execute function public.set_updated_at();
create trigger resources_set_published_at before insert or update of status on public.resources
  for each row execute function public.set_published_at();

alter table public.resources enable row level security;

create policy "Guests read public resources" on public.resources for select to anon using (status = 'published');
create policy "Members read public resources, admins read all" on public.resources for select to authenticated
  using ((status = 'published') or (select public.is_admin()));
create policy "Admins add resources" on public.resources for insert to authenticated with check ((select public.is_admin()));
create policy "Admins edit resources" on public.resources for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete resources" on public.resources for delete to authenticated using ((select public.is_admin()));
