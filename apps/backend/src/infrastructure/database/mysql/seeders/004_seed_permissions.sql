INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'factory.line.view', 'factory', 'View production lines'),
  (UUID(), 'factory.line.create', 'factory', 'Create production lines'),
  (UUID(), 'factory.line.update', 'factory', 'Update production lines'),
  (UUID(), 'factory.line.delete', 'factory', 'Delete production lines'),
  (UUID(), 'factory.shift.view', 'factory', 'View shifts'),
  (UUID(), 'factory.shift.create', 'factory', 'Create shifts'),
  (UUID(), 'factory.shift.update', 'factory', 'Update shifts'),
  (UUID(), 'factory.shift.delete', 'factory', 'Delete shifts'),
  (UUID(), 'factory.entry.view', 'factory', 'View production entries for other employees'),
  (UUID(), 'factory.entry.create', 'factory', 'Record production entries for employees you do not directly manage'),
  (UUID(), 'factory.entry.update', 'factory', 'Correct production entries for employees you do not directly manage'),
  (UUID(), 'factory.entry.delete', 'factory', 'Delete production entries for employees you do not directly manage');
