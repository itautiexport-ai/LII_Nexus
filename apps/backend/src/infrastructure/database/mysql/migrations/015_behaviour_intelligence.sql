-- Behaviour Intelligence Engine: measures HOW people work (consistency,
-- discipline, delay patterns, improvement trend, manager feedback) as a
-- deliberately separate axis from the Performance Scoring Engine (which
-- measures WHAT got produced). Kept as its own weighted composite rather
-- than folded into the existing KPI engine, per the explicit "measure
-- behaviour rather than only productivity" framing - these are different
-- questions, not the same one asked twice.

-- Admin-configurable component weights. No department overrides (unlike
-- the Scoring Engine's KPIs) - a deliberate scope simplification, since
-- behaviour is being measured as an individual pattern, not compared to a
-- department-specific target.
CREATE TABLE IF NOT EXISTS behaviour_components (
  id CHAR(36) PRIMARY KEY,
  component_key ENUM(
    'on_time_completion','delay_frequency','average_delay','task_consistency',
    'checklist_discipline','delegation_discipline','followup_discipline','crm_discipline',
    'attendance_impact','improvement_trend','manager_feedback'
  ) NOT NULL UNIQUE,
  label VARCHAR(150) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  description VARCHAR(500) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per employee/period: the computed composite plus each
-- component's raw score, stored as JSON for the same reason report filters
-- are JSON - the component set is fixed but keeping this as a flexible
-- breakdown avoids an ever-growing column list if components change later.
CREATE TABLE IF NOT EXISTS employee_behaviour_scores (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  period_type ENUM('monthly','yearly') NOT NULL,
  period_key VARCHAR(10) NOT NULL,
  overall_index DECIMAL(5,2) NULL,
  component_scores JSON NOT NULL,
  computed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY uq_employee_period (employee_id, period_type, period_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_behaviour_scores_period ON employee_behaviour_scores(period_type, period_key);

-- Manager Feedback: a genuinely new input this system didn't capture
-- anywhere before - a qualitative signal alongside all the derived,
-- computed metrics. Self-reported by a manager about their direct report,
-- one rating per period (a manager can update their own rating for a
-- period rather than stacking duplicates).
CREATE TABLE IF NOT EXISTS manager_feedback (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  submitted_by CHAR(36) NULL,
  period_type ENUM('monthly','yearly') NOT NULL,
  period_key VARCHAR(10) NOT NULL,
  rating TINYINT NOT NULL,
  comments VARCHAR(1000) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (submitted_by) REFERENCES employees(id) ON DELETE SET NULL,
  UNIQUE KEY uq_feedback_period (employee_id, period_type, period_key),
  CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Configurable thresholds for the rule-based Insights Engine. "Everything
-- configurable" per the spec - an admin can tune what counts as a
-- significant productivity drop, a repeat-defaulter pattern, etc. without
-- a code change.
CREATE TABLE IF NOT EXISTS insight_rules (
  id CHAR(36) PRIMARY KEY,
  rule_key ENUM(
    'productivity_drop','merchant_followups_missed','department_declining',
    'consistency_improved','repeat_defaulter','delay_spike'
  ) NOT NULL UNIQUE,
  label VARCHAR(200) NOT NULL,
  threshold_value DECIMAL(6,2) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  description VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- A record of every insight the rule engine has generated - this IS the
-- "Executive Insights" listing, and the audit trail of what the engine
-- found and when. `entity_type`/`entity_id` point at whatever the insight
-- is about (a department, a merchant, an employee) generically.
CREATE TABLE IF NOT EXISTS generated_insights (
  id CHAR(36) PRIMARY KEY,
  rule_key VARCHAR(50) NOT NULL,
  severity ENUM('info','warning','critical') NOT NULL DEFAULT 'info',
  message VARCHAR(500) NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id VARCHAR(100) NULL,
  period_type ENUM('monthly','yearly') NOT NULL,
  period_key VARCHAR(10) NOT NULL,
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_generated_insights_period ON generated_insights(period_type, period_key);
