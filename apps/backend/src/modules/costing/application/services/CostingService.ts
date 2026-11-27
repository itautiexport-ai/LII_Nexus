import { v4 as uuidv4 } from "uuid";
import { MySqlCostingRepository } from "../../infrastructure/MySqlCostingRepository";
import { CostEstimation, CostEstimationItem, CostRateMaster, CostingRequestBunch, CostingRequestItem } from "../../domain/CostEstimation";
import { CreateCostEstimationDto, UpdateCostEstimationDto, SaveCostRateDto, CreateCostingRequestBunchDto } from "../dto/costing.dto";
import { pool } from '../../../../infrastructure/database/mysql/connection';
import { ForbiddenError, ValidationError } from '../../../../core/domain/errors/DomainError';

export class CostingService {
  constructor(private repo: MySqlCostingRepository = new MySqlCostingRepository()) {}

  async getApprovalAuthorities(): Promise<Array<{id: string; fullName: string; designationTitle: string}>> {
    const [rows] = await pool.query<any[]>(`SELECT id, full_name FROM users
      WHERE deleted_at IS NULL AND status='active'
        AND LOWER(TRIM(full_name)) IN ('ravi utmani','raj utmani') ORDER BY full_name`);
    // Fail closed if a name is ambiguous; never invent placeholder accounts.
    return rows.filter(r => rows.filter(x => x.full_name.trim().toLowerCase() === r.full_name.trim().toLowerCase()).length === 1)
      .map(r => ({ id: r.id, fullName: r.full_name, designationTitle: 'Approval authority' }));
  }

