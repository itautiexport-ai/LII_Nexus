import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "lii_nexus_app",
    password: "Lii@123",
    database: "lii_nexus",
  });

  try {
    await conn.query("ALTER TABLE security_night_forms ADD COLUMN image_url VARCHAR(500) NULL AFTER remarks;");
    console.log("Added image_url column.");
  } catch (e: any) {
    console.log("image_url column might already exist:", e.message);
  }

  try {
    await conn.query("ALTER TABLE security_night_forms ADD COLUMN photo_captured_at DATETIME NULL AFTER image_url;");
    console.log("Added photo_captured_at column.");
  } catch (e: any) {
    console.log("photo_captured_at column might already exist:", e.message);
  }

  await conn.end();
  console.log("Database schema updated!");
}

main().catch(console.error);
