import {
  MySqlFactoryDocumentRepository,
  FactoryDocumentEntity,
} from "../../infrastructure/repositories/MySqlFactoryDocumentRepository";

export class FactoryDocumentService {
  constructor(private repo: MySqlFactoryDocumentRepository) {}

  async list(filters: {
    factoryId?: string;
    factoryName?: string;
    search?: string;
    status?: string;
  }): Promise<FactoryDocumentEntity[]> {
    return await this.repo.list(filters);
  }

  async getById(id: string): Promise<FactoryDocumentEntity | null> {
    return await this.repo.getById(id);
  }

  async create(data: {
    factoryId: string;
    factoryName: string;
    documentName: string;
    fileName: string;
    fileUrl: string;
    fileSize?: number | null;
    fileType?: string | null;
    description?: string | null;
    expiryDate?: string | null;
    uploadedBy?: string | null;
    uploadedByName?: string | null;
  }): Promise<FactoryDocumentEntity> {
    if (!data.factoryId || !data.factoryName) {
      throw new Error("Factory is required");
    }
    if (!data.documentName || !data.documentName.trim()) {
      throw new Error("Document Name is required");
    }
    if (!data.fileUrl || !data.fileName) {
      throw new Error("Uploaded file is required");
    }

    return await this.repo.create({
      ...data,
      documentName: data.documentName.trim(),
      description: data.description ? data.description.trim() : null,
      expiryDate: data.expiryDate ? data.expiryDate.trim() : null,
    });
  }

  async update(
    id: string,
    data: Partial<{
      factoryId: string;
      factoryName: string;
      documentName: string;
      description: string | null;
      expiryDate: string | null;
      status: "active" | "archived";
    }>
  ): Promise<FactoryDocumentEntity | null> {
    return await this.repo.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return await this.repo.delete(id);
  }
}
