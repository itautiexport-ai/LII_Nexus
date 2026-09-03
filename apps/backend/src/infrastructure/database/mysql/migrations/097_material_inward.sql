-- Migration 097: Create Material Inward Table

CREATE TABLE IF NOT EXISTS material_inwards (
  id VARCHAR(36) PRIMARY KEY,
  inward_no VARCHAR(50) NOT NULL UNIQUE,
  inward_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  supplier_name VARCHAR(150) NOT NULL,
  po_number VARCHAR(100) DEFAULT NULL,
  invoice_challan_no VARCHAR(100) DEFAULT NULL,
  invoice_challan_date DATE DEFAULT NULL,
  vehicle_number VARCHAR(50) DEFAULT NULL,
  driver_name VARCHAR(100) DEFAULT NULL,
  driver_contact VARCHAR(20) DEFAULT NULL,
  material_name VARCHAR(200) NOT NULL,
  quantity_received DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
  uom VARCHAR(50) NOT NULL,
  received_by VARCHAR(36) DEFAULT NULL,
  remarks TEXT DEFAULT NULL,
  status ENUM('Pending', 'Inspected', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (received_by) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
