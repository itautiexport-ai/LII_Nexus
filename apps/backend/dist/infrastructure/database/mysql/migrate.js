"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* Simple migration runner: executes .sql files in order, tracking which have
   already been applied in a `schema_migrations` table so re-running this
   command (e.g. after pulling a new migration file) only applies what's new,
   instead of re-running every file from 001 and failing on "already exists"
   errors. Not a replacement for a full migration tool (knex/umzug) in a real
   deployment, but sufficient - and importantly, actually idempotent - for
   this scope. */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const connection_1 = require("./connection");
async function ensureMigrationsTableExists() {
    await connection_1.pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}
async function getAppliedMigrations() {
    const [rows] = await connection_1.pool.query("SELECT filename FROM schema_migrations");
    return new Set(rows.map((r) => r.filename));
}
async function runSqlFile(filePath) {
    const sql = fs_1.default.readFileSync(filePath, "utf-8");
    // Strip full-line `--` comments before splitting on semicolons - a
    // semicolon inside a comment (e.g. "...this system;" as prose) was
    // previously mistaken for a statement terminator, silently truncating
    // the SQL and producing a syntax error partway through a CREATE TABLE.
    // This only strips comments that occupy their own line; inline trailing
    // comments after real SQL are left alone since none of our migrations
    // use that style, keeping this fix minimal and low-risk.
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
async function main() {
    await ensureMigrationsTableExists();
    const applied = await getAppliedMigrations();
    const migrationsDir = path_1.default.join(__dirname, "migrations");
    const files = fs_1.default.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
    let appliedCount = 0;
    for (const file of files) {
        if (applied.has(file)) {
            console.log(`Skipped (already applied): ${file}`);
            continue;
        }
        await runSqlFile(path_1.default.join(migrationsDir, file));
        await connection_1.pool.query("INSERT INTO schema_migrations (filename) VALUES (?)", [file]);
        console.log(`Applied: ${file}`);
        appliedCount++;
    }
    console.log(appliedCount > 0 ? `Migrations complete (${appliedCount} newly applied).` : "Migrations complete (nothing new to apply).");
    process.exit(0);
}
main().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map