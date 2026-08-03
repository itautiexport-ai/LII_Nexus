const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'apps/backend/.env' });

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  const [fmsRows] = await pool.query("SELECT id, name FROM fms_managers WHERE name LIKE '%BUYER ORDER TO CARTON ORDER%'");
  if (fmsRows.length === 0) {
    console.log("FMS not found");
    process.exit(1);
  }
  
  const fmsId = fmsRows[0].id;
  const [steps] = await pool.query("SELECT id, step_name, sequence_order, doer_employee_ids FROM fms_steps WHERE fms_id = ? ORDER BY sequence_order ASC", [fmsId]);
  
  console.log("Steps for", fmsRows[0].name);
  steps.forEach(s => {
    console.log(`Step ${s.sequence_order + 1}: ${s.step_name} | Doers: ${s.doer_employee_ids}`);
  });
  process.exit(0);
}
run();
