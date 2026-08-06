-- Migration 091: Create Maintenance Module Tables

CREATE TABLE IF NOT EXISTS maintenance_equipment (
  id VARCHAR(36) PRIMARY KEY,
  equipment_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'General',
  department_name VARCHAR(100) DEFAULT NULL,
  location VARCHAR(100) DEFAULT NULL,
  status ENUM('Operational', 'Under Maintenance', 'Breakdown', 'Decommissioned') NOT NULL DEFAULT 'Operational',
  serial_number VARCHAR(100) DEFAULT NULL,
  purchase_date DATE DEFAULT NULL,
  last_maintenance_date DATE DEFAULT NULL,
  next_maintenance_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS maintenance_work_orders (
  id VARCHAR(36) PRIMARY KEY,
  work_order_no VARCHAR(50) NOT NULL UNIQUE,
  equipment_id VARCHAR(36) DEFAULT NULL,
  equipment_name VARCHAR(150) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  type ENUM('Breakdown', 'Preventive', 'Corrective', 'Predictive') NOT NULL DEFAULT 'Breakdown',
  priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
  status ENUM('Open', 'In Progress', 'On Hold', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Open',
  requested_by VARCHAR(100) DEFAULT NULL,
  assigned_to VARCHAR(100) DEFAULT NULL,
  reported_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  scheduled_date DATE DEFAULT NULL,
  completed_date DATETIME DEFAULT NULL,
  downtime_minutes INT DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0.00,
  resolution_notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES maintenance_equipment(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS maintenance_preventive_schedules (
  id VARCHAR(36) PRIMARY KEY,
  schedule_no VARCHAR(50) NOT NULL UNIQUE,
  equipment_id VARCHAR(36) DEFAULT NULL,
  equipment_name VARCHAR(150) NOT NULL,
  task_title VARCHAR(200) NOT NULL,
  frequency ENUM('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual') NOT NULL DEFAULT 'Monthly',
  last_performed_date DATE DEFAULT NULL,
  next_due_date DATE NOT NULL,
  assigned_team VARCHAR(100) DEFAULT NULL,
  status ENUM('Active', 'Inactive', 'Overdue') NOT NULL DEFAULT 'Active',
  checklist_summary TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES maintenance_equipment(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS maintenance_breakdown_logs (
  id VARCHAR(36) PRIMARY KEY,
  breakdown_no VARCHAR(50) NOT NULL UNIQUE,
  equipment_id VARCHAR(36) DEFAULT NULL,
  equipment_name VARCHAR(150) NOT NULL,
  breakdown_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_date DATETIME DEFAULT NULL,
  downtime_hours DECIMAL(6,2) DEFAULT 0.00,
  root_cause TEXT DEFAULT NULL,
  corrective_action TEXT DEFAULT NULL,
  logged_by VARCHAR(100) DEFAULT NULL,
  status ENUM('Active', 'Resolved') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES maintenance_equipment(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS maintenance_spare_parts (
  id VARCHAR(36) PRIMARY KEY,
  part_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'General',
  quantity INT NOT NULL DEFAULT 0,
  min_threshold INT NOT NULL DEFAULT 5,
  unit_cost DECIMAL(10,2) DEFAULT 0.00,
  location VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
