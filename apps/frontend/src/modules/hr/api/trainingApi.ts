import { axiosInstance } from "../../../services/api/axiosInstance";

export interface TrainingCalendar {
  id: string;
  financial_year: string;
  status: string;
}

export interface TrainingSession {
  id: string;
  calendar_id: string;
  title: string;
  category: string;
  department_id: string | null;
  training_type: string;
  priority: string;
  scheduled_date: string;
  duration_hours: number;
  trainer: string;
  venue_mode: string;
  budget: number;
  status: string;
  description: string;
}

export const trainingApi = {
  async getCalendars() {
    const res = await axiosInstance.get('/training/calendars');
    return res.data.data as TrainingCalendar[];
  },
  async createCalendar(financial_year: string) {
    const res = await axiosInstance.post('/training/calendars', { financial_year });
    return res.data.data as TrainingCalendar;
  },
  async getSessions(calendar_id?: string) {
    const url = calendar_id ? `/training/sessions?calendar_id=${calendar_id}` : '/training/sessions';
    const res = await axiosInstance.get(url);
    return res.data.data as TrainingSession[];
  },
  async createSession(session: Partial<TrainingSession>) {
    const res = await axiosInstance.post('/training/sessions', session);
    return res.data.data as TrainingSession;
  },
  async updateSessionStatus(id: string, status: string) {
    const res = await axiosInstance.put(`/training/sessions/${id}/status`, { status });
    return res.data.success;
  },
  async deleteSession(id: string) {
    const res = await axiosInstance.delete(`/training/sessions/${id}`);
    return res.data.success;
  }
};
