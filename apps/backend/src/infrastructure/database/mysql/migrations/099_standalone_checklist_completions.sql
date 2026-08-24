CREATE TABLE IF NOT EXISTS standalone_checklist_completions (
  id CHAR(36) PRIMARY KEY,
  checklist_id CHAR(36) NOT NULL,
  completed_at DATETIME NOT NULL,
  completed_by CHAR(36) NOT NULL,
  notes TEXT NULL,
  attachment_url VARCHAR(512) NULL,
  FOREIGN KEY (checklist_id) REFERENCES standalone_checklists(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by) REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
