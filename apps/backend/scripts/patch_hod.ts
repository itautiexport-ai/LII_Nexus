import { pool } from "../src/infrastructure/database/mysql/connection";
async function run() {
  const [hods] = await pool.query<any[]>("SELECT id FROM master_hods LIMIT 1");
  if (hods.length > 0) {
    const firstId = hods[0].id;
    await pool.query("UPDATE dpr_entries SET hod_id = ? WHERE hod_id IS NULL", [firstId]);
    console.log("Patched missing HODs with", firstId);
    await pool.query("ALTER TABLE dpr_entries MODIFY COLUMN hod_id VARCHAR(36) NOT NULL");
    console.log("Made hod_id NOT NULL");
  } else {
    console.log("No HODs available to patch.");
  }
  process.exit(0);
}
run();
