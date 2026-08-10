-- Add the data_export.download permission
INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'data_export.download', 'export', 'Export data to Excel');

-- Grant it to HOD
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'HOD' AND p.`key` = 'data_export.download';
