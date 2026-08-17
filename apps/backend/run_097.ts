import { pool } from "./src/infrastructure/database/mysql/connection";
import * as fs from "fs";
import * as path from "path";

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, "src/infrastructure/database/mysql/migrations/097_finishing_recipes.sql"), "utf-8");
  const statements = sql.split(';').filter(s => s.trim() !== '');
  for (const s of statements) {
    await pool.query(s);
  }
  console.log("097 migration applied successfully");
  process.exit(0);
}
run();
