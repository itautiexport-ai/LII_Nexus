export interface ProductionEntry {
  id: string;
  employeeId: string;
  lineId: string;
  shiftId: string;
  entryDate: string;
  quantityProduced: number;
  targetQuantity: number | null;
  notes: string | null;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ProductionEntryWithRelations extends ProductionEntry {
  employeeName: string;
  employeeCode: string;
  lineName: string;
  shiftName: string;
}

/** Capped at 100% - overproduction doesn't inflate the score beyond "fully met", same convention as Office Performance goals. */
export function computeAchievementPercentage(entry: Pick<ProductionEntry, "targetQuantity" | "quantityProduced">): number | null {
  if (entry.targetQuantity === null || entry.targetQuantity === 0) return null;
  const raw = (entry.quantityProduced / entry.targetQuantity) * 100;
  return Math.max(0, Math.min(100, Math.round(raw * 100) / 100));
}

export interface LineShiftSummary {
  lineId: string;
  shiftId: string;
  entryDate: string;
  totalProduced: number;
  totalTarget: number | null;
  achievementPercentage: number | null;
  entries: (ProductionEntryWithRelations & { achievementPercentage: number | null })[];
}
