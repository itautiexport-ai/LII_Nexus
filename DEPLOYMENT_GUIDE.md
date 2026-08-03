# Deployment Guide

How to run LII Performance Nexus for real, beyond a local dev setup: production builds, environment configuration, and hosting options for a company pilot.

## Overview: three things to run

| Component | What it is | How it runs in production |
|---|---|---|
| **Database** | MySQL 8.0 | A managed MySQL instance or your own server |
| **Backend** | Node/Express API | A compiled `dist/` bundle run with `node`, behind a reverse proxy |
| **Frontend** | React/Vite SPA | A static build (`dist/`) served by any static file host or web server |

There is no server-side rendering and no background job scheduler — every "scheduled" feature in this system (checklist generation, KPI scoring, notification escalation, scheduled reports, document expiry alerts) is triggered on demand via an API call, documented per-module in `docs/`. If you want these to run automatically, put a cron job or your platform's scheduled-task feature in front of the relevant endpoint (see "Automating on-demand checks" below).

## 1. Database

Run MySQL 8.0 wherever you'd run any production database — a managed service (RDS, Cloud SQL, PlanetScale, etc.) or your own server. Requirements:
- MySQL 8.0.x (the schema uses `CHECK` constraints and JSON columns that need 8.0)
- `utf8mb4` character set
- A dedicated application user with privileges scoped to the one database (not root)

Create the database and run migrations exactly as in `INSTALLATION_GUIDE.md`, pointing `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` at your production instance. Run `npm run migrate` from a machine that can reach the database (a deploy step, or once manually) — not automatically on every backend restart.

**Only run `npm run seed` in production** (never `npm run seed:demo` — that creates fake CRM leads, sample documents, and shared `Test@1234` passwords, which have no place in a real company's data). Change the bootstrap admin password immediately after the first login.

## 2. Backend

### Build
```bash
cd apps/backend
npm ci
npm run build
```
This produces `dist/`. The `.sql` migration/seed files are copied into `dist/` automatically as part of the build (`scripts/copy-sql-assets.js`) — `dist/` is self-contained and is what you actually deploy.

### Configure
Set real environment variables (not a committed `.env` file) for:
```
NODE_ENV=production
PORT=4000
DB_HOST=... DB_PORT=... DB_NAME=... DB_USER=... DB_PASSWORD=...
JWT_ACCESS_SECRET=...      # long, random, unique to this deployment
JWT_REFRESH_SECRET=...     # different from the above
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN_DAYS=7
BCRYPT_SALT_ROUNDS=12
COOKIE_DOMAIN=yourcompany.com
CORS_ALLOWED_ORIGINS=https://app.yourcompany.com
```
See the **Security** section below before generating these.

### Run
```bash
node dist/server.js
```
Run this under a process manager that restarts it on crash and on server reboot — `pm2`, `systemd`, or your platform's equivalent (a Dockerfile + your container platform's restart policy also works fine, since the backend is a single stateless Node process). Put a reverse proxy (nginx, Caddy, your cloud load balancer) in front of it for TLS termination; the backend itself serves plain HTTP.

### Health check
`GET /api/health` returns `{"success":true,"data":{"status":"ok"}}` when the process is up — point your process manager's or load balancer's health check at this.

## 3. Frontend

### Build
```bash
cd apps/frontend
cp .env.example .env.production
# edit .env.production: VITE_API_BASE_URL=https://api.yourcompany.com/api/v1
npm ci
npm run build
```
This produces a static `dist/` folder.

### Serve
`dist/` is a plain static site — any static host works: nginx, Caddy, Netlify, Vercel (static mode), an S3 bucket + CDN, or a simple `serve dist/`. Because this is a client-side-routed SPA, your static host must be configured to serve `index.html` for any unmatched path (a "SPA fallback" / "rewrite all routes to index.html" setting) so refreshing on a deep link like `/admin/documents/123` doesn't 404.

## 4. Reverse proxy / TLS

A typical production layout:
```
https://app.yourcompany.com   → static frontend build
https://api.yourcompany.com   → reverse proxy → node dist/server.js on port 4000
```
Terminate TLS at the reverse proxy (nginx/Caddy/cloud load balancer), not in the Node process itself. Make sure `CORS_ALLOWED_ORIGINS` on the backend matches the frontend's real origin exactly, including scheme (`https://`).

## 5. Automating on-demand checks

Since there's no built-in scheduler, wire these into your platform's cron/scheduled-task feature if you want them to run automatically rather than by manual admin action:

| Check | Endpoint | Suggested frequency |
|---|---|---|
| Notification escalation | `POST /notifications/run-escalation-check` | Every 15–60 min |
| Scheduled reports | `POST /reports/scheduled/run-due` | Hourly |
| Document expiry alerts | `POST /documents/check-expiries` | Daily |
| Behaviour insights | `POST /behaviour/insights/run` | Daily or weekly |

Each needs a valid admin (or appropriately-permissioned) access token; a small script that logs in a dedicated service account and calls these on a schedule is the simplest approach.

## 6. Backups

Back up the MySQL database on whatever schedule your company's data-loss tolerance requires — this is a normal relational database with no special backup considerations. There is no file storage to back up separately in this release (see the note on attachments in `USER_MANUAL.md`).

## 7. Docker (optional, database only)

`docker-compose.yml` at the project root starts MySQL 8.0 for local development. It is not a production deployment manifest — for production, either point the app at your managed database provider, or write your own container setup for the backend/frontend if your infrastructure is container-based. The backend and frontend are ordinary Node/static-file processes and containerize the standard way (a `Dockerfile` with `npm ci && npm run build` and the appropriate `CMD` for each).

## Security checklist before going live

- [ ] Bootstrap admin password changed from `ChangeMe123!`
- [ ] `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` are long, random, and unique to this deployment (never the `.env.example` placeholders)
- [ ] Database user has privileges scoped to only the `lii_nexus` database
- [ ] `CORS_ALLOWED_ORIGINS` matches your real frontend origin, not `localhost`
- [ ] TLS is terminated in front of both the frontend and backend
- [ ] `npm run seed:demo` was never run against this database
- [ ] Regular database backups are scheduled
