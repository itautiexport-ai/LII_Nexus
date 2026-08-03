-- Bug fix found during final stabilization: kpi_engine_definitions was the
-- only seeded table in the entire application missing a UNIQUE constraint
-- on its natural key. Every other seeded table (permissions.key, roles.name,
-- behaviour_components.component_key, insight_rules.rule_key,
-- kpi_definitions.name, notification_templates.notification_type,
-- escalation_rules.level, departments.name) has one, which is what
-- makes `INSERT IGNORE ... VALUES (UUID(), 'some name', ...)` actually
-- idempotent - UUID() generates a fresh id every run, so without a unique
-- constraint on the natural key, INSERT IGNORE has nothing to collide
-- with and silently inserts a duplicate row every time the seeder runs.
-- Confirmed live: running `npm run seed:demo` twice on a fresh database
-- produced two rows for each of the two demo KPI definitions.

-- First, remove duplicates that may already exist, keeping one arbitrary
-- row per name (UUIDs aren't chronologically sortable, so "earliest"
-- isn't a meaningful distinction here - simply keeping exactly one row
-- per name is all that matters). Any entries recorded against a deleted
-- duplicate cascade-delete with it (kpi_engine_entries.kpi_definition_id
-- is ON DELETE CASCADE) - acceptable for cleaning up accidental
-- duplicates, since the surviving row for that name keeps its own entries.
DELETE d1 FROM kpi_engine_definitions d1
INNER JOIN kpi_engine_definitions d2
  ON d1.name = d2.name AND d1.id > d2.id;

ALTER TABLE kpi_engine_definitions ADD UNIQUE KEY uq_kpi_engine_definition_name (name);
