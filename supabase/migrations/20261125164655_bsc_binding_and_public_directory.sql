-- Complete BSC binding and public certificate directory access.
-- Apply after 202611250002_security_hardening.sql.

alter table public.brands
  add column if not exists bsc_code text unique,
  add constraint brands_bsc_prefix check (bsc_code is null or bsc_code like 'BSC-%');

create policy "Public read verified brands"
on public.brands for select
using (status = 'verified');

create or replace function public.guard_brand_insert()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.owner_user_id <> auth.uid()
      or new.status <> 'pending'
      or new.verified_at is not null
      or new.verified_by is not null
      or new.rejection_reason is not null
      or new.bsc_code is not null then
      raise exception 'Brand registrations must begin as unverified pending records';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_brand_insert_before
before insert on public.brands
for each row execute function public.guard_brand_insert();

create or replace function public.guard_bsc_request_insert()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.requested_by <> auth.uid()
      or new.status <> 'pending'
      or new.reviewed_by is not null
      or new.reviewed_at is not null
      or new.admin_note is not null then
      raise exception 'BSC requests must be submitted as pending by the signed-in requester';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_bsc_request_insert_before
before insert on public.bsc_code_requests
for each row execute function public.guard_bsc_request_insert();

create or replace function public.claim_bsc_code(raw_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_code text;
  claimed_brand uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if raw_token is null or length(raw_token) < 32 or length(raw_token) > 256 then
    raise exception 'Invalid claim token';
  end if;

  update public.bsc_issuances i
     set claimed_at = now()
   where i.claim_token_hash = encode(digest(raw_token, 'sha256'), 'hex')
     and i.claimed_at is null
     and i.expires_at > now()
     and exists (
       select 1 from public.brand_members bm
       where bm.brand_id = i.brand_id and bm.user_id = auth.uid()
     )
  returning i.bsc_code, i.brand_id into claimed_code, claimed_brand;

  if claimed_code is null then
    raise exception 'Claim link is invalid, expired, already used, or not assigned to your brand';
  end if;

  update public.brands
     set bsc_code = claimed_code
   where id = claimed_brand
     and (bsc_code is null or bsc_code = claimed_code);

  if not found then
    raise exception 'This brand already has a different BSC code';
  end if;

  return claimed_code;
end;
$$;

revoke all on function public.claim_bsc_code(text) from public;
grant execute on function public.claim_bsc_code(text) to authenticated;
