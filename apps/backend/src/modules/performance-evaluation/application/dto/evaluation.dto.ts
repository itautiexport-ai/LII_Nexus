import { z } from "zod";

export const createEvaluationSchema = z.object({
  employeeId: z.string().min(1),
  evaluationPeriod: z.string().min(1),
  score: z.number().min(0).max(100).optional().default(0),
  comments: z.string().optional().default(""),
  qualityOfWork: z.number().optional().default(0),
  technicalCompetence: z.number().optional().default(0),
  leadership: z.number().optional().default(0),
  teamBehaviour: z.number().optional().default(0),
  initiative: z.number().optional().default(0),
  costSaving: z.number().optional().default(0),
  
  attendancePunctuality: z.number().optional().default(0),
  discipline: z.number().optional().default(0),
  behaviourAttitude: z.number().optional().default(0),
  communication: z.number().optional().default(0),
  responsibilityAccountability: z.number().optional().default(0),
  workEthics: z.number().optional().default(0),
  teamContribution: z.number().optional().default(0),
  
  attendancePercentage: z.number().optional().default(0),
});

export type CreateEvaluationDto = z.infer<typeof createEvaluationSchema>;
