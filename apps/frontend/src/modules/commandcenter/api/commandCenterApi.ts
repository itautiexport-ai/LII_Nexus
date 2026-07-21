import { axiosInstance } from "../../../services/api/axiosInstance";

export type HealthStatus = "good" | "warning" | "critical" | "unknown";

export interface BusinessHealth { periodKey: string; averageScore: number | null; employeesScored: number; status: HealthStatus; }
export interface ProductionHealth { periodKey: string; totalEntries: number; pendingApproval: number; approved: number; rejected: number; targetAchievementPercent: number | null; defectRatePercent: number | null; status: HealthStatus; }
export interface AtRiskEmployee { employeeId: string; employeeName: string; departmentName: string | null; overallScore: number | null; rank: number; }
export interface PeopleHealth { activeEmployees: number; employeesScored: number; employeesAtRisk: number; atRiskList: AtRiskEmployee[]; }
export interface DepartmentHealthRow { departmentName: string; averageScore: number; employeeCount: number; rank: number; status: HealthStatus; }
export interface OrderHealth { workflowRuns: Record<string, number>; factoryOrders: Record<string, number>; }
export interface DelayedTaskItem { id: string; label: string; assigneeName: string; dueDate: string; priority?: string; }
export interface DelayedOrderItem { id: string; reference: string; workflowName: string; startedAt: string; }
export interface DelayedProductionItem { id: string; entryDate: string; departmentName: string; delayMinutes: number; status: string; daysPending: number; }
export interface CriticalAlert { severity: "critical" | "warning"; message: string; }
export interface RankedEmployee { employeeId: string; employeeName: string; departmentName: string | null; overallScore: number | null; rank: number; }
export interface FactoryHeatMapRow { departmentId: string; departmentName: string; targetAchievementPercent: number | null; defectRatePercent: number | null; health: number | null; status: HealthStatus; }
export interface WeeklyTrendPoint { weekStart: string; completionRate: number | null; }
export interface MonthlyTrendPoint { periodKey: string; averageScore: number | null; }

export interface CommandCenterOverview {
  generatedAt: string;
  businessHealth: BusinessHealth;
  productionHealth: ProductionHealth;
  peopleHealth: PeopleHealth;
  departmentHealth: DepartmentHealthRow[];
  orderHealth: OrderHealth;
  delayedTasks: { flowchart: DelayedTaskItem[]; delegation: DelayedTaskItem[] };
  delayedOrders: DelayedOrderItem[];
  delayedProduction: DelayedProductionItem[];
  criticalAlerts: CriticalAlert[];
  topPerformers: RankedEmployee[];
  bottomPerformers: RankedEmployee[];
  factoryHeatMap: FactoryHeatMapRow[];
  weeklyTrend: WeeklyTrendPoint[];
  monthlyTrend: MonthlyTrendPoint[];
  aiPlaceholder: { available: boolean; message: string };
}

export const commandCenterApi = {
  async getOverview(): Promise<CommandCenterOverview> {
    const res = await axiosInstance.get("/command-center/overview");
    return res.data.data;
  },
};
