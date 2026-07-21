INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'organization.department.view', 'organization', 'View departments'),
  (UUID(), 'organization.department.create', 'organization', 'Create departments'),
  (UUID(), 'organization.department.update', 'organization', 'Update departments'),
  (UUID(), 'organization.department.delete', 'organization', 'Delete departments'),
  (UUID(), 'organization.designation.view', 'organization', 'View designations'),
  (UUID(), 'organization.designation.create', 'organization', 'Create designations'),
  (UUID(), 'organization.designation.update', 'organization', 'Update designations'),
  (UUID(), 'organization.designation.delete', 'organization', 'Delete designations'),
  (UUID(), 'organization.employee.view', 'organization', 'View employees'),
  (UUID(), 'organization.employee.create', 'organization', 'Create employees'),
  (UUID(), 'organization.employee.update', 'organization', 'Update employees'),
  (UUID(), 'organization.employee.delete', 'organization', 'Deactivate/delete employees');
