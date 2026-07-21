import bcrypt from "bcryptjs";
import { pool } from "./src/infrastructure/database/mysql/connection";

async function run() {
  try {
    const [users] = await pool.query<any[]>("SELECT id, temp_password, email FROM users WHERE temp_password IS NOT NULL");
    
    console.log(`Found ${users.length} users with temp passwords. Updating...`);
    
    for (const user of users) {
      if (!user.temp_password) continue;
      const hash = await bcrypt.hash(user.temp_password, 12);
      await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, user.id]);
      console.log(`Updated password for ${user.email} -> ${user.temp_password}`);
    }
    
    console.log("Done.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
