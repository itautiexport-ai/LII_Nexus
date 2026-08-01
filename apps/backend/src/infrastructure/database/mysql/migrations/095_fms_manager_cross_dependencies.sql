-- Add cross_fms_id and cross_fms_step_id to fms_managers

ALTER TABLE fms_managers 
ADD COLUMN cross_fms_id CHAR(36) NULL,
ADD COLUMN cross_fms_step_id CHAR(36) NULL;

-- Add foreign key constraints
ALTER TABLE fms_managers
ADD CONSTRAINT fk_fms_manager_cross_fms_id FOREIGN KEY (cross_fms_id) REFERENCES fms_managers(id) ON DELETE SET NULL;
