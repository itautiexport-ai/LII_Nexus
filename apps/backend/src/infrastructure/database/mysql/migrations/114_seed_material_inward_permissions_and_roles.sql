-- Migration 114: Material Inward permissions, role mappings, and table column nullable fix

-- 1. Ensure permissions exist in permissions table
INSERT IGNORE INTO permissions (id, `key`, description, module, created_at)
VALUES
  (UUID(), 'material_inward.view',   'View Material Inwards',   'material_inward', NOW()),
  (UUID(), 'material_inward.create', 'Create Material Inward', 'material_inward', NOW()),
  (UUID(), 'material_inward.update', 'Update Material Inward', 'material_inward', NOW()),
  (UUID(), 'material_inward.delete', 'Delete Material Inward', 'material_inward', NOW());

-- 2. Ensure role "Material Inward Access" exists
INSERT IGNORE INTO roles (id, name, description, is_system_role)
SELECT UUID(), 'Material Inward Access', 'Grants full access to the Material Inward module', 0
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Material Inward Access');

-- 3. Grant all Material Inward permissions to System Admin role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'System Admin'
  AND p.module = 'material_inward';

-- 4. Grant all Material Inward permissions to Material Inward Access role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Material Inward Access'
  AND p.module = 'material_inward';

-- 5. Grant create and view permissions to "Menu: Material Inward -> Material Inward Form" role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Menu: Material Inward -> Material Inward Form'
  AND p.`key` IN ('material_inward.create', 'material_inward.view');

-- 6. Grant view permission to "Menu: Material Inward -> List of Materials" role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Menu: Material Inward -> List of Materials'
  AND p.`key` = 'material_inward.view';

-- 7. Grant create and view permissions to "Menu: Material Inward" role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Menu: Material Inward'
  AND p.`key` IN ('material_inward.create', 'material_inward.view');

-- 8. Map standalone roles material_inward.create / material_inward.view to corresponding permissions if they exist
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.`key` = r.name
WHERE r.name IN ('material_inward.create', 'material_inward.view');

-- 9. Allow invoice_challan_no to be NULL if not provided
ALTER TABLE material_inwards MODIFY COLUMN invoice_challan_no VARCHAR(100) NULL DEFAULT NULL;
