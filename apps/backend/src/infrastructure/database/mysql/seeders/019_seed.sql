INSERT IGNORE INTO permissions (id, `key`, module, description) VALUES
  (UUID(), 'kpiengine.definition.view', 'kpiengine', 'View KPI Engine definitions'),
  (UUID(), 'kpiengine.definition.manage', 'kpiengine', 'Create and edit KPI Engine definitions - no code required'),
  (UUID(), 'kpiengine.entry.manage', 'kpiengine', 'Record Target/Actual entries for a KPI period'),
  (UUID(), 'kpiengine.score.view', 'kpiengine', 'View Employee/Department/Company KPI Engine scores for others');

-- Two example KPIs demonstrating the no-code formula mechanism across
-- categories this system has no automated data for (Purchase, HR) -
-- proving the point of this engine rather than just describing it.
INSERT IGNORE INTO kpi_engine_definitions (id, name, category, formula, weightage, frequency, green_threshold, amber_threshold) VALUES
  (UUID(), 'On-Time Purchase Order Delivery %', 'purchase', 'actual/target*100', 20.00, 'monthly', 90, 70),
  (UUID(), 'Employee Attrition Rate (lower is better)', 'hr', '(target-actual)/target*100+100', 15.00, 'quarterly', 90, 70);
