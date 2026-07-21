INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'crm.lead.view', 'crm', 'View leads assigned to other merchants'),
  (UUID(), 'crm.lead.create', 'crm', 'Create leads'),
  (UUID(), 'crm.lead.update', 'crm', 'Edit leads assigned to other merchants'),
  (UUID(), 'crm.lead.delete', 'crm', 'Delete leads'),
  (UUID(), 'crm.lead.assign', 'crm', 'Assign or reassign a lead to a merchant'),
  (UUID(), 'crm.lead.import', 'crm', 'Bulk import leads from Excel'),
  (UUID(), 'crm.lead.export', 'crm', 'Export leads to Excel'),
  (UUID(), 'crm.dashboard.view', 'crm', 'View CRM dashboards (CEO / Lead Source / Export-Domestic / Follow-up Delay / Forecast Pipeline / Won-Lost)');

-- Merchant Score KPIs, plugged into the existing Scoring Engine under a new
-- 'crm' category. Weights are defaults and admin-editable/department-
-- overridable exactly like every other KPI in this system.
INSERT IGNORE INTO kpi_definitions (id, name, category, calculation_type, default_weightage, description) VALUES
  (UUID(), 'Follow-up Discipline', 'crm', 'crm_followup_discipline', 30.00, 'Share of a merchant''s follow-ups completed on or before their due date.'),
  (UUID(), 'Lead Conversion', 'crm', 'crm_conversion', 25.00, 'Won leads as a share of (won + lost) leads closed by the merchant in the period.'),
  (UUID(), 'Pipeline Value', 'crm', 'crm_pipeline_value', 20.00, 'Average win probability across the merchant''s currently active leads.'),
  (UUID(), 'Delay Control', 'crm', 'crm_delay_control', 15.00, 'Share of the merchant''s active leads that are not currently overdue for follow-up.'),
  (UUID(), 'Data Update Discipline', 'crm', 'crm_data_discipline', 10.00, 'Share of the merchant''s assigned leads updated within the last 14 days.');
