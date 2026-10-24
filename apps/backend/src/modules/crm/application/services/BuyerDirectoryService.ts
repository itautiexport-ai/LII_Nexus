import { BuyerDirectoryRepository, CreateBuyerDirectoryInput, BuyerDirectoryRecord } from "../../infrastructure/repositories/BuyerDirectoryRepository";
import { NotFoundError, ValidationError } from "../../../../core/domain/errors/DomainError";

export class BuyerDirectoryService {
  constructor(private readonly repo: BuyerDirectoryRepository) {}

  async list(search?: string): Promise<BuyerDirectoryRecord[]> {
    return await this.repo.list(search);
  }

  async getById(id: string): Promise<BuyerDirectoryRecord> {
    const record = await this.repo.getById(id);
    if (!record) {
      throw new NotFoundError(`Buyer directory record with id ${id} not found`);
    }
    return record;
  }

  async create(data: CreateBuyerDirectoryInput, userId?: string): Promise<BuyerDirectoryRecord> {
    if (!data.buyer_name || !data.buyer_name.trim()) {
      throw new ValidationError("Buyer name is required");
    }
    return await this.repo.create(data, userId);
  }

  async update(id: string, data: Partial<CreateBuyerDirectoryInput>): Promise<BuyerDirectoryRecord> {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new NotFoundError(`Buyer directory record with id ${id} not found`);
    }
    if (data.buyer_name !== undefined && !data.buyer_name.trim()) {
      throw new ValidationError("Buyer name cannot be empty");
    }
    return await this.repo.update(id, data);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new NotFoundError(`Buyer directory record with id ${id} not found`);
    }
    await this.repo.remove(id);
  }
}
