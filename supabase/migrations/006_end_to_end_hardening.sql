-- Migration 006 — End-to-end hardening, itemized quotes, emergency limits, manual payments & document verification
-- Safe to re-run in Supabase SQL editor.

-- 1. Detailed quotes columns on maintenance_quotes
alter table public.maintenance_quotes
  add column if not exists labor_amount numeric(12,2) default 0 check(labor_amount >= 0),
  add column if not exists materials_amount numeric(12,2) default 0 check(materials_amount >= 0),
  add column if not exists tax_amount numeric(12,2) default 0 check(tax_amount >= 0),
  add column if not exists coordination_fee_mad numeric(12,2) default 0 check(coordination_fee_mad >= 0),
  add column if not exists exclusions text,
  add column if not exists valid_until timestamptz;

-- 2. Emergency authorization, spending limits & co-ownership details on properties
alter table public.properties
  add column if not exists emergency_authorized boolean not null default false,
  add column if not exists emergency_limit_mad numeric(12,2) not null default 0 check(emergency_limit_mad >= 0),
  add column if not exists co_owner_names text,
  add column if not exists representative_contact text,
  add column if not exists access_authorization_notes text,
  add column if not exists verification_status text not null default 'pending';

-- 3. Document categorization, verification flags & distinction (Title Deed vs Utility Bill)
alter table public.documents
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists is_title_deed boolean not null default false,
  add column if not exists verified_at timestamptz,
  add column if not exists verification_note text;

-- 4. Inspection cancellation / rescheduling audit fields
alter table public.inspections
  add column if not exists cancellation_reason text,
  add column if not exists scheduled_notes text;

-- 5. Manual Payments Tracking Table (Offline bank transfer, Wafa Cash, Cash agency, Card)
create table if not exists public.manual_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  quote_id uuid references public.maintenance_quotes(id) on delete set null,
  payment_type text not null default 'subscription' check(payment_type in ('subscription', 'maintenance_quote', 'management_fee', 'other')),
  amount numeric(12,2) not null check(amount > 0),
  method text not null default 'bank_transfer' check(method in ('bank_transfer', 'cash_agency', 'cmi_card', 'wafa_cash', 'other')),
  status text not null default 'pending' check(status in ('pending', 'confirmed', 'failed', 'refunded')),
  reference_code text,
  proof_path text,
  notes text,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Enable RLS on manual_payments
alter table public.manual_payments enable row level security;

create policy manual_payments_owner_select on public.manual_payments
  for select to authenticated
  using (
    public.is_admin()
    or owner_id = (select auth.uid())
  );

create policy manual_payments_owner_insert on public.manual_payments
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    or public.is_admin()
  );

create policy manual_payments_admin_update on public.manual_payments
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 7. Indexes for manual payments
create index if not exists idx_manual_payments_owner on public.manual_payments(owner_id);
create index if not exists idx_manual_payments_status on public.manual_payments(status);
create index if not exists idx_manual_payments_property on public.manual_payments(property_id);

-- 8. Grants
grant select, insert, update on public.manual_payments to authenticated;
