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

export const dispatchEvaluation = async (req: Request, res: Response) => {
  try {
    const employeeId = req.params.employeeId;
    const result = await performanceEvaluationService.dispatchEvaluation(employeeId);
    res.json({ success: true, message: "Evaluation dispatch notifications sent to HOD and HR.", data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getEvaluationList = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const records = await performanceEvaluationService.getEvaluationList(userId);
    res.json({ success: true, data: records });
  } catch (error: any) {
    console.error("Failed to get evaluation list:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

