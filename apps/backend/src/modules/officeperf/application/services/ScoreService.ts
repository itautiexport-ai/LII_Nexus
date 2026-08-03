import { IFlowchartRepository } from "../../domain/repositories/IFlowchartRepository";
import { IDelegationRepository } from "../../domain/repositories/IDelegationRepository";
import { IChecklistRepository } from "../../domain/repositories/IChecklistRepository";
import { getRangeForWindow } from "./periodUtils";
import { isInstanceComplete } from "../../domain/entities/Checklist";

export type ScoreWindow = "today" | "week" | "month";

export interface CategoryScore {
  completed: number;
  total: number;
  rate: number | null; // null when there's nothing due in this category for this window
}

export interface WindowScore {
  flowchart: CategoryScore;
  checklist: CategoryScore;
  delegation: CategoryScore;
  overall: number | null; // weighted 80/10/10, renormalized over categories that had anything due; null if nothing was due at all
}

const WEIGHTS = { flowchart: 80, checklist: 10, delegation: 10 };

export class ScoreService {
  constructor(
    private readonly flowchartRepo: IFlowchartRepository,
    private readonly delegationRepo: IDelegationRepository,
    private readonly checklistRepo: IChecklistRepository
  ) {}

  /**
   * Weighted performance score (Flowchart 80% / Checklist 10% / Delegation
   * 10%). A category with nothing due in the window is excluded from both
   * the numerator and the weight total (renormalized), rather than counted
   * as 0% - an employee with no checklist due today shouldn't be penalized
   * for it. If literally nothing was due anywhere, the overall score is
   * `null` ("nothing to evaluate"), not 0.
   */
  async computeWindowScore(employeeId: string, window: ScoreWindow): Promise<WindowScore> {
    const { from, to } = getRangeForWindow(window);

    const flowchartCounts = await this.flowchartRepo.countCompletedAndTotalDue(employeeId, from, to);
    const delegationCounts = await this.delegationRepo.countCompletedAndTotalDue(employeeId, from, to);

    const instances = await this.checklistRepo.listInstancesForEmployee(employeeId, from, to);
    const checklistTotal = instances.length;
    const checklistCompleted = instances.filter((i) => isInstanceComplete(i.items)).length;

    const flowchart: CategoryScore = {
      completed: flowchartCounts.completed,
      total: flowchartCounts.total,
      rate: flowchartCounts.total > 0 ? (flowchartCounts.completed / flowchartCounts.total) * 100 : null,
    };
    const checklist: CategoryScore = {
      completed: checklistCompleted,
      total: checklistTotal,
      rate: checklistTotal > 0 ? (checklistCompleted / checklistTotal) * 100 : null,
    };
    const delegation: CategoryScore = {
      completed: delegationCounts.completed,
      total: delegationCounts.total,
      rate: delegationCounts.total > 0 ? (delegationCounts.completed / delegationCounts.total) * 100 : null,
    };

    const present = [
      { rate: flowchart.rate, weight: WEIGHTS.flowchart },
      { rate: checklist.rate, weight: WEIGHTS.checklist },
      { rate: delegation.rate, weight: WEIGHTS.delegation },
    ].filter((c) => c.rate !== null) as { rate: number; weight: number }[];

    const totalWeight = present.reduce((sum, c) => sum + c.weight, 0);
    const overall = totalWeight > 0
      ? Math.round((present.reduce((sum, c) => sum + c.rate * c.weight, 0) / totalWeight) * 100) / 100
      : null;

    return { flowchart, checklist, delegation, overall };
  }

  async computeAllWindows(employeeId: string) {
    const [today, week, month] = await Promise.all([
      this.computeWindowScore(employeeId, "today"),
      this.computeWindowScore(employeeId, "week"),
      this.computeWindowScore(employeeId, "month"),
    ]);
    return { today, week, month };
  }
}
