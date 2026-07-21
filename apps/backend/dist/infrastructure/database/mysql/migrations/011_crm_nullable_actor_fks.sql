-- Fix: created_by (crm_leads), logged_by (crm_lead_followups), and
-- uploaded_by (crm_lead_files) were declared NOT NULL foreign keys to
-- employees. These are audit-attribution fields (who did this action), not
-- access-control fields - an admin/CEO account with no personal Employee
-- Master record (an entirely normal case, hit repeatedly elsewhere in this
-- project) could not create a lead, log a follow-up, or attach a file at
-- all, failing with a foreign key constraint violation. Relaxing these to
-- nullable, consistent with how the same class of bug was fixed for
-- employee_kpi_scores.entered_by in the Scoring Engine.

ALTER TABLE crm_leads
  MODIFY COLUMN created_by CHAR(36) NULL;

ALTER TABLE crm_lead_followups
  MODIFY COLUMN logged_by CHAR(36) NULL;

ALTER TABLE crm_lead_files
  MODIFY COLUMN uploaded_by CHAR(36) NULL;
