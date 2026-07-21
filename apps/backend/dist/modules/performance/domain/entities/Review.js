"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeOverallScore = computeOverallScore;
exports.computeWeightedGoalScore = computeWeightedGoalScore;
/**
 * Blends goal-driven performance with the manager's independent rating.
 * Equal weighting by design: goals alone can be gamed (easy targets), and a
 * manager's opinion alone can be inconsistent across teams - averaging the
 * two keeps either one from single-handedly deciding the outcome.
 * If there are no scoreable goals, the manager's score stands alone.
 */
function computeOverallScore(goalScore, managerScore) {
    if (goalScore === null && managerScore === null)
        return null;
    if (goalScore === null)
        return managerScore;
    if (managerScore === null)
        return goalScore;
    return Math.round(((goalScore + managerScore) / 2) * 100) / 100;
}
/** Weighted average of per-goal achievement percentages. Goals without a
 *  numeric target (and therefore no achievement %) are excluded from both
 *  the numerator and the weight total, rather than counted as 0. */
function computeWeightedGoalScore(scores) {
    const scoreable = scores.filter((s) => s.achievementPercentage !== null);
    const totalWeight = scoreable.reduce((sum, s) => sum + s.weight, 0);
    if (totalWeight === 0)
        return null;
    const weightedSum = scoreable.reduce((sum, s) => sum + s.weight * s.achievementPercentage, 0);
    return Math.round((weightedSum / totalWeight) * 100) / 100;
}
//# sourceMappingURL=Review.js.map