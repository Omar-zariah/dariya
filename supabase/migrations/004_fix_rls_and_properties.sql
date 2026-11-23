-- Fix properties RLS and ensure dependencies are in place
-- Run this in your Supabase SQL Editor if you encounter RLS or missing function errors.

-- 1. Ensure owner_or_admin exists (defined in 002)
create or replace function public.owner_or_admin(pid uuid) returns boolean language sql stable security definer set search_path=public as $$
  select public.is_admin() or public.owns_property(pid);
$$;

-- 2. Optimize and fix properties_read policy
-- Avoids self-referential subquery during INSERT ... RETURNING which triggers:
-- "new row violates row-level security policy for table properties"
drop policy if exists properties_read on public.properties;
create policy properties_read on public.properties for select to authenticated using (
  owner_id = (select auth.uid()) or
  assigned_agent_id = (select auth.uid()) or
  public.is_admin() or
  exists (
    select 1 from public.inspections i 
    where i.property_id = public.properties.id and i.agent_id = (select auth.uid())
  ) or
  exists (
    select 1 from public.maintenance_requests mr
    join public.service_assignments sa on sa.request_id = mr.id
    join public.service_providers sp on sp.id = sa.provider_id
    where mr.property_id = public.properties.id and sp.profile_id = (select auth.uid())
  )
);

-- 3. Ensure properties_insert policy is robust
drop policy if exists properties_insert on public.properties;
create policy properties_insert on public.properties for insert to authenticated with check (
  (owner_id = (select auth.uid()) and status = 'pending_verification' and assigned_agent_id is null) 
  or public.is_admin()
);
