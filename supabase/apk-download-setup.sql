-- Smart DK Classes — APK Download setup (v5.1 / app v1.1.5)
-- Run this ONCE in Supabase > SQL Editor.
-- It adds fields used by the public website Download APK strip and creates
-- a public Storage bucket that only an authenticated admin can manage.

alter table public.site_settings
  add column if not exists android_apk_path text,
  add column if not exists android_app_version text,
  add column if not exists android_apk_notes text,
  add column if not exists android_apk_size bigint,
  add column if not exists android_apk_updated_at timestamptz;

-- Keep the existing public-read/admin-update behavior for site_settings.
grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;

-- Dedicated public bucket for the latest Android APK.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'app-downloads',
  'app-downloads',
  true,
  52428800,
  array['application/vnd.android.package-archive','application/octet-stream']::text[]
)
on conflict (id) do update
set public = excluded.public,
    allowed_mime_types = excluded.allowed_mime_types;

-- Public download is allowed. Upload/update/delete is admin-only.
drop policy if exists "public read app downloads" on storage.objects;
create policy "public read app downloads"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'app-downloads');

drop policy if exists "admins manage app downloads" on storage.objects;
create policy "admins manage app downloads"
on storage.objects for all
to authenticated
using (bucket_id = 'app-downloads' and public.is_admin())
with check (bucket_id = 'app-downloads' and public.is_admin());
