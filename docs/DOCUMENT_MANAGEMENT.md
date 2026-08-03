# Enterprise Document Management System

Manages all 9 requested document types (SOPs, Drawings, Work Instructions, QC Formats, Policies, Contracts, Buyer Documents, Machine Manuals, Training Videos), with real version control, a fixed approval workflow, polymorphic attachment to six kinds of entity, expiry alerts, tags, folders, and confidential-document access control.

## A genuine gap, filled honestly rather than skipped

"Attach documents to Machines/Products" is a real requirement — but nothing in this entire system, across every module built so far, has ever had a Machine Master or a Product Master. (`factory_departments` represents a department/floor area, not an individual machine.) Rather than quietly dropping two of the six attachment targets, this migration adds two deliberately minimal master tables — `machines` and `products` — just a name, an optional code/SKU, and a status. This is the same pattern used when Factory Performance Management needed Contractors and nothing existed yet: add exactly what's genuinely missing, nothing more.

## Version Control — real history, not an overwritten pointer

A `document` record is metadata (title, category, folder, owner, overall status, expiry, confidentiality); the actual files live in `document_versions`, one row per version, each independently timestamped and attributed. Nothing overwrites a prior version's file reference — the full history is always there.

## Approval Workflow — a fixed two-state gate, per version

Every new version starts `pending_approval`. Approving or rejecting the **latest** version updates the document's overall `status` to match. Uploading a new version resets the document to `pending_approval` again — even a document that was previously approved needs its replacement version reviewed independently, verified live: approving v1 of a document moved its status to `approved`, and the mechanism to only ever review the *latest* version (not an older one) is enforced by the service layer, not just the UI.

This mirrors the same "fixed state machine, not the generic Workflow Engine" decision made for Factory Production Entry approval — a two-state gate is simpler and more direct than routing every document through a configurable workflow definition for something that's always exactly two steps.

## Polymorphic attachment — Employees, Machines, Products, Departments, Workflows, CRM Leads

`document_links` is a single table (`document_id`, `entity_type`, `entity_id`) covering all six attachment targets, since every one of this system's primary keys is a UUID `CHAR(36)` — no separate join table per entity type was needed. Verified live: linking a document to an employee and then querying "documents for this employee" round-tripped correctly.

## Expiry Alerts — reusing the Notification Engine, not a sixth alerting mechanism

Consistent with every other "scheduled" feature in this project (checklist generation, KPI scoring, notification escalation, scheduled reports): there's no cron job. `POST /documents/check-expiries` finds documents expiring within a configurable window and raises a **real** notification for each document's owner via the existing Notification Engine. Verified live: a policy document set to expire in 7 days correctly produced a genuine `notifications` row (`Document Expiring Soon: Annual Leave Policy`) for its actual owner — and, separately, a document created by a user with no linked Employee Master record correctly produced *no* notification (there's no one to notify), rather than crashing or guessing a recipient.

## Confidential documents — filtered out, not redacted

A document marked confidential requires `document.view.confidential` to see at all. Verified live at both boundaries:
- **Listing**: a user without the override permission sees a document list with the confidential document silently absent — not shown with fields blanked out, which would still leak its existence.
- **Direct access**: requesting the confidential document by ID directly returns a specific, honest `403` naming exactly which permission is missing.

## Search, Tags, Folders
Documents are searchable by title text and filterable by category, status, folder, and tag — verified live for both a tag-based and a text-based search returning the correct single result from a small test set. Folders are a simple self-referencing tree (`document_folders.parent_folder_id`), deliberately not an over-engineered CMS hierarchy.

## Preview — PDF Viewer, Image Viewer
The frontend infers preview mode from the file extension (`inferPreviewKind`) and renders a real inline `<embed>` for PDFs, `<img>` for images, `<video>` for video files, or a plain "no inline preview" message otherwise. Consistent with every other file-handling feature in this app: there's no real file storage behind these URLs in this pass (filename + URL only) — the preview mechanism itself is real and will render correctly the moment a real file storage backend is wired in behind these URLs.

## Audit Logs
Every document creation, update, deletion, version upload, approval/rejection, tag change, and link change is recorded via the shared `AuditService`, consistent with every other module in this project.

## New permission keys
```
document.view / .view.confidential / .create / .update / .delete / .approve
document.folder.manage
machine.manage
product.manage
```
9 new permissions, seeded and auto-synced onto System Admin.

## This module shipped its schema clean on the first attempt

Like the Executive Meeting Engine before it, this module designed all actor-attribution fields (`owner_id`, `uploaded_by`, `reviewed_by`) as nullable **from the very first draft** of the schema — a lesson this project learned the hard way across five separate earlier modules before finally internalizing it early enough to stop needing a second migration to fix it. The entire migration, and the full live-tested feature set (version approval, polymorphic links, confidential access control at both boundaries, expiry alerts correctly reusing the Notification Engine, search, and the honest "no owner, no notification" edge case), passed on the first attempt with zero new bugs found.

## UI
Documents list (search + category + tag filters), an upload form, a detail page combining live preview, full version history with approve/reject controls, tag editing, and the entity-linking panel, plus a combined Machines & Products admin page for the two minimal masters this module needed and added.
