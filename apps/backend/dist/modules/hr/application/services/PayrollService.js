"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollService = void 0;
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
const uuid_1 = require("uuid");
class PayrollService {
    async saveDepartmentWeeklyPayroll(data, weekStartStr, weekEndStr) {
        const connection = await connection_1.pool.getConnection();
        try {
            await connection.beginTransaction();
            // Clear existing entries for this week to allow re-upload
            await connection.query(`DELETE FROM department_weekly_payroll WHERE week_start_date = ? AND week_end_date = ?`, [weekStartStr, weekEndStr]);
            for (const row of data) {
                if (!row.departmentName)
                    continue;
                await connection.query(`INSERT INTO department_weekly_payroll 
           (id, department_name, week_start_date, week_end_date, gross, days, ot_hrs, gross_amt, ot_amt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    (0, uuid_1.v4)(),
                    row.departmentName,
                    weekStartStr,
                    weekEndStr,
                    Number(row.gross) || 0,
                    Number(row.days) || 0,
                    Number(row.otHrs) || 0,
                    Number(row.grossAmt) || 0,
                    Number(row.otAmt) || 0
                ]);
            }
            await connection.commit();
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    async getDepartmentMonthlyPayroll(month, year) {
        // We fetch all weekly payrolls where the week overlaps with the requested month
        const sql = `
      SELECT 
        department_name as departmentName,
        SUM(gross) as gross,
        SUM(days) as days,
        SUM(ot_hrs) as otHrs,
        SUM(gross_amt) as grossAmt,
        SUM(ot_amt) as otAmt
      FROM department_weekly_payroll
      WHERE MONTH(week_start_date) = ? AND YEAR(week_start_date) = ?
         OR MONTH(week_end_date) = ? AND YEAR(week_end_date) = ?
      GROUP BY department_name
      ORDER BY department_name ASC
    `;
        const [rows] = await connection_1.pool.query(sql, [month, year, month, year]);
        return rows.map((r, index) => ({
            sNo: index + 1,
            departmentName: r.departmentName,
            gross: Number(r.gross),
            days: Number(r.days),
            otHrs: Number(r.otHrs),
            grossAmt: Number(r.grossAmt),
            otAmt: Number(r.otAmt)
        }));
    }
    // Keep existing methods
    async getWeeklyPayroll(startDateStr, endDateStr) {
        const sql = `
      SELECT 
        e.id as employee_id,
        e.employee_code,
        e.full_name as employee_name,
        d.name as department_name,
        COALESCE(e.salary, 0) as monthly_salary,
        COUNT(a.id) as days_present,
        SUM(COALESCE(e.salary, 0) / 30) as payout
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN attendance_entries a ON a.employee_id = e.id 
          AND a.record_date BETWEEN ? AND ? 
          AND a.status = 'Present'
      WHERE e.deleted_at IS NULL
      GROUP BY e.id, e.employee_code, e.full_name, d.name, e.salary
      ORDER BY d.name ASC, e.full_name ASC
    `;
        const [rows] = await connection_1.pool.query(sql, [startDateStr, endDateStr]);
        return rows.map((r, index) => ({
            sNo: index + 1,
            employeeId: r.employee_id,
            employeeCode: r.employee_code,
            employeeName: r.employee_name,
            departmentName: r.department_name || "N/A",
            monthlySalary: Number(r.monthly_salary),
            daysPresent: Number(r.days_present),
            payout: Number(r.payout)
        }));
    }
    async getMonthlySalarySheet(startDateStr, endDateStr) {
        const simplifiedSql = `
      SELECT 
        d.name as department_name,
        SUM(emp_agg.monthly_salary) as gross,
        SUM(emp_agg.days_present) as days,
        SUM(emp_agg.ot_hours) as ot_hrs,
        SUM((emp_agg.monthly_salary / 30) * emp_agg.days_present) as gross_amt,
        SUM((emp_agg.monthly_salary / 30 / 8) * emp_agg.ot_hours) as ot_amt
      FROM (
        SELECT 
          e.id,
          e.department_id,
          COALESCE(e.salary, 0) as monthly_salary,
          (
            SELECT COUNT(*) FROM attendance_entries a1 
            WHERE a1.employee_id = e.id AND a1.record_date BETWEEN ? AND ? AND a1.status = 'Present'
          ) as days_present,
          (
            SELECT SUM(COALESCE(a2.ot_hours, 0)) FROM attendance_entries a2 
            WHERE a2.employee_id = e.id AND a2.record_date BETWEEN ? AND ?
          ) as ot_hours
        FROM employees e
        WHERE e.deleted_at IS NULL
      ) as emp_agg
      JOIN departments d ON d.id = emp_agg.department_id
      GROUP BY d.id, d.name
      ORDER BY d.name ASC
    `;
        const [rows] = await connection_1.pool.query(simplifiedSql, [startDateStr, endDateStr, startDateStr, endDateStr]);
        return rows.map((r, index) => ({
            sNo: index + 1,
            departmentName: r.department_name,
            gross: Number(r.gross) || 0,
            days: Number(r.days) || 0,
            otHrs: Number(r.ot_hrs) || 0,
            grossAmt: Number(r.gross_amt) || 0,
            otAmt: Number(r.ot_amt) || 0
        }));
    }
}
exports.PayrollService = PayrollService;
//# sourceMappingURL=PayrollService.js.map