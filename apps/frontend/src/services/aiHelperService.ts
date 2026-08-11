import { axiosInstance } from "./api/axiosInstance";

export interface AiQueryResult {
  answer: string;
  category: "fms" | "performance" | "attendance" | "checklist" | "tickets" | "general";
  data?: any;
  suggestions?: string[];
}

export class AiHelperService {
  static async query(prompt: string): Promise<AiQueryResult> {
    const res = await axiosInstance.post<{ success: boolean; data: AiQueryResult }>("/ai-helper/query", {
      prompt,
    });
    return res.data.data;
  }
}
