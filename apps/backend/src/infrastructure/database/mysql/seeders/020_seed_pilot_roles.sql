-- Pilot stabilization: adds the 4 roles needed for full test-account
-- coverage (CEO, HOD, Supervisor, Merchant) alongside the 3 that already
-- existed (System Admin, HR Admin, Employee), and grants each a sensible
-- default permission set using pattern matching over the full permission
-- catalog rather than hand-listing every one. These are starting points
-- for a pilot, not fixed policy - editable anytime via Roles & Permissions
-- in the admin UI.

INSERT IGNORE INTO roles (id, name, description, is_system_role) VALUES
  (UUID(), 'CEO', 'Company-wide visibility across every module: dashboards, reports, behaviour analytics, KPIs, and executive meetings', 0),
  (UUID(), 'HOD', 'Head of Department - manages their department''s office/factory performance, approves documents, runs KPI entries', 0),
  (UUID(), 'Supervisor', 'Factory-floor supervisor - production entries, checklists, delegation to direct reports', 0),
  (UUID(), 'Merchant', 'CRM-focused - manages assigned leads and the sales pipeline', 0);

-- CEO: broad read access across the whole platform, plus the handful of
-- write actions an executive genuinely uses (running meetings, exporting
-- reports, triggering the insights engine and escalation checks).
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'CEO' AND (
  p.`key` LIKE '%view%'
  OR p.`key` IN ('meeting.create', 'meeting.update', 'meeting.mom.export', 'behaviour.insight.run',
                 'report.export', 'report.schedule.manage', 'report.schedule.run', 'notification.escalation.run')
);

-- HOD: department-level management across Office/Factory Performance,
-- Delegation, Documents, Meetings, KPIs, and Behaviour feedback.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'HOD' AND (
  p.`key` LIKE 'organization.employee.%' OR p.`key` = 'organization.department.view'
  OR p.`key` LIKE 'checklist.%' OR p.`key` LIKE 'delegation.%' OR p.`key` LIKE 'flowchart.%'
  OR p.`key` LIKE 'factoryentry.%' OR p.`key` LIKE 'factory.%'
  OR p.`key` LIKE 'kpi.%' OR p.`key` LIKE 'kpiengine.%'
  OR p.`key` LIKE 'behaviour.%' OR p.`key` = 'performance.dashboard.department.view'
  OR p.`key` LIKE 'meeting.%' OR p.`key` LIKE 'document.%'
  OR p.`key` LIKE 'report.%' OR p.`key` = 'workflow.view'
);

-- Supervisor: production entries, checklists, delegation to direct
-- reports, and enough visibility to act on notifications and documents.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Supervisor' AND (
  p.`key` LIKE 'factoryentry.%' OR p.`key` LIKE 'factory.entry.%' OR p.`key` = 'factory.line.view' OR p.`key` = 'factory.shift.view'
  OR p.`key` = 'checklist.instance.view' OR p.`key` LIKE 'delegation.%'
  OR p.`key` = 'kpiengine.entry.manage' OR p.`key` = 'kpiengine.definition.view'
  OR p.`key` = 'behaviour.feedback.submit' OR p.`key` = 'behaviour.index.view'
  OR p.`key` = 'meeting.view' OR p.`key` IN ('document.view', 'document.create')
  OR p.`key` = 'report.view'
);

-- Merchant: their own CRM lead pipeline, and enough visibility elsewhere
-- to act on notifications, documents (buyer documents), and reports.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Merchant' AND (
  p.`key` LIKE 'crm.%'
  OR p.`key` = 'document.view' OR p.`key` = 'report.view' OR p.`key` = 'behaviour.index.view'
);

-- Broaden the existing HR Admin role beyond pure identity/RBAC
-- administration into practical HR-domain access: employee/department
-- management, HR behaviour feedback visibility, and running HR-related
-- executive meetings.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'HR Admin' AND (
  p.`key` LIKE 'organization.%' OR p.`key` LIKE 'behaviour.%'
  OR p.`key` LIKE 'meeting.%' OR p.`key` LIKE 'document.%'
  OR p.`key` = 'performance.dashboard.department.view' OR p.`key` = 'report.view'
);
