import bcrypt from "bcryptjs";
import { pool } from "./src/infrastructure/database/mysql/connection";

async function run() {
  try {
    const newPassword = "Password123!";
    const hash = bcrypt.hashSync(newPassword, 12);
    await pool.query("UPDATE users SET password_hash = ? WHERE email = 'admin@liinexus.com'", [hash]);
    console.log("Password reset successfully to:", newPassword);
  } catch (error) {
    console.error("Error resetting password:", error);
  } finally {
    process.exit(0);
  }
}

run();
