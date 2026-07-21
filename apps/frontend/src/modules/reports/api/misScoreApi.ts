import { axiosInstance } from "../../../services/api/axiosInstance";

export interface ModuleScore {
  isActive: boolean;
  assignedWeight: number;
  normalizedWeight: number;
  totalDuePoints: number;
  completedPoints: number;
  onTimePoints: number;
  completionPercent: number;
  onTimePercent: number;
  completionGap: number;
  timelinessGap: number;
  moduleScore: number;
  totalTasksCount?: number;
  completedTasksCount?: number;
  pendingTasksCount?: number;
  runningTasksCount?: number;
  tasksList?: any[];
}

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

export interface MisScoreReport {
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

export const misScoreApi = {
  getReport: async (employeeId: string, period: string) => {
    const res = await axiosInstance.get(`/reports/apgs/${employeeId}?period=${period}`);
    return res.data.data as MisScoreReport;
  },
  getCumulativeScores: async (period: string) => {
    const res = await axiosInstance.get(`/reports/cumulative-scores?period=${period}`);
    return res.data.data as MisScoreReport[];
  },
  saveManagerEvaluation: async (
    employeeId: string,
    data: {
      periodType: string;
      periodStart: string;
      periodEnd: string;
      qualityOfWork: number;
      technicalCompetence: number;
      leadership: number;
      discipline: number;
      teamBehaviour: number;
      initiative: number;
      costSaving: number;
      problemSolving: number;
    }
  ) => {
    const res = await axiosInstance.post(`/reports/apgs/${employeeId}/manager-evaluation`, data);
    return res.data;
  }
};
