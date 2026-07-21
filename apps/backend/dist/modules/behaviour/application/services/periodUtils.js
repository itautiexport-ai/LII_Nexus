"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lastNPeriodKeys = exports.dateRangeForPeriod = exports.periodKeyForNow = void 0;
// Re-exported thin wrapper so the behaviour module doesn't reach directly
// into the scoring module's internals for a handful of generic date-math
// helpers that have nothing scoring-specific about them.
var scoringPeriodUtils_1 = require("../../../scoring/application/services/scoringPeriodUtils");
Object.defineProperty(exports, "periodKeyForNow", { enumerable: true, get: function () { return scoringPeriodUtils_1.periodKeyForNow; } });
Object.defineProperty(exports, "dateRangeForPeriod", { enumerable: true, get: function () { return scoringPeriodUtils_1.dateRangeForPeriod; } });
Object.defineProperty(exports, "lastNPeriodKeys", { enumerable: true, get: function () { return scoringPeriodUtils_1.lastNPeriodKeys; } });
//# sourceMappingURL=periodUtils.js.map