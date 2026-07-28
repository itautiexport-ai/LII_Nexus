ALTER TABLE employees ADD COLUMN salary DECIMAL(15,2) NOT NULL DEFAULT 0.00;

CREATE TABLE IF NOT EXISTS attendance_entries (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  record_date DATE NOT NULL,
  status ENUM('Present', 'Absent', 'Half Day', 'Leave', 'Holiday') NOT NULL DEFAULT 'Present',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_emp_date (employee_id, record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
