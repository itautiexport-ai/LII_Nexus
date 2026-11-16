# Costing product images

Authenticated `POST /api/v1/costing/images` accepts one multipart `file` up to
10 MB (JPEG, PNG, GIF or WebP, checked by file signature). Files use random UUID
names under `apps/backend/uploads/costing`. The response contains a relative
`/uploads/costing/...` URL, served by the existing uploads middleware.

The existing costing form uploads a selected photo before saving. Save waits
for the upload; failures remain visible and can be retried or explicitly
continued without a photo. The saved `form_data.imageUrl` contains the URL.
Existing small embedded Base64 photos remain readable. When an old record is
edited and saved, its embedded image is uploaded first; no bulk rewrite or
schema migration is required. Removing/replacing an image does not delete old
files or other records.

The JSON parser limit and the 90 KB form snapshot guard remain in place.
Oversized JSON now returns an explicit 413 response instead of a generic 500.
The costing form displays the API error rather than a generic save failure.

Local checks (from `apps/backend`, after `npm run build`):

```sh
node scripts/test-costing-images.js
node scripts/test-costing-form-approval.js
```

These tests require a local database and remove only their uniquely identified
fixture records/images. They do not run against production.

For a future VPS deployment, preserve/back up the uploads directory along with
the database. Ensure the reverse proxy permits the intended multipart upload
size on `/api/v1/costing/images` (10 MB file plus multipart overhead); an Nginx
default body limit can reject the upload before the API sees it. This change
does not modify Nginx, UTC/IST configuration or production settings.
