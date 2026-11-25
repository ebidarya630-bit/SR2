-- Keep privileged membership checks outside the exposed Data API schema.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'::public.account_role
      and p.is_blocked = false
  );
$$;

create or replace function private.is_brand_member(target_brand uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.brand_members bm
    join public.profiles p on p.id = bm.user_id
    where bm.brand_id = target_brand
      and bm.user_id = auth.uid()
      and p.is_blocked = false
  );
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.is_brand_member(uuid) from public;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_brand_member(uuid) to anon, authenticated;

-- Preserve existing policy and trigger references while making public wrappers invoker-only.
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$ select private.is_admin(); $$;

create or replace function public.is_brand_member(target_brand uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$ select private.is_brand_member(target_brand); $$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_brand_member(uuid) to anon, authenticated;

create index if not exists application_assets_application_id_idx on public.application_assets(application_id);
create index if not exists bsc_code_requests_brand_id_idx on public.bsc_code_requests(brand_id);
create index if not exists certificates_brand_id_idx on public.certificates(brand_id);