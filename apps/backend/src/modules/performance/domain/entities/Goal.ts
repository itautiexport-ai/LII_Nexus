export type GoalStatus = "active" | "completed" | "cancelled";

export interface Goal {
  id: string;
  employeeId: string;
  title: string;
  description: string | null;
  unit: string | null;
  targetValue: number | null;
  currentValue: number;
  weight: number;
  status: GoalStatus;
  startDate: string | null;
  targetDate: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface GoalProgressEntry {
  id: string;
  goalId: string;
  value: number;
  note: string | null;
  recordedBy: string;
  recordedAt: Date;
}

/** Achievement is capped at 100% - exceeding a target doesn't inflate the score beyond "fully met". */
export function computeAchievementPercentage(goal: Pick<Goal, "targetValue" | "currentValue">): number | null {
  if (goal.targetValue === null || goal.targetValue === 0) return null;
  const raw = (goal.currentValue / goal.targetValue) * 100;
  return Math.max(0, Math.min(100, Math.round(raw * 100) / 100));
}
