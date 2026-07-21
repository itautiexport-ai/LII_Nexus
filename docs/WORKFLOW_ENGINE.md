# Universal Workflow Engine

The workflow engine is the **definition/builder layer only** — it lets an admin design a workflow (name, department, description, status, version) as an ordered set of stages, each carrying its own approval/checklist/completion/notification/escalation configuration, with a drag-and-drop stage-ordering UI and a read-only flowchart view.

**Nothing is connected to any business module yet.** There are no `workflow_instances`, no in-flight tasks, no real approvals happening against real records (Purchase Approval, Leave Approval, etc.) — those will be built when a business module is wired to this engine in a future pass. This document describes the engine as it stands: a no-code workflow *designer*.

---

## Conceptual model

```
Workflow  (name, department, description, status, version)
   │
   └── Stages  (unlimited, ordered by `sequence`)
          │
          ├── Checklist Items      ("Tasks" — a list of things to tick off)
          ├── Mandatory Documents  (what must be attached before the stage can complete)
          ├── Notification Rules   (who gets told what, and when)
          ├── Escalation Rules     (what happens if a stage overruns)
          └── Completion Rule      (manual / approval-only / all-checklist-items / all-of-the-above)
```

"Approvals" and "Completion Rules" from the original spec are modeled as **configuration on a stage** (`approval_required` flag + `completion_mode` enum), not as separate top-level tables — a stage's completion criteria and approval requirement are properties of that stage, not independent entities with their own lifecycle. This keeps the schema proportionate to what's actually configurable today, while `completion_mode` is deliberately an extensible enum so new completion strategies can be added without a schema change.

---

## MySQL schema

Six tables, added in `apps/backend/src/infrastructure/database/mysql/migrations/005_workflow_engine.sql`:

| Table | Purpose |
|---|---|
| `workflows` | Top-level definition: name, department (FK → `departments`, nullable), description, status, version, soft-deletable |
| `workflow_stages` | Ordered stages per workflow; `sequence` is unique per workflow and drives both the flowchart and the drag-and-drop order |
| `workflow_stage_checklist_items` | Checklist/task labels for a stage |
| `workflow_stage_documents` | Mandatory document names for a stage, each independently flaggable as mandatory or optional |
| `workflow_stage_notification_rules` | Trigger event × channel × recipient, per stage |
| `workflow_stage_escalation_rules` | Days-until-escalation × target role × action, per stage |

Key design choices:
- **`responsible_role_id` and escalation/notification role references point at the existing `roles` table** (RBAC), not at individual users — a workflow stage is owned by a role ("Line Manager approves"), not a specific person, so it keeps working as staff change.
- **`sequence` has a unique constraint per workflow.** Reordering (drag-and-drop) is implemented as a two-pass update (negative placeholder values, then final values) specifically to avoid transiently violating that constraint mid-transaction.
- **Deleting a stage re-sequences the remaining stages to stay contiguous** (1..N, no gaps) — this matters because the flowchart and reorder-validation logic both assume a dense sequence.
- **`version` auto-increments whenever an *active* workflow's structure changes** (stage added/edited/removed/reordered) — editing a draft doesn't bump the version, since nothing is "live" yet to version against. This is enforced in the service layer, not the database.
- Full schema reference (all tables, this module included) lives in `database/schema.sql`.

---

## Backend validation (not just UI hints)

Enforced server-side via Zod schemas plus service-layer rules, so these hold even if a request bypasses the UI entirely:

- A stage with `checklistRequired: true` **must** include at least one checklist item.
- A stage with `completionMode: "all_checklist_items"` **must** include at least one checklist item (otherwise it could never complete).
- `minMandatoryDocuments` cannot exceed the number of documents actually listed for the stage.
- Stage names must be unique within a single workflow.
- A workflow status transition is only allowed along a defined state machine: `draft → active|archived`, `active → inactive|archived`, `inactive → active|archived`, `archived → draft` (retiring is a one-way door back to draft, not straight back to active).
- A stage-reorder request must contain **exactly** the stage IDs currently in that workflow — not more, not fewer — or it's rejected before touching the database.

---

## APIs

All endpoints require authentication and the listed permission. Base path: `/api/v1`.

