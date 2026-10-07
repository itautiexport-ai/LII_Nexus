import { v4 as uuidv4 } from "uuid";
import { MySqlCostingRepository } from "../../infrastructure/MySqlCostingRepository";
import { CostEstimation, CostEstimationItem, CostRateMaster } from "../../domain/CostEstimation";
import { CreateCostEstimationDto, UpdateCostEstimationDto, SaveCostRateDto } from "../dto/costing.dto";

export class CostingService {
  constructor(private repo: MySqlCostingRepository = new MySqlCostingRepository()) {}

  private calculateTotals(items: { category: string; quantity: number; unit_cost: number }[], marginPct: number = 20, taxPct: number = 18) {
    let totalMaterial = 0;
    let totalLabor = 0;
    let totalOverhead = 0;
    let totalFinishing = 0;
    let totalPackaging = 0;

    const processedItems = items.map((item) => {
      const qty = Number(item.quantity) || 0;
      const uCost = Number(item.unit_cost) || 0;
      const totalCost = Number((qty * uCost).toFixed(2));

      switch (item.category) {
        case "Raw Material":
        case "Hardware":
          totalMaterial += totalCost;
          break;
        case "Labor":
          totalLabor += totalCost;
          break;
        case "Finishing":
          totalFinishing += totalCost;
          break;
        case "Packaging":
          totalPackaging += totalCost;
          break;
        case "Overhead":
        case "Other":
          totalOverhead += totalCost;
          break;
        default:
          totalMaterial += totalCost;
          break;
      }

      return {
        ...item,
        quantity: qty,
        unit_cost: uCost,
        total_cost: totalCost,
      };
    });

    const subtotalCost = Number((totalMaterial + totalLabor + totalOverhead + totalFinishing + totalPackaging).toFixed(2));
    const marginAmount = Number(((subtotalCost * marginPct) / 100).toFixed(2));
    const priceBeforeTax = subtotalCost + marginAmount;
    const taxAmount = Number(((priceBeforeTax * taxPct) / 100).toFixed(2));
    const finalPrice = Number((priceBeforeTax + taxAmount).toFixed(2));

    return {
      processedItems,
      totalMaterial: Number(totalMaterial.toFixed(2)),
      totalLabor: Number(totalLabor.toFixed(2)),
      totalOverhead: Number(totalOverhead.toFixed(2)),
      totalFinishing: Number(totalFinishing.toFixed(2)),
      totalPackaging: Number(totalPackaging.toFixed(2)),
      subtotalCost,
      marginAmount,
      taxAmount,
      finalPrice,
    };
  }

  async getSummary() {
    return this.repo.getSummary();
  }

  async getAllEstimations(search?: string, status?: string) {
    return this.repo.findAllEstimations(search, status);
  }

  async getEstimationById(id: string) {
    return this.repo.findEstimationById(id);
  }

  async createEstimation(dto: CreateCostEstimationDto, userId?: string): Promise<CostEstimation> {
    const id = uuidv4();
    const estimationNumber = await this.repo.generateEstimationNumber();

    const marginPct = dto.margin_percentage ?? 20;
    const taxPct = dto.tax_percentage ?? 18;

    const calc = this.calculateTotals(dto.items, marginPct, taxPct);

    const estimation: CostEstimation = {
      id,
      estimation_number: estimationNumber,
      title: dto.title || dto.product_name || "Untitled Product",
      product_code: dto.product_code,
      product_name: dto.product_name,
      overall_size: dto.overall_size,
      wood_type: dto.wood_type,
      client_name: dto.client_name,
      crm_lead_id: dto.crm_lead_id,
      status: "Draft",
      currency: dto.currency || "INR",
      exchange_rate: dto.exchange_rate || 1.0,
      total_material_cost: calc.totalMaterial,
      total_labor_cost: calc.totalLabor,
      total_overhead_cost: calc.totalOverhead,
      total_finishing_cost: calc.totalFinishing,
      total_packaging_cost: calc.totalPackaging,
      subtotal_cost: calc.subtotalCost,
      margin_percentage: marginPct,
      margin_amount: calc.marginAmount,
      tax_percentage: taxPct,
      tax_amount: calc.taxAmount,
      final_price: calc.finalPrice,
      notes: dto.notes,
      created_by: userId,
    };

    const itemsToSave: CostEstimationItem[] = calc.processedItems.map((item: any) => ({
      id: uuidv4(),
      estimation_id: id,
      category: item.category,
      item_name: item.item_name,
      specification: item.specification,
      quantity: item.quantity,
      unit_of_measure: item.unit_of_measure || "Pcs",
      unit_cost: item.unit_cost,
      total_cost: item.total_cost,
      remarks: item.remarks,
    }));

    return this.repo.createEstimation(estimation, itemsToSave);
  }

  async updateEstimation(id: string, dto: UpdateCostEstimationDto): Promise<CostEstimation | null> {
    const existing = await this.repo.findEstimationById(id);
    if (!existing) return null;

    let itemsToSave: CostEstimationItem[] | undefined;
    let updatedEstimationData: Partial<CostEstimation> = {
      title: dto.title || dto.product_name,
      product_code: dto.product_code,
      product_name: dto.product_name,
      overall_size: dto.overall_size,
      wood_type: dto.wood_type,
      client_name: dto.client_name,
      crm_lead_id: dto.crm_lead_id,
      status: dto.status,
      currency: dto.currency,
      exchange_rate: dto.exchange_rate,
      margin_percentage: dto.margin_percentage,
      tax_percentage: dto.tax_percentage,
      notes: dto.notes,
    };

    if (dto.items) {
      const marginPct = dto.margin_percentage ?? existing.margin_percentage;
      const taxPct = dto.tax_percentage ?? existing.tax_percentage;
      const calc = this.calculateTotals(dto.items, marginPct, taxPct);

      updatedEstimationData = {
        ...updatedEstimationData,
        total_material_cost: calc.totalMaterial,
        total_labor_cost: calc.totalLabor,
        total_overhead_cost: calc.totalOverhead,
        total_finishing_cost: calc.totalFinishing,
        total_packaging_cost: calc.totalPackaging,
        subtotal_cost: calc.subtotalCost,
        margin_amount: calc.marginAmount,
        tax_amount: calc.taxAmount,
        final_price: calc.finalPrice,
      };

      itemsToSave = calc.processedItems.map((item: any) => ({
        id: item.id || uuidv4(),
        estimation_id: id,
        category: item.category,
        item_name: item.item_name,
        specification: item.specification,
        quantity: item.quantity,
        unit_of_measure: item.unit_of_measure || "Pcs",
        unit_cost: item.unit_cost,
        total_cost: item.total_cost,
        remarks: item.remarks,
      }));
    }

    return this.repo.updateEstimation(id, updatedEstimationData, itemsToSave);
  }

  async deleteEstimation(id: string): Promise<boolean> {
    return this.repo.deleteEstimation(id);
  }

  async getAllRates() {
    return this.repo.findAllRates();
  }

  async saveRate(dto: SaveCostRateDto): Promise<CostRateMaster> {
    const rateItem: CostRateMaster = {
      id: dto.id || uuidv4(),
      item_name: dto.item_name,
      category: dto.category,
      unit_of_measure: dto.unit_of_measure || "Pcs",
      rate: Number(dto.rate) || 0,
      effective_date: dto.effective_date,
    };
    return this.repo.saveRate(rateItem);
  }

  async deleteRate(id: string): Promise<boolean> {
    return this.repo.deleteRate(id);
  }
}
