CREATE TABLE IF NOT EXISTS help_tickets (
  id CHAR(36) PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  problem_solver_id CHAR(36) NOT NULL,
  problem TEXT NOT NULL,
  media_url VARCHAR(500) NULL,
  priority ENUM('High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
  planned_date DATE NULL,
  attachment_mandatory TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('Open', 'In Progress', 'Resolved', 'Closed') NOT NULL DEFAULT 'Open',
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);
