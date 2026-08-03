CREATE TABLE IF NOT EXISTS department_weekly_payroll (
  id CHAR(36) PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  gross DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  days INT NOT NULL DEFAULT 0,
  ot_hrs INT NOT NULL DEFAULT 0,
  gross_amt DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  ot_amt DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_dept_week (department_name, week_start_date, week_end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
