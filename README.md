# LII Performance Nexus — Foundational Build

This is the implementation of LII Performance Nexus, built up in scoped increments:

- Authentication (Login, Logout, token refresh)
- Roles & Permissions (RBAC)
- Admin > Users
- Department Master / Designation Master / Employee Master
- Office Performance Module (Goals/KPIs + Self→Manager Reviews)
- Factory Performance Module (production output vs. target, logged per worker, rolled up per line/shift)
- **Universal Workflow Engine** (generic, no-code workflow *definition* builder — stages, checklists, approvals, completion rules, notification/escalation config, drag-and-drop ordering, visual flowchart. Not yet connected to any business module.)
- **Office Performance Management** (the first business module connected to the Workflow Engine — Flowchart runs, Checklist templates/instances, Delegation, and a weighted 80/10/10 performance score across 4 dashboard levels)
- **Factory Performance Management** (department-level daily production reporting — 8 named departments, dual production methods enforced at both the application and database level, a fixed Supervisor → Production Head approval gate, mobile-first entry form)
- **Performance Scoring Engine** (admin-configurable, unlimited KPIs across Office and Factory, department-specific weight overrides, automatic weighted composite scoring, monthly/yearly history, ranking, trend graphs)
- **CEO Command Center** (cross-module "what requires my attention" aggregation — no new tables, pure read-layer over every module above — with drill-down, dark/light mode, mobile and large-screen optimized layout)
- **CRM & Merchant Performance Management** (export/domestic/hotel-restaurant-project/buyer-agent/repeat-customer leads, 12-stage sales pipeline, follow-up tracking, Excel import/export, and a Merchant Score built as 5 new KPIs in the existing Scoring Engine)
- **Universal Notification & Escalation Engine** (generic, reusable across every module — 17 notification types, a 5-level escalation ladder with manager-chain and role-based resolution, notification bell and center, real cross-module wiring proven via Delegation/Flowchart/CRM)
- **Reports & Business Intelligence** (12 fixed report types spanning every module, saved/favourite/scheduled reports, configurable dashboard widgets, Excel/CSV/PDF export, and all 7 requested chart types via recharts)
- **Behaviour Intelligence Engine** (an 11-component Behaviour Index measuring HOW people work, deliberately separate from the Performance Scoring Engine which measures WHAT got produced — 6 health dashboards, 9 analytics views, and a rule-based Insights Engine with a clearly marked, inert seam for a future OpenAI connection)
- **Executive Meeting Engine** (Daily/Weekly/Monthly/Quarterly meetings with agenda, 9 review sections, decision register, and an Action Tracker where every action is a real Delegated Task — inheriting automatic reminders and escalation from the Notification Engine rather than a second mechanism — plus automatic MOM generation and PDF export)
- **Enterprise Document Management System** (9 document types with real version control, a fixed two-step approval gate, polymorphic attachment to Employees/Machines/Products/Departments/Workflows/CRM Leads, expiry alerts reusing the Notification Engine, tags, folders, and confidentiality-aware access control)
- **KPI Engine** (a formula-driven, no-code KPI system — admin types an arithmetic formula, validated by a safe hand-written evaluator that never calls `eval()`/`Function()` — deliberately separate from the Performance Scoring Engine, covering Office/Factory/CRM/Purchase/Quality/HR categories via manually entered Target/Actual, with traffic lights and Employee/Department/Company scores)

This follows the architecture defined in `docs/LII-Performance-Nexus-Architecture.md` (Clean Architecture, Repository Pattern, Service Layer, modular structure).

**New to this project? Start here:**
- `INSTALLATION_GUIDE.md` — get it running on your machine from a fresh clone
- `DEPLOYMENT_GUIDE.md` — run it for real: production builds, hosting, environment config
- `USER_MANUAL.md` — day-to-day usage for every role
- `ADMIN_MANUAL.md` — roles, permissions, master data, and configuring every engine
- `TESTING_CHECKLIST.md` — the 7 test logins and a practical verification checklist

---

## Final Stabilization Pass (this build)

This pass covered all 18 modules built to date — a full code audit, beginner-friendly documentation, demo data seeding, and creation of all 7 role-based test logins. No new features were added.

### Code audit: clean
`tsc --noEmit` and `eslint` both ran clean (zero errors, zero warnings) on both apps before any changes were made in this pass — a direct result of every prior module having been type-checked and linted as it was built, not a coincidence. No broken imports, no orphaned/unused files, and no genuine duplicate logic were found (a `KpiDefinitionsPage.tsx` filename collision between the Scoring Engine and the new KPI Engine was already correctly resolved with distinct import aliases from when the KPI Engine was built).

