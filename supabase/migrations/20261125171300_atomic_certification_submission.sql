-- Submit the application and its evidence metadata atomically after Storage uploads succeed.
create or replace function private.submit_certification_application(
  p_application_id uuid,
  p_brand_id uuid,
  p_manufacturer text,
  p_full_model_name text,
  p_model_number text,
  p_release_date date,
  p_nit_value numeric,
  p_lux_value numeric,
  p_test_video_path text,
  p_test_method_notes text,
  p_assets jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  asset_count integer;
  has_video boolean;
  has_evidence boolean;
  valid_assets boolean;
begin
  if actor_id is null then raise exception 'Authentication required'; end if;
  if not private.is_brand_member(p_brand_id) then raise exception 'Brand membership required'; end if;
  if not exists (select 1 from public.brands b where b.id=p_brand_id and b.status='verified' and b.bsc_code is not null) then
    raise exception 'A verified brand with an active BSC code is required';
  end if;
  if nullif(trim(p_manufacturer),'') is null or nullif(trim(p_full_model_name),'') is null
     or nullif(trim(p_test_method_notes),'') is null or p_nit_value <= 0 or p_lux_value <= 0 then
    raise exception 'Required certification measurements and notes are missing';
  end if;
  if p_test_video_path is null or p_test_video_path not like actor_id::text || '/' || p_application_id::text || '/%' then
    raise exception 'Invalid test video storage path';
  end if;
  if jsonb_typeof(p_assets) <> 'array' then raise exception 'Evidence list must be an array'; end if;

  select count(*),
         coalesce(bool_or(item->>'asset_type'='test_video'),false),
         coalesce(bool_or(item->>'asset_type'='supporting_file'),false),
         coalesce(bool_and(
           item->>'application_id'=p_application_id::text
           and item->>'uploaded_by'=actor_id::text
           and item->>'storage_path' like actor_id::text || '/' || p_application_id::text || '/%'
           and (item->>'file_size_bytes')::bigint between 1 and 52428800
           and item->>'asset_type' in ('test_video','supporting_file')
         ),false)
    into asset_count,has_video,has_evidence,valid_assets
    from jsonb_array_elements(p_assets) item;

  if asset_count < 2 or asset_count > 13 or not has_video or not has_evidence or not valid_assets then
    raise exception 'Evidence metadata is incomplete or invalid';
  end if;
  if not exists (select 1 from jsonb_array_elements(p_assets) item where item->>'asset_type'='test_video' and item->>'storage_path'=p_test_video_path) then
    raise exception 'The test video metadata does not match the application';
  end if;

  insert into public.certification_applications(
    id,brand_id,submitted_by,manufacturer,full_model_name,model_number,release_date,
    nit_value,lux_value,test_video_path,test_method_notes,status,
    archive_device_consent,archive_consent_at,submitted_at
  ) values (
    p_application_id,p_brand_id,actor_id,trim(p_manufacturer),trim(p_full_model_name),nullif(trim(p_model_number),''),p_release_date,
    p_nit_value,p_lux_value,p_test_video_path,trim(p_test_method_notes),'submitted',true,now(),now()
  );

  insert into public.application_assets(
    application_id,asset_type,storage_path,original_filename,mime_type,file_size_bytes,uploaded_by,sort_order
  )
  select p_application_id,x.asset_type,x.storage_path,x.original_filename,x.mime_type,x.file_size_bytes,actor_id,x.sort_order
  from jsonb_to_recordset(p_assets) as x(
    application_id uuid,asset_type text,storage_path text,original_filename text,mime_type text,
    file_size_bytes bigint,uploaded_by uuid,sort_order integer
  );

  return p_application_id;
end;
$$;
revoke all on function private.submit_certification_application(uuid,uuid,text,text,text,date,numeric,numeric,text,text,jsonb) from public, anon;
grant execute on function private.submit_certification_application(uuid,uuid,text,text,text,date,numeric,numeric,text,text,jsonb) to authenticated;

create or replace function public.submit_certification_application(
  p_application_id uuid,p_brand_id uuid,p_manufacturer text,p_full_model_name text,p_model_number text,
  p_release_date date,p_nit_value numeric,p_lux_value numeric,p_test_video_path text,p_test_method_notes text,p_assets jsonb
)
returns uuid
language sql
security invoker
set search_path = public
as $$ select private.submit_certification_application(p_application_id,p_brand_id,p_manufacturer,p_full_model_name,p_model_number,p_release_date,p_nit_value,p_lux_value,p_test_video_path,p_test_method_notes,p_assets); $$;
revoke all on function public.submit_certification_application(uuid,uuid,text,text,text,date,numeric,numeric,text,text,jsonb) from public, anon;
grant execute on function public.submit_certification_application(uuid,uuid,text,text,text,date,numeric,numeric,text,text,jsonb) to authenticated;
