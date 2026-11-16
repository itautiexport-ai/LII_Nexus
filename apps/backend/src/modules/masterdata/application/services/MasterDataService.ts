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

  async createBuyer(name: string, buyerCode?: string | null, aliasName?: string | null) {
    if (!name) throw new Error("Name is required");
    return await this.repo.createBuyer(name, buyerCode, aliasName);
  }

  async updateBuyer(id: string, name: string, buyerCode?: string | null, aliasName?: string | null) {
    if (!name) throw new Error("Name is required");
    return await this.repo.updateBuyer(id, name, buyerCode, aliasName);
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

  // QC Names
  async getQcNames() {
    return await this.repo.getQcNames();
  }

  async createQcName(name: string) {
    if (!name) throw new Error("Name is required");
    return await this.repo.createQcName(name);
  }

  async updateQcName(id: string, name: string) {
    if (!name) throw new Error("Name is required");
    return await this.repo.updateQcName(id, name);
  }

  async deleteQcName(id: string) {
    await this.repo.deleteQcName(id);
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

  // Hardware And Accessories
  async getHardwareAccessories() {
    return await this.repo.getHardwareAccessories();
  }

  async createHardwareAccessory(input: {
    id?: string;
    itemCode: string;
    itemName: string;
    category: string;
    sizeSpec?: string | null;
    materialFinish?: string | null;
    uom: string;
    rate: number;
    status?: string;
  }) {
    if (!input.itemCode?.trim()) throw new Error("Item Code is required");
    if (!input.itemName?.trim()) throw new Error("Item Name is required");
    return await this.repo.createHardwareAccessory({
      ...input,
      itemCode: input.itemCode.trim(),
      itemName: input.itemName.trim(),
    });
  }

  async updateHardwareAccessory(
    id: string,
    input: {
      itemCode: string;
      itemName: string;
      category: string;
      sizeSpec?: string | null;
      materialFinish?: string | null;
      uom: string;
      rate: number;
      status?: string;
    }
  ) {
    if (!input.itemCode?.trim()) throw new Error("Item Code is required");
    if (!input.itemName?.trim()) throw new Error("Item Name is required");
    return await this.repo.updateHardwareAccessory(id, {
      ...input,
      itemCode: input.itemCode.trim(),
      itemName: input.itemName.trim(),
    });
  }

  async deleteHardwareAccessory(id: string) {
    await this.repo.deleteHardwareAccessory(id);
  }

  // Wood Thickness Prices
  async getWoodThicknessPrices() {
    return await this.repo.getWoodThicknessPrices();
  }

  async createWoodThicknessPrice(input: {
    id?: string;
    woodType: string;
    thickness: string;
    thicknessUom: string;
    length: string;
    lengthUom: string;
    ratePerCft: number;
    status?: string;
  }) {
    if (!input.woodType?.trim()) throw new Error("Wood Type is required");
    if (!input.thickness?.trim()) throw new Error("Thickness is required");
    if (!input.length?.trim()) throw new Error("Length is required");
    return await this.repo.createWoodThicknessPrice({
      ...input,
      woodType: input.woodType.trim(),
      thickness: input.thickness.trim(),
      length: input.length.trim(),
    });
  }

  async updateWoodThicknessPrice(
    id: string,
    input: {
      woodType: string;
      thickness: string;
      thicknessUom: string;
      length: string;
      lengthUom: string;
      ratePerCft: number;
      status?: string;
    }
  ) {
    if (!input.woodType?.trim()) throw new Error("Wood Type is required");
    if (!input.thickness?.trim()) throw new Error("Thickness is required");
    if (!input.length?.trim()) throw new Error("Length is required");
    return await this.repo.updateWoodThicknessPrice(id, {
      ...input,
      woodType: input.woodType.trim(),
      thickness: input.thickness.trim(),
      length: input.length.trim(),
    });
  }

  async deleteWoodThicknessPrice(id: string) {
    await this.repo.deleteWoodThicknessPrice(id);
  }

  // Wood Part Names
  async getWoodPartNames() {
    return await this.repo.getWoodPartNames();
  }

  async createWoodPartName(input: { id?: string; partCode: string; partName: string }) {
    if (!input.partName?.trim()) throw new Error("Wood Part Name is required");
    if (!input.partCode?.trim()) throw new Error("Code is required");
    return await this.repo.createWoodPartName({
      id: input.id,
      partCode: input.partCode.trim(),
      partName: input.partName.trim(),
    });
  }

  async updateWoodPartName(id: string, input: { partCode: string; partName: string }) {
    if (!input.partName?.trim()) throw new Error("Wood Part Name is required");
    if (!input.partCode?.trim()) throw new Error("Code is required");
    return await this.repo.updateWoodPartName(id, {
      partCode: input.partCode.trim(),
      partName: input.partName.trim(),
    });
  }

  async deleteWoodPartName(id: string) {
    await this.repo.deleteWoodPartName(id);
  }

  // Additional Costs
  async getAdditionalCosts() {
    return await this.repo.getAdditionalCosts();
  }

  async createAdditionalCost(input: {
    id?: string;
    itemCode: string;
    itemName: string;
    price: number;
    uom?: string;
    status?: string;
  }) {
    if (!input.itemCode?.trim()) throw new Error("Code is required");
    if (!input.itemName?.trim()) throw new Error("Additional Cost Name is required");
    return await this.repo.createAdditionalCost({
      ...input,
      itemCode: input.itemCode.trim(),
      itemName: input.itemName.trim(),
      price: Number(input.price) || 0,
      uom: (input.uom || "").trim(),
    });
  }

  async updateAdditionalCost(
    id: string,
    input: {
      itemCode: string;
      itemName: string;
      price: number;
      uom?: string;
      status?: string;
    }
  ) {
    if (!input.itemCode?.trim()) throw new Error("Code is required");
    if (!input.itemName?.trim()) throw new Error("Additional Cost Name is required");
    return await this.repo.updateAdditionalCost(id, {
      ...input,
      itemCode: input.itemCode.trim(),
      itemName: input.itemName.trim(),
      price: Number(input.price) || 0,
      uom: (input.uom || "").trim(),
    });
  }

  async deleteAdditionalCost(id: string) {
    await this.repo.deleteAdditionalCost(id);
  }

  // MDF Prices
  async getMdfPrices() {
    return await this.repo.getMdfPrices();
  }

  async createMdfPrice(input: {
    id?: string;
    mdfType: string;
    sheetSize: string;
    thickness: string;
    price: number;
    uom?: string;
    status?: string;
  }) {
    if (!input.mdfType?.trim()) throw new Error("MDF Type is required");
    if (!input.thickness?.toString().trim()) throw new Error("Thickness is required");
    return await this.repo.createMdfPrice({
      ...input,
      mdfType: input.mdfType.trim(),
      sheetSize: (input.sheetSize || "").trim(),
      thickness: input.thickness.toString().trim(),
      price: Number(input.price) || 0,
      uom: (input.uom || "").trim(),
    });
  }

  async updateMdfPrice(
    id: string,
    input: {
      mdfType: string;
      sheetSize: string;
      thickness: string;
      price: number;
      uom?: string;
      status?: string;
    }
  ) {
    if (!input.mdfType?.trim()) throw new Error("MDF Type is required");
    if (!input.thickness?.toString().trim()) throw new Error("Thickness is required");
    return await this.repo.updateMdfPrice(id, {
      ...input,
      mdfType: input.mdfType.trim(),
      sheetSize: (input.sheetSize || "").trim(),
      thickness: input.thickness.toString().trim(),
      price: Number(input.price) || 0,
      uom: (input.uom || "").trim(),
    });
  }

  async deleteMdfPrice(id: string) {
    await this.repo.deleteMdfPrice(id);
  }

  // Factories
  async getFactories() {
    return await this.repo.getFactories();
  }

  async createFactory(name: string, code?: string) {
    if (!name || !name.trim()) throw new Error("Factory name is required");
    return await this.repo.createFactory(name, code);
  }

  async updateFactory(id: string, name: string, code?: string, status?: string) {
    if (!name || !name.trim()) throw new Error("Factory name is required");
    return await this.repo.updateFactory(id, name, code, status);
  }

  async deleteFactory(id: string) {
    await this.repo.deleteFactory(id);
  }
}
