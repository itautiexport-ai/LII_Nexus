import { axiosInstance } from "../../../services/api/axiosInstance";

export interface FmsManager {
  id: string;
  name: string;
  sopVideoLink: string | null;
  description: string;
  formFields?: any[];
  createdAt: string;
}

export interface CreateFmsManagerDto {
  name: string;
  sopVideoLink?: string;
  description: string;
  formFields?: any[];
}

export interface FmsStep {
  id: string;
  fmsId: string;
  stepName: string;
  doerEmployeeIds: string[];
  timelineHours: number;
  timelineUnit: "hours" | "days";
  isSequential: boolean;
  sequenceOrder: number;
  dependsOnStepIds?: string[];
  createdAt: string;
}

export interface CreateFmsStepDto {
  stepName: string;
  doerEmployeeIds: string[];
  timelineHours: number;
  timelineUnit: "hours" | "days";
  isSequential?: boolean;
  sequenceOrder?: number;
  dependsOnStepIds?: string[];
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

  async update(fmsId: string, payload: CreateFmsManagerDto): Promise<FmsManager> {
    const res = await axiosInstance.put(`/fms/${fmsId}`, payload);
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

  async getAllStepsGlobal(): Promise<(FmsStep & { managerName: string })[]> {
    const res = await axiosInstance.get(`/fms-global-steps`);
    return res.data.data;
  },

  async updateStep(stepId: string, payload: CreateFmsStepDto): Promise<FmsStep> {
    const res = await axiosInstance.put(`/fms/steps/${stepId}`, payload);
    return res.data.data;
  },

  async deleteStep(stepId: string): Promise<void> {
    await axiosInstance.delete(`/fms/steps/${stepId}`);
  },

  async startInstance(fmsManagerId: string, referenceTitle: string, formData?: any) {
    const res = await axiosInstance.post(`/fms/${fmsManagerId}/start`, { referenceTitle, formData });
    return res.data.data;
  },

  async getInstances(fmsManagerId: string) {
    const res = await axiosInstance.get(`/fms/${fmsManagerId}/instances`);
    return res.data.data;
  },

  async deleteInstance(instanceId: string) {
    const res = await axiosInstance.delete(`/fms/instances/${instanceId}`);
    return res.data;
  },

  async getMyTasks(status?: string) {
    const res = await axiosInstance.get(`/fms-tasks/me`, { params: status ? { status } : {} });
    return res.data.data;
  },

  async completeTask(instanceStepId: string, inputData: any = {}) {
    const res = await axiosInstance.post(`/fms-tasks/${instanceStepId}/complete`, { inputData });
    return res.data.data;
  }
};
