-- Universal Workflow Engine: definition/builder layer only.
-- No runtime execution tables here (no workflow_instances, task assignments,
-- or in-flight approvals) - per instructions, this is the engine that
-- business modules will later plug into, not yet wired to any of them.

CREATE TABLE IF NOT EXISTS workflows (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  department_id CHAR(36) NULL,
  description VARCHAR(1000) NULL,
  status ENUM('draft','active','inactive','archived') NOT NULL DEFAULT 'draft',
  version INT NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_workflows_department ON workflows(department_id);
CREATE INDEX idx_workflows_status ON workflows(status);

-- A workflow has unlimited ordered stages. `sequence` drives both the
-- flowchart layout and the drag-and-drop order in the builder UI.
CREATE TABLE IF NOT EXISTS workflow_stages (
  id CHAR(36) PRIMARY KEY,
  workflow_id CHAR(36) NOT NULL,
  name VARCHAR(200) NOT NULL,
  sequence INT NOT NULL,
  responsible_role_id CHAR(36) NOT NULL,
  due_days INT NULL,
  approval_required TINYINT(1) NOT NULL DEFAULT 0,
  checklist_required TINYINT(1) NOT NULL DEFAULT 0,
  can_skip TINYINT(1) NOT NULL DEFAULT 0,
  -- Completion Rules: how the engine (once connected) will decide a stage is
  -- "done". Configurable per stage without code:
  --   manual               - someone explicitly marks it complete
  --   approval_only         - completes when the approval is granted
  --   all_checklist_items   - completes when every checklist item is checked
  --   all_of_the_above      - approval AND all checklist items AND min documents met
  completion_mode ENUM('manual','approval_only','all_checklist_items','all_of_the_above') NOT NULL DEFAULT 'manual',
  min_mandatory_documents INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (responsible_role_id) REFERENCES roles(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_workflow_stage_sequence (workflow_id, sequence)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_workflow_stages_workflow ON workflow_stages(workflow_id);

-- "Tasks" within a stage - the checklist a responsible person works through.
CREATE TABLE IF NOT EXISTS workflow_stage_checklist_items (
  id CHAR(36) PRIMARY KEY,
  stage_id CHAR(36) NOT NULL,
  label VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (stage_id) REFERENCES workflow_stages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS workflow_stage_documents (
  id CHAR(36) PRIMARY KEY,
  stage_id CHAR(36) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  is_mandatory TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (stage_id) REFERENCES workflow_stages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS workflow_stage_notification_rules (
  id CHAR(36) PRIMARY KEY,
  stage_id CHAR(36) NOT NULL,
  trigger_event ENUM('on_stage_start','on_due_date','on_overdue','on_completion','on_escalation') NOT NULL,
  channel ENUM('email','sms','in_app') NOT NULL DEFAULT 'in_app',
  recipient_type ENUM('responsible_role','initiator','custom_role') NOT NULL DEFAULT 'responsible_role',
  custom_role_id CHAR(36) NULL,
  message_template VARCHAR(500) NULL,
  FOREIGN KEY (stage_id) REFERENCES workflow_stages(id) ON DELETE CASCADE,
  FOREIGN KEY (custom_role_id) REFERENCES roles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS workflow_stage_escalation_rules (
  id CHAR(36) PRIMARY KEY,
  stage_id CHAR(36) NOT NULL,
  escalate_after_days INT NOT NULL,
  escalate_to_role_id CHAR(36) NOT NULL,
  escalation_action ENUM('notify_only','reassign') NOT NULL DEFAULT 'notify_only',
  notes VARCHAR(500) NULL,
  FOREIGN KEY (stage_id) REFERENCES workflow_stages(id) ON DELETE CASCADE,
  FOREIGN KEY (escalate_to_role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
