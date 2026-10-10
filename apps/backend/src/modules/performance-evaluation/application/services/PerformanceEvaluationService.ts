import { randomUUID } from "crypto";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { CreateEvaluationDto } from "../dto/evaluation.dto";

import { EvaluationDispatchService } from "./EvaluationDispatchService";

export class PerformanceEvaluationService {
  async createHodEvaluation(input: CreateEvaluationDto) {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO hod_evaluations 
       (id, employee_id, evaluation_period, score, comments, quality_of_work, technical_competence, leadership, team_behaviour, initiative, cost_saving)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.employeeId, input.evaluationPeriod, input.score, input.comments, input.qualityOfWork, input.technicalCompetence, input.leadership, input.teamBehaviour, input.initiative, input.costSaving]
    );
    return { id, ...input };
  }

  async getHodEvaluations() {
    const [rows] = await pool.query(
      `SELECT h.*, e.full_name as employee_name, e.employee_code, d.name as department_name, g.title as designation_title 
       FROM hod_evaluations h 
       LEFT JOIN employees e ON h.employee_id = e.id 
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN designations g ON e.designation_id = g.id
       ORDER BY h.created_at DESC`
    );
    return rows;
  }

  async createHrEvaluation(input: CreateEvaluationDto) {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO hr_evaluations 
       (id, employee_id, evaluation_period, score, comments, attendance_punctuality, discipline, behaviour_attitude, communication, responsibility_accountability, work_ethics, team_contribution, attendance_percentage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.employeeId, input.evaluationPeriod, input.score, input.comments, input.attendancePunctuality, input.discipline, input.behaviourAttitude, input.communication, input.responsibilityAccountability, input.workEthics, input.teamContribution, input.attendancePercentage]
    );
    return { id, ...input };
  }

  async getHrEvaluations() {
    const [rows] = await pool.query(
      `SELECT h.*, e.full_name as employee_name 
       FROM hr_evaluations h 
       JOIN employees e ON h.employee_id = e.id 
       ORDER BY h.created_at DESC`
    );
    return rows;
  }

  async getEvaluationList(actorUserId: string) {
    const { officeEmService } = await import("../../../reports/application/services/OfficeEmService");

    // 1. Fetch actor's roles & details
    const [userRows] = await pool.query<any[]>(
      `SELECT u.id, u.full_name, u.email
       FROM users u
       WHERE u.id = ? AND u.deleted_at IS NULL`,
      [actorUserId]
    );
    const actorUser = userRows[0];

    const [roleRows] = await pool.query<any[]>(
      `SELECT r.name 
       FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = ?`,
      [actorUserId]
    );
    const roleNames = roleRows.map((r: any) => r.name);

    const [empActorRows] = await pool.query<any[]>(
      `SELECT e.*, d.title as designation_title
       FROM employees e
       LEFT JOIN designations d ON e.designation_id = d.id
       WHERE (e.user_id = ? OR e.id = ?) AND e.deleted_at IS NULL
       LIMIT 1`,
      [actorUserId, actorUserId]
    );
    const actorEmp = empActorRows[0];
    const actorDesignation = (actorEmp?.designation_title || "").toLowerCase();

    const isHrOrAdmin = roleNames.some((r: string) => 
      ["admin", "system admin", "hr admin", "hr", "hr manager", "management", "management executive", "ceo", "coo"].includes(r.toLowerCase())
    ) || ["admin", "system admin", "management", "management executive", "hr", "hr admin", "ceo"].includes(actorDesignation);

    // 2. Determine HOD filter if not HR/Admin
    let hodFilterId: string | null = null;
    let hodFilterName: string | null = null;

    if (!isHrOrAdmin) {
      const [hodMasterRows] = await pool.query<any[]>(
        `SELECT id, name FROM master_hods 
         WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
            OR id = ?`,
        [actorUser?.full_name || "", actorEmp?.manager_id || ""]
      );
      if (hodMasterRows && hodMasterRows.length > 0) {
        hodFilterId = hodMasterRows[0].id;
        hodFilterName = hodMasterRows[0].name;
      } else {
        const [hodByName] = await pool.query<any[]>(
          `SELECT id, name FROM master_hods WHERE LOWER(TRIM(name)) LIKE ? LIMIT 1`,
          [`%${(actorUser?.full_name || "").toLowerCase()}%`]
        );
        if (hodByName && hodByName[0]) {
          hodFilterId = hodByName[0].id;
          hodFilterName = hodByName[0].name;
        }
      }
    }

    // 3. Query employees
    let empQuery = `
      SELECT e.id, e.employee_code, e.full_name, e.department_id, e.designation_id, e.manager_id, e.user_id,
             d.name as department_name, desig.title as designation_title,
             mh.name as hod_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations desig ON e.designation_id = desig.id
      LEFT JOIN master_hods mh ON e.manager_id = mh.id
      WHERE e.deleted_at IS NULL AND e.status = 'active'
    `;
    const queryParams: any[] = [];

    if (!isHrOrAdmin) {
      if (hodFilterId) {
        empQuery += ` AND (e.manager_id = ? OR LOWER(TRIM(mh.name)) = LOWER(TRIM(?)))`;
        queryParams.push(hodFilterId, hodFilterName || "");
      } else if (actorEmp?.department_id) {
        empQuery += ` AND e.department_id = ? AND (e.user_id IS NULL OR e.user_id != ?)`;
        queryParams.push(actorEmp.department_id, actorUserId);
      } else {
        return [];
      }
    }

    empQuery += ` ORDER BY e.full_name ASC`;
    const [employees] = await pool.query<any[]>(empQuery, queryParams);

    // 4. Build evaluation status & live ERM score for each employee
    const result: any[] = [];
    for (const emp of employees) {
      const [hodEvals] = await pool.query<any[]>(
        `SELECT id, evaluation_period, score, comments, created_at
         FROM hod_evaluations
         WHERE employee_id = ?
         ORDER BY created_at DESC LIMIT 1`,
        [emp.id]
      );

      const [hrEvals] = await pool.query<any[]>(
        `SELECT id, evaluation_period, score, comments, created_at
         FROM hr_evaluations
         WHERE employee_id = ?
         ORDER BY created_at DESC LIMIT 1`,
        [emp.id]
      );

      let ermScore = 0;
      let ermGapScore = 0;
      try {
        const report = await officeEmService.generateGapScoreReport(emp.user_id || emp.id, "monthly");
        ermGapScore = report.finalGapScore !== null ? Number(report.finalGapScore.toFixed(2)) : 0;
        ermScore = report.finalGapScore !== null ? Number(Math.max(0, 100 + report.finalGapScore).toFixed(2)) : 0;
      } catch {
        ermScore = 0;
        ermGapScore = 0;
      }

      const hodEval = hodEvals[0] || null;
      const hrEval = hrEvals[0] || null;

      result.push({
        employeeId: emp.id,
        employeeCode: emp.employee_code,
        fullName: emp.full_name,
        departmentName: emp.department_name || "N/A",
        designationTitle: emp.designation_title || "N/A",
        hodId: emp.manager_id || null,
        hodName: emp.hod_name || "N/A",
        hodEvaluation: hodEval ? {
          id: hodEval.id,
          score: Number(hodEval.score),
          period: hodEval.evaluation_period,
          comments: hodEval.comments,
          createdAt: hodEval.created_at,
        } : null,
        hrEvaluation: hrEval ? {
          id: hrEval.id,
          score: Number(hrEval.score),
          period: hrEval.evaluation_period,
          comments: hrEval.comments,
          createdAt: hrEval.created_at,
        } : null,
        ermScore,
        ermGapScore,
        isPendingHod: !hodEval,
        isPendingHr: !hrEval,
      });
    }

    result.sort((a, b) => b.ermScore - a.ermScore);
    result.forEach((item, index) => {
      item.rank = index + 1;
    });

    return result;
  }

  async dispatchEvaluation(employeeId: string) {
    return EvaluationDispatchService.dispatchEvaluationForNewEmployee(employeeId);
  }
}

export const performanceEvaluationService = new PerformanceEvaluationService();
