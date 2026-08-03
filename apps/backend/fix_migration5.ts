import { pool } from "./src/infrastructure/database/mysql/connection";
async function run() {
  await pool.query(`INSERT IGNORE INTO schema_migrations (filename) VALUES ('041_unify_departments.sql')`);
  console.log("Inserted!");
  process.exit(0);
}
run();
