"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeCurrentPeriod = computeCurrentPeriod;
exports.getRangeForWindow = getRangeForWindow;
function toDateStr(d) {
    return d.toISOString().slice(0, 10);
}
function getIsoWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return { year: d.getUTCFullYear(), week };
}
/** Computes the (periodKey, periodStart, periodEnd) for "now" given a
 *  checklist's frequency. periodKey is a stable, sortable identifier used
 *  to prevent double-generating the same period's instance. */
function computeCurrentPeriod(frequency, referenceDate = new Date()) {
    if (frequency === "daily") {
        const key = toDateStr(referenceDate);
        return { periodKey: key, periodStart: key, periodEnd: key };
    }
    if (frequency === "weekly") {
        const { year, week } = getIsoWeek(referenceDate);
        const dayOfWeek = referenceDate.getDay() || 7; // Monday = 1 ... Sunday = 7
        const monday = new Date(referenceDate);
        monday.setDate(referenceDate.getDate() - (dayOfWeek - 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return {
            periodKey: `${year}-W${String(week).padStart(2, "0")}`,
            periodStart: toDateStr(monday),
            periodEnd: toDateStr(sunday),
        };
    }
    // monthly
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
        periodKey: `${year}-${String(month + 1).padStart(2, "0")}`,
        periodStart: toDateStr(firstDay),
        periodEnd: toDateStr(lastDay),
    };
}
function getRangeForWindow(window, referenceDate = new Date()) {
    if (window === "today") {
        const key = toDateStr(referenceDate);
        return { from: key, to: key };
    }
    if (window === "week") {
        const dayOfWeek = referenceDate.getDay() || 7;
        const monday = new Date(referenceDate);
        monday.setDate(referenceDate.getDate() - (dayOfWeek - 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return { from: toDateStr(monday), to: toDateStr(sunday) };
    }
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    return { from: toDateStr(new Date(year, month, 1)), to: toDateStr(new Date(year, month + 1, 0)) };
}
//# sourceMappingURL=periodUtils.js.map