CREATE TABLE IF NOT EXISTS table_freeze_settings (
  id VARCHAR(36) PRIMARY KEY,
  table_key VARCHAR(100) NOT NULL,
  user_id VARCHAR(36) NULL,
  freeze_columns INT NOT NULL DEFAULT 0,
  freeze_column_key VARCHAR(100) NULL,
  freeze_rows INT NOT NULL DEFAULT 0,
  freeze_header BOOLEAN NOT NULL DEFAULT TRUE,
  table_max_height VARCHAR(50) DEFAULT '72vh',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_table_freeze_lookup (table_key, user_id)
);
