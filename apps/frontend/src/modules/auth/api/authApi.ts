import { axiosInstance } from "../../../services/api/axiosInstance";
import { CurrentUser } from "../hooks/useAuthStore";

export interface LoginResponse {
  accessToken: string;
  user: CurrentUser;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await axiosInstance.post("/auth/login", { email, password });
    return res.data.data;
  },
  async logout(): Promise<void> {
    await axiosInstance.post("/auth/logout");
  },
  async refresh(): Promise<{ accessToken: string }> {
    const res = await axiosInstance.post("/auth/refresh");
    return res.data.data;
  },
  async getMyPermissions(): Promise<string[]> {
    const res = await axiosInstance.get("/me/permissions");
    return res.data.data.permissions;
  },
  async getMe(): Promise<{ user: CurrentUser }> {
    const res = await axiosInstance.get("/auth/me");
    return res.data.data;
  },
};
