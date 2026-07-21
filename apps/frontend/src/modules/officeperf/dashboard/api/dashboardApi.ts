import { axiosInstance } from "../../../../services/api/axiosInstance";

export interface CategoryScore {
  completed: number;
  total: number;
  rate: number | null;
}

export interface WindowScore {
  flowchart: CategoryScore;
  checklist: CategoryScore;
  delegation: CategoryScore;
  overall: number | null;
}

export interface TaskSummaryItem {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  source: "flowchart" | "delegation";
}

export interface EmployeeDashboard {
  employeeId: string;
  employeeName: string;
  todaysTasks: TaskSummaryItem[];
  pendingTasks: TaskSummaryItem[];
  delayedTasks: TaskSummaryItem[];
  scores: { today: WindowScore; week: WindowScore; month: WindowScore };
}

export interface ManagerDashboard {
  managerId: string;
  managerName: string;
  directReports: {
    employeeId: string; employeeName: string;
    todaysTaskCount: number; pendingTaskCount: number; delayedTaskCount: number;
    todayScore: number | null; weekScore: number | null; monthScore: number | null;
  }[];
}

export interface DepartmentDashboard {
  departmentId: string;
  departmentName: string;
  departmentAverageToday: number | null;
  employees: { employeeId: string; employeeName: string; todayScore: number | null; weekScore: number | null; monthScore: number | null }[];
}

export interface CompanyDashboard {
  companyAverageToday: number | null;
  departments: { departmentId: string; departmentName: string; averageToday: number | null; employeeCount: number }[];
}

export const dashboardApi = {
  async employee(): Promise<EmployeeDashboard> {
    const res = await axiosInstance.get("/dashboard/employee");
    return res.data.data;
  },
  async manager(): Promise<ManagerDashboard> {
    const res = await axiosInstance.get("/dashboard/manager");
    return res.data.data;
  },
  async department(departmentId: string): Promise<DepartmentDashboard> {
    const res = await axiosInstance.get(`/dashboard/department/${departmentId}`);
    return res.data.data;
  },
  async company(): Promise<CompanyDashboard> {
    const res = await axiosInstance.get("/dashboard/company");
    return res.data.data;
  },
};
