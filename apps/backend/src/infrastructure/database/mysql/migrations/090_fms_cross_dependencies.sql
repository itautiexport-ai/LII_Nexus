ALTER TABLE fms_steps 
ADD COLUMN cross_fms_id CHAR(36) NULL DEFAULT NULL,
ADD COLUMN cross_fms_step_id CHAR(36) NULL DEFAULT NULL;

-- Optionally, add foreign keys if you want to strictly enforce them
-- But since they can be null, it's safe.
ALTER TABLE fms_steps
ADD CONSTRAINT fk_cross_fms_id FOREIGN KEY (cross_fms_id) REFERENCES fms_managers(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_cross_fms_step_id FOREIGN KEY (cross_fms_step_id) REFERENCES fms_steps(id) ON DELETE SET NULL;
