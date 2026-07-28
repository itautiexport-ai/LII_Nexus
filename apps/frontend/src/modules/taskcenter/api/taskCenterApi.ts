import { axiosInstance } from "../../../services/api/axiosInstance";

export interface TaskStats {
  checklist: { pending: number; completed: number };
  delegation: { pending: number; completed: number };
  fms: { pending: number; completed: number };
}

export const taskCenterApi = {
  getStats: async (): Promise<TaskStats> => {
    const res = await axiosInstance.get<{ success: boolean; data: TaskStats }>("/task-center/stats");
    return res.data.data;
  },
};
