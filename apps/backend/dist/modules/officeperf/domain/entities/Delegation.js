"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeDelegationDisplayStatus = computeDelegationDisplayStatus;
function computeDelegationDisplayStatus(task) {
    if (task.baseStatus === "completed")
        return "completed";
    if (new Date(task.dueDate) < new Date(new Date().toDateString()))
        return "delayed";
    return task.baseStatus;
}
//# sourceMappingURL=Delegation.js.map