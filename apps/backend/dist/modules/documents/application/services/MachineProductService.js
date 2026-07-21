"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineProductService = void 0;
const AuditService_1 = require("../../../../shared/services/AuditService");
class MachineProductService {
    constructor(repo) {
        this.repo = repo;
    }
    listMachines() { return this.repo.listMachines(); }
    async createMachine(name, code, factoryDepartmentId, actorId) {
        const machine = await this.repo.createMachine(name, code, factoryDepartmentId);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "MACHINE_CREATED", entityType: "machine", entityId: machine.id, afterState: { name } });
        return machine;
    }
    async updateMachineStatus(id, status, actorId) {
        await this.repo.updateMachineStatus(id, status);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "MACHINE_STATUS_UPDATED", entityType: "machine", entityId: id, afterState: { status } });
    }
    async updateMachine(id, name, code, actorId) {
        const machine = await this.repo.updateMachine(id, name, code);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "MACHINE_UPDATED", entityType: "machine", entityId: machine.id, afterState: { name, code } });
        return machine;
    }
    listProducts() { return this.repo.listProducts(); }
    async createProduct(name, sku, actorId) {
        const product = await this.repo.createProduct(name, sku);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "PRODUCT_CREATED", entityType: "product", entityId: product.id, afterState: { name } });
        return product;
    }
    async updateProductStatus(id, status, actorId) {
        await this.repo.updateProductStatus(id, status);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "PRODUCT_STATUS_UPDATED", entityType: "product", entityId: id, afterState: { status } });
    }
    async updateProduct(id, name, sku, actorId) {
        const product = await this.repo.updateProduct(id, name, sku);
        await AuditService_1.AuditService.record({ actorUserId: actorId, action: "PRODUCT_UPDATED", entityType: "product", entityId: product.id, afterState: { name, sku } });
        return product;
    }
}
exports.MachineProductService = MachineProductService;
//# sourceMappingURL=MachineProductService.js.map