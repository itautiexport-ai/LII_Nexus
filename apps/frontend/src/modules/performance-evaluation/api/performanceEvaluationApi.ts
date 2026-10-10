import { axiosInstance } from "../../../services/api/axiosInstance";

export interface EvaluationData {
  employeeId: string;
  evaluationPeriod: string;
  score: number;
  comments: string;
  qualityOfWork?: number;
  technicalCompetence?: number;
  leadership?: number;
  teamBehaviour?: number;
  initiative?: number;
  costSaving?: number;
  
  attendancePunctuality?: number;
  discipline?: number;
  behaviourAttitude?: number;
  communication?: number;
  responsibilityAccountability?: number;
  workEthics?: number;
  teamContribution?: number;
  
  attendancePercentage?: number;
}

export interface EvaluationListItem {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  departmentName: string;
  designationTitle: string;
  hodId: string | null;
  hodName: string;
  hodEvaluation: {
    id: string;
    score: number;
    period: string;
    comments: string;
    createdAt: string;
  } | null;
  hrEvaluation: {
    id: string;
    score: number;
    period: string;
    comments: string;
    createdAt: string;
  } | null;
  ermScore: number;
  ermGapScore: number;
  rank: number;
  isPendingHod: boolean;
  isPendingHr: boolean;
}

export const performanceEvaluationApi = {
  getEvaluationList: async (): Promise<EvaluationListItem[]> => {
    const response = await axiosInstance.get("/performance-evaluation/list");
    return response.data.data || [];
  },

  createHodEvaluation: async (data: EvaluationData) => {
    const response = await axiosInstance.post("/performance-evaluation/hod", data);
    return response.data;
  },

  getHodEvaluations: async () => {
    const response = await axiosInstance.get("/performance-evaluation/hod");
    return response.data.data || [];
  },

  createHrEvaluation: async (data: EvaluationData) => {
    const response = await axiosInstance.post("/performance-evaluation/hr", data);
    return response.data;
  },

  getHrEvaluations: async () => {
    const response = await axiosInstance.get("/performance-evaluation/hr");
    return response.data.data || [];
  }
};
