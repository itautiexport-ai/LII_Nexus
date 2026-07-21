INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'report.view', 'reports', 'Run and view reports'),
  (UUID(), 'report.view.company', 'reports', 'Run company-wide reports (all employees/departments), not just own data'),
  (UUID(), 'report.export', 'reports', 'Export reports to Excel, CSV, or PDF'),
  (UUID(), 'report.schedule.manage', 'reports', 'Create and manage scheduled reports'),
  (UUID(), 'report.schedule.run', 'reports', 'Manually trigger the scheduled-report run check');
