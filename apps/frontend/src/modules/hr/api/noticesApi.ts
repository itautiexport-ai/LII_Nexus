import { axiosInstance } from "../../../services/api/axiosInstance";

export interface IssuedNotice {
  id?: string;
  employee_name: string;
  person_type: string;
  department: string;
  notice_type: string;
  category: string;
  issue_date: string;
  letter_body?: string;
  created_at?: string;
}

export const noticesApi = {
  getNotices: async () => {
    const response = await axiosInstance.get('/notices');
    return response.data.data as IssuedNotice[];
  },
  
  createNotice: async (notice: Partial<IssuedNotice>) => {
    const response = await axiosInstance.post('/notices', notice);
    return response.data.data as IssuedNotice;
  },

  deleteNotice: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/notices/${id}`);
  }
};
