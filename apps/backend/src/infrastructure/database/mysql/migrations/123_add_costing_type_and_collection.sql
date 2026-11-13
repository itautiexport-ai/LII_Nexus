-- Add missing costing metadata without changing existing data.
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cost_estimations' AND COLUMN_NAME='product_type')=0, 'ALTER TABLE cost_estimations ADD COLUMN product_type VARCHAR(100) NULL AFTER product_name', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cost_estimations' AND COLUMN_NAME='collection_name')=0, 'ALTER TABLE cost_estimations ADD COLUMN collection_name VARCHAR(150) NULL AFTER product_type', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cost_estimations' AND COLUMN_NAME='type_of_costing')=0, 'ALTER TABLE cost_estimations ADD COLUMN type_of_costing VARCHAR(100) NULL AFTER collection_name', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