  private validateFormData(value: unknown) {
    if (value === undefined) return;
    if (typeof value !== 'string' || Buffer.byteLength(value) > 90000) throw new ValidationError('Invalid or oversized costing form data.');
    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw Error();
    } catch { throw new ValidationError('Costing form_data must contain a JSON object.'); }
  }

  /**
   * Wood CFT formula: ((Length * Width * Thickness * Pcs) / 144)
   */
  public calculateWoodCft(
    length: number,
    width: number,
    thickness: number,
    pcs: number,
    rate: number = 0
  ) {
    const l = Number(length) || 0;
    const w = Number(width) || 0;
    const t = Number(thickness) || 0;
    const p = Number(pcs) || 0;
    const r = Number(rate) || 0;

    const cftRaw = (l * w * t * p) / 144;
    const cft = Number(cftRaw.toFixed(4));
    const amount = Number((cftRaw * r).toFixed(2));

    return {
      cft,
      cftRounded: Number(cftRaw.toFixed(3)),
      amount,
    };
  }

  private calculateTotals(
    items: {
      category: string;
      quantity: number;
      unit_cost: number;
      unit_of_measure?: string;
      length_ft?: number;
      width_in?: number;
      thick_in?: number;
      pcs?: number;
      specification?: string;
      remarks?: string;
    }[],
    marginPct: number = 20,
    taxPct: number = 18
  ) {
    let totalMaterial = 0;
    let totalLabor = 0;
    let totalOverhead = 0;
    let totalFinishing = 0;
    let totalPackaging = 0;

    const processedItems = items.map((item) => {
      const uCost = Number(item.unit_cost) || 0;
      const hasWoodDimensions =
        item.unit_of_measure === "Cft" &&
        (item.length_ft !== undefined ||
          item.width_in !== undefined ||
          item.thick_in !== undefined ||
          item.pcs !== undefined);

      let qty = Number(item.quantity) || 0;
      let totalCost = Number((qty * uCost).toFixed(2));

      if (hasWoodDimensions) {
        const woodCalc = this.calculateWoodCft(
          Number(item.length_ft) || 0,
          Number(item.width_in) || 0,
          Number(item.thick_in) || 0,
          Number(item.pcs) || 0,
          uCost
        );
        qty = woodCalc.cftRounded;
        totalCost = woodCalc.amount;
      }

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
    this.validateFormData(dto.form_data);
    const id = uuidv4();

    const marginPct = dto.margin_percentage ?? 26;
    const taxPct = dto.tax_percentage ?? 18;

    const calc = this.calculateTotals(dto.items, marginPct, taxPct);

    const estimation: CostEstimation = {
      id,
      estimation_number: "", // Allocated atomically with the repository insert.
      title: dto.title || dto.product_name || "Untitled Product",
      product_code: dto.product_code,
      product_name: dto.product_name,
      product_type: dto.product_type,
      collection_name: dto.collection_name,
      type_of_costing: dto.type_of_costing,
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
      form_data: dto.form_data,
      costing_request_item_id: dto.costing_request_item_id,
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

  async updateEstimation(id: string, dto: UpdateCostEstimationDto, actorUserId?: string): Promise<CostEstimation | null> {
    const existing = await this.repo.findEstimationById(id);
    if (!existing) return null;
    this.validateFormData(dto.form_data);
    if (dto.status !== undefined && !['Draft','In Review','Approved','Rejected'].includes(dto.status)) throw new ValidationError('Invalid costing status.');
    const authorities = await this.getApprovalAuthorities();
    const actorCanApprove = authorities.some(a => a.id === actorUserId);
    if ((dto.status === 'Approved' || dto.status === 'Rejected') && !actorCanApprove) {
      throw new ForbiddenError('Only Ravi Utmani or Raj Utmani can approve or reject costing.');
    }
    if (['Approved','Rejected'].includes(existing.status) && !actorCanApprove && Object.keys(dto).some(k => k !== 'notes')) {
      throw new ForbiddenError('Only Ravi Utmani or Raj Utmani can modify finalized costing.');
    }
    const authorityId = dto.approval_authority_id ?? existing.approval_authority_id;
    if (((dto.status === 'In Review' && existing.status !== 'In Review') || dto.approval_authority_id !== undefined) && !authorities.some(a => a.id === authorityId)) {
      throw new ValidationError('Select an active Ravi Utmani or Raj Utmani account for approval.');
    }

    let itemsToSave: CostEstimationItem[] | undefined;
    let updatedEstimationData: Partial<CostEstimation> = {
      title: dto.title || dto.product_name,
      product_code: dto.product_code,
      product_name: dto.product_name,
      product_type: dto.product_type,
      collection_name: dto.collection_name,
      type_of_costing: dto.type_of_costing,
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
      costing_request_item_id: dto.costing_request_item_id,
      ...(dto.form_data !== undefined ? { form_data: dto.form_data } : {}),
      ...(dto.approval_authority_id !== undefined ? { approval_authority_id: dto.approval_authority_id } : {}),
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

  // Costing Request Bunches & Items
  async createRequestBunch(dto: CreateCostingRequestBunchDto, userId?: string): Promise<CostingRequestBunch> {
    if (!dto.merchant_name || !dto.merchant_name.trim()) {
      throw new Error("Merchant name is required");
    }
    if (!dto.items || dto.items.length === 0) {
      throw new Error("At least one product item is required in the costing request");
    }
    return this.repo.createBunchWithItems(
      {
        merchant_id: userId,
        merchant_name: dto.merchant_name.trim(),
        client_name: dto.client_name?.trim(),
        notes: dto.notes?.trim(),
        priority: dto.priority || 'Normal',
      },
      dto.items
    );
  }

  async listBunches(search?: string, status?: string, merchant?: string): Promise<CostingRequestBunch[]> {
    return this.repo.findBunches(search, status, merchant);
  }

  async getBunchById(id: string): Promise<CostingRequestBunch | null> {
    return this.repo.findBunchById(id);
  }

  async listRequestItems(search?: string, stage?: string, priority?: string, bunchCode?: string, merchant?: string): Promise<CostingRequestItem[]> {
    return this.repo.findRequestItems(search, stage, priority, bunchCode, merchant);
  }

  async getRequestItemById(id: string): Promise<CostingRequestItem | null> {
    return this.repo.findRequestItemById(id);
  }

  async updateRequestItemDetails(id: string, data: any, actorUserId?: string): Promise<CostingRequestItem | null> {
    const authorities = await this.getApprovalAuthorities();
    return this.repo.updateRequestItemDetails(id, data, authorities.some(authority => authority.id === actorUserId));
  }

  async updateRequestItemStage(id: string, stage: string, estimationId?: string, estimationNumber?: string, finalPrice?: number, finalPriceUsd?: number, actorUserId?: string): Promise<boolean> {
    if (!['Pending', 'In Progress', 'In Review', 'Approved', 'Rejected'].includes(stage)) {
      throw new ValidationError('Invalid costing request stage.');
    }
    const authorities = await this.getApprovalAuthorities();
    const actorCanApprove = authorities.some(authority => authority.id === actorUserId);
    if ((stage === 'Approved' || stage === 'Rejected') && !actorCanApprove) {
      throw new ForbiddenError('Only Ravi Utmani or Raj Utmani can approve or reject costing.');
    }
    return this.repo.updateRequestItemStage(id, stage, estimationId, estimationNumber, finalPrice, finalPriceUsd, actorCanApprove);
  }

  async getTrackerData(search?: string, stage?: string, merchant?: string, dateFrom?: string, dateTo?: string): Promise<any> {
    return this.repo.getCostingTracker(search, stage, merchant, dateFrom, dateTo);
  }

  async getDashboardMetrics(): Promise<any> {
    return this.repo.getDashboardMetrics();
  }

  async getNextCodes(count: number = 1): Promise<{ bunchCode: string; productCodes: string[]; nextCostingCode: number; costingCodes: string[] }> {
    const bunchCode = await this.repo.generateBunchCode();
    const nextCostingCode = await this.repo.getNextCostingCodeNumber();
    const safeCount = Math.max(1, count);
    const costingCodes = Array.from({ length: safeCount }, (_, i) => String(nextCostingCode + i));
    const productCodes = costingCodes;
    return { bunchCode, productCodes, nextCostingCode, costingCodes };
  }
}
