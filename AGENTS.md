# DARIYA — instructions for Antigravity agents

## Read first
1. `docs/MASTER-PRODUCT-BRIEF.txt` = owner-provided product specification. Treat it as the product North Star.
2. `README.md` = real MVP implementation status and setup.
3. `docs/ANTIGRAVITY-BUILD-PLAN.md` = ordered milestones, acceptance tests, blockers.
4. `supabase/migrations/*.sql` = authoritative schema, RLS and secure workflows. Never bypass these in UI code.
5. `legacy-prototype/` = old offline illustrative demo, not a production backend. Keep it for reference, not live auth.

## Rules
- Build **Version 1 first**, city: Tangier. Do NOT build a marketplace.
- Stack: Next.js 15 App Router, React 19, TypeScript, Tailwind, Supabase Auth/Postgres/Storage, server actions. Use typed validation with Zod and server-side authentication + RLS.
- Brand: DARIYA (#142B3B navy, #F7F5EF ivory, #C87955 terracotta, #82958A sage). French default, Arabic RTL and English; complete missing translations before launch.
- Never fabricate inspections, real customer testimonials, invoices, payment confirmation, documents, technician verification, AI answers or maintenance completion. Empty states are honest.
- Real tenant isolation is mandatory. Never send service_role or other server secret to browser. Never allow self-assigned roles. Enforce authorization server-side and at Postgres RLS.
- Treat property ownership proof, identity verification, technician authorization and regulated payment flows as real operational/legal procedures, not button-click claims.
- After each increment: `npm run typecheck`, `npm run build`, then test on a **real Supabase dev project** using at least two owners and a technician to catch cross-tenant leaks.
- Do not remove `legacy-prototype/` or financial/research documents.

## Immediate next mission
Run and harden the app end to end with Supabase migrations, add automated SQL policy tests, owner verification onboarding, notification delivery jobs and real multi-role E2E tests. See the full plan in `docs/ANTIGRAVITY-BUILD-PLAN.md`.
