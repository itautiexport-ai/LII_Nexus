import { PeriodType } from "../../domain/entities/Kpi";

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns the (fromDate, toDate) window that a period key covers, and a
 *  helper to derive "the current period key" for a given period type. */
export function periodKeyForNow(periodType: PeriodType, referenceDate: Date = new Date()): string {
  if (periodType === "monthly") {
    return `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, "0")}`;
  }
  return `${referenceDate.getFullYear()}`;
}

export function dateRangeForPeriod(periodType: PeriodType, periodKey: string): { from: string; to: string } {
  if (periodType === "monthly") {
    const [year, month] = periodKey.split("-").map(Number);
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0);
    return { from: toDateStr(from), to: toDateStr(to) };
  }
  const year = Number(periodKey);
  return { from: toDateStr(new Date(year, 0, 1)), to: toDateStr(new Date(year, 11, 31)) };
}

/** Last N period keys ending at (and including) the given reference period,
 *  oldest first - used for trend graphs. */
export function lastNPeriodKeys(periodType: PeriodType, n: number, referenceDate: Date = new Date()): string[] {
  const keys: string[] = [];
  if (periodType === "monthly") {
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
  } else {
    for (let i = n - 1; i >= 0; i--) {
      keys.push(`${referenceDate.getFullYear() - i}`);
    }
  }
  return keys;
}
