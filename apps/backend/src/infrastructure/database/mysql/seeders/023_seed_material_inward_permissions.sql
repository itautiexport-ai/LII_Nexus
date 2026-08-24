-- Material Inward permissions
INSERT IGNORE INTO permissions (id, `key`, description, module, created_at)
VALUES
  (UUID(), 'material_inward.view',   'View Material Inwards',   'material_inward', NOW()),
  (UUID(), 'material_inward.create', 'Create Material Inward',   'material_inward', NOW()),
  (UUID(), 'material_inward.update', 'Update Material Inward',   'material_inward', NOW()),
  (UUID(), 'material_inward.delete', 'Delete Material Inward',   'material_inward', NOW());

-- Grant all Material Inward permissions to System Admin role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'System Admin'
  AND p.module = 'material_inward';

-- Create Material Inward Access role
INSERT IGNORE INTO roles (id, name, description, is_system_role)
VALUES (UUID(), 'Material Inward Access', 'Grants full access to the Material Inward module', 0);

-- Grant all Material Inward permissions to Material Inward Access role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Material Inward Access'
  AND p.module = 'material_inward';
