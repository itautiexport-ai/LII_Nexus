import { MySqlMasterDataRepository } from "../../infrastructure/repositories/MySqlMasterDataRepository";

export class MasterDataService {
  constructor(private readonly repo: MySqlMasterDataRepository) {}

  // Wood Types
  async getWoodTypes() {
    return await this.repo.getWoodTypes();
  }

  async createWoodType(name: string) {
    if (!name) throw new Error("Name is required");
    return await this.repo.createWoodType(name);
  }

  async updateWoodType(id: string, name: string, status: string) {
    if (!name) throw new Error("Name is required");
    return await this.repo.updateWoodType(id, name, status);
  }

  async deleteWoodType(id: string) {
    await this.repo.deleteWoodType(id);
  }

  // Priorities
  async getPriorities() {
    return await this.repo.getPriorities();
  }

  async createPriority(name: string, colorCode: string) {
    if (!name || !colorCode) throw new Error("Name and color code are required");
    return await this.repo.createPriority(name, colorCode);
  }

  async updatePriority(id: string, name: string, colorCode: string, status: string) {
    if (!name || !colorCode) throw new Error("Name and color code are required");
    return await this.repo.updatePriority(id, name, colorCode, status);
  }

  async deletePriority(id: string) {
    await this.repo.deletePriority(id);
  }

  // Buyers
  async getBuyers() {
    return await this.repo.getBuyers();
  }

  async createBuyer(name: string) {
    if (!name) throw new Error("Name is required");
    return await this.repo.createBuyer(name);
  }

  async updateBuyer(id: string, name: string) {
    if (!name) throw new Error("Name is required");
    return await this.repo.updateBuyer(id, name);
  }

  async deleteBuyer(id: string) {
    await this.repo.deleteBuyer(id);
  }

  // UOMs
  async getUoms() {
    return await this.repo.getUoms();
  }

  async createUom(name: string) {
    if (!name) throw new Error("Name is required");
    return await this.repo.createUom(name);
  }

  async updateUom(id: string, name: string) {
    if (!name) throw new Error("Name is required");
    return await this.repo.updateUom(id, name);
  }

  async deleteUom(id: string) {
    await this.repo.deleteUom(id);
  }

  // HODs
  async getHods() {
    return await this.repo.getHods();
  }

  async createHod(name: string) {
    if (!name) throw new Error("Name is required");
    return await this.repo.createHod(name);
  }

  async updateHod(id: string, name: string) {
    if (!name) throw new Error("Name is required");
    return await this.repo.updateHod(id, name);
  }

  async deleteHod(id: string) {
    await this.repo.deleteHod(id);
  }

  // Merchants
  async getMerchants() {
    return await this.repo.getMerchants();
  }

  async createMerchant(name: string, status: string = 'active') {
    if (!name) throw new Error("Name is required");
    return await this.repo.createMerchant(name, status);
  }

  async updateMerchant(id: string, name: string, status: string) {
    if (!name) throw new Error("Name is required");
    return await this.repo.updateMerchant(id, name, status);
  }

  async deleteMerchant(id: string) {
    await this.repo.deleteMerchant(id);
  }

  // Finish Codes
  async getFinishCodes() {
    return await this.repo.getFinishCodes();
  }

  async createFinishCode(code: string, name: string) {
    if (!code) throw new Error("Code is required");
    if (!name) throw new Error("Finish Name is required");
    return await this.repo.createFinishCode(code, name);
  }

  async updateFinishCode(id: string, code: string, name: string) {
    if (!code) throw new Error("Code is required");
    if (!name) throw new Error("Finish Name is required");
    return await this.repo.updateFinishCode(id, code, name);
  }

  async deleteFinishCode(id: string) {
    await this.repo.deleteFinishCode(id);
  }
}
