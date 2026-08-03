-- Office Performance Management: the first business module connected to the
-- Universal Workflow Engine (Flowchart), plus Checklist Management and
-- Delegation, feeding a weighted (80/10/10) performance score.

-- ===================== FLOWCHART (uses the Workflow Engine) =====================

-- A "run" is one execution of a published workflow (e.g. one specific
-- purchase requisition going through the Purchase Approval workflow).
CREATE TABLE IF NOT EXISTS workflow_runs (
  id CHAR(36) PRIMARY KEY,
  workflow_id CHAR(36) NOT NULL,
  reference VARCHAR(200) NOT NULL,
  notes VARCHAR(1000) NULL,
  status ENUM('in_progress','completed','cancelled') NOT NULL DEFAULT 'in_progress',
  started_by CHAR(36) NOT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_workflow_runs_workflow ON workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_status ON workflow_runs(status);

-- One row per stage-instance in a run. Created unassigned when the stage
-- becomes active; a manager must assign it to an employee before it can be
-- worked. `base_status` is what's actually stored; "Delayed" is derived at
-- read time from base_status + due_date rather than stored, so it can never
-- go stale.
CREATE TABLE IF NOT EXISTS flowchart_tasks (
  id CHAR(36) PRIMARY KEY,
  workflow_run_id CHAR(36) NOT NULL,
  stage_id CHAR(36) NOT NULL,
  assigned_to CHAR(36) NULL,
  assigned_by CHAR(36) NULL,
  assigned_at DATETIME NULL,
  due_date DATE NULL,
  base_status ENUM('pending','running','completed') NOT NULL DEFAULT 'pending',
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  remarks VARCHAR(1000) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_run_id) REFERENCES workflow_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES workflow_stages(id) ON DELETE RESTRICT,
  FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_flowchart_tasks_run ON flowchart_tasks(workflow_run_id);
CREATE INDEX idx_flowchart_tasks_assignee ON flowchart_tasks(assigned_to);
CREATE INDEX idx_flowchart_tasks_due ON flowchart_tasks(due_date);

-- ===================== CHECKLIST MANAGEMENT =====================

CREATE TABLE IF NOT EXISTS checklist_templates (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description VARCHAR(1000) NULL,
  frequency ENUM('daily','weekly','monthly') NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS checklist_template_items (
  id CHAR(36) PRIMARY KEY,
  template_id CHAR(36) NOT NULL,
  label VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (template_id) REFERENCES checklist_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin assigns a template directly to an employee, or to an entire role
-- (resolved to its current members at instance-generation time, not frozen
-- at assignment time - someone gaining the role later picks up the template
-- automatically, matching how a role-based assignment should behave).
CREATE TABLE IF NOT EXISTS checklist_assignments (
  id CHAR(36) PRIMARY KEY,
  template_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NULL,
  role_id CHAR(36) NULL,
  assigned_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES checklist_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT chk_assignment_target CHECK (
    (employee_id IS NOT NULL AND role_id IS NULL) OR (employee_id IS NULL AND role_id IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- There is no job scheduler in this stack, so instances are generated
-- lazily ("create if missing for the current period") the first time
-- anyone asks for an employee's checklist or score in that period, rather
-- than requiring a cron job. `period_key` is a normalized period identifier
-- (YYYY-MM-DD for daily, YYYY-Www for weekly, YYYY-MM for monthly) so a
-- unique constraint prevents ever double-generating the same period.
CREATE TABLE IF NOT EXISTS checklist_instances (
  id CHAR(36) PRIMARY KEY,
  template_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  period_key VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES checklist_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY uq_instance_period (template_id, employee_id, period_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_checklist_instances_employee_period ON checklist_instances(employee_id, period_start, period_end);

CREATE TABLE IF NOT EXISTS checklist_instance_items (
  id CHAR(36) PRIMARY KEY,
  instance_id CHAR(36) NOT NULL,
  template_item_id CHAR(36) NOT NULL,
  is_checked TINYINT(1) NOT NULL DEFAULT 0,
  checked_at DATETIME NULL,
  FOREIGN KEY (instance_id) REFERENCES checklist_instances(id) ON DELETE CASCADE,
  FOREIGN KEY (template_item_id) REFERENCES checklist_template_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================== DELEGATION =====================

CREATE TABLE IF NOT EXISTS delegated_tasks (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description VARCHAR(1000) NULL,
  assigned_by CHAR(36) NOT NULL,
  assigned_to CHAR(36) NOT NULL,
  due_date DATE NOT NULL,
  priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  base_status ENUM('pending','running','completed') NOT NULL DEFAULT 'pending',
  remarks VARCHAR(1000) NULL,
  escalated_to CHAR(36) NULL,
  escalated_at DATETIME NULL,
  escalation_notes VARCHAR(500) NULL,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (assigned_by) REFERENCES employees(id) ON DELETE RESTRICT,
  FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE RESTRICT,
  FOREIGN KEY (escalated_to) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_delegated_tasks_assignee ON delegated_tasks(assigned_to);
CREATE INDEX idx_delegated_tasks_due ON delegated_tasks(due_date);

-- Attachments (from the manager, at assignment time) and proof-of-completion
-- uploads (from the employee) are the same underlying concept - a file
-- reference against a task - distinguished only by `kind`.
CREATE TABLE IF NOT EXISTS delegated_task_files (
  id CHAR(36) PRIMARY KEY,
  task_id CHAR(36) NOT NULL,
  kind ENUM('attachment','proof') NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(1000) NOT NULL,
  uploaded_by CHAR(36) NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES delegated_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
