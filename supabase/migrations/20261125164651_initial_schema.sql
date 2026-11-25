-- SR platform: initial PostgreSQL schema for Supabase.
-- Apply with Supabase CLI: supabase db push
create extension if not exists pgcrypto;

create type public.account_role as enum ('user', 'brand', 'admin');
create type public.brand_status as enum ('pending', 'verified', 'rejected', 'suspended');
create type public.bsc_request_status as enum ('pending', 'approved', 'rejected', 'fulfilled');
create type public.application_status as enum ('draft', 'submitted', 'under_review', 'needs_information', 'approved', 'rejected', 'withdrawn');
create type public.certificate_status as enum ('active', 'suspended', 'revoked', 'expired');
create type public.ticket_status as enum ('open', 'waiting_for_user', 'waiting_for_support', 'closed');
create type public.ticket_priority as enum ('low', 'normal', 'high', 'urgent');
create type public.message_sender_type as enum ('user', 'brand', 'admin', 'system');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.account_role not null default 'user',
  username text unique,
  display_name text,
  email_verified_at timestamptz,
  is_blocked boolean not null default false,
  blocked_reason text,
  locale text not null default 'en',
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username is null or username ~ '^[A-Za-z0-9_.-]{3,30}$')
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id),
  legal_name text not null,
  display_name text not null,
  logo_path text,
  official_email text not null,
  website_url text,
  founded_on date,
  status public.brand_status not null default 'pending',
  verified_at timestamptz,
  verified_by uuid references public.profiles(id),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brand_members (
  brand_id uuid not null references public.brands(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'owner' check (member_role in ('owner','manager','submitter','viewer')),
  created_at timestamptz not null default now(),
  primary key (brand_id, user_id)
);

create table public.bsc_code_requests (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  contact_email text not null,
  status public.bsc_request_status not null default 'pending',
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Admin creates a one-time claim link. Only the hash is stored; the raw token is emailed.
create table public.bsc_issuances (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  request_id uuid references public.bsc_code_requests(id),
  bsc_code text unique not null,
  claim_token_hash text unique not null,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint bsc_prefix check (bsc_code like 'BSC-%')
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  manufacturer text not null,
  model_name text not null,
  model_number text,
  release_date date,
  market_region text,
  created_at timestamptz not null default now(),
  unique (manufacturer, model_name, model_number)
);

create table public.certification_applications (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id),
  submitted_by uuid not null references public.profiles(id),
  device_id uuid references public.devices(id),
  manufacturer text not null,
  full_model_name text not null,
  model_number text,
  release_date date,
  technical_specs jsonb not null default '{}'::jsonb,
  test_video_path text,
  test_method_notes text,
  nit_value numeric(10,2),
  lux_value numeric(10,2),
  claimed_sunlight_readability_score smallint,
  internal_test_notes text,
  status public.application_status not null default 'draft',
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  decision_note text,
  estimated_response_by date,
  archive_device_consent boolean not null default false,
  archive_consent_at timestamptz,
  shipping_name text,
  shipping_phone text,
  shipping_address text,
  shipping_tracking_number text,
  shipping_received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sr_score_range check (claimed_sunlight_readability_score is null or claimed_sunlight_readability_score between 1 and 100),
  constraint archive_consent_consistent check (not archive_device_consent or archive_consent_at is not null)
);

create table public.application_assets (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.certification_applications(id) on delete cascade,
  asset_type text not null check (asset_type in ('submitted_image','publication_image','supporting_file','test_video','other')),
  storage_path text not null,
  original_filename text,
  mime_type text,
  file_size_bytes bigint,
  caption text,
  sort_order integer not null default 0,
  approved_for_publication boolean not null default false,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.certification_applications(id),
  brand_id uuid not null references public.brands(id),
  device_id uuid references public.devices(id),
  sr_code text unique not null,
  score smallint not null check (score between 1 and 100),
  status public.certificate_status not null default 'active',
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  issued_by uuid not null references public.profiles(id),
  public_summary text,
  public_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint sr_code_format check (sr_code ~ '^SR-[A-Za-z0-9-]+$')
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id),
  brand_id uuid references public.brands(id),
  subject text not null,
  status public.ticket_status not null default 'open',
  priority public.ticket_priority not null default 'normal',
  assigned_to uuid references public.profiles(id),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  sender_type public.message_sender_type not null,
  body text not null,
  attachment_path text,
  is_internal_note boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.admin_audit_logs (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles(id),
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index brands_owner_idx on public.brands(owner_user_id);
create index brands_status_idx on public.brands(status);
create index bsc_requests_status_idx on public.bsc_code_requests(status, created_at desc);
create index bsc_issuances_brand_idx on public.bsc_issuances(brand_id);
create index applications_brand_idx on public.certification_applications(brand_id, created_at desc);
create index applications_status_idx on public.certification_applications(status, created_at desc);
create index certificates_code_idx on public.certificates(sr_code);
create index certificates_public_idx on public.certificates(status, issued_at desc);
create index tickets_creator_idx on public.support_tickets(created_by, updated_at desc);
create index messages_ticket_idx on public.support_messages(ticket_id, created_at);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.is_blocked = false) $$;

create or replace function public.is_brand_member(target_brand uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.brand_members bm join public.profiles p on p.id = bm.user_id where bm.brand_id = target_brand and bm.user_id = auth.uid() and p.is_blocked = false) $$;

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id, username, display_name, email_verified_at)
  values (new.id, nullif(new.raw_user_meta_data->>'username',''), nullif(new.raw_user_meta_data->>'display_name',''), new.email_confirmed_at)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger brands_updated_at before update on public.brands for each row execute procedure public.set_updated_at();
