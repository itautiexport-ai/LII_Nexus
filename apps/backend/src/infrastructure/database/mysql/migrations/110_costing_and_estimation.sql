-- Migration: 110_costing_and_estimation.sql
-- Create Costing & Estimation module tables and rate master data

CREATE TABLE IF NOT EXISTS cost_estimations (
  id VARCHAR(36) PRIMARY KEY,
  estimation_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NULL,
  crm_lead_id VARCHAR(36) NULL,
  status ENUM('Draft', 'In Review', 'Approved', 'Rejected') NOT NULL DEFAULT 'Draft',
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  exchange_rate DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
  total_material_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total_labor_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total_overhead_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total_finishing_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total_packaging_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  subtotal_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  margin_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  margin_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  tax_percentage DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  final_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  notes TEXT NULL,
  created_by VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_estimation_number (estimation_number),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cost_estimation_items (
  id VARCHAR(36) PRIMARY KEY,
  estimation_id VARCHAR(36) NOT NULL,
  category ENUM('Raw Material', 'Hardware', 'Labor', 'Finishing', 'Packaging', 'Overhead', 'Other') NOT NULL DEFAULT 'Raw Material',
  item_name VARCHAR(255) NOT NULL,
  specification TEXT NULL,
  quantity DECIMAL(12,4) NOT NULL DEFAULT 1.0000,
  unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'Pcs',
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_cost DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  remarks VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estimation_id) REFERENCES cost_estimations(id) ON DELETE CASCADE,
  KEY idx_estimation_id (estimation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cost_rates_master (
  id VARCHAR(36) PRIMARY KEY,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'Pcs',
  rate DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  effective_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cost_rate (item_name, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default standard rates for costing
INSERT IGNORE INTO cost_rates_master (id, item_name, category, unit_of_measure, rate) VALUES
('rate-001', 'Teak Wood Premium', 'Raw Material', 'CFT', 1850.00),
('rate-002', 'Sheesham Wood Grade A', 'Raw Material', 'CFT', 1250.00),
('rate-003', 'MDF Sheet 18mm', 'Raw Material', 'SqFt', 65.00),
('rate-004', 'Stainless Steel Hinges 4 inch', 'Hardware', 'Pair', 140.00),
('rate-005', 'Drawer Telescopic Channel 18 inch', 'Hardware', 'Set', 220.00),
('rate-006', 'Carpentry & Joinery Labor', 'Labor', 'Hours', 180.00),
('rate-007', 'Sanding & Surface Prep Labor', 'Labor', 'Hours', 120.00),
('rate-008', 'PU Matte Polish Application', 'Finishing', 'SqFt', 85.00),
('rate-009', 'NC Lacquer Polish', 'Finishing', 'SqFt', 55.00),
('rate-010', '5-Ply Heavy Duty Corrugated Carton', 'Packaging', 'Box', 160.00),
('rate-011', 'Factory Overhead Allocation', 'Overhead', 'Flat', 500.00);
