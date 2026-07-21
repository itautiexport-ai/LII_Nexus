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
