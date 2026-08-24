-- Migration 098: Add photo_url to material_inwards table
ALTER TABLE material_inwards ADD COLUMN photo_url VARCHAR(255) DEFAULT NULL;
