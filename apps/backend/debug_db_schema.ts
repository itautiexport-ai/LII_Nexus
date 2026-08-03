import { pool } from "./src/infrastructure/database/mysql/connection";
async function run() {
  const [rows] = await pool.query(`SHOW CREATE TABLE departments`);
  console.log(rows[0]['Create Table']);
  process.exit(0);
}
run();
