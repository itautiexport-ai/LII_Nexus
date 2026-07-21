# Installation Guide

This guide gets LII Performance Nexus running on your own machine from a completely fresh clone — no prior experience with this codebase assumed. It targets local/on-premise setup for a pilot; see `DEPLOYMENT_GUIDE.md` for production hosting.

## 1. Prerequisites

- **Node.js 18 or newer** (`node -v` to check)
- **MySQL 8.0** (`mysql --version` to check)
- **npm** (comes with Node)
- A terminal and a code editor

You do **not** need Docker to get started — Docker is optional and covered at the end of this guide.

## 2. Get the code

Unzip the project, or clone it, so you have this structure:
```
lii-performance-nexus/
  apps/backend/
  apps/frontend/
  database/
  docs/
```

## 3. Set up MySQL

Start MySQL, then create the database and an application user (replace `change_me` with a real password before going anywhere near production):

```sql
CREATE DATABASE lii_nexus CHARACTER SET utf8mb4;
CREATE USER 'lii_nexus_app'@'localhost' IDENTIFIED BY 'change_me';
GRANT ALL PRIVILEGES ON lii_nexus.* TO 'lii_nexus_app'@'localhost';
FLUSH PRIVILEGES;
```

## 4. Configure the backend

```bash
cd apps/backend
cp .env.example .env
```

Open `.env` and fill in real values — at minimum:
```
DB_NAME=lii_nexus
DB_USER=lii_nexus_app
DB_PASSWORD=change_me            # the password you set above
JWT_ACCESS_SECRET=<any long random string>
JWT_REFRESH_SECRET=<a different long random string>
```
Never reuse the example secrets outside your own machine — see the "Security" note in `DEPLOYMENT_GUIDE.md`.

Install dependencies and build:
```bash
npm install
npm run build
```

## 5. Create the database schema

```bash
npm run migrate
```
This runs every migration in order and is safe to re-run — it tracks what's already applied and skips it. You should see a line like `Applied: 001_init.sql` for each of the ~20 migration files, ending with `Migrations complete`.

## 6. Seed the database

Two options:

**A. Production-safe seed** (roles, permissions, and a single admin login only):
```bash
npm run seed
```
This prints a line confirming the bootstrap admin account: `admin@liinexus.com` / `ChangeMe123!` — **change this password immediately after your first login.**

**B. Full pilot/demo seed** (everything in option A, plus 7 test logins across every role and sample data in every module — recommended for evaluating the system or running a pilot):
```bash
npm run seed:demo
```
See `TESTING_CHECKLIST.md` for the full list of test logins this creates.

Both commands are safe to run more than once — re-running won't create duplicate data.

## 7. Start the backend

```bash
npm run start
```
You should see `LII Performance Nexus API listening on port 4000`. Verify it's alive:
```bash
curl http://localhost:4000/api/health
```
Expected: `{"success":true,"data":{"status":"ok"}}`

For active development, use `npm run dev` instead — it restarts automatically when you edit a file.

## 8. Configure and start the frontend

In a **new terminal**:
```bash
cd apps/frontend
cp .env.example .env.development
npm install
npm run dev
```
Open the URL it prints (typically `http://localhost:5173`). You should see the login page.

## 9. Log in

If you ran `npm run seed:demo`, use any of the test logins from `TESTING_CHECKLIST.md`. Otherwise, log in with the bootstrap admin (`admin@liinexus.com` / `ChangeMe123!`) and change the password right away from the account menu.

## 10. Verify the install worked

Run through the first few items in `TESTING_CHECKLIST.md` — login, master data, and one module of your choice. If everything in that checklist passes, the install is good.

## Optional: running MySQL via Docker

If you'd rather not install MySQL directly, a `docker-compose.yml` is included at the project root:
```bash
docker compose up -d
```
This starts MySQL 8.0 on port 3306 with a `lii_nexus` database and `lii_nexus_app` user already created (matching `.env.example`) — skip step 3 above if you use this. Change the passwords in `docker-compose.yml` before using it for anything beyond a local trial.

## Troubleshooting

- **`ECONNREFUSED` connecting to MySQL** — MySQL isn't running, or `.env` has the wrong host/port. Confirm with `mysqladmin ping`.
- **`Access denied for user`** — the username/password in `.env` doesn't match what you created in step 3.
- **Migration fails partway through** — this project's migration runner isn't wrapped in one big transaction, so a failure can leave a few tables already created. Check `SHOW TABLES` against the migration filenames in `apps/backend/src/infrastructure/database/mysql/migrations/` to see how far it got, fix the underlying issue, and re-run `npm run migrate` — already-applied migrations are skipped automatically.
- **Frontend can't reach the backend** — check `VITE_API_BASE_URL` in `apps/frontend/.env.development` matches where the backend is actually running.
- **Login succeeds but every page shows a permissions error** — the account's role may not have the permission that page needs. See `ADMIN_MANUAL.md`'s section on Roles & Permissions.

For anything not covered here, `USER_MANUAL.md` and `ADMIN_MANUAL.md` cover day-to-day usage once the install is working.
