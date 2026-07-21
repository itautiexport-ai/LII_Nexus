import { pool } from "../src/infrastructure/database/mysql/connection";
async function run() {
  await pool.query("UPDATE employees SET manager_id = NULL");
  console.log("Cleared existing manager_ids");
  
  try {
    await pool.query("ALTER TABLE employees DROP FOREIGN KEY employees_ibfk_4");
    console.log("Dropped old FK");
  } catch(e: any) {
    console.log("FK drop skipped or failed:", e.message);
  }
  
  try {
    await pool.query("ALTER TABLE employees ADD CONSTRAINT employees_hod_fk FOREIGN KEY (manager_id) REFERENCES master_hods(id) ON DELETE SET NULL");
    console.log("Added new FK to master_hods");
  } catch(e: any) {
    console.log("FK add failed:", e.message);
  }
  
  process.exit(0);
}
run();
