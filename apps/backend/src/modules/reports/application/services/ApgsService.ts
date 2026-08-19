import { pool } from "../../../../infrastructure/database/mysql/connection";
import crypto from "crypto";

export interface ManagerEvaluation {
  qualityOfWork: number;
  technicalCompetence: number;
  leadership: number;
  discipline: number;
  teamBehaviour: number;
  initiative: number;
  costSaving: number;
  problemSolving: number;
  totalScore: number;
}

export interface MisReport {
  employeeId: string;
  employeeName: string;
  modules: {
    fms: ModuleScore;
    checklist: ModuleScore;
    delegation: ModuleScore;
  };
  systemScore: number;
  hodScore: number | null;
  hrScore: number | null;
  attendancePercentage: number | null;
  managerEvaluationScore: number | null;
  finalScore: number;
  rating: string;
  incrementMultiplier: number;
  periodStart: string;
  periodEnd: string;
}

export interface ModuleScore {
  isActive: boolean;
  totalDuePoints: number;
  completedPoints: number;
  onTimePoints: number;
  completionPercent: number;
  onTimePercent: number;
  totalTasksCount: number;
  completedTasksCount: number;
  pendingTasksCount: number;
  runningTasksCount: number;
  tasksList: any[];
}

function getPriorityPoints(priority: string | null): number {
  if (!priority) return 2;
  const p = priority.toLowerCase();
  if (p === "low") return 1;
  if (p === "medium") return 2;
  if (p === "high") return 3;
  if (p === "extremely high" || p === "urgent" || p === "critical") return 4;
  return 2; // default
}

function getRatingAndMultiplier(score: number): { rating: string; multiplier: number } {
  if (score >= 9) return { rating: "Exceptional", multiplier: 1.25 };
  if (score >= 8) return { rating: "Excellent", multiplier: 1.10 };
  if (score >= 6) return { rating: "Good", multiplier: 1.00 };
  if (score >= 4) return { rating: "Average", multiplier: 0.70 };
  if (score >= 2) return { rating: "Weak", multiplier: 0.30 };
  return { rating: "Critical", multiplier: 0.00 };
}

export class MisService {
  async generateReport(userId: string, period: string = "monthly"): Promise<MisReport> {
    const [[user]] = await pool.query<any[]>("SELECT * FROM users WHERE id = ?", [userId]);
    if (!user) throw new Error("User not found");

    const [[emp]] = await pool.query<any[]>("SELECT id FROM employees WHERE user_id = ?", [userId]);
    const empId = emp ? emp.id : userId; // Use mapped employee ID or fallback

    const employeeName = user.full_name;

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (/^\d{4}-\d{2}_\d{4}-\d{2}$/.test(period)) {
      const parts = period.split("_");
      const startParts = parts[0].split("-");
      const endParts = parts[1].split("-");
      const startYear = parseInt(startParts[0], 10);
      const startMonth = parseInt(startParts[1], 10);
      const endYear = parseInt(endParts[0], 10);
      const endMonth = parseInt(endParts[1], 10);
      startDate = new Date(startYear, startMonth - 1, 1);
      endDate = new Date(endYear, endMonth, 0); // Last day of endMonth
    } else if (/^\d{4}-W\d{2}$/.test(period)) {
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
    } else if (/^\d{4}-\d{2}$/.test(period)) {
      const parts = period.split("-");
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0); // Last day of month
    } else if (/^\d{4}$/.test(period)) {
      const year = parseInt(period, 10);
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    } else if (period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay()); // Sunday
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

    // 1. Delegation Tasks
    const [delTasks] = await pool.query<any[]>(
      `SELECT id, title, due_date, base_status, priority, completed_at 
       FROM delegated_tasks 
       WHERE assigned_to = ? AND deleted_at IS NULL
         AND (
           (due_date >= ? AND due_date <= ?)
           OR (base_status IN ('pending', 'running'))
           OR (completed_at >= ? AND completed_at <= ?)
         )`,
      [empId, startStr, endStr, startStr, endStr]
    );

