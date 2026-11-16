import { Request, Response } from "express";
import * as XLSX from "xlsx";
import { MasterDataService } from "../../application/services/MasterDataService";

export class MasterDataController {
  constructor(private readonly service: MasterDataService) {}

  // Wood Types
  async getWoodTypes(req: Request, res: Response) {
    const data = await this.service.getWoodTypes();
    res.json({ success: true, data });
  }

  async createWoodType(req: Request, res: Response) {
    const data = await this.service.createWoodType(req.body.name);
    res.json({ success: true, data });
  }

  async updateWoodType(req: Request, res: Response) {
    const data = await this.service.updateWoodType(req.params.id, req.body.name, req.body.status);
    res.json({ success: true, data });
  }

  async deleteWoodType(req: Request, res: Response) {
    await this.service.deleteWoodType(req.params.id);
    res.json({ success: true });
  }

  // Priorities
  async getPriorities(req: Request, res: Response) {
    const data = await this.service.getPriorities();
    res.json({ success: true, data });
  }

  async createPriority(req: Request, res: Response) {
    const data = await this.service.createPriority(req.body.name, req.body.colorCode);
    res.json({ success: true, data });
  }

  async updatePriority(req: Request, res: Response) {
    const data = await this.service.updatePriority(req.params.id, req.body.name, req.body.colorCode, req.body.status);
    res.json({ success: true, data });
  }

  async deletePriority(req: Request, res: Response) {
    await this.service.deletePriority(req.params.id);
    res.json({ success: true });
  }

  // Buyers
  async getBuyers(req: Request, res: Response) {
    const data = await this.service.getBuyers();
    res.json({ success: true, data });
  }

  async createBuyer(req: Request, res: Response) {
    const name = req.body.name;
    const buyerCode = req.body.buyer_code || req.body.buyerCode || null;
    const aliasName = req.body.alias_name || req.body.aliasName || null;
    const data = await this.service.createBuyer(name, buyerCode, aliasName);
    res.json({ success: true, data });
  }

  async updateBuyer(req: Request, res: Response) {
    const name = req.body.name;
    const buyerCode = req.body.buyer_code !== undefined ? req.body.buyer_code : (req.body.buyerCode !== undefined ? req.body.buyerCode : null);
    const aliasName = req.body.alias_name !== undefined ? req.body.alias_name : (req.body.aliasName !== undefined ? req.body.aliasName : null);
    const data = await this.service.updateBuyer(req.params.id, name, buyerCode, aliasName);
    res.json({ success: true, data });
  }

  async deleteBuyer(req: Request, res: Response) {
    await this.service.deleteBuyer(req.params.id);
    res.json({ success: true });
  }

