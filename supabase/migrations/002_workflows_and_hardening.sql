-- Scope inspection access, protect owner financial/private records and enforce transitions.
create or replace function public.can_view_property(pid uuid) returns boolean language sql stable security definer set search_path=public as $$
 select public.is_admin() or exists(select 1 from public.properties p where p.id=pid and
 (p.owner_id=(select auth.uid()) or p.assigned_agent_id=(select auth.uid()) or exists(
 select 1 from public.inspections i where i.property_id=p.id and i.agent_id=(select auth.uid()))));
$$;
create or replace function public.owner_or_admin(pid uuid) returns boolean language sql stable security definer set search_path=public as $$
 select public.is_admin() or public.owns_property(pid);
$$;
-- A field agent needs property address and inspection reports, NOT financial/tenant/ownership records.
drop policy if exists tenants_read on public.tenants;
create policy tenants_read on public.tenants for select to authenticated using(public.owner_or_admin(property_id));
drop policy if exists contracts_read on public.rental_contracts;
create policy contracts_read on public.rental_contracts for select to authenticated using(public.owner_or_admin(property_id));
drop policy if exists rent_read on public.rent_payments;
create policy rent_read on public.rent_payments for select to authenticated using(public.owner_or_admin(property_id));
drop policy if exists expense_read on public.expenses;
create policy expense_read on public.expenses for select to authenticated using(public.owner_or_admin(property_id));
drop policy if exists documents_read on public.documents;
create policy documents_read on public.documents for select to authenticated using(public.owner_or_admin(property_id));
drop policy if exists request_read on public.maintenance_requests;
create policy request_read on public.maintenance_requests for select to authenticated using(
 public.can_view_property(property_id) or public.assigned_provider(id));
drop policy if exists providers_read on public.service_providers;
create policy providers_read on public.service_providers for select to authenticated using(
 public.is_admin() or profile_id=(select auth.uid()) or exists(
 select 1 from public.service_assignments sa join public.maintenance_requests mr on mr.id=sa.request_id
 where sa.provider_id=id and public.owns_property(mr.property_id)));
drop policy if exists inspection_read on public.inspections;
create policy inspection_read on public.inspections for select to authenticated using(
 public.can_view_property(property_id) or agent_id=(select auth.uid()));
drop policy if exists checks_read on public.inspection_checklists;
create policy checks_read on public.inspection_checklists for select to authenticated using(
 exists(select 1 from public.inspections i where i.id=inspection_id and
 (public.can_view_property(i.property_id) or i.agent_id=(select auth.uid()))));
drop policy if exists media_read on public.inspection_media;
create policy media_read on public.inspection_media for select to authenticated using(
 exists(select 1 from public.inspections i where i.id=inspection_id and
 (public.can_view_property(i.property_id) or i.agent_id=(select auth.uid()))));
-- Don't expose arbitrary owner documents to agents using the signed URL generation path.
drop policy if exists file_read on storage.objects;
create policy file_read on storage.objects for select to authenticated using(
 bucket_id='property-files' and public.owner_or_admin((storage.foldername(name))[2]::uuid));

create or replace function public.advance_maintenance(rid uuid,next_state text) returns void
language plpgsql security definer set search_path=public as $$
declare rec public.maintenance_requests%rowtype; allowed boolean:=false;
begin
 select * into rec from public.maintenance_requests where id=rid for update;
 if not found then raise exception 'Request not found';end if;
 if next_state='reviewed' and rec.status='submitted' and public.is_admin() then allowed:=true;end if;
 if next_state='in_progress' and rec.status='approved' and
 (public.is_admin() or public.assigned_provider(rid)) and
 exists(select 1 from public.maintenance_quotes where request_id=rid and status='approved') then allowed:=true;end if;
 if next_state='completed' and rec.status='in_progress' and (public.is_admin() or public.assigned_provider(rid)) then allowed:=true;end if;
 if next_state='closed' and rec.status='completed' and public.owns_property(rec.property_id) then allowed:=true;end if;
 if not allowed then raise exception 'Invalid or unauthorized state transition';end if;
 update public.maintenance_requests set status=next_state,updated_at=now() where id=rid;
 insert into public.activity_logs(actor_id,property_id,action,entity_type,entity_id)
 values(auth.uid(),rec.property_id,'state_'||next_state,'maintenance_request',rid);
end $$;
revoke all on function public.advance_maintenance(uuid,text) from public,anon;
grant execute on function public.advance_maintenance(uuid,text) to authenticated;

-- Notify owners after a real quotation enters the database.
create or replace function public.on_quote_created() returns trigger language plpgsql security definer set search_path=public as $$
declare pid uuid;
begin
 select property_id into pid from public.maintenance_requests where id=new.request_id;
 insert into public.notifications(user_id,title,body)
 select p.owner_id,'New maintenance quote','A new quote of '||new.amount||' MAD is waiting for review.'
 from public.properties p where p.id=pid;
 return new;
end $$;
create trigger trg_new_quote after insert on public.maintenance_quotes for each row execute function public.on_quote_created();
create or replace function public.on_inspection_completed() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.status='completed' and old.status is distinct from new.status then
 insert into public.notifications(user_id,title,body)
 select owner_id,'Inspection completed','New verified findings are available for your property.'
 from public.properties where id=new.property_id;
 end if; return new;
end $$;
create trigger trg_inspection_notice after update on public.inspections for each row execute function public.on_inspection_completed();

-- Prevent client edit to history and privileged statuses via RLS or columns.
-- Before launch, add stronger document category-level separation, field media upload workflow and verified finance receipts.
