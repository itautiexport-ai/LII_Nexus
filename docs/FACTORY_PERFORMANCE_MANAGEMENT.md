# Factory Performance Management

Department-level daily production reporting with a fixed two-step approval gate. This is a distinct concept from the earlier `production_lines`/`production_entries` module (individual worker output vs. quota, feeding that worker's Factory Performance score) — this module is departmental *operational reporting* for management visibility, with its own approval workflow, so it gets its own tables rather than overloading the existing ones. Both modules coexist; see the note at the bottom on when to use which.

---

## Departments (seeded)

Eight named factory departments are seeded automatically by `npm run seed`, each with an admin-configurable production method:

| Department | Seeded method |
|---|---|
| Machine Shop | Method 2 — Component Level |
| Assembly | Method 1 — Finished SKU |
| Sanding | Method 2 — Component Level |
| Finishing | Method 1 — Finished SKU |
| Packing | Method 1 — Finished SKU |
| Warehouse | Method 1 — Finished SKU |
| Metal | Method 2 — Component Level |
| Quality | Method 1 — Finished SKU |

An admin can change any department's method at any time via `PATCH /factory-departments/:id` — this is a live setting, not fixed at seed time. New departments can be added (`POST /factory-departments`) if the factory's structure changes.

## Two production methods — enforced, not just labeled

- **Method 1 — Finished SKU**: the entry records a `skuCode`; `componentName` must be empty.
- **Method 2 — Component Level**: the entry records a `componentName`; `skuCode` must be empty.

This is enforced **twice**, independently:
1. **Application-level**: a Zod refinement rejects a request where the method doesn't match which field is populated, and the service layer separately rejects an entry whose declared method doesn't match the *department's currently configured* method.
2. **Database-level**: a `CHECK` constraint on `factory_production_entries` makes the same rule structurally impossible to violate even by a direct SQL insert, bypassing the API entirely.

Verified live: submitting a Method 1 entry against a Method-2-configured department is rejected with a clear message naming the department's actual configured method; submitting both `skuCode` and `componentName` together is rejected by the Zod layer before it ever reaches the database.

## Production Entry fields

Every field from the spec is captured: Date, Shift, Department, Order (reference), SKU/Component, Target Qty, Actual Qty, Target CBM, Actual CBM, Target Labour (hours), Actual Labour (hours), Delay (minutes) + Delay Reason, Rejection Qty, Rework Qty, Supervisor, Contractor/Team, Remarks, and Photos/Attachments (see "Files" below).

## Approval workflow — Supervisor → Production Head → Approved → Visible in Reports

This is implemented as a **fixed, purpose-built two-state approval gate** on the entry itself (`submitted → approved` or `submitted → rejected`), not routed through the generic Workflow Engine — a fixed, always-exactly-two-step process is simpler and more direct to build this way than shoehorning it into a variable-length generic workflow definition. If a future requirement needs a variable or longer approval chain here, that's the point at which routing through the Workflow Engine would start paying for itself; for a fixed two-step gate, it wouldn't.

- **Submission** (`POST /factory-entries`, needs `factoryentry.create`): a supervisor submits the entry. `submitted_by` is resolved from the supervisor's own linked Employee Master record (not their login/user ID — see the bug note below).
- **Approval/Rejection** (`PATCH /factory-entries/:id/approve` or `/reject`, needs `factoryentry.approve`): a Production Head reviews. Rejecting requires a reason and does not delete the entry — it's preserved with `status = rejected` and the reason, for audit purposes.
- **Editing** is only possible while `status = submitted` — once reviewed (either direction), the entry is locked. Only the original submitter (or an admin override) can edit it before review.
- **"Visible in Reports"**: `GET /factory-entries` defaults to **approved-only** results. Passing `?forWork=true` returns the full working queue (submitted/rejected included) for supervisors and Production Heads managing the pipeline — reports and the working queue are the same endpoint with a different default filter, not two separate data paths that could drift out of sync.

Verified live end-to-end: an unapproved entry is invisible in the default (reports) view but visible in the working queue; approving it makes it appear in reports with the correct `reviewedBy`; a rejected entry never appears in reports at all; attempting to approve an already-reviewed entry is rejected with a clear conflict error.

## Bug found and fixed during this build
**`submitted_by` and `reviewed_by` are foreign keys to `employees`, but the service was initially passed the acting user's login ID, not their employee ID** — the same employee-vs-user distinction this project has hit before. This surfaced immediately as a `500` foreign key violation the first time a real submission was tested against a live database (not caught by type-checking, since both are typed as `string`). Fixed by resolving the acting user's own Employee Master record via `EmployeeScopeService.requireEmployeeForUser()` before writing `submitted_by`/`reviewed_by`, in `create`, `update`, `approve`, and `reject`. Re-verified: a real submission by a linked user now succeeds and records the correct employee ID.

## Files (Photos / Attachments)
`factory_production_entry_files` stores photo and attachment references (`kind` discriminator), the same pattern used for delegated-task proof uploads elsewhere in this app. As with that module, this records a filename and URL — there is no file storage backend wired up yet in this pass; a real upload endpoint/integration is a natural next step, not implemented here.

## Mobile entry
The entry submission form (`/admin/factory-entries/new`) is built mobile-first: single-column stacked layout, 16px input font size (prevents iOS auto-zoom on focus), full-width touch-friendly fields and buttons, and a 480px max-width container that reads identically on a phone or a desktop browser window. The department's configured method is inferred automatically — selecting a department switches the form between showing an SKU field or a Component field, so a supervisor never has to know which method a department uses in advance. The supervisor field is not a dropdown at all: it's resolved automatically from the logged-in user's own Employee Master link, so a supervisor is always submitting under their own name.

## New permission keys
```
factorydept.department.view / .create / .update / .delete
contractor.view / .create / .update / .delete
factoryentry.view / .create / .update / .delete / .approve
```
13 new permissions, seeded and auto-synced onto System Admin.

## Choosing between this module and the earlier Factory Performance Module
| | Earlier module (`production_lines`) | This module (`factory_production_entries`) |
|---|---|---|
| Unit of measurement | Individual worker's output vs. quota | Department's daily aggregate production |
| Feeds | The worker's personal Factory Performance score | Management reporting only |
| Who records it | The worker's manager, on the worker's behalf | A department supervisor, for the whole department |
| Approval | None | Supervisor → Production Head → Approved |
| SKU/Component/CBM/Labour tracking | No | Yes |

They're complementary, not competing — a factory could reasonably run both: the line-level module for individual performance scoring, this module for departmental production/quality/rejection reporting up to management.
