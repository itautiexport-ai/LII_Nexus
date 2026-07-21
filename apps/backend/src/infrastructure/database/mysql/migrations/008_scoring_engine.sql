-- Performance Scoring Engine: admin-configurable KPIs (unlimited, with
-- department-specific weight overrides), automatic weighted composite score
-- computation (no human ever does the averaging math by hand), monthly/
-- yearly score history, and ranking.
--
-- Distinct from officeperf's existing real-time Employee Dashboard score
-- (today/week/month, fixed 80/10/10) - that stays as-is for day-to-day
-- self-service visibility. This engine is the admin-configurable, historical,
-- rankable system used for monthly/yearly performance review across BOTH
-- Office and Factory KPIs.

CREATE TABLE IF NOT EXISTS kpi_definitions (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  category ENUM('office','factory') NOT NULL,
  -- How this KPI's raw 0-100 score is produced. The first six are computed
  -- automatically from real data already tracked elsewhere in this system;
  -- 'manual' is for KPIs this system has no underlying data source for yet
  -- (Attendance, Discipline) - a person records the raw score, but it still
  -- flows into the automatically-computed weighted composite below.
  calculation_type ENUM('flowchart','checklist','delegation','target_achievement','quality','timeliness','manual') NOT NULL,
  default_weightage DECIMAL(5,2) NOT NULL,
  description VARCHAR(500) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin can override a KPI's weight for a specific department without
-- touching its global default (which still applies to every other
-- department).
CREATE TABLE IF NOT EXISTS kpi_department_weightages (
  id CHAR(36) PRIMARY KEY,
  kpi_definition_id CHAR(36) NOT NULL,
  department_id CHAR(36) NOT NULL,
  weightage DECIMAL(5,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kpi_definition_id) REFERENCES kpi_definitions(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  UNIQUE KEY uq_kpi_department (kpi_definition_id, department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per employee/KPI/period. `weightage_used` snapshots what weight
-- was actually applied at computation time, so a later admin change to a
-- KPI's weight doesn't silently rewrite the meaning of historical scores.
CREATE TABLE IF NOT EXISTS employee_kpi_scores (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  kpi_definition_id CHAR(36) NOT NULL,
  period_type ENUM('monthly','yearly') NOT NULL,
  period_key VARCHAR(10) NOT NULL,      -- 'YYYY-MM' for monthly, 'YYYY' for yearly
  raw_score DECIMAL(5,2) NULL,          -- NULL = nothing to evaluate this period (e.g. no flowchart tasks due)
  weightage_used DECIMAL(5,2) NOT NULL,
  source ENUM('auto','manual') NOT NULL,
  entered_by CHAR(36) NULL,             -- set only when source = 'manual'
  computed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (kpi_definition_id) REFERENCES kpi_definitions(id) ON DELETE CASCADE,
  FOREIGN KEY (entered_by) REFERENCES employees(id) ON DELETE SET NULL,
  UNIQUE KEY uq_employee_kpi_period (employee_id, kpi_definition_id, period_type, period_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_eks_period ON employee_kpi_scores(period_type, period_key);

-- The automatically-computed weighted composite for an employee/period -
-- this is the number that gets ranked and charted. Always system-computed;
-- never hand-entered.
CREATE TABLE IF NOT EXISTS employee_composite_scores (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  period_type ENUM('monthly','yearly') NOT NULL,
  period_key VARCHAR(10) NOT NULL,
  overall_score DECIMAL(5,2) NULL,
  computed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY uq_employee_period (employee_id, period_type, period_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_ecs_period ON employee_composite_scores(period_type, period_key);
