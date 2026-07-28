import { axiosInstance } from "../../../services/api/axiosInstance";

export interface PayrollRecord {
  sNo: number;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  monthlySalary: number;
  daysPresent: number;
  payout: number;
}

export interface MonthlySalarySheetRecord {
  sNo: number;
  departmentName: string;
  gross: number;
  days: number;
  otHrs: number;
  grossAmt: number;
  otAmt: number;
}

export const payrollApi = {
  getWeeklyPayroll: async (startDate: string, endDate: string): Promise<PayrollRecord[]> => {
    const res = await axiosInstance.get(`/hr/payroll/weekly`, { params: { startDate, endDate } });
    return res.data?.data || [];
  },
  getMonthlySalarySheet: async (year: number, month: number): Promise<MonthlySalarySheetRecord[]> => {
    const res = await axiosInstance.get(`/hr/payroll/monthly/${year}/${month}`);
    return res.data?.data || [];
  }
};
