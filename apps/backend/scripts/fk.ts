import { pool } from "../src/infrastructure/database/mysql/connection";
async function run() {
  const [rows] = await pool.query("SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'employees' AND REFERENCED_TABLE_NAME IS NOT NULL");
  console.log(rows);
  process.exit(0);
}
run();
