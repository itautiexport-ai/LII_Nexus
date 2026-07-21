"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const connection_1 = require("./connection");
const env_1 = require("../../../config/env");
const seedDemoData_1 = require("./seedDemoData");
async function runSqlFile(filePath) {
    const sql = fs_1.default.readFileSync(filePath, "utf-8");
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
        await connection_1.pool.query(statement);
    }
}
async function syncSystemAdminPermissions() {
    const [roleRows] = await connection_1.pool.query("SELECT id FROM roles WHERE name = ?", ["System Admin"]);
    if (!roleRows[0])
        return;
    const roleId = roleRows[0].id;
    const [permRows] = await connection_1.pool.query("SELECT id FROM permissions");
    for (const perm of permRows) {
        await connection_1.pool.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [roleId, perm.id]);
    }
    console.log(`System Admin role synced with ${permRows.length} permission(s).`);
}
async function seedBootstrapAdmin() {
    const [rows] = await connection_1.pool.query("SELECT id FROM users WHERE email = ?", ["admin@liinexus.com"]);
    if (Array.isArray(rows) && rows.length > 0) {
        console.log("Bootstrap admin already exists, skipping user creation.");
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash("ChangeMe123!", env_1.env.bcryptSaltRounds);
    const userId = (0, uuid_1.v4)();
    await connection_1.pool.query(`INSERT INTO users (id, employee_code, email, password_hash, full_name, status)
     VALUES (?, ?, ?, ?, ?, 'active')`, [userId, "EMP-0001", "admin@liinexus.com", passwordHash, "System Administrator"]);
    const [roleRows] = await connection_1.pool.query("SELECT id FROM roles WHERE name = ?", ["System Admin"]);
    const roleId = roleRows[0].id;
    await connection_1.pool.query("INSERT IGNORE INTO user_roles (user_id, role_id, scope_type, scope_id) VALUES (?, ?, 'global', '')", [userId, roleId]);
    console.log("Bootstrap admin created: admin@liinexus.com / ChangeMe123! (change immediately after first login)");
}
async function main() {
    const seedersDir = path_1.default.join(__dirname, "seeders");
    const files = fs_1.default.readdirSync(seedersDir).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
        await runSqlFile(path_1.default.join(seedersDir, file));
        console.log(`Seeded: ${file}`);
    }
    await syncSystemAdminPermissions();
    await seedBootstrapAdmin();
    // Demo/pilot data (7 test logins across every role, a sample manager
    // hierarchy, and one record in each major module) is opt-in, not
    // automatic - a real production deploy should not silently get fake CRM
    // leads and shared Test@1234 passwords. Run with: npm run seed:demo
    if (process.argv.includes("--demo")) {
        await (0, seedDemoData_1.seedDemoData)();
    }
    console.log("Seeding complete.");
    process.exit(0);
}
main().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map