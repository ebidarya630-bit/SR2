-- Runtime compatibility, account email lookup and private certification uploads.
alter table public.profiles add column if not exists email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is distinct from u.email;
create unique index if not exists profiles_email_unique_idx on public.profiles(email) where email is not null;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id, email, username, display_name, email_verified_at)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'username',''),
    nullif(new.raw_user_meta_data->>'display_name',''),
    new.email_confirmed_at
  )
  on conflict (id) do update
    set email = excluded.email,
        email_verified_at = excluded.email_verified_at;
  return new;
end;
$$;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'sr-private',
  'sr-private',
  false,
  62914560,
  array['video/mp4','video/quicktime','video/webm','image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "SR users upload files to their own folder"
on storage.objects for insert to authenticated
with check (bucket_id = 'sr-private' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "SR users and admins read authorized uploads"
on storage.objects for select to authenticated
using (
  bucket_id = 'sr-private'
  and (
    owner_id = (select auth.uid())::text
    or private.is_admin()
    or exists (
      select 1
      from public.application_assets aa
      join public.certification_applications ca on ca.id = aa.application_id
      join public.brand_members bm on bm.brand_id = ca.brand_id
      where aa.storage_path = name and bm.user_id = (select auth.uid())
    )
  )
);

create policy "SR users delete their own uploads"
on storage.objects for delete to authenticated
using (bucket_id = 'sr-private' and owner_id = (select auth.uid())::text);
