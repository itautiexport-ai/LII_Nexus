CREATE TABLE IF NOT EXISTS master_hardware_accessories (
  id CHAR(36) PRIMARY KEY,
  item_code VARCHAR(80) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'Hardware',
  size_spec VARCHAR(150) NULL,
  material_finish VARCHAR(150) NULL,
  uom VARCHAR(50) NOT NULL DEFAULT 'Pc',
  rate DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_hw_acc_category (category),
  INDEX idx_hw_acc_code (item_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert the menu role permission
INSERT IGNORE INTO roles (id, name, description, is_system_role) VALUES
  (UUID(), 'Menu: Administration -> Master Data -> Hardware And Accessories', 'Access to Hardware And Accessories module under Master Data', 0);
