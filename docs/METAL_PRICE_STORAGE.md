# Metal Prices shared storage

The existing Master Data → Costing Master → Metal Prices page now uses authenticated
`/api/v1/metal-prices` GET/POST/PUT/DELETE endpoints and MySQL `master_metal_prices`
(migration 125). There is no new page or module. The Costing form loads the same API.

The unique combination is metal type + normalized size + size UOM + numeric length +
length UOM + numeric thickness + thickness UOM + rate unit. Updates reject duplicate
combinations. Deletes are soft deletes and do not destroy the stored row.
Existing master-data authentication behavior is retained.

## Exact image data

`apps/backend/scripts/metal-prices-sheet.json` contains literal values transcribed
from the supplied image: 13 sizes × 2 thicknesses × 2 metals = 52 records.
MS is `Mild Steel (MS)` at INR 140/kg; SS is `Stainless Steel (SS 202)` at INR 340/kg.
Lengths are 6000 mm; thicknesses are 1.6/1.2 mm; weights are kg.
The SS 40×20 anomaly is deliberately preserved as confirmed by the user:
1.6 mm → 6.52 kg and 1.2 mm → 8.57 kg. No weight formulas or corrections are applied.

## Local verification

After `npm run build` and `npm run migrate` in `apps/backend`:

```sh
node scripts/import-metal-prices.js --backup-dir /absolute/backup/directory
node scripts/test-metal-prices.js
```

The import backs up existing table rows before writing, runs transactionally, updates
matching weights/rates and inserts missing combinations. It preserves unrelated rows
and existing IDs/status. Deleted matching combinations cause rollback, not restoration.
All target values are verified before commit. Non-local DB hosts additionally require
`--allow-remote`. Connection/configuration is the project's existing connection.

Initial local result: 52 inserted, 0 updated, 26 MS + 26 SS 202. Repeat import:
0 inserted/updated, 52 unchanged. All 52 records verified through the running API.
Tests cover authentication, CRUD, equivalent-combination duplicates, numeric validation,
non-destructive browser import, restart persistence, and soft deletion. Test fixtures
are uniquely named and cleaned without touching user records.

## Existing browser data

The original `nexus_metal_prices` key is never overwritten or cleared by the new code.
The page offers a JSON backup and an explicitly confirmed import into shared storage.
Import skips combinations already present, including deleted rows, without replacing
their prices. Invalid legacy data is rejected atomically; the browser original remains
available for review. A separate `nexus_metal_prices_server_cache` key supports existing
Costing helpers/offline cached reads. Master saves require a successful server request;
errors are displayed instead of reporting a browser-only save as success.

## Future VPS deployment

No VPS changes were made in this work. Back up DB/builds/browser originals first;
deploy code, build backend, migrate 125, explicitly run the import with a backup directory,
build frontend and restart backend. Git pull/migrations alone do not import the 52 rates.
Retain the table on application rollback; older code only sees browser storage.
