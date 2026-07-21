"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeAchievementPercentage = computeAchievementPercentage;
/** Achievement is capped at 100% - exceeding a target doesn't inflate the score beyond "fully met". */
function computeAchievementPercentage(goal) {
    if (goal.targetValue === null || goal.targetValue === 0)
        return null;
    const raw = (goal.currentValue / goal.targetValue) * 100;
    return Math.max(0, Math.min(100, Math.round(raw * 100) / 100));
}
//# sourceMappingURL=Goal.js.map