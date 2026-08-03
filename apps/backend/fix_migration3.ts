import { pool } from "./src/infrastructure/database/mysql/connection";
async function run() {
  await pool.query(`DROP TABLE IF EXISTS factory_departments`);
  await pool.query(`INSERT IGNORE INTO schema_migrations (name) VALUES ('041_unify_departments.sql')`);
  console.log("Migration 041 fixed successfully.");
  process.exit(0);
}
run();
