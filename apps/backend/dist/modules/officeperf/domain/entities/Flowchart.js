"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeDisplayStatus = computeDisplayStatus;
/** Delayed is derived, never stored, so it can't go stale: a task is only
 *  "delayed" if it's still open (not completed) and past its due date. */
function computeDisplayStatus(task) {
    if (task.baseStatus === "completed")
        return "completed";
    if (task.dueDate && new Date(task.dueDate) < new Date(new Date().toDateString()))
        return "delayed";
    return task.baseStatus;
}
//# sourceMappingURL=Flowchart.js.map