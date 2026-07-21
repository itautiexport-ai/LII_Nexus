import { z } from "zod";

export const createProductionPlanningSchema = z.object({
  factoryName: z.string().min(1, "Factory List is required"),
  factoryList: z.string().min(1, "Factory List No is required"),
  orderDate: z.string().min(1, "Order Date is required"),
  company: z.string().optional(),
  erpNo: z.string().optional(),
  exFactoryDate: z.string().min(1, "Ex Factory Date is required"),
  totalCbm: z.coerce.number().min(0, "Total CBM must be greater than or equal to 0"),
  location: z.enum(["SEZ", "Sirsi", "Vendor"]).optional().default("SEZ"),
  vendorName: z.string().optional(),
});
