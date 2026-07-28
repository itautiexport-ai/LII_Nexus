import { z } from "zod";

export const CreateCartonOrderSchema = z.object({
  erpOrderNumber: z.string().min(1, "ERP Order Number is required"),
  companyName: z.enum(["LII", "LIE"]).optional(),
  aliasName: z.string().optional(),
});

export type CreateCartonOrderDto = z.infer<typeof CreateCartonOrderSchema>;
