-- Storage buckets and their access rules.
--   audio            public   web-friendly learner audio (paths are random ids)
--   audio-originals  private  untouched uploads, admins only
--   images           public   unit covers, entry and culture images
--   submissions      private  recordings sent by the public, admins review them

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('audio', 'audio', true, 20971520,
    array['audio/mp4', 'audio/aac', 'audio/mpeg', 'audio/ogg', 'audio/webm', 'audio/wav', 'audio/x-m4a']),
  ('audio-originals', 'audio-originals', false, 104857600,
    array['audio/mp4', 'audio/aac', 'audio/mpeg', 'audio/ogg', 'audio/webm', 'audio/wav', 'audio/x-wav', 'audio/x-m4a']),
  ('images', 'images', true, 10485760,
    array['image/png', 'image/jpeg', 'image/webp', 'image/avif']),
  ('submissions', 'submissions', false, 20971520,
    array['audio/mp4', 'audio/aac', 'audio/mpeg', 'audio/ogg', 'audio/webm', 'audio/wav', 'audio/x-m4a'])
on conflict (id) do nothing;

create policy "Admins manage content files"
  on storage.objects for all to authenticated
  using (bucket_id in ('audio', 'audio-originals', 'images') and (select public.is_admin()))
  with check (bucket_id in ('audio', 'audio-originals', 'images') and (select public.is_admin()));

create policy "Anyone uploads a recording for review"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = 'pending');

create policy "Admins manage submitted recordings"
  on storage.objects for all to authenticated
  using (bucket_id = 'submissions' and (select public.is_admin()))
  with check (bucket_id = 'submissions' and (select public.is_admin()));
