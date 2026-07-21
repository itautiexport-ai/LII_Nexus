-- Create Wood Types master table
CREATE TABLE IF NOT EXISTS wood_types (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create Priorities master table
CREATE TABLE IF NOT EXISTS priorities (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color_code VARCHAR(20) NOT NULL DEFAULT '#cccccc',
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Alter existing tables to change priority ENUM to VARCHAR
ALTER TABLE meeting_actions MODIFY COLUMN priority VARCHAR(100) NOT NULL DEFAULT 'medium';
ALTER TABLE notification_templates MODIFY COLUMN default_priority VARCHAR(100) NOT NULL DEFAULT 'medium';
ALTER TABLE notifications MODIFY COLUMN priority VARCHAR(100) NOT NULL DEFAULT 'medium';
ALTER TABLE crm_leads MODIFY COLUMN priority VARCHAR(100) NOT NULL DEFAULT 'medium';
ALTER TABLE delegated_tasks MODIFY COLUMN priority VARCHAR(100) NOT NULL DEFAULT 'medium';

-- Insert default values for priorities
INSERT INTO priorities (id, name, color_code) VALUES
  (UUID(), 'low', '#999999'),
  (UUID(), 'medium', '#4a90d9'),
  (UUID(), 'high', '#e08e0b'),
  (UUID(), 'urgent', '#c0392b');

-- Insert default values for wood types
INSERT INTO wood_types (id, name) VALUES
  (UUID(), 'Mango'),
  (UUID(), 'Acacia'),
  (UUID(), 'Oak'),
  (UUID(), 'Sheesham');
