"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FmsExecutionController = void 0;
const connection_1 = require("../../../../infrastructure/database/mysql/connection");
class FmsExecutionController {
    constructor(service) {
        this.service = service;
        this.startInstance = async (req, res) => {
            try {
                const { fmsManagerId } = req.params;
                const { referenceTitle, formData } = req.body;
                const userId = req.user?.sub;
                let creatorId = null;
                if (userId) {
                    const [empRows] = await connection_1.pool.query("SELECT id FROM employees WHERE user_id = ?", [userId]);
                    creatorId = empRows[0]?.id || null;
                }
                if (!referenceTitle)
                    return res.status(400).json({ success: false, message: "Reference title required" });
                const result = await this.service.startFmsInstance(fmsManagerId, { referenceTitle, formData, creatorId });
                res.status(201).json({ success: true, data: result });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ success: false, message: "Internal server error" });
            }
        };
        this.getInstances = async (req, res) => {
            try {
                const { fmsManagerId } = req.params;
                const instances = await this.service.getInstancesByManagerId(fmsManagerId);
                res.json({ success: true, data: instances });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ success: false, message: "Internal server error" });
            }
        };
        this.getMyTasks = async (req, res) => {
            try {
                // req.user does not have employeeId natively. Fetch from Employee repo based on user id.
                const userId = req.user?.sub;
                if (!userId)
                    return res.status(401).json({ success: false, message: "Unauthorized" });
                const [empRows] = await connection_1.pool.query("SELECT id FROM employees WHERE user_id = ?", [userId]);
                const employeeId = empRows[0]?.id;
                if (!employeeId)
                    return res.status(403).json({ success: false, message: "User not linked to employee" });
                const tasks = await this.service.getMyPendingTasks(employeeId);
                res.json({ success: true, data: tasks });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ success: false, message: "Internal server error" });
            }
        };
        this.completeTask = async (req, res) => {
            try {
                const userId = req.user?.sub;
                if (!userId)
                    return res.status(401).json({ success: false, message: "Unauthorized" });
                const [empRows] = await connection_1.pool.query("SELECT id FROM employees WHERE user_id = ?", [userId]);
                const employeeId = empRows[0]?.id;
                if (!employeeId)
                    return res.status(403).json({ success: false, message: "User not linked to employee" });
                const { instanceStepId } = req.params;
                const { inputData } = req.body;
                const result = await this.service.completeStep(employeeId, instanceStepId, { inputData });
                res.json({ success: true, data: result });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ success: false, message: "Internal server error" });
            }
        };
        this.deleteInstance = async (req, res) => {
            try {
                const { instanceId } = req.params;
                const result = await this.service.deleteInstance(instanceId);
                res.json({ success: true, data: result });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ success: false, message: "Internal server error" });
            }
        };
    }
}
exports.FmsExecutionController = FmsExecutionController;
//# sourceMappingURL=FmsExecutionController.js.map