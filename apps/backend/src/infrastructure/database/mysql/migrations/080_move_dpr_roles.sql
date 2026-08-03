UPDATE roles SET name = 'Menu: DPR Management' WHERE name = 'Menu: Machine Shop -> DPR Management';
UPDATE user_roles ur JOIN roles r ON ur.role_id = r.id SET r.name = 'Menu: DPR Management' WHERE r.name = 'Menu: Machine Shop -> DPR Management';

UPDATE roles SET name = 'Menu: DPR Management -> DPR Entry' WHERE name = 'Menu: Machine Shop -> DPR Management -> DPR Entry';
UPDATE user_roles ur JOIN roles r ON ur.role_id = r.id SET r.name = 'Menu: DPR Management -> DPR Entry' WHERE r.name = 'Menu: Machine Shop -> DPR Management -> DPR Entry';
