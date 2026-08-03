-- Unify Factory Departments and Organization Departments

-- 1. Insert any missing Factory Departments into Departments
INSERT INTO departments (id, name, description, created_at, updated_at, deleted_at)
SELECT fd.id, fd.name, 'Migrated from Factory', fd.created_at, fd.updated_at, fd.deleted_at
FROM departments fd
LEFT JOIN departments d ON fd.name = d.name
WHERE d.id IS NULL;

-- 2. Drop existing foreign keys
ALTER TABLE dpr_entries DROP FOREIGN KEY dpr_entries_ibfk_2;
ALTER TABLE dpr_entries DROP FOREIGN KEY fk_dpr_manpower_dept;
ALTER TABLE factory_production_entries DROP FOREIGN KEY factory_production_entries_ibfk_2;
ALTER TABLE machines DROP FOREIGN KEY machines_ibfk_1;

-- 3. Update all referencing tables to use the corresponding departments.id (by name)
UPDATE dpr_entries de
JOIN departments fd ON de.factory_department_id = fd.id
JOIN departments d ON fd.name = d.name
SET de.factory_department_id = d.id;

UPDATE dpr_entries de
JOIN departments fd ON de.manpower_department_id = fd.id
JOIN departments d ON fd.name = d.name
SET de.manpower_department_id = d.id;

UPDATE machines m
JOIN departments fd ON m.factory_department_id = fd.id
JOIN departments d ON fd.name = d.name
SET m.factory_department_id = d.id;

UPDATE factory_production_entries fpe
JOIN departments fd ON fpe.factory_department_id = fd.id
JOIN departments d ON fd.name = d.name
SET fpe.factory_department_id = d.id;

-- 4. Re-add foreign keys pointing to departments
ALTER TABLE dpr_entries 
  ADD CONSTRAINT dpr_entries_dept_fk FOREIGN KEY (factory_department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  ADD CONSTRAINT dpr_entries_manpower_dept_fk FOREIGN KEY (manpower_department_id) REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE factory_production_entries 
  ADD CONSTRAINT fpe_dept_fk FOREIGN KEY (factory_department_id) REFERENCES departments(id) ON DELETE RESTRICT;

ALTER TABLE machines 
  ADD CONSTRAINT machines_dept_fk FOREIGN KEY (factory_department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- 5. Drop departments table
DROP TABLE departments;
