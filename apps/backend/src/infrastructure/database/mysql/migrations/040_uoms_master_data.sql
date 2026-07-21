CREATE TABLE IF NOT EXISTS uoms (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- Insert initial values based on previous hardcoded list so we don't break existing data
INSERT IGNORE INTO uoms (id, name) VALUES 
(UUID(), 'Pieces'),
(UUID(), 'Pairs'),
(UUID(), 'Kg'),
(UUID(), 'Meters');
