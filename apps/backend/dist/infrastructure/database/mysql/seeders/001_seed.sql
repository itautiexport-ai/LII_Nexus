-- Seed: system admin role + core permissions + a bootstrap admin user
-- Bootstrap admin password is "ChangeMe123!" (bcrypt hash below) - MUST be changed after first login.

INSERT IGNORE INTO roles (id, name, description, is_system_role) VALUES
  (UUID(), 'System Admin', 'Full platform access', 1),
  (UUID(), 'HR Admin', 'Manages users, roles and permissions', 0),
  (UUID(), 'Employee', 'Standard employee access', 0);

INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'identity.user.view', 'identity', 'View users'),
  (UUID(), 'identity.user.create', 'identity', 'Create users'),
  (UUID(), 'identity.user.update', 'identity', 'Update users'),
  (UUID(), 'identity.user.deactivate', 'identity', 'Deactivate/delete users'),
  (UUID(), 'rbac.role.view', 'rbac', 'View roles'),
  (UUID(), 'rbac.role.create', 'rbac', 'Create roles'),
  (UUID(), 'rbac.role.update', 'rbac', 'Update roles / assign permissions'),
  (UUID(), 'rbac.role.delete', 'rbac', 'Delete roles'),
  (UUID(), 'rbac.permission.view', 'rbac', 'View permissions'),
  (UUID(), 'rbac.userrole.assign', 'rbac', 'Assign roles to users');
