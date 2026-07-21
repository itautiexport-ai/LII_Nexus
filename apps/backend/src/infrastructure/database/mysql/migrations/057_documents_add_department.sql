ALTER TABLE documents 
ADD COLUMN department_id CHAR(36) NULL AFTER category,
ADD CONSTRAINT fk_documents_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
