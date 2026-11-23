# Antigravity execution plan — DARIYA

## Context
Existing **working-code starter**, not an audited production platform. First real service: Tangier. Product brief is `MASTER-PRODUCT-BRIEF.txt`. Preserve research and existing prototype in `legacy-prototype/`.

## Milestone 0 — Bootstrap and validate (do this FIRST)
1. Install Node 20.9+ or 22 LTS; `npm install`; copy `.env.example` to `.env.local` and add the project URL and **publishable** key.
2. Run `001_initial.sql`, `002_workflows_and_hardening.sql`, `003_inspection_evidence.sql` in order against a **fresh** Supabase project. Do not run on a database with existing production data without review.
3. Configure Auth Site URL, redirects, email confirmations, SMTP and data region. Keep security settings enabled.
4. `npm run typecheck`, `npm run build`, `npm run dev`, open `/`, register owner and confirm email.
5. Manually grant test admin/agent/provider accounts their roles only via a privileged administrator SQL operation. Never offer client-side role promotion.
6. Test with Owner A and Owner B: B cannot query, edit, or download any of A's properties, images, finance, tenants, documents, maintenance, and inspections. Test provider limited to assigned jobs; agent limited to assigned inspections.
7. Run SQL RLS tests via multiple authenticated claims, audit storage bucket policies, check signed URLs and object ownership, test rejected modifications. **Block release on any failure**.

## Milestone 1 — complete V1 MVP
- **Owner onboarding:** property ownership authorization and proof review workflow (currently manual review flag).
- **Inspection workflow:** implement scheduling plus a mobile field checklist with all 11 zones, photo evidence (present basic functionality), geotimestamp when legally appropriate, verified review, downloadable branded PDF.
- **Maintenance:** quote comparison, configurable approval thresholds and exception policy, provider invoices, true customer acceptance and dispute paths. Verify operator authorizations.
- **Rental:** manage tenants, contract end dates, due/overdue rent tracking and receipt reconciliation (currently manual recording only).
- **Finances:** monthly cash flow visualization, PDF exports, utility bill evidence and reconciliation. Current CSV export is a useful interim report.
- **Property documents:** stronger document category-level access permissions and retention/deletion controls.
- **Subscriptions:** configured pricing exists but automated billing and external payments are intentionally NOT connected; choose legally supported provider/settlement before implementation.
- **Notifications:** in-app notifications live; implement verified email with a secure queue, delivery logs and opt-in WhatsApp later.
- **Roles:** admin view works; complete agent/provider mobile task list, customer-support state management and action audit.
- **UI:** complete all French/Arabic/English strings and Arabic RTL regression, accessibility/keyboard support, empty/loading/errors, pagination, mobile usability. Replace illustrative architecture SVG with licensed images if desired.
- **Tests:** unit, integration and browser E2E tests of every actual working action; add CI.

## Milestone 2 — pilot launch in Tangier
- Run 10–50 paid or explicitly free pilot properties, with documented consent, SLA, inspection checklists, access/key custody, technician insurance and quality controls.
- Add signed legal terms, privacy notice, retention schedule, security/backups and incident response. Seek local legal advice on Moroccan Law 09-08, CNDP, cross-border data/hosting, consumer and agency obligations; do NOT assume compliance from code alone.
- Establish city-zone and driving-time pricing, response windows and profitability by property before scaling.
- Support real cancellations, invoice failures, refunds, audit trails, notification preferences and disputes.

## Milestone 3 — future, not V1
Native apps, tenant portal, automated billing and WhatsApp delivery, advanced provider marketplace, AI assistants, predictive maintenance, investment analysis and property acquisition support. AI must never invent transactions or evidence.

## Suggested first prompt to paste into Antigravity
> Read AGENTS.md, README.md, docs/MASTER-PRODUCT-BRIEF.txt and all three Supabase migrations. First run a build and address any errors. Then create an end-to-end test plan with two owner accounts, one administrator, an assigned agent and an assigned provider. Verify every RLS/storage policy before extending features. Next implement robust property verification and a full inspection report workflow including PDFs, using the existing visual system and FR/AR/EN translation conventions. Work in small tested milestones. Do not simulate payments, trust verification or completion.
