# Executive Meeting Engine

A complete Executive Meeting module — Daily Production Meetings, Weekly Executive Meetings, Monthly Management Reviews, and Quarterly Reviews — with the single most important design decision being: **meeting actions are not a parallel task tracker.**

## The core design decision: actions ARE real Delegated Tasks

Every item added to a meeting's Action Tracker calls `DelegationService.create()` — the exact same code path Office Performance's own Delegation feature uses — and is permanently linked back to the resulting row via `meeting_actions.linked_delegated_task_id`. This single decision means:

- **"Every pending action automatically appears in Delegation"** is true by construction, not by a sync job — it *is* a delegation, from the moment it's created. Verified live: creating a meeting action immediately appeared in the assignee's own `/delegation/tasks` list, indistinguishable from a delegation created directly in that module (just prefixed with the meeting title for context).
- **"Automatic reminders"** and **"Escalation if action not completed"** are inherited for free from the Universal Notification & Escalation Engine, which already fires a real notification the moment a delegation is created and already has a working 5-level escalation ladder. No second reminder or escalation mechanism was built for this module — verified live: creating a meeting action produced a genuine row in `notifications` (`delegation_assigned`) automatically, with zero new code needed for that behavior.
- **Pending Actions / Completed Actions** are a read-through view joined against `delegated_tasks.base_status` — never a separately-maintained status column that could drift out of sync with the real task.

This is the same principle this whole project has followed with the Command Center, Reports & BI, and the Behaviour Intelligence Engine: reuse a real, already-tested engine through its actual public API rather than building a parallel version of it.

## Previous MOM — automatic, not a manual link

Creating a meeting automatically finds and links the most recent earlier meeting of the *same type* (`previous_meeting_id`) — no manual "link to previous meeting" step. Verified live: a second Weekly Executive Meeting created a week after the first automatically linked to it, and its generated MOM correctly listed the first meeting's still-pending action under "Pending Actions Carried Forward From Previous Meeting."

## Review Sections — reusing real report data, honest about what has none

Department, Performance, Factory, CRM, Sales, and Production Review sections link to an existing Reports & BI report type (`department_performance`, `employee_performance`, `factory_performance`, `crm_reports`, `sales_pipeline`, `production_reports` respectively) — the same real data, not re-collected a second way. **Purchase Review and HR Review have no automated data source anywhere in this system** (no Purchasing module, no dedicated HR/leave module exists) — those two sections are honestly notes-only, and the generated MOM marks each section's automated-data status explicitly rather than silently treating all nine the same. Verified live: setting a Factory review section correctly auto-populated `reportTypeRef: "factory_performance"`, while a Purchase review section correctly returned `reportTypeRef: null`.

## Generate MOM automatically — template assembly, not AI

"Automatically" means no one has to manually retype a meeting's structured data into a document — the MOM Generator assembles agenda, attendees, discussion notes, decisions, actions (with live status), review sections, and carried-forward pending actions from what was actually recorded. This is template-based assembly of real data, the same honest approach the Behaviour Intelligence Engine's Insights Engine took — no AI model is called anywhere in this feature.

## Export MOM to PDF
A real PDF via `pdfkit` (the same library added for Reports & BI), covering every section of the generated MOM. Verified: `file` reports "PDF document, version 1.3."

## Decision Register vs. Action Tracker
Kept as two genuinely distinct concepts: a **Decision** is a recorded choice with no owner or due date; an **Action** has an assignee, a target date, and a priority, and becomes a real, trackable Delegated Task. Conflating the two would have lost the "some things decided in a meeting just need to be recorded, not assigned to someone" case.

## Search previous meetings
Full support for searching by title/notes text, filtering by meeting type, status, and date range — verified live against real recorded meetings.

## New permission keys
```
meeting.view / .create / .update / .delete
meeting.action.assign_any
meeting.mom.export
```
6 new permissions, seeded and auto-synced onto System Admin.

## UI
Meetings list (search + type filter), a create form, a detail page covering every feature (attendees, agenda, 9 review sections, decision register, action tracker with live status, attachments, MOM PDF export), and a Meetings Dashboard (pending/completed/overdue action counts, upcoming meetings, meeting counts by type).

## Testing note
Every feature in this module was verified against a live server and a live database — including the one integration that mattered most: creating a meeting action and confirming, by directly querying the database, that it produced a genuine `delegated_tasks` row and a genuine `notifications` row, not just a plausible-looking API response. This was also the first module in this project's build to apply the "nullable actor-attribution fields" lesson (learned the hard way in four separate earlier modules) *from the start*, in `organized_by` and `uploaded_by` — and it shipped its schema migration clean on the very first attempt as a result.
