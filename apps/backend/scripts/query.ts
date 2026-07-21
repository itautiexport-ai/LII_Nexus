import { pool } from "../src/infrastructure/database/mysql/connection";
async function run() {
  const [entries] = await pool.query("SELECT * FROM dpr_entries ORDER BY created_at DESC LIMIT 5");
  console.log("dpr_entries:", entries);
  process.exit(0);
}
run();
