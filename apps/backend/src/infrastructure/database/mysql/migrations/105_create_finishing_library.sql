CREATE TABLE IF NOT EXISTS finishing_library (
  id CHAR(36) PRIMARY KEY,
  buyer_name VARCHAR(255) NOT NULL,
  buyer_code VARCHAR(255) NULL,
  finish_recipe_code VARCHAR(255) NOT NULL,
  recipe_id CHAR(36) NULL,
  photos JSON NOT NULL,
  remarks TEXT NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_recipe_code (finish_recipe_code),
  INDEX idx_buyer_name (buyer_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