create trigger bsc_requests_updated_at before update on public.bsc_code_requests for each row execute procedure public.set_updated_at();
create trigger applications_updated_at before update on public.certification_applications for each row execute procedure public.set_updated_at();
create trigger tickets_updated_at before update on public.support_tickets for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.brand_members enable row level security;
alter table public.bsc_code_requests enable row level security;
alter table public.bsc_issuances enable row level security;
alter table public.devices enable row level security;
alter table public.certification_applications enable row level security;
alter table public.application_assets enable row level security;
alter table public.certificates enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_audit_logs enable row level security;

create policy "Users read own profile or admins read all" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "Users update own basic profile" on public.profiles for update using (id = auth.uid() and not public.is_admin()) with check (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()));
create policy "Admins manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy "Brand members and admins read brands" on public.brands for select using (public.is_brand_member(id) or public.is_admin());
create policy "Authenticated users create brand profile" on public.brands for insert to authenticated with check (owner_user_id = auth.uid());
create policy "Brand owners update pending profile" on public.brands for update using (owner_user_id = auth.uid() and status = 'pending' or public.is_admin()) with check (owner_user_id = auth.uid() or public.is_admin());
create policy "Admins manage brands" on public.brands for all using (public.is_admin()) with check (public.is_admin());

create policy "Members read brand membership" on public.brand_members for select using (user_id = auth.uid() or public.is_admin());
create policy "Owner creates own membership" on public.brand_members for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.brands b where b.id = brand_id and b.owner_user_id = auth.uid()));
create policy "Admins manage brand members" on public.brand_members for all using (public.is_admin()) with check (public.is_admin());

create policy "Brand members read BSC requests" on public.bsc_code_requests for select using (requested_by = auth.uid() or public.is_brand_member(brand_id) or public.is_admin());
create policy "Brand members request BSC" on public.bsc_code_requests for insert to authenticated with check (requested_by = auth.uid() and public.is_brand_member(brand_id));
create policy "Admins manage BSC requests" on public.bsc_code_requests for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage BSC issuances" on public.bsc_issuances for all using (public.is_admin()) with check (public.is_admin());

create policy "Devices are publicly readable" on public.devices for select using (true);
create policy "Admins manage devices" on public.devices for all using (public.is_admin()) with check (public.is_admin());

create policy "Brand members read own applications" on public.certification_applications for select using (public.is_brand_member(brand_id) or public.is_admin());
create policy "Brand members create applications" on public.certification_applications for insert to authenticated with check (submitted_by = auth.uid() and public.is_brand_member(brand_id));
create policy "Brand members update drafts" on public.certification_applications for update using (public.is_brand_member(brand_id) and status in ('draft','needs_information') or public.is_admin()) with check (public.is_brand_member(brand_id) or public.is_admin());
create policy "Admins manage applications" on public.certification_applications for all using (public.is_admin()) with check (public.is_admin());

create policy "Brand members read application assets" on public.application_assets for select using (exists (select 1 from public.certification_applications a where a.id = application_id and (public.is_brand_member(a.brand_id) or public.is_admin())));
create policy "Brand members upload application assets" on public.application_assets for insert to authenticated with check (uploaded_by = auth.uid() and exists (select 1 from public.certification_applications a where a.id = application_id and public.is_brand_member(a.brand_id)));
create policy "Admins manage application assets" on public.application_assets for all using (public.is_admin()) with check (public.is_admin());

create policy "Active certificates are public" on public.certificates for select using (status = 'active' or public.is_admin() or public.is_brand_member(brand_id));
create policy "Admins manage certificates" on public.certificates for all using (public.is_admin()) with check (public.is_admin());

create policy "Users read own tickets and admins read all" on public.support_tickets for select using (created_by = auth.uid() or public.is_admin());
create policy "Authenticated users create tickets" on public.support_tickets for insert to authenticated with check (created_by = auth.uid());
create policy "Admins manage tickets" on public.support_tickets for all using (public.is_admin()) with check (public.is_admin());
create policy "Ticket participants read messages" on public.support_messages for select using (exists (select 1 from public.support_tickets t where t.id = ticket_id and (t.created_by = auth.uid() or public.is_admin())) and (not is_internal_note or public.is_admin()));
create policy "Users send messages to own tickets" on public.support_messages for insert to authenticated with check (sender_id = auth.uid() and sender_type in ('user','brand') and is_internal_note = false and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.created_by = auth.uid()));
create policy "Admins manage support messages" on public.support_messages for all using (public.is_admin()) with check (public.is_admin());

create policy "Public read non-secret settings" on public.site_settings for select using (key not like 'secret.%');
create policy "Admins manage settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins read audit logs" on public.admin_audit_logs for select using (public.is_admin());
create policy "Admins insert audit logs" on public.admin_audit_logs for insert with check (public.is_admin());

insert into public.site_settings(key, value) values
('brand', '{"name":"SR Certification","theme":"orange-light","default_locale":"en"}'::jsonb),
('support', '{"email":"bscmailcode@gmail.com","hours":"10:00-22:00","timezone":"Asia/Tehran"}'::jsonb),
('certification', '{"score_min":1,"score_max":100,"review_target_days":30,"sr_code_prefix":"SR-","bsc_code_prefix":"BSC-"}'::jsonb)
on conflict (key) do nothing;
