# CareChart

CareChart is a polished Electronic Medical Record workflow portfolio application built by [Noah Abayomi](https://github.com/Pinnacle96). It demonstrates a complete fictional workflow: find a patient, open the chart, create an encounter, record vitals and notes, add demonstration orders, review, and complete the encounter.

> **Demo only.** Every patient and clinical-looking entry is fictional. CareChart is not a certified clinical product, does not generate diagnoses or dosage recommendations, and does not transmit prescriptions or orders.

**Live demo:** _Not deployed — local portfolio release._

## Highlights

- Searchable, URL-driven patient directory with status filtering and pagination
- Validated patient registration with server-generated MRNs
- Patient charts that distinguish known, explicitly absent, and unrecorded allergy information
- Daily appointment schedule with validated status transitions and encounter links
- One coordinated encounter form across overview, vitals, notes, orders, and review
- Debounced autosave, manual save, retry, refresh recovery, navigation warning, and explicit revision-conflict recovery
- Server-enforced completion requirements and read-only completed encounters
- Transactional appointment completion and fictional order status updates
- Deterministic 30-patient seed and confirmed local reset flow
- Unit, integration, component, and Playwright workflow tests

## Screenshots

![Daily appointment schedule](docs/screenshots/appointments.png)

![Patient chart](docs/screenshots/patient-chart.png)

![Encounter workspace](docs/screenshots/encounter-workspace.png)

![Mobile patient directory](docs/screenshots/patient-directory-mobile.png)

## Run locally

Requirements: Node.js 22+ and npm 10+.

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`. Open [http://localhost:3000](http://localhost:3000).

Reset the fictional dataset from the header action, or run:

```bash
npm run db:reset
```

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The test command resets and seeds an isolated `prisma/test.db`. Playwright resets the local demo, builds the app, then exercises the production server with an installed Chrome browser.

## Architecture

- `src/app` — App Router pages and JSON Route Handlers
- `src/features` — patient, appointment, and encounter UI plus server-side use cases
- `src/components` — layout and reusable visual primitives
- `src/lib/db` — Prisma client, demo session scoping, and deterministic seed data
- `src/lib/validation` — shared Zod mutation schemas and completion policy
- `prisma` — SQLite schema, seed, and reset entry points
- `tests` — validation, database integration, client failure recovery, and end-to-end workflow coverage
- `docs/technical-decisions.md` — persistence and product-policy decisions

Server Components load initial records directly through server-only modules. Client Components are limited to forms, tabs, dialogs, navigation, and mutation feedback. Mutations use Route Handlers consistently so the autosave client can reason about HTTP status codes and structured conflict details.

## Draft and concurrency behavior

Every encounter has a revision number. A save must present the revision it edited; the database update succeeds only when that revision is still current. The response increments the revision. The browser also records which local edit sequence each request represents, so an older response cannot label newer edits as saved. Save failures retain the form values and expose retry. Conflicts retain local work and require an explicit recovery choice.

## Data and deployment notes

SQLite is the development default. A public/serverless deployment needs durable database storage, normally by migrating Prisma to a hosted database. An ephemeral serverless filesystem is **not** durable SQLite storage.

This release has one fixed, server-scoped local demo session and no production authentication. Do not expose it as a shared public deployment. A public release must provision and enforce an isolated session for every visitor so record IDs and reset actions cannot cross session boundaries.

## Accessibility and responsive behavior

The interface uses semantic headings and landmarks, keyboard-accessible Radix tabs/dialogs, labelled fields, associated errors, visible focus, text labels alongside status color, an aria-live save status, reduced-motion handling, touch-sized actions, mobile navigation, mobile patient cards, and horizontally scrollable data tables where appropriate. No formal WCAG compliance claim is made without an independent audit.

## Performance

Patient queries are paginated and indexed, chart relationships are scoped to the current patient, and interactive client boundaries are kept around only the controls that need browser state. No synthetic score is claimed. Local production-build and browser results should be reported with the machine and run conditions when measured.

## Known limitations and next steps

- Local demo only; no authentication or public visitor isolation
- No encounter amendments after completion
- No appointment creation UI in the first release
- SQLite requires a persistent filesystem and is not appropriate for an ephemeral serverless deployment
- Browser and assistive-technology coverage should be expanded before real-world product work
- A hosted release should add authenticated tenant/session provisioning, a managed SQL database, audit events, and a documented migration strategy
