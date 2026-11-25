-- Force application/brand creation through atomic, validated RPCs and enforce per-application upload quotas.
revoke insert on public.certification_applications from authenticated;
revoke insert on public.application_assets from authenticated;
revoke insert on public.brands from authenticated;
revoke insert on public.brand_members from authenticated;
revoke insert on public.bsc_code_requests from authenticated;

create or replace function private.enforce_application_asset_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total_bytes bigint;
begin
  select coalesce(sum(file_size_bytes),0)
    into total_bytes
    from public.application_assets
   where application_id = new.application_id;
  if total_bytes > 104857600 then
    raise exception 'Certification evidence exceeds the 100 MB per-application limit';
  end if;
  return null;
end;
$$;
revoke all on function private.enforce_application_asset_total() from public, anon, authenticated;

drop trigger if exists application_assets_total_limit on public.application_assets;
create constraint trigger application_assets_total_limit
after insert or update of file_size_bytes on public.application_assets
deferrable initially deferred
for each row execute function private.enforce_application_asset_total();
