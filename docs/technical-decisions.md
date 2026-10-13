# Technical decisions

## Route Handlers for mutations

CareChart uses Route Handlers for patient registration, draft saves, encounter completion, appointment status changes, and demo reset. The client receives a consistent JSON error shape and can distinguish validation failures (`422`), missing records (`404`), and revision conflicts (`409`). Database access stays in server-only feature modules.

## One editable source of truth

React Hook Form owns the encounter values. Tabs render against the same form instance; there is no duplicate Zustand or query cache. Draft persistence tracks a monotonically increasing database revision plus an in-browser edit sequence. Requests are serialized, stale revisions are rejected, and a response only marks the form saved when no newer local edit exists.

## Explicit conflict recovery

On a `REVISION_CONFLICT`, the form retains the user's current values. The user can explicitly rebase those values on the newer server revision and save, or load the saved server version. CareChart never silently replaces either side.

## Completion policy

The demonstration requires visit reason, subjective, assessment, and plan before completion. This is a product workflow policy for the portfolio demo, not a clinical standard. Completion is transactional: the encounter becomes read-only, draft orders become ordered, and a linked appointment becomes completed.

## Local demo boundary

The database includes a `DemoSession` ownership boundary and every server query scopes to the fixed local session. The first release intentionally does not implement authentication or public per-visitor session provisioning. It is therefore suitable for local demonstration only.
