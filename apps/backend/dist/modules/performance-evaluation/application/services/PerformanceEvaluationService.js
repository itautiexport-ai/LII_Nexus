"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceEvaluationService = exports.PerformanceEvaluationService = void 0;
const crypto_1 = require("crypto");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
class PerformanceEvaluationService {
    async createHodEvaluation(input) {
        const id = (0, crypto_1.randomUUID)();
        await connection_1.pool.query(`INSERT INTO hod_evaluations 
       (id, employee_id, evaluation_period, score, comments, quality_of_work, technical_competence, leadership, team_behaviour, initiative, cost_saving)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, input.employeeId, input.evaluationPeriod, input.score, input.comments, input.qualityOfWork, input.technicalCompetence, input.leadership, input.teamBehaviour, input.initiative, input.costSaving]);
        return { id, ...input };
    }
    async getHodEvaluations() {
        const [rows] = await connection_1.pool.query(`SELECT h.*, e.name as employee_name 
       FROM hod_evaluations h 
       JOIN employees e ON h.employee_id = e.id 
       ORDER BY h.created_at DESC`);
        return rows;
    }
    async createHrEvaluation(input) {
        const id = (0, crypto_1.randomUUID)();
        await connection_1.pool.query(`INSERT INTO hr_evaluations 
       (id, employee_id, evaluation_period, score, comments, attendance_punctuality, discipline, behaviour_attitude, communication, responsibility_accountability, work_ethics, team_contribution, attendance_percentage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, input.employeeId, input.evaluationPeriod, input.score, input.comments, input.attendancePunctuality, input.discipline, input.behaviourAttitude, input.communication, input.responsibilityAccountability, input.workEthics, input.teamContribution, input.attendancePercentage]);
        return { id, ...input };
    }
    async getHrEvaluations() {
        const [rows] = await connection_1.pool.query(`SELECT h.*, e.name as employee_name 
       FROM hr_evaluations h 
       JOIN employees e ON h.employee_id = e.id 
       ORDER BY h.created_at DESC`);
        return rows;
    }
}
exports.PerformanceEvaluationService = PerformanceEvaluationService;
exports.performanceEvaluationService = new PerformanceEvaluationService();
//# sourceMappingURL=PerformanceEvaluationService.js.map