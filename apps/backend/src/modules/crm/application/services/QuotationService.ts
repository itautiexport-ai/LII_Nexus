import { ICrmRepository } from "../../domain/repositories/ICrmRepository";
import { CreateQuotationInput, CreateQuotationQuoteInput } from "../dto/quotation.dto";

export class QuotationService {
  constructor(private readonly repo: ICrmRepository) {}

  async listQuotations() {
    return await this.repo.listQuotations();
  }

  async createQuotation(data: CreateQuotationInput) {
    return await this.repo.createQuotation(data);
  }

  async updateStatus(id: string, status: string) {
    await this.repo.updateQuotationStatus(id, status);
  }

  async addQuote(quotationId: string, data: CreateQuotationQuoteInput) {
    return await this.repo.addQuotationQuote({ quotationId, ...data });
  }

  async listQuotes(quotationId: string) {
    return await this.repo.listQuotationQuotes(quotationId);
  }
}
