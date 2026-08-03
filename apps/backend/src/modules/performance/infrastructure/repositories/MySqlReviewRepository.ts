import { v4 as uuid } from "uuid";
import { pool } from "../../../../infrastructure/database/mysql/connection";
import { Review, ReviewGoalScore } from "../../domain/entities/Review";
import { CreateReviewData, IReviewRepository } from "../../domain/repositories/IReviewRepository";

function mapReview(row: any): Review {
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

function mapGoalScore(row: any): ReviewGoalScore {
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

export class MySqlReviewRepository implements IReviewRepository {
  async listForEmployee(employeeId: string): Promise<Review[]> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM performance_reviews WHERE employee_id = ? AND deleted_at IS NULL ORDER BY created_at DESC",
      [employeeId]
    );
    return rows.map(mapReview);
  }

  async listForManager(managerId: string): Promise<Review[]> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM performance_reviews WHERE manager_id = ? AND deleted_at IS NULL ORDER BY created_at DESC",
      [managerId]
    );
    return rows.map(mapReview);
  }

  async findById(id: string): Promise<Review | null> {
    const [rows] = await pool.query<any[]>("SELECT * FROM performance_reviews WHERE id = ? AND deleted_at IS NULL", [id]);
    return rows[0] ? mapReview(rows[0]) : null;
  }

  async create(data: CreateReviewData): Promise<Review> {
    const id = data.id || uuid();
    await pool.query(
      `INSERT INTO performance_reviews (id, employee_id, manager_id, status, initiated_by)
       VALUES (?, ?, ?, 'self_pending', ?)`,
      [id, data.employeeId, data.managerId, data.initiatedBy]
    );
    return (await this.findById(id))!;
  }

  async submitSelfAssessment(id: string, selfSummary: string): Promise<Review> {
    await pool.query(
      `UPDATE performance_reviews SET self_summary = ?, self_submitted_at = NOW(), status = 'manager_pending' WHERE id = ?`,
      [selfSummary, id]
    );
    return (await this.findById(id))!;
  }

  async submitManagerAssessment(
    id: string,
    data: { managerSummary: string; managerScore: number; goalScore: number | null; overallScore: number | null }
  ): Promise<Review> {
    await pool.query(
      `UPDATE performance_reviews
       SET manager_summary = ?, manager_score = ?, manager_submitted_at = NOW(),
           goal_score = ?, overall_score = ?, status = 'completed'
       WHERE id = ?`,
      [data.managerSummary, data.managerScore, data.goalScore, data.overallScore, id]
    );
    return (await this.findById(id))!;
  }

  async saveGoalScores(reviewId: string, scores: Omit<ReviewGoalScore, "id" | "reviewId">[]): Promise<void> {
    for (const score of scores) {
      await pool.query(
        `INSERT INTO performance_review_goal_scores
           (id, review_id, goal_id, goal_title_snapshot, weight, target_value, achieved_value, achievement_percentage)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuid(), reviewId, score.goalId, score.goalTitleSnapshot, score.weight,
          score.targetValue, score.achievedValue, score.achievementPercentage,
        ]
      );
    }
  }

  async getGoalScores(reviewId: string): Promise<ReviewGoalScore[]> {
    const [rows] = await pool.query<any[]>("SELECT * FROM performance_review_goal_scores WHERE review_id = ?", [reviewId]);
    return rows.map(mapGoalScore);
  }
}
