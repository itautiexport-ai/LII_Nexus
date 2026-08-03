import { axiosInstance } from "../../../../services/api/axiosInstance";

export interface MachineTarget {
  id: string;
  machineId: string;
  machineName?: string;
  size: string;
  target: number;
  uom: string;
  createdAt: string;
}

export interface CreateMachineTargetPayload {
  machineId: string;
  size: string;
  target: number;
  uom: string;
}

export interface MachineEfficiencyEntry {
  id: string;
  departmentId: string;
  departmentName?: string;
  machineId: string;
  machineName?: string;
  size: string;
  target: number;
  achieved: number;
  manpowerCount: number;
  efficiency: number;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

export interface CreateMachineEfficiencyEntryPayload {
  departmentId: string;
  machineId: string;
  size: string;
  target: number;
  achieved: number;
  manpowerCount: number;
}

export const machineEfficiencyApi = {
  // Targets
  listTargets: (machineId?: string) =>
    axiosInstance.get<MachineTarget[]>("/machine-targets", { params: { machineId } }).then((r) => r.data),
  
  createTarget: (data: CreateMachineTargetPayload) =>
    axiosInstance.post<MachineTarget>("/machine-targets", data).then((r) => r.data),
  
  updateTarget: (id: string, data: Partial<CreateMachineTargetPayload>) =>
    axiosInstance.patch<MachineTarget>(`/machine-targets/${id}`, data).then((r) => r.data),
  
  deleteTarget: (id: string) =>
    axiosInstance.delete(`/machine-targets/${id}`).then((r) => r.data),

  // Efficiency Entries
  listEntries: () =>
    axiosInstance.get<MachineEfficiencyEntry[]>("/machine-efficiency").then((r) => r.data),

  createEntry: (data: CreateMachineEfficiencyEntryPayload) =>
    axiosInstance.post<MachineEfficiencyEntry>("/machine-efficiency", data).then((r) => r.data),
};
