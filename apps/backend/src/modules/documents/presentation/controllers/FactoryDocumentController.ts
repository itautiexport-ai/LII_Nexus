import { Request, Response } from "express";
import { FactoryDocumentService } from "../../application/services/FactoryDocumentService";
import { ok, badRequest, notFound } from "../../../../shared/utils/apiResponse";

export class FactoryDocumentController {
  constructor(private service: FactoryDocumentService) {}

  async list(req: Request, res: Response) {
    try {
      const { factoryId, factoryName, search, status } = req.query;
      const data = await this.service.list({
        factoryId: factoryId ? String(factoryId) : undefined,
        factoryName: factoryName ? String(factoryName) : undefined,
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
      });
      return ok(res, data);
    } catch (err: any) {
      return badRequest(res, err.message || "Failed to list factory documents");
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const data = await this.service.getById(req.params.id);
      if (!data) return notFound(res, "Factory document not found");
      return ok(res, data);
    } catch (err: any) {
      return badRequest(res, err.message || "Failed to retrieve factory document");
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await this.service.create({
        factoryId: req.body.factoryId,
        factoryName: req.body.factoryName,
        documentName: req.body.documentName,
        fileName: req.body.fileName,
        fileUrl: req.body.fileUrl,
        fileSize: req.body.fileSize ? Number(req.body.fileSize) : undefined,
        fileType: req.body.fileType,
        description: req.body.description,
        expiryDate: req.body.expiryDate,
        uploadedBy: user?.id || user?.userId || null,
        uploadedByName: user?.fullName || user?.name || user?.username || "Admin",
      });
      return ok(res, data);
    } catch (err: any) {
      return badRequest(res, err.message || "Failed to create factory document");
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = await this.service.update(req.params.id, req.body);
      if (!data) return notFound(res, "Factory document not found");
      return ok(res, data);
    } catch (err: any) {
      return badRequest(res, err.message || "Failed to update factory document");
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const deleted = await this.service.delete(req.params.id);
      if (!deleted) return notFound(res, "Factory document not found or already deleted");
      return ok(res, { success: true });
    } catch (err: any) {
      return badRequest(res, err.message || "Failed to delete factory document");
    }
  }
}
