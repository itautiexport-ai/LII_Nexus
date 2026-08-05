ALTER TABLE maintenance_work_orders
  ADD COLUMN maintenance_frequency VARCHAR(50) DEFAULT 'Monthly',
  ADD COLUMN maintenance_interval_days INT DEFAULT 30,
  ADD COLUMN next_maintenance_due DATE NULL;
