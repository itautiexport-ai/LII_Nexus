-- Rename product_code to product_name
ALTER TABLE crm_quotations CHANGE product_code product_name VARCHAR(255) NOT NULL;
