# Office Performance Management

This is the first **business module** connected to the Universal Workflow Engine. It measures office employees across three distinct activity types — **Flowchart** (structured, multi-stage processes), **Checklist** (recurring routine work), and **Delegation** (ad-hoc assigned tasks) — and rolls them into a single weighted performance score, visible through four levels of dashboard (Employee → Manager → Department → Company/CEO).

---

## The three subsystems, and how work actually gets assigned

These three answers were locked in before building, because each one is a schema-defining decision:

### 1. Flowchart Management — connects to the Workflow Engine
A **Workflow Run** is one execution of a published (`active`) workflow — e.g., one specific purchase requisition going through the "Purchase Approval" workflow. Starting a run creates a single unassigned task for stage 1. **A manager must manually assign that task to a specific person before it can be worked** — this was the deliberate choice over "auto-assign by role" or "assign the whole run to one employee." When the assignee marks their task `completed`, the engine automatically creates the next stage's task (unassigned again, awaiting a manager's assignment) — or, if it was the last stage, marks the whole run `completed`.

- **Assignment** (`PATCH /flowchart/tasks/:id/assign`) requires being the target employee's direct manager (or an HR/admin override) — reuses `EmployeeScopeService.authorizeManagerOnly()`.
- **Status updates** (`PATCH /flowchart/tasks/:id/status`) require being the actual assignee (or override) — a manager who assigned a task cannot also complete it on the employee's behalf.
- Task status is `pending` / `running` / `completed`, plus a **derived, never-stored** `delayed` (computed live from `base_status` + `due_date`, so it can never go stale).

### 2. Checklist Management — admin-assigned templates, lazily generated instances
Admin creates a reusable template (title, frequency: daily/weekly/monthly, a list of checklist items) and assigns it directly to specific employees **or** to a role (resolved to that role's current members, not frozen at assignment time — gain the role later, you pick up the template automatically).

**There is no job scheduler in this stack.** Rather than requiring a cron job to generate "today's checklist" for every assigned employee every morning, instances are generated **lazily**: the first time an employee (or the scoring engine) asks for their checklist in a given period, the system creates it on the spot if it doesn't already exist, using a `(template, employee, period_key)` unique constraint to guarantee it's never double-generated. Verified: calling the endpoint twice in the same day returns the identical instance both times.

### 3. Delegation — strictly manager → direct report
`POST /delegation/tasks` requires the caller to be the target employee's **direct manager** (or HR/admin override) — this is the one subsystem in this module with no self-service path at all, matching your explicit answer. Supports due date, priority (low/medium/high/urgent), an attachment (added by the assigner) and a proof-of-completion upload (added by the assignee) — both modeled as the same `delegated_task_files` table, distinguished by a `kind` column, and **escalation** (the assigner can hand a task to someone else with notes, tracked separately from reassignment).

---

## MySQL schema

Nine tables added in `006_office_performance_management.sql`:

| Table | Purpose |
|---|---|
| `workflow_runs` | One execution of a workflow |
| `flowchart_tasks` | One stage-instance within a run; unassigned until a manager claims it for someone |
| `checklist_templates` | Reusable checklist definitions (title, frequency, status) |
| `checklist_template_items` | The items on a template |
| `checklist_assignments` | Template → employee OR template → role (exactly one, enforced by a CHECK constraint) |
| `checklist_instances` | One generated period-instance of a template for one employee, keyed by `period_key` |
| `checklist_instance_items` | Per-instance tick state for each template item |
| `delegated_tasks` | Ad-hoc manager → report task with due date, priority, status, escalation |
| `delegated_task_files` | Attachments and proof uploads (same table, `kind` discriminator) |

---

## Performance Score — Flowchart 80% / Checklist 10% / Delegation 10%

For a given window (today / this week / this month):

1. Each category's **completion rate** = completed ÷ total *due in that window*. A flowchart task counts as "due" if its `due_date` falls in the window; a checklist instance counts if its period overlaps the window; a delegated task counts if its `due_date` falls in the window.
2. **A category with nothing due in the window is excluded from both the numerator and the weight total** — not counted as 0%. An employee with no checklist assigned today isn't penalized for it; the remaining categories' weights are renormalized to fill the gap.
3. If literally nothing was due anywhere in the window, the overall score is `null` ("nothing to evaluate"), not 0.

This was verified end-to-end with real data: an employee with one completed delegation task (100%) and one checklist item unchecked out of three (0% — the instance wasn't fully complete) and zero flowchart tasks due that day correctly produced `(0×10 + 100×10) / (10+10) = 50`, not a score dragged down by a phantom flowchart component that had nothing due.

---

## Dashboards

| Level | Endpoint | Access |
|---|---|---|
| Employee | `GET /dashboard/employee` | Self-service — resolved from the caller's own linked employee record |
| Manager | `GET /dashboard/manager` | Self-service — the caller's direct reports, with today/pending/delayed counts and all three score windows per report |
| Department | `GET /dashboard/department/:departmentId` | Requires `performance.dashboard.department.view` |
| Company (CEO) | `GET /dashboard/company` | Requires `performance.dashboard.company.view` — aggregates every department's average into a company-wide figure |

All four were verified against real data with a real department, confirming the roll-up math is consistent at every level (an employee's score flows correctly into their department's average, which flows correctly into the company average).

---

## New permission keys
```
flowchart.run.view / .create
flowchart.task.assign / .update            (HR/admin override only - the manager-of / assignee path doesn't need these)
checklist.template.view / .create / .update / .delete
checklist.instance.view                     (override only - employees always see/tick their own)
delegation.task.view / .create / .update    (override only - manager-of/assignee/assigner paths don't need these)
performance.dashboard.department.view
performance.dashboard.company.view
```
14 new permissions, seeded and auto-synced onto System Admin.

## React UI
- **Flowchart** — run list (search/filter), start-run form, run detail with a stage-progress strip and per-stage assign/status controls.
- **Checklist Templates** (admin) — create with items + employee/role multi-assignment; **My Checklists** (employee) — tick-off cards per assigned template, grouped by period.
- **Delegation** — tabbed "Assigned to Me" (start/complete/add proof) vs. "Tasks I Delegated" (create, escalate when delayed).
- **Performance Dashboard** — tabbed Employee/Manager/Department/Company views, with the Department/Company tabs only shown to users holding the corresponding permission.

## What's out of scope for this pass
- No actual notification delivery when a flowchart stage starts, a task is escalated, etc. — the Workflow Engine's notification/escalation *rules* exist as configuration; nothing sends real emails/SMS yet in any module, including this one.
- No file storage backend — attachment/proof "uploads" record a filename and URL; there's no actual file upload endpoint or storage integration in this pass.
- No automatic escalation on overdue tasks — escalation is a manual action by the assigner (`PATCH /delegation/tasks/:id/escalate`), not a background job.
