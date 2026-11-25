-- Scope private data policies to authenticated users and hoist stable auth checks out of row loops.
do $$
declare
  policy_row record;
  policy_roles text;
  policy_using text;
  policy_check text;
  statement text;
begin
  for policy_row in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
  loop
    policy_using := policy_row.qual;
    policy_check := policy_row.with_check;
    if policy_using is not null then
      policy_using := replace(policy_using, 'auth.uid()', '(select auth.uid())');
      policy_using := replace(policy_using, 'public.is_admin()', '(select public.is_admin())');
    end if;
    if policy_check is not null then
      policy_check := replace(policy_check, 'auth.uid()', '(select auth.uid())');
      policy_check := replace(policy_check, 'public.is_admin()', '(select public.is_admin())');
    end if;

    if policy_row.policyname in (
      'Public read verified brands',
      'Active certificates are public',
      'Devices are publicly readable',
      'Public read non-secret settings',
      'Public registry reads applications for active certificates'
    ) then
      policy_roles := '';
    else
      policy_roles := ' TO authenticated';
    end if;

    statement := format('ALTER POLICY %I ON %I.%I%s', policy_row.policyname, policy_row.schemaname, policy_row.tablename, policy_roles);
    if policy_using is not null then statement := statement || format(' USING (%s)', policy_using); end if;
    if policy_check is not null then statement := statement || format(' WITH CHECK (%s)', policy_check); end if;
    execute statement;
  end loop;
end;
$$;
