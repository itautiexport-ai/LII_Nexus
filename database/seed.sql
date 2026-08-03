-- LII Performance Nexus — Consolidated Seed Data (reference snapshot)
--
-- This file concatenates every SQL-based seeder in
-- apps/backend/src/infrastructure/database/mysql/seeders/ in the order
-- they run, for reference and manual inspection. It seeds: roles,
-- permissions, role-permission grants (including the CEO/HOD/Supervisor/
-- Merchant pilot roles), notification templates, escalation rules,
-- behaviour components, insight rules, and two example KPI Engine
-- definitions.
--
-- IT DOES NOT create the bootstrap admin user or any of the 7 test role
-- logins — those need bcrypt password hashing, which only the Node seeder
-- can do safely. This file is NOT a substitute for running:
--
--   npm run seed          # roles, permissions, bootstrap admin only (production-safe)
--   npm run seed:demo     # the above, PLUS all 7 test logins and sample demo data
--
-- Running `npm run seed` (or `seed:demo`) is the supported, idempotent way
-- to seed a database — every statement in it (and in this file) is safe to
-- run more than once. See INSTALLATION_GUIDE.md for the full sequence.

-- Seed: system admin role + core permissions + a bootstrap admin user
-- Bootstrap admin password is "ChangeMe123!" (bcrypt hash below) - MUST be changed after first login.

INSERT IGNORE INTO roles (id, name, description, is_system_role) VALUES
  (UUID(), 'System Admin', 'Full platform access', 1),
  (UUID(), 'HR Admin', 'Manages users, roles and permissions', 0),
  (UUID(), 'Employee', 'Standard employee access', 0);

INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'identity.user.view', 'identity', 'View users'),
  (UUID(), 'identity.user.create', 'identity', 'Create users'),
  (UUID(), 'identity.user.update', 'identity', 'Update users'),
  (UUID(), 'identity.user.deactivate', 'identity', 'Deactivate/delete users'),
  (UUID(), 'rbac.role.view', 'rbac', 'View roles'),
  (UUID(), 'rbac.role.create', 'rbac', 'Create roles'),
  (UUID(), 'rbac.role.update', 'rbac', 'Update roles / assign permissions'),
  (UUID(), 'rbac.role.delete', 'rbac', 'Delete roles'),
  (UUID(), 'rbac.permission.view', 'rbac', 'View permissions'),
  (UUID(), 'rbac.userrole.assign', 'rbac', 'Assign roles to users');
INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'organization.department.view', 'organization', 'View departments'),
  (UUID(), 'organization.department.create', 'organization', 'Create departments'),
  (UUID(), 'organization.department.update', 'organization', 'Update departments'),
  (UUID(), 'organization.department.delete', 'organization', 'Delete departments'),
  (UUID(), 'organization.designation.view', 'organization', 'View designations'),
  (UUID(), 'organization.designation.create', 'organization', 'Create designations'),
  (UUID(), 'organization.designation.update', 'organization', 'Update designations'),
  (UUID(), 'organization.designation.delete', 'organization', 'Delete designations'),
  (UUID(), 'organization.employee.view', 'organization', 'View employees'),
  (UUID(), 'organization.employee.create', 'organization', 'Create employees'),
  (UUID(), 'organization.employee.update', 'organization', 'Update employees'),
  (UUID(), 'organization.employee.delete', 'organization', 'Deactivate/delete employees');
INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'performance.goal.view', 'performance', 'View goals belonging to other employees'),
  (UUID(), 'performance.goal.create', 'performance', 'Create goals for other employees'),
  (UUID(), 'performance.goal.update', 'performance', 'Update goals belonging to other employees'),
  (UUID(), 'performance.goal.delete', 'performance', 'Cancel/delete goals belonging to other employees'),
  (UUID(), 'performance.review.view', 'performance', 'View reviews belonging to other employees'),
  (UUID(), 'performance.review.create', 'performance', 'Initiate a review for other employees'),
  (UUID(), 'performance.review.manager_submit', 'performance', 'Submit the manager assessment on behalf of another manager');
INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'factory.line.view', 'factory', 'View production lines'),
  (UUID(), 'factory.line.create', 'factory', 'Create production lines'),
  (UUID(), 'factory.line.update', 'factory', 'Update production lines'),
  (UUID(), 'factory.line.delete', 'factory', 'Delete production lines'),
  (UUID(), 'factory.shift.view', 'factory', 'View shifts'),
  (UUID(), 'factory.shift.create', 'factory', 'Create shifts'),
  (UUID(), 'factory.shift.update', 'factory', 'Update shifts'),
  (UUID(), 'factory.shift.delete', 'factory', 'Delete shifts'),
  (UUID(), 'factory.entry.view', 'factory', 'View production entries for other employees'),
  (UUID(), 'factory.entry.create', 'factory', 'Record production entries for employees you do not directly manage'),
  (UUID(), 'factory.entry.update', 'factory', 'Correct production entries for employees you do not directly manage'),
  (UUID(), 'factory.entry.delete', 'factory', 'Delete production entries for employees you do not directly manage');
INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'workflow.view', 'workflow', 'View workflow definitions'),
  (UUID(), 'workflow.create', 'workflow', 'Create workflow definitions'),
  (UUID(), 'workflow.update', 'workflow', 'Edit workflow definitions and stages'),
  (UUID(), 'workflow.delete', 'workflow', 'Delete workflow definitions'),
  (UUID(), 'workflow.publish', 'workflow', 'Change workflow status (activate/deactivate/archive)');
INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'flowchart.run.view', 'officeperf', 'View workflow runs and tasks for other employees'),
  (UUID(), 'flowchart.run.create', 'officeperf', 'Start a new workflow run'),
  (UUID(), 'flowchart.task.assign', 'officeperf', 'Assign a flowchart task to an employee you do not directly manage'),
  (UUID(), 'flowchart.task.update', 'officeperf', 'Update the status of a flowchart task belonging to another employee'),
  (UUID(), 'checklist.template.view', 'officeperf', 'View checklist templates'),
  (UUID(), 'checklist.template.create', 'officeperf', 'Create checklist templates'),
  (UUID(), 'checklist.template.update', 'officeperf', 'Edit checklist templates and assignments'),
  (UUID(), 'checklist.template.delete', 'officeperf', 'Delete checklist templates'),
  (UUID(), 'checklist.instance.view', 'officeperf', 'View checklist completion for other employees'),
  (UUID(), 'delegation.task.view', 'officeperf', 'View delegated tasks for employees you do not directly manage'),
  (UUID(), 'delegation.task.create', 'officeperf', 'Delegate a task to an employee you do not directly manage'),
  (UUID(), 'delegation.task.update', 'officeperf', 'Update a delegated task belonging to another employee'),
  (UUID(), 'performance.dashboard.department.view', 'officeperf', 'View department-level performance dashboard'),
  (UUID(), 'performance.dashboard.company.view', 'officeperf', 'View company-wide (CEO) performance dashboard');
-- Seed the 8 named factory departments requested.
INSERT IGNORE INTO factory_departments (id, name, production_method) VALUES
  (UUID(), 'Machine Shop', 'component_level'),
  (UUID(), 'Assembly', 'finished_sku'),
  (UUID(), 'Sanding', 'component_level'),
  (UUID(), 'Finishing', 'finished_sku'),
  (UUID(), 'Packing', 'finished_sku'),
  (UUID(), 'Warehouse', 'finished_sku'),
  (UUID(), 'Metal', 'component_level'),
  (UUID(), 'Quality', 'finished_sku');

INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'factorydept.department.view', 'factoryperf', 'View factory departments'),
  (UUID(), 'factorydept.department.create', 'factoryperf', 'Create factory departments'),
  (UUID(), 'factorydept.department.update', 'factoryperf', 'Update factory departments (incl. production method)'),
  (UUID(), 'factorydept.department.delete', 'factoryperf', 'Delete factory departments'),
  (UUID(), 'contractor.view', 'factoryperf', 'View contractors/teams'),
  (UUID(), 'contractor.create', 'factoryperf', 'Create contractors/teams'),
  (UUID(), 'contractor.update', 'factoryperf', 'Update contractors/teams'),
  (UUID(), 'contractor.delete', 'factoryperf', 'Delete contractors/teams'),
  (UUID(), 'factoryentry.view', 'factoryperf', 'View factory production entries'),
  (UUID(), 'factoryentry.create', 'factoryperf', 'Submit a factory production entry (Supervisor step)'),
  (UUID(), 'factoryentry.update', 'factoryperf', 'Edit a submitted (not yet approved) factory production entry'),
  (UUID(), 'factoryentry.delete', 'factoryperf', 'Delete a factory production entry'),
  (UUID(), 'factoryentry.approve', 'factoryperf', 'Approve or reject a factory production entry (Production Head step)');
-- Seed the 8 named KPIs, weighted to sum to 100 by default (admin-editable).
INSERT IGNORE INTO kpi_definitions (id, name, category, calculation_type, default_weightage, description) VALUES
  (UUID(), 'Flowchart', 'office', 'flowchart', 25.00, 'Completion rate of assigned flowchart (workflow) tasks due in the period.'),
  (UUID(), 'Checklist', 'office', 'checklist', 10.00, 'Completion rate of assigned checklist instances due in the period.'),
  (UUID(), 'Delegation', 'office', 'delegation', 10.00, 'Completion rate of delegated tasks due in the period.'),
  (UUID(), 'Target Achievement', 'factory', 'target_achievement', 20.00, 'Actual vs. target production quantity for the period.'),
  (UUID(), 'Quality', 'factory', 'quality', 15.00, 'Inverse of rejection + rework rate on submitted production entries.'),
  (UUID(), 'Attendance', 'factory', 'manual', 10.00, 'No time-clock system exists yet - recorded manually per period.'),
  (UUID(), 'Discipline', 'factory', 'manual', 5.00, 'No disciplinary tracking system exists yet - recorded manually per period.'),
  (UUID(), 'Reporting Timeliness', 'factory', 'timeliness', 5.00, 'Share of production entries submitted on the same day as the entry date.');

INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'kpi.definition.view', 'scoring', 'View KPI definitions'),
  (UUID(), 'kpi.definition.create', 'scoring', 'Create KPI definitions'),
  (UUID(), 'kpi.definition.update', 'scoring', 'Update KPI definitions and their weightage'),
  (UUID(), 'kpi.definition.delete', 'scoring', 'Delete KPI definitions'),
  (UUID(), 'kpi.weightage.manage', 'scoring', 'Set department-specific KPI weight overrides'),
  (UUID(), 'kpi.score.manual_entry', 'scoring', 'Record a manual KPI score for an employee (e.g. Attendance, Discipline)'),
  (UUID(), 'kpi.score.view', 'scoring', 'View KPI/composite scores for other employees'),
  (UUID(), 'kpi.ranking.view', 'scoring', 'View top/bottom performer and department rankings');
INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'commandcenter.view', 'commandcenter', 'View the CEO Command Center (cross-module aggregated view)');
INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'crm.lead.view', 'crm', 'View leads assigned to other merchants'),
  (UUID(), 'crm.lead.create', 'crm', 'Create leads'),
  (UUID(), 'crm.lead.update', 'crm', 'Edit leads assigned to other merchants'),
  (UUID(), 'crm.lead.delete', 'crm', 'Delete leads'),
  (UUID(), 'crm.lead.assign', 'crm', 'Assign or reassign a lead to a merchant'),
  (UUID(), 'crm.lead.import', 'crm', 'Bulk import leads from Excel'),
  (UUID(), 'crm.lead.export', 'crm', 'Export leads to Excel'),
  (UUID(), 'crm.dashboard.view', 'crm', 'View CRM dashboards (CEO / Lead Source / Export-Domestic / Follow-up Delay / Forecast Pipeline / Won-Lost)');

-- Merchant Score KPIs, plugged into the existing Scoring Engine under a new
-- 'crm' category. Weights are defaults and admin-editable/department-
-- overridable exactly like every other KPI in this system.
INSERT IGNORE INTO kpi_definitions (id, name, category, calculation_type, default_weightage, description) VALUES
  (UUID(), 'Follow-up Discipline', 'crm', 'crm_followup_discipline', 30.00, 'Share of a merchant''s follow-ups completed on or before their due date.'),
  (UUID(), 'Lead Conversion', 'crm', 'crm_conversion', 25.00, 'Won leads as a share of (won + lost) leads closed by the merchant in the period.'),
  (UUID(), 'Pipeline Value', 'crm', 'crm_pipeline_value', 20.00, 'Average win probability across the merchant''s currently active leads.'),
  (UUID(), 'Delay Control', 'crm', 'crm_delay_control', 15.00, 'Share of the merchant''s active leads that are not currently overdue for follow-up.'),
  (UUID(), 'Data Update Discipline', 'crm', 'crm_data_discipline', 10.00, 'Share of the merchant''s assigned leads updated within the last 14 days.');
INSERT IGNORE INTO notification_templates (id, notification_type, module, default_title, default_description, default_priority, default_action_label) VALUES
  (UUID(), 'new_task_assigned', 'general', 'New Task Assigned', 'You have been assigned a new task.', 'medium', 'View Task'),
  (UUID(), 'task_due_today', 'general', 'Task Due Today', 'A task assigned to you is due today.', 'high', 'View Task'),
  (UUID(), 'task_overdue', 'general', 'Task Overdue', 'A task assigned to you is now overdue.', 'urgent', 'View Task'),
  (UUID(), 'workflow_stage_assigned', 'workflow', 'Workflow Stage Assigned', 'A workflow stage has been assigned to you.', 'medium', 'View Stage'),
  (UUID(), 'workflow_approved', 'workflow', 'Approved', 'Your submission has been approved.', 'low', 'View'),
  (UUID(), 'workflow_rejected', 'workflow', 'Rejected', 'Your submission has been rejected. Review the reason and resubmit.', 'high', 'View'),
  (UUID(), 'delegation_assigned', 'office', 'Task Delegated to You', 'A task has been delegated to you.', 'medium', 'View Task'),
  (UUID(), 'checklist_missed', 'office', 'Checklist Missed', 'A checklist due for you was not completed on time.', 'high', 'View Checklist'),
  (UUID(), 'daily_dpr_pending', 'factory', 'Daily Production Report Pending', 'Today''s production entry has not been submitted yet.', 'high', 'Submit Entry'),
  (UUID(), 'factory_delay', 'factory', 'Factory Delay Reported', 'A production delay has been recorded.', 'high', 'View Entry'),
  (UUID(), 'machine_breakdown', 'factory', 'Machine Breakdown Reported', 'A machine breakdown has been reported.', 'urgent', 'View Details'),
  (UUID(), 'crm_followup_due', 'crm', 'Follow-up Due', 'A lead follow-up is due.', 'medium', 'View Lead'),
  (UUID(), 'crm_followup_missed', 'crm', 'Follow-up Missed', 'A lead follow-up was not completed by its due date.', 'high', 'View Lead'),
  (UUID(), 'lead_assigned', 'crm', 'New Lead Assigned', 'A new lead has been assigned to you.', 'medium', 'View Lead'),
  (UUID(), 'lead_won', 'crm', 'Lead Won', 'A lead has been marked Won. Congratulations!', 'low', 'View Lead'),
  (UUID(), 'lead_lost', 'crm', 'Lead Lost', 'A lead has been marked Lost.', 'medium', 'View Lead'),
  (UUID(), 'executive_meeting_reminder', 'general', 'Executive Meeting Reminder', 'You have an upcoming executive meeting.', 'high', NULL);

