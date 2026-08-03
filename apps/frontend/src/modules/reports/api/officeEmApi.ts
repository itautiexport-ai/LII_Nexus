import { axiosInstance } from "../../../services/api/axiosInstance";

export interface OfficeEmTaskDetail {
  id: string;
  name: string;
  priority: string;
  baseStatus: string;
  dueDate: string;
  completedAt: string | null;
}

export interface OfficeEmModuleScore {
  isActive: boolean;
  totalDuePoints: number;
  completedPoints: number;
  onTimePoints: number;
  completionPercent: number;
  onTimePercent: number;
  completionGap: number;
  timelinessGap: number;
  gapScore: number;
  standardWeight: number;
  normalizedWeight: number;
  tasks: OfficeEmTaskDetail[];
}

export interface OfficeEmReport {
  employeeId: string;
  employeeName: string;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  modules: {
    fms: OfficeEmModuleScore;
    checklist: OfficeEmModuleScore;
    delegation: OfficeEmModuleScore;
  };
  finalGapScore: number;
}

export const officeEmApi = {
  getGapScore(employeeId: string, period: string): Promise<{ data: OfficeEmReport }> {
    return axiosInstance.get(`/reports/office-em/${employeeId}?period=${period}`).then((r: any) => r.data);
  },

  getGapScoreList(period: string): Promise<{ data: OfficeEmReport[] }> {
    return axiosInstance.get(`/reports/office-em-list?period=${period}`).then((r: any) => r.data);
  }
};