    let delTotalDue = 0;
    let delCompleted = 0;
    let delOnTime = 0;
    let delTotalTasksCount = 0;
    let delCompletedTasksCount = 0;
    let delPendingTasksCount = 0;
    let delRunningTasksCount = 0;
    const delTasksList: any[] = [];

    for (const t of delTasks) {
      const pts = getPriorityPoints(t.priority);
      delTotalDue += pts;
      delTotalTasksCount++;
      
      let statusStr = "Pending";
      const due = t.due_date ? new Date(t.due_date).getTime() : 0;
      
      if (t.base_status === "completed") {
        delCompleted += pts;
        delCompletedTasksCount++;
        const comp = t.completed_at ? new Date(t.completed_at).getTime() : Date.now();
        if (due === 0 || comp <= due) {
          delOnTime += pts;
          statusStr = "Completed On Time";
        } else {
          statusStr = "Completed Late";
        }
      } else if (t.base_status === "running") {
        delRunningTasksCount++;
        const isLate = due > 0 && Date.now() > due;
        statusStr = isLate ? "Running (Overdue)" : "Running";
      } else {
        delPendingTasksCount++;
        const isLate = due > 0 && Date.now() > due;
        statusStr = isLate ? "Pending (Overdue)" : "Pending";
      }

      delTasksList.push({
        id: t.id,
        title: t.title || "Delegated Task",
        dueDate: t.due_date,
        completedAt: t.completed_at,
        status: statusStr
      });
    }

    // 2. Checklist Tasks
    const [chkInstances] = await pool.query<any[]>(
      `SELECT id, name as title, priority, is_checked, checked_at, due_date as period_end FROM (
         SELECT id, task_name as name, priority, 0 as is_checked, NULL as checked_at, planned_date as due_date
         FROM standalone_checklists
         WHERE assign_to = ? AND deleted_at IS NULL
           AND planned_date <= ?
           
         UNION ALL
         
         SELECT l.id, sc.task_name as name, sc.priority, 1 as is_checked, l.completed_at as checked_at, l.planned_date as due_date
         FROM standalone_checklist_logs l
         JOIN standalone_checklists sc ON l.checklist_id = sc.id
         WHERE (sc.assign_to = ? OR l.completed_by = ?)
           AND (l.completed_at >= ? AND l.completed_at <= ?)
       ) as checklist_combined`,
      [empId, endStr, empId, empId, startStr, endStr]
    );

    let chkTotalDue = 0;
    let chkCompleted = 0;
    let chkOnTime = 0;
    let chkTotalTasksCount = 0;
    let chkCompletedTasksCount = 0;
    let chkPendingTasksCount = 0;
    let chkRunningTasksCount = 0;
    const chkTasksList: any[] = [];

    for (const ci of chkInstances) {
      const pts = getPriorityPoints(ci.priority);
      chkTotalDue += pts;
      chkTotalTasksCount++;
      
      let statusStr = "Pending";
      const due = ci.period_end ? new Date(ci.period_end).getTime() : 0;

      if (ci.is_checked) {
        chkCompleted += pts;
        chkCompletedTasksCount++;
        const comp = ci.checked_at ? new Date(ci.checked_at).getTime() : Date.now();
        if (due === 0 || comp <= due) {
          chkOnTime += pts;
          statusStr = "Completed On Time";
        } else {
          statusStr = "Completed Late";
        }
      } else {
        chkPendingTasksCount++;
        const isLate = due > 0 && Date.now() > due;
        statusStr = isLate ? "Pending (Overdue)" : "Pending";
      }

      chkTasksList.push({
        id: ci.id,
        title: ci.title || "Checklist",
        dueDate: ci.period_end,
        completedAt: ci.checked_at,
        status: statusStr
      });
    }

