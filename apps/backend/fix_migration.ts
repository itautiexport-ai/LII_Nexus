import { pool } from "./src/infrastructure/database/mysql/connection";
async function run() {
  await pool.query(`
    INSERT INTO departments (id, name, description, created_at, updated_at, deleted_at)
    SELECT fd.id, fd.name, 'Migrated from Factory', fd.created_at, fd.updated_at, fd.deleted_at
    FROM factory_departments fd
    LEFT JOIN departments d ON fd.name = d.name
    WHERE d.id IS NULL
  `);
  
  await pool.query(`UPDATE dpr_entries de JOIN factory_departments fd ON de.factory_department_id = fd.id JOIN departments d ON fd.name = d.name SET de.factory_department_id = d.id`);
  await pool.query(`UPDATE dpr_entries de JOIN factory_departments fd ON de.manpower_department_id = fd.id JOIN departments d ON fd.name = d.name SET de.manpower_department_id = d.id`);
  await pool.query(`UPDATE machines m JOIN factory_departments fd ON m.factory_department_id = fd.id JOIN departments d ON fd.name = d.name SET m.factory_department_id = d.id`);
  await pool.query(`UPDATE factory_production_entries fpe JOIN factory_departments fd ON fpe.factory_department_id = fd.id JOIN departments d ON fd.name = d.name SET fpe.factory_department_id = d.id`);

  try { await pool.query(`ALTER TABLE dpr_entries DROP FOREIGN KEY dpr_entries_ibfk_2`); } catch(e) {}
  try { await pool.query(`ALTER TABLE dpr_entries DROP FOREIGN KEY fk_dpr_manpower_dept`); } catch(e) {}
  try { await pool.query(`ALTER TABLE factory_production_entries DROP FOREIGN KEY factory_production_entries_ibfk_2`); } catch(e) {}
  try { await pool.query(`ALTER TABLE machines DROP FOREIGN KEY machines_ibfk_1`); } catch(e) {}

  await pool.query(`ALTER TABLE dpr_entries ADD CONSTRAINT dpr_entries_dept_fk FOREIGN KEY (factory_department_id) REFERENCES departments(id) ON DELETE RESTRICT`);
  await pool.query(`ALTER TABLE dpr_entries ADD CONSTRAINT dpr_entries_manpower_dept_fk FOREIGN KEY (manpower_department_id) REFERENCES departments(id) ON DELETE SET NULL`);
  await pool.query(`ALTER TABLE factory_production_entries ADD CONSTRAINT fpe_dept_fk FOREIGN KEY (factory_department_id) REFERENCES departments(id) ON DELETE RESTRICT`);
  await pool.query(`ALTER TABLE machines ADD CONSTRAINT machines_dept_fk FOREIGN KEY (factory_department_id) REFERENCES departments(id) ON DELETE SET NULL`);
  
  await pool.query(`DROP TABLE factory_departments`);
  
  // manually insert migration record
  await pool.query(`INSERT IGNORE INTO migrations (name) VALUES ('041_unify_departments.sql')`);
  console.log("Migration 041 manually applied successfully.");
  process.exit(0);
}
run();
