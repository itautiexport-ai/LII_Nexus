-- Complete shared catalogue records; legacy document products remain untouched.
CREATE TABLE IF NOT EXISTS catalogue_products (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(255) NOT NULL,
  product_json JSON NOT NULL,
  created_by CHAR(36) NOT NULL,
  legacy_import_key CHAR(64) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL,
  UNIQUE KEY uq_catalogue_legacy_import (legacy_import_key),
  INDEX idx_catalogue_products_created (created_at),
  INDEX idx_catalogue_products_owner (created_by),
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
