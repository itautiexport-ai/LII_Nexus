import { pool } from "./src/infrastructure/database/mysql/connection";
async function run() {
  const [rows] = await pool.query(`SELECT id, name, code FROM departments`);
  console.log(rows);
  process.exit(0);
}
run();
