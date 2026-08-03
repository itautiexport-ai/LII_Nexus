import { Response } from "express";
import { DocumentService } from "../../application/services/DocumentService";
import { ExpiryAlertService } from "../../application/services/ExpiryAlertService";
import { MachineProductService } from "../../application/services/MachineProductService";
import { MySqlDocumentRepository } from "../../infrastructure/repositories/MySqlDocumentRepository";
import { MySqlMachineProductRepository } from "../../infrastructure/repositories/MySqlMachineProductRepository";
import { NotificationService } from "../../../notifications/application/services/NotificationService";
import { MySqlNotificationRepository } from "../../../notifications/infrastructure/repositories/MySqlNotificationRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { MySqlRoleRepository } from "../../../rbac/infrastructure/repositories/MySqlRoleRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { DocumentCategory, DocumentStatus, LinkEntityType } from "../../domain/entities/Document";

const repo = new MySqlDocumentRepository();
const scope = new EmployeeScopeService();
const documentService = new DocumentService(repo, scope);
const expiryAlertService = new ExpiryAlertService(repo, new NotificationService(new MySqlNotificationRepository()));
const machineProductService = new MachineProductService(new MySqlMachineProductRepository());
const roleRepo = new MySqlRoleRepository();

async function hasPermission(userId: string, key: string): Promise<boolean> {
  const keys = await roleRepo.getPermissionKeysForUser(userId);
  return keys.includes(key);
}

export const DocumentController = {
  async list(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "document.view.confidential");
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const pageSize = parseInt((req.query.pageSize as string) ?? "20", 10);
    const { items, total } = await documentService.list({
      page, pageSize,
      search: req.query.search as string | undefined,
      category: req.query.category as DocumentCategory | undefined,
      status: req.query.status as DocumentStatus | undefined,
      folderId: req.query.folderId as string | undefined,
      tag: req.query.tag as string | undefined,
      departmentId: req.query.departmentId as string | undefined,
    }, override);
    return ok(res, items, { page, pageSize, totalItems: total });
  },
  async getById(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "document.view.confidential");
    return ok(res, await documentService.getDetail(req.params.id, override));
  },
  async create(req: AuthenticatedRequest, res: Response) {
    return created(res, await documentService.create(req.body, req.user!.sub));
  },
  async update(req: AuthenticatedRequest, res: Response) {
    return ok(res, await documentService.update(req.params.id, req.body, req.user!.sub));
  },
  async remove(req: AuthenticatedRequest, res: Response) {
    await documentService.remove(req.params.id, req.user!.sub);
    return ok(res, { message: "Document deleted." });
  },

  async addVersion(req: AuthenticatedRequest, res: Response) {
    return created(res, await documentService.addVersion(req.params.id, req.body.fileName, req.body.fileUrl, req.body.changeNotes, req.user!.sub));
  },
  async reviewVersion(req: AuthenticatedRequest, res: Response) {
    return ok(res, await documentService.reviewVersion(req.params.id, req.params.versionId, req.body.approve, req.body.rejectionReason, req.user!.sub));
  },

  async setTags(req: AuthenticatedRequest, res: Response) {
    return ok(res, await documentService.setTags(req.params.id, req.body.tags, req.user!.sub));
  },
  async addLink(req: AuthenticatedRequest, res: Response) {
    return created(res, await documentService.addLink(req.params.id, req.body.entityType, req.body.entityId, req.user!.sub));
  },
  async removeLink(req: AuthenticatedRequest, res: Response) {
    await documentService.removeLink(req.params.id, req.params.linkId, req.user!.sub);
    return ok(res, { message: "Link removed." });
  },
  async listForEntity(req: AuthenticatedRequest, res: Response) {
    const override = await hasPermission(req.user!.sub, "document.view.confidential");
    return ok(res, await documentService.listForEntity(req.params.entityType as LinkEntityType, req.params.entityId, override));
  },

  async createFolder(req: AuthenticatedRequest, res: Response) {
    return created(res, await documentService.createFolder(req.body.name, req.body.parentFolderId));
  },
  async listFolders(_req: AuthenticatedRequest, res: Response) {
    return ok(res, await documentService.listFolders());
  },

  async checkExpiries(req: AuthenticatedRequest, res: Response) {
    const withinDays = parseInt((req.query.withinDays as string) ?? "30", 10);
    return ok(res, await expiryAlertService.checkExpiries(withinDays));
  },

  async listMachines(_req: AuthenticatedRequest, res: Response) { return ok(res, await machineProductService.listMachines()); },
  async createMachine(req: AuthenticatedRequest, res: Response) {
    return created(res, await machineProductService.createMachine(req.body.name, req.body.code ?? null, req.body.factoryDepartmentId ?? null, req.user!.sub));
  },
  async updateMachine(req: AuthenticatedRequest, res: Response) {
    return ok(res, await machineProductService.updateMachine(req.params.id, req.body.name, req.body.code ?? null, req.user!.sub));
  },
  async listProducts(_req: AuthenticatedRequest, res: Response) { return ok(res, await machineProductService.listProducts()); },
  async createProduct(req: AuthenticatedRequest, res: Response) {
    return created(res, await machineProductService.createProduct(req.body.name, req.body.sku ?? null, req.user!.sub));
  },
  async updateProduct(req: AuthenticatedRequest, res: Response) {
    return ok(res, await machineProductService.updateProduct(req.params.id, req.body.name, req.body.sku ?? null, req.user!.sub));
  },
};
