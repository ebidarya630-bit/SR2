-- Security hardening and one-time BSC claim flow.
-- Apply after 202611250001_initial_schema.sql.

create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role
      or new.is_blocked is distinct from old.is_blocked
      or new.blocked_reason is distinct from old.blocked_reason
      or new.email_verified_at is distinct from old.email_verified_at
      or new.id is distinct from old.id then
      raise exception 'Protected profile fields cannot be changed by the account owner';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_profile_update_before
before update on public.profiles
for each row execute function public.guard_profile_update();

create or replace function public.guard_brand_update()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if old.owner_user_id <> auth.uid()
      or old.status <> 'pending'
      or new.owner_user_id is distinct from old.owner_user_id
      or new.status is distinct from old.status
      or new.verified_at is distinct from old.verified_at
      or new.verified_by is distinct from old.verified_by
      or new.rejection_reason is distinct from old.rejection_reason then
      raise exception 'Brand verification fields are managed by SR administrators';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_brand_update_before
before update on public.brands
for each row execute function public.guard_brand_update();

create or replace function public.guard_application_write()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if tg_op = 'INSERT' then
      if new.submitted_by <> auth.uid()
        or new.status <> 'draft'
        or new.reviewed_by is not null
        or new.reviewed_at is not null
        or new.decision_note is not null
        or new.internal_test_notes is not null
        or new.claimed_sunlight_readability_score is not null then
        raise exception 'New applications must be owner-submitted drafts';
      end if;
    else
      if new.brand_id is distinct from old.brand_id
        or new.submitted_by is distinct from old.submitted_by
        or new.status is distinct from old.status
        or new.reviewed_by is distinct from old.reviewed_by
        or new.reviewed_at is distinct from old.reviewed_at
        or new.decision_note is distinct from old.decision_note
        or new.internal_test_notes is distinct from old.internal_test_notes
        or new.claimed_sunlight_readability_score is distinct from old.claimed_sunlight_readability_score then
        raise exception 'Review fields and application ownership are administrator-managed';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_application_write_before
before insert or update on public.certification_applications
for each row execute function public.guard_application_write();

-- BSC claim tokens are generated with a cryptographically secure random source
-- by a trusted server. Only SHA-256 hashes are stored in bsc_issuances.
create or replace function public.claim_bsc_code(raw_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_code text;
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
  returning i.bsc_code into claimed_code;

  if claimed_code is null then
    raise exception 'Claim link is invalid, expired, already used, or not assigned to your brand';
  end if;

  return claimed_code;
end;
$$;

revoke all on function public.claim_bsc_code(text) from public;
grant execute on function public.claim_bsc_code(text) to authenticated;

-- Do not allow anonymous clients to invoke privileged helper functions.
-- RLS policies also evaluate these boolean helpers for anonymous reads
-- (for example, active public certificate records). They reveal no row data.
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_brand_member(uuid) to anon, authenticated;

-- Public directory should expose only the minimal active-certificate fields.
create or replace view public.public_certificate_directory
with (security_invoker = true) as
select c.sr_code, c.score, c.status, c.issued_at, c.expires_at,
       d.manufacturer, d.model_name, d.model_number, d.release_date,
       b.display_name as brand_name, c.public_summary
from public.certificates c
join public.brands b on b.id = c.brand_id
left join public.devices d on d.id = c.device_id
where c.status = 'active';

grant select on public.public_certificate_directory to anon, authenticated;
