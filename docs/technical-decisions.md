# Technical decisions

## Static, browser-owned data

CareChart exports static Next.js pages to `out/` for Netlify. No server functions, API routes, or database are deployed. A visitor's 30 fictional seed records and subsequent changes are held in that browser tab's `sessionStorage`. This removes shared mutable server state and lets a public portfolio demo run without authentication or database hosting. It is isolation for a **fictional demo**, not a security boundary suitable for real patient information.

`sessionStorage` was chosen deliberately: refreshing the tab keeps drafts, while a new independent browsing context starts clean. A tab opened from another tab may initially receive a browser-provided copy of session storage; later edits are independent. Closing a tab, clearing storage, or browser policy may discard work. The reset action replaces only the current tab's data.

## One editable source of truth

React Hook Form owns encounter values across all five sections. The browser store persists validated snapshots. Each encounter carries a revision. The UI also tracks a local edit sequence, serializes saves, and only shows “All changes saved” if no newer edit happened after the saved snapshot. A storage failure leaves current form values in place and offers retry. If the stored revision changed, the user explicitly chooses whether to save their edits over it or load the stored version.

The landing dashboard derives every metric and chart from that same browser store. Appointment mix and cancellation rate use today's appointments in the device's local calendar; encounter completion uses all encounters in the tab; the trend uses completion timestamps from the last 14 local calendar days. No KPI is sent to a server or compared with a real clinical benchmark.

## Validation and completion

Zod validates registration, appointment statuses, orders, and draft fields before browser-store mutation. Completion also checks visit reason, subjective, assessment, and plan. This is a portfolio workflow rule, not a clinical standard. Completion changes the encounter to read-only, marks demo orders ordered, and completes a linked appointment in one stored snapshot.

Because all code executes in the visitor's browser, a visitor can inspect or modify storage and JavaScript. These checks ensure the UI's normal workflow is coherent; they are **not** authoritative server-side controls. Real records, multi-user access, or meaningful auditability would require a backend, authentication, server-side authorization/validation, and durable database storage.

## Netlify configuration

The committed `netlify.toml` runs `npm run build` and publishes `out/`. `next.config.ts` sets `output: "export"`; all published routes are static and use query parameters for browser-local chart and encounter identities. No environment variables or writable server filesystem are required.
