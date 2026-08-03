import { axiosInstance } from "../../../services/api/axiosInstance";

export interface MyEmployeeRecord {
  id: string;
  employeeCode: string;
  fullName: string;
  managerId: string | null;
}

export interface GoalRecord {
  id: string;
  employeeId: string;
  title: string;
  description: string | null;
  unit: string | null;
  targetValue: number | null;
  currentValue: number;
  weight: number;
  status: "active" | "completed" | "cancelled";
  startDate: string | null;
  targetDate: string | null;
  achievementPercentage: number | null;
}

export interface ReviewRecord {
  id: string;
  employeeId: string;
  managerId: string | null;
  status: "self_pending" | "manager_pending" | "completed";
  selfSummary: string | null;
  selfSubmittedAt: string | null;
  managerSummary: string | null;
  managerScore: number | null;
  managerSubmittedAt: string | null;
  goalScore: number | null;
  overallScore: number | null;
}

export const performanceApi = {
  async getMyEmployeeRecord(): Promise<MyEmployeeRecord | null> {
    const res = await axiosInstance.get("/employees/me");
    return res.data.data;
  },

  async listGoals(employeeId: string): Promise<GoalRecord[]> {
    const res = await axiosInstance.get(`/employees/${employeeId}/goals`);
    return res.data.data;
  },
  async createGoal(payload: {
    employeeId: string; title: string; description?: string; unit?: string;
    targetValue?: number; weight?: number; startDate?: string; targetDate?: string;
  }) {
    const res = await axiosInstance.post("/goals", payload);
    return res.data.data as GoalRecord;
  },
  async updateGoal(id: string, payload: Partial<{ title: string; status: string; weight: number; targetValue: number | null }>) {
    const res = await axiosInstance.patch(`/goals/${id}`, payload);
    return res.data.data as GoalRecord;
  },
  async removeGoal(id: string) {
    await axiosInstance.delete(`/goals/${id}`);
  },
  async logProgress(id: string, value: number, note?: string) {
    await axiosInstance.post(`/goals/${id}/progress`, { value, note });
  },

  async listMyReviews(): Promise<ReviewRecord[]> {
    const res = await axiosInstance.get("/reviews/mine");
    return res.data.data;
  },
  async listReviewsIManage(): Promise<ReviewRecord[]> {
    const res = await axiosInstance.get("/reviews/i-manage");
    return res.data.data;
  },
  async initiateReview(employeeId: string) {
    const res = await axiosInstance.post("/reviews", { employeeId });
    return res.data.data as ReviewRecord;
  },
  async submitSelfAssessment(reviewId: string, selfSummary: string) {
    const res = await axiosInstance.patch(`/reviews/${reviewId}/self`, { selfSummary });
    return res.data.data as ReviewRecord;
  },
  async submitManagerAssessment(reviewId: string, managerSummary: string, managerScore: number) {
    const res = await axiosInstance.patch(`/reviews/${reviewId}/manager`, { managerSummary, managerScore });
    return res.data.data as ReviewRecord;
  },
};
