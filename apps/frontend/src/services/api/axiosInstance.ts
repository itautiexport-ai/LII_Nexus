import axios from "axios";
import { env } from "../../config/env";
import { useAuthStore } from "../../modules/auth/hooks/useAuthStore";

export const axiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true, // sends the httpOnly refresh-token cookie
});

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute = originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/refresh");
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      if (!refreshPromise) {
        refreshPromise = axiosInstance
          .post("/auth/refresh")
          .then((res) => {
            const newToken = res.data.data.accessToken as string;
            useAuthStore.getState().setAccessToken(newToken);
            return newToken;
          })
          .catch(() => {
            useAuthStore.getState().clear();
            return null;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);
