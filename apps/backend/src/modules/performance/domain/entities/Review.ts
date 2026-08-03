export type ReviewStatus = "self_pending" | "manager_pending" | "completed";

export interface Review {
  id: string;
  employeeId: string;
  managerId: string | null;
  status: ReviewStatus;
  selfSummary: string | null;
  selfSubmittedAt: Date | null;
  managerSummary: string | null;
  managerScore: number | null;
  managerSubmittedAt: Date | null;
  goalScore: number | null;
  overallScore: number | null;
  initiatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ReviewGoalScore {
  id: string;
  reviewId: string;
  goalId: string;
  goalTitleSnapshot: string;
  weight: number;
  targetValue: number | null;
  achievedValue: number | null;
  achievementPercentage: number | null;
}

/**
 * Blends goal-driven performance with the manager's independent rating.
 * Equal weighting by design: goals alone can be gamed (easy targets), and a
 * manager's opinion alone can be inconsistent across teams - averaging the
 * two keeps either one from single-handedly deciding the outcome.
 * If there are no scoreable goals, the manager's score stands alone.
 */
export function computeOverallScore(goalScore: number | null, managerScore: number | null): number | null {
  if (goalScore === null && managerScore === null) return null;
  if (goalScore === null) return managerScore;
  if (managerScore === null) return goalScore;
  return Math.round(((goalScore + managerScore) / 2) * 100) / 100;
}

/** Weighted average of per-goal achievement percentages. Goals without a
 *  numeric target (and therefore no achievement %) are excluded from both
 *  the numerator and the weight total, rather than counted as 0. */
export function computeWeightedGoalScore(
  scores: Array<{ weight: number; achievementPercentage: number | null }>
): number | null {
  const scoreable = scores.filter((s) => s.achievementPercentage !== null);
  const totalWeight = scoreable.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return null;
  const weightedSum = scoreable.reduce((sum, s) => sum + s.weight * (s.achievementPercentage as number), 0);
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}
