import { pool } from "./src/infrastructure/database/mysql/connection";
async function run() {
  const [rows] = await pool.query(`SELECT * FROM factory_departments WHERE id = '42c92f02-7ab9-11f1-8dcf-4bfd1368d0d8'`);
  console.log("FD:", rows);
  const [rows2] = await pool.query(`SELECT * FROM departments WHERE name = (SELECT name FROM factory_departments WHERE id = '42c92f02-7ab9-11f1-8dcf-4bfd1368d0d8')`);
  console.log("Dept:", rows2);
  process.exit(0);
}
run();
