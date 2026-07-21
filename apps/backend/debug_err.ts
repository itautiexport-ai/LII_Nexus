import { pool } from "./src/infrastructure/database/mysql/connection";
async function run() {
  try {
    await pool.query("INSERT INTO departments (id, name, code) VALUES ('123', 'Assembly', '0005')");
  } catch (err: any) {
    console.log("Error code:", err.code);
    console.log("Error object:", JSON.stringify(err, null, 2));
  }
  process.exit(0);
}
run();
