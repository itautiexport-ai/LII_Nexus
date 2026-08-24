CREATE TABLE IF NOT EXISTS finish_codes (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert the menu role permission
INSERT IGNORE INTO roles (id, name, description, is_system_role) VALUES
  (UUID(), 'Menu: Administration -> Master Data -> Finish Codes', 'Access to Finish Codes module under Master Data', 0);
