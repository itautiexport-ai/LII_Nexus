import { Request, Response } from "express";
import { performanceEvaluationService } from "../../application/services/PerformanceEvaluationService";
import { createEvaluationSchema } from "../../application/dto/evaluation.dto";

export const createHodEvaluation = async (req: Request, res: Response) => {
  try {
    const data = createEvaluationSchema.parse(req.body);
    const record = await performanceEvaluationService.createHodEvaluation(data);
    res.status(201).json({ success: true, data: record });
  } catch (error: any) {
    console.error("HOD Evaluation Error:", error);
    res.status(400).json({ success: false, error: error?.errors ? JSON.stringify(error.errors) : error.message });
  }
};

export const getHodEvaluations = async (req: Request, res: Response) => {
  try {
    const records = await performanceEvaluationService.getHodEvaluations();
    res.json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createHrEvaluation = async (req: Request, res: Response) => {
  try {
    const data = createEvaluationSchema.parse(req.body);
    const record = await performanceEvaluationService.createHrEvaluation(data);
    res.status(201).json({ success: true, data: record });
  } catch (error: any) {
    console.error("HR Evaluation Error:", error);
    res.status(400).json({ success: false, error: error?.errors ? JSON.stringify(error.errors) : error.message });
  }
};

export const getHrEvaluations = async (req: Request, res: Response) => {
  try {
    const records = await performanceEvaluationService.getHrEvaluations();
    res.json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
