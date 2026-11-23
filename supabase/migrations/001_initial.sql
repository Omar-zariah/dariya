-- DARIYA MVP — run in Supabase SQL editor on a NEW project.
-- Default roles are NEVER assigned by user input. Admin/agent/provider promotion is manual.
create extension if not exists pgcrypto;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', phone text, country text,
  language text not null default 'fr' check(language in ('fr','en','ar')),
  role text not null default 'owner' check(role in ('owner','admin','agent','provider')),
  created_at timestamptz not null default now()
);
create or replace function public.on_user_created() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,full_name,phone,country,language,role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''),new.raw_user_meta_data->>'phone',new.raw_user_meta_data->>'country',
    case when new.raw_user_meta_data->>'language' in ('fr','en','ar') then new.raw_user_meta_data->>'language' else 'fr' end,'owner');
  return new;
end $$;
create trigger trg_auth_profile after insert on auth.users for each row execute function public.on_user_created();

create table public.properties (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id),
 assigned_agent_id uuid references public.profiles(id), name text not null,
 property_type text not null default 'apartment' check(property_type in ('apartment','house','villa','other')),
 city text not null default 'Tangier', address text not null,
 bedrooms integer not null default 0 check(bedrooms>=0), surface_m2 numeric(10,2) check(surface_m2>=0),
 occupancy text not null default 'vacant' check(occupancy in ('vacant','occupied','owner_used')),
 status text not null default 'pending_verification' check(status in ('pending_verification','active','paused')),
 created_at timestamptz not null default now()
);
create table public.property_images (
 id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
 storage_path text not null unique, caption text, created_at timestamptz not null default now()
);
create table public.tenants (
 id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
 full_name text not null, email text, phone text, created_at timestamptz not null default now()
);
create table public.rental_contracts (
 id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
 tenant_id uuid not null references public.tenants(id) on delete cascade,
 start_date date not null, end_date date, monthly_rent numeric(12,2) not null check(monthly_rent>=0),
 status text not null default 'active' check(status in ('draft','active','ended')),
 created_at timestamptz not null default now(), check(end_date is null or end_date>=start_date)
);
create table public.rent_payments (
 id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
 contract_id uuid references public.rental_contracts(id), amount numeric(12,2) not null check(amount>0),
 received_on date not null, reference text, note text, created_at timestamptz not null default now()
);
create table public.expenses (
 id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
 category text not null default 'other' check(category in ('maintenance','utility','fee','cleaning','other')),
 amount numeric(12,2) not null check(amount>=0), incurred_on date not null, note text,
 created_at timestamptz not null default now()
);
create table public.maintenance_requests (
 id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
 created_by uuid not null references public.profiles(id), category text not null, title text not null, description text not null,
 priority text not null default 'normal' check(priority in ('low','normal','urgent')),
 status text not null default 'submitted' check(status in ('submitted','reviewed','quoted','approved','in_progress','completed','closed','rejected')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.service_providers (
 id uuid primary key default gen_random_uuid(), profile_id uuid unique references public.profiles(id),
 business_name text not null, specialty text not null, contact_phone text,
 verified boolean not null default false, created_at timestamptz not null default now()
);
create table public.service_assignments (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.maintenance_requests(id) on delete cascade,
 provider_id uuid not null references public.service_providers(id), assigned_at timestamptz not null default now(),
 unique(request_id,provider_id)
);
create table public.maintenance_quotes (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.maintenance_requests(id) on delete cascade,
 provider_id uuid references public.service_providers(id), amount numeric(12,2) not null check(amount>=0),
 scope text not null, status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(), decided_at timestamptz
);
create table public.inspections (
 id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
 agent_id uuid references public.profiles(id), inspection_type text not null default 'basic',
 scheduled_for date, completed_at timestamptz, findings text,
 status text not null default 'requested' check(status in ('requested','scheduled','completed','cancelled')),
 requested_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create table public.inspection_checklists (
 id uuid primary key default gen_random_uuid(), inspection_id uuid not null references public.inspections(id) on delete cascade,
 area text not null, condition text not null check(condition in ('good','attention','critical','not_checked')),
 notes text, unique(inspection_id,area)
);
create table public.inspection_media (
 id uuid primary key default gen_random_uuid(), inspection_id uuid not null references public.inspections(id) on delete cascade,
 storage_path text not null unique, caption text
);
create table public.documents (
 id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
 storage_path text not null unique, filename text not null, category text not null default 'other',
 uploaded_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create table public.subscription_plans (
 id text primary key, name text not null, monthly_mad numeric(12,2), percent_of_collected_rent numeric(5,2),
 details text not null, is_active boolean not null default true
);
insert into public.subscription_plans(id,name,monthly_mad,percent_of_collected_rent,details) values
 ('basic','Basic',99,null,'Dashboard, expenses, documents, requests, monthly summary'),
 ('care','Care',249,null,'Basic plus quarterly physical inspection and coordination'),
 ('full','Full management',null,10,'Illustrative rate: configurable 8–12% of collected rent');
create table public.subscriptions (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), property_id uuid references public.properties(id),
 plan_id text not null references public.subscription_plans(id),
 status text not null default 'proposed' check(status in ('proposed','active','cancelled','expired')),
 created_at timestamptz not null default now()
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
 title text not null, body text not null, read_at timestamptz, created_at timestamptz not null default now()
);
create table public.support_tickets (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
 subject text not null, body text not null, status text not null default 'open' check(status in ('open','in_progress','resolved')),
 created_at timestamptz not null default now()
);
create table public.activity_logs (
 id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id),
 property_id uuid references public.properties(id), action text not null, entity_type text not null,
 entity_id uuid, details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index on public.properties(owner_id);
create index on public.maintenance_requests(property_id);
create index on public.maintenance_quotes(request_id);
create index on public.inspections(property_id);
create index on public.expenses(property_id,incurred_on);
create index on public.rent_payments(property_id,received_on);
create index on public.documents(property_id);
create index on public.notifications(user_id,created_at);

-- Security definer helpers are scoped and hardened; only return booleans / UUIDs.
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin');
$$;
create or replace function public.can_view_property(pid uuid) returns boolean language sql stable security definer set search_path=public as $$
 select public.is_admin() or exists(select 1 from public.properties p where p.id=pid and
 (p.owner_id=(select auth.uid()) or p.assigned_agent_id=(select auth.uid()) or exists(
 select 1 from public.maintenance_requests mr join public.service_assignments sa on sa.request_id=mr.id
 join public.service_providers sp on sp.id=sa.provider_id
 where mr.property_id=p.id and sp.profile_id=(select auth.uid()) )));
$$;
create or replace function public.owns_property(pid uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.properties where id=pid and owner_id=(select auth.uid()));
$$;
create or replace function public.assigned_provider(rid uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.service_assignments sa join public.service_providers sp on sp.id=sa.provider_id
 where sa.request_id=rid and sp.profile_id=(select auth.uid()) and sp.verified);
$$;
create or replace function public.property_owner(pid uuid) returns uuid language sql stable security definer set search_path=public as $$
 select owner_id from public.properties where id=pid;
$$;
revoke all on function public.property_owner(uuid) from public,anon,authenticated; -- helper for internal authenticated storage checks only
-- App helpers used inside RLS.

alter table public.profiles enable row level security;
create policy profile_read on public.profiles for select to authenticated using(id=(select auth.uid()) or public.is_admin());
create policy profile_update_self on public.profiles for update to authenticated using(id=(select auth.uid()) or public.is_admin()) with check(id=(select auth.uid()) or public.is_admin());
-- Crucial: column restrictions stop owner from changing role or profile id via API.
revoke update on public.profiles from authenticated;
grant update(full_name,phone,country,language) on public.profiles to authenticated;

alter table public.properties enable row level security;
create policy properties_read on public.properties for select to authenticated using(public.can_view_property(id));
create policy properties_insert on public.properties for insert to authenticated with check(owner_id=(select auth.uid()) and status='pending_verification' and assigned_agent_id is null or public.is_admin());
create policy properties_update on public.properties for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy properties_delete on public.properties for delete to authenticated using(public.is_admin());

-- Tables keyed by property ID: owners read only their property data; admin staff may operate.
alter table public.property_images enable row level security;
create policy photos_read on public.property_images for select to authenticated using(public.can_view_property(property_id));
create policy photos_insert on public.property_images for insert to authenticated with check(public.owns_property(property_id) or public.is_admin());
create policy photos_delete on public.property_images for delete to authenticated using(public.owns_property(property_id) or public.is_admin());
alter table public.tenants enable row level security;
create policy tenants_read on public.tenants for select to authenticated using(public.can_view_property(property_id));
create policy tenants_admin on public.tenants for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.rental_contracts enable row level security;
create policy contracts_read on public.rental_contracts for select to authenticated using(public.can_view_property(property_id));
create policy contracts_admin on public.rental_contracts for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.rent_payments enable row level security;
create policy rent_read on public.rent_payments for select to authenticated using(public.can_view_property(property_id));
create policy rent_admin on public.rent_payments for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.expenses enable row level security;
create policy expense_read on public.expenses for select to authenticated using(public.can_view_property(property_id));
create policy expense_admin on public.expenses for all to authenticated using(public.is_admin()) with check(public.is_admin());

alter table public.maintenance_requests enable row level security;
create policy request_read on public.maintenance_requests for select to authenticated using(public.can_view_property(property_id));
create policy request_create on public.maintenance_requests for insert to authenticated with check(
 created_by=(select auth.uid()) and status='submitted' and (public.owns_property(property_id) or public.is_admin()));
create policy request_admin_update on public.maintenance_requests for update to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.service_providers enable row level security;
create policy providers_read on public.service_providers for select to authenticated using(public.is_admin() or profile_id=(select auth.uid()) or verified);
create policy providers_admin on public.service_providers for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.service_assignments enable row level security;
create policy assignment_read on public.service_assignments for select to authenticated using(
 public.is_admin() or public.assigned_provider(request_id) or exists(
 select 1 from public.maintenance_requests r where r.id=request_id and public.owns_property(r.property_id)));
create policy assignment_admin on public.service_assignments for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.maintenance_quotes enable row level security;
create policy quotes_read on public.maintenance_quotes for select to authenticated using(
 public.is_admin() or public.assigned_provider(request_id) or exists(
 select 1 from public.maintenance_requests r where r.id=request_id and public.owns_property(r.property_id)));
create policy quotes_admin_write on public.maintenance_quotes for insert to authenticated with check(public.is_admin());
create policy quotes_provider_write on public.maintenance_quotes for insert to authenticated with check(
 status='pending' and public.assigned_provider(request_id) and
 exists(select 1 from public.service_assignments sa join public.service_providers sp on sa.provider_id=sp.id
 where sa.request_id=request_id and sa.provider_id=provider_id and sp.profile_id=(select auth.uid())));

alter table public.inspections enable row level security;
create policy inspection_read on public.inspections for select to authenticated using(public.can_view_property(property_id));
create policy inspection_create on public.inspections for insert to authenticated with check(
 status='requested' and requested_by=(select auth.uid()) and (public.owns_property(property_id) or public.is_admin()));
create policy inspection_admin_update on public.inspections for update to authenticated using(public.is_admin()) with check(public.is_admin());
-- Agents finalize inspections through scoped RPC, not broad table updates.
alter table public.inspection_checklists enable row level security;
create policy checks_read on public.inspection_checklists for select to authenticated using(
 exists(select 1 from public.inspections i where i.id=inspection_id and public.can_view_property(i.property_id)));
create policy checks_admin_write on public.inspection_checklists for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.inspection_media enable row level security;
create policy media_read on public.inspection_media for select to authenticated using(
 exists(select 1 from public.inspections i where i.id=inspection_id and public.can_view_property(i.property_id)));
create policy media_admin_write on public.inspection_media for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.documents enable row level security;
create policy documents_read on public.documents for select to authenticated using(public.can_view_property(property_id));
create policy documents_create on public.documents for insert to authenticated with check(uploaded_by=(select auth.uid()) and public.owns_property(property_id) or public.is_admin());
create policy documents_delete on public.documents for delete to authenticated using(public.owns_property(property_id) or public.is_admin());

alter table public.subscription_plans enable row level security;
create policy plan_read on public.subscription_plans for select to anon,authenticated using(is_active or public.is_admin());
create policy plan_admin on public.subscription_plans for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.subscriptions enable row level security;
create policy subscription_read on public.subscriptions for select to authenticated using(owner_id=(select auth.uid()) or public.is_admin());
create policy subscription_admin on public.subscriptions for all to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.notifications enable row level security;
create policy notifications_read on public.notifications for select to authenticated using(user_id=(select auth.uid()) or public.is_admin());
create policy notifications_admin on public.notifications for insert to authenticated with check(public.is_admin());
alter table public.support_tickets enable row level security;
create policy support_read on public.support_tickets for select to authenticated using(user_id=(select auth.uid()) or public.is_admin());
create policy support_create on public.support_tickets for insert to authenticated with check(user_id=(select auth.uid()) and status='open');
create policy support_admin on public.support_tickets for update to authenticated using(public.is_admin()) with check(public.is_admin());
alter table public.activity_logs enable row level security;
create policy logs_read on public.activity_logs for select to authenticated using(public.is_admin() or (property_id is not null and public.owns_property(property_id)));
-- Logs are only written inside audited SECURITY DEFINER functions/triggers, not by arbitrary clients.

create or replace function public.audit_property_events() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.activity_logs(actor_id,property_id,action,entity_type,entity_id)
 values(auth.uid(), coalesce(new.property_id, old.property_id),tg_op,tg_table_name,coalesce(new.id,old.id));
 return coalesce(new,old);
end $$;
create trigger audit_request after insert or update on public.maintenance_requests for each row execute function public.audit_property_events();
create trigger audit_inspection after insert or update on public.inspections for each row execute function public.audit_property_events();
create trigger audit_expense after insert on public.expenses for each row execute function public.audit_property_events();
create trigger audit_rent after insert on public.rent_payments for each row execute function public.audit_property_events();

-- Only property owners may decide on pending quotes, atomically.
create or replace function public.decide_maintenance_quote(qid uuid, decision text) returns void
language plpgsql security definer set search_path=public as $$
declare rid uuid; pid uuid;
begin
 if decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
 select q.request_id,r.property_id into rid,pid from public.maintenance_quotes q
 join public.maintenance_requests r on r.id=q.request_id where q.id=qid and q.status='pending' for update of q;
 if rid is null then raise exception 'Quotation not pending'; end if;
 if not public.owns_property(pid) then raise exception 'Access denied'; end if;
 if decision='approved' and exists(select 1 from public.maintenance_quotes where request_id=rid and status='approved') then
 raise exception 'A quotation is already approved for this request';end if;
 update public.maintenance_quotes set status=decision,decided_at=now() where id=qid;
 update public.maintenance_requests set status=case when decision='approved' then 'approved' else 'reviewed' end,
 updated_at=now() where id=rid;
 insert into public.activity_logs(actor_id,property_id,action,entity_type,entity_id,details)
 values(auth.uid(),pid,'quote_'||decision,'maintenance_quote',qid,jsonb_build_object('decision',decision));
end $$;
revoke all on function public.decide_maintenance_quote(uuid,text) from public,anon;
grant execute on function public.decide_maintenance_quote(uuid,text) to authenticated;

-- Authorized admin or assigned inspector may publish real findings.
create or replace function public.finalize_inspection(iid uuid, report text) returns void
language plpgsql security definer set search_path=public as $$
declare rec public.inspections%rowtype;
begin
 select * into rec from public.inspections where id=iid for update;
 if not found or rec.status in ('completed','cancelled') then raise exception 'Invalid inspection';end if;
 if not (public.is_admin() or rec.agent_id=auth.uid()) then raise exception 'Access denied';end if;
 if length(trim(coalesce(report,'')))<5 then raise exception 'Provide actual findings';end if;
 update public.inspections set findings=report,completed_at=now(),status='completed' where id=iid;
 insert into public.activity_logs(actor_id,property_id,action,entity_type,entity_id)
 values(auth.uid(),rec.property_id,'inspection_completed','inspection',iid);
end $$;
revoke all on function public.finalize_inspection(uuid,text) from public,anon;
grant execute on function public.finalize_inspection(uuid,text) to authenticated;

-- Private storage. Owner uploads under own UUID and property UUID, only if property belongs to them.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('property-files','property-files',false,10485760,ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do nothing;
create policy file_read on storage.objects for select to authenticated using(
 bucket_id='property-files' and public.can_view_property((storage.foldername(name))[2]::uuid));
create policy file_upload on storage.objects for insert to authenticated with check(
 bucket_id='property-files' and (storage.foldername(name))[1]=auth.uid()::text
 and public.owns_property((storage.foldername(name))[2]::uuid));
create policy file_delete on storage.objects for delete to authenticated using(
 bucket_id='property-files' and (storage.foldername(name))[1]=auth.uid()::text
 and public.owns_property((storage.foldername(name))[2]::uuid));
-- Next: restrict document categories by role; review signed-link issuance and legal/privacy obligations pre-pilot.
