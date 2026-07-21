import bcrypt from "bcryptjs";
import { pool } from "./src/infrastructure/database/mysql/connection";

async function run() {
  try {
    const hash = await bcrypt.hash("Admin@123", 12);
    await pool.query("UPDATE users SET password_hash = ?, temp_password = 'Admin@123' WHERE email = 'admin@liinexus.com'", [hash]);
    console.log("Updated admin password to Admin@123");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
