CREATE TABLE IF NOT EXISTS master_data_buyers (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS crm_quotations (
  id CHAR(36) PRIMARY KEY,
  buyer_id CHAR(36) NOT NULL,
  sku_code VARCHAR(100) NOT NULL,
  product_code VARCHAR(100) NOT NULL,
  product_image_url VARCHAR(500) NULL,
  status ENUM('draft', 'negotiating', 'accepted', 'rejected') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (buyer_id) REFERENCES master_data_buyers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS crm_quotation_quotes (
  id CHAR(36) PRIMARY KEY,
  quotation_id CHAR(36) NOT NULL,
  quote_name VARCHAR(100) NOT NULL, -- e.g. "1st quote", "final quote"
  price DECIMAL(10, 2) NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (quotation_id) REFERENCES crm_quotations(id) ON DELETE CASCADE
);
