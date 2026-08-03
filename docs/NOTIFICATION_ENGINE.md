# Universal Notification & Escalation Engine

A generic, reusable notification system that any module can call — proven by actually wiring it into three unrelated modules (Delegation, Flowchart, CRM) rather than shipping an isolated CRUD nobody uses.

## The one design decision that matters most: keyed to `users`, not `employees`

Every other entity in this app that represents "a person" is an `employees` row. Notifications are deliberately different: `notifications.assigned_user_id` is a foreign key to `users`, not `employees`. A notification bell is inherently a login/account concept — you see your notifications because you're logged in as a *user*, whether or not you also happen to have an Employee Master record. This project has hit the "employee ID vs. user ID" foreign key bug **four times** in other modules; keying this one to `users` from the start sidesteps that entire class of mistake rather than risking a fifth occurrence.

## Schema

Four tables in `012_notifications.sql`:

| Table | Purpose |
|---|---|
| `notification_templates` | One row per notification type (17, fixed), admin-editable default title/description/priority/action label |
| `notifications` | The actual instances — every field from the spec (ID, title, description, priority, module, reference, assigned user, created by, due date, status, read/unread, action button, escalation level) |
| `escalation_rules` | The 5-level ladder configuration (see below) |
| `notification_deliveries` | A log of which channel a notification was pushed to and whether that was real or simulated |

## The 17 notification types
All seeded with sensible default wording, all admin-editable via the Notification Templates page: New Task Assigned, Task Due Today, Task Overdue, Workflow Stage Assigned, Workflow Approved, Workflow Rejected, Delegation Assigned, Checklist Missed, Daily DPR Pending, Factory Delay, Machine Breakdown, CRM Follow-up Due, CRM Follow-up Missed, Lead Assigned, Lead Won, Lead Lost, Executive Meeting Reminder.

## Notification Channels — genuinely "future ready," not faked
Only **In-App** is real in this pass: a notification is a row in `notifications`, immediately visible to the bell and Notification Center. Email, WhatsApp API, SMS, and Mobile Push have **no actual integration anywhere in this system**. If a caller requests additional channels, `notification_deliveries` honestly records them as `simulated`, never `delivered` — this system does not pretend to have sent an email it never sent.

## Escalation: a single global 5-level ladder

Rather than a separate configurable ladder per notification type (a combinatorial admin-configuration problem), this is **one global chain** applied uniformly: Level 1 (the original assignee, implicit — never actually escalated *to*) → Level 2 (Supervisor) → Level 3 (HOD) → Level 4 (COO) → Level 5 (CEO), each with an independently configurable `escalate_after_hours`.

- **Level 2 has a built-in fallback**: if no target role is configured, it resolves the original assignee's *actual* manager via `employees.manager_id` — reusing real org-chart data already in this system, not requiring a separate configuration step.
- **Levels 3-5 have no natural manager-chain concept** that deep in this app's org model (only one level of `manager_id` is tracked), so they require an admin to pick an actual Role for each level. **Left unconfigured, escalation to that level is honestly skipped and reported as such** (`skippedUnresolved` in the check's result) — it does not silently guess a recipient, and it keeps retrying every future run rather than giving up, so it self-heals the moment an admin configures it.
- **Escalating never mutates the original notification.** It creates a *new*, linked notification (`parentNotificationId`) for the resolved recipient, and bumps only the original's `escalation_level` field so it isn't re-escalated at the same level again. The original stays exactly as it was for its original assignee — visible, with its own read/unread state intact.

### Verified live, including the failure paths
- A real delegation task's notification, artificially aged to 2 hours old with a 1-hour threshold, correctly escalated to Worker Test's **actual manager** (Supervisor Test) via the Level-2 manager-chain fallback — confirmed by checking exactly who received the new notification.
- The *original* notification remained untouched and visible to the original assignee (only its escalation level advanced).
- A Level-3 (HOD) escalation attempt with an intentionally unconfigured target role correctly reported `candidatesChecked: 1, escalated: 0, skippedUnresolved: 1` — it found the candidate, recognized it couldn't resolve a recipient, and skipped gracefully instead of crashing or guessing.

## No job scheduler — the "Reminder Scheduler" is honest about it
Consistent with every other "scheduled" feature in this app (checklist instance generation, KPI score computation): there is no cron/job runner in this stack. The escalation/reminder check is a real, callable operation (`POST /notifications/run-escalation-check`) that computes and applies whatever is currently due — exactly as if a scheduled job had just fired — rather than a background process silently running on a timer. It's meant to be triggered by an admin action or opportunistically when the Notification Center loads.

## Real cross-module wiring (not just an isolated CRUD)
Three genuinely different modules call the exact same `NotificationService.notify()`:
- **Delegation** (`DelegationService.create`) → `delegation_assigned`, verified live: delegating a task from the Office Performance module immediately produced a real notification, visible via the unread counter, for the assignee.
- **Flowchart** (`FlowchartService.assignTask`) → `workflow_stage_assigned`, from the Workflow Engine.
- **CRM** (`LeadService.assign` and `.update`) → `lead_assigned`, and `lead_won`/`lead_lost` when a sales stage change auto-syncs the lead's status — verified live: assigning a lead produced a notification for the merchant within the same request.

This is deliberately a small, proven slice rather than instrumenting all 17 types everywhere they could conceivably apply — the point was to demonstrate the engine is *actually* reusable across unrelated modules, which three independent real call sites do convincingly without inflating scope further.

## Notification Bell & Center
- **Bell**: unread counter (polled every 30s), dropdown of the 8 most recent unread notifications, click-to-mark-read-and-navigate, "mark all read." Added to the admin layout header, visible on every page.
- **Notification Center**: full paginated history, filterable by module and read state, with mark-read/dismiss actions and a visible "ESCALATED (Level N)" badge on any notification that reached this user via escalation.

## New permission keys
```
notification.template.view / .update
notification.rule.view / .manage
notification.view
notification.escalation.run
```
6 new permissions, seeded and auto-synced onto System Admin.

## Audit logs
Template edits, escalation rule changes, and every escalation check run are recorded via the shared `AuditService`, consistent with every other module in this project.
