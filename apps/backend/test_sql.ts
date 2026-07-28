require("dotenv").config({ path: "apps/backend/.env" });
import { pool } from "./src/infrastructure/database/mysql/connection";

async function testSQL() {
  const sql = `
      SELECT 
        d.id as department_id,
        d.name as department_name,
        mh.name as hod_name,
        COALESCE(dpr.achieved_cbm, 0) as achieved_cbm,
        COALESCE(att.manpower, 0) as manpower,
        COALESCE(att.salary, 0) as salary
      FROM departments d
      LEFT JOIN (
        SELECT 
          factory_department_id, 
          SUM(CASE WHEN uom = 'CBM' THEN total_achievement ELSE 0 END) as achieved_cbm
        FROM dpr_entries
        WHERE entry_date BETWEEN ? AND ? AND deleted_at IS NULL
        GROUP BY factory_department_id
      ) dpr ON dpr.factory_department_id = d.id
      LEFT JOIN master_hods mh ON mh.id = (
        SELECT hod_id FROM dpr_entries WHERE factory_department_id = d.id AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1
      )
      LEFT JOIN (
        SELECT 
          e.department_id,
          COUNT(a.id) as manpower,
          SUM(e.salary / 30) as salary
        FROM attendance_entries a
        JOIN employees e ON e.id = a.employee_id
        WHERE a.record_date BETWEEN ? AND ? AND a.status = 'Present'
        GROUP BY e.department_id
      ) att ON att.department_id = d.id
      WHERE dpr.achieved_cbm > 0 OR att.manpower > 0
      ORDER BY d.name ASC
  `;
  try {
    const [rows] = await pool.query(sql, ['2026-07-01', '2026-07-31', '2026-07-01', '2026-07-31']);
    console.log(rows);
  } catch(e: any) {
    console.error("SQL ERROR:", e.message);
  }
  process.exit(0);
}

testSQL();
