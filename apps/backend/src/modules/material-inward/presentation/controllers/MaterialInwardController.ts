import { Response } from "express";
import { AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { MaterialInwardService } from "../../application/services/MaterialInwardService";
import { MySqlMaterialInwardRepository } from "../../infrastructure/repositories/MySqlMaterialInwardRepository";
import { ok, created } from "../../../../shared/utils/apiResponse";
import { z } from "zod";

const repo = new MySqlMaterialInwardRepository();
const service = new MaterialInwardService(repo);

export const createMaterialInwardSchema = z.object({
  inwardDate: z.string().optional().transform((v) => (v ? new Date(v) : new Date())),
  supplierName: z.string().min(1),
  poNumber: z.string().nullable().optional(),
  invoiceChallanNo: z.string().min(1),
  invoiceChallanDate: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  vehicleNumber: z.string().nullable().optional(),
  driverName: z.string().nullable().optional(),
  driverContact: z.string().nullable().optional(),
  materialName: z.string().min(1),
  quantityReceived: z.number().nonnegative(),
  uom: z.string().min(1),
  receivedBy: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  status: z.enum(["Pending", "Inspected", "Approved", "Rejected"]).optional().default("Pending"),
});

export const updateMaterialInwardSchema = z.object({
  inwardDate: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  supplierName: z.string().optional(),
  poNumber: z.string().nullable().optional(),
  invoiceChallanNo: z.string().optional(),
  invoiceChallanDate: z.string().nullable().optional().transform((v) => (v ? new Date(v) : null)),
  vehicleNumber: z.string().nullable().optional(),
  driverName: z.string().nullable().optional(),
  driverContact: z.string().nullable().optional(),
  materialName: z.string().optional(),
  quantityReceived: z.number().nonnegative().optional(),
  uom: z.string().optional(),
  receivedBy: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  status: z.enum(["Pending", "Inspected", "Approved", "Rejected"]).optional(),
});

export const MaterialInwardController = {
  async create(req: AuthenticatedRequest, res: Response) {
    const data = req.body;
    const record = await service.create(data);
    return created(res, record);
  },

  async list(req: AuthenticatedRequest, res: Response) {
    const list = await service.list();
    return ok(res, list);
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    const record = await service.getById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: "Material Inward record not found" });
    }
    return ok(res, record);
  },

  async update(req: AuthenticatedRequest, res: Response) {
    const data = req.body;
    const record = await service.update(req.params.id, data);
    return ok(res, record);
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    await service.remove(req.params.id);
    return ok(res, { message: "Material Inward record removed" });
  },
};
