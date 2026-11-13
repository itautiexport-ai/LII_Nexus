# Exact wood prices

Existing Master page now uses `master_wood_thickness_prices` (migration 124). Migrations 122/123 integrate hardware/accessories and costing metadata; catalogue storage uses 121.

The JSON in `apps/backend/scripts/wood-prices-2026-11-13.json` literally transcribes all 135 image prices, 45 per wood, thickness in inches and length in feet, rate in INR/CFT. No price formulas.

After backup, backend build and migrations, run from `apps/backend`:

```sh
node scripts/import-wood-prices.js --backup-dir /absolute/path/to/backups
```

Uses the existing DB connection. Each execution saves before-rows and verification report in a unique backup subdirectory. Transactionally updates matching active combinations or inserts missing ones, preserves unrelated/deleted rows, aborts on existing duplicates, and verifies all 135 values before commit. Non-local hosts require an additional `--allow-remote`. Git pull alone does not import prices.

Browser originals are backed up under `nexus_wood_thickness_prices_before_server_sync`; browser-only records are not automatically merged into a nonempty shared table. Keep these for review/recovery.

Local initial result: 135 inserted, 0 updated; all prices verified via existing authenticated API. Re-run: 135 unchanged, 0 duplicates. Backend/frontend builds and catalogue checks passed. User confirmed local behavior. VPS untouched.
