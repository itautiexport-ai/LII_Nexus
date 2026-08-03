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
