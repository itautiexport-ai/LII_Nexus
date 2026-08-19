CREATE TABLE IF NOT EXISTS standalone_checklist_logs (
  id CHAR(36) PRIMARY KEY,
  checklist_id CHAR(36) NOT NULL,
  planned_date DATETIME NOT NULL,
  completed_at DATETIME NOT NULL,
  completed_by CHAR(36) NOT NULL,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (checklist_id) REFERENCES standalone_checklists(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by) REFERENCES employees(id) ON DELETE CASCADE
);