| Method | Path | Permission | Purpose |
|---|---|---|---|
| GET | `/workflows` | `workflow.view` | List workflows. Query params: `search` (name), `departmentId`, `status`, `page`, `pageSize`. |
| GET | `/workflows/:id` | `workflow.view` | Full workflow detail including all stages and their nested config. |
| POST | `/workflows` | `workflow.create` | Create a workflow, optionally with an initial `stages[]` array. Starts as `draft`, version 1. |
| PATCH | `/workflows/:id` | `workflow.update` | Update name/department/description. |
| PATCH | `/workflows/:id/status` | `workflow.publish` | Change status, subject to the state machine above. |
| DELETE | `/workflows/:id` | `workflow.delete` | Soft delete. |
| POST | `/workflows/:id/stages` | `workflow.update` | Add a stage (always appended at the end; drag it into place afterward). |
| PATCH | `/workflows/:id/stages/:stageId` | `workflow.update` | Update a stage. Nested config (checklist/documents/notifications/escalations) is fully replaced on every update — the UI sends the complete current set, not a diff. |
| DELETE | `/workflows/:id/stages/:stageId` | `workflow.update` | Remove a stage; remaining stages are re-sequenced automatically. |
| PATCH | `/workflows/:id/stages/reorder` | `workflow.update` | Body: `{ "stageIds": [...] }` in the new order. This is what the drag-and-drop UI calls on drop. |

**New permission keys:** `workflow.view`, `workflow.create`, `workflow.update`, `workflow.delete`, `workflow.publish` — seeded and auto-synced onto System Admin like every other module.

### Example: creating a workflow with stages in one call
```json
POST /api/v1/workflows
{
  "name": "Purchase Approval",
  "description": "Standard purchase requisition approval flow",
  "stages": [
    {
      "name": "Requisition Submission",
      "responsibleRoleId": "<role-uuid>",
      "dueDays": 1,
      "checklistRequired": true,
      "checklistItems": [{ "label": "Item description filled" }, { "label": "Budget code attached" }],
      "mandatoryDocuments": [{ "documentName": "Quotation", "isMandatory": true }],
      "completionMode": "all_checklist_items"
    },
    {
      "name": "Manager Approval",
      "responsibleRoleId": "<role-uuid>",
      "dueDays": 2,
      "approvalRequired": true,
      "completionMode": "approval_only",
      "notificationRules": [{ "triggerEvent": "on_stage_start", "channel": "email", "recipientType": "responsible_role" }],
      "escalationRules": [{ "escalateAfterDays": 3, "escalateToRoleId": "<role-uuid>", "escalationAction": "notify_only" }]
    }
  ]
}
```

---

## React UI

- **Workflow list** (`/admin/workflows`) — search, status filter, pagination, click-through to the editor.
- **Workflow editor** (`/admin/workflows/:id`) — two tabs:
  - **Stage Builder**: metadata form + an ordered list of stage cards. Each card is collapsible; expanding it reveals the full config editor (role, due days, completion rule, checklist items, mandatory documents, notification rules, escalation rules) with add/remove controls for each list. Stages are reordered via native HTML5 drag-and-drop (no extra dependency) — dropping a card fires the `reorder` endpoint immediately.
  - **Flowchart View**: a read-only left-to-right node graph (built with `reactflow`) showing each stage in sequence, its responsible role, due days, and badges for approval/checklist/skippable — a visual sanity-check of the process before publishing it.
- Status actions (Move to active/inactive/archived/draft) and delete are permission-gated the same way as every other admin screen in this app (`PermissionGate` + server-side enforcement).

---

## Audit trail

Every mutation is recorded via the existing `AuditService`: `WORKFLOW_CREATED`, `WORKFLOW_UPDATED`, `WORKFLOW_STATUS_CHANGED`, `WORKFLOW_DELETED`, `WORKFLOW_STAGE_ADDED`, `WORKFLOW_STAGE_UPDATED`, `WORKFLOW_STAGE_REMOVED`, `WORKFLOW_STAGES_REORDERED`, and `WORKFLOW_VERSION_BUMPED` (logged separately when a structural edit to an *active* workflow triggers the automatic version increment).

---

## What's deliberately not here yet
- No `workflow_instances` / running-process tables — nothing executes yet.
- No actual notification delivery — `workflow_stage_notification_rules` is configuration for when this engine gets connected; no emails/SMS are sent from this pass.
- No escalation *execution* — same reasoning; the rules are defined, not yet acted upon.
- No file upload for "mandatory documents" — a stage records that a document named "Quotation" is required, not an actual uploaded file (there's no instance to attach a file to yet).

These are natural next steps once a real business module (Purchase Approval, Leave Approval, etc.) is connected to the engine — which, per your instruction, is intentionally out of scope for this pass.