-- Escalation ladder defaults. Level 2 is left unconfigured (target_role_id
-- NULL) so it falls back to the assignee's direct manager by default;
-- levels 3-5 (HOD/COO/CEO) have no natural org-chart chain this deep in
-- Employee Master, so they start unconfigured too - an admin picks the
-- actual role for each via the UI once the org's real HOD/COO/CEO roles
-- exist. escalate_after_hours defaults are sensible starting points, fully
-- editable.
INSERT IGNORE INTO escalation_rules (id, level, level_label, target_role_id, escalate_after_hours) VALUES
  (UUID(), 2, 'supervisor', NULL, 24),
  (UUID(), 3, 'hod', NULL, 48),
  (UUID(), 4, 'coo', NULL, 72),
  (UUID(), 5, 'ceo', NULL, 96);

INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'notification.template.view', 'notifications', 'View notification templates'),
  (UUID(), 'notification.template.update', 'notifications', 'Edit notification template wording, priority, and default action'),
  (UUID(), 'notification.rule.view', 'notifications', 'View escalation rules'),
  (UUID(), 'notification.rule.manage', 'notifications', 'Edit escalation rule timings and target roles'),
  (UUID(), 'notification.view', 'notifications', 'View and manage notifications belonging to other users'),
  (UUID(), 'notification.escalation.run', 'notifications', 'Manually trigger the escalation/reminder check');
INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'report.view', 'reports', 'Run and view reports'),
  (UUID(), 'report.view.company', 'reports', 'Run company-wide reports (all employees/departments), not just own data'),
  (UUID(), 'report.export', 'reports', 'Export reports to Excel, CSV, or PDF'),
  (UUID(), 'report.schedule.manage', 'reports', 'Create and manage scheduled reports'),
  (UUID(), 'report.schedule.run', 'reports', 'Manually trigger the scheduled-report run check');
INSERT IGNORE INTO behaviour_components (id, component_key, label, weight, description) VALUES
  (UUID(), 'on_time_completion', 'On-Time Completion %', 20.00, 'Share of assigned work (flowchart, delegation, checklist) completed by its due date.'),
  (UUID(), 'delay_frequency', 'Delay Frequency', 10.00, 'Inverse of how often work is completed late, regardless of by how much.'),
  (UUID(), 'average_delay', 'Average Delay', 10.00, 'Inverse of the average number of days late, across delayed items only.'),
  (UUID(), 'task_consistency', 'Task Completion Consistency', 10.00, 'How stable an employee''s on-time rate has been over the last 3 months (low swings = high consistency).'),
  (UUID(), 'checklist_discipline', 'Checklist Discipline', 10.00, 'Checklist completion rate, same source as the Office Performance module.'),
  (UUID(), 'delegation_discipline', 'Delegation Discipline', 10.00, 'Delegated task on-time completion rate.'),
  (UUID(), 'followup_discipline', 'Follow-up Discipline', 10.00, 'CRM follow-up on-time completion rate (merchants only - null for non-merchants).'),
  (UUID(), 'crm_discipline', 'CRM Data Discipline', 5.00, 'Share of assigned CRM leads updated within the last 14 days (merchants only).'),
  (UUID(), 'attendance_impact', 'Attendance Impact', 5.00, 'Manually recorded attendance score, same manual KPI as the Scoring Engine (no time-clock system exists).'),
  (UUID(), 'improvement_trend', 'Improvement Trend', 5.00, 'This period''s behaviour index versus the previous period''s, as a bonus/penalty.'),
  (UUID(), 'manager_feedback', 'Manager Feedback', 5.00, 'The employee''s manager''s qualitative rating for this period (1-5 stars, scaled to 0-100).');

