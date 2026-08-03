import { pool } from "../src/infrastructure/database/mysql/connection";
async function run() {
  await pool.query("DELETE FROM departments WHERE deleted_at IS NOT NULL");
  console.log("Cleaned up soft-deleted departments");
  process.exit(0);
}
run();
