-- Add ot_hours to attendance_entries

ALTER TABLE attendance_entries
ADD COLUMN ot_hours DECIMAL(5,2) NOT NULL DEFAULT 0.00;
