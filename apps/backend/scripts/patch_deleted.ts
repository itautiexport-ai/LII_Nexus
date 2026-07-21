import { pool } from "../src/infrastructure/database/mysql/connection";
async function run() {
  await pool.query("UPDATE departments SET name = CONCAT(name, '-del-', SUBSTRING(id, 1, 6)), code = IF(code IS NULL, NULL, CONCAT(code, '-del-', SUBSTRING(id, 1, 6))) WHERE deleted_at IS NOT NULL AND name NOT LIKE '%-del-%'");
  console.log("Renamed soft-deleted departments to avoid unique constraint conflicts.");
  process.exit(0);
}
run();
