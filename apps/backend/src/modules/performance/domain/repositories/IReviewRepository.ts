import { Review, ReviewGoalScore } from "../entities/Review";

export interface CreateReviewData {
  id: string;
  employeeId: string;
  managerId: string | null;
  initiatedBy: string;
}

export interface IReviewRepository {
  listForEmployee(employeeId: string): Promise<Review[]>;
  listForManager(managerId: string): Promise<Review[]>;
  findById(id: string): Promise<Review | null>;
  create(data: CreateReviewData): Promise<Review>;

  submitSelfAssessment(id: string, selfSummary: string): Promise<Review>;
  submitManagerAssessment(
    id: string,
    data: { managerSummary: string; managerScore: number; goalScore: number | null; overallScore: number | null }
  ): Promise<Review>;

  saveGoalScores(reviewId: string, scores: Omit<ReviewGoalScore, "id" | "reviewId">[]): Promise<void>;
  getGoalScores(reviewId: string): Promise<ReviewGoalScore[]>;
}
