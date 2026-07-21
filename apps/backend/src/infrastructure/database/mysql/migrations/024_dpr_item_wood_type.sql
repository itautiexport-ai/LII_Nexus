-- Alter dpr_entry_items to add wood_type column
ALTER TABLE dpr_entry_items
ADD COLUMN wood_type VARCHAR(100) NULL;
