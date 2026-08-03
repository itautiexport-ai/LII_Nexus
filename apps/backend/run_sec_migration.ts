import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

async function main() {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "lii_nexus_app",
    password: "Lii@123",
    database: "lii_nexus",
    multipleStatements: true,
  });

  const sqlPath = path.join(__dirname, "src/infrastructure/database/mysql/migrations/089_hr_security_custom_tables.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");
  await conn.query(sql);
  console.log("Migration 089_hr_security_custom_tables.sql executed successfully!");
  await conn.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
