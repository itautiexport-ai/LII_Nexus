import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { pool } from "./connection";
import { env } from "../../../config/env";
import { seedDemoData } from "./seedDemoData";

async function runSqlFile(filePath: string) {
  const sql = fs.readFileSync(filePath, "utf-8");
  // Same fix as migrate.ts: strip full-line `--` comments before splitting
  // on semicolons, so a semicolon inside a comment's prose doesn't get
  // mistaken for a statement terminator.
  const withoutCommentLines = sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  const statements = withoutCommentLines
    .split(/;\s*[\r\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await pool.query(statement);
  }
}

async function syncSystemAdminPermissions() {
  const [roleRows] = await pool.query<any[]>("SELECT id FROM roles WHERE name = ?", ["System Admin"]);
  if (!roleRows[0]) return;
  const roleId = roleRows[0].id;

  const [permRows] = await pool.query<any[]>("SELECT id FROM permissions");
  for (const perm of permRows) {
    await pool.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [roleId, perm.id]);
  }
  console.log(`System Admin role synced with ${permRows.length} permission(s).`);
}

async function seedBootstrapAdmin() {
  const [rows] = await pool.query<any[]>("SELECT id FROM users WHERE email = ?", ["admin@liinexus.com"]);
  if (Array.isArray(rows) && rows.length > 0) {
    console.log("Bootstrap admin already exists, skipping user creation.");
    return;
  }
  const passwordHash = await bcrypt.hash("ChangeMe123!", env.bcryptSaltRounds);
  const userId = uuid();
  await pool.query(
    `INSERT INTO users (id, employee_code, email, password_hash, full_name, status)
     VALUES (?, ?, ?, ?, ?, 'active')`,
    [userId, "EMP-0001", "admin@liinexus.com", passwordHash, "System Administrator"]
  );

  const [roleRows] = await pool.query<any[]>("SELECT id FROM roles WHERE name = ?", ["System Admin"]);
  const roleId = roleRows[0].id;

  await pool.query(
    "INSERT IGNORE INTO user_roles (user_id, role_id, scope_type, scope_id) VALUES (?, ?, 'global', '')",
    [userId, roleId]
  );

  console.log("Bootstrap admin created: admin@liinexus.com / ChangeMe123! (change immediately after first login)");
}

async function main() {
  const seedersDir = path.join(__dirname, "seeders");
  const files = fs.readdirSync(seedersDir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    await runSqlFile(path.join(seedersDir, file));
    console.log(`Seeded: ${file}`);
  }
  await syncSystemAdminPermissions();
  await seedBootstrapAdmin();

  // Demo/pilot data (7 test logins across every role, a sample manager
  // hierarchy, and one record in each major module) is opt-in, not
  // automatic - a real production deploy should not silently get fake CRM
  // leads and shared Test@1234 passwords. Run with: npm run seed:demo
  if (process.argv.includes("--demo")) {
    await seedDemoData();
  }

  console.log("Seeding complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
