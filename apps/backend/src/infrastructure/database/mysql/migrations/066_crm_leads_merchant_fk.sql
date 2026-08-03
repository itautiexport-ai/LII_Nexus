ALTER TABLE crm_leads DROP FOREIGN KEY crm_leads_ibfk_1;

UPDATE crm_leads SET assigned_merchant_id = NULL;

ALTER TABLE crm_leads 
ADD CONSTRAINT crm_leads_merchant_fk 
FOREIGN KEY (assigned_merchant_id) 
REFERENCES master_merchants(id) 
ON DELETE SET NULL;
