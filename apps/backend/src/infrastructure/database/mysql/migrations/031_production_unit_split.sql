ALTER TABLE production_planning_records
ADD COLUMN production_unit_wood VARCHAR(50) DEFAULT 'SEZ',
ADD COLUMN vendor_name_wood VARCHAR(255) NULL,
ADD COLUMN production_unit_iron VARCHAR(50) DEFAULT 'SEZ',
ADD COLUMN vendor_name_iron VARCHAR(255) NULL;
