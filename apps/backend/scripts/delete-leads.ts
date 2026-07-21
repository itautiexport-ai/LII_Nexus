import { pool } from "../src/infrastructure/database/mysql/connection";

async function run() {
  try {
    await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
    await pool.query("TRUNCATE TABLE crm_leads;");
    await pool.query("SET FOREIGN_KEY_CHECKS = 1;");
    console.log("All leads deleted successfully.");
  } catch (error) {
    console.error("Error deleting leads:", error);
  } finally {
    process.exit(0);
  }
}

run();
