-- Factory Performance Management: department-level daily production
-- reporting with a fixed two-step approval gate (Supervisor submits ->
-- Production Head approves -> visible in reports). Distinct from the
-- earlier `production_lines`/`production_entries` (individual worker
-- output vs. quota, feeding the per-employee Factory Performance score) -
-- this is departmental operational reporting for management visibility,
-- a different concept entirely, so it gets its own tables rather than
-- overloading the existing ones.

CREATE TABLE IF NOT EXISTS factory_departments (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  -- Admin chooses which production method this department reports under.
  -- Method 1: whole finished SKUs. Method 2: individual components.
  production_method ENUM('finished_sku','component_level') NOT NULL DEFAULT 'finished_sku',
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contractors (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(150) NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(255) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS factory_production_entries (
  id CHAR(36) PRIMARY KEY,
  entry_date DATE NOT NULL,
  shift_id CHAR(36) NOT NULL,
  factory_department_id CHAR(36) NOT NULL,
  order_reference VARCHAR(100) NULL,
  production_method ENUM('finished_sku','component_level') NOT NULL,
  -- Exactly one of these is set, matching the department's chosen method
  -- for this entry (captured per-entry, not just inherited live from the
  -- department, so historical entries stay accurate if the department's
  -- configured method changes later).
  sku_code VARCHAR(100) NULL,
  component_name VARCHAR(150) NULL,

  target_qty DECIMAL(15,2) NULL,
  actual_qty DECIMAL(15,2) NULL,
  target_cbm DECIMAL(15,3) NULL,
  actual_cbm DECIMAL(15,3) NULL,
  target_labour_hours DECIMAL(10,2) NULL,
  actual_labour_hours DECIMAL(10,2) NULL,

  delay_minutes INT NOT NULL DEFAULT 0,
  delay_reason VARCHAR(500) NULL,
  rejection_qty DECIMAL(15,2) NOT NULL DEFAULT 0,
  rework_qty DECIMAL(15,2) NOT NULL DEFAULT 0,

  supervisor_id CHAR(36) NOT NULL,
  contractor_id CHAR(36) NULL,
  remarks VARCHAR(1000) NULL,

  -- Fixed two-step approval: submitted (by the supervisor) -> approved (by
  -- a Production Head) -> only 'approved' entries are included in reports.
  -- 'rejected' sends it back rather than deleting it, preserving the audit
  -- trail of what was submitted and why it was bounced.
  status ENUM('submitted','approved','rejected') NOT NULL DEFAULT 'submitted',
  submitted_by CHAR(36) NOT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by CHAR(36) NULL,
  reviewed_at DATETIME NULL,
  rejection_reason VARCHAR(500) NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,

  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE RESTRICT,
  FOREIGN KEY (factory_department_id) REFERENCES factory_departments(id) ON DELETE RESTRICT,
  FOREIGN KEY (supervisor_id) REFERENCES employees(id) ON DELETE RESTRICT,
  FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE SET NULL,
  FOREIGN KEY (submitted_by) REFERENCES employees(id) ON DELETE RESTRICT,
  FOREIGN KEY (reviewed_by) REFERENCES employees(id) ON DELETE SET NULL,
  CONSTRAINT chk_entry_method_target CHECK (
    (production_method = 'finished_sku' AND sku_code IS NOT NULL AND component_name IS NULL) OR
    (production_method = 'component_level' AND component_name IS NOT NULL AND sku_code IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_fpe_department_date ON factory_production_entries(factory_department_id, entry_date);
CREATE INDEX idx_fpe_status ON factory_production_entries(status);
CREATE INDEX idx_fpe_supervisor ON factory_production_entries(supervisor_id);

-- Photos and attachments for an entry (e.g. proof of rejection, damage
-- photos) - same table, distinguished by kind, same pattern used for
-- delegated task files.
CREATE TABLE IF NOT EXISTS factory_production_entry_files (
  id CHAR(36) PRIMARY KEY,
  entry_id CHAR(36) NOT NULL,
  kind ENUM('photo','attachment') NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(1000) NOT NULL,
  uploaded_by CHAR(36) NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entry_id) REFERENCES factory_production_entries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
