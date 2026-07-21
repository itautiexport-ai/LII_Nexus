"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeDelayDays = computeDelayDays;
exports.computeWeightedForecast = computeWeightedForecast;
/** Delay days is derived, never stored: today minus the pending follow-up
 *  date, for an active lead only (won/lost/dead/dormant leads don't accrue
 *  "delay" - there's nothing pending to be late on). */
function computeDelayDays(lead) {
    if (lead.status !== "active" || !lead.nextFollowUpDate)
        return 0;
    const due = new Date(lead.nextFollowUpDate);
    const today = new Date(new Date().toDateString());
    const diffMs = today.getTime() - due.getTime();
    return diffMs > 0 ? Math.round(diffMs / 86400000) : 0;
}
/** Always computed, never hand-entered - same "no manual calculation"
 *  convention as the Scoring Engine. */
function computeWeightedForecast(forecastAmount, winProbability) {
    if (forecastAmount === null || winProbability === null)
        return null;
    return Math.round(forecastAmount * (winProbability / 100) * 100) / 100;
}
//# sourceMappingURL=Lead.js.map