INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'workflow.view', 'workflow', 'View workflow definitions'),
  (UUID(), 'workflow.create', 'workflow', 'Create workflow definitions'),
  (UUID(), 'workflow.update', 'workflow', 'Edit workflow definitions and stages'),
  (UUID(), 'workflow.delete', 'workflow', 'Delete workflow definitions'),
  (UUID(), 'workflow.publish', 'workflow', 'Change workflow status (activate/deactivate/archive)');
