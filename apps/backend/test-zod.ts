import { z } from "zod";

const CATEGORIES = ["sop", "drawing", "work_instruction", "qc_format", "policy", "contract", "buyer_document", "machine_manual", "training_video"] as const;
const createDocumentSchema = z.object({
  title: z.string().min(1),
  category: z.enum(CATEGORIES),
  folderId: z.string().uuid().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  isConfidential: z.boolean().optional(),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  changeNotes: z.string().max(1000).optional().nullable(),
});

try {
  createDocumentSchema.parse({
    title: "MR",
    category: "drawing",
    fileName: "01.jpg",
    fileUrl: `https://files.example.com/01.jpg`,
    expiryDate: undefined,
    isConfidential: true,
    changeNotes: "Test",
  });
  console.log("Valid");
} catch (e: any) {
  console.error(e.errors);
}
