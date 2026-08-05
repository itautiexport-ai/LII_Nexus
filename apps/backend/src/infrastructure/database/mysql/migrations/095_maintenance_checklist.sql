CREATE TABLE IF NOT EXISTS maintenance_checklists (
  id VARCHAR(36) PRIMARY KEY,
  checklist_no VARCHAR(50) NOT NULL UNIQUE,
  filled_by_name VARCHAR(255) NOT NULL,
  technician_name VARCHAR(255) NULL,
  equipment_id VARCHAR(36) NULL,
  equipment_name VARCHAR(255) NOT NULL,
  department_name VARCHAR(255) NULL,
  due_date DATE NOT NULL,
  
  -- Checklists JSON
  mechanical_checks JSON NULL,
  electrical_checks JSON NULL,
  safety_checks JSON NULL,
  general_checks JSON NULL,

  -- Spare Parts Used
  spare_parts_used JSON NULL,

  -- Completion Details
  start_time VARCHAR(50) NULL,
  end_time VARCHAR(50) NULL,
  work_completed TEXT NULL,
  issues_found TEXT NULL,
  technician_remarks TEXT NULL,
  photo_before_url LONGTEXT NULL,
  photo_after_url LONGTEXT NULL,

  -- Supervisor Approval
  supervisor_name VARCHAR(255) NULL,
  approval_status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  approval_remarks TEXT NULL,
  approval_date DATE NULL,

  -- Status Flow
  status ENUM('Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled') NOT NULL DEFAULT 'Scheduled',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_mcl_equipment (equipment_id),
  INDEX idx_mcl_due_date (due_date),
  INDEX idx_mcl_status (status),
  INDEX idx_mcl_approval (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