INSERT IGNORE INTO insight_rules (id, rule_key, label, threshold_value, description) VALUES
  (UUID(), 'productivity_drop', 'Productivity Drop', 8.00, 'Flag a department/factory area whose target achievement fell by at least this many percentage points vs. the prior period.'),
  (UUID(), 'merchant_followups_missed', 'Merchant Missed Follow-ups', 3.00, 'Flag a merchant who missed at least this many follow-ups in the period.'),
  (UUID(), 'department_declining', 'Department Declining', 5.00, 'Flag a department whose behaviour index fell by at least this many points across two consecutive periods.'),
  (UUID(), 'consistency_improved', 'Consistency Improved', 10.00, 'Flag a department/area whose consistency component rose by at least this many points vs. the prior period.'),
  (UUID(), 'repeat_defaulter', 'Repeat Defaulter', 3.00, 'Flag an employee who appears in the bottom-performer list for at least this many consecutive periods.'),
  (UUID(), 'delay_spike', 'Delay Spike', 50.00, 'Flag an employee/department whose delay frequency rose by at least this percentage vs. the prior period.');

INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'behaviour.index.view', 'behaviour', 'View behaviour index and analytics for other employees'),
  (UUID(), 'behaviour.component.manage', 'behaviour', 'Edit behaviour component weights'),
  (UUID(), 'behaviour.feedback.submit', 'behaviour', 'Submit manager feedback for a direct report'),
  (UUID(), 'behaviour.feedback.view', 'behaviour', 'View manager feedback for other employees'),
  (UUID(), 'behaviour.insight.manage', 'behaviour', 'Edit insight rule thresholds'),
  (UUID(), 'behaviour.insight.run', 'behaviour', 'Manually trigger the insights engine'),
  (UUID(), 'behaviour.health.view', 'behaviour', 'View department/workflow/factory/CRM/merchant/executive health scores');
INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'meeting.view', 'meetings', 'View meetings and minutes'),
  (UUID(), 'meeting.create', 'meetings', 'Schedule and record meetings'),
  (UUID(), 'meeting.update', 'meetings', 'Edit meeting details, agenda, notes, decisions'),
  (UUID(), 'meeting.delete', 'meetings', 'Delete a meeting'),
  (UUID(), 'meeting.action.assign_any', 'meetings', 'Assign a meeting action to any employee, not just direct reports'),
  (UUID(), 'meeting.mom.export', 'meetings', 'Export Minutes of Meeting to PDF');
INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'document.view', 'documents', 'View non-confidential documents'),
  (UUID(), 'document.view.confidential', 'documents', 'View documents marked confidential'),
  (UUID(), 'document.create', 'documents', 'Upload new documents and versions'),
  (UUID(), 'document.update', 'documents', 'Edit document metadata, tags, folders, links'),
  (UUID(), 'document.delete', 'documents', 'Delete documents'),
  (UUID(), 'document.approve', 'documents', 'Approve or reject a document version'),
  (UUID(), 'document.folder.manage', 'documents', 'Create and manage document folders'),
  (UUID(), 'machine.manage', 'documents', 'Manage the Machine master'),
  (UUID(), 'product.manage', 'documents', 'Manage the Product master');
INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'kpiengine.definition.view', 'kpiengine', 'View KPI Engine definitions'),
  (UUID(), 'kpiengine.definition.manage', 'kpiengine', 'Create and edit KPI Engine definitions - no code required'),
  (UUID(), 'kpiengine.entry.manage', 'kpiengine', 'Record Target/Actual entries for a KPI period'),
  (UUID(), 'kpiengine.score.view', 'kpiengine', 'View Employee/Department/Company KPI Engine scores for others');

-- Two example KPIs demonstrating the no-code formula mechanism across
-- categories this system has no automated data for (Purchase, HR) -
-- proving the point of this engine rather than just describing it.
INSERT IGNORE INTO kpi_engine_definitions (id, name, category, formula, weightage, frequency, green_threshold, amber_threshold) VALUES
  (UUID(), 'On-Time Purchase Order Delivery %', 'purchase', 'actual/target*100', 20.00, 'monthly', 90, 70),
  (UUID(), 'Employee Attrition Rate (lower is better)', 'hr', '(target-actual)/target*100+100', 15.00, 'quarterly', 90, 70);
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
