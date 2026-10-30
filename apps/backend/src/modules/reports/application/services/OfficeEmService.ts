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
  averageTaskGapScore?: number | null;
  finalGapScore: number | null;
  adjustedGapScore6040?: number | null;
  taskGapScore6040?: number | null;
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

async function ensureDeletedPeriodsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS deleted_office_em_periods (
      id VARCHAR(36) PRIMARY KEY,
      employee_id VARCHAR(36) NOT NULL,
      period VARCHAR(50) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_emp_period (employee_id, period)
    )
  `);
}

export class OfficeEmService {
  async generateGapScoreReport(userId: string, period: string = "monthly"): Promise<OfficeEmReport> {

    const [[user]] = await pool.query<any[]>("SELECT * FROM users WHERE id = ?", [userId]);
    if (!user) throw new Error("User not found");

    const [[emp]] = await pool.query<any[]>("SELECT id, user_id FROM employees WHERE (user_id = ? OR id = ?)", [userId, userId]);
    const empId = emp ? emp.id : userId;
    const linkedUserId = emp ? emp.user_id : userId;
    const myIds = Array.from(new Set([userId, empId, linkedUserId].filter(Boolean)));
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

      const deduplicatedTasks = new Map<string, any>();
      tasks.forEach(t => {
        if (!t || !t.id) return;
        if (!deduplicatedTasks.has(t.id)) {
          deduplicatedTasks.set(t.id, t);
        }
      });
      const uniqueTasks = Array.from(deduplicatedTasks.values());

      uniqueTasks.forEach(t => {
        const points = getPriorityPoints(t.priority);
        const isCompleted = Boolean(
          t.base_status === "completed" || 
          t.base_status === "verified" || 
          t.base_status === "Skipped" ||
          t.completed_at !== null
        );

        if (isCompleted) {
          t.base_status = "completed";
          completedPoints += points;
          totalDuePoints += points;

          const dueTime = new Date(t.due_date).getTime();
          const compTime = t.completed_at ? new Date(t.completed_at).getTime() : dueTime;

          if (t.isNotApplicable) {
            onTimePoints += points;
          } else if (compTime <= dueTime) {
            onTimePoints += points;
          }
        } else {
          t.base_status = (t.base_status === "running" || t.base_status === "Under Process") ? "running" : "pending";
          const dueTime = new Date(t.due_date).getTime();
          if (dueTime <= endDate.getTime()) {
            totalDuePoints += points;
          }
        }
      });

      // A module is active ONLY if it has tasks allotted (due points > 0)
      const isActive = totalDuePoints > 0;

      // When no tasks are allotted:
      // The module is N/A - not poor performance! Gaps are 0, gapScore is 0.
      let completionPercent = 0;
      let onTimePercent = 0;
      let completionGap = 0;
      let timelinessGap = 0;
      let gapScore = 0;

      if (isActive) {
        completionPercent = (completedPoints / totalDuePoints) * 100;
        onTimePercent = completedPoints > 0 ? (onTimePoints / completedPoints) * 100 : 0;
        completionGap = 100 - completionPercent;
        timelinessGap = 100 - onTimePercent;
        gapScore = -1 * ((completionGap * 0.6) + (timelinessGap * 0.4));
      }

      const mappedTasks: OfficeEmTaskDetail[] = uniqueTasks.map(t => ({
        id: t.id,
        name: t.name || t.title || "Unnamed Task",
        priority: t.priority,
        baseStatus: t.base_status,
        dueDate: t.due_date,
        completedAt: t.completed_at || null,
        isNotApplicable: !!t.isNotApplicable
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
       WHERE assigned_to IN (?) AND deleted_at IS NULL
         AND (
           (due_date >= ? AND due_date <= ?)
           OR (completed_at >= ? AND completed_at <= ?)
           OR (base_status IN ('pending', 'running') AND due_date <= ?)
         )`,
      [myIds, startStr, endStr, startStr, endStr, endStr]
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
       WHERE ci.employee_id IN (?)
         AND sc.deleted_at IS NULL
         AND (
           (ci.period_end >= ? AND ci.period_end <= ?)
           OR (cii.is_checked = 0)
           OR (cii.checked_at >= ? AND cii.checked_at <= ?)
         )`,
      [myIds, startStr, endStr, startStr, endStr]
    );

    const [standaloneCompletions] = await pool.query<any[]>(
      `SELECT c.id, sc.task_name as name, sc.priority, c.completed_at as due_date,
              'completed' as base_status, c.completed_at as completed_at
       FROM standalone_checklist_completions c
       JOIN standalone_checklists sc ON c.checklist_id = sc.id
       WHERE (c.completed_by IN (?) OR sc.assign_to IN (?))
         AND sc.deleted_at IS NULL
         AND c.completed_at >= ? AND c.completed_at <= ?`,
      [myIds, myIds, startStr, endStr]
    );

    const [standalonePending] = await pool.query<any[]>(
      `SELECT sc.id, sc.task_name as name, sc.priority, sc.planned_date as due_date,
              'pending' as base_status, NULL as completed_at
       FROM standalone_checklists sc
       WHERE sc.assign_to IN (?) 
         AND sc.deleted_at IS NULL 
         AND sc.planned_date >= ? AND sc.planned_date <= ?
         AND sc.id NOT IN (
           SELECT checklist_id FROM standalone_checklist_completions WHERE completed_by IN (?)
         )`,
      [myIds, startStr, endStr, myIds]
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
       WHERE ft.assigned_to IN (?)
         AND (
           (ft.due_date >= ? AND ft.due_date <= ?)
           OR ft.base_status IN ('pending', 'running')
           OR (ft.completed_at >= ? AND ft.completed_at <= ?)
         )`,
      [myIds, startStr, endStr, startStr, endStr]
    );

    const [fmsInstanceSteps] = await pool.query<any[]>(
      `SELECT fis.id, fs.step_name as name, fis.status as base_status, 
              fis.completed_at, fis.created_at, fs.doer_employee_ids, fi.creator_id, fis.completed_by,
              fs.timeline_hours, fs.timeline_unit
       FROM fms_instance_steps fis
       JOIN fms_instances fi ON fis.instance_id = fi.id
       JOIN fms_steps fs ON fis.fms_step_id = fs.id
       WHERE (
         ((fis.completed_by IN (?) OR fis.status IN ('Completed', 'Skipped')) AND fis.completed_at >= ? AND fis.completed_at <= ?)
         OR (fi.status = 'In Progress' AND fis.status = 'Under Process')
       )`,
      [myIds, startStr, endStr]
    );

    const mappedFmsInstanceSteps = fmsInstanceSteps.filter(fis => {
      let doers: any[] = [];
      try {
        doers = typeof fis.doer_employee_ids === 'string' ? JSON.parse(fis.doer_employee_ids) : fis.doer_employee_ids;
      } catch (_e) {
        /* ignore JSON parse error */
      }
      if (!Array.isArray(doers)) doers = [];

      const isDoer = myIds.some(id => doers.includes(id));
      const isCreator = myIds.includes(fis.creator_id);
      const isCompletedBy = myIds.includes(fis.completed_by);

      if (isCompletedBy) return true;
      if (doers.length === 0 && isCreator) return true;
      return isDoer;
    }).map(fis => {
      let base_status = "pending";
      if (fis.base_status === "Completed" || fis.base_status === "Skipped" || fis.completed_at !== null) {
        base_status = "completed";
      } else if (fis.base_status === "Under Process") {
        base_status = "running";
      }
      
      const created = new Date(fis.created_at);
      const timelineHours = parseFloat(fis.timeline_hours || 24);
      const due = fis.timeline_unit === "days"
        ? new Date(created.getTime() + timelineHours * 24 * 60 * 60 * 1000)
        : new Date(created.getTime() + timelineHours * 60 * 60 * 1000);
      
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

    // -------------------------------------------------------------
    // Weight Normalization & Gap Scoring
    // Rule: If no tasks are allotted in a module, that module is N/A
    // and must be excluded. Remaining active module weights are
    // proportionally normalized across all active components.
    // -------------------------------------------------------------
    const hasCompletedEvaluations = !isEvaluationPending && hodScore !== null && hrScore !== null;
    const hodGapScore = hodScore !== null ? -100 * (1 - hodScore / 5) : 0;
    const hrGapScore = hrScore !== null ? -100 * (1 - hrScore / 5) : 0;

    // 1. Average Task Gap Score (across active task modules only)
    const activeTaskModules = [fmsScore, checklistScore, delegationScore].filter(m => m.isActive);
    let averageTaskGapScore: number = 0.0;
    if (activeTaskModules.length > 0) {
      const sumGaps = activeTaskModules.reduce((acc, m) => acc + m.gapScore, 0);
      averageTaskGapScore = parseFloat((sumGaps / activeTaskModules.length).toFixed(1));
    }

    // 2. Total Active Base Weight across all active components
    let totalActiveBaseWeight = 0;
    if (fmsScore.isActive) totalActiveBaseWeight += fmsWeightVal;
    if (checklistScore.isActive) totalActiveBaseWeight += checklistWeightVal;
    if (delegationScore.isActive) totalActiveBaseWeight += delegationWeightVal;

    if (hasCompletedEvaluations) {
      totalActiveBaseWeight += hodWeightVal + hrWeightVal;
    }

    // 3. Proportionally normalize weights
    let fmsNormalizedWeight = 0;
    let checklistNormalizedWeight = 0;
    let delegationNormalizedWeight = 0;
    let hodNormalizedWeight = 0;
    let hrNormalizedWeight = 0;

    if (totalActiveBaseWeight > 0) {
      if (fmsScore.isActive) {
        fmsNormalizedWeight = parseFloat(((fmsWeightVal / totalActiveBaseWeight) * 100).toFixed(1));
      }
      if (checklistScore.isActive) {
        checklistNormalizedWeight = parseFloat(((checklistWeightVal / totalActiveBaseWeight) * 100).toFixed(1));
      }
      if (delegationScore.isActive) {
        delegationNormalizedWeight = parseFloat(((delegationWeightVal / totalActiveBaseWeight) * 100).toFixed(1));
      }
      if (hasCompletedEvaluations) {
        hodNormalizedWeight = parseFloat(((hodWeightVal / totalActiveBaseWeight) * 100).toFixed(1));
        hrNormalizedWeight = parseFloat(((hrWeightVal / totalActiveBaseWeight) * 100).toFixed(1));
      }
    } else {
      hodNormalizedWeight = hodWeightVal;
      hrNormalizedWeight = hrWeightVal;
    }

    fmsScore.normalizedWeight = fmsNormalizedWeight;
    checklistScore.normalizedWeight = checklistNormalizedWeight;
    delegationScore.normalizedWeight = delegationNormalizedWeight;

    // 4. Final Gap Score calculation
    let finalGapScore: number | null = null;

    if (hasCompletedEvaluations && totalActiveBaseWeight > 0) {
      let weightedGapSum = 0;
      if (fmsScore.isActive) {
        weightedGapSum += fmsScore.gapScore * (fmsWeightVal / totalActiveBaseWeight);
      }
      if (checklistScore.isActive) {
        weightedGapSum += checklistScore.gapScore * (checklistWeightVal / totalActiveBaseWeight);
      }
      if (delegationScore.isActive) {
        weightedGapSum += delegationScore.gapScore * (delegationWeightVal / totalActiveBaseWeight);
      }
      weightedGapSum += hodGapScore * (hodWeightVal / totalActiveBaseWeight);
      weightedGapSum += hrGapScore * (hrWeightVal / totalActiveBaseWeight);

      weightedGapSum = Math.max(-100, Math.min(0, weightedGapSum));
      finalGapScore = parseFloat(weightedGapSum.toFixed(1));
    }

    // ==========================================
    // 60:40 Additional Calculation (Same-Week Completion Rule)
    // If all tasks are completed in the same week, the completion penalty is 0,
    // and penalty is strictly capped to the timeliness portion (max 40% of module weight).
    // ==========================================
    const calcModule6040 = (mod: OfficeEmModuleScore): number => {
      if (!mod.isActive || mod.totalDuePoints === 0) return 0;
      if (mod.completionPercent >= 100) {
        return -1 * (mod.timelinessGap * 0.4);
      }
      return mod.gapScore;
    };

    // Task gap score 60:40 across active task modules
    let taskGapScore6040: number | null = null;
    const totalActiveTaskBaseWeight = (fmsScore.isActive ? fmsWeightVal : 0) +
                                      (checklistScore.isActive ? checklistWeightVal : 0) +
                                      (delegationScore.isActive ? delegationWeightVal : 0);

    if (totalActiveTaskBaseWeight > 0) {
      let taskSum6040 = 0;
      if (fmsScore.isActive) {
        taskSum6040 += calcModule6040(fmsScore) * (fmsWeightVal / totalActiveTaskBaseWeight);
      }
      if (checklistScore.isActive) {
        taskSum6040 += calcModule6040(checklistScore) * (checklistWeightVal / totalActiveTaskBaseWeight);
      }
      if (delegationScore.isActive) {
        taskSum6040 += calcModule6040(delegationScore) * (delegationWeightVal / totalActiveTaskBaseWeight);
      }
      taskGapScore6040 = parseFloat(taskSum6040.toFixed(1));
    }

    // Overall adjusted gap score 60:40 across all active components (including HOD & HR)
    let adjustedGapScore6040: number | null = null;
    if (hasCompletedEvaluations && totalActiveBaseWeight > 0) {
      let adjustedSum = 0;
      if (fmsScore.isActive) {
        adjustedSum += calcModule6040(fmsScore) * (fmsWeightVal / totalActiveBaseWeight);
      }
      if (checklistScore.isActive) {
        adjustedSum += calcModule6040(checklistScore) * (checklistWeightVal / totalActiveBaseWeight);
      }
      if (delegationScore.isActive) {
        adjustedSum += calcModule6040(delegationScore) * (delegationWeightVal / totalActiveBaseWeight);
      }
      adjustedSum += hodGapScore * (hodWeightVal / totalActiveBaseWeight);
      adjustedSum += hrGapScore * (hrWeightVal / totalActiveBaseWeight);

      adjustedSum = Math.max(-100, Math.min(0, adjustedSum));
      adjustedGapScore6040 = parseFloat(adjustedSum.toFixed(1));
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
      hodWeight: hodNormalizedWeight,
      hrWeight: hrNormalizedWeight,
      modules: {
        fms: fmsScore,
        checklist: checklistScore,
        delegation: delegationScore
      },
      averageTaskGapScore,
      finalGapScore,
      adjustedGapScore6040,
      taskGapScore6040
    };
  }

  async generateGapScoreHistory(userId: string, targetPeriod: string): Promise<any[]> {
    await ensureDeletedPeriodsTable();
    const [[emp]] = await pool.query<any[]>("SELECT id, user_id FROM employees WHERE (user_id = ? OR id = ?)", [userId, userId]);
    const empId = emp ? emp.id : userId;
    const linkedUserId = emp ? emp.user_id : userId;
    const targetIds = Array.from(new Set([userId, empId, linkedUserId].filter(Boolean)));

    const [deletedRows] = await pool.query<any[]>(
      "SELECT period FROM deleted_office_em_periods WHERE employee_id IN (?)",
      [targetIds]
    );
    const deletedPeriods = new Set(deletedRows.map(r => r.period));

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
      if (deletedPeriods.has(w)) {
        continue; // Exclude deleted period completely from history list
      }
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

  async deleteGapScoreEvaluation(employeeId: string, period: string): Promise<void> {
    await ensureDeletedPeriodsTable();
    const [[emp]] = await pool.query<any[]>("SELECT id, user_id FROM employees WHERE (user_id = ? OR id = ?)", [employeeId, employeeId]);
    const empId = emp ? emp.id : employeeId;
    const linkedUserId = emp ? emp.user_id : employeeId;
    const targetIds = Array.from(new Set([employeeId, empId, linkedUserId].filter(Boolean)));

    // Delete HOD and HR evaluations for this employee and period
    await pool.query("DELETE FROM hod_evaluations WHERE employee_id IN (?) AND (evaluation_period = ? OR evaluation_period LIKE ?)", [targetIds, period, `%${period}%`]);
    await pool.query("DELETE FROM hr_evaluations WHERE employee_id IN (?) AND (evaluation_period = ? OR evaluation_period LIKE ?)", [targetIds, period, `%${period}%`]);

    // Record period as deleted for all targetIds so it is completely removed from the history list
    for (const tId of targetIds) {
      await pool.query(
        "INSERT INTO deleted_office_em_periods (id, employee_id, period) VALUES (UUID(), ?, ?) ON DUPLICATE KEY UPDATE created_at = NOW()",
        [tId, period]
      );
    }
  }
}

export const officeEmService = new OfficeEmService();

