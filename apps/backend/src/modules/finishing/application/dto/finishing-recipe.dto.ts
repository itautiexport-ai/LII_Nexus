import { z } from "zod";

export const createFinishingRecipeSchema = z.object({
  itemCode: z.string().min(1, "Item Code is required"),
  finishCode: z.string().min(1, "Finish Code is required"),
  itemDescription: z.string().min(1, "Item Description is required"),
  createdOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  buyerCode: z.string().optional().default(""),
  glossLevel: z.string().optional().default(""),
  woodType: z.string().optional().default(""),
  steps: z.array(z.object({
    id: z.string().optional(),
    stepNo: z.number(),
    processMaterial: z.string().optional().default(""),
    toolMachine: z.string().optional().default(""),
    gritQuantity: z.string().optional().default(""),
    dryingTime: z.string().optional().default(""),
    notes: z.string().optional().default(""),
    noOfCoats: z.string().optional().default("")
  }))
});

export const updateFinishingRecipeSchema = createFinishingRecipeSchema;
