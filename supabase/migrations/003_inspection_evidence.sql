-- Inspection-specific verified evidence bucket, completely isolated from general owner documents.
create or replace function public.can_read_inspection(iid uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.inspections i where i.id=iid and
 (public.owner_or_admin(i.property_id) or i.agent_id=(select auth.uid())));
$$;
create or replace function public.can_write_inspection(iid uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.inspections i where i.id=iid and i.status in ('requested','scheduled') and
 (public.is_admin() or i.agent_id=(select auth.uid())));
$$;
create or replace function public.add_inspection_check(iid uuid, checked_area text, checked_condition text, checked_notes text)
returns void language plpgsql security definer set search_path=public as $$
declare pid uuid;
begin
 if not public.can_write_inspection(iid) then raise exception 'Not authorized';end if;
 if checked_area not in ('entrance','living_room','kitchen','bathroom','bedrooms','windows','doors','electricity','plumbing','general')
 or checked_condition not in ('good','attention','critical','not_checked') then raise exception 'Invalid checklist entry';end if;
 select property_id into pid from public.inspections where id=iid;
 insert into public.inspection_checklists(inspection_id,area,condition,notes)
 values(iid,checked_area,checked_condition,left(coalesce(checked_notes,''),1000))
 on conflict(inspection_id,area) do update set condition=excluded.condition,notes=excluded.notes;
 insert into public.activity_logs(actor_id,property_id,action,entity_type,entity_id)
 values(auth.uid(),pid,'checklist_recorded','inspection',iid);
end $$;
revoke all on function public.add_inspection_check(uuid,text,text,text) from public,anon;
grant execute on function public.add_inspection_check(uuid,text,text,text) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('inspection-evidence','inspection-evidence',false,10485760,ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
 on conflict(id) do nothing;
create policy evidence_select on storage.objects for select to authenticated using(
 bucket_id='inspection-evidence' and public.can_read_inspection((storage.foldername(name))[1]::uuid));
create policy evidence_insert on storage.objects for insert to authenticated with check(
 bucket_id='inspection-evidence' and public.can_write_inspection((storage.foldername(name))[1]::uuid));
create policy evidence_delete on storage.objects for delete to authenticated using(
 bucket_id='inspection-evidence' and public.can_write_inspection((storage.foldername(name))[1]::uuid));
-- For evidence metadata, only if inspector/admin can write; owner can read.
drop policy if exists media_read on public.inspection_media;
create policy media_read on public.inspection_media for select to authenticated using(public.can_read_inspection(inspection_id));
create policy media_insert on public.inspection_media for insert to authenticated with check(public.can_write_inspection(inspection_id));
-- Restrict authenticated file object enumeration through RLS. Filenames are not public URLs.
-- Require all checklist areas + one evidence file before an inspection can be declared complete.
create or replace function public.finalize_inspection(iid uuid, report text) returns void
language plpgsql security definer set search_path=public as $$
declare rec public.inspections%rowtype;
begin
 select * into rec from public.inspections where id=iid for update;
 if not found or rec.status in ('completed','cancelled') then raise exception 'Invalid inspection';end if;
 if not (public.is_admin() or rec.agent_id=auth.uid()) then raise exception 'Access denied';end if;
 if length(trim(coalesce(report,'')))<5 then raise exception 'Provide actual findings';end if;
 if (select count(*) from public.inspection_checklists where inspection_id=iid) <> 10 then
 raise exception 'All 10 checklist areas must be reviewed before completion';
 end if;
 if not exists (select 1 from public.inspection_media where inspection_id=iid) then
 raise exception 'Add actual inspection evidence before completion';
 end if;
 update public.inspections set findings=report,completed_at=now(),status='completed' where id=iid;
 insert into public.activity_logs(actor_id,property_id,action,entity_type,entity_id)
 values(auth.uid(),rec.property_id,'inspection_completed','inspection',iid);
end $$;
revoke all on function public.finalize_inspection(uuid,text) from public,anon;
grant execute on function public.finalize_inspection(uuid,text) to authenticated;
