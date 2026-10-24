-- Migration 114: Add buyer_code and alias_name to master_data_buyers
ALTER TABLE master_data_buyers
  ADD COLUMN buyer_code VARCHAR(100) DEFAULT NULL AFTER name,
  ADD COLUMN alias_name VARCHAR(255) DEFAULT NULL AFTER buyer_code;
