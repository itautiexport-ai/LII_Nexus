CREATE TABLE IF NOT EXISTS factories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  code VARCHAR(50) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO factories (id, name, code, status) VALUES
  (UUID(), 'LII', 'LII', 'active'),
  (UUID(), 'LIE', 'LIE', 'active'),
  (UUID(), 'Laxmi Joy LLP', 'LJLLP', 'active');

CREATE TABLE IF NOT EXISTS factory_documents (
  id CHAR(36) PRIMARY KEY,
  factory_id CHAR(36) NOT NULL,
  factory_name VARCHAR(150) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(1000) NOT NULL,
  file_size BIGINT NULL,
  file_type VARCHAR(100) NULL,
  description TEXT NULL,
  expiry_date DATE NULL,
  uploaded_by CHAR(36) NULL,
  uploaded_by_name VARCHAR(150) NULL,
  status ENUM('active','archived') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

