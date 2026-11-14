# Costing form persistence and approval integration

Integrated upstream `318f0da6..c475acf9` locally: Enter/Shift+Enter navigation,
estimation form restoration, detail/list updates and approval chat cleanup.
Existing catalogue/master prices and UTC/IST implementation files were unchanged.
The Costing form retains `loadSyncedMetalPrices` for shared metal rates.

## Database and saved forms

Migration 126 conditionally adds nullable `form_data` (LONGTEXT) and
`approval_authority_id` (VARCHAR(36)) to `cost_estimations`. Existing records,
notes and item rows are retained. Repository runtime compatibility checks remain.
New saves use a JSON snapshot; edits that omit it preserve the stored snapshot.
Invalid/non-object JSON and snapshots above 90 KB are rejected before writing.
Restoration accepts explicitly empty arrays, zero values and empty image URLs.
Existing notes-embedded JSON and item reconstruction remain as legacy fallbacks.

## Approval enforcement

`GET /costing/approval-authorities` returns only active, nondeleted user accounts
whose exact normalized names are Ravi Utmani or Raj Utmani. Ambiguous duplicate
names are excluded. No invented employee IDs or offline dummy recipients are used.
The actual user ID is stored on submission for review. The selection must be a
current allowed account; a new In Review transition without one is rejected.
Legacy already-In-Review records may still be edited without inventing a recipient.

Only these two actual active user accounts may set Approved/Rejected status.
Other users cannot modify finalized costing data, while notes-only chat updates
remain available. This policy has no generic System Admin bypass. Both permitted
authorities may decide; it is not restricted to only the individually selected one.
Existing deletion permissions and unrelated modules were not changed.

## Verification and deployment notes

From `apps/backend`, after build/migrations:

```sh
node scripts/test-costing-form-approval.js
node scripts/test-catalogue-storage.js
node scripts/test-metal-prices.js
```

The costing test requires a local database and existing active Ravi/Raj accounts.
It uses a uniquely identified fixture estimation, verifies API snapshot round-trip,
chat preservation, validation, real-recipient enforcement, unauthorized decisions,
finalized-data protection and persistence after HTTP-server restart. Only the test's
own estimation/items are cleaned up; user accounts are not modified.

Before later deployment, back up database/builds, build backend, migrate 126, build
frontend and restart backend. Retain the added nullable columns on application
rollback. No VPS change, Git commit or push was performed as part of local testing.
