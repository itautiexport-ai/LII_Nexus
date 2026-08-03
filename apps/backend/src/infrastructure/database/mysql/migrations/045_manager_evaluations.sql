CREATE TABLE IF NOT EXISTS manager_evaluations (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  period_type VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  quality_score DECIMAL(4,2) NOT NULL DEFAULT 0,
  ownership_score DECIMAL(4,2) NOT NULL DEFAULT 0,
  behaviour_score DECIMAL(4,2) NOT NULL DEFAULT 0,
  improvement_score DECIMAL(4,2) NOT NULL DEFAULT 0,
  evaluated_by CHAR(36) NOT NULL,
  evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_emp_period (employee_id, period_type, period_start, period_end),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluated_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
