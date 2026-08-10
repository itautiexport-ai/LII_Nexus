import { pool } from "../../../../infrastructure/database/mysql/connection";

export interface OfficeEmTaskDetail {
  id: string;
  name: string;
  priority: string;
  baseStatus: string;
  dueDate: string;
  completedAt: string | null;
}

export interface OfficeEmModuleScore {
  isActive: boolean;
  totalDuePoints: number;
  completedPoints: number;
  onTimePoints: number;
  completionPercent: number;
  onTimePercent: number;
  completionGap: number;
  timelinessGap: number;
  gapScore: number;
  standardWeight: number;
  normalizedWeight: number;
  tasks: OfficeEmTaskDetail[];
}

export interface OfficeEmReport {
  employeeId: string;
  employeeName: string;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  modules: {
    fms: OfficeEmModuleScore;
    checklist: OfficeEmModuleScore;
    delegation: OfficeEmModuleScore;
  };
  finalGapScore: number;
}

function getPriorityPoints(priority: string | null): number {
  if (!priority) return 2;
  const p = priority.toLowerCase();
  if (p === "low") return 1;
  if (p === "medium") return 2;
  if (p === "high") return 3;
  if (p === "extremely high" || p === "urgent" || p === "critical") return 4;
  return 2;
}

export class OfficeEmService {
  async generateGapScoreReport(userId: string, period: string = "monthly"): Promise<OfficeEmReport> {
    const [[user]] = await pool.query<any[]>("SELECT * FROM users WHERE id = ?", [userId]);
    if (!user) throw new Error("User not found");

    const [[emp]] = await pool.query<any[]>("SELECT id FROM employees WHERE user_id = ?", [userId]);
    const empId = emp ? emp.id : userId;
    const employeeName = user.full_name;

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (/^\d{4}-W\d{2}$/.test(period)) {
      const parts = period.split("-W");
      const year = parseInt(parts[0], 10);
      const week = parseInt(parts[1], 10);
      
      const d = new Date(year, 0, 4);
      const dayNum = d.getDay() || 7;
      d.setDate(d.getDate() - dayNum + 1); // Monday of week 1
      
      startDate = new Date(d);
      startDate.setDate(d.getDate() + (week - 1) * 7);
      
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else if (period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      endDate = new Date(now);
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now);
    } else { // monthly
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now);
    }

    const startStr = startDate.toISOString().split('T')[0] + " 00:00:00";
    const endStr = endDate.toISOString().split('T')[0] + " 23:59:59";

    const evaluateModule = (tasks: any[], standardWeight: number): OfficeEmModuleScore => {
      let totalDuePoints = 0;
      let completedPoints = 0;
      let onTimePoints = 0;

      tasks.forEach(t => {
        const points = getPriorityPoints(t.priority);
        const isCompleted = t.base_status === "completed" || t.base_status === "verified";
        const isRunning = t.base_status === "running" || t.base_status === "pending";
        
        let dueTime = new Date(t.due_date).getTime();
        
        if (isCompleted || dueTime <= endDate.getTime()) {
           totalDuePoints += points;
        }

        if (isCompleted) {
          completedPoints += points;
          let compTime = new Date(t.completed_at || t.due_date).getTime(); // fallback
          if (compTime <= dueTime) {
            onTimePoints += points;
          }
        }
      });

      const isActive = totalDuePoints > 0 || tasks.some(t => ["running", "pending"].includes(t.base_status));

      const completionPercent = totalDuePoints > 0 ? (completedPoints / totalDuePoints) * 100 : 100;
      const onTimePercent = completedPoints > 0 ? (onTimePoints / completedPoints) * 100 : 100;

      const completionGap = 100 - completionPercent;
      const timelinessGap = 100 - onTimePercent;

      const gapScore = -1 * ((completionGap * 0.6) + (timelinessGap * 0.4));

      const mappedTasks: OfficeEmTaskDetail[] = tasks.map(t => ({
        id: t.id,
        name: t.name || t.title || "Unnamed Task",
        priority: t.priority,
        baseStatus: t.base_status,
        dueDate: t.due_date,
        completedAt: t.completed_at || null
      }));

      return {
        isActive,
        totalDuePoints,
        completedPoints,
        onTimePoints,
        completionPercent,
        onTimePercent,
        completionGap,
        timelinessGap,
        gapScore,
        standardWeight,
        normalizedWeight: 0, // Will be set later
        tasks: mappedTasks
      };
    };

    // Fetch configurable weights
    const [weightRows] = await pool.query<any[]>("SELECT * FROM module_weights LIMIT 1");
    const weights = weightRows[0] || { fms_weight: 20, checklist_weight: 20, delegation_weight: 20 };
    const fmsWeightVal = parseFloat(weights.fms_weight ?? 20);
    const checklistWeightVal = parseFloat(weights.checklist_weight ?? 20);
    const delegationWeightVal = parseFloat(weights.delegation_weight ?? 20);

