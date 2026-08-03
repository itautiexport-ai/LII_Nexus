-- Reports & Business Intelligence: a dynamic reporting layer over data that
-- already exists across every module in this system. The 12 report types
-- are a FIXED catalog (each backed by a query reusing existing tables),
-- not a user-defined ad-hoc report builder - the same "aggregate what's
-- already there" philosophy as the CEO Command Center. This migration only
-- adds the metadata layer: saved filter sets, favourites, schedules,
-- configurable dashboard widgets, and a run history. No new business data
-- tables are needed.

CREATE TABLE IF NOT EXISTS saved_reports (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  report_type ENUM(
    'employee_performance','department_performance','office_performance','factory_performance',
    'workflow_reports','checklist_reports','delegation_reports','crm_reports','sales_pipeline',
    'merchant_performance','production_reports','executive_reports'
  ) NOT NULL,
  name VARCHAR(150) NOT NULL,
  -- Filters (date range, department, employee, merchant, buyer/customer,
  -- status) are stored as JSON since which filters apply varies by report
  -- type - a rigid column-per-filter schema would mean many always-NULL
  -- columns for most report types.
  filters JSON NOT NULL,
  chart_type ENUM('bar','line','pie','area','heatmap','gauge','treemap','table') NOT NULL DEFAULT 'table',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS favourite_reports (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  report_type ENUM(
    'employee_performance','department_performance','office_performance','factory_performance',
    'workflow_reports','checklist_reports','delegation_reports','crm_reports','sales_pipeline',
    'merchant_performance','production_reports','executive_reports'
  ) NOT NULL,
  saved_report_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (saved_report_id) REFERENCES saved_reports(id) ON DELETE CASCADE,
  UNIQUE KEY uq_favourite (user_id, report_type, saved_report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- No job scheduler exists in this stack (the same documented tradeoff as
-- checklist generation, KPI scoring, and notification escalation). A
-- "scheduled" report is computed on demand via a callable check - see
-- ScheduledReportService.runDueReports() - which finds reports whose
-- next-due time has passed and generates + records a run, exactly as a
-- real cron job would, just not on an actual timer.
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  report_type ENUM(
    'employee_performance','department_performance','office_performance','factory_performance',
    'workflow_reports','checklist_reports','delegation_reports','crm_reports','sales_pipeline',
    'merchant_performance','production_reports','executive_reports'
  ) NOT NULL,
  name VARCHAR(150) NOT NULL,
  filters JSON NOT NULL,
  frequency ENUM('daily','weekly','monthly') NOT NULL,
  status ENUM('active','paused') NOT NULL DEFAULT 'active',
  last_run_at DATETIME NULL,
  next_due_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS report_run_history (
  id CHAR(36) PRIMARY KEY,
  scheduled_report_id CHAR(36) NULL,
  report_type ENUM(
    'employee_performance','department_performance','office_performance','factory_performance',
    'workflow_reports','checklist_reports','delegation_reports','crm_reports','sales_pipeline',
    'merchant_performance','production_reports','executive_reports'
  ) NOT NULL,
  run_by CHAR(36) NULL,
  row_count INT NOT NULL DEFAULT 0,
  ran_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scheduled_report_id) REFERENCES scheduled_reports(id) ON DELETE CASCADE,
  FOREIGN KEY (run_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- A user's personal, configurable dashboard: an ordered set of widgets,
-- each pointing at a report type (+ optional saved filter set) and a chart
-- type to render it with.
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  report_type ENUM(
    'employee_performance','department_performance','office_performance','factory_performance',
    'workflow_reports','checklist_reports','delegation_reports','crm_reports','sales_pipeline',
    'merchant_performance','production_reports','executive_reports'
  ) NOT NULL,
  saved_report_id CHAR(36) NULL,
  chart_type ENUM('bar','line','pie','area','heatmap','gauge','treemap','table') NOT NULL DEFAULT 'table',
  title VARCHAR(150) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (saved_report_id) REFERENCES saved_reports(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_saved_reports_user ON saved_reports(user_id, report_type);
CREATE INDEX idx_scheduled_reports_due ON scheduled_reports(status, next_due_at);
CREATE INDEX idx_dashboard_widgets_user ON dashboard_widgets(user_id, sort_order);
