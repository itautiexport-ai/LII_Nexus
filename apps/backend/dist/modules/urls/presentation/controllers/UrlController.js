"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlController = exports.createUrlSchema = void 0;
const UrlService_1 = require("../../application/services/UrlService");
const MySqlUrlRepository_1 = require("../../infrastructure/repositories/MySqlUrlRepository");
const EmployeeScopeService_1 = require("../../../performance/application/services/EmployeeScopeService");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const zod_1 = require("zod");
const repo = new MySqlUrlRepository_1.MySqlUrlRepository();
const scope = new EmployeeScopeService_1.EmployeeScopeService();
const urlService = new UrlService_1.UrlService(repo, scope);
exports.createUrlSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    url: zod_1.z.string().url(),
});
exports.UrlController = {
    async create(req, res) {
        const { title, url } = req.body;
        return (0, apiResponse_1.created)(res, await urlService.create(title, url, req.user.sub));
    },
    async list(req, res) {
        return (0, apiResponse_1.ok)(res, await urlService.list());
    },
    async remove(req, res) {
        await urlService.remove(req.params.id);
        return (0, apiResponse_1.ok)(res, { message: "URL removed" });
    }
};
//# sourceMappingURL=UrlController.js.map