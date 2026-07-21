-- Office Performance Module: continuous Goals/KPIs feeding into ad-hoc,
-- two-step (Self -> Manager) performance reviews. No fixed review cycle -
-- a review can be initiated at any time and snapshots goal progress as of
-- that moment.

-- Reviews need to know who reports to whom.
ALTER TABLE employees
  ADD COLUMN manager_id CHAR(36) NULL AFTER designation_id,
  ADD FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS performance_goals (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description VARCHAR(1000) NULL,
  unit VARCHAR(50) NULL,
  target_value DECIMAL(15,2) NULL,
  current_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  weight DECIMAL(5,2) NOT NULL DEFAULT 0,
  status ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active',
  start_date DATE NULL,
  target_date DATE NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_performance_goals_employee ON performance_goals(employee_id);

-- History of progress updates against a goal, so trend over time is visible,
-- not just the latest value.
CREATE TABLE IF NOT EXISTS performance_goal_progress (
  id CHAR(36) PRIMARY KEY,
  goal_id CHAR(36) NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  note VARCHAR(500) NULL,
  recorded_by CHAR(36) NOT NULL,
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES performance_goals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS performance_reviews (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  manager_id CHAR(36) NULL,           -- snapshot of the manager at initiation time
  status ENUM('self_pending','manager_pending','completed') NOT NULL DEFAULT 'self_pending',
  self_summary TEXT NULL,
  self_submitted_at DATETIME NULL,
  manager_summary TEXT NULL,
  manager_score DECIMAL(5,2) NULL,     -- manager's independent 0-100 rating
  manager_submitted_at DATETIME NULL,
  goal_score DECIMAL(5,2) NULL,        -- weighted average of goal achievement %, computed at manager submission
  overall_score DECIMAL(5,2) NULL,     -- blend of goal_score and manager_score
  initiated_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_performance_reviews_employee ON performance_reviews(employee_id);
CREATE INDEX idx_performance_reviews_manager ON performance_reviews(manager_id);

-- Snapshot of each goal's contribution to a specific review, taken at manager
-- submission time. Goals keep evolving after the review, so this is what
-- makes a completed review's score reproducible/auditable later.
CREATE TABLE IF NOT EXISTS performance_review_goal_scores (
  id CHAR(36) PRIMARY KEY,
  review_id CHAR(36) NOT NULL,
  goal_id CHAR(36) NOT NULL,
  goal_title_snapshot VARCHAR(255) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  target_value DECIMAL(15,2) NULL,
  achieved_value DECIMAL(15,2) NULL,
  achievement_percentage DECIMAL(5,2) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES performance_reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (goal_id) REFERENCES performance_goals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
