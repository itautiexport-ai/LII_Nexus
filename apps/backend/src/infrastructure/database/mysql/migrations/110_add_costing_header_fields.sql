-- Migration: 110_add_costing_header_fields.sql
-- Add product_code, product_name, overall_size, wood_type to cost_estimations

ALTER TABLE cost_estimations
ADD COLUMN product_code VARCHAR(100) NULL AFTER title,
ADD COLUMN product_name VARCHAR(255) NULL AFTER product_code,
ADD COLUMN overall_size VARCHAR(255) NULL AFTER product_name,
ADD COLUMN wood_type VARCHAR(100) NULL AFTER overall_size;
