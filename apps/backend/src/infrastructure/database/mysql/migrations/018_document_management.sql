-- Enterprise Document Management System. Two small master tables are added
-- here out of genuine necessity, not scope creep: "Attach documents to
-- Machines/Products" is a real requirement, but this system has never had
-- a Machine Master or Product Master anywhere in it (departments
-- represents a department/floor area, not an individual machine). Kept
-- deliberately minimal - the same pattern used for Contractors when
-- Factory Performance Management needed something that didn't exist yet.

CREATE TABLE IF NOT EXISTS machines (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NULL,
  factory_department_id CHAR(36) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (factory_department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(100) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- A simple folder tree - flat enough to be genuinely usable, not an
-- over-engineered CMS.
CREATE TABLE IF NOT EXISTS document_folders (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  parent_folder_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_folder_id) REFERENCES document_folders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- The document record itself is metadata + the current approval/expiry
-- state; the actual files live in document_versions (below), one row per
-- version, so "Version Control" is real history, not a single overwritten
-- file reference.
CREATE TABLE IF NOT EXISTS documents (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  category ENUM(
    'sop','drawing','work_instruction','qc_format','policy','contract',
    'buyer_document','machine_manual','training_video'
  ) NOT NULL,
  folder_id CHAR(36) NULL,
  owner_id CHAR(36) NULL,
  status ENUM('draft','pending_approval','approved','rejected') NOT NULL DEFAULT 'draft',
  expiry_date DATE NULL,
  is_confidential TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (folder_id) REFERENCES document_folders(id) ON DELETE SET NULL,
  FOREIGN KEY (owner_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_expiry ON documents(expiry_date);

-- Each new version starts 'pending_approval' (unless the uploader also has
-- approval rights) and can be approved/rejected independently - approving
-- the latest version is what advances documents.status.
CREATE TABLE IF NOT EXISTS document_versions (
  id CHAR(36) PRIMARY KEY,
  document_id CHAR(36) NOT NULL,
  version_number INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(1000) NOT NULL,
  change_notes VARCHAR(1000) NULL,
  approval_status ENUM('pending_approval','approved','rejected') NOT NULL DEFAULT 'pending_approval',
  reviewed_by CHAR(36) NULL,
  reviewed_at DATETIME NULL,
  rejection_reason VARCHAR(500) NULL,
  uploaded_by CHAR(36) NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES employees(id) ON DELETE SET NULL,
  UNIQUE KEY uq_document_version (document_id, version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS document_tags (
  id CHAR(36) PRIMARY KEY,
  document_id CHAR(36) NOT NULL,
  tag VARCHAR(50) NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  UNIQUE KEY uq_document_tag (document_id, tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_document_tags_tag ON document_tags(tag);

-- Polymorphic attachment: a document can be linked to any number of
-- employees, machines, products, departments, workflows, or CRM leads.
-- entity_id is always a CHAR(36) UUID since every one of those tables uses
-- UUID primary keys.
CREATE TABLE IF NOT EXISTS document_links (
  id CHAR(36) PRIMARY KEY,
  document_id CHAR(36) NOT NULL,
  entity_type ENUM('employee','machine','product','department','workflow','crm_lead') NOT NULL,
  entity_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  UNIQUE KEY uq_document_link (document_id, entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_document_links_entity ON document_links(entity_type, entity_id);
