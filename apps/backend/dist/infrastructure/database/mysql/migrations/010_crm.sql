-- CRM & Merchant Performance Management for Laxmi Ideal Interiors.
--
-- Merchant Score is deliberately NOT a new scoring system - it extends the
-- existing Performance Scoring Engine (kpi_definitions) with a new 'crm'
-- category and 5 new calculation types, so merchants get the same weighted
-- composite, department overrides, ranking, and trend infrastructure
-- already built and tested for Office/Factory KPIs, rather than a
-- second parallel scoring mechanism.

ALTER TABLE kpi_definitions
  MODIFY COLUMN category ENUM('office','factory','crm') NOT NULL;

ALTER TABLE kpi_definitions
  MODIFY COLUMN calculation_type ENUM(
    'flowchart','checklist','delegation','target_achievement','quality','timeliness','manual',
    'crm_followup_discipline','crm_conversion','crm_pipeline_value','crm_delay_control','crm_data_discipline'
  ) NOT NULL;

CREATE TABLE IF NOT EXISTS crm_leads (
  id CHAR(36) PRIMARY KEY,
  lead_code VARCHAR(30) NOT NULL UNIQUE,
  inquiry_date DATE NOT NULL,
  contact_name VARCHAR(150) NOT NULL,
  company_name VARCHAR(200) NULL,
  country VARCHAR(100) NULL,
  city VARCHAR(100) NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(255) NULL,
  lead_source ENUM('trade_fair','whatsapp','email','website','referral','other') NOT NULL,
  lead_category ENUM('export','domestic','hotel_restaurant_project','buyer_agent','repeat_customer') NOT NULL,
  product_category VARCHAR(150) NULL,
  inquiry_details VARCHAR(2000) NULL,
  assigned_merchant_id CHAR(36) NULL,
  -- The 12 stages from the spec. 'order_won'/'order_lost' auto-sync `status`
  -- below when set (see LeadService) - stage is the detailed pipeline
  -- position, status is the coarser Active/Won/Lost/Dead/Dormant bucket
  -- used for filtering and reporting.
  sales_stage ENUM(
    'new_inquiry','discovery','qualification','product_shared','quotation_sent','negotiation',
    'sample_discussion','sample_under_development','order_expected','order_won','order_lost','dead_dormant'
  ) NOT NULL DEFAULT 'new_inquiry',
  forecast_amount DECIMAL(15,2) NULL,
  win_probability DECIMAL(5,2) NULL,
  -- Always computed (forecast_amount * win_probability / 100), never
  -- hand-entered - stored for query/sort efficiency, recalculated on every
  -- write, same "no manual calculation" principle as the Scoring Engine.
  weighted_forecast DECIMAL(15,2) NULL,
  expected_close_date DATE NULL,
  next_follow_up_date DATE NULL,
  follow_up_remarks VARCHAR(1000) NULL,
  next_action VARCHAR(500) NULL,
  status ENUM('active','won','lost','dead','dormant') NOT NULL DEFAULT 'active',
  priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  created_by CHAR(36) NOT NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (assigned_merchant_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_crm_leads_merchant ON crm_leads(assigned_merchant_id);
CREATE INDEX idx_crm_leads_status ON crm_leads(status);
CREATE INDEX idx_crm_leads_stage ON crm_leads(sales_stage);
CREATE INDEX idx_crm_leads_source ON crm_leads(lead_source);
CREATE INDEX idx_crm_leads_category ON crm_leads(lead_category);
CREATE INDEX idx_crm_leads_followup ON crm_leads(next_follow_up_date);
CREATE INDEX idx_crm_leads_inquiry_date ON crm_leads(inquiry_date);

-- One row per follow-up cycle. `next_follow_up_date` on crm_leads is always
-- "the currently pending one"; this table is the history used to compute
-- "follow-ups completed on time" vs "delayed follow-ups" per merchant -
-- metrics that a single date field on the lead could never answer.
CREATE TABLE IF NOT EXISTS crm_lead_followups (
  id CHAR(36) PRIMARY KEY,
  lead_id CHAR(36) NOT NULL,
  due_date DATE NOT NULL,
  completed_at DATETIME NULL,
  on_time TINYINT(1) NULL,
  remarks VARCHAR(1000) NULL,
  next_action VARCHAR(500) NULL,
  logged_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE,
  FOREIGN KEY (logged_by) REFERENCES employees(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_crm_followups_lead ON crm_lead_followups(lead_id);
CREATE INDEX idx_crm_followups_due ON crm_lead_followups(due_date);

CREATE TABLE IF NOT EXISTS crm_lead_files (
  id CHAR(36) PRIMARY KEY,
  lead_id CHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(1000) NOT NULL,
  uploaded_by CHAR(36) NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
