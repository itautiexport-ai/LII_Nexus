import { IUrlRepository } from "../../domain/repositories/IUrlRepository";
import { EmployeeScopeService } from "../../../performance/application/services/EmployeeScopeService";

export class UrlService {
  constructor(
    private readonly repo: IUrlRepository,
    private readonly scope: EmployeeScopeService
  ) {}

  async create(title: string, url: string, actorUserId: string) {
    const owner = await this.scope.getEmployeeForUser(actorUserId);
    return this.repo.create({ title, url, createdBy: owner?.id ?? null });
  }

  async list() {
    return this.repo.list();
  }

  async remove(id: string) {
    await this.repo.remove(id);
  }
}
