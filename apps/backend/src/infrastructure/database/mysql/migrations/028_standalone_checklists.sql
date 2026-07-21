CREATE TABLE IF NOT EXISTS standalone_checklists (
  id CHAR(36) PRIMARY KEY,
  assigned_by CHAR(36) NOT NULL,
  task_name VARCHAR(255) NOT NULL,
  assign_to CHAR(36) NOT NULL,
  planned_date DATETIME NOT NULL,
  priority ENUM('Low', 'Medium', 'High') NOT NULL,
  make_attachment_mandatory BOOLEAN NOT NULL DEFAULT 0,
  make_note_mandatory BOOLEAN NOT NULL DEFAULT 0,
  mode VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  remind_before_days INT NOT NULL DEFAULT 0,
  skip_on_holidays BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (assigned_by) REFERENCES employees(id),
  FOREIGN KEY (assign_to) REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
