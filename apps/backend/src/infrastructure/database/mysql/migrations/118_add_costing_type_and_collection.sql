-- Migration: 118_add_costing_type_and_collection.sql
-- Add product_type, collection_name, type_of_costing to cost_estimations

ALTER TABLE cost_estimations
ADD COLUMN IF NOT EXISTS product_type VARCHAR(100) NULL AFTER product_name,
ADD COLUMN IF NOT EXISTS collection_name VARCHAR(150) NULL AFTER product_type,
ADD COLUMN IF NOT EXISTS type_of_costing VARCHAR(100) NULL AFTER collection_name;

