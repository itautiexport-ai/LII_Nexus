export interface DprEntry {
  id: string;
  entryDate: string;
  shiftId: string;
  factoryDepartmentId: string;
  supervisorId: string;
  hodId: string | null;
  totalTarget: number;
  uom: string;
  totalAchievement: number;
  totalRework: number;
  totalOperator: number;
  totalHelper: number;
  totalContractor: number;
  manpowerDepartmentId: string | null;
  submittedBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface DprEntryItem {
  id: string;
  dprEntryId: string;
  aliasName: string | null;
  productCode: string | null;
  woodType: string | null;
  orderQty: number;
  okQty: number;
  reworkQty: number;
  uom: string;
  qtyAsPerUom: number | null;
  sortOrder: number;
  createdAt: Date;
}

export interface DprEntryWithContext extends DprEntry {
  departmentName: string;
  shiftName: string;
  supervisorName: string;
  manpowerDepartmentName: string | null;
  items: DprEntryItem[];
}