### Bug found and fixed — `kpi_engine_definitions` was the only seeded table missing its natural-key unique constraint
Every other seeded table in the entire application (`permissions.key`, `roles.name`, `behaviour_components.component_key`, `insight_rules.rule_key`, `kpi_definitions.name`, `notification_templates.notification_type`, `escalation_rules.level`, `factory_departments.name`) has a `UNIQUE` constraint on its natural key, which is what makes `INSERT IGNORE INTO ... VALUES (UUID(), 'some name', ...)` actually idempotent — since `UUID()` generates a fresh primary key every run, `INSERT IGNORE` has nothing to collide with, and silently unique-key-less inserts a duplicate row every time the seeder runs. `kpi_engine_definitions` was missing this. **Confirmed live**: running `npm run seed:demo` twice against a fresh database produced two rows for each of the two demo KPI definitions. **Fixed** via migration `021_kpi_engine_dedupe_and_unique.sql` — deduplicates any existing rows and adds the missing `UNIQUE KEY` on `name`. Re-verified: running the same seed command twice in a row now correctly produces exactly one row per KPI name.

### Gap found and fixed — no seed data existed for Shifts or Production Lines anywhere
Factory production entries require a `shift_id` and reference `production_lines`, but neither table has ever had a seeder — they only ever contained data on long-lived development databases because rows were created manually through the API during earlier testing. **Confirmed live**: on a genuinely fresh database, `factory_departments` had its expected 8 rows (correctly seeded), but `shifts` and `production_lines` had zero, which silently prevented any factory production entry from ever being created until an admin manually set both up first. **Fixed** by adding Morning/Afternoon/Night shifts and one production line to the demo-data seeder (`seedDemoData.ts`), idempotently.

### Seven test logins across every role, created automatically
Previously only System Admin existed out of the box; HR Admin/Supervisor/Employee required manual one-time setup (see the now-removed `TESTING.md`). This pass added:
- A new seed file (`020_seed_pilot_roles.sql`) creating **CEO, HOD, Supervisor, and Merchant** roles, each granted a sensible default permission set via pattern-matching over the full permission catalog (not hand-picked one at a time) — and broadened the existing **HR Admin** role beyond pure identity/RBAC administration into practical HR-domain permissions (employee/department management, behaviour feedback, meetings).
- A new idempotent demo-data seeder (`seedDemoData.ts`, run via `npm run seed:demo`) that creates all 7 test logins with a realistic manager hierarchy (CEO → HOD → Supervisor → Employee, HOD → Merchant), and one sample record in every major module (a checklist template, a delegated task, a factory production entry, a CRM lead, and KPI Engine entries) — so a brand-new install isn't an empty shell.
- This is deliberately **opt-in** (`--demo` flag / `npm run seed:demo`), not automatic — a real production deploy via plain `npm run seed` never gets fake CRM leads, sample documents, or shared `Test@1234` passwords.

### Verified working end-to-end on a completely fresh database (not just the long-lived dev one)
- `npm run migrate` against an empty database applies all 17 migrations in order with zero errors
- `npm run seed:demo` against that same fresh database correctly creates all 7 logins, the full manager hierarchy, and one sample record in every module category (departments, employees, tasks, checklists, delegations, factory entries, CRM leads, KPIs)
- Running `npm run seed:demo` a second time produces **zero duplicate rows anywhere** (the specific thing the bug above would have broken)
- All 7 test logins authenticate successfully
- Role-based permission enforcement spot-checked across CEO/HOD/Merchant/Employee: correct 200s for in-scope actions, correct 403s for out-of-scope ones
- Every required module responds correctly once given its actual route path: Office Performance (Delegation, Checklists), Factory Performance, CRM, Notifications, Reports, Behaviour Analytics, Executive Meetings, Documents, KPI Engine, CEO Command Center
- `database/schema.sql` and `database/seed.sql` were both regenerated from the final, fully-migrated schema and verified to import standalone into a brand-new empty database

---

## First Stabilization Pass (earlier build)

A full technical audit was run before any new feature work, against a **real MySQL 8.0 instance** (not just static analysis) — fresh `npm install`, full `npm run build` on both apps, ESLint configured and run on both apps, and a live server started and exercised via actual HTTP requests (login, refresh, logout, permission grant/revoke, RBAC enforcement, CORS).

