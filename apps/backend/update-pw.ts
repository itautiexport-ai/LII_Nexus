import bcrypt from "bcryptjs";
import { pool } from "./src/infrastructure/database/mysql/connection";

async function run() {
  const hash = await bcrypt.hash("Lokesh@123", 12);
  await pool.query("UPDATE users SET password_hash = ? WHERE email = 'LOKESH123'", [hash]);
  console.log("Password updated to Lokesh@123");
  process.exit(0);
}
run();
