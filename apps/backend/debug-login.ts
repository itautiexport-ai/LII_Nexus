import { pool } from "./src/infrastructure/database/mysql/connection";
import bcrypt from "bcryptjs";

async function run() {
  try {
    const identifier = "admin@liinexus.com";

    // Simulate exactly what findByIdentifier does
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM users WHERE (email = ? OR employee_code = ?) AND deleted_at IS NULL",
      [identifier, identifier]
    );

    console.log("🔍 findByIdentifier rows found:", rows.length);

    if (rows.length === 0) {
      console.log("❌ User NOT FOUND — check email column value exactly");

      // Show all admin-like users
      const [all] = await pool.query<any[]>(
        "SELECT id, email, employee_code, status, deleted_at FROM users WHERE email LIKE '%admin%' OR employee_code = 'EMP-0001'"
      );
      console.log("All admin-like users:", JSON.stringify(all, null, 2));
    } else {
      const user = rows[0];
      console.log("✅ User found:", user.email, "| status:", user.status, "| deleted_at:", user.deleted_at);

      const password = "Admin@123";
      const match = bcrypt.compareSync(password, user.password_hash);
      console.log("🔐 bcrypt match for 'Admin@123':", match ? "✅ YES" : "❌ NO");

      // Also check mapRow to understand passwordHash field mapping
      console.log("📦 Raw row keys:", Object.keys(user));
    }
  } catch (e: any) {
    console.error("❌ Error:", e.message);
  } finally {
    process.exit(0);
  }
}

run();
