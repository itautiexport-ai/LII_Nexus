import { axiosInstance } from "../../../services/api/axiosInstance";

export interface FmsManager {
  id: string;
  name: string;
  sopVideoLink: string | null;
  description: string;
  createdAt: string;
}

export interface CreateFmsManagerDto {
  name: string;
  sopVideoLink?: string;
  description: string;
}

export interface FmsStep {
  id: string;
  fmsId: string;
  stepName: string;
  doerEmployeeId: string;
  timelineHours: number;
  timelineUnit: "hours" | "days";
  isSequential: boolean;
  sequenceOrder: number;
  createdAt: string;
}

export interface CreateFmsStepDto {
  stepName: string;
  doerEmployeeId: string;
  timelineHours: number;
  timelineUnit: "hours" | "days";
  isSequential: boolean;
  sequenceOrder: number;
}

export const fmsApi = {
  async getAll(): Promise<FmsManager[]> {
    const res = await axiosInstance.get("/fms");
    return res.data.data;
  },

  async create(payload: CreateFmsManagerDto): Promise<FmsManager> {
    const res = await axiosInstance.post("/fms", payload);
    return res.data.data;
  },

  async delete(fmsId: string): Promise<void> {
    await axiosInstance.delete(`/fms/${fmsId}`);
  },

  async addStep(fmsId: string, payload: CreateFmsStepDto): Promise<FmsStep> {
    const res = await axiosInstance.post(`/fms/${fmsId}/steps`, payload);
    return res.data.data;
  },

  async getSteps(fmsId: string): Promise<FmsStep[]> {
    const res = await axiosInstance.get(`/fms/${fmsId}/steps`);
    return res.data.data;
  },

  async deleteStep(stepId: string): Promise<void> {
    await axiosInstance.delete(`/fms/steps/${stepId}`);
  }
};