    // 3. FMS Steps (Flowchart Tasks)
    const [fmsRows] = await pool.query<any[]>(
      `SELECT fis.id, IF(fis.status = 'Completed', 'completed', IF(fis.status = 'In Progress', 'running', 'pending')) as base_status, 
              IF(fs.timeline_unit = 'days', DATE_ADD(fis.created_at, INTERVAL fs.timeline_hours DAY), DATE_ADD(fis.created_at, INTERVAL fs.timeline_hours HOUR)) as due_date,
              fis.completed_at, fs.step_name as title 
       FROM fms_instance_steps fis
       JOIN fms_instances fi ON fis.instance_id = fi.id
       JOIN fms_steps fs ON fis.fms_step_id = fs.id
       WHERE (
         (fs.doer_employee_ids IS NULL OR JSON_LENGTH(fs.doer_employee_ids) = 0) AND fi.creator_id = ?
         OR JSON_CONTAINS(fs.doer_employee_ids, JSON_QUOTE(?))
       )
         AND (
           (IF(fs.timeline_unit = 'days', DATE_ADD(fis.created_at, INTERVAL fs.timeline_hours DAY), DATE_ADD(fis.created_at, INTERVAL fs.timeline_hours HOUR)) >= ? AND IF(fs.timeline_unit = 'days', DATE_ADD(fis.created_at, INTERVAL fs.timeline_hours DAY), DATE_ADD(fis.created_at, INTERVAL fs.timeline_hours HOUR)) <= ?)
           OR fis.status IN ('Pending', 'In Progress')
           OR (fis.completed_at >= ? AND fis.completed_at <= ?)
         )`,
      [empId, empId, startStr, endStr, startStr, endStr]
    );

    let fmsTotalDue = 0;
    let fmsCompleted = 0;
    let fmsOnTime = 0;
    let fmsTotalTasksCount = 0;
    let fmsCompletedTasksCount = 0;
    let fmsPendingTasksCount = 0;
    let fmsRunningTasksCount = 0;
    const fmsTasksList: any[] = [];

    for (const task of fmsRows) {
      const priorityPts = 2; // Medium priority default for FMS
      fmsTotalDue += priorityPts;
      fmsTotalTasksCount++;
      
      let statusStr = "Pending";
      const due = task.due_date ? new Date(task.due_date).getTime() : 0;

      if (task.base_status === 'completed') {
        fmsCompleted += priorityPts;
        fmsCompletedTasksCount++;
        const comp = task.completed_at ? new Date(task.completed_at).getTime() : Date.now();
        if (due === 0 || comp <= due) {
          fmsOnTime += priorityPts;
          statusStr = "Completed On Time";
        } else {
          statusStr = "Completed Late";
        }
      } else if (task.base_status === 'running') {
        fmsRunningTasksCount++;
        const isLate = due > 0 && Date.now() > due;
        statusStr = isLate ? "Running (Overdue)" : "Running";
      } else {
        fmsPendingTasksCount++;
        const isLate = due > 0 && Date.now() > due;
        statusStr = isLate ? "Pending (Overdue)" : "Pending";
      }

      fmsTasksList.push({
        id: task.id,
        title: task.title || "FMS Task",
        dueDate: task.due_date,
        completedAt: task.completed_at,
        status: statusStr
      });
    }

    // Calculate per module
    const calculateModule = (
      totalDue: number, completed: number, onTime: number,
      totalCount: number, completedCount: number, pendingCount: number, runningCount: number, list: any[]
    ): ModuleScore => {
      const isActive = totalDue > 0;
      const compPct = totalDue > 0 ? (completed / totalDue) * 100 : 0;
      const onTimePct = completed > 0 ? (onTime / completed) * 100 : 0;

      return {
        isActive,
        totalDuePoints: totalDue,
        completedPoints: completed,
        onTimePoints: onTime,
        completionPercent: compPct,
        onTimePercent: onTimePct,
        totalTasksCount: totalCount,
        completedTasksCount: completedCount,
        pendingTasksCount: pendingCount,
        runningTasksCount: runningCount,
        tasksList: list
      };
    };

