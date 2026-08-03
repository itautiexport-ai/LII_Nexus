-- Add extension request tracking fields to delegated tasks
ALTER TABLE delegated_tasks 
  ADD COLUMN extension_status ENUM('none', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'none',
  ADD COLUMN extension_reason VARCHAR(1000) NULL,
  ADD COLUMN extension_requested_date DATE NULL,
  ADD COLUMN extension_rejection_reason VARCHAR(1000) NULL;
