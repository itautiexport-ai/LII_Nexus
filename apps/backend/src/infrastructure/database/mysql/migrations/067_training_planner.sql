CREATE TABLE IF NOT EXISTS training_calendars (
  id CHAR(36) PRIMARY KEY,
  financial_year VARCHAR(20) NOT NULL UNIQUE,
  status ENUM('active', 'archived') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS training_sessions (
  id CHAR(36) PRIMARY KEY,
  calendar_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  department_id CHAR(36) NULL,
  training_type ENUM('internal', 'external') DEFAULT 'internal',
  priority ENUM('low', 'medium', 'high', 'mandatory') DEFAULT 'medium',
  scheduled_date DATE,
  duration_hours DECIMAL(5,2),
  trainer VARCHAR(255),
  venue_mode VARCHAR(255),
  budget DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('planned', 'pending_approval', 'approved', 'completed', 'cancelled') DEFAULT 'planned',
  description TEXT,
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (calendar_id) REFERENCES training_calendars(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS training_participants (
  id CHAR(36) PRIMARY KEY,
  session_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  attendance_status ENUM('pending', 'attended', 'absent') DEFAULT 'pending',
  assessment_score DECIMAL(5,2),
  feedback_notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_session_employee (session_id, employee_id)
);

CREATE TABLE IF NOT EXISTS training_materials (
  id CHAR(36) PRIMARY KEY,
  session_id CHAR(36) NOT NULL,
  file_url VARCHAR(1000) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  uploaded_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES employees(id) ON DELETE SET NULL
);
