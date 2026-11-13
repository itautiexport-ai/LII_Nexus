CREATE TABLE IF NOT EXISTS master_metal_prices (
  id CHAR(36) PRIMARY KEY,
  combination_key CHAR(64) NOT NULL UNIQUE,
  metal_type VARCHAR(150) NOT NULL,
  pipe_size VARCHAR(100) NOT NULL,
  pipe_size_uom VARCHAR(30) NOT NULL,
  pipe_length VARCHAR(50) NOT NULL,
  pipe_length_uom VARCHAR(30) NOT NULL,
  metal_thickness VARCHAR(50) NOT NULL,
  metal_thickness_uom VARCHAR(30) NOT NULL,
  weight VARCHAR(50) NOT NULL DEFAULT '',
  weight_uom VARCHAR(30) NOT NULL DEFAULT 'kg',
  rate DECIMAL(12,2) NOT NULL,
  rate_unit VARCHAR(30) NOT NULL DEFAULT 'Per Kg',
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
