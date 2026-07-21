"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalController = void 0;
const GoalService_1 = require("../../application/services/GoalService");
const MySqlGoalRepository_1 = require("../../infrastructure/repositories/MySqlGoalRepository");
const EmployeeScopeService_1 = require("../../application/services/EmployeeScopeService");
const MySqlRoleRepository_1 = require("../../../rbac/infrastructure/repositories/MySqlRoleRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const goalService = new GoalService_1.GoalService(new MySqlGoalRepository_1.MySqlGoalRepository(), new EmployeeScopeService_1.EmployeeScopeService());
const roleRepo = new MySqlRoleRepository_1.MySqlRoleRepository();
async function hasPermission(userId, key) {
    const keys = await roleRepo.getPermissionKeysForUser(userId);
    return keys.includes(key);
}
exports.GoalController = {
    async listForEmployee(req, res) {
        const override = await hasPermission(req.user.sub, "performance.goal.view");
        const goals = await goalService.listForEmployee(req.params.employeeId, req.user.sub, override);
        return (0, apiResponse_1.ok)(res, goals);
    },
    async create(req, res) {
        const override = await hasPermission(req.user.sub, "performance.goal.create");
        const goal = await goalService.create(req.body, req.user.sub, override);
        return (0, apiResponse_1.created)(res, goal);
    },
    async update(req, res) {
        const override = await hasPermission(req.user.sub, "performance.goal.update");
        const goal = await goalService.update(req.params.id, req.body, req.user.sub, override);
        return (0, apiResponse_1.ok)(res, goal);
    },
    async remove(req, res) {
        const override = await hasPermission(req.user.sub, "performance.goal.delete");
        await goalService.remove(req.params.id, req.user.sub, override);
        return (0, apiResponse_1.ok)(res, { message: "Goal cancelled." });
    },
    async logProgress(req, res) {
        const override = await hasPermission(req.user.sub, "performance.goal.update");
        const entry = await goalService.logProgress(req.params.id, req.body.value, req.body.note, req.user.sub, override);
        return (0, apiResponse_1.created)(res, entry);
    },
    async progressHistory(req, res) {
        const override = await hasPermission(req.user.sub, "performance.goal.view");
        const history = await goalService.getProgressHistory(req.params.id, req.user.sub, override);
        return (0, apiResponse_1.ok)(res, history);
    },
};
//# sourceMappingURL=GoalController.js.map