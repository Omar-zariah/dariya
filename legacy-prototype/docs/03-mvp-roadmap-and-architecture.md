# MVP requirements and path to production

## Three essential product journeys

### Owner: inspect
1. Register and verify account (production only).
2. Add property, authority proof, contact, access policy and emergency contact.
3. Request/subscribe to a check. Receive schedule and service-level expectations.
4. Inspector follows a standardized room-by-room checklist.
5. Owner receives signed date/location-stamped report with untouched photo/video originals and clear next steps.

### Owner: approve a repair
1. Inspector or qualified provider identifies a problem and proposes work.
2. Operator reviews description, warranty, tax/fees, priority and quote validity.
3. Owner approves or declines a **specific** amount and scope; material changes force re-approval.
4. Completion is verified separately with source evidence and receipt.
5. Expense posts once, linked to approval ID and invoice; owner can dispute.

### Operator: quality assurance
1. Calendar groups inspections by region, inspector and due date.
2. Late/missed appointments trigger escalation, not silent completion.
3. Inspector cannot approve their own third-party bill above threshold.
4. Admin can audit evidence access, changes, provider history and customer disputes.

## Prototype scope / limitations

This ZIP implements UI + browser-local state only: sample properties, inspection requests, evidence descriptions, operations quote creation, approval/decline, completion logging, budget summary and JSON export. No backend. The mode switch is **not authentication** and must never be connected to real customer records.

## Suggested production modules

| Component | Responsibilities |
|---|---|
| Web client | Accessible, mobile-first dashboard; FR/AR/EN, later ES/NL/DE |
| Identity | Owner, co-owner, field agent, manager; strong MFA for approvals |
| API | Server-side RBAC, tenancy checks, validation, rate limits |
| Database | PostgreSQL: properties, ownership rights, inspections, quotes, decisions, invoices, providers, transactions |
| Object storage | Immutable originals and photo EXIF checks; short-lived signed links |
| Jobs | Reliable queues for reminders, SLA breaches and escalations |
| Payments | Licensed PSP and clear separate collection/disbursement responsibilities |
| Audit | Append-only event history, timestamp/user/IP and money-change trails |
| Admin | Dispatch board, document moderation, disputes, provider due diligence |
| Observability | Uptime/error monitoring, retention policy, backups and incident handling |

## Suggested core entities

- `users`, `organizations`, `memberships`, `permissions`
- `properties`, `property_authorizations`, `access_instructions`
- `inspection_templates`, `inspections`, `inspection_answers`, `evidence_assets`
- `providers`, `work_orders`, `quotes`, `approval_events`, `completion_checks`
- `expenses`, `invoices`, `payments`, `refunds`, `audit_events`

## Data and safety

Obtain local professional advice on Moroccan obligations relating to: CNDP/personal-data treatment and storage, consumer service terms, agency/real estate licensing boundaries, access to residences, insurance, contractor liability, tax and payment services, and handling cross-border owner data. Avoid holding keys or accessing residences without recorded authority and escalation protocols.

## Delivery stages

- **Weeks 1–2:** 20–30 owner problem interviews; recruit and vet 2–3 field operators in *one* city.
- **Weeks 3–4:** manual no-code/WhatsApp concierge for 10 homes; measure true minutes/travel and report quality.
- **Weeks 5–8:** paid 25–50-home pilot with approved inspection SOP, evidence QA, invoices and dispute policies.
- **Weeks 9–12:** only then build production permissions, dashboard, billing and automation where pilot work shows proven demand.

Exit gates: on-time inspection rate, gross contribution per visit/home, evidence acceptance, repeat purchases, quote-to-completion time, and customer renewal intention. All numeric thresholds should be set from actual cost and risk tolerance, not assumed here.
