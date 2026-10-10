import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { MySqlNotificationRepository } from "../../../notifications/infrastructure/repositories/MySqlNotificationRepository";
import { NotificationService } from "../../../notifications/application/services/NotificationService";

export class EvaluationDispatchService {
  private static notificationService = new NotificationService(new MySqlNotificationRepository());

  /**
   * Triggers automatic HOD and HR evaluation dispatch whenever a new user / employee is added.
   * Universally creates in-app notifications and task items for both HOD and HR.
   */
  public static async dispatchEvaluationForNewEmployee(employeeId: string): Promise<{ hodCount: number; hrCount: number }> {
    let hodCount = 0;
    let hrCount = 0;

    try {
      // 1. Fetch employee details
      const [empRows] = await pool.query<any[]>(
        `SELECT e.id, e.employee_code, e.full_name, e.department_id, e.manager_id, e.user_id,
                d.name as department_name
         FROM employees e
         LEFT JOIN departments d ON e.department_id = d.id
         WHERE e.id = ? AND e.deleted_at IS NULL`,
        [employeeId]
      );

      if (!empRows || empRows.length === 0) {
        return { hodCount: 0, hrCount: 0 };
      }
      const employee = empRows[0];

      // 2. Find HOD User(s)
      const hodUserIds = new Set<string>();

      // a) Check manager_id if assigned
      if (employee.manager_id) {
        const [mgrRows] = await pool.query<any[]>(
          `SELECT user_id FROM employees WHERE id = ? AND deleted_at IS NULL AND user_id IS NOT NULL`,
          [employee.manager_id]
        );
        if (mgrRows[0]?.user_id && mgrRows[0].user_id !== employee.user_id) {
          hodUserIds.add(mgrRows[0].user_id);
        }
      }

      // b) Check department HOD(s)
      if (employee.department_id) {
        const [deptHodRows] = await pool.query<any[]>(
          `SELECT DISTINCT e.user_id
           FROM employees e
           JOIN user_roles ur ON e.user_id = ur.user_id
           JOIN roles r ON ur.role_id = r.id
           WHERE e.department_id = ? 
             AND r.name IN ('HOD', 'Head of Department', 'Manager', 'Supervisor')
             AND e.deleted_at IS NULL AND e.user_id IS NOT NULL`,
          [employee.department_id]
        );
        for (const row of deptHodRows) {
          if (row.user_id && row.user_id !== employee.user_id) {
            hodUserIds.add(row.user_id);
          }
        }
      }

      // c) Fallback: any user with HOD role
      if (hodUserIds.size === 0) {
        const [globalHodRows] = await pool.query<any[]>(
          `SELECT DISTINCT ur.user_id
           FROM user_roles ur
           JOIN roles r ON ur.role_id = r.id
           WHERE r.name IN ('HOD', 'Head of Department')`
        );
        for (const row of globalHodRows) {
          if (row.user_id && row.user_id !== employee.user_id) {
            hodUserIds.add(row.user_id);
          }
        }
      }

      // 3. Find HR User(s)
      const hrUserIds = new Set<string>();
      const [hrRows] = await pool.query<any[]>(
        `SELECT DISTINCT ur.user_id
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         WHERE r.name IN ('HR Admin', 'HR', 'HR Manager', 'System Admin')`
      );
      for (const row of hrRows) {
        if (row.user_id && row.user_id !== employee.user_id) {
          hrUserIds.add(row.user_id);
        }
      }

      // If no HR by role, fallback to active users with identity/employee creation or system permissions
      if (hrUserIds.size === 0) {
        const [adminRows] = await pool.query<any[]>(
          `SELECT id FROM users WHERE status = 'active' AND deleted_at IS NULL LIMIT 5`
        );
        for (const row of adminRows) {
          if (row.id !== employee.user_id) {
            hrUserIds.add(row.id);
          }
        }
      }

      // 4. Send Notifications to HOD user(s)
      for (const hodUserId of hodUserIds) {
        await this.notificationService.notify({
          type: "new_task_assigned",
          module: "office",
          referenceType: "employee_evaluation",
          referenceId: employee.id,
          assignedUserId: hodUserId,
          title: `New Employee Evaluation Required (HOD)`,
          description: `New employee ${employee.full_name} (${employee.employee_code}) has been added. Please perform their HOD Performance Evaluation.`,
          priority: "high",
          actionLabel: "Perform HOD Evaluation",
          actionUrl: `/admin/performance-evaluation/hod?employeeId=${employee.id}`,
        });
        hodCount++;
      }

      // 5. Send Notifications to HR user(s)
      for (const hrUserId of hrUserIds) {
        await this.notificationService.notify({
          type: "new_task_assigned",
          module: "office",
          referenceType: "employee_evaluation",
          referenceId: employee.id,
          assignedUserId: hrUserId,
          title: `New Employee Evaluation Required (HR)`,
          description: `New employee ${employee.full_name} (${employee.employee_code}) has been added. Please perform their HR Performance Evaluation.`,
          priority: "high",
          actionLabel: "Perform HR Evaluation",
          actionUrl: `/admin/performance-evaluation/hr?employeeId=${employee.id}`,
        });
        hrCount++;
      }

      // 6. Also create/ensure a performance review record if none exists
      const [existingRev] = await pool.query<any[]>(
        `SELECT id FROM performance_reviews WHERE employee_id = ? AND deleted_at IS NULL`,
        [employee.id]
      );
      if (!existingRev || existingRev.length === 0) {
        const reviewId = uuid();
        const firstHodUser = Array.from(hodUserIds)[0] || null;
        let managerEmpId = employee.manager_id || null;
        if (!managerEmpId && firstHodUser) {
          const [mEmp] = await pool.query<any[]>(`SELECT id FROM employees WHERE user_id = ? AND deleted_at IS NULL`, [firstHodUser]);
          if (mEmp[0]) managerEmpId = mEmp[0].id;
        }

        await pool.query(
          `INSERT INTO performance_reviews (id, employee_id, manager_id, status, initiated_by)
           VALUES (?, ?, ?, 'manager_pending', ?)`,
          [reviewId, employee.id, managerEmpId, employee.user_id || employee.id]
        );
      }
    } catch (error) {
      console.error("[EvaluationDispatchService] Error dispatching evaluation:", error);
    }

    return { hodCount, hrCount };
  }
}
