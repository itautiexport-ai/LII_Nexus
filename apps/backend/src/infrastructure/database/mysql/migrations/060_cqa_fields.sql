-- Expand the enum for status
ALTER TABLE crm_complaints
MODIFY COLUMN status ENUM('new', 'assigned', 'under_investigation', 'capa_in_progress', 'pending_customer', 'resolved', 'closed', 'escalated') NOT NULL DEFAULT 'new';

-- Registration Fields
ALTER TABLE crm_complaints
ADD COLUMN order_invoice_no VARCHAR(100) NULL AFTER title,
ADD COLUMN product_sku VARCHAR(100) NULL AFTER order_invoice_no,
ADD COLUMN complaint_category VARCHAR(100) NULL AFTER product_sku,
ADD COLUMN attachments JSON NULL AFTER description;

-- Investigation Fields
ALTER TABLE crm_complaints
ADD COLUMN inspection_findings TEXT NULL,
ADD COLUMN root_cause TEXT NULL,
ADD COLUMN responsible_department VARCHAR(100) NULL,
ADD COLUMN rca_notes TEXT NULL;

-- CAPA Fields
ALTER TABLE crm_complaints
ADD COLUMN immediate_action TEXT NULL,
ADD COLUMN corrective_action TEXT NULL,
ADD COLUMN preventive_action TEXT NULL,
ADD COLUMN capa_responsible_person CHAR(36) NULL,
ADD COLUMN target_completion_date DATE NULL,
ADD COLUMN verification_status VARCHAR(50) NULL;

-- Resolution Fields
ALTER TABLE crm_complaints
ADD COLUMN resolution_type VARCHAR(100) NULL,
ADD COLUMN customer_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN closure_date DATE NULL,
ADD COLUMN satisfaction_rating INT NULL,
ADD COLUMN lessons_learned TEXT NULL,
ADD COLUMN repeat_issue BOOLEAN NOT NULL DEFAULT FALSE;

-- Add Foreign Key for capa_responsible_person
ALTER TABLE crm_complaints
ADD CONSTRAINT fk_crm_complaints_capa_responsible
FOREIGN KEY (capa_responsible_person) REFERENCES employees(id) ON DELETE SET NULL;
