import { pool } from "./src/infrastructure/database/mysql/connection";
async function run() {
  const [rows] = await pool.query(`
    SELECT fpe.id, fpe.factory_department_id 
    FROM factory_production_entries fpe 
    LEFT JOIN departments d ON fpe.factory_department_id = d.id 
    WHERE d.id IS NULL
  `);
  console.log("Orphans:", rows);
  process.exit(0);
}
run();