    const fmsMod = calculateModule(fmsTotalDue, fmsCompleted, fmsOnTime, fmsTotalTasksCount, fmsCompletedTasksCount, fmsPendingTasksCount, fmsRunningTasksCount, fmsTasksList);
    const chkMod = calculateModule(chkTotalDue, chkCompleted, chkOnTime, chkTotalTasksCount, chkCompletedTasksCount, chkPendingTasksCount, chkRunningTasksCount, chkTasksList);
    const delMod = calculateModule(delTotalDue, delCompleted, delOnTime, delTotalTasksCount, delCompletedTasksCount, delPendingTasksCount, delRunningTasksCount, delTasksList);

    // Fetch configurable weights
    const [weightRows] = await pool.query<any[]>("SELECT * FROM module_weights LIMIT 1");
    const weights = weightRows[0] || { 
      fms_weight: 20, 
      checklist_weight: 20, 
      delegation_weight: 20, 
      hod_weight: 20, 
      hr_weight: 20 
    };

    const fmsWeightVal = parseFloat(weights.fms_weight ?? 20);
    const checklistWeightVal = parseFloat(weights.checklist_weight ?? 20);
    const delegationWeightVal = parseFloat(weights.delegation_weight ?? 20);
    const hodWeightVal = parseFloat(weights.hod_weight ?? 20);
    const hrWeightVal = parseFloat(weights.hr_weight ?? 20);

    // 1. Calculate System Score (out of 5)
    let sysWeightedPct = 0;
    let sysWeightsSum = 0;
    if (fmsCompleted > 0) {
      sysWeightedPct += (fmsOnTime / fmsCompleted) * 100 * fmsWeightVal;
      sysWeightsSum += fmsWeightVal;
    }
    if (chkCompleted > 0) {
      sysWeightedPct += (chkOnTime / chkCompleted) * 100 * checklistWeightVal;
      sysWeightsSum += checklistWeightVal;
    }
    if (delCompleted > 0) {
      sysWeightedPct += (delOnTime / delCompleted) * 100 * delegationWeightVal;
      sysWeightsSum += delegationWeightVal;
    }
    const sysPct = sysWeightsSum > 0 ? (sysWeightedPct / sysWeightsSum) : 100;
    const systemScore = parseFloat((sysPct / 20).toFixed(2)); // scale 0-100 to 0-5

