import { MaterialInwardRecord } from "../../domain/entities/MaterialInward";
import { IMaterialInwardRepository } from "../../domain/repositories/IMaterialInwardRepository";
import { pool } from "../../../../infrastructure/database/mysql/connection";

function mapMaterialInward(row: any): MaterialInwardRecord {
  return {
    id: row.id,
    inwardNo: row.inward_no,
    inwardDate: row.inward_date ? new Date(row.inward_date) : new Date(),
    supplierName: row.supplier_name,
    poNumber: row.po_number,
    invoiceChallanNo: row.invoice_challan_no,
    invoiceChallanDate: row.invoice_challan_date ? new Date(row.invoice_challan_date) : null,
    vehicleNumber: row.vehicle_number,
    driverName: row.driver_name,
    driverContact: row.driver_contact,
    materialName: row.material_name,
    quantityReceived: Number(row.quantity_received),
    uom: row.uom,
    receivedBy: row.received_by,
    remarks: row.remarks,
    photoUrl: row.photo_url,
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
  };
}

export class MySqlMaterialInwardRepository implements IMaterialInwardRepository {
  async create(data: Omit<MaterialInwardRecord, "createdAt" | "updatedAt" | "deletedAt">): Promise<MaterialInwardRecord> {
    await pool.query(
      `INSERT INTO material_inwards (
        id, inward_no, inward_date, supplier_name, po_number, 
        invoice_challan_no, invoice_challan_date, vehicle_number, 
        driver_name, driver_contact, material_name, quantity_received, 
        uom, received_by, remarks, photo_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.inwardNo,
        data.inwardDate,
        data.supplierName,
        data.poNumber,
        data.invoiceChallanNo,
        data.invoiceChallanDate,
        data.vehicleNumber,
        data.driverName,
        data.driverContact,
        data.materialName,
        data.quantityReceived,
        data.uom,
        data.receivedBy,
        data.remarks,
        data.photoUrl,
        data.status
      ]
    );
    const result = await this.getById(data.id);
    if (!result) throw new Error("Failed to retrieve created material inward record");
    return result;
  }

  async list(): Promise<MaterialInwardRecord[]> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM material_inwards WHERE deleted_at IS NULL ORDER BY inward_date DESC, created_at DESC"
    );
    return rows.map(mapMaterialInward);
  }

  async getById(id: string): Promise<MaterialInwardRecord | null> {
    const [rows] = await pool.query<any[]>(
      "SELECT * FROM material_inwards WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    if (rows.length === 0) return null;
    return mapMaterialInward(rows[0]);
  }

  async update(
    id: string,
    data: Partial<Omit<MaterialInwardRecord, "id" | "inwardNo" | "createdAt" | "updatedAt" | "deletedAt">>
  ): Promise<MaterialInwardRecord> {
    const keys = Object.keys(data) as Array<keyof typeof data>;
    if (keys.length === 0) {
      const existing = await this.getById(id);
      if (!existing) throw new Error(`Material Inward not found: ${id}`);
      return existing;
    }

    const setClauses: string[] = [];
    const values: any[] = [];

    // Map JS camelCase to SQL snake_case
    const dbMappings: Record<string, string> = {
      inwardDate: "inward_date",
      supplierName: "supplier_name",
      poNumber: "po_number",
      invoiceChallanNo: "invoice_challan_no",
      invoiceChallanDate: "invoice_challan_date",
      vehicleNumber: "vehicle_number",
      driverName: "driver_name",
      driverContact: "driver_contact",
      materialName: "material_name",
      quantityReceived: "quantity_received",
      uom: "uom",
      receivedBy: "received_by",
      remarks: "remarks",
      photoUrl: "photo_url",
      status: "status",
    };

    keys.forEach((key) => {
      const dbKey = dbMappings[key as string];
      if (dbKey) {
        setClauses.push(`${dbKey} = ?`);
        values.push(data[key]);
      }
    });

    values.push(id);

    await pool.query(
      `UPDATE material_inwards SET ${setClauses.join(", ")} WHERE id = ? AND deleted_at IS NULL`,
      values
    );

    const updated = await this.getById(id);
    if (!updated) throw new Error("Material Inward record not found after update");
    return updated;
  }

  async remove(id: string): Promise<void> {
    await pool.query("UPDATE material_inwards SET deleted_at = NOW() WHERE id = ?", [id]);
  }

  async getLastInwardNumber(): Promise<string | null> {
    const [rows] = await pool.query<any[]>(
      "SELECT inward_no FROM material_inwards ORDER BY created_at DESC LIMIT 1"
    );
    if (rows.length === 0) return null;
    return rows[0].inward_no;
  }
}
