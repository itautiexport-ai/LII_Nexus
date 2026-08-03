import { pool } from "./src/infrastructure/database/mysql/connection";
async function run() {
  const [rows] = await pool.query(`SHOW TABLES LIKE 'factory_departments'`);
  console.log("Table exists:", rows.length > 0);
  process.exit(0);
}
run();
