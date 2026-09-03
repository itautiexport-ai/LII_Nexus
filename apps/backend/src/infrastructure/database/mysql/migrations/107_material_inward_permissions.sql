-- Add material_inward.create and material_inward.view permissions,
-- and assign them to users who already have "Menu: Material Inward -> Material Inward Form"
-- access, since the backend routes require these exact permission keys
-- (requirePermission("material_inward.create") / ("material_inward.view"))
-- but only the UI-menu-visibility roles existed before this migration.

INSERT INTO roles (id, name, description, is_system_role, created_at, updated_at)
SELECT UUID(), 'material_inward.create', 'Allows creating Material Inward records (backend API permission)', 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'material_inward.create');

INSERT INTO roles (id, name, description, is_system_role, created_at, updated_at)
SELECT UUID(), 'material_inward.view', 'Allows viewing Material Inward records (backend API permission)', 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'material_inward.view');

-- Assign both new permissions to every user who currently has the
-- "Menu: Material Inward -> Material Inward Form" menu-visibility role.
-- user_roles has a composite primary key (user_id, role_id, scope_type, scope_id) -- no id/created_at columns.
INSERT INTO user_roles (user_id, role_id, scope_type, scope_id)
SELECT DISTINCT ur.user_id, r_new.id, 'global', ''
FROM user_roles ur
JOIN roles r_menu ON r_menu.id = ur.role_id AND r_menu.name = 'Menu: Material Inward -> Material Inward Form'
JOIN roles r_new ON r_new.name = 'material_inward.create'
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur2 WHERE ur2.user_id = ur.user_id AND ur2.role_id = r_new.id
);

INSERT INTO user_roles (user_id, role_id, scope_type, scope_id)
SELECT DISTINCT ur.user_id, r_new.id, 'global', ''
FROM user_roles ur
JOIN roles r_menu ON r_menu.id = ur.role_id AND r_menu.name = 'Menu: Material Inward -> Material Inward Form'
JOIN roles r_new ON r_new.name = 'material_inward.view'
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur2 WHERE ur2.user_id = ur.user_id AND ur2.role_id = r_new.id
);
