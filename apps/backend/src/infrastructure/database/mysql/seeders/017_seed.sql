INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'meeting.view', 'meetings', 'View meetings and minutes'),
  (UUID(), 'meeting.create', 'meetings', 'Schedule and record meetings'),
  (UUID(), 'meeting.update', 'meetings', 'Edit meeting details, agenda, notes, decisions'),
  (UUID(), 'meeting.delete', 'meetings', 'Delete a meeting'),
  (UUID(), 'meeting.action.assign_any', 'meetings', 'Assign a meeting action to any employee, not just direct reports'),
  (UUID(), 'meeting.mom.export', 'meetings', 'Export Minutes of Meeting to PDF');
