import { MySqlMachineProductRepository } from "../../infrastructure/repositories/MySqlMachineProductRepository";
import { MasterStatus } from "../../domain/entities/Document";
import { AuditService } from "../../../../shared/services/AuditService";

export class MachineProductService {
  constructor(private readonly repo: MySqlMachineProductRepository) {}

  listMachines() { return this.repo.listMachines(); }
  async createMachine(name: string, code: string | null, factoryDepartmentId: string | null, actorId: string) {
    const machine = await this.repo.createMachine(name, code, factoryDepartmentId);
    await AuditService.record({ actorUserId: actorId, action: "MACHINE_CREATED", entityType: "machine", entityId: machine.id, afterState: { name } });
    return machine;
  }
  async updateMachineStatus(id: string, status: MasterStatus, actorId: string) {
    await this.repo.updateMachineStatus(id, status);
    await AuditService.record({ actorUserId: actorId, action: "MACHINE_STATUS_UPDATED", entityType: "machine", entityId: id, afterState: { status } });
  }
  async updateMachine(id: string, name: string, code: string | null, actorId: string) {
    const machine = await this.repo.updateMachine(id, name, code);
    await AuditService.record({ actorUserId: actorId, action: "MACHINE_UPDATED", entityType: "machine", entityId: machine.id, afterState: { name, code } });
    return machine;
  }

  listProducts() { return this.repo.listProducts(); }
  async createProduct(name: string, sku: string | null, actorId: string) {
    const product = await this.repo.createProduct(name, sku);
    await AuditService.record({ actorUserId: actorId, action: "PRODUCT_CREATED", entityType: "product", entityId: product.id, afterState: { name } });
    return product;
  }
  async updateProductStatus(id: string, status: MasterStatus, actorId: string) {
    await this.repo.updateProductStatus(id, status);
    await AuditService.record({ actorUserId: actorId, action: "PRODUCT_STATUS_UPDATED", entityType: "product", entityId: id, afterState: { status } });
  }
  async updateProduct(id: string, name: string, sku: string | null, actorId: string) {
    const product = await this.repo.updateProduct(id, name, sku);
    await AuditService.record({ actorUserId: actorId, action: "PRODUCT_UPDATED", entityType: "product", entityId: product.id, afterState: { name, sku } });
    return product;
  }
}
