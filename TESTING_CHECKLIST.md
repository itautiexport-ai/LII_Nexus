# Testing Checklist

Test logins and a practical checklist for verifying LII Performance Nexus is working correctly — for a first-time evaluation, after an upgrade, or before a pilot goes live. Every check below has actually been run against a live backend and a live MySQL 8.0 database; none of this is theoretical.

## 1. Test logins

Run `npm run seed:demo` (see `INSTALLATION_GUIDE.md`) to create all seven of these automatically, along with sample data in every module and a realistic manager hierarchy (CEO → HOD → Supervisor → Employee, HOD → Merchant).

| Role | Email | Password |
|---|---|---|
| Admin | `admin@liinexus.com` | `ChangeMe123!` |
| CEO | `ceo@liinexus.com` | `Test@1234` |
| HR | `hr@liinexus.com` | `Test@1234` |
| HOD | `hod@liinexus.com` | `Test@1234` |
| Supervisor | `supervisor@liinexus.com` | `Test@1234` (or `TestPass123!` if this account pre-existed from manual testing) |
| Merchant | `merchant@liinexus.com` | `Test@1234` |
| Employee | `worker@liinexus.com` | `Test@1234` (or `TestPass123!` if this account pre-existed) |

**Change or remove every one of these before real company data goes anywhere near this database.** `npm run seed` (without `:demo`) creates only the Admin account and is the production-safe option — see `DEPLOYMENT_GUIDE.md`.

## 2. Login & Authentication

- [ ] Each of the 7 logins above succeeds
- [ ] An incorrect password is rejected with a clear error, not a silent failure
- [ ] A logged-in session persists across a page refresh
- [ ] Logging out and back in works

## 3. Role Permissions

- [ ] Admin can access every admin screen (Users, Roles & Permissions, all module settings)
- [ ] Merchant can view/create/update CRM leads, but gets a permission error trying to manage KPI Engine definitions
- [ ] Employee can view their own tasks/notifications, but gets a permission error trying to view org-wide reports
- [ ] HOD can view their department's Behaviour Health and approve documents
- [ ] Changing a role's permissions in Roles & Permissions takes effect immediately for users with that role (no restart needed)

## 4. Master Data

- [ ] Departments, Designations, and Employees are all visible and creatable (Organization section)
- [ ] An employee's manager assignment is visible in their profile and reflected in the org hierarchy
- [ ] Factory Departments, Shifts, and Production Lines exist (needed before any production entry can be submitted)
- [ ] Machines and Products can be created (Documents → Machines & Products)

## 5. Office Performance

- [ ] A workflow can be created and a run started
- [ ] A flowchart task can be assigned to a direct report and appears in their task list
- [ ] A checklist template with items exists, and a checklist instance is visible for the current period
- [ ] A delegated task can be created and appears in the assignee's Delegation list
- [ ] The demo delegated task ("Prepare weekly production summary," HOD → Supervisor) is visible if `seed:demo` was run

## 6. Factory Performance

- [ ] A production entry can be submitted by a Supervisor (target/actual qty, delay, reason)
- [ ] The entry does NOT appear in default report views until approved (`forWork=true` reveals the pending queue)
- [ ] Approving the entry makes it appear in default views and in Factory Performance reports
- [ ] The demo factory entry (`DEMO-ORD-001`) is visible if `seed:demo` was run

## 7. CRM

- [ ] A lead can be created with a category, source, and sales stage
- [ ] Assigning a lead to a Merchant raises a real notification for that merchant
- [ ] Moving a lead's sales stage to "Order Won" or "Order Lost" auto-syncs its status and notifies the merchant
- [ ] The demo lead (`LEAD-DEMO01`) is visible if `seed:demo` was run
- [ ] CRM dashboards (Sales Pipeline, Merchant Performance) show real numbers, not zeros, once at least one lead exists

## 8. Notifications

- [ ] The bell icon shows an accurate unread count
- [ ] Clicking a notification marks it read and navigates to the relevant item
- [ ] Running the escalation check (`POST /notifications/run-escalation-check`, or the button in Escalation Rules) escalates an overdue, unactioned item to the assignee's manager
- [ ] An unconfigured escalation level (e.g. COO with no role assigned) is skipped, not silently guessed or crashed on

## 9. Reports

- [ ] All 12 report types run and return data (or an honest "no data" state, not an error) for a fresh install
- [ ] Excel, CSV, and PDF export each produce a real, openable file
- [ ] A report can be saved with a name and reloaded later
- [ ] A scheduled report can be created, and running the due-reports check (`POST /reports/scheduled/run-due`) generates it and notifies its owner

## 10. Behaviour Analytics

- [ ] An employee's Behaviour Index computes and shows a component breakdown
- [ ] Submitting Manager Feedback (as a manager, for their own direct report) changes that employee's Behaviour Index on next view
- [ ] Department/Executive Health dashboards show real, non-empty data once employees have activity
- [ ] Running the Insights Engine produces at least one rule-based finding when the underlying data warrants it (e.g. a repeat bottom-performer)

## 11. Executive Meetings

- [ ] A meeting can be created with agenda items and attendees
- [ ] Creating a second meeting of the same type auto-links it to the previous one
- [ ] An action item created in a meeting appears in the assignee's own Delegation list (not just the meeting's own action list)
- [ ] The Minutes of Meeting (MOM) view shows agenda, decisions, actions, and (for a second meeting of the same type) pending actions carried forward
- [ ] MOM exports to a real, openable PDF

## 12. Documents

- [ ] A document can be uploaded with a category, and its first version is `pending_approval`
- [ ] Approving the version moves the document's overall status to `approved`
- [ ] Uploading a new version resets the document to `pending_approval` again
- [ ] A document marked confidential is invisible in listings to a user without `document.view.confidential`, and returns a specific 403 (not a generic error) if accessed directly by ID
- [ ] A document can be linked to an employee, and appears when querying documents for that employee
- [ ] Setting an expiry date and running the expiry check (`POST /documents/check-expiries`) notifies the document's owner

## 13. KPI Engine

- [ ] A KPI can be created with a formula, and **Test Formula** shows a sample score before saving
- [ ] An invalid formula (unknown variable, disallowed syntax, or an attempted code-injection string) is rejected with a specific error, not silently accepted
- [ ] Recording a Target/Actual entry computes a score and traffic light correctly
- [ ] The Company/Department/Employee Score views show a weighted average that excludes KPIs with no entry yet for their current period (rather than counting them as zero)
- [ ] The two seeded demo KPIs (`On-Time Purchase Order Delivery %`, `Employee Attrition Rate`) are visible and scoreable

## 14. Cross-cutting

- [ ] Every module's audit trail records real actor/action/entity data (spot-check via direct database query if no audit UI is available yet)
- [ ] Re-running `npm run seed` or `npm run seed:demo` does not create duplicate rows anywhere (confirmed for KPI Engine definitions specifically — see the README's audit log for the bug this checklist step would have caught)
- [ ] `npm run migrate` on a completely empty database runs every migration in order with no errors

If every box above is checked, the system is ready for a real company pilot.
