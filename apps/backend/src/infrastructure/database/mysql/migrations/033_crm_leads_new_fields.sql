ALTER TABLE crm_leads
  ADD COLUMN contact_persons VARCHAR(1000) NULL AFTER contact_name,
  ADD COLUMN multiple_addresses VARCHAR(2000) NULL AFTER city,
  ADD COLUMN currency VARCHAR(10) NULL AFTER lead_category,
  ADD COLUMN preferred_language VARCHAR(50) NULL AFTER currency,
  ADD COLUMN credit_limit DECIMAL(15,2) NULL AFTER preferred_language,
  ADD COLUMN payment_terms VARCHAR(500) NULL AFTER credit_limit;
