# Admin Manual

Everything an administrator needs to configure and run LII Performance Nexus for a real company. For installing the system itself, see `INSTALLATION_GUIDE.md`; for end-user workflows, see `USER_MANUAL.md`.

## 1. Users, Roles, and Permissions

### The permission model
Every capability in the system is gated by a permission key (e.g. `document.view.confidential`, `kpiengine.definition.manage`). A **role** is just a named bundle of permissions. A **user** has one or more roles. Assigning or revoking a permission takes effect immediately — no restart, no code change.

### Built-in roles
The system ships with 7 roles out of the box:

| Role | Intended for | Default access level |
|---|---|---|
| System Admin | IT/platform owner | Every permission in the system |
| CEO | Executive leadership | Broad read access across every module, plus running meetings/insights/reports |
| HOD | Department heads | Manages their department's Office/Factory Performance, Delegation, Documents, KPIs, Meetings |
| HR Admin | HR / people ops | User/role administration, plus employee records, behaviour feedback, meetings |
| Supervisor | Factory floor leads | Production entries, checklists, delegation to direct reports |
| Merchant | CRM/sales staff | Their own lead pipeline and CRM dashboards |
| Employee | Everyone else | Self-service: their own tasks, checklists, notifications, KPI entries |

These are starting points, not fixed policy — every one of them is fully editable from **Roles & Permissions** in the admin UI. Nothing about a role name is special to the code; you can rename, delete, or recompose any non-system role's permission set freely.

### Creating a user
Admin UI → Users → **New User**. Set their email, temporary password, and employee details (department, designation, manager). Assign at least one role. The person changes their password on first login.

### Adjusting what a role can do
Admin UI → Roles & Permissions → select a role → check/uncheck permissions → Save. Changes apply to every user with that role immediately.

### The manager hierarchy matters
Many features (Delegation, Flowchart task assignment, Manager Feedback) restrict who can act on whose behalf based on the **actual manager_id chain** in Employee Master, not just role membership — a Supervisor role doesn't let you delegate to just anyone, only to your own direct reports, unless you also hold an explicit "assign to anyone" override permission (e.g. `meeting.action.assign_any`, `crm.lead.assign`). Keep the manager hierarchy in Employee Master accurate; it's load-bearing, not just organizational chart decoration.

## 2. Master Data

Before day-to-day use, set up:
- **Departments** and **Designations** (Organization → Departments / Designations)
- **Employees** (Organization → Employees) — link each to a User account, a Department, a Designation, and a Manager
- **Factory Departments, Shifts, Production Lines, Contractors** (Factory Performance) — needed before any factory production entry can be submitted
- **Machines** and **Products** (Documents → Machines & Products) — minimal reference lists so documents (manuals, drawings) have something real to attach to

## 3. Configuring the Scoring & KPI Systems

This system has **two distinct KPI/scoring mechanisms** — know which one you're in before configuring:

- **Performance Scoring Engine** (KPI Definitions, under Scoring) — KPIs backed by this system's own automated data (flowchart completion, checklist discipline, CRM follow-ups, etc.). Weights are configurable, but the underlying calculation logic for each KPI type is fixed in code.
- **KPI Engine** (separate section, "KPI Engine" in navigation) — genuinely no-code: you type an arithmetic formula (using only `target` and `actual`, e.g. `actual/target*100`), and Target/Actual are entered manually each period by whoever is responsible. Use this for anything the Scoring Engine doesn't already cover — Purchase and HR KPIs, in particular, have no automated data anywhere in this system and are only ever tracked here.

When creating a KPI Engine definition, use **Test Formula** before saving — it shows you a sample score so you catch a wrong formula before anyone starts entering real data against it.

### Traffic light thresholds
Both KPI systems support Green/Amber/Red bands, configurable per KPI (or globally for Behaviour Index components). Set these to match what "good," "watch," and "bad" actually mean for that specific metric — a 90% threshold makes sense for on-time delivery, not necessarily for every metric.

## 4. Behaviour Intelligence Engine

Under Behaviour → Components, adjust the weighting of the 11 components that make up the Behaviour Index (On-Time Completion, Delay Frequency, Consistency, Checklist/Delegation/Follow-up/CRM Discipline, Attendance, Improvement Trend, Manager Feedback). Weights are automatically renormalized over whichever components have data for a given employee in a given period — you don't need every component populated for the index to compute sensibly.

Under Behaviour → Insight Rules, adjust the thresholds that drive the rule-based Insights Engine (e.g. how many percentage points a productivity drop needs to trigger a flag). This is deterministic rule-based logic, not AI — there is a documented, currently-inert hook (`generateNarrativeSummary`) for a future AI integration, but nothing calls an external AI service today.

## 5. Notification Engine

Under Notifications → Templates, edit the wording, default priority, and action label for any of the 17 built-in notification types. Under Notifications → Escalation Rules, configure the 5-level escalation ladder (Supervisor → HOD → COO → CEO): Level 2 automatically falls back to an employee's actual manager if no specific role is assigned; Levels 3–5 require a role to be explicitly configured, or escalation to that level is skipped (and retried next time, not silently dropped).

Notification delivery is honestly limited to **in-app only** in this release — Email/WhatsApp/SMS/Push are recorded as "simulated," not actually sent, since no external channel integration exists yet.

## 6. Reports & Dashboards

Reports, Scheduled Reports, and Dashboard Widgets are all end-user self-service features (see `USER_MANUAL.md`) — as admin, your role is mostly ensuring the right people have `report.view` / `report.export` / `report.schedule.manage` permissions, and periodically checking Scheduled Reports if you want them running reliably (see the on-demand automation note in `DEPLOYMENT_GUIDE.md`).

## 7. Document Management

Confidential documents require the `document.view.confidential` permission — grant this narrowly (Contracts and sensitive Buyer Documents are the usual candidates), not broadly. Document approval is a fixed two-step gate (uploaded → pending approval → approved/rejected by someone with `document.approve`); a new version always resets to pending, so make sure whoever holds that permission actually reviews new versions rather than assuming an old approval still applies.

## 8. Executive Meetings

Meeting action items are real Delegated Tasks under the hood — anyone with `meeting.update` can add one, but assigning it to someone outside your own direct reports requires `meeting.action.assign_any` (typically held by CEO/HOD-level roles). This is intentional: it reuses the same manager-hierarchy protection Delegation already has, rather than a separate, looser rule for meeting-sourced tasks.

## 9. Data & Audit

Every create/update/delete/approve action across every module is recorded via the shared audit log — there is currently no dedicated "Audit Log" browsing screen in the UI, but every action is captured at the database level (`audit_logs` table) with the actor, action, entity, and before/after state, for compliance review via direct query if needed.

## 10. Common admin tasks, quickly

| Task | Where |
|---|---|
| Reset someone's password | Users → find user → Reset Password |
| Change what a role can see | Roles & Permissions → select role |
| Add a new department/designation | Organization → Departments / Designations |
| Set up factory shifts/lines before first production entry | Factory → Shifts / Production Lines |
| Grant confidential document access | Roles & Permissions → grant `document.view.confidential` |
| Force an escalation/expiry/report check right now | The relevant module's dashboard has a manual "Run Now" button |
| See who's overdue on what | Meetings Dashboard, Behaviour Analytics → Most Delayed, or the Notification Center's escalated items |
