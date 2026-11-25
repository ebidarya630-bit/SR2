-- Publish only the intentionally curated certificate directory to anonymous users.
create or replace view public.public_certificate_directory
with (security_invoker = false, security_barrier = true) as
select c.sr_code, c.score, c.status, c.issued_at, c.expires_at,
       d.manufacturer, d.model_name, d.model_number, d.release_date,
       b.display_name as brand_name, c.public_summary
from public.certificates c
join public.brands b on b.id = c.brand_id
left join public.devices d on d.id = c.device_id
where c.status = 'active';

grant select on public.public_certificate_directory to anon, authenticated;
revoke select on public.certificates from anon;
revoke select on public.brands from anon;
revoke select on public.certification_applications from anon;
revoke select on public.devices from anon;
