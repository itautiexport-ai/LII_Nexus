-- DPR Entry permissions
INSERT IGNORE INTO permissions (id, `key`, description, module, created_at)
VALUES
  (UUID(), 'dpr.view',   'View DPR Entries',   'dpr', NOW()),
  (UUID(), 'dpr.create', 'Create DPR Entry',   'dpr', NOW()),
  (UUID(), 'dpr.update', 'Update DPR Entry',   'dpr', NOW()),
  (UUID(), 'dpr.delete', 'Delete DPR Entry',   'dpr', NOW());

-- Grant all DPR permissions to System Admin role (the bootstrap admin)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'System Admin'
  AND p.module = 'dpr';

-- Create DPR Management role
INSERT IGNORE INTO roles (id, name, description, is_system_role)
VALUES (UUID(), 'DPR Management', 'Grants full access to the DPR Entry module', 0);

-- Grant all DPR permissions to DPR Management role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'DPR Management'
  AND p.module = 'dpr';