    // 1. Delegation
    const [delTasks] = await pool.query<any[]>(
      `SELECT id, title as name, priority, due_date, base_status, completed_at
       FROM delegated_tasks
       WHERE assigned_to = ? AND deleted_at IS NULL
         AND (
           (due_date >= ? AND due_date <= ?)
           OR base_status IN ('pending', 'running')
           OR (completed_at >= ? AND completed_at <= ?)
         )`,
      [empId, startStr, endStr, startStr, endStr]
    );
    const delegationScore = evaluateModule(delTasks, delegationWeightVal);

    // 2. Checklist (Standalone)
    const [chkRuns] = await pool.query<any[]>(
      `SELECT id, task_name as name, priority, created_at as due_date, 
              IF(deleted_at IS NOT NULL, 'completed', 'pending') as base_status, 
              deleted_at as completed_at
       FROM standalone_checklists
       WHERE assign_to = ?
         AND (
           (created_at >= ? AND created_at <= ?)
           OR (deleted_at IS NULL)
           OR (deleted_at >= ? AND deleted_at <= ?)
         )`,
      [empId, startStr, endStr, startStr, endStr]
    );
    const checklistScore = evaluateModule(chkRuns, checklistWeightVal);

    // 3. FMS
    const [fmsTasksRaw] = await pool.query<any[]>(
      `SELECT fis.id, fs.step_name as name, 'medium' as priority, fis.created_at as due_date, 
              IF(fis.status = 'In Progress', 'running', IF(fis.status = 'Pending', 'pending', 'completed')) as base_status, 
              fis.completed_at,
              fs.doer_employee_ids,
              fi.creator_id
       FROM fms_instance_steps fis
       JOIN fms_steps fs ON fis.fms_step_id = fs.id
       JOIN fms_instances fi ON fis.instance_id = fi.id
       WHERE (fis.created_at >= ? AND fis.created_at <= ?)
          OR fis.status IN ('Pending', 'In Progress')
          OR (fis.completed_at >= ? AND fis.completed_at <= ?)`,
      [startStr, endStr, startStr, endStr]
    );
    const fmsTasks = fmsTasksRaw.filter(t => {
      let doers: any[] = [];
      try {
        doers = typeof t.doer_employee_ids === 'string' ? JSON.parse(t.doer_employee_ids) : t.doer_employee_ids;
      } catch(e) {}
      if (!Array.isArray(doers)) doers = [];
      
      const isDoer = doers.includes(empId);
      const isCreator = t.creator_id === empId;
      if (doers.length === 0 && isCreator) return true;
      return isDoer;
    });
    const fmsScore = evaluateModule(fmsTasks, fmsWeightVal);

    // Normalize weights
    let totalActiveWeight = 0;
    if (fmsScore.isActive) totalActiveWeight += fmsScore.standardWeight;
    if (checklistScore.isActive) totalActiveWeight += checklistScore.standardWeight;
    if (delegationScore.isActive) totalActiveWeight += delegationScore.standardWeight;

    if (totalActiveWeight > 0) {
      if (fmsScore.isActive) fmsScore.normalizedWeight = (fmsScore.standardWeight / totalActiveWeight) * 100;
      if (checklistScore.isActive) checklistScore.normalizedWeight = (checklistScore.standardWeight / totalActiveWeight) * 100;
      if (delegationScore.isActive) delegationScore.normalizedWeight = (delegationScore.standardWeight / totalActiveWeight) * 100;
    }

    const finalGapScore = (fmsScore.gapScore * (fmsScore.normalizedWeight / 100)) +
                          (checklistScore.gapScore * (checklistScore.normalizedWeight / 100)) +
                          (delegationScore.gapScore * (delegationScore.normalizedWeight / 100));

    return {
      employeeId: userId,
      employeeName,
      periodType: period,
      periodStart: startDate.toISOString().split('T')[0],
      periodEnd: endDate.toISOString().split('T')[0],
      modules: {
        fms: fmsScore,
        checklist: checklistScore,
        delegation: delegationScore
      },
      finalGapScore
    };
  }

  async generateGapScoreList(period: string = "monthly"): Promise<OfficeEmReport[]> {
    const [users] = await pool.query<any[]>("SELECT id FROM users WHERE status = 'active' OR status = 'Active'");
    const reports: OfficeEmReport[] = [];
    
    for (const u of users) {
      try {
        const report = await this.generateGapScoreReport(u.id, period);
        // Only include if at least one module is active to avoid empty rows
        if (report.modules.fms.isActive || report.modules.checklist.isActive || report.modules.delegation.isActive) {
          reports.push(report);
        }
      } catch (err) {
        console.error(`Error generating report for user ${u.id}:`, err);
      }
    }
    
    // Sort by final gap score ascending (since it's negative, closer to 0 is better, meaning highest value first, wait, best score is 0, worst is -100.
    // So descending sort is better performance first)
    reports.sort((a, b) => b.finalGapScore - a.finalGapScore);
    return reports;
  }
}

export const officeEmService = new OfficeEmService();
