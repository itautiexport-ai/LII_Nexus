"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
class AttendanceService {
    async saveBulk(records) {
        // 1. Fetch employee IDs based on employeeCode
        const codes = [...new Set(records.map(r => r.employeeCode))];
        if (codes.length === 0)
            return { message: "No records to save." };
        const [empRows] = await connection_1.pool.query("SELECT id, employee_code FROM employees WHERE employee_code IN (?) AND deleted_at IS NULL", [codes]);
        const empMap = new Map();
        for (const row of empRows) {
            empMap.set(row.employee_code, row.id);
        }
        const valuesToInsert = [];
        let savedCount = 0;
        for (const r of records) {
            const empId = empMap.get(r.employeeCode);
            if (empId) {
                valuesToInsert.push([(0, uuid_1.v4)(), empId, r.date, r.status, r.otHours || 0.00]);
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
            await connection_1.pool.query(sql, [valuesToInsert]);
        }
        return { message: `Successfully saved ${savedCount} attendance records.` };
    }
}
exports.AttendanceService = AttendanceService;
//# sourceMappingURL=AttendanceService.js.map