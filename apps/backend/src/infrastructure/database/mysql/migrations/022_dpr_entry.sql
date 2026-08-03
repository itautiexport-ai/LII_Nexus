-- DPR (Daily Production Report) Entry module
-- Two-tab form: Tab 1 = Header Info + Item-wise Production, Tab 2 = Manpower Details

CREATE TABLE IF NOT EXISTS dpr_entries (
  id CHAR(36) PRIMARY KEY,
  entry_date DATE NOT NULL,
  shift_id CHAR(36) NOT NULL,
  factory_department_id CHAR(36) NOT NULL,
  supervisor_id CHAR(36) NOT NULL,
  total_target DECIMAL(15,2) NOT NULL DEFAULT 0,
  uom VARCHAR(20) NOT NULL DEFAULT 'Pcs',
  total_achievement DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_rework DECIMAL(15,2) NOT NULL DEFAULT 0,

  -- Manpower details (Tab 2)
  total_operator INT NOT NULL DEFAULT 0,
  total_helper INT NOT NULL DEFAULT 0,
  total_contractor INT NOT NULL DEFAULT 0,

  submitted_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,

  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE RESTRICT,
  FOREIGN KEY (factory_department_id) REFERENCES factory_departments(id) ON DELETE RESTRICT,
  FOREIGN KEY (supervisor_id) REFERENCES employees(id) ON DELETE RESTRICT,
  FOREIGN KEY (submitted_by) REFERENCES employees(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_dpr_department_date ON dpr_entries(factory_department_id, entry_date);
CREATE INDEX idx_dpr_entry_date ON dpr_entries(entry_date);
CREATE INDEX idx_dpr_supervisor ON dpr_entries(supervisor_id);

-- Item-wise production details (child rows of a DPR entry)
CREATE TABLE IF NOT EXISTS dpr_entry_items (
  id CHAR(36) PRIMARY KEY,
  dpr_entry_id CHAR(36) NOT NULL,
  alias_name VARCHAR(200) NULL,
  product_code VARCHAR(100) NULL,
  order_qty DECIMAL(15,2) NOT NULL DEFAULT 0,
  ok_qty DECIMAL(15,2) NOT NULL DEFAULT 0,
  rework_qty DECIMAL(15,2) NOT NULL DEFAULT 0,
  uom VARCHAR(20) NOT NULL DEFAULT 'Pcs',
  qty_as_per_uom DECIMAL(15,2) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (dpr_entry_id) REFERENCES dpr_entries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_dpr_items_entry ON dpr_entry_items(dpr_entry_id);