    // Fetch HOD and HR Evaluations
    // Since evaluations are submitted weekly (e.g. '2026-W28'), we generate the week string for endDate
    const d = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    const weekString = `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;

    const periodStartDb = startStr.split(' ')[0];
    const periodEndDb = endStr.split(' ')[0];

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
    let attendancePercentage: number | null = null;
    let managerEvaluationScore: number | null = null;

    if (hodRows.length > 0) {
      const sum = hodRows.reduce((acc, r) => acc + parseFloat(r.score), 0);
      hodScore = parseFloat((sum / hodRows.length).toFixed(2));
    }
    if (hrRows.length > 0) {
      const sumScore = hrRows.reduce((acc, r) => acc + parseFloat(r.score), 0);
      const sumAtt = hrRows.reduce((acc, r) => acc + parseFloat(r.attendance_percentage || 0), 0);
      hrScore = parseFloat((sumScore / hrRows.length).toFixed(2));
      attendancePercentage = parseFloat((sumAtt / hrRows.length).toFixed(2));
    }

    // 2. Calculate Manager Score (out of 5)
    let evalWeightedPct = 0;
    let evalWeightsSum = 0;
    if (hodScore !== null) {
      evalWeightedPct += (hodScore * 20) * hodWeightVal;
      evalWeightsSum += hodWeightVal;
    }
    if (hrScore !== null) {
      evalWeightedPct += (hrScore * 20) * hrWeightVal;
      evalWeightsSum += hrWeightVal;
    }
    // Note: Attendance card shows Attendance %, but it does not contribute separate weight to score (it is already inside HR overall score)
    const evalPct = evalWeightsSum > 0 ? (evalWeightedPct / evalWeightsSum) : 100;
    managerEvaluationScore = parseFloat((evalPct / 20).toFixed(2)); // scale 0-100 to 0-5

    // 3. Calculate Overall Final Score (out of 10) using all active weights (excluding attendance)
    let totalWeightedPct = 0;
    let activeWeightsSum = 0;

    // FMS
    if (fmsCompleted > 0) {
      totalWeightedPct += ((fmsOnTime / fmsCompleted) * 100) * fmsWeightVal;
      activeWeightsSum += fmsWeightVal;
    }
    // Checklist
    if (chkCompleted > 0) {
      totalWeightedPct += ((chkOnTime / chkCompleted) * 100) * checklistWeightVal;
      activeWeightsSum += checklistWeightVal;
    }
    // Delegation
    if (delCompleted > 0) {
      totalWeightedPct += ((delOnTime / delCompleted) * 100) * delegationWeightVal;
      activeWeightsSum += delegationWeightVal;
    }
    // HOD (Always include weight, treat pending as 0)
    activeWeightsSum += hodWeightVal;
    if (hodScore !== null) {
      totalWeightedPct += (hodScore * 20) * hodWeightVal;
    }
    // HR (Always include weight, treat pending as 0)
    activeWeightsSum += hrWeightVal;
    if (hrScore !== null) {
      totalWeightedPct += (hrScore * 20) * hrWeightVal;
    }

    const finalScorePct = activeWeightsSum > 0 ? (totalWeightedPct / activeWeightsSum) : 100;
    const finalScore = parseFloat((finalScorePct / 10).toFixed(2)); // scale 0-100 to 0-10

    const { rating, multiplier } = getRatingAndMultiplier(finalScore);

    return {
      employeeId: userId,
      employeeName,
      modules: {
        fms: fmsMod,
        checklist: chkMod,
        delegation: delMod
      },
      systemScore,
      hodScore,
      hrScore,
      attendancePercentage,
      managerEvaluationScore,
      finalScore: parseFloat(finalScore.toFixed(2)),
      rating,
      incrementMultiplier: multiplier,
      periodStart: periodStartDb,
      periodEnd: periodEndDb
    };
  }

  async saveManagerEvaluation(
    userId: string,
    evaluatedBy: string,
    periodType: string,
    periodStart: string,
    periodEnd: string,
    data: Omit<ManagerEvaluation, 'totalScore'>
  ): Promise<void> {
    const [[emp]] = await pool.query<any[]>("SELECT id FROM employees WHERE user_id = ?", [userId]);
    const empId = emp ? emp.id : userId;

    const id = crypto.randomUUID();
    
    await pool.query(
      `INSERT INTO manager_evaluations 
        (id, employee_id, period_type, period_start, period_end, 
         quality_of_work, technical_competence, leadership, discipline, team_behaviour, initiative, cost_saving, problem_solving, 
         evaluated_by, evaluated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
        quality_of_work = VALUES(quality_of_work),
        technical_competence = VALUES(technical_competence),
        leadership = VALUES(leadership),
        discipline = VALUES(discipline),
        team_behaviour = VALUES(team_behaviour),
        initiative = VALUES(initiative),
        cost_saving = VALUES(cost_saving),
        problem_solving = VALUES(problem_solving),
        evaluated_by = VALUES(evaluated_by),
        evaluated_at = NOW()`,
      [
        id, empId, periodType, periodStart, periodEnd, 
        data.qualityOfWork, data.technicalCompetence, data.leadership, data.discipline, 
        data.teamBehaviour, data.initiative, data.costSaving, data.problemSolving, 
        evaluatedBy
      ]
    );
  }

  async getCumulativeScores(period: string = "yearly"): Promise<MisReport[]> {
    const [employees] = await pool.query<any[]>("SELECT user_id FROM employees WHERE status = 'active'");
    
    const reports: MisReport[] = [];
    for (const emp of employees) {
      if (!emp.user_id) continue;
      try {
        const report = await this.generateReport(emp.user_id, period);
        reports.push(report);
      } catch (err) {
        console.error(`Error generating report for ${emp.user_id}:`, err);
      }
    }
    
    return reports.sort((a, b) => b.finalScore - a.finalScore);
  }
}
