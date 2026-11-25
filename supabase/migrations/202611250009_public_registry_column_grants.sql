-- Keep the public certificate directory invoker-secure while granting only its projected fields.
create policy "Public registry reads applications for active certificates"
on public.certification_applications for select to anon
using (
  exists (
    select 1 from public.certificates c
    where c.application_id = certification_applications.id
      and c.status = 'active'
  )
);

revoke all on public.certificates from anon;
grant select (id, application_id, brand_id, device_id, sr_code, score, status, issued_at, expires_at, public_summary)
on public.certificates to anon;

revoke all on public.brands from anon;
grant select (id, display_name) on public.brands to anon;

revoke all on public.certification_applications from anon;
grant select (id, brand_id, device_id, manufacturer, full_model_name, model_number, release_date)
on public.certification_applications to anon;

revoke all on public.devices from anon;
grant select (id, manufacturer, model_name, model_number, release_date)
on public.devices to anon;

create or replace view public.public_certificate_directory
with (security_invoker = true, security_barrier = true) as
select c.sr_code, c.score, c.status, c.issued_at, c.expires_at,
       d.manufacturer, d.model_name, d.model_number, d.release_date,
       b.display_name as brand_name, c.public_summary
from public.certificates c
join public.brands b on b.id = c.brand_id
left join public.devices d on d.id = c.device_id
where c.status = 'active';

grant select on public.public_certificate_directory to anon, authenticated;
