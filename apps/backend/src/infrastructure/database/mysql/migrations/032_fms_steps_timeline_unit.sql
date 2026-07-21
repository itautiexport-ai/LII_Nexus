ALTER TABLE fms_steps ADD COLUMN timeline_unit ENUM('hours', 'days') NOT NULL DEFAULT 'hours' AFTER timeline_hours;