  async importBuyers(req: Request, res: Response) {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }
    
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let count = 0;
    for (const row of data as any[]) {
      const name = row["Name"] || row["name"] || row["Buyer Name"] || row["buyer_name"];
      const buyerCode = row["Buyer Code"] || row["buyer_code"] || row["Code"] || row["code"] || null;
      const aliasName = row["Alias Name"] || row["alias_name"] || row["Alias"] || row["alias"] || null;
      if (name) {
        await this.service.createBuyer(name, buyerCode, aliasName);
        count++;
      }
    }
    res.json({ success: true, count });
  }

  // UOMs
  async getUoms(_req: Request, res: Response) {
    const data = await this.service.getUoms();
    res.json({ success: true, data });
  }

  async createUom(req: Request, res: Response) {
    const data = await this.service.createUom(req.body.name);
    res.json({ success: true, data });
  }

  async updateUom(req: Request, res: Response) {
    const data = await this.service.updateUom(req.params.id, req.body.name);
    res.json({ success: true, data });
  }

  async deleteUom(req: Request, res: Response) {
    await this.service.deleteUom(req.params.id);
    res.json({ success: true });
  }

  // HODs
  async getHods(_req: Request, res: Response) {
    const data = await this.service.getHods();
    res.json({ success: true, data });
  }

  async createHod(req: Request, res: Response) {
    const data = await this.service.createHod(req.body.name);
    res.json({ success: true, data });
  }

  async updateHod(req: Request, res: Response) {
    const data = await this.service.updateHod(req.params.id, req.body.name);
    res.json({ success: true, data });
  }

  async deleteHod(req: Request, res: Response) {
    await this.service.deleteHod(req.params.id);
    res.json({ success: true });
  }

  // QC Names
  async getQcNames(_req: Request, res: Response) {
    const data = await this.service.getQcNames();
    res.json({ success: true, data });
  }

  async createQcName(req: Request, res: Response) {
    const data = await this.service.createQcName(req.body.name);
    res.json({ success: true, data });
  }

  async updateQcName(req: Request, res: Response) {
    const data = await this.service.updateQcName(req.params.id, req.body.name);
    res.json({ success: true, data });
  }

  async deleteQcName(req: Request, res: Response) {
    await this.service.deleteQcName(req.params.id);
    res.json({ success: true });
  }

  // Merchants
  async getMerchants(_req: Request, res: Response) {
    const data = await this.service.getMerchants();
    res.json({ success: true, data });
  }

  async createMerchant(req: Request, res: Response) {
    const data = await this.service.createMerchant(req.body.name, req.body.status);
    res.json({ success: true, data });
  }

  async updateMerchant(req: Request, res: Response) {
    const data = await this.service.updateMerchant(req.params.id, req.body.name, req.body.status);
    res.json({ success: true, data });
  }

  async deleteMerchant(req: Request, res: Response) {
    await this.service.deleteMerchant(req.params.id);
    res.json({ success: true });
  }

  // Finish Codes
  async getFinishCodes(req: Request, res: Response) {
    const data = await this.service.getFinishCodes();
    res.json({ success: true, data });
  }

  async createFinishCode(req: Request, res: Response) {
    const data = await this.service.createFinishCode(req.body.code, req.body.name);
    res.json({ success: true, data });
  }

  async updateFinishCode(req: Request, res: Response) {
    const data = await this.service.updateFinishCode(req.params.id, req.body.code, req.body.name);
    res.json({ success: true, data });
  }

  async deleteFinishCode(req: Request, res: Response) {
    await this.service.deleteFinishCode(req.params.id);
    res.json({ success: true });
  }

  // Hardware And Accessories
  async getHardwareAccessories(_req: Request, res: Response) {
    const data = await this.service.getHardwareAccessories();
    res.json({ success: true, data });
  }

  async createHardwareAccessory(req: Request, res: Response) {
    const data = await this.service.createHardwareAccessory({
      id: req.body.id,
      itemCode: req.body.itemCode ?? req.body.item_code,
      itemName: req.body.itemName ?? req.body.item_name,
      category: req.body.category || "Hardware",
      sizeSpec: req.body.sizeSpec ?? req.body.size_spec ?? null,
      materialFinish: req.body.materialFinish ?? req.body.material_finish ?? null,
      uom: req.body.uom || "Pc",
      rate: Number(req.body.rate ?? 0),
      status: req.body.status || "active",
    });
    res.json({ success: true, data });
  }

  async updateHardwareAccessory(req: Request, res: Response) {
    const data = await this.service.updateHardwareAccessory(req.params.id, {
      itemCode: req.body.itemCode ?? req.body.item_code,
      itemName: req.body.itemName ?? req.body.item_name,
      category: req.body.category || "Hardware",
      sizeSpec: req.body.sizeSpec ?? req.body.size_spec ?? null,
      materialFinish: req.body.materialFinish ?? req.body.material_finish ?? null,
      uom: req.body.uom || "Pc",
      rate: Number(req.body.rate ?? 0),
      status: req.body.status || "active",
    });
    res.json({ success: true, data });
  }

  async deleteHardwareAccessory(req: Request, res: Response) {
    await this.service.deleteHardwareAccessory(req.params.id);
    res.json({ success: true });
  }

  // Wood Thickness Prices
  async getWoodThicknessPrices(_req: Request, res: Response) {
    const data = await this.service.getWoodThicknessPrices();
    res.json({ success: true, data });
  }

  async createWoodThicknessPrice(req: Request, res: Response) {
    const data = await this.service.createWoodThicknessPrice({
      id: req.body.id,
      woodType: req.body.woodType ?? req.body.wood_type,
      thickness: String(req.body.thickness ?? ""),
      thicknessUom: req.body.thicknessUom ?? req.body.thickness_uom ?? "inch",
      length: String(req.body.length ?? ""),
      lengthUom: req.body.lengthUom ?? req.body.length_uom ?? "feet",
      ratePerCft: Number(req.body.ratePerCft ?? req.body.rate_per_cft ?? 0),
      status: req.body.status || "active",
    });
    res.json({ success: true, data });
  }

  async updateWoodThicknessPrice(req: Request, res: Response) {
    const data = await this.service.updateWoodThicknessPrice(req.params.id, {
      woodType: req.body.woodType ?? req.body.wood_type,
      thickness: String(req.body.thickness ?? ""),
      thicknessUom: req.body.thicknessUom ?? req.body.thickness_uom ?? "inch",
      length: String(req.body.length ?? ""),
      lengthUom: req.body.lengthUom ?? req.body.length_uom ?? "feet",
      ratePerCft: Number(req.body.ratePerCft ?? req.body.rate_per_cft ?? 0),
      status: req.body.status || "active",
    });
    res.json({ success: true, data });
  }

  async deleteWoodThicknessPrice(req: Request, res: Response) {
    await this.service.deleteWoodThicknessPrice(req.params.id);
    res.json({ success: true });
  }

  // Wood Part Names
  async getWoodPartNames(_req: Request, res: Response) {
    const data = await this.service.getWoodPartNames();
    res.json({ success: true, data });
  }

  async createWoodPartName(req: Request, res: Response) {
    const data = await this.service.createWoodPartName({
      id: req.body.id,
      partCode: req.body.partCode ?? req.body.part_code ?? req.body.code,
      partName: req.body.partName ?? req.body.part_name ?? req.body.name,
    });
    res.json({ success: true, data });
  }

  async updateWoodPartName(req: Request, res: Response) {
    const data = await this.service.updateWoodPartName(req.params.id, {
      partCode: req.body.partCode ?? req.body.part_code ?? req.body.code,
      partName: req.body.partName ?? req.body.part_name ?? req.body.name,
    });
    res.json({ success: true, data });
  }

  async deleteWoodPartName(req: Request, res: Response) {
    await this.service.deleteWoodPartName(req.params.id);
    res.json({ success: true });
  }

  // Additional Costs
  async getAdditionalCosts(_req: Request, res: Response) {
    const data = await this.service.getAdditionalCosts();
    res.json({ success: true, data });
  }

  async createAdditionalCost(req: Request, res: Response) {
    const data = await this.service.createAdditionalCost({
      id: req.body.id,
      itemCode: req.body.itemCode ?? req.body.item_code ?? req.body.code,
      itemName: req.body.itemName ?? req.body.item_name ?? req.body.name,
      price: Number(req.body.price ?? req.body.rate ?? 0),
      uom: req.body.uom ?? req.body.unit_of_measure ?? "",
      status: req.body.status || "active",
    });
    res.json({ success: true, data });
  }

  async updateAdditionalCost(req: Request, res: Response) {
    const data = await this.service.updateAdditionalCost(req.params.id, {
      itemCode: req.body.itemCode ?? req.body.item_code ?? req.body.code,
      itemName: req.body.itemName ?? req.body.item_name ?? req.body.name,
      price: Number(req.body.price ?? req.body.rate ?? 0),
      uom: req.body.uom ?? req.body.unit_of_measure ?? "",
      status: req.body.status || "active",
    });
    res.json({ success: true, data });
  }

  async deleteAdditionalCost(req: Request, res: Response) {
    await this.service.deleteAdditionalCost(req.params.id);
    res.json({ success: true });
  }

  // MDF Prices
  async getMdfPrices(_req: Request, res: Response) {
    const data = await this.service.getMdfPrices();
    res.json({ success: true, data });
  }

  async createMdfPrice(req: Request, res: Response) {
    const data = await this.service.createMdfPrice({
      id: req.body.id,
      mdfType: req.body.mdfType ?? req.body.mdf_type ?? "",
      sheetSize: req.body.sheetSize ?? req.body.sheet_size ?? "",
      thickness: String(req.body.thickness ?? ""),
      price: Number(req.body.price ?? req.body.rate ?? 0),
      uom: req.body.uom ?? req.body.unit_of_measure ?? "",
      status: req.body.status || "active",
    });
    res.json({ success: true, data });
  }

  async updateMdfPrice(req: Request, res: Response) {
    const data = await this.service.updateMdfPrice(req.params.id, {
      mdfType: req.body.mdfType ?? req.body.mdf_type ?? "",
      sheetSize: req.body.sheetSize ?? req.body.sheet_size ?? "",
      thickness: String(req.body.thickness ?? ""),
      price: Number(req.body.price ?? req.body.rate ?? 0),
      uom: req.body.uom ?? req.body.unit_of_measure ?? "",
      status: req.body.status || "active",
    });
    res.json({ success: true, data });
  }

  async deleteMdfPrice(req: Request, res: Response) {
    await this.service.deleteMdfPrice(req.params.id);
    res.json({ success: true });
  }

  // Factories
  async getFactories(_req: Request, res: Response) {
    const data = await this.service.getFactories();
    res.json({ success: true, data });
  }

  async createFactory(req: Request, res: Response) {
    const data = await this.service.createFactory(req.body.name, req.body.code);
    res.json({ success: true, data });
  }

  async updateFactory(req: Request, res: Response) {
    const data = await this.service.updateFactory(
      req.params.id,
      req.body.name,
      req.body.code,
      req.body.status
    );
    res.json({ success: true, data });
  }

  async deleteFactory(req: Request, res: Response) {
    await this.service.deleteFactory(req.params.id);
    res.json({ success: true });
  }
}
