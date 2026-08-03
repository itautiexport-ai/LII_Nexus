-- Add currency column to quotes
ALTER TABLE crm_quotation_quotes ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'USD';
