import { pool } from "./src/infrastructure/database/mysql/connection";
async function run() {
  try { await pool.query(`ALTER TABLE dpr_entries ADD CONSTRAINT dpr_entries_dept_fk FOREIGN KEY (factory_department_id) REFERENCES departments(id) ON DELETE RESTRICT`); } catch(e) {}
  try { await pool.query(`ALTER TABLE dpr_entries ADD CONSTRAINT dpr_entries_manpower_dept_fk FOREIGN KEY (manpower_department_id) REFERENCES departments(id) ON DELETE SET NULL`); } catch(e) {}
  try { await pool.query(`ALTER TABLE factory_production_entries ADD CONSTRAINT fpe_dept_fk FOREIGN KEY (factory_department_id) REFERENCES departments(id) ON DELETE RESTRICT`); } catch(e) {}
  try { await pool.query(`ALTER TABLE machines ADD CONSTRAINT machines_dept_fk FOREIGN KEY (factory_department_id) REFERENCES departments(id) ON DELETE SET NULL`); } catch(e) {}
  
  await pool.query(`DROP TABLE IF EXISTS factory_departments`);
  await pool.query(`INSERT IGNORE INTO migrations (name) VALUES ('041_unify_departments.sql')`);
  console.log("Migration 041 fixed successfully.");
  process.exit(0);
}
run();
