const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'apps/backend/.env' });

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lii_nexus_v5'
  });
  
  const [fmsRows] = await pool.query("SELECT id, name FROM fms_managers WHERE name LIKE '%BUYER ORDER TO CARTON ORDER%'");
  if (fmsRows.length === 0) {
    console.log("FMS not found");
    process.exit(1);
  }
  
  const fmsId = fmsRows[0].id;
  
  // Update steps 1, 2, 3, 4, 9, 14, 18, 19
  // The sequence_order is usually index (0-based) or index + 1 depending on how we seeded it.
  // The frontend showed "Order 1" for "Enter the customer order into the ERP system."
  // Wait, let's just clear doer_employee_ids for sequence_order in (0, 1, 2, 3, 8, 13, 17, 18)
  const orderIndices = [0, 1, 2, 3, 8, 13, 17, 18];
  
  for (const seq of orderIndices) {
     await pool.query("UPDATE fms_steps SET doer_employee_ids = '[]' WHERE fms_id = ? AND sequence_order = ?", [fmsId, seq]);
  }
  console.log("Steps updated!");
  process.exit(0);
}
run();
