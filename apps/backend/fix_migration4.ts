import { pool } from "./src/infrastructure/database/mysql/connection";
async function run() {
  const [rows] = await pool.query(`SHOW COLUMNS FROM schema_migrations`);
  console.log(rows);
  process.exit(0);
}
run();
