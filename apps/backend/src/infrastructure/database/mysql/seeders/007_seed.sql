-- Seed the 8 named factory departments requested.
INSERT IGNORE INTO departments (id, name) VALUES
  (UUID(), 'Machine Shop'),
  (UUID(), 'Assembly'),
  (UUID(), 'Sanding'),
  (UUID(), 'Finishing'),
  (UUID(), 'Packing'),
  (UUID(), 'Warehouse'),
  (UUID(), 'Metal'),
  (UUID(), 'Quality');

INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'factorydept.department.view', 'factoryperf', 'View factory departments'),
  (UUID(), 'factorydept.department.create', 'factoryperf', 'Create factory departments'),
  (UUID(), 'factorydept.department.update', 'factoryperf', 'Update factory departments (incl. production method)'),
  (UUID(), 'factorydept.department.delete', 'factoryperf', 'Delete factory departments'),
  (UUID(), 'contractor.view', 'factoryperf', 'View contractors/teams'),
  (UUID(), 'contractor.create', 'factoryperf', 'Create contractors/teams'),
  (UUID(), 'contractor.update', 'factoryperf', 'Update contractors/teams'),
  (UUID(), 'contractor.delete', 'factoryperf', 'Delete contractors/teams'),
  (UUID(), 'factoryentry.view', 'factoryperf', 'View factory production entries'),
  (UUID(), 'factoryentry.create', 'factoryperf', 'Submit a factory production entry (Supervisor step)'),
  (UUID(), 'factoryentry.update', 'factoryperf', 'Edit a submitted (not yet approved) factory production entry'),
  (UUID(), 'factoryentry.delete', 'factoryperf', 'Delete a factory production entry'),
  (UUID(), 'factoryentry.approve', 'factoryperf', 'Approve or reject a factory production entry (Production Head step)');
