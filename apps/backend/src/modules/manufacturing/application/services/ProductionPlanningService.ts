import { randomUUID } from "crypto";
import { pool } from "../../../../infrastructure/database/mysql/connection";

interface CreateProductionPlanningInput {
  factoryName: string;
  factoryList: string;
  orderDate: string;
  company?: string;
  erpNo?: string;
  exFactoryDate: string;
  totalCbm: number;
  attachmentUrl?: string;
  sezCbm?: number;
  sirsiCbm?: number;
  vendorCbm?: number;
  vendorName?: string;
  machineShopCbm?: number;
  assemblyCbm?: number;
  sandingCbm?: number;
  finishingCbm?: number;
  packingCbm?: number;
}

export class ProductionPlanningService {
  async createRecord(input: CreateProductionPlanningInput, createdBy: string) {
    const id = randomUUID();
    
    await pool.query(
      `INSERT INTO production_planning_records 
       (id, factory_name, factory_list, order_date, company_details, erp_no, ex_factory_date, total_cbm, attachment_url, sez_cbm, sirsi_cbm, vendor_cbm, vendor_name, machine_shop_cbm, assembly_cbm, sanding_cbm, finishing_cbm, packing_cbm, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        input.factoryName,
        input.factoryList, 
        input.orderDate, 
        input.company || "", 
        input.erpNo || "",
        input.exFactoryDate, 
        input.totalCbm, 
        input.attachmentUrl || null,
        input.sezCbm || 0,
        input.sirsiCbm || 0,
        input.vendorCbm || 0,
        input.vendorName || null,
        input.machineShopCbm || 0,
        input.assemblyCbm || 0,
        input.sandingCbm || 0,
        input.finishingCbm || 0,
        input.packingCbm || 0,
        createdBy
      ]
    );

    return { id, ...input };
  }

  async getRecords() {
    const [rows]: any = await pool.query(
      `SELECT * FROM production_planning_records ORDER BY created_at DESC`
    );
    return rows.map((row: any) => ({
      id: row.id,
      factoryName: row.factory_name,
      factoryList: row.factory_list,
      orderDate: row.order_date,
      company: row.company_details,
      erpNo: row.erp_no,
      exFactoryDate: row.ex_factory_date,
      totalCbm: row.total_cbm,
      attachmentUrl: row.attachment_url,
      sezCbm: row.sez_cbm,
      sirsiCbm: row.sirsi_cbm,
      vendorCbm: row.vendor_cbm,
      vendorName: row.vendor_name,
      machineShopCbm: row.machine_shop_cbm,
      assemblyCbm: row.assembly_cbm,
      sandingCbm: row.sanding_cbm,
      finishingCbm: row.finishing_cbm,
      packingCbm: row.packing_cbm,
      createdAt: row.created_at,
    }));
  }

  async deleteRecord(id: string) {
    await pool.query(
      `DELETE FROM production_planning_records WHERE id = ?`,
      [id]
    );
  }

  async updateCbmSplit(id: string, sezCbm: number, sirsiCbm: number, vendorCbm: number, vendorName?: string) {
    await pool.query(
      `UPDATE production_planning_records SET sez_cbm = ?, sirsi_cbm = ?, vendor_cbm = ?, vendor_name = ? WHERE id = ?`,
      [sezCbm, sirsiCbm, vendorCbm, vendorName || null, id]
    );
  }

  async updateProcessCbm(id: string, machineShopCbm: number, assemblyCbm: number, sandingCbm: number, finishingCbm: number, packingCbm: number) {
    await pool.query(
      `UPDATE production_planning_records SET machine_shop_cbm = ?, assembly_cbm = ?, sanding_cbm = ?, finishing_cbm = ?, packing_cbm = ? WHERE id = ?`,
      [machineShopCbm, assemblyCbm, sandingCbm, finishingCbm, packingCbm, id]
    );
  }
}

export const productionPlanningService = new ProductionPlanningService();
