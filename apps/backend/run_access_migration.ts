import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "lii_nexus_app",
    password: process.env.DB_PASSWORD || "Lii@123",
    database: process.env.DB_NAME || "lii_nexus",
    multipleStatements: true,
  });

  const sqlPath = path.join(__dirname, "src/infrastructure/database/mysql/migrations/111_access_requests.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");
  await conn.query(sql);
  console.log("Migration 111_access_requests.sql executed successfully!");
  await conn.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
