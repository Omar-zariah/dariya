# DARIYA — Moroccan diaspora property platform (Antigravity starter)

**Status: real application starter, NOT production-ready.** This repo turns the supplied `MASTER-PRODUCT-BRIEF.txt` into an initial Next.js + Supabase application. The original offline Darna concept demo, strategy notes and financial scenarios are preserved in `legacy-prototype/`.

DARIYA = **Your home in Morocco. Managed from anywhere.** First pilot market: **Tangier**. This project is a property **management** service, not a listing marketplace.

## 1. Open in Google Antigravity

1. Download and unzip `DARIYA-Antigravity-MVP.zip` to a normal Windows folder.
2. In Antigravity: **New Project → Add Folder → choose `DARIYA-Antigravity` → Create**.
3. Open Antigravity terminal inside the project and run `npm install` (Node.js 20.9+ or 22+ required).
4. Copy `.env.example` as `.env.local` and set the Supabase variables.
5. Create a **fresh** Supabase project. Execute `supabase/migrations/001_initial.sql`, then `002_workflows_and_hardening.sql`, then `003_inspection_evidence.sql` in its SQL editor. Review migrations before applying to any database with existing data.
6. In Supabase Auth configure Site URL `http://localhost:3000`, confirmation/reset redirects at `http://localhost:3000/auth/callback`, and real email sending setup.
7. Run `npm run dev`, open [http://localhost:3000](http://localhost:3000). Sign up as an owner and confirm email if required.
8. Open `AGENTS.md` and `docs/ANTIGRAVITY-BUILD-PLAN.md` and paste the first-mission prompt into Antigravity.

> `.env.local` is local and ignored by Git. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is a public/publishable key, **never** a service_role or secret key. No credentials have been embedded in this ZIP.

### Before configuring Supabase
- The landing page displays but auth and user dashboards need Supabase.
- To explore the old interactive, entirely offline prototype: open `legacy-prototype/index.html`. Its fictional example data is stored in the browser. It is **not connected** to the new app or database.

## 2. Core features supplied in source

| Feature | Implemented in starter | Still needed before real pilot |
|---|---|---|
| Landing | Responsive branded layout; live plan prices when DB connected | Full FR/AR/EN copy, FAQ, accessibility QA |
| Auth | Supabase sign up/sign in/out, confirmation callback, password reset | Production email and rate-limit/security config |
| Roles | Owner/admin/agent/provider, server checks and RLS | User invitation, identity/professional vetting |
| Property | Register, view details and private photos, verification status | Legal ownership verification workflow |
| Maintenance | Owner tickets; admin/provider quotes; owner approve/reject; status transitions, confirmation close | Emergency authorizations, invoices, disputes, provider verification evidence |
| Inspections | Request, admin schedule, assigned agent/admin checklist, private evidence and verified findings | Photo metadata, full report PDF, visit QA, map scheduling |
| Rentals | Admin tenant register, contract record and confirmed rent entries | Due date automation, advanced contract workflows |
| Finances | Recorded income/expenses, net figures and downloadable CSV | Receipts, reconciling, PDF, charts |
| Documents | Private PDF/image uploads, protected files, signed download links | Doc review, retention, deletion, cross-border compliance |
| Pricing | Basic 99 MAD, Care 249 MAD, Full 10% starter configuration, admin edit | Financial/pricing validation, subscription billing |
| Notifications | Database-backed in-app notices for new quotes and completed inspections | Email/WhatsApp worker and delivery tracking |
| Support | Customer tickets, admin queue | Reply/resolution and escalation workflow |
| Languages | French default cookie, Arabic RTL and English base translations | Complete human-reviewed UI translations |
| AI | Product roadmap only | V3: verified record-grounded assistant |

## 3. Technical map

```text
src/app/                      Next.js routes, protected dashboards, auth and export
src/actions/                  Server actions with authenticated and validated mutations
src/components/               Reusable layout/fields/status components
src/lib/auth.ts               Server user/profile and role guards
src/lib/i18n.ts               FR/EN/AR translation base and locale number/date display
src/lib/supabase/             SSR cookie auth, browser client, session refresh
supabase/migrations/          RLS-enforced data structure, role policies, atomic RPCs
public/                       Local illustration
AGENTS.md                     Antigravity agent rules
docs/MASTER-PRODUCT-BRIEF.txt Original supplied detailed development brief
docs/ANTIGRAVITY-BUILD-PLAN.md Ordered implementation milestones
legacy-prototype/             Preserved original offline demo + strategy research
```

## 4. Initial admin/agent/provider setup

**Never allow users to choose `role` at registration.** Each account initially receives the `owner` role via an Auth trigger. After you create, validate and approve an internal test account, a **privileged Supabase administrator**, not public app code, can promote it in the SQL editor:

```sql
-- Example ONLY: replace with a known, explicitly trusted test account UUID
update public.profiles set role='admin' where id='00000000-0000-0000-0000-000000000000';
-- Assign one verified staff account agent and one verified contractor provider
-- analogously with role='agent' / role='provider'.
```

Use another account for owner testing; don't promote your only owner account if you want to see real owner flow. A provider also needs its `profile_id` linked in `service_providers` and a job assignment. Field agents are assigned to inspections by an admin.

## 5. Real-life safety and legal blockers

- **Do not invite paying customers until tested:** The code has not been deployed nor undergone external penetration testing, database RLS tests with separate accounts, or a legal review.
- **Property owner authorization:** `Mark verified` is an internal recording action; it cannot validate ownership on its own. Build the real KYC/authorization process and audit trail.
- **Physical inspections:** Documentation must originate from actual work. The code refuses a blank final report, but cannot independently prove a site visit.
- **Money:** There are NO payment gateways, funds collection, live subscriptions, automatic invoicing or WhatsApp delivery. Admin records transactions manually after actual confirmation.
- **Privacy:** Sensitive addresses, access details, tenant data and documents require policies, retention procedures, incident response, deletion and a Moroccan legal/privacy/CNDP review.
- **Financial models:** See `legacy-prototype/financials/` for *illustrative* assumptions only. Do not construe them as validated customer or market estimates.

## 6. Development checkpoints

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Run integration tests with a real **development** Supabase project. See `docs/ANTIGRAVITY-BUILD-PLAN.md` for the exact acceptance plan and next prompt.

## Brand / intellectual property
`DARIYA` is a proposed name, **not trademark-checked**. No third-party endorsement is claimed. Retained old research may contain cited links and must be independently rechecked before marketing.
# dariya
