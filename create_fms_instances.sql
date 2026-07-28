CREATE TABLE IF NOT EXISTS fms_instances (
  id CHAR(36) NOT NULL PRIMARY KEY,
  fms_manager_id CHAR(36) NOT NULL,
  reference_title VARCHAR(255) NOT NULL,
  status ENUM('In Progress', 'Completed', 'Cancelled') DEFAULT 'In Progress',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fms_manager_id) REFERENCES fms_managers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fms_instance_steps (
  id CHAR(36) NOT NULL PRIMARY KEY,
  instance_id CHAR(36) NOT NULL,
  fms_step_id CHAR(36) NOT NULL,
  status ENUM('Pending', 'In Progress', 'Completed', 'Skipped') DEFAULT 'Pending',
  completed_by CHAR(36) DEFAULT NULL,
  input_data JSON DEFAULT NULL,
  completed_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instance_id) REFERENCES fms_instances(id) ON DELETE CASCADE,
  FOREIGN KEY (fms_step_id) REFERENCES fms_steps(id) ON DELETE CASCADE
);
