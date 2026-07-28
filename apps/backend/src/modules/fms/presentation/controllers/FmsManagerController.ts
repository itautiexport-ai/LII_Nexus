import { Request, Response } from "express";
import { FmsManagerService } from "../../application/services/FmsManagerService";
import { CreateFmsManagerSchema, CreateFmsStepSchema } from "../../application/dto/fms.dto";

export class FmsManagerController {
  constructor(private service: FmsManagerService) {}

  createFms = async (req: Request, res: Response) => {
    try {
      const dto = CreateFmsManagerSchema.parse(req.body);
      const fms = await this.service.createFms(dto);
      res.status(201).json({ success: true, data: fms });
    } catch (err: any) {
      if (err.errors) {
        return res.status(400).json({ success: false, errors: err.errors });
      }
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  getAllFms = async (req: Request, res: Response) => {
    try {
      const fmsList = await this.service.getAllFms();
      res.json({ success: true, data: fmsList });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  deleteFms = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.service.deleteFms(id);
      res.json({ success: true, message: "FMS Manager deleted successfully" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  updateFms = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const dto = CreateFmsManagerSchema.parse(req.body);
      const fms = await this.service.updateFms(id, dto);
      res.json({ success: true, data: fms });
    } catch (err: any) {
      if (err.errors) {
        return res.status(400).json({ success: false, errors: err.errors });
      }
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  addStep = async (req: Request, res: Response) => {
    try {
      const { fmsId } = req.params;
      const dto = CreateFmsStepSchema.parse(req.body);
      const step = await this.service.addStep(fmsId, dto);
      res.status(201).json({ success: true, data: step });
    } catch (err: any) {
      if (err.errors) {
        return res.status(400).json({ success: false, errors: err.errors });
      }
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  getSteps = async (req: Request, res: Response) => {
    try {
      const { fmsId } = req.params;
      const steps = await this.service.getSteps(fmsId);
      res.json({ success: true, data: steps });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  getAllStepsGlobal = async (req: Request, res: Response) => {
    try {
      const steps = await this.service.getAllStepsAcrossManagers();
      res.json({ success: true, data: steps });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  deleteStep = async (req: Request, res: Response) => {
    try {
      const { stepId } = req.params;
      await this.service.deleteStep(stepId);
      res.json({ success: true, message: "Step deleted" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  updateStep = async (req: Request, res: Response) => {
    try {
      const { stepId } = req.params;
      const dto = CreateFmsStepSchema.parse(req.body);
      const step = await this.service.updateStep(stepId, dto);
      res.json({ success: true, data: step });
    } catch (err: any) {
      if (err.errors) {
        return res.status(400).json({ success: false, errors: err.errors });
      }
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
}
