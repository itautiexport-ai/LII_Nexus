-- Executive Meeting Engine. The most important design decision here: a
-- meeting's Action Tracker items are NOT a parallel task-tracking table -
-- each action creates (and is permanently linked to) a real row in
-- delegated_tasks via the existing DelegationService. That means automatic
-- reminders and escalation-if-not-completed come for free from the
-- Notification Engine's existing escalation ladder (raised when the
-- delegated task is created) rather than a second escalation mechanism
-- being built here. "Pending Actions" / "Completed Actions" are therefore
-- read-through views joined against delegated_tasks.base_status, never a
-- separately-maintained status column that could drift out of sync.

CREATE TABLE IF NOT EXISTS meetings (
  id CHAR(36) PRIMARY KEY,
  meeting_type ENUM('daily_production','weekly_executive','monthly_management_review','quarterly_review') NOT NULL,
  title VARCHAR(200) NOT NULL,
  meeting_date DATE NOT NULL,
  status ENUM('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  organized_by CHAR(36) NULL,
  discussion_notes TEXT NULL,
  -- Links to the most recent prior meeting of the SAME meeting_type - what
  -- "Previous MOM" and "pending actions carried forward" are computed from.
  previous_meeting_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (organized_by) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (previous_meeting_id) REFERENCES meetings(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_meetings_type_date ON meetings(meeting_type, meeting_date);

CREATE TABLE IF NOT EXISTS meeting_attendees (
  id CHAR(36) PRIMARY KEY,
  meeting_id CHAR(36) NOT NULL,
  employee_id CHAR(36) NOT NULL,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY uq_meeting_attendee (meeting_id, employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meeting_agenda_items (
  id CHAR(36) PRIMARY KEY,
  meeting_id CHAR(36) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  item_text VARCHAR(500) NOT NULL,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Department/Performance/Factory/CRM/Sales/Production/Quality/Purchase/HR
-- Review sections. `report_type_ref` optionally points at one of the
-- Reports & BI module's report types, reusing that engine's real data
-- rather than re-collecting the same numbers a second way. Purchase Review
-- and HR Review have no automated data source anywhere in this system (no
-- Purchasing or dedicated HR/leave module exists) - those sections are
-- notes-only, honestly, rather than fabricating a metric.
CREATE TABLE IF NOT EXISTS meeting_review_sections (
  id CHAR(36) PRIMARY KEY,
  meeting_id CHAR(36) NOT NULL,
  review_type ENUM('department','performance','factory','crm','sales','production','quality','purchase','hr') NOT NULL,
  report_type_ref VARCHAR(50) NULL,
  notes TEXT NULL,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- The Decision Register - a recorded choice, distinct from an Action (a
-- decision doesn't necessarily have an owner/due date the way an action does).
CREATE TABLE IF NOT EXISTS meeting_decisions (
  id CHAR(36) PRIMARY KEY,
  meeting_id CHAR(36) NOT NULL,
  decision_text VARCHAR(1000) NOT NULL,
  decided_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- The Action Tracker. `linked_delegated_task_id` is set the moment the
-- action is created - the actual assignment, due date, status, reminders,
-- and escalation all live in delegated_tasks from that point forward.
CREATE TABLE IF NOT EXISTS meeting_actions (
  id CHAR(36) PRIMARY KEY,
  meeting_id CHAR(36) NOT NULL,
  description VARCHAR(500) NOT NULL,
  assigned_to CHAR(36) NOT NULL,
  target_date DATE NOT NULL,
  priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  linked_delegated_task_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE RESTRICT,
  FOREIGN KEY (linked_delegated_task_id) REFERENCES delegated_tasks(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meeting_attachments (
  id CHAR(36) PRIMARY KEY,
  meeting_id CHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(1000) NOT NULL,
  uploaded_by CHAR(36) NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
