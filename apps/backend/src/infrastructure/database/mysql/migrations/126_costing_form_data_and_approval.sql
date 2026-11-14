-- Preserve existing estimations; add only missing nullable columns.
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cost_estimations' AND COLUMN_NAME='form_data')=0, 'ALTER TABLE cost_estimations ADD COLUMN form_data LONGTEXT NULL AFTER notes', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cost_estimations' AND COLUMN_NAME='approval_authority_id')=0, 'ALTER TABLE cost_estimations ADD COLUMN approval_authority_id VARCHAR(36) NULL AFTER form_data', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
