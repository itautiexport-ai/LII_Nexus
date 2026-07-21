"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const ReviewService_1 = require("../../application/services/ReviewService");
const MySqlReviewRepository_1 = require("../../infrastructure/repositories/MySqlReviewRepository");
const MySqlGoalRepository_1 = require("../../infrastructure/repositories/MySqlGoalRepository");
const EmployeeScopeService_1 = require("../../application/services/EmployeeScopeService");
const MySqlRoleRepository_1 = require("../../../rbac/infrastructure/repositories/MySqlRoleRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const reviewService = new ReviewService_1.ReviewService(new MySqlReviewRepository_1.MySqlReviewRepository(), new MySqlGoalRepository_1.MySqlGoalRepository(), new EmployeeScopeService_1.EmployeeScopeService());
const roleRepo = new MySqlRoleRepository_1.MySqlRoleRepository();
async function hasPermission(userId, key) {
    const keys = await roleRepo.getPermissionKeysForUser(userId);
    return keys.includes(key);
}
exports.ReviewController = {
    async listMine(req, res) {
        return (0, apiResponse_1.ok)(res, await reviewService.listMine(req.user.sub));
    },
    async listIManage(req, res) {
        return (0, apiResponse_1.ok)(res, await reviewService.listIManage(req.user.sub));
    },
    async listForEmployee(req, res) {
        const override = await hasPermission(req.user.sub, "performance.review.view");
        return (0, apiResponse_1.ok)(res, await reviewService.listForEmployee(req.params.employeeId, req.user.sub, override));
    },
    async getById(req, res) {
        const override = await hasPermission(req.user.sub, "performance.review.view");
        return (0, apiResponse_1.ok)(res, await reviewService.getById(req.params.id, req.user.sub, override));
    },
    async initiate(req, res) {
        const override = await hasPermission(req.user.sub, "performance.review.create");
        return (0, apiResponse_1.created)(res, await reviewService.initiate(req.body.employeeId, req.user.sub, override));
    },
    async submitSelf(req, res) {
        return (0, apiResponse_1.ok)(res, await reviewService.submitSelfAssessment(req.params.id, req.body.selfSummary, req.user.sub));
    },
    async submitManager(req, res) {
        const override = await hasPermission(req.user.sub, "performance.review.manager_submit");
        return (0, apiResponse_1.ok)(res, await reviewService.submitManagerAssessment(req.params.id, req.body, req.user.sub, override));
    },
};
//# sourceMappingURL=ReviewController.js.map