import { pool } from "../../../../infrastructure/database/mysql/connection";

export class TaskCenterService {
  async getDashboardStats(userId: string, isSystemAdmin: boolean) {
    try {
      // Find employeeId since user UUID doesn't directly map to FMS assignment if assigned via employee UUID
      const [empRows] = await pool.query<any[]>("SELECT id FROM employees WHERE user_id = ? AND deleted_at IS NULL", [userId]);
      const employeeId = empRows[0]?.id || userId; // fallback to userId if no employee mapping

      // 1. Checklist Stats (standalone_checklists has no completion status natively? We use completed=0 as mock for now, or just return total)
      // Actually, StandaloneChecklist doesn't have a status column. Let's return total tasks vs completed tasks (0).
      let chkQuery = `SELECT COUNT(*) as total FROM standalone_checklists WHERE deleted_at IS NULL`;
      let chkParams: any[] = [];
      if (!isSystemAdmin) {
        chkQuery += ` AND assign_to = ?`;
        chkParams.push(userId);
      }
      const [chkRows] = await pool.query<any[]>(chkQuery, chkParams);
      const checklistTotal = chkRows[0].total as number;
      const checklistPending = checklistTotal; // Since there is no status, everything is pending
      const checklistCompleted = 0;

      // 2. Delegation Stats
      let delPendingQuery = `SELECT COUNT(*) as total FROM delegated_tasks WHERE base_status IN ('pending', 'running') AND deleted_at IS NULL`;
      let delCompletedQuery = `SELECT COUNT(*) as total FROM delegated_tasks WHERE base_status = 'completed' AND deleted_at IS NULL`;
      let delParams: any[] = [];
      if (!isSystemAdmin) {
        delPendingQuery += ` AND assigned_to = ?`;
        delCompletedQuery += ` AND assigned_to = ?`;
        delParams.push(employeeId);
      }

      const [delPendingRows] = await pool.query<any[]>(delPendingQuery, delParams);
      const [delCompletedRows] = await pool.query<any[]>(delCompletedQuery, delParams);
      
      const delegationPending = delPendingRows[0].total as number;
      const delegationCompleted = delCompletedRows[0].total as number;

      // 3. FMS Stats
      // Pending
      let fmsPendingQuery = `
        SELECT fis.id, fs.doer_employee_ids, fi.creator_id
        FROM fms_instance_steps fis
        JOIN fms_instances fi ON fis.instance_id = fi.id
        JOIN fms_steps fs ON fis.fms_step_id = fs.id
        WHERE fi.status = 'In Progress' 
          AND fis.status IN ('Pending', 'Under Process')
      `;
      const [fmsPendingData] = await pool.query<any[]>(fmsPendingQuery);
      let fmsPending = 0;
      
      if (isSystemAdmin) {
        fmsPending = fmsPendingData.length;
      } else {
        fmsPendingData.forEach(row => {
          let doers: any[] = [];
          try { doers = typeof row.doer_employee_ids === 'string' ? JSON.parse(row.doer_employee_ids) : row.doer_employee_ids; } catch (e) {}
          if ((!doers || doers.length === 0) && row.creator_id === employeeId) {
            fmsPending++;
          } else if (Array.isArray(doers) && doers.includes(employeeId)) {
            fmsPending++;
          }
        });
      }

      // Completed
      let fmsCompletedQuery = `
        SELECT fis.id, fs.doer_employee_ids, fi.creator_id
        FROM fms_instance_steps fis
        JOIN fms_instances fi ON fis.instance_id = fi.id
        JOIN fms_steps fs ON fis.fms_step_id = fs.id
        WHERE fis.status = 'Completed'
      `;
      const [fmsCompletedData] = await pool.query<any[]>(fmsCompletedQuery);
      let fmsCompleted = 0;

      if (isSystemAdmin) {
        fmsCompleted = fmsCompletedData.length;
      } else {
        fmsCompletedData.forEach(row => {
          let doers: any[] = [];
          try { doers = typeof row.doer_employee_ids === 'string' ? JSON.parse(row.doer_employee_ids) : row.doer_employee_ids; } catch (e) {}
          if ((!doers || doers.length === 0) && row.creator_id === employeeId) {
            fmsCompleted++;
          } else if (Array.isArray(doers) && doers.includes(employeeId)) {
            fmsCompleted++;
          }
        });
      }

      return {
        checklist: { pending: checklistPending, completed: checklistCompleted },
        delegation: { pending: delegationPending, completed: delegationCompleted },
        fms: { pending: fmsPending, completed: fmsCompleted }
      };
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      throw error;
    }
  }
}
