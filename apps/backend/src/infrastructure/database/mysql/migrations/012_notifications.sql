-- Universal Notification and Escalation Engine, reusable across every
-- module. Deliberately keyed to `users`, not `employees` - a notification
-- bell is a login/account concept, and this project has hit the exact
-- "employee-vs-user foreign key" bug four times already in other modules;
-- keying this engine to users.id sidesteps that whole class of mistake.
--
-- No job scheduler exists in this stack (a documented tradeoff since
-- checklist instance generation). The "Reminder Scheduler" and escalation
-- engine are computed on demand via a callable check, not a real cron job -
-- see NotificationEscalationService.

CREATE TABLE IF NOT EXISTS notification_templates (
  id CHAR(36) PRIMARY KEY,
  notification_type ENUM(
    'new_task_assigned','task_due_today','task_overdue','workflow_stage_assigned','workflow_approved',
    'workflow_rejected','delegation_assigned','checklist_missed','daily_dpr_pending','factory_delay',
    'machine_breakdown','crm_followup_due','crm_followup_missed','lead_assigned','lead_won','lead_lost',
    'executive_meeting_reminder'
  ) NOT NULL UNIQUE,
  module ENUM('office','factory','crm','workflow','general') NOT NULL,
  default_title VARCHAR(255) NOT NULL,
  default_description VARCHAR(1000) NULL,
  default_priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  default_action_label VARCHAR(100) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  notification_type ENUM(
    'new_task_assigned','task_due_today','task_overdue','workflow_stage_assigned','workflow_approved',
    'workflow_rejected','delegation_assigned','checklist_missed','daily_dpr_pending','factory_delay',
    'machine_breakdown','crm_followup_due','crm_followup_missed','lead_assigned','lead_won','lead_lost',
    'executive_meeting_reminder'
  ) NOT NULL,
  module ENUM('office','factory','crm','workflow','general') NOT NULL,
  reference_type VARCHAR(100) NULL,
  reference_id CHAR(36) NULL,
  title VARCHAR(255) NOT NULL,
  description VARCHAR(1000) NULL,
  priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  assigned_user_id CHAR(36) NOT NULL,
  created_by CHAR(36) NULL,
  due_date DATE NULL,
  status ENUM('pending','actioned','dismissed') NOT NULL DEFAULT 'pending',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at DATETIME NULL,
  action_label VARCHAR(100) NULL,
  action_url VARCHAR(500) NULL,
  -- Escalation state lives on the notification itself: level 1 is always
  -- the original assignee. Escalating creates a NEW notification (assigned
  -- to the next level's recipient) linked back via parent_notification_id,
  -- rather than mutating the original - so the original assignee's copy
  -- and history are never silently rewritten out from under them.
  escalation_level INT NOT NULL DEFAULT 1,
  last_escalated_at DATETIME NULL,
  parent_notification_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_notification_id) REFERENCES notifications(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_notifications_assigned_user ON notifications(assigned_user_id, is_read);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_due_date ON notifications(due_date);
CREATE INDEX idx_notifications_reference ON notifications(module, reference_type, reference_id);

-- A single global 5-level escalation ladder (not per-notification-type, to
-- keep this configurable without becoming an unmanageable per-type matrix).
-- Level 1 is the original assignee (row not stored here - there's nothing
-- to escalate TO at level 1). Level 2 defaults to the assignee's direct
-- manager (via employees.manager_id) when target_role_id is left NULL;
-- levels 3-5 have no natural "manager chain" concept that deep in this
-- app's org model, so they require an admin-configured target_role_id -
-- if left unset, escalation to that level is skipped (and logged as such),
-- not silently guessed at.
CREATE TABLE IF NOT EXISTS escalation_rules (
  id CHAR(36) PRIMARY KEY,
  level INT NOT NULL UNIQUE,
  level_label ENUM('supervisor','hod','coo','ceo') NOT NULL,
  target_role_id CHAR(36) NULL,
  escalate_after_hours INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (target_role_id) REFERENCES roles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notification channels are "future ready" per the spec - only in_app is
-- actually delivered in this pass (it just means a row in `notifications`,
-- visible to the bell/center). Email/WhatsApp/SMS/Push have no real
-- integration in this system yet; this table records that delivery was
-- *requested* on that channel for a notification, honestly reflecting
-- "recorded, not actually sent" rather than pretending to send anything.
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id CHAR(36) PRIMARY KEY,
  notification_id CHAR(36) NOT NULL,
  channel ENUM('in_app','email','whatsapp','sms','push') NOT NULL,
  delivery_status ENUM('delivered','simulated','failed') NOT NULL DEFAULT 'simulated',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
