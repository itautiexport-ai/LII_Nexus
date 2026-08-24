import { v4 as uuid } from "uuid";
import { MaterialInwardRecord } from "../../domain/entities/MaterialInward";
import { IMaterialInwardRepository } from "../../domain/repositories/IMaterialInwardRepository";

export class MaterialInwardService {
  constructor(private repo: IMaterialInwardRepository) {}

  async create(
    data: Omit<MaterialInwardRecord, "id" | "inwardNo" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<MaterialInwardRecord> {
    const id = uuid();
    const lastNo = await this.repo.getLastInwardNumber();
    const inwardNo = this.generateNextInwardNumber(lastNo);

    return this.repo.create({
      id,
      inwardNo,
      inwardDate: data.inwardDate || new Date(),
      supplierName: data.supplierName,
      poNumber: data.poNumber,
      invoiceChallanNo: data.invoiceChallanNo,
      invoiceChallanDate: data.invoiceChallanDate,
      vehicleNumber: data.vehicleNumber,
      driverName: data.driverName,
      driverContact: data.driverContact,
      materialName: data.materialName,
      quantityReceived: data.quantityReceived,
      uom: data.uom,
      receivedBy: data.receivedBy,
      remarks: data.remarks,
      photoUrl: data.photoUrl,
      status: data.status || "Pending",
    });
  }

  async list(): Promise<MaterialInwardRecord[]> {
    return this.repo.list();
  }

  async getById(id: string): Promise<MaterialInwardRecord | null> {
    return this.repo.getById(id);
  }

  async update(
    id: string,
    data: Partial<Omit<MaterialInwardRecord, "id" | "inwardNo" | "createdAt" | "updatedAt" | "deletedAt">>
  ): Promise<MaterialInwardRecord> {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error(`Material Inward record not found: ${id}`);
    }
    return this.repo.update(id, data);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error(`Material Inward record not found: ${id}`);
    }
    await this.repo.remove(id);
  }

  private generateNextInwardNumber(lastNo: string | null): string {
    const currentYear = new Date().getFullYear();
    if (!lastNo) {
      return `INW-${currentYear}-0001`;
    }
    const parts = lastNo.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[1], 10);
      const seq = parseInt(parts[2], 10);
      if (year === currentYear) {
        const nextSeq = String(seq + 1).padStart(4, "0");
        return `INW-${currentYear}-${nextSeq}`;
      }
    }
    return `INW-${currentYear}-0001`;
  }
}
