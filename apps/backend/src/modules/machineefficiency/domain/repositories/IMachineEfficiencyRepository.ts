export interface MachineTarget {
  id: string;
  machineId: string;
  machineName?: string;
  size: string;
  target: number;
  uom: string;
  createdAt: string;
  updatedAt: string;
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
  updatedAt: string;
}

export interface IMachineEfficiencyRepository {
  // Machine Targets
  createTarget(target: MachineTarget): Promise<void>;
  updateTarget(id: string, target: number, uom: string): Promise<void>;
  deleteTarget(id: string): Promise<void>;
  listTargets(machineId?: string): Promise<MachineTarget[]>;
  getTargetById(id: string): Promise<MachineTarget | null>;
  getTargetByMachineAndSize(machineId: string, size: string): Promise<MachineTarget | null>;

  // Efficiency Entries
  createEntry(entry: MachineEfficiencyEntry): Promise<void>;
  listEntries(): Promise<MachineEfficiencyEntry[]>;
  getEntryById(id: string): Promise<MachineEfficiencyEntry | null>;
}
