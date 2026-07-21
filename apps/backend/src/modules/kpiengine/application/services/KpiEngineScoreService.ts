import { IKpiEngineRepository } from "../../domain/repositories/IKpiEngineRepository";
import { KpiEngineDefinition } from "../../domain/entities/KpiEngine";
import { currentPeriodKey } from "./kpiPeriodUtils";

export interface ScoreBreakdownItem {
  kpiId: string;
  kpiName: string;
  periodKey: string;
  score: number | null;
  trafficLight: string | null;
  weightageUsed: number;
}

export interface ScoreResult {
  overallScore: number | null;
  kpiCount: number;
  scoredCount: number;
  breakdown: ScoreBreakdownItem[];
}

function weightedAverage(items: { score: number | null; weightageUsed: number }[]): number | null {
  const present = items.filter((i) => i.score !== null) as { score: number; weightageUsed: number }[];
  const totalWeight = present.reduce((s, i) => s + i.weightageUsed, 0);
  if (totalWeight === 0) return null;
  return Math.round((present.reduce((s, i) => s + i.score * i.weightageUsed, 0) / totalWeight) * 100) / 100;
}

/**
 * Employee / Department / Company scores are each a weighted average of
 * the relevant KPIs' CURRENT-period entries (each KPI's own frequency
 * determines what "current period" means for it). A KPI with no entry
 * recorded yet for its current period is excluded from the average
 * entirely, not treated as zero - the same renormalization convention used
 * by the Performance Scoring Engine and the Behaviour Index, kept
 * consistent across every scoring mechanism in this project.
 */
export class KpiEngineScoreService {
  constructor(private readonly repo: IKpiEngineRepository) {}

  private async scoreForDefinitions(definitions: KpiEngineDefinition[]): Promise<ScoreResult> {
    const breakdown: ScoreBreakdownItem[] = [];
    for (const def of definitions) {
      const periodKey = currentPeriodKey(def.frequency);
      const entry = await this.repo.getEntry(def.id, periodKey);
      breakdown.push({
        kpiId: def.id, kpiName: def.name, periodKey,
        score: entry?.computedScore ?? null, trafficLight: entry?.trafficLight ?? null,
        weightageUsed: entry?.weightageUsed ?? def.weightage,
      });
    }
    return {
      overallScore: weightedAverage(breakdown),
      kpiCount: definitions.length,
      scoredCount: breakdown.filter((b) => b.score !== null).length,
      breakdown,
    };
  }

  async employeeScore(employeeId: string): Promise<ScoreResult> {
    const definitions = await this.repo.listDefinitions({ responsibleEmployeeId: employeeId, status: "active" });
    return this.scoreForDefinitions(definitions);
  }

  async departmentScore(departmentId: string): Promise<ScoreResult> {
    const definitions = await this.repo.listDefinitions({ departmentId, status: "active" });
    return this.scoreForDefinitions(definitions);
  }

  async companyScore(): Promise<ScoreResult> {
    const definitions = await this.repo.listDefinitions({ status: "active" });
    return this.scoreForDefinitions(definitions);
  }
}
