import { randomUUID } from "crypto";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { CreateEvaluationDto } from "../dto/evaluation.dto";

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
      `SELECT h.*, e.name as employee_name 
       FROM hod_evaluations h 
       JOIN employees e ON h.employee_id = e.id 
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
      `SELECT h.*, e.name as employee_name 
       FROM hr_evaluations h 
       JOIN employees e ON h.employee_id = e.id 
       ORDER BY h.created_at DESC`
    );
    return rows;
  }
}

export const performanceEvaluationService = new PerformanceEvaluationService();
