-- Migration: 111_access_requests.sql
-- Create access_requests table for Checklist, Delegation, FMS and Viewing rights requests

CREATE TABLE IF NOT EXISTS access_requests (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  user_name VARCHAR(255) NULL,
  user_email VARCHAR(255) NULL,
  designation_title VARCHAR(255) NULL,
  request_type VARCHAR(100) NOT NULL,
  reason TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  admin_notes TEXT NULL,
  reviewed_by VARCHAR(36) NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_request_type (request_type)
);
