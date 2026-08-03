import { pool } from "./src/infrastructure/database/mysql/connection";
async function run() {
  const [rows] = await pool.query(`SELECT TABLE_NAME, CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_NAME = 'factory_departments' AND TABLE_SCHEMA = 'lii_nexus'`);
  for (const row of rows as any[]) {
    console.log(`ALTER TABLE ${row.TABLE_NAME} DROP FOREIGN KEY ${row.CONSTRAINT_NAME};`);
  }
  process.exit(0);
}
run();
