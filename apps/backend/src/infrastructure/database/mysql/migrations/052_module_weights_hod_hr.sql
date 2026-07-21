ALTER TABLE module_weights
  ADD COLUMN hod_weight DECIMAL(5,2) NOT NULL DEFAULT 33.33,
  ADD COLUMN hr_weight DECIMAL(5,2) NOT NULL DEFAULT 33.33;

-- Update existing row to set sensible defaults for the new columns
UPDATE module_weights SET hod_weight = 33.33, hr_weight = 33.34 WHERE 1=1;
