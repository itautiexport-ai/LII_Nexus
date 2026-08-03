ALTER TABLE issued_notices ADD COLUMN person_type ENUM('Employee', 'Worker') NOT NULL DEFAULT 'Employee' AFTER employee_name;
