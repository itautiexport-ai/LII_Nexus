# Catalogue shared storage and recovery

Implemented on local branch `int-2026-11-06-catalogue-storage`. Deployment is separate.

## Storage contract

- Full catalogue fields and image references live in `catalogue_products.product_json`.
- All authenticated users read the same shared catalogue; the System Administrator therefore sees products created by other users. Existing menu visibility stays unchanged.
- Creator and System Admin may edit. Only System Admin may delete, enforced by the backend. Updates require the loaded `version`, so concurrent edits cannot silently overwrite one another.
- Deletion is soft: JSON and uploaded files remain available for recovery. No automatic physical image deletion or retention expiry is introduced.
- New JPEG/PNG/GIF/WebP images are stored under `apps/backend/uploads/catalogue/`, with generated filenames and a 10 MB per-image limit. Local image references are stored as `/uploads/catalogue/...`, resolved against the API origin for display.
- Uploaded files are served by the application's existing `/uploads` static route. As with existing application uploads, anyone holding a file URL can fetch that image; images are not individually authenticated.
- Existing document-management `products` and shared presentation tables are not altered or repurposed. Catalogue saves no longer create incomplete name/SKU-only document products.

## Existing browser records

The catalogue no longer writes, purges mock IDs, or clears either legacy localStorage key. It reads both keys independently and combines exact duplicate objects only. Conflicting variants are preserved as separate import candidates.

1. Open the original website address in the original user's browser/profile.
2. Use **Download browser backup** before import. This JSON contains the exact values of both legacy keys.
3. Confirm that these products should be shared, then import. Import never deletes the originals or overwrites existing imported database rows.
4. Retry after a partial failure: the backend deduplicates by importing account and stable legacy source identifier. Import with the same account to retain this deduplication. A different importing account can create a separate copy; review before importing the same backup under another account.
5. A downloaded backup can be loaded using **Recover products from a browser backup**, without writing it back into localStorage.

Live blob/data images are uploaded during import where readable. Expired blob URLs cannot be recovered from their URL alone. The importer retains unavailable references as metadata, imports the product details, and explicitly reports which records need image re-upload. A JSON backup preserves product data and image references, not the underlying bytes of expired blob images. Original photos/files or a still-live original browser page are needed for those images.

Existing names/SKUs already present in the old `products` table cannot reconstruct missing descriptions/images/full details by themselves. No automatic inference or deletion of these records is performed.

## Verification

From `apps/backend`:

```sh
npm run build
npm run migrate
node scripts/test-catalogue-storage.js
```

The integration script refuses non-local DB hosts, creates uniquely identified temporary fixture users/products, checks cross-user/Admin visibility and file persistence through a fresh HTTP server, tests import retry/edit conflicts/authorization/soft delete, and removes only its fixtures.

Frontend: `npm run build` from `apps/frontend`. Test browser create/upload, edit, refresh, Admin visibility, offline-save errors and original-browser backup/import before deployment.

## Future deployment

Back up the DB, existing frontend/backend builds and uploads. Build backend, run migration `121_catalogue_products.sql`, build frontend and restart backend using the established deployment workflow. Back up both MySQL and `apps/backend/uploads/catalogue` going forward; DB backups alone do not contain image bytes. Do not delete or rename existing migrations or uploads.

Application rollback should keep the new table and image files. Older application code reads only browser storage, so products created exclusively in the shared database will not appear under the old UI. Do not drop the new table as a rollback shortcut. The original browser data and JSON backups remain available.
