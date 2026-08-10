import { axiosInstance } from "../../../services/api/axiosInstance";

export const exportData = async (moduleType: string, startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  params.append("module", moduleType);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const response = await axiosInstance.get(`/export?${params.toString()}`, {
    responseType: "blob",
  });
  return response.data;
};
