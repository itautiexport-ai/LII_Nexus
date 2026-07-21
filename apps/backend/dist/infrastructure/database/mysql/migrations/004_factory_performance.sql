-- Factory Performance Module: production output vs. target quota, logged by a
-- supervisor per individual worker, aggregated at query time into
-- line/shift totals (no separate rollup table to keep in sync).

CREATE TABLE IF NOT EXISTS production_lines (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  code VARCHAR(30) NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS shifts (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  start_time TIME NULL,
  end_time TIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per worker, per line, per shift, per day. Line/shift totals for a
-- given day are SUM()s over this table, computed at read time - not stored -
-- so a corrected entry (via update) is immediately reflected everywhere.
CREATE TABLE IF NOT EXISTS production_entries (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  line_id CHAR(36) NOT NULL,
  shift_id CHAR(36) NOT NULL,
  entry_date DATE NOT NULL,
  quantity_produced DECIMAL(15,2) NOT NULL,
  target_quantity DECIMAL(15,2) NULL,
  notes VARCHAR(500) NULL,
  recorded_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uq_entry_per_worker_per_slot (employee_id, line_id, shift_id, entry_date),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (line_id) REFERENCES production_lines(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_production_entries_line_shift_date ON production_entries(line_id, shift_id, entry_date);
CREATE INDEX idx_production_entries_employee ON production_entries(employee_id);
