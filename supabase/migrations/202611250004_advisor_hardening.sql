-- Advisor-driven hardening for SR2's Supabase schema.
-- Trigger-only functions are not public RPC endpoints.
alter function public.set_updated_at() set search_path = public;

revoke all on function public.guard_profile_update() from public, anon, authenticated;
revoke all on function public.guard_brand_update() from public, anon, authenticated;
revoke all on function public.guard_application_write() from public, anon, authenticated;
revoke all on function public.guard_brand_insert() from public, anon, authenticated;
revoke all on function public.guard_bsc_request_insert() from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

-- BSC claiming is intentionally available to signed-in users only.
revoke all on function public.claim_bsc_code(text) from anon;
grant execute on function public.claim_bsc_code(text) to authenticated;

-- Cover foreign keys used by joins, ownership checks and cascading deletes.
create index if not exists admin_audit_logs_admin_id_idx on public.admin_audit_logs(admin_id);
create index if not exists application_assets_uploaded_by_idx on public.application_assets(uploaded_by);
create index if not exists brand_members_user_id_idx on public.brand_members(user_id);
create index if not exists brands_verified_by_idx on public.brands(verified_by);
create index if not exists bsc_code_requests_requested_by_idx on public.bsc_code_requests(requested_by);
create index if not exists bsc_code_requests_reviewed_by_idx on public.bsc_code_requests(reviewed_by);
create index if not exists bsc_issuances_request_id_idx on public.bsc_issuances(request_id);
create index if not exists bsc_issuances_created_by_idx on public.bsc_issuances(created_by);
create index if not exists certificates_device_id_idx on public.certificates(device_id);
create index if not exists certificates_issued_by_idx on public.certificates(issued_by);
create index if not exists applications_device_id_idx on public.certification_applications(device_id);
create index if not exists applications_submitted_by_idx on public.certification_applications(submitted_by);
create index if not exists applications_reviewed_by_idx on public.certification_applications(reviewed_by);
create index if not exists site_settings_updated_by_idx on public.site_settings(updated_by);
create index if not exists support_messages_sender_id_idx on public.support_messages(sender_id);
create index if not exists support_tickets_brand_id_idx on public.support_tickets(brand_id);
create index if not exists support_tickets_assigned_to_idx on public.support_tickets(assigned_to);