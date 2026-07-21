"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentPeriodKey = currentPeriodKey;
exports.lastNPeriodKeys = lastNPeriodKeys;
function pad(n) { return String(n).padStart(2, "0"); }
function isoWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return { year: d.getUTCFullYear(), week };
}
/** The current period key for a KPI's own frequency - each KPI can be
 *  daily/weekly/monthly/quarterly/yearly independently, unlike the Scoring
 *  Engine's fixed monthly/yearly choice. */
function currentPeriodKey(frequency, referenceDate = new Date()) {
    const y = referenceDate.getFullYear();
    if (frequency === "daily")
        return `${y}-${pad(referenceDate.getMonth() + 1)}-${pad(referenceDate.getDate())}`;
    if (frequency === "weekly") {
        const { year, week } = isoWeek(referenceDate);
        return `${year}-W${pad(week)}`;
    }
    if (frequency === "monthly")
        return `${y}-${pad(referenceDate.getMonth() + 1)}`;
    if (frequency === "quarterly")
        return `${y}-Q${Math.floor(referenceDate.getMonth() / 3) + 1}`;
    return `${y}`;
}
/** Last N period keys ending at the current one, oldest first - for
 *  History/Trend views. Approximated by stepping the reference date
 *  backward by the frequency's typical span; exact enough for trend
 *  charting given periods are just labels, not used for range queries. */
function lastNPeriodKeys(frequency, n, referenceDate = new Date()) {
    const keys = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(referenceDate);
        if (frequency === "daily")
            d.setDate(d.getDate() - i);
        else if (frequency === "weekly")
            d.setDate(d.getDate() - i * 7);
        else if (frequency === "monthly")
            d.setMonth(d.getMonth() - i);
        else if (frequency === "quarterly")
            d.setMonth(d.getMonth() - i * 3);
        else
            d.setFullYear(d.getFullYear() - i);
        keys.push(currentPeriodKey(frequency, d));
    }
    return keys;
}
//# sourceMappingURL=kpiPeriodUtils.js.map