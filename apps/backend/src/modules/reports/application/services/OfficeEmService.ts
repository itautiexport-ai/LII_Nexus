import { pool } from "../../../../infrastructure/database/mysql/connection";

export interface OfficeEmTaskDetail {
  id: string;
  name: string;
  priority: string;
  baseStatus: string;
  dueDate: string;
  completedAt: string | null;
  isNotApplicable?: boolean;
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
  isEvaluationPending: boolean;
  pendingMessage: string;
  hodScore: number | null;
  hrScore: number | null;
  hodWeight: number;
  hrWeight: number;
  modules: {
    fms: OfficeEmModuleScore;
    checklist: OfficeEmModuleScore;
    delegation: OfficeEmModuleScore;
  };
  finalGapScore: number | null;
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

// Helpers for preceding weeks calculation
function getPrecedingWeeks(weekString: string, count: number): string[] {
  const parts = weekString.split("-W");
  const year = parseInt(parts[0], 10);
  const week = parseInt(parts[1], 10);
  
  const result: string[] = [];
  let currentYear = year;
  let currentWeek = week;
  
  for (let i = 0; i < count; i++) {
    result.push(`${currentYear}-W${currentWeek.toString().padStart(2, "0")}`);
    currentWeek--;
    if (currentWeek <= 0) {
      currentYear--;
      currentWeek = getWeeksInYear(currentYear);
    }
  }
  return result;
}

function getWeeksInYear(year: number): number {
  const d = new Date(year, 11, 28);
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() - dayNum + 4);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
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
        
        let dueTime = new Date(t.due_date).getTime();
        
        if (isCompleted || dueTime <= endDate.getTime()) {
           totalDuePoints += points;
        }

        if (isCompleted) {
          completedPoints += points;
          let compTime = new Date(t.completed_at || t.due_date).getTime(); // fallback
          if (t.isNotApplicable) {
            onTimePoints += points;
          } else if (compTime <= dueTime) {
            onTimePoints += points;
          }
        }
      });

      const isActive = totalDuePoints > 0 || tasks.some(t => ["running", "pending"].includes(t.base_status));

      const completionPercent = totalDuePoints > 0 ? (completedPoints / totalDuePoints) * 100 : 0;
      const onTimePercent = completedPoints > 0 ? (onTimePoints / completedPoints) * 100 : 0;

      const completionGap = 100 - completionPercent;
      const timelinessGap = 100 - onTimePercent;

      const gapScore = -1 * ((completionGap * 0.6) + (timelinessGap * 0.4));

      const mappedTasks: OfficeEmTaskDetail[] = tasks.map(t => ({
        id: t.id,
        name: t.name || t.title || "Unnamed Task",
        priority: t.priority,
        baseStatus: t.base_status,
        dueDate: t.due_date,
        completedAt: t.completed_at || null,
        isNotApplicable: t.isNotApplicable
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
    const weights = weightRows[0] || { 
      fms_weight: 50, 
      checklist_weight: 20, 
      delegation_weight: 10,
      hod_weight: 10,
      hr_weight: 10
    };
    const fmsWeightVal = parseFloat(weights.fms_weight ?? 50);
    const checklistWeightVal = parseFloat(weights.checklist_weight ?? 20);
    const delegationWeightVal = parseFloat(weights.delegation_weight ?? 10);
    const hodWeightVal = parseFloat(weights.hod_weight ?? 10);
    const hrWeightVal = parseFloat(weights.hr_weight ?? 10);

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

    // 2. Checklist (Combine Legacy Checklists and Standalone Checklists)
    const [chkInstances] = await pool.query<any[]>(
      `SELECT cii.id, sc.task_name as name, sc.priority, ci.period_end as due_date, 
              IF(cii.is_checked=1, 'completed', 'pending') as base_status, 
              cii.checked_at as completed_at
       FROM checklist_instances ci
       JOIN standalone_checklists sc ON ci.template_id = sc.id
       JOIN checklist_instance_items cii ON ci.id = cii.instance_id
       WHERE ci.employee_id = ?
         AND (
           (ci.period_end >= ? AND ci.period_end <= ?)
           OR (cii.is_checked = 0 AND ci.period_end <= ?)
           OR (cii.checked_at >= ? AND cii.checked_at <= ?)
         )`,
      [empId, startStr, endStr, endStr, startStr, endStr]
    );

    const [standaloneCompletions] = await pool.query<any[]>(
      `SELECT c.id, sc.task_name as name, sc.priority, c.completed_at as due_date,
              'completed' as base_status, c.completed_at as completed_at
       FROM standalone_checklist_completions c
       JOIN standalone_checklists sc ON c.checklist_id = sc.id
       WHERE c.completed_by = ? AND c.completed_at >= ? AND c.completed_at <= ?`,
      [empId, startStr, endStr]
    );

    const [standalonePending] = await pool.query<any[]>(
      `SELECT sc.id, sc.task_name as name, sc.priority, sc.planned_date as due_date,
              'pending' as base_status, NULL as completed_at
       FROM standalone_checklists sc
       WHERE sc.assign_to = ? AND sc.deleted_at IS NULL AND sc.planned_date >= ? AND sc.planned_date <= ?`,
      [empId, startStr, endStr]
    );

    const allChecklistTasks = [
      ...chkInstances,
      ...standaloneCompletions,
      ...standalonePending
    ];
    const checklistScore = evaluateModule(allChecklistTasks, checklistWeightVal);

    // 3. FMS (Combine Flowchart Tasks and FMS Instance Steps)
    const [fmsTasks] = await pool.query<any[]>(
      `SELECT ft.id, ws.name, 'medium' as priority, ft.due_date, ft.base_status, ft.completed_at
       FROM flowchart_tasks ft
       JOIN workflow_stages ws ON ft.stage_id = ws.id
       WHERE ft.assigned_to = ?
         AND (
           (ft.due_date >= ? AND ft.due_date <= ?)
           OR ft.base_status IN ('pending', 'running')
           OR (ft.completed_at >= ? AND ft.completed_at <= ?)
         )`,
      [empId, startStr, endStr, startStr, endStr]
    );

    const [fmsInstanceSteps] = await pool.query<any[]>(
      `SELECT fis.id, fs.step_name as name, fis.status as base_status, 
              fis.completed_at, fis.created_at, fs.doer_employee_ids, fi.creator_id, fis.completed_by
       FROM fms_instance_steps fis
       JOIN fms_instances fi ON fis.instance_id = fi.id
       JOIN fms_steps fs ON fis.fms_step_id = fs.id
       WHERE (
         (fis.completed_by = ? AND fis.completed_at >= ? AND fis.completed_at <= ?)
         OR (fis.status IN ('Pending', 'In Progress'))
       )`,
      [empId, startStr, endStr]
    );

    const mappedFmsInstanceSteps = fmsInstanceSteps.filter(fis => {
      let doers: any[] = [];
      try {
        doers = typeof fis.doer_employee_ids === 'string' ? JSON.parse(fis.doer_employee_ids) : fis.doer_employee_ids;
      } catch (e) {}
      if (!Array.isArray(doers)) doers = [];

      const isDoer = doers.includes(empId);
      const isCreator = fis.creator_id === empId;
      const isCompletedBy = fis.completed_by === empId;

      if (isCompletedBy) return true;
      if (doers.length === 0 && isCreator) return true;
      return isDoer;
    }).map(fis => {
      let base_status = "pending";
      if (fis.base_status === "Completed" || fis.base_status === "Skipped") {
        base_status = "completed";
      } else if (fis.base_status === "In Progress") {
        base_status = "running";
      }
      
      const created = new Date(fis.created_at);
      const due = new Date(created.getTime() + 24 * 60 * 60 * 1000);
      
      return {
        id: fis.id,
        name: fis.name || "FMS Step",
        priority: "medium",
        due_date: due,
        base_status,
        completed_at: fis.completed_at,
        isNotApplicable: fis.base_status === "Skipped"
      };
    });

    const combinedFmsTasks = [
      ...fmsTasks,
      ...mappedFmsInstanceSteps
    ];
    const fmsScore = evaluateModule(combinedFmsTasks, fmsWeightVal);

    // 4. Fetch HOD and HR Evaluations
    const d = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    const weekString = `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;

    let hodRows: any[] = [];
    let hrRows: any[] = [];

    if (/^\d{4}-W\d{2}$/.test(period) || period === 'weekly') {
      const targetWeek = /^\d{4}-W\d{2}$/.test(period) ? period : weekString;
      [hodRows] = await pool.query<any[]>(
        `SELECT score FROM hod_evaluations WHERE employee_id = ? AND evaluation_period = ?`,
        [empId, targetWeek]
      );
      [hrRows] = await pool.query<any[]>(
        `SELECT score, attendance_percentage FROM hr_evaluations WHERE employee_id = ? AND evaluation_period = ?`,
        [empId, targetWeek]
      );
    } else {
      [hodRows] = await pool.query<any[]>(
        `SELECT score FROM hod_evaluations WHERE employee_id = ? AND created_at >= ? AND created_at <= ?`,
        [empId, startStr, endStr]
      );
      [hrRows] = await pool.query<any[]>(
        `SELECT score, attendance_percentage FROM hr_evaluations WHERE employee_id = ? AND created_at >= ? AND created_at <= ?`,
        [empId, startStr, endStr]
      );
    }

    let hodScore: number | null = null;
    let hrScore: number | null = null;

    if (hodRows.length > 0) {
      const sum = hodRows.reduce((acc, r) => acc + parseFloat(r.score), 0);
      hodScore = parseFloat((sum / hodRows.length).toFixed(2));
    }
    if (hrRows.length > 0) {
      const sumScore = hrRows.reduce((acc, r) => acc + parseFloat(r.score), 0);
      hrScore = parseFloat((sumScore / hrRows.length).toFixed(2));
    }

    // Check HOD/HR pending evaluations
    let isEvaluationPending = false;
    let pendingMessage = "";

    if (hodScore === null && hrScore === null) {
      isEvaluationPending = true;
      pendingMessage = "Both HOD and HR evaluations are pending. First get HOD and HR evaluations done to get the score.";
    } else if (hodScore === null) {
      isEvaluationPending = true;
      pendingMessage = "HOD evaluation is pending. First get HOD evaluation done to get the score.";
    } else if (hrScore === null) {
      isEvaluationPending = true;
      pendingMessage = "HR evaluation is pending. First get HR evaluation done to get the score.";
    }

    // Weight Redistribution calculation rules
    const fmsActive = fmsScore.totalDuePoints > 0;
    const checklistActive = checklistScore.totalDuePoints > 0;
    const delegationActive = delegationScore.totalDuePoints > 0;

    let fmsRedistributedWeight = 0;
    let checklistRedistributedWeight = 0;
    let delegationRedistributedWeight = 0;
    let hodRedistributedWeight = hodWeightVal;
    let hrRedistributedWeight = hrWeightVal;

    const N_active_tasks = (fmsActive ? 1 : 0) + (checklistActive ? 1 : 0) + (delegationActive ? 1 : 0);
    const W_inactive = (!fmsActive ? fmsWeightVal : 0) + (!checklistActive ? checklistWeightVal : 0) + (!delegationActive ? delegationWeightVal : 0);

    if (N_active_tasks > 0) {
      fmsRedistributedWeight = fmsActive ? fmsWeightVal + (W_inactive / N_active_tasks) : 0;
      checklistRedistributedWeight = checklistActive ? checklistWeightVal + (W_inactive / N_active_tasks) : 0;
      delegationRedistributedWeight = delegationActive ? delegationWeightVal + (W_inactive / N_active_tasks) : 0;
    } else {
      // If no tasks are active in any of the three components, split task weights equally between HOD and HR
      const taskWeightsSum = fmsWeightVal + checklistWeightVal + delegationWeightVal;
      hodRedistributedWeight = hodWeightVal + (taskWeightsSum / 2);
      hrRedistributedWeight = hrWeightVal + (taskWeightsSum / 2);
    }

    console.log("[DEBUG generateGapScoreReport]", {
      fmsActive,
      checklistActive,
      delegationActive,
      N_active_tasks,
      W_inactive,
      fmsRedistributedWeight,
      checklistRedistributedWeight,
      delegationRedistributedWeight
    });

    fmsScore.normalizedWeight = fmsRedistributedWeight;
    checklistScore.normalizedWeight = checklistRedistributedWeight;
    delegationScore.normalizedWeight = delegationRedistributedWeight;

    let finalGapScore: number | null = null;

    if (!isEvaluationPending && hodScore !== null && hrScore !== null) {
      const hodGapScore = -100 * (1 - hodScore / 5);
      const hrGapScore = -100 * (1 - hrScore / 5);

      finalGapScore = (fmsScore.gapScore * (fmsRedistributedWeight / 100)) +
                      (checklistScore.gapScore * (checklistRedistributedWeight / 100)) +
                      (delegationScore.gapScore * (delegationRedistributedWeight / 100)) +
                      (hodGapScore * (hodRedistributedWeight / 100)) +
                      (hrGapScore * (hrRedistributedWeight / 100));

      // Calculate total late tasks across active modules
      const countLateTasks = (moduleScore: OfficeEmModuleScore): number => {
        let count = 0;
        moduleScore.tasks.forEach(t => {
          if (t.baseStatus === "completed" || t.baseStatus === "verified") {
            if (t.isNotApplicable) return;
            const compTime = new Date(t.completedAt || t.dueDate).getTime();
            const dueTime = new Date(t.dueDate).getTime();
            if (compTime > dueTime) {
              count++;
            }
          }
        });
        return count;
      };

      const totalLateTasks = countLateTasks(fmsScore) + countLateTasks(checklistScore) + countLateTasks(delegationScore);
      
      // Deduct 20 points per late completed task, clamping at -100
      finalGapScore = Math.max(-100, finalGapScore - (totalLateTasks * 20));
      
      finalGapScore = parseFloat(finalGapScore.toFixed(1));
    }

    return {
      employeeId: userId,
      employeeName,
      periodType: period,
      periodStart: startDate.toISOString().split('T')[0],
      periodEnd: endDate.toISOString().split('T')[0],
      isEvaluationPending,
      pendingMessage,
      hodScore,
      hrScore,
      hodWeight: hodRedistributedWeight,
      hrWeight: hrRedistributedWeight,
      modules: {
        fms: fmsScore,
        checklist: checklistScore,
        delegation: delegationScore
      },
      finalGapScore
    };
  }

  async generateGapScoreHistory(userId: string, targetPeriod: string): Promise<any[]> {
    let weekString = targetPeriod;
    if (!/^\d{4}-W\d{2}$/.test(weekString)) {
      // Calculate current week string
      const d = new Date();
      const dayNum = d.getDay() || 7;
      d.setDate(d.getDate() + 4 - dayNum);
      const yearStart = new Date(d.getFullYear(), 0, 1);
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      weekString = `${d.getFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
    }

    const weeks = getPrecedingWeeks(weekString, 6);
    const historyList: any[] = [];

    for (const w of weeks) {
      try {
        const report = await this.generateGapScoreReport(userId, w);
        historyList.push(report);
      } catch (err) {
        console.error(`Error generating history for week ${w}:`, err);
      }
    }

    return historyList;
  }

  async generateGapScoreList(period: string = "monthly"): Promise<OfficeEmReport[]> {
    const [users] = await pool.query<any[]>("SELECT id FROM users WHERE status = 'active' OR status = 'Active'");
    const reports: OfficeEmReport[] = [];
    
    for (const u of users) {
      try {
        const report = await this.generateGapScoreReport(u.id, period);
        if (report.modules.fms.isActive || report.modules.checklist.isActive || report.modules.delegation.isActive) {
          reports.push(report);
        }
      } catch (err) {
        console.error(`Error generating report for user ${u.id}:`, err);
      }
    }
    
    reports.sort((a, b) => (b.finalGapScore ?? -100) - (a.finalGapScore ?? -100));
    return reports;
  }
}

export const officeEmService = new OfficeEmService();
