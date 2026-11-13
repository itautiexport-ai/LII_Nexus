-- Persistent storage used by the existing Wood Thickness & Size Prices page.
CREATE TABLE IF NOT EXISTS master_wood_thickness_prices (
        id VARCHAR(64) PRIMARY KEY,
        wood_type VARCHAR(150) NOT NULL,
        thickness VARCHAR(80) NOT NULL,
        thickness_uom VARCHAR(40) NOT NULL DEFAULT 'inch',
        length VARCHAR(80) NOT NULL,
        length_uom VARCHAR(40) NOT NULL DEFAULT 'feet',
        rate_per_cft DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_wtp_wood_type (wood_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
