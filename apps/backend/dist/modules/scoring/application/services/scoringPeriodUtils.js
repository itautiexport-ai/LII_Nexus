"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.periodKeyForNow = periodKeyForNow;
exports.dateRangeForPeriod = dateRangeForPeriod;
exports.lastNPeriodKeys = lastNPeriodKeys;
function toDateStr(d) {
    return d.toISOString().slice(0, 10);
}
/** Returns the (fromDate, toDate) window that a period key covers, and a
 *  helper to derive "the current period key" for a given period type. */
function periodKeyForNow(periodType, referenceDate = new Date()) {
    if (periodType === "monthly") {
        return `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, "0")}`;
    }
    return `${referenceDate.getFullYear()}`;
}
function dateRangeForPeriod(periodType, periodKey) {
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
function lastNPeriodKeys(periodType, n, referenceDate = new Date()) {
    const keys = [];
    if (periodType === "monthly") {
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
            keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        }
    }
    else {
        for (let i = n - 1; i >= 0; i--) {
            keys.push(`${referenceDate.getFullYear() - i}`);
        }
    }
    return keys;
}
//# sourceMappingURL=scoringPeriodUtils.js.map