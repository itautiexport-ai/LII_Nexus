import { Response } from "express";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { BuyerDirectoryService } from "../../application/services/BuyerDirectoryService";
import { isSystemAdminUser } from "../../../../shared/middlewares/rbac.middleware";
import { ForbiddenError, UnauthorizedError } from "../../../../core/domain/errors/DomainError";

export class BuyerDirectoryController {
  constructor(private readonly service: BuyerDirectoryService) {}

  async list(req: AuthenticatedRequest, res: Response) {
    const search = req.query.search as string | undefined;
    const items = await this.service.list(search);
    res.json({ success: true, data: items });
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    const item = await this.service.getById(req.params.id);
    res.json({ success: true, data: item });
  }

  async create(req: AuthenticatedRequest, res: Response) {
    const item = await this.service.create(req.body, req.user?.id);
    res.status(201).json({ success: true, data: item });
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const item = await this.service.update(req.params.id, req.body);
    res.json({ success: true, data: item });
  }

  async remove(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError();
    }
    const isSysAdmin = await isSystemAdminUser(userId);
    if (!isSysAdmin) {
      throw new ForbiddenError("Deletion is strictly restricted to System Administrator");
    }
    await this.service.remove(req.params.id);
    res.json({ success: true, message: "Buyer directory record deleted successfully" });
  }
}
