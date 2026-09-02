import bcrypt from "bcryptjs";
import { pool } from "./src/infrastructure/database/mysql/connection";

async function run() {
  try {
    // 1. Check what's currently in DB for admin
    const [rows] = await pool.query<any[]>(
      "SELECT email, employee_code, password_hash, temp_password, status, deleted_at FROM users WHERE email = 'admin@liinexus.com'"
    );

    if (rows.length === 0) {
      console.log("❌ No user found with email admin@liinexus.com");
      process.exit(1);
    }

    const user = rows[0];
    console.log("📋 User found:");
    console.log("  email:", user.email);
    console.log("  employee_code:", user.employee_code);
    console.log("  status:", user.status);
    console.log("  deleted_at:", user.deleted_at);
    console.log("  temp_password:", user.temp_password);
    console.log("  password_hash:", user.password_hash);

    // 2. Test if current hash matches Admin@123
    const match1 = bcrypt.compareSync("Admin@123", user.password_hash);
    console.log("\n🔐 Does hash match 'Admin@123'?", match1 ? "✅ YES" : "❌ NO");

    // 3. Force set a fresh known password
    const newPassword = "Admin@123";
    const newHash = bcrypt.hashSync(newPassword, 12);
    await pool.query(
      "UPDATE users SET password_hash = ?, temp_password = ?, status = 'active', deleted_at = NULL WHERE email = 'admin@liinexus.com'",
      [newHash, newPassword]
    );
    console.log("\n✅ Password forcefully reset to:", newPassword);
    console.log("✅ Status set to active, deleted_at cleared");

    // 4. Verify the new hash works
    const match2 = bcrypt.compareSync(newPassword, newHash);
    console.log("🔐 New hash verification:", match2 ? "✅ PASS" : "❌ FAIL");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    process.exit(0);
  }
}

run();
