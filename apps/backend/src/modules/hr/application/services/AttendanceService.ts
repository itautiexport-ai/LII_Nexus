import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";

export class AttendanceService {
  async saveBulk(records: { employeeCode: string; date: string; status: string, otHours?: number }[]) {
    // 1. Fetch employee IDs based on employeeCode
    const codes = [...new Set(records.map(r => r.employeeCode))];
    if (codes.length === 0) return { message: "No records to save." };

    const [empRows] = await pool.query<any[]>("SELECT id, employee_code FROM employees WHERE employee_code IN (?) AND deleted_at IS NULL", [codes]);
    const empMap = new Map<string, string>();
    for (const row of empRows) {
      empMap.set(row.employee_code, row.id);
    }

    const valuesToInsert: any[] = [];
    let savedCount = 0;

    for (const r of records) {
      const empId = empMap.get(r.employeeCode);
      if (empId) {
        valuesToInsert.push([uuid(), empId, r.date, r.status, r.otHours || 0.00]);
        savedCount++;
      }
    }

    if (valuesToInsert.length > 0) {
      // Use ON DUPLICATE KEY UPDATE for the unique key (employee_id, record_date)
      const sql = `
        INSERT INTO attendance_entries (id, employee_id, record_date, status, ot_hours) 
        VALUES ? 
        ON DUPLICATE KEY UPDATE 
          status = VALUES(status), 
          ot_hours = VALUES(ot_hours),
          updated_at = CURRENT_TIMESTAMP
      `;
      await pool.query(sql, [valuesToInsert]);
    }

    return { message: `Successfully saved ${savedCount} attendance records.` };
  }
}
