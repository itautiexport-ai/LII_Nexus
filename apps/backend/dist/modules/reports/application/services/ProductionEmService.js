"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionEmService = void 0;
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
class ProductionEmService {
    /**
     * Fetches the Production EM report data.
     * This aggregates DPR Achieved CBM, and Attendance Manpower/Salary per Department.
     *
     * @param startDateStr Start Date string (e.g. '2026-07-01')
     * @param endDateStr End Date string (e.g. '2026-07-31')
     */
    async getProductionEmReport(startDateStr, endDateStr) {
        // SQL to aggregate CBM from DPR and Manpower/Salary from Attendance
        const sql = `
      SELECT 
        d.id as department_id,
        d.name as department_name,
        mh.name as hod_name,
        COALESCE(dpr.achieved_cbm, 0) as achieved_cbm,
        COALESCE(dpr.total_manpower, 0) as manpower,
        COALESCE(att.salary, 0) as salary
      FROM departments d
      LEFT JOIN (
        SELECT 
          factory_department_id, 
          SUM(total_achievement) as achieved_cbm,
          SUM(COALESCE(total_operator, 0) + COALESCE(total_helper, 0) + COALESCE(total_contractor, 0)) as total_manpower
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
          SUM(e.salary / 30) as salary -- Prorated daily salary for present days
        FROM attendance_entries a
        JOIN employees e ON e.id = a.employee_id
        WHERE a.record_date BETWEEN ? AND ? AND a.status = 'Present'
        GROUP BY e.department_id
      ) att ON att.department_id = d.id
      WHERE dpr.achieved_cbm > 0 OR dpr.total_manpower > 0
      ORDER BY d.name ASC
    `;
        const [rows] = await connection_1.pool.query(sql, [startDateStr, endDateStr, startDateStr, endDateStr]);
        // Fetch hr payroll salary for MACHINE SHOP for the month of startDateStr or endDateStr
        const startMonth = new Date(startDateStr).getMonth() + 1;
        const startYear = new Date(startDateStr).getFullYear();
        const endMonth = new Date(endDateStr).getMonth() + 1;
        const endYear = new Date(endDateStr).getFullYear();
        let machineShopHrSalary = 0;
        try {
            const hrSql = `
        SELECT SUM(gross_amt + ot_amt) as total_salary
        FROM department_weekly_payroll
        WHERE department_name = 'MACHINE SHOP'
          AND (
               (MONTH(week_start_date) = ? AND YEAR(week_start_date) = ?)
            OR (MONTH(week_end_date) = ? AND YEAR(week_end_date) = ?)
            OR (MONTH(week_start_date) = ? AND YEAR(week_start_date) = ?)
            OR (MONTH(week_end_date) = ? AND YEAR(week_end_date) = ?)
          )
      `;
            const [hrRows] = await connection_1.pool.query(hrSql, [
                startMonth, startYear, startMonth, startYear,
                endMonth, endYear, endMonth, endYear
            ]);
            if (hrRows && hrRows.length > 0 && hrRows[0].total_salary) {
                machineShopHrSalary = Number(hrRows[0].total_salary);
            }
        }
        catch (e) {
            console.error("Failed to fetch machine shop HR salary", e);
        }
        return rows.map((row, index) => {
            let deptName = row.department_name;
            let salary = Number(row.salary);
            // Override for Primary Machine Shop (or PRIMARY MS)
            if (deptName && (deptName.toLowerCase().includes("primary machine shop") || deptName.toLowerCase().includes("primary ms"))) {
                // If we found the HR payroll data for Machine Shop, use it
                if (machineShopHrSalary > 0) {
                    salary = machineShopHrSalary;
                }
            }
            return {
                sNo: index + 1,
                departmentName: deptName,
                hodName: row.hod_name || "N/A",
                achievedCbm: Number(row.achieved_cbm),
                manpower: Number(row.manpower),
                salary: salary
            };
        });
    }
}
exports.ProductionEmService = ProductionEmService;
//# sourceMappingURL=ProductionEmService.js.map