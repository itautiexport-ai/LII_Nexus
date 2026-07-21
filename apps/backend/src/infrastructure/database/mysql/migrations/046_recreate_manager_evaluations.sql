DROP TABLE IF EXISTS manager_evaluations;

CREATE TABLE manager_evaluations (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  period_type VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  quality_of_work DECIMAL(4,2) NOT NULL DEFAULT 0,
  technical_competence DECIMAL(4,2) NOT NULL DEFAULT 0,
  leadership DECIMAL(4,2) NOT NULL DEFAULT 0,
  discipline DECIMAL(4,2) NOT NULL DEFAULT 0,
  team_behaviour DECIMAL(4,2) NOT NULL DEFAULT 0,
  initiative DECIMAL(4,2) NOT NULL DEFAULT 0,
  cost_saving DECIMAL(4,2) NOT NULL DEFAULT 0,
  problem_solving DECIMAL(4,2) NOT NULL DEFAULT 0,
  evaluated_by CHAR(36) NOT NULL,
  evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_emp_period (employee_id, period_type, period_start, period_end),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluated_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
