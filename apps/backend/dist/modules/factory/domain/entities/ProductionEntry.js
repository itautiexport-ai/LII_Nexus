"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeAchievementPercentage = computeAchievementPercentage;
/** Capped at 100% - overproduction doesn't inflate the score beyond "fully met", same convention as Office Performance goals. */
function computeAchievementPercentage(entry) {
    if (entry.targetQuantity === null || entry.targetQuantity === 0)
        return null;
    const raw = (entry.quantityProduced / entry.targetQuantity) * 100;
    return Math.max(0, Math.min(100, Math.round(raw * 100) / 100));
}
//# sourceMappingURL=ProductionEntry.js.map