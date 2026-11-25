-- Make brand registration atomic so partial records cannot be stranded.
create or replace function private.register_brand(
  p_legal_name text,
  p_display_name text,
  p_official_email text,
  p_website_url text default null,
  p_founded_on date default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_brand_id uuid;
  actor_id uuid := auth.uid();
begin
  if actor_id is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_legal_name),'') is null or nullif(trim(p_display_name),'') is null
     or nullif(trim(p_official_email),'') is null then
    raise exception 'Legal name, display name and official email are required';
  end if;

  insert into public.brands(owner_user_id, legal_name, display_name, official_email, website_url, founded_on, status)
  values (actor_id, trim(p_legal_name), trim(p_display_name), lower(trim(p_official_email)), nullif(trim(p_website_url),''), p_founded_on, 'pending')
  returning id into new_brand_id;

  insert into public.brand_members(brand_id, user_id, member_role)
  values (new_brand_id, actor_id, 'owner');

  insert into public.bsc_code_requests(brand_id, requested_by, contact_email, status)
  values (new_brand_id, actor_id, lower(trim(p_official_email)), 'pending');

  return new_brand_id;
end;
$$;
revoke all on function private.register_brand(text,text,text,text,date) from public, anon;
grant execute on function private.register_brand(text,text,text,text,date) to authenticated;

create or replace function public.register_brand(
  p_legal_name text,
  p_display_name text,
  p_official_email text,
  p_website_url text default null,
  p_founded_on date default null
)
returns uuid
language sql
security invoker
set search_path = public
as $$ select private.register_brand(p_legal_name,p_display_name,p_official_email,p_website_url,p_founded_on); $$;
revoke all on function public.register_brand(text,text,text,text,date) from public, anon;
grant execute on function public.register_brand(text,text,text,text,date) to authenticated;
