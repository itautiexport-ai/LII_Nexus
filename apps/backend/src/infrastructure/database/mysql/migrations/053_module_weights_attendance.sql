ALTER TABLE module_weights
  ADD COLUMN attendance_weight DECIMAL(5,2) NOT NULL DEFAULT 10.00;

-- Adjust existing row to sum to 100% with the new column (e.g. 20/20/20/20/10/10)
UPDATE module_weights SET 
  fms_weight = 20.00, 
  checklist_weight = 20.00, 
  delegation_weight = 20.00, 
  hod_weight = 20.00, 
  hr_weight = 10.00, 
  attendance_weight = 10.00 
WHERE 1=1;
