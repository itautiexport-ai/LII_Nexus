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
