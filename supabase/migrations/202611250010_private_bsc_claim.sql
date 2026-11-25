-- Keep the elevated BSC claim implementation in the non-exposed private schema.
create or replace function private.claim_bsc_code(raw_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_code text;
  claimed_brand uuid;
  issuer_admin uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if raw_token is null or length(raw_token) < 32 or length(raw_token) > 256 then
    raise exception 'Invalid claim token';
  end if;

  update public.bsc_issuances i
     set claimed_at = now()
   where i.claim_token_hash = encode(digest(raw_token, 'sha256'), 'hex')
     and i.claimed_at is null
     and i.expires_at > now()
     and exists (select 1 from public.brand_members bm where bm.brand_id = i.brand_id and bm.user_id = auth.uid())
     and exists (select 1 from public.brands b where b.id = i.brand_id and b.status <> 'suspended')
  returning i.bsc_code, i.brand_id, i.created_by into claimed_code, claimed_brand, issuer_admin;

  if claimed_code is null then
    raise exception 'Claim link is invalid, expired, already used, or not assigned to your brand';
  end if;

  perform set_config('sr2.bsc_claim', 'true', true);
  update public.brands
     set bsc_code = claimed_code, status = 'verified', verified_at = now(), verified_by = issuer_admin, rejection_reason = null
   where id = claimed_brand and (bsc_code is null or bsc_code = claimed_code);
  if not found then raise exception 'This brand already has a different BSC code'; end if;

  update public.bsc_code_requests
     set status = 'fulfilled', admin_note = 'BSC code activated by the authorized brand member.', reviewed_by = issuer_admin, reviewed_at = now()
   where brand_id = claimed_brand and status in ('pending','approved');

  insert into public.admin_audit_logs(admin_id, action, target_type, target_id, details)
  values (issuer_admin, 'bsc_code_claimed', 'brand', claimed_brand::text,
          jsonb_build_object('claimed_by', auth.uid(), 'code', claimed_code));
  return claimed_code;
end;
$$;
revoke all on function private.claim_bsc_code(text) from public, anon;
grant execute on function private.claim_bsc_code(text) to authenticated;

create or replace function public.claim_bsc_code(raw_token text)
returns text
language sql
security invoker
set search_path = public
as $$ select private.claim_bsc_code(raw_token); $$;
revoke all on function public.claim_bsc_code(text) from public, anon;
grant execute on function public.claim_bsc_code(text) to authenticated;
