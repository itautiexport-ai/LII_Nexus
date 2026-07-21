import { z } from "zod";

export const initiateReviewSchema = z.object({
  employeeId: z.string().uuid(),
});

export const submitSelfAssessmentSchema = z.object({
  selfSummary: z.string().min(1),
});

export const submitManagerAssessmentSchema = z.object({
  managerSummary: z.string().min(1),
  managerScore: z.number().min(0).max(100),
});