### Bug found and fixed
**Build pipeline: `.sql` migration/seed files were not copied into `dist/`.** `tsc` only compiles `.ts` files — it silently ignores the raw `.sql` files under `infrastructure/database/mysql/migrations/` and `seeders/`. This meant a clean `npm run build` followed by `npm run migrate` failed with `ENOENT: no such file or directory, scandir '.../dist/.../migrations'` — a fresh clone would never get past the first setup step in production mode (`dev` mode via `ts-node-dev` reads from `src/` directly, which is why this wasn't caught earlier).

**Fix:** `apps/backend/scripts/copy-sql-assets.js` now runs as part of `npm run build` (`tsc && node scripts/copy-sql-assets.js`) and mirrors both directories' `.sql` files into the equivalent `dist/` paths. Verified by running `npm run build && npm run migrate && npm run seed` against a real database from a completely clean `dist/` — all 4 migrations and all 4 seed files applied successfully.

### Bug found and fixed — authorization
**An HR/Admin override-permission holder with no Employee Master record of their own could not use their override at all.** `GoalService`, `ReviewService`, and `ProductionEntryService` all resolved the *acting user's own* employee record (`requireEmployeeForUser`) unconditionally, before ever checking whether they held an override permission. In practice: grant someone `performance.review.manager_submit` so they can approve any review as an HR override — if that person isn't themselves tracked as an employee (a very ordinary case for a back-office admin), every override attempt failed with a confusing `400 "Your account is not linked to an Employee Master record"` instead of succeeding. Found by actually exercising the HR Admin test role end-to-end against a live server, not by code review — the bug only surfaces when the specific combination (override permission + no personal employee link) is exercised.

**Fix:** `EmployeeScopeService` gained `authorize()` and `authorizeManagerOnly()`, which check the override flag **first** and only resolve the actor's own employee record if the override doesn't apply. A secondary related issue was fixed in the same pass: when there's *no* override and the actor also has no employee record at all, that's a plain `403 Forbidden` (they trivially can't be "self" or "the manager" of anyone) — not the `400` reserved for genuine self-service entry points like initiating your own review. `GoalService`, `ReviewService`, and `ProductionEntryService` were all updated to use the corrected methods. Verified with the exact bug scenario end-to-end: granted `performance.review.manager_submit` to a user with no employee link, confirmed they could now successfully submit a manager assessment for someone else's review; revoked it, confirmed they correctly got `403` again (not `400`); confirmed the real manager (an actual `employees.manager_id` relationship) was unaffected throughout.

### Bug found and fixed — migration runner idempotency (found while adding the Workflow Engine)
**`npm run migrate` was not idempotent** — it re-executed every `.sql` file in the migrations folder on every run, with no record of what had already been applied. This was invisible on a single fresh install, but broke the very next time a new migration file was added to an existing database: re-running `migrate` failed on `001_init.sql` with "table already exists" / "duplicate key name" errors before it ever reached the new file. Found immediately when adding migration `005_workflow_engine.sql` and running `npm run migrate` against the already-migrated development database used throughout this project.

**Fix:** `migrate.ts` now creates and checks a `schema_migrations` table (filename + applied_at), skipping any file already recorded and only applying — and recording — genuinely new ones. Verified two ways: a completely fresh database applied all 5 migrations in order and, run a second time immediately after, correctly reported "nothing new to apply" for all 5; and the existing development database (previously at migration 004) correctly picked up only `005_workflow_engine.sql` without touching anything already in place.

### Bug found and fixed — route ordering (Workflow Engine)
**`PATCH /workflows/:id/stages/reorder` was unreachable** — it was registered *after* `PATCH /workflows/:id/stages/:stageId` in the router, so Express matched the literal path `.../stages/reorder` against the `:stageId` parameter route first (treating "reorder" as a stage ID) and validated the request against the wrong schema, returning a confusing "name is required" error for what should have been a simple reorder call. This is the exact bug class this project has hit before (`/employees/me` vs `/employees/:id`) — caught this time by actually calling the endpoint rather than by re-reading the route list, which is the only way this class of bug reliably surfaces.

**Fix:** moved the `reorder` route registration before the `:stageId` routes. Verified: the reorder endpoint now returns the updated stage order correctly, and a subsequent call with an incomplete stage list correctly returns the intended "must contain exactly the stages currently in this workflow" validation error rather than a schema mismatch.

### Bug found and fixed — employee vs. user ID (Factory Performance Management)
**`factory_production_entries.submitted_by` and `.reviewed_by` are foreign keys to `employees`, but the service initially wrote the acting user's login ID into them** — the third time this exact class of mistake (conflating a `users.id` with the `employees.id` it should be linked through) has occurred in this project. TypeScript didn't catch it because both are typed as plain `string`. Surfaced immediately as a `500` foreign key constraint violation the first time a real submission was tested against a live database.

**Fix:** `FactoryProductionEntryService` now resolves the acting user's own Employee Master record via `EmployeeScopeService.requireEmployeeForUser()` before writing `submitted_by` or `reviewed_by`, in `create`, `update`, `approve`, and `reject`. Re-verified end-to-end: submission, approval, and rejection all now record the correct employee ID, and the full Supervisor → Production Head → Approved → Visible-in-Reports flow was re-tested and confirmed correct after the fix.

### Bug found and fixed — SQL comment splitting (Performance Scoring Engine)
**The migration/seed runners' naive "split SQL on semicolons" logic didn't account for semicolons inside `--` comments.** This migration's own header comment contained ordinary prose ending in a semicolon ("...tracked elsewhere in this system;"), which the splitter mistook for a statement terminator, silently truncating a `CREATE TABLE` statement mid-definition and producing a syntax error. Found immediately when running `npm run migrate` against a live database — the exact kind of bug that only surfaces by actually executing the migration, not by reading it.

**Fix:** both `migrate.ts` and `seed.ts` now strip full-line `--` comments before splitting on semicolons. Re-verified: the migration applies cleanly, and a second run correctly reports it as already applied.

### Bug found and fixed — manual KPI entry required an unnecessary employee link (Performance Scoring Engine)
**The same "override-permission holder with no Employee Master record" bug class this project fixed once already, recurring in a new location.** `recordManualScore` independently called `requireEmployeeForUser` on the acting user rather than reusing the established nullable pattern, so an admin with `kpi.score.manual_entry` but no personal employee record was blocked from recording any manual score at all. A related consistency issue was caught in the same fix: the audit log's `actorUserId` was being set to an *employee* ID instead of the actual login user ID, inconsistent with every other audit call site in this app.

**Fix:** the acting employee ID is now optional (`entered_by` is nullable, resolved best-effort), and the audit log always receives the real user ID separately. Re-verified: an admin with no employee link can now record manual KPI scores, and the resulting composite score recomputation was confirmed correct by hand (`(0×10 + 100×10 + 88×10 + 91.67×20)/50 = 74.27`).

### Bugs found and fixed — CRM & Merchant Performance Management (four in one pass)
**1. `created_by`/`logged_by`/`uploaded_by` were `NOT NULL` foreign keys to `employees`** — the fourth occurrence of this project's recurring "login user ID vs. employee ID" bug class. An admin with no personal Employee Master record failed with a foreign key violation on the very first live lead-creation test. **Fixed** with `011_crm_nullable_actor_fks.sql`, relaxing all three columns to nullable (they're audit attribution, not access control).

**2. That fix immediately broke lead retrieval.** The lead-detail query used an `INNER JOIN` on `created_by`; once that column could legitimately be `NULL`, any lead created by an unlinked admin silently vanished from `GET /crm/leads/:id` and the list endpoint (404 / empty, no error). Caught within the same test session — the same lead that had just been created successfully returned "not found" moments later. **Fixed** by changing it to a `LEFT JOIN`.

**3. `DELAYED` is a MySQL reserved word** (legacy `INSERT DELAYED` syntax), used as a raw SQL column alias in two places (`MerchantMetricsService` and the Scoring Engine's new `crm_delay_control` calculator) — both failed with a SQL syntax error the moment either was actually queried, invisible to any static check. **Fixed** by renaming both aliases to `delayed_count`.

**4. Bulk Excel import generated duplicate lead codes.** `bulkImport` computed every row's lead code upfront via a `COUNT(*)`-based sequence before inserting any of them, so every row in a multi-row file received the identical "next" code — the second row's insert then failed on a duplicate-key violation. Caught by testing an actual 3-row import file. **Fixed** by generating and inserting each row's code immediately, one at a time, so the count genuinely reflects prior rows already committed in the same batch; re-verified with the same file producing three unique, sequential codes.

### No new bugs — Universal Notification & Escalation Engine
Worth calling out specifically: this module's core design decision (keying notifications to `users.id` instead of `employees.id`, learned directly from the four prior occurrences above) meant this was the first module in the project to ship with **zero new bugs found during live testing.** The escalation engine's hardest paths — manager-chain resolution, an original notification surviving its own escalation unmutated, and an unconfigured level skipping gracefully instead of crashing — were all verified correct on the first pass.

### Bug found and fixed — JSON column double-parsing (Reports & Business Intelligence)
**`JSON.parse()` was called on a value the database driver had already parsed.** MySQL's `JSON` column type is automatically deserialized into a real JavaScript object by `mysql2`, but `MySqlReportMetaRepository`'s row-mapping functions called `JSON.parse(row.filters)` unconditionally, assuming it was still a string. This threw `"[object Object]" is not valid JSON` the instant a saved report or scheduled report was actually created against a live database — not caught by type-checking, since the driver's return type doesn't distinguish "still a JSON string" from "already an object" at compile time.

**Fix:** both mapping functions now check `typeof value === "string"` before parsing. Re-verified: creating a saved report, adding it to favourites, and creating a scheduled report all succeeded afterward, with `filters` correctly returned as a real object in every response.

### Bugs found and fixed — Behaviour Intelligence Engine (two in one pass)
**1. A self-inflicted schema contradiction.** `manager_feedback.submitted_by` was declared `NOT NULL` while its own foreign key action was `ON DELETE SET NULL` — a direct contradiction MySQL correctly rejected at `CREATE TABLE` time, the moment this migration actually ran. **Fixed** by making the column nullable, consistent with every other actor-attribution field fixed the same way earlier in this project.

**2. A real logic bug, caught by re-reading the code rather than by a failed request.** `ManagerFeedbackService.submit` used `authorizeManagerOnly()`'s return value as the acting manager's own employee record for `submitted_by` — but that method returns the *target* (the direct report being reviewed), not the actor, a fact already established by how every other caller of it in this codebase uses it. Left as written, feedback would have silently recorded the wrong person as its author. **Fixed** by resolving the actor's own employee record separately (nullable, best-effort) and using `authorizeManagerOnly()` purely for its authorization check; re-verified live that a manager's feedback now correctly records the manager as `submittedBy`, not the employee being reviewed.

### No new bugs — Executive Meeting Engine
This module applied the "actor-attribution fields must be nullable" lesson (learned the hard way across four earlier modules, then again in Behaviour Intelligence) **from the start** — `organized_by` and `uploaded_by` were designed nullable in the very first draft of the schema, not fixed after a failed migration. The result: this migration applied cleanly on the first attempt, and the entire feature set (meeting creation with auto-linked previous MOM, review sections correctly distinguishing report-backed vs. notes-only, the Decision Register, and — the highest-risk integration — meeting actions genuinely creating real `delegated_tasks` rows and real `notifications` rows, verified by directly querying the database rather than trusting the API response) passed live testing with zero fixes required.

### No new bugs — Enterprise Document Management System
The same lesson, applied again from the start: `owner_id`, `uploaded_by`, and `reviewed_by` were all designed nullable in the first draft. This is now the second consecutive module (after the Executive Meeting Engine) to ship its schema migration clean on the first attempt. The full live-tested feature set — version approval correctly gated to only the latest version, polymorphic entity linking round-tripping correctly, confidential documents filtered out of listings entirely (not redacted) and denied by ID with a specific message, expiry alerts correctly reusing the Notification Engine (including the honest edge case of a document with no owner producing no notification rather than a crash), and both tag- and text-based search — passed with zero fixes required.

### No new bugs — KPI Engine
Third consecutive module to ship its schema clean on the first attempt (`responsible_employee_id`, `department_id`, `entered_by` all nullable from the start). This module's real risk was never the schema, though — it was the formula evaluator, since it executes admin-supplied text. Every safety boundary was tested directly, not assumed: code-injection attempts, disallowed syntax, unknown variables, division by zero, and mismatched parentheses were all correctly rejected with specific, honest error messages, and a genuinely valid formula was correctly accepted and sample-evaluated. Score computation, traffic-light thresholds, history, dashboard aggregation, and self-service employee scoring all passed live testing with zero fixes required. (One SQL syntax typo — a missing closing parenthesis — was caught and fixed while writing the seed file, before it was ever run; noted here only for completeness of the record, since it never reached a live test.)

### Gaps found and fixed
- **No `.env.example` for the frontend.** Only the backend had one. Added `apps/frontend/.env.example`.
- **The architecture spec (`LII-Performance-Nexus-Architecture.md`) was never actually part of the repository** — it existed only as a separately-delivered document, while the README referenced it as if it shipped alongside the code. Moved it into `docs/LII-Performance-Nexus-Architecture.md` and fixed the reference paths, so cloning this repo actually gets you the document it points to.
- **No lint configured anywhere**, despite the tooling stack implying it. Added ESLint (`.eslintrc.json`) + a `lint` script to both `apps/backend/package.json` and `apps/frontend/package.json`. Backend lints clean with zero issues. Frontend had 3 pre-existing `react-hooks/exhaustive-deps` warnings (intentional mount-only/selector-only effects) — left as warnings, not errors, and annotated in code with `eslint-disable-next-line` plus a comment explaining why each is intentional, rather than restructured, since restructuring wasn't broken behavior.
- **No consolidated schema reference.** Added `database/schema.sql` — a `mysqldump --no-data` snapshot of the real, migrated schema (verified to import cleanly into a fresh empty database on its own). The migration files remain the source of truth for schema changes; this is a convenience reference, and the file itself says so.
- **No TESTING.md at the time.** Added credentials and per-role test cases (this file has since been superseded by `TESTING_CHECKLIST.md` and the automatic 7-role `npm run seed:demo`, added in the Final Stabilization Pass above).

### Verified working end-to-end (not just "should work")
Every item below was tested against a live server + live MySQL instance, not inferred from code reading:
- `npm install` clean on both apps (fresh `node_modules`, no peer-dep errors)
- `npm run build` clean on both apps (zero TypeScript errors)
- `npm run lint` clean on both apps (backend: 0 issues; frontend: 0 errors / 3 documented warnings)
- Backend starts (`npm start`) against a real MySQL 8.0 database and responds on `/api/health`
- Frontend dev server (`npm run dev`) starts and serves on `:5173`
- `npm run migrate` applies all 4 migrations to a real database with zero errors
- `npm run seed` seeds permissions/roles and creates the bootstrap admin, and correctly **re-syncs** all 41 permissions onto System Admin even on repeat runs
- Login returns a valid access token + sets the refresh cookie
- `/me/permissions` correctly reflects the logged-in user's actual permission set
- Requests with no token → `401`; requests with a garbage token → `401`; requests with a valid token but missing permission → `403` with the specific missing permission key named
- Refresh token rotation works; **logout genuinely revokes** the refresh token (confirmed: refresh attempt after logout fails with `401`, not silently ignored)
- **Live permission revocation confirmed**: granted a permission to a role, the *already-issued, unrefreshed* access token immediately gained access; revoked it, the same token immediately lost access again — no re-login or token refresh needed either way. This is the architecture doc's "live DB-backed check, not JWT claims" design actually holding up, not just a comment claiming it does.
- CORS correctly configured for the frontend origin (`http://localhost:5173`) with credentials, verified via actual preflight + cross-origin request
- `database/schema.sql` imports standalone into a brand-new empty database with zero errors
- **Every single test case in the then-current `TESTING.md`** (all of sections 3–7: System Admin, HR Admin, Supervisor, standard User, and cross-cutting checks) was executed against the live server with a real HR Admin/Supervisor/Worker test setup and real employment relationships (including the authorization bug above, its fix, and the fix's own regression check) — not written speculatively. (That file has since been superseded by `TESTING_CHECKLIST.md`.)

---

## Prerequisites
- Node.js 20+
- MySQL 8+ (or run `docker compose up -d` from the repo root to start one locally)

## Setup

### 1. Start the database
```bash
docker compose up -d
```
(Or point at any MySQL 8+ instance you already have — see `apps/backend/.env.example` for the expected connection variables.)

### 2. Backend
```bash
cd apps/backend
cp .env.example .env
npm install
npm run build      # compiles TypeScript AND copies .sql migration/seed assets into dist/
npm run migrate    # 001_init, 002_organization, 003_office_performance, 004_factory_performance, 005_workflow_engine, 006_office_performance_management, 007_factory_performance_management, 008_scoring_engine, 010_crm, 011_crm_nullable_actor_fks, 012_notifications, 014_reports_bi, 015_behaviour_intelligence, 017_executive_meetings, 018_document_management, 019_kpi_engine
npm run seed       # seeds roles/permissions + bootstrap admin - idempotent, safe to re-run (production-safe)
npm run seed:demo  # the above, PLUS all 7 role-based test logins and sample demo data - see TESTING_CHECKLIST.md
npm run dev        # http://localhost:4000
```

Alternative to steps 4–5 above: import `database/schema.sql` directly into an empty database, then run `npm run seed` on top of it (the seed script only needs the tables to exist — it doesn't care whether they got there via `migrate` or via the consolidated `schema.sql`).

Bootstrap admin account created by the seed script — **see `TESTING_CHECKLIST.md` for this and the other 6 test logins (via `npm run seed:demo`).**

### 3. Frontend
```bash
cd apps/frontend
cp .env.example .env.development
npm install
npm run dev         # http://localhost:5173
```

### 4. Verify
- `npm run lint` in either app should exit clean.
- Log in at `http://localhost:5173/login` with the bootstrap admin credentials (see `TESTING_CHECKLIST.md`).
- The Admin panel should open directly to Users, with Roles/Permissions/Departments/Designations/Employees/Performance/Factory all reachable from the left nav.

---

## Getting a working Office/Factory Performance setup end to end
1. **Departments / Designations** → set up your master data.
2. **Employees** → create employee records. Set each employee's **Manager** (self-referencing link) — this drives who reviews whom (Office) and who can log production for whom (Factory).
3. **Users** → create login accounts for the people who need one.
4. Back on **Employees**, use the **Linked login** dropdown to connect an employee record to a user account. One login can't be linked to two employees (enforced server-side). Without this link, that user has no "My Goals"/"My Reviews"/"My Production" record.
5. **Office**: linked employee → **My Goals** (create/track, weighted, no fixed cycle) → **My Reviews** (initiate, self-assess, then their manager completes the manager assessment — score is a transparent, reproducible blend of goal achievement and manager rating).
6. **Factory**: set up **Production Lines** and **Shifts** (Admin nav → Factory), then a manager with direct reports uses **Production Entry** to log output per worker per line/shift/date; the line total is a live computed aggregate, not a stored figure. Workers check **My Production** to see their own history (read-only — entry is manager-only by design, not self-service).

## How authorization works (two different patterns, both intentional)
- **Users/Roles/Masters** (Departments, Designations, Employees, Production Lines, Shifts): flat RBAC — a route requires a specific permission key, checked live against the database on every request (not baked into the JWT), so a permission grant or revoke takes effect on the very next request, not after the token expires or the user re-logs in.
- **Office Performance (Goals/Reviews) and Factory Performance (Production Entries)**: authorized by **employment relationship**, checked in the service layer via `EmployeeScopeService` — an employee can always act on their own Office data; a manager can always act on their direct reports'; broader `performance.*`/`factory.entry.*` permissions exist only as an HR/admin **override**, layered on top of the relationship check, not instead of it. The one asymmetry: Office goals/self-assessment are self-service (a worker manages their own), while Factory production entries are explicitly **not** self-service (only a manager can log a worker's output) — this was a deliberate requirements decision, not an inconsistency.
- **The override check always runs first**, before the relationship check needs to resolve the acting user's own Employee Master record. This matters concretely: an HR/Admin user granted an override permission does not need to be a tracked employee themselves to use it (a real, ordinary case for back-office staff) — this was the exact bug found and fixed in this audit pass (see above).

## What's implemented (cumulative)

| Area | Details |
|---|---|
| **Auth** | Login/refresh/logout. JWT access token (15m) + opaque, hashed, revocable refresh token in an httpOnly cookie. Verified: revocation is real, not cosmetic. |
| **RBAC** | Roles + Permissions, live DB-backed checks. Verified: grant/revoke takes effect on an already-issued token with no refresh needed. |
| **Admin > Users** | CRUD + role assignment, permission-gated, audit-logged. |
| **Department / Designation Master** | Full CRUD, soft delete. |
| **Employee Master** | Full CRUD incl. department/designation/manager assignment, referential validation, optional linked login account. |
| **Office Performance** | Continuous goals (weighted, optional numeric target), progress history, ad-hoc two-step (Self → Manager) reviews with a transparent blended score. |
| **Factory Performance** | Production Line / Shift masters; manager-logged production entries (quantity vs. target) that roll up live into line/shift totals; workers get read-only self-view. |
| **Frontend** | All of the above as admin pages, plus self-service My Goals / My Reviews / My Production. |
| **Tooling** | ESLint configured and clean on both apps; build pipeline correctly packages SQL assets; consolidated `database/schema.sql` alongside the authoritative numbered migrations. |

## Permission keys (all modules)
```
identity.user.view / .create / .update / .deactivate
rbac.role.view / .create / .update / .delete
rbac.permission.view
rbac.userrole.assign
organization.department.view / .create / .update / .delete
organization.designation.view / .create / .update / .delete
organization.employee.view / .create / .update / .delete
performance.goal.view / .create / .update / .delete            (HR/admin override only - self & direct-report access doesn't need these)
performance.review.view / .create / .manager_submit            (same - override only)
factory.line.view / .create / .update / .delete
factory.shift.view / .create / .update / .delete
factory.entry.view / .create / .update / .delete               (HR/admin override only - direct managers don't need these)
```
127 permissions total (as of the Final Stabilization Pass), all seeded automatically and synced onto System Admin by `npm run seed`. **CEO, HOD, Supervisor, and Merchant** roles are now seeded with a sensible default permission set (see the Final Stabilization Pass above); **Employee** remains seeded with minimal self-service permissions by design, and **HR Admin** now includes practical HR-domain permissions beyond pure identity/RBAC administration. Every role's permissions remain fully editable via the Roles screen. See `TESTING_CHECKLIST.md` for all 7 test logins, created automatically via `npm run seed:demo`.

## Notes on scope decisions
- `bcryptjs` (pure JS) is used instead of `bcrypt` (native binding) purely for build portability in restricted sandboxes; swap back to `bcrypt` in `package.json` + the two import lines in `infrastructure/security/bcrypt.service.ts` / `infrastructure/database/mysql/seed.ts` if your deployment can compile native modules.
- The `AuditService` write-helper logs every write (goals, reviews, production entries, users, roles, masters) but there is still no audit *module* (routes/permissions/UI) — out of scope, documented as a future addition in the architecture doc.
- Migrations run via a minimal custom script (`migrate.ts`), not a full migration framework — sufficient for this scope; swap in a real migration tool (knex/umzug) before this goes near a production schema. `database/schema.sql` is a convenience snapshot, not a replacement for the migration files.

## Further reading
- `docs/LII-Performance-Nexus-Architecture.md` — the full technical architecture spec.
- `docs/WORKFLOW_ENGINE.md` — the Universal Workflow Engine: schema, APIs, validation rules, and UI.
- `docs/OFFICE_PERFORMANCE_MANAGEMENT.md` — Flowchart/Checklist/Delegation, the weighted scoring formula, and the 4-level dashboard.
- `docs/FACTORY_PERFORMANCE_MANAGEMENT.md` — the 8 factory departments, dual production methods, and the Supervisor → Production Head approval gate.
- `docs/SCORING_ENGINE.md` — the admin-configurable KPI engine, automatic weighted scoring, department overrides, ranking, and trend graphs.
- `docs/CEO_COMMAND_CENTER.md` — the cross-module aggregation view, its data sources, alert rules, and drill-down design.
- `docs/CRM_MERCHANT_PERFORMANCE.md` — the CRM's lead pipeline, follow-up tracking, Excel import/export, and the Merchant Score KPIs.
- `docs/NOTIFICATION_ENGINE.md` — the generic notification/escalation engine, its 5-level ladder, and the real cross-module trigger points.
- `docs/REPORTS_AND_BI.md` — the 12 report types, the uniform result shape that drives one export/render pipeline, and the chart type implementations.
- `docs/BEHAVIOUR_INTELLIGENCE.md` — the 11-component Behaviour Index, the 6 health scores, analytics, and the rule-based (not AI) Insights Engine.
- `docs/EXECUTIVE_MEETING_ENGINE.md` — meetings, review sections, the Decision Register, and how the Action Tracker reuses Delegation and the Notification Engine instead of building a second one.
- `docs/DOCUMENT_MANAGEMENT.md` — version control, the fixed approval gate, polymorphic entity attachment, expiry alerts, and confidential-document access control.
- `docs/KPI_ENGINE.md` — the safe formula evaluator, why this is separate from the Scoring Engine, and the Employee/Department/Company score calculation.
- `INSTALLATION_GUIDE.md` — step-by-step setup from a fresh clone.
- `DEPLOYMENT_GUIDE.md` — production builds, hosting, environment configuration, and going live.
- `USER_MANUAL.md` — day-to-day usage for every role.
- `ADMIN_MANUAL.md` — roles, permissions, master data, and configuring every engine.
- `TESTING_CHECKLIST.md` — the 7 test logins and a practical, section-by-section verification checklist.
- `database/schema.sql` — consolidated schema reference.
