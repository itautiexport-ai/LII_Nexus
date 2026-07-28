"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskCenterController = void 0;
class TaskCenterController {
    constructor(service) {
        this.service = service;
        this.getDashboardStats = async (req, res) => {
            try {
                const isSystemAdmin = req.user?.roles?.includes("System Admin") || false;
                const stats = await this.service.getDashboardStats(req.user.sub, isSystemAdmin);
                res.json({ success: true, data: stats });
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ success: false, error: "Failed to fetch task center stats" });
            }
        };
    }
}
exports.TaskCenterController = TaskCenterController;
//# sourceMappingURL=TaskCenterController.js.map