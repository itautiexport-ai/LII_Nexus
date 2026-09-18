import { pool } from "../../../../infrastructure/database/mysql/connection";

export class TaskCenterService {
  async getDashboardStats(userId: string, isSystemAdmin: boolean = false) {
    try {
      if (isSystemAdmin) {
        // 1. System-wide Checklist Stats
        const [chkActiveRows] = await pool.query<any[]>(
          `SELECT COUNT(*) as total
           FROM standalone_checklists sc
           WHERE sc.deleted_at IS NULL
             AND sc.planned_date <= NOW()
             AND sc.id NOT IN (
               SELECT DISTINCT checklist_id
               FROM standalone_checklist_completions
             )`
        );
        const checklistPending = Number(chkActiveRows[0]?.total || 0);

        const [chkCompRows] = await pool.query<any[]>(
          `SELECT COUNT(*) as total
           FROM standalone_checklist_completions c
           JOIN standalone_checklists sc ON sc.id = c.checklist_id
           WHERE sc.deleted_at IS NULL`
        );
        const checklistCompleted = Number(chkCompRows[0]?.total || 0);

        // 2. System-wide Delegation Stats
        const [delPendingRows] = await pool.query<any[]>(
          `SELECT COUNT(*) as total
           FROM delegated_tasks
           WHERE base_status IN ('pending', 'running')
             AND deleted_at IS NULL`
        );
        const [delCompletedRows] = await pool.query<any[]>(
          `SELECT COUNT(*) as total
           FROM delegated_tasks
           WHERE base_status = 'completed'
             AND deleted_at IS NULL`
        );
        const delegationPending = Number(delPendingRows[0]?.total || 0);
        const delegationCompleted = Number(delCompletedRows[0]?.total || 0);

        // 3. System-wide FMS Stats
        const [fmsPendingRows] = await pool.query<any[]>(
          `SELECT COUNT(*) as total
           FROM fms_instance_steps fis
           JOIN fms_instances fi ON fis.instance_id = fi.id
           WHERE fi.status = 'In Progress'
             AND fis.status IN ('Pending', 'In Progress')`
        );
        const [fmsCompletedRows] = await pool.query<any[]>(
          `SELECT COUNT(*) as total
           FROM fms_instance_steps fis
           JOIN fms_instances fi ON fis.instance_id = fi.id
           WHERE fis.status IN ('Completed', 'Skipped')`
        );
        const fmsPending = Number(fmsPendingRows[0]?.total || 0);
        const fmsCompleted = Number(fmsCompletedRows[0]?.total || 0);

        return {
          checklist: { pending: checklistPending, completed: checklistCompleted },
          delegation: { pending: delegationPending, completed: delegationCompleted },
          fms: { pending: fmsPending, completed: fmsCompleted },
        };
      }

      // Resolve both employee UUID and user UUID to handle cross-referencing for non-admin users
      const [empRows] = await pool.query<any[]>(
        "SELECT id, user_id FROM employees WHERE (user_id = ? OR id = ?) AND deleted_at IS NULL",
        [userId, userId]
      );
      const employeeId = empRows[0]?.id || userId;
      const linkedUserId = empRows[0]?.user_id || userId;
      const myIds = Array.from(new Set([userId, employeeId, linkedUserId].filter(Boolean)));

      // 1. Checklist Stats
      // Pending: standalone checklists assigned to user, planned date <= NOW(), and not yet completed
      const [chkActiveRows] = await pool.query<any[]>(
        `SELECT COUNT(*) as total
         FROM standalone_checklists sc
         WHERE sc.deleted_at IS NULL
           AND sc.planned_date <= NOW()
           AND sc.assign_to IN (?)
           AND sc.id NOT IN (
             SELECT DISTINCT checklist_id
             FROM standalone_checklist_completions
             WHERE completed_by IN (?)
           )`,
        [myIds, myIds]
      );
      const checklistPending = Number(chkActiveRows[0]?.total || 0);

      // Completed: completions recorded by the user for active checklists
      const [chkCompRows] = await pool.query<any[]>(
        `SELECT COUNT(*) as total
         FROM standalone_checklist_completions c
         JOIN standalone_checklists sc ON sc.id = c.checklist_id
         WHERE c.completed_by IN (?) AND sc.deleted_at IS NULL`,
        [myIds]
      );
      const checklistCompleted = Number(chkCompRows[0]?.total || 0);

      // 2. Delegation Stats
      const [delPendingRows] = await pool.query<any[]>(
        `SELECT COUNT(*) as total
         FROM delegated_tasks
         WHERE assigned_to IN (?)
           AND base_status IN ('pending', 'running')
           AND deleted_at IS NULL`,
        [myIds]
      );
      const [delCompletedRows] = await pool.query<any[]>(
        `SELECT COUNT(*) as total
         FROM delegated_tasks
         WHERE assigned_to IN (?)
           AND base_status = 'completed'
           AND deleted_at IS NULL`,
        [myIds]
      );

      const delegationPending = Number(delPendingRows[0]?.total || 0);
      const delegationCompleted = Number(delCompletedRows[0]?.total || 0);

      // 3. FMS Stats
      // Pending: only active 'In Progress' steps due for action, excluding future unstarted 'Pending' steps
      const fmsPendingQuery = `
        SELECT fis.id, fs.doer_employee_ids, fi.creator_id
        FROM fms_instance_steps fis
        JOIN fms_instances fi ON fis.instance_id = fi.id
        JOIN fms_steps fs ON fis.fms_step_id = fs.id
        WHERE fi.status = 'In Progress'
          AND fis.status IN ('Pending', 'In Progress')
      `;
      const [fmsPendingData] = await pool.query<any[]>(fmsPendingQuery);
      let fmsPending = 0;

      fmsPendingData.forEach((row) => {
        let doers: any[] = [];
        try {
          doers = typeof row.doer_employee_ids === "string" ? JSON.parse(row.doer_employee_ids) : row.doer_employee_ids;
        } catch (_e) {
          /* ignore */
        }
        if (!Array.isArray(doers)) doers = [];
        const isDoer = myIds.some((id) => doers.includes(id));
        const isCreator = myIds.includes(row.creator_id);
        if ((doers.length === 0 && isCreator) || isDoer) {
          fmsPending++;
        }
      });

      // Completed: steps marked Completed or Skipped by/for user
      const fmsCompletedQuery = `
        SELECT fis.id, fs.doer_employee_ids, fi.creator_id, fis.completed_by
        FROM fms_instance_steps fis
        JOIN fms_instances fi ON fis.instance_id = fi.id
        JOIN fms_steps fs ON fis.fms_step_id = fs.id
        WHERE fis.status IN ('Completed', 'Skipped')
      `;
      const [fmsCompletedData] = await pool.query<any[]>(fmsCompletedQuery);
      let fmsCompleted = 0;

      fmsCompletedData.forEach((row) => {
        let doers: any[] = [];
        try {
          doers = typeof row.doer_employee_ids === "string" ? JSON.parse(row.doer_employee_ids) : row.doer_employee_ids;
        } catch (_e) {
          /* ignore */
        }
        if (!Array.isArray(doers)) doers = [];
        const isDoer = myIds.some((id) => doers.includes(id));
        const isCreator = myIds.includes(row.creator_id);
        const isCompletedBy = myIds.includes(row.completed_by);
        if (isCompletedBy || (doers.length === 0 && isCreator) || isDoer) {
          fmsCompleted++;
        }
      });

      return {
        checklist: { pending: checklistPending, completed: checklistCompleted },
        delegation: { pending: delegationPending, completed: delegationCompleted },
        fms: { pending: fmsPending, completed: fmsCompleted },
      };
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      throw error;
    }
  }
}
