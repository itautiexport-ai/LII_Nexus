const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function run() {
  let pool;
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'lii_nexus_app',
      password: process.env.DB_PASSWORD || 'Lii@123',
      database: process.env.DB_NAME || 'lii_nexus'
    });

    console.log("Adding depends_on_step_ids column...");
    try {
      await pool.query("ALTER TABLE fms_steps ADD COLUMN depends_on_step_ids JSON DEFAULT ('[]')");
      console.log("Column added.");
    } catch(e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log("Column already exists.");
      } else {
        throw e;
      }
    }

    console.log("Fetching all steps to populate dependencies...");
    const [managers] = await pool.query("SELECT id FROM fms_managers");
    
    let updatedCount = 0;
    for (const manager of managers) {
      const [steps] = await pool.query("SELECT * FROM fms_steps WHERE fms_id = ? ORDER BY sequence_order ASC", [manager.id]);
      
      let previousStepId = null;
      for (const step of steps) {
        let deps = [];
        // If it's sequential and there's a previous step, it depends on it
        if (step.is_sequential && previousStepId) {
          deps.push(previousStepId);
        }
        
        await pool.query("UPDATE fms_steps SET depends_on_step_ids = ? WHERE id = ?", [JSON.stringify(deps), step.id]);
        updatedCount++;
        
        // Save this step as the previous step for the next iteration
        previousStepId = step.id;
      }
    }
    
    console.log(`Updated ${updatedCount} steps with their new dependencies.`);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
