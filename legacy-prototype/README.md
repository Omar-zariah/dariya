# Moroccan Diaspora Property Platform — Starter Project

**Demo name:** Darna (placeholder; not trademark-checked)
**Prepared:** 3 October 2026
**Status:** Interactive, offline *product prototype*, **not** a working property management service or deployable backend.

This is a new starter package reconstructed from the earlier business discussion. No previously created matching ZIP or source-code folder was available to repackage. It is not claimed to be the original artifact.

## Quick start (no installation)

1. Unzip `moroccan-diaspora-property-platform.zip`.
2. Open `moroccan-diaspora-property-platform/index.html` using Chrome, Edge or Firefox.
3. Explore the **Owner view**. Approve or decline a pending quote.
4. Select **Owner view ⇄** at top right to change to the **Operations view**, where you can add repair quotes, close scheduled inspections and complete approved jobs.
5. Return to Owner view to see updated spending, decisions and history.
6. Use **Spending & records → Export JSON** to download the locally stored example records, or **Reset demo** to restore the starter scenario.

> The prototype uses `localStorage` in your browser, not a backend. If you open it in a different browser, the data will differ. Some restrictive `file://` browser settings may prevent persistence: use the optional local server below.

### Optional local server

In this folder, run `python -m http.server 8080` and open `http://localhost:8080`. No dependencies, npm installs or internet are required for core functionality. The optional web font uses Google Fonts with local fallbacks.

## Features demonstrated

| Area | Owner | Local operations |
|---|---|---|
| Property portfolio | See and add homes | See and add homes |
| Inspections | Request, view findings and evidence description | Close an inspection and log findings |
| Maintenance quotes | Approve/decline scope and amount | Create a quote, close **approved** work |
| Financial control | See recorded costs and budgets | Completing approved work creates a cost record |
| History | Activity timeline | Activity timeline |
| Data export | Export JSON / reset | Export JSON / reset |

The two sample properties, sample service providers, inspections and expenses are fictional. Evidence entries are **descriptions**, not uploaded original media. No booking, payment, phone, identity verification, provider assignment or legally binding approval occurs.

## Why this product?

The hypothesis is that Moroccan owners living abroad may lack reliable and auditable property oversight. Instead of launching a full property-listing marketplace, begin with a **verified home-care workflow**: scheduled checks, repair proposals with explicit price approval, evidence of finished work, a transparent expense ledger, and accessible historical records.

Read:
- `docs/01-strategy-and-customer-problems.md` — problem and opportunity analysis
- `docs/02-market-sources-and-limitations.md` — public evidence + limitations
- `docs/03-mvp-roadmap-and-architecture.md` — technical scope, next build
- `docs/04-research-interviews-and-pilot.md` — validation plan
- `financials/scenario-model.csv` — auditable illustrative unit economics
- `financials/model-notes.md` — all key assumptions, interpretation

## What **must** change before use with real customers

- Add secure production authentication (owner, local agent, vetted provider, admin), permissions and audit logging.
- Use an actual database, encrypted file storage for dated photo/video originals and secure backups.
- Verify property ownership or legal authorization. Create a keys/access-control procedure and contractor due diligence.
- Add documented quotes, receipts, invoices, consent and dispute/chargeback workflows; never hold customer funds casually.
- Handle applicable Moroccan legal, privacy/data protection, cross-border transfers, tax, consumer protection and agency/service rules with qualified legal/accounting advisers.
- Build incident response, safety, inspection quality assurance and complaints handling.
- Translate real user journeys into French, Arabic and optionally Dutch/Spanish/German before pilot.
- Validate costs, scheduling density, cancellation, travel time and customer willingness to pay with actual field work.

## Technical layout

```
moroccan-diaspora-property-platform/
├── index.html                 # App shell and navigation
├── assets/
│   ├── app.js                 # Working local demo interactions & sample data
│   ├── styles.css             # Responsive dashboard design
│   ├── house-nador.svg        # Offline property illustration
│   └── house-rabat.svg        # Offline property illustration
├── docs/                      # Product plan, cited context and research
└── financials/                # Assumption-based business scenarios
```

**License:** Evaluation prototype. No external library dependencies. The demo brand and vendor names should be reviewed before real use.
