-- Alter employees table to add shift_id column referencing shifts
ALTER TABLE employees
ADD COLUMN shift_id CHAR(36) NULL,
ADD FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL;
