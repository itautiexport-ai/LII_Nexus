"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlReviewRepository = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
function mapReview(row) {
    return {
        id: row.id,
        employeeId: row.employee_id,
        managerId: row.manager_id,
        status: row.status,
        selfSummary: row.self_summary,
        selfSubmittedAt: row.self_submitted_at,
        managerSummary: row.manager_summary,
        managerScore: row.manager_score === null ? null : Number(row.manager_score),
        managerSubmittedAt: row.manager_submitted_at,
        goalScore: row.goal_score === null ? null : Number(row.goal_score),
        overallScore: row.overall_score === null ? null : Number(row.overall_score),
        initiatedBy: row.initiated_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
    };
}
function mapGoalScore(row) {
    return {
        id: row.id,
        reviewId: row.review_id,
        goalId: row.goal_id,
        goalTitleSnapshot: row.goal_title_snapshot,
        weight: Number(row.weight),
        targetValue: row.target_value === null ? null : Number(row.target_value),
        achievedValue: row.achieved_value === null ? null : Number(row.achieved_value),
        achievementPercentage: row.achievement_percentage === null ? null : Number(row.achievement_percentage),
    };
}
class MySqlReviewRepository {
    async listForEmployee(employeeId) {
        const [rows] = await connection_1.pool.query("SELECT * FROM performance_reviews WHERE employee_id = ? AND deleted_at IS NULL ORDER BY created_at DESC", [employeeId]);
        return rows.map(mapReview);
    }
    async listForManager(managerId) {
        const [rows] = await connection_1.pool.query("SELECT * FROM performance_reviews WHERE manager_id = ? AND deleted_at IS NULL ORDER BY created_at DESC", [managerId]);
        return rows.map(mapReview);
    }
    async findById(id) {
        const [rows] = await connection_1.pool.query("SELECT * FROM performance_reviews WHERE id = ? AND deleted_at IS NULL", [id]);
        return rows[0] ? mapReview(rows[0]) : null;
    }
    async create(data) {
        const id = data.id || (0, uuid_1.v4)();
        await connection_1.pool.query(`INSERT INTO performance_reviews (id, employee_id, manager_id, status, initiated_by)
       VALUES (?, ?, ?, 'self_pending', ?)`, [id, data.employeeId, data.managerId, data.initiatedBy]);
        return (await this.findById(id));
    }
    async submitSelfAssessment(id, selfSummary) {
        await connection_1.pool.query(`UPDATE performance_reviews SET self_summary = ?, self_submitted_at = NOW(), status = 'manager_pending' WHERE id = ?`, [selfSummary, id]);
        return (await this.findById(id));
    }
    async submitManagerAssessment(id, data) {
        await connection_1.pool.query(`UPDATE performance_reviews
       SET manager_summary = ?, manager_score = ?, manager_submitted_at = NOW(),
           goal_score = ?, overall_score = ?, status = 'completed'
       WHERE id = ?`, [data.managerSummary, data.managerScore, data.goalScore, data.overallScore, id]);
        return (await this.findById(id));
    }
    async saveGoalScores(reviewId, scores) {
        for (const score of scores) {
            await connection_1.pool.query(`INSERT INTO performance_review_goal_scores
           (id, review_id, goal_id, goal_title_snapshot, weight, target_value, achieved_value, achievement_percentage)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                (0, uuid_1.v4)(), reviewId, score.goalId, score.goalTitleSnapshot, score.weight,
                score.targetValue, score.achievedValue, score.achievementPercentage,
            ]);
        }
    }
    async getGoalScores(reviewId) {
        const [rows] = await connection_1.pool.query("SELECT * FROM performance_review_goal_scores WHERE review_id = ?", [reviewId]);
        return rows.map(mapGoalScore);
    }
}
exports.MySqlReviewRepository = MySqlReviewRepository;
//# sourceMappingURL=MySqlReviewRepository.js.map