"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentController = void 0;
const DocumentService_1 = require("../../application/services/DocumentService");
const ExpiryAlertService_1 = require("../../application/services/ExpiryAlertService");
const MachineProductService_1 = require("../../application/services/MachineProductService");
const MySqlDocumentRepository_1 = require("../../infrastructure/repositories/MySqlDocumentRepository");
const MySqlMachineProductRepository_1 = require("../../infrastructure/repositories/MySqlMachineProductRepository");
const NotificationService_1 = require("../../../notifications/application/services/NotificationService");
const MySqlNotificationRepository_1 = require("../../../notifications/infrastructure/repositories/MySqlNotificationRepository");
const EmployeeScopeService_1 = require("../../../performance/application/services/EmployeeScopeService");
const MySqlRoleRepository_1 = require("../../../rbac/infrastructure/repositories/MySqlRoleRepository");
const apiResponse_1 = require("../../../../shared/utils/apiResponse");
const repo = new MySqlDocumentRepository_1.MySqlDocumentRepository();
const scope = new EmployeeScopeService_1.EmployeeScopeService();
const documentService = new DocumentService_1.DocumentService(repo, scope);
const expiryAlertService = new ExpiryAlertService_1.ExpiryAlertService(repo, new NotificationService_1.NotificationService(new MySqlNotificationRepository_1.MySqlNotificationRepository()));
const machineProductService = new MachineProductService_1.MachineProductService(new MySqlMachineProductRepository_1.MySqlMachineProductRepository());
const roleRepo = new MySqlRoleRepository_1.MySqlRoleRepository();
async function hasPermission(userId, key) {
    const keys = await roleRepo.getPermissionKeysForUser(userId);
    return keys.includes(key);
}
exports.DocumentController = {
    async list(req, res) {
        const override = await hasPermission(req.user.sub, "document.view.confidential");
        const page = parseInt(req.query.page ?? "1", 10);
        const pageSize = parseInt(req.query.pageSize ?? "20", 10);
        const { items, total } = await documentService.list({
            page, pageSize,
            search: req.query.search,
            category: req.query.category,
            status: req.query.status,
            folderId: req.query.folderId,
            tag: req.query.tag,
            departmentId: req.query.departmentId,
        }, override);
        return (0, apiResponse_1.ok)(res, items, { page, pageSize, totalItems: total });
    },
    async getById(req, res) {
        const override = await hasPermission(req.user.sub, "document.view.confidential");
        return (0, apiResponse_1.ok)(res, await documentService.getDetail(req.params.id, override));
    },
    async create(req, res) {
        return (0, apiResponse_1.created)(res, await documentService.create(req.body, req.user.sub));
    },
    async update(req, res) {
        return (0, apiResponse_1.ok)(res, await documentService.update(req.params.id, req.body, req.user.sub));
    },
    async remove(req, res) {
        await documentService.remove(req.params.id, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Document deleted." });
    },
    async addVersion(req, res) {
        return (0, apiResponse_1.created)(res, await documentService.addVersion(req.params.id, req.body.fileName, req.body.fileUrl, req.body.changeNotes, req.user.sub));
    },
    async reviewVersion(req, res) {
        return (0, apiResponse_1.ok)(res, await documentService.reviewVersion(req.params.id, req.params.versionId, req.body.approve, req.body.rejectionReason, req.user.sub));
    },
    async setTags(req, res) {
        return (0, apiResponse_1.ok)(res, await documentService.setTags(req.params.id, req.body.tags, req.user.sub));
    },
    async addLink(req, res) {
        return (0, apiResponse_1.created)(res, await documentService.addLink(req.params.id, req.body.entityType, req.body.entityId, req.user.sub));
    },
    async removeLink(req, res) {
        await documentService.removeLink(req.params.id, req.params.linkId, req.user.sub);
        return (0, apiResponse_1.ok)(res, { message: "Link removed." });
    },
    async listForEntity(req, res) {
        const override = await hasPermission(req.user.sub, "document.view.confidential");
        return (0, apiResponse_1.ok)(res, await documentService.listForEntity(req.params.entityType, req.params.entityId, override));
    },
    async createFolder(req, res) {
        return (0, apiResponse_1.created)(res, await documentService.createFolder(req.body.name, req.body.parentFolderId));
    },
    async listFolders(_req, res) {
        return (0, apiResponse_1.ok)(res, await documentService.listFolders());
    },
    async checkExpiries(req, res) {
        const withinDays = parseInt(req.query.withinDays ?? "30", 10);
        return (0, apiResponse_1.ok)(res, await expiryAlertService.checkExpiries(withinDays));
    },
    async listMachines(_req, res) { return (0, apiResponse_1.ok)(res, await machineProductService.listMachines()); },
    async createMachine(req, res) {
        return (0, apiResponse_1.created)(res, await machineProductService.createMachine(req.body.name, req.body.code ?? null, req.body.factoryDepartmentId ?? null, req.user.sub));
    },
    async updateMachine(req, res) {
        return (0, apiResponse_1.ok)(res, await machineProductService.updateMachine(req.params.id, req.body.name, req.body.code ?? null, req.user.sub));
    },
    async listProducts(_req, res) { return (0, apiResponse_1.ok)(res, await machineProductService.listProducts()); },
    async createProduct(req, res) {
        return (0, apiResponse_1.created)(res, await machineProductService.createProduct(req.body.name, req.body.sku ?? null, req.user.sub));
    },
    async updateProduct(req, res) {
        return (0, apiResponse_1.ok)(res, await machineProductService.updateProduct(req.params.id, req.body.name, req.body.sku ?? null, req.user.sub));
    },
};
//# sourceMappingURL=DocumentController.js.map