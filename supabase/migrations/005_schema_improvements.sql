-- Migration 005 — Schema improvements, missing columns, performance indexes
-- Run in Supabase SQL Editor AFTER 001, 002, 003, 004.
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE patterns).

-- 1. Add rating column to service_providers (referenced in provider dashboard)
alter table public.service_providers
  add column if not exists rating numeric(3,1) check(rating >= 1 and rating <= 5),
  add column if not exists notes text;

-- 2. Add rejection_reason to properties (for owner verification workflow)
alter table public.properties
  add column if not exists rejection_reason text,
  add column if not exists verification_notes text;

-- 3. Add contract end date tracking automation helper: mark contracts ended
--    when end_date is past. This is a helper view, not an automated trigger
--    (automated jobs require pg_cron or edge function, see Milestone 2).
create or replace view public.active_contracts as
  select * from public.rental_contracts
  where status = 'active' and (end_date is null or end_date >= current_date);

-- 4. Add a monthly_overrides table for utility bills tracked separately
create table if not exists public.utility_bills (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  period_month text not null check(period_month ~ '^\d{4}-\d{2}$'),
  category text not null default 'electricity' check(category in ('electricity','water','gas','syndic','internet','other')),
  amount numeric(12,2) not null check(amount >= 0),
  reference text,
  note text,
  receipt_path text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 5. RLS for utility_bills (owner reads own, admin full)
alter table public.utility_bills enable row level security;

create policy utility_bills_owner_read on public.utility_bills
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.properties p
      where p.id = utility_bills.property_id
        and p.owner_id = (select auth.uid())
    )
  );

create policy utility_bills_admin_write on public.utility_bills
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 6. Performance indexes
create index if not exists idx_maintenance_requests_property on public.maintenance_requests(property_id);
create index if not exists idx_maintenance_requests_status on public.maintenance_requests(status);
create index if not exists idx_inspections_agent on public.inspections(agent_id);
create index if not exists idx_inspections_property on public.inspections(property_id);
create index if not exists idx_rent_payments_property on public.rent_payments(property_id);
create index if not exists idx_expenses_property on public.expenses(property_id);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, read_at)
  where read_at is null;
create index if not exists idx_activity_logs_property on public.activity_logs(property_id);
create index if not exists idx_activity_logs_actor on public.activity_logs(actor_id);

-- 7. Grant view access
grant select on public.active_contracts to authenticated;
grant select, insert on public.utility_bills to authenticated;

