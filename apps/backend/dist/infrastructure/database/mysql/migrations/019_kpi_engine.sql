-- Configurable KPI Engine. Deliberately separate from the existing
-- Performance Scoring Engine (built earlier), which is genuinely a
-- different mechanism: that engine's KPIs are backed by fixed,
-- hardcoded `calculation_type` dispatch (flowchart/checklist/CRM/etc.) -
-- adding a new one requires a code change. THIS engine's entire point is
-- "admin creates KPIs without coding": every KPI here is fed by manually
-- entered Target/Actual values per period, and a small ADMIN-TYPED
-- arithmetic formula (never eval()/Function() - a hand-written, whitelisted
-- expression evaluator, see KpiFormulaEvaluator) computes the score. This
-- also naturally supports Purchase/Quality/HR categories, which have no
-- automated data source anywhere in this system - manual entry is the only
-- honest option for those, exactly as this engine is designed to do anyway.

CREATE TABLE IF NOT EXISTS kpi_engine_definitions (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category ENUM('office','factory','crm','purchase','quality','hr') NOT NULL,
  -- A small arithmetic expression using only the variables `target` and
  -- `actual`, e.g. "actual/target*100" or "(target-actual)/target*100" for
  -- an inverse metric (lower actual = better). Validated against a strict
  -- whitelist before being stored - see KpiFormulaEvaluator.validate().
  formula VARCHAR(255) NOT NULL,
  weightage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  frequency ENUM('daily','weekly','monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
  responsible_employee_id CHAR(36) NULL,
  department_id CHAR(36) NULL,
  -- Traffic light thresholds, per-KPI and admin-editable - "Everything
  -- configurable" per the spec. green_threshold and above = green;
  -- amber_threshold up to green_threshold = amber; below amber = red.
  green_threshold DECIMAL(6,2) NOT NULL DEFAULT 90.00,
  amber_threshold DECIMAL(6,2) NOT NULL DEFAULT 70.00,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (responsible_employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_kpi_engine_definitions_category ON kpi_engine_definitions(category);
CREATE INDEX idx_kpi_engine_definitions_department ON kpi_engine_definitions(department_id);

-- One row per KPI per period: the manually entered Target/Actual, and the
-- score/traffic-light computed from them via the KPI's own formula and
-- thresholds at the time of entry (snapshotted, so a later formula edit
-- doesn't silently rewrite historical scores' meaning - the same
-- "weightage_used" snapshot principle used by the Scoring Engine).
CREATE TABLE IF NOT EXISTS kpi_engine_entries (
  id CHAR(36) PRIMARY KEY,
  kpi_definition_id CHAR(36) NOT NULL,
  period_key VARCHAR(10) NOT NULL,
  target DECIMAL(15,4) NOT NULL,
  actual DECIMAL(15,4) NOT NULL,
  computed_score DECIMAL(8,2) NULL,
  traffic_light ENUM('red','amber','green') NULL,
  weightage_used DECIMAL(5,2) NOT NULL,
  entered_by CHAR(36) NULL,
  entered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kpi_definition_id) REFERENCES kpi_engine_definitions(id) ON DELETE CASCADE,
  FOREIGN KEY (entered_by) REFERENCES employees(id) ON DELETE SET NULL,
  UNIQUE KEY uq_kpi_entry_period (kpi_definition_id, period_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_kpi_engine_entries_period ON kpi_engine_entries(period_key);
