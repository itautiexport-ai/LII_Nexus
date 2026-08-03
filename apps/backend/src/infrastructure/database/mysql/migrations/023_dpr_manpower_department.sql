-- Alter dpr_entries to add manpower_department_id
ALTER TABLE dpr_entries
ADD COLUMN manpower_department_id CHAR(36) NULL,
ADD CONSTRAINT fk_dpr_manpower_dept FOREIGN KEY (manpower_department_id) REFERENCES factory_departments(id) ON DELETE SET NULL;
