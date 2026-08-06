-- Migration 092: Add extended fields to maintenance_equipment table

ALTER TABLE maintenance_equipment
  ADD COLUMN asset_number VARCHAR(100) DEFAULT NULL,
  ADD COLUMN machine_type VARCHAR(100) DEFAULT NULL,
  ADD COLUMN manufacturer VARCHAR(150) DEFAULT NULL,
  ADD COLUMN model VARCHAR(150) DEFAULT NULL,
  ADD COLUMN installation_date DATE DEFAULT NULL,
  ADD COLUMN warranty_expiry DATE DEFAULT NULL,
  ADD COLUMN power_rating VARCHAR(100) DEFAULT NULL,
  ADD COLUMN capacity VARCHAR(100) DEFAULT NULL,
  ADD COLUMN plc_details TEXT DEFAULT NULL,
  ADD COLUMN operating_manual TEXT DEFAULT NULL,
  ADD COLUMN sop_attachment TEXT DEFAULT NULL,
  ADD COLUMN machine_images TEXT DEFAULT NULL,
  ADD COLUMN qr_code VARCHAR(255) DEFAULT NULL;
