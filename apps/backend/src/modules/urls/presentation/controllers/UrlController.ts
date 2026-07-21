import { Response } from "express";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { UrlService } from "../../application/services/UrlService";
import { MySqlUrlRepository } from "../../infrastructure/repositories/MySqlUrlRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { z } from "zod";
import { ValidationError } from "../../../../core/domain/errors/DomainError";

const repo = new MySqlUrlRepository();
const scope = new EmployeeScopeService();
const urlService = new UrlService(repo, scope);

export const createUrlSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
});

export const UrlController = {
  async create(req: AuthenticatedRequest, res: Response) {
    const { title, url } = req.body;
    return created(res, await urlService.create(title, url, req.user!.sub));
  },
  
  async list(req: AuthenticatedRequest, res: Response) {
    return ok(res, await urlService.list());
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    await urlService.remove(req.params.id);
    return ok(res, { message: "URL removed" });
  }
};
