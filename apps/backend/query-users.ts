import { pool } from "./src/infrastructure/database/mysql/connection";

async function run() {
  try {
    const [rows] = await pool.query("SELECT * FROM users");
    console.log(rows);
  } catch (error) {
    console.error("Error querying users:", error);
  } finally {
    process.exit(0);
  }
}

run();
