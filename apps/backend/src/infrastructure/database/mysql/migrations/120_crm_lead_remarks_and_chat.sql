ALTER TABLE crm_leads
  ADD COLUMN management_remarks TEXT NULL AFTER next_action,
  ADD COLUMN merchant_update TEXT NULL AFTER management_remarks;

CREATE TABLE IF NOT EXISTS crm_lead_messages (
  id CHAR(36) PRIMARY KEY,
  lead_id CHAR(36) NOT NULL,
  sender_id CHAR(36) NULL,
  sender_name VARCHAR(150) NOT NULL,
  sender_role ENUM('management', 'merchant', 'system') NOT NULL DEFAULT 'management',
  message TEXT NOT NULL,
  message_type ENUM('chat', 'management_remark', 'merchant_update', 'stage_change') NOT NULL DEFAULT 'chat',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE,
  INDEX idx_crm_lead_msg_lead (lead_id),
  INDEX idx_crm_lead_msg_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
