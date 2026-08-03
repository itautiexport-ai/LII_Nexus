import { Request, Response } from "express";
import { FmsExecutionService } from "../../application/services/FmsExecutionService";
import { pool } from "../../../../infrastructure/database/mysql/connection";

export class FmsExecutionController {
  constructor(private service: FmsExecutionService) {}

  startInstance = async (req: Request, res: Response) => {
    try {
      const { fmsManagerId } = req.params;
      const { referenceTitle, formData } = req.body;
      
      const userId = (req as any).user?.sub;
      let creatorId = null;
      if (userId) {
        const [empRows] = await pool.query(
          "SELECT id FROM employees WHERE user_id = ?",
          [userId]
        );
        creatorId = (empRows as any)[0]?.id || null;
      }

      if (!referenceTitle) return res.status(400).json({ success: false, message: "Reference title required" });

      const result = await this.service.startFmsInstance(fmsManagerId, { referenceTitle, formData, creatorId });
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  getInstances = async (req: Request, res: Response) => {
    try {
      const { fmsManagerId } = req.params;
      const instances = await this.service.getInstancesByManagerId(fmsManagerId);
      res.json({ success: true, data: instances });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  getMyTasks = async (req: Request, res: Response) => {
    try {
      // req.user does not have employeeId natively. Fetch from Employee repo based on user id.
      const userId = (req as any).user?.sub;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
      
      const [empRows] = await pool.query(
        "SELECT id FROM employees WHERE user_id = ?",
        [userId]
      );
      
      const employeeId = (empRows as any)[0]?.id;
      if (!employeeId) return res.status(403).json({ success: false, message: "User not linked to employee" });

      const tasks = await this.service.getMyPendingTasks(employeeId);
      res.json({ success: true, data: tasks });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  completeTask = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.sub;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
      
      const [empRows] = await pool.query(
        "SELECT id FROM employees WHERE user_id = ?",
        [userId]
      );
      
      const employeeId = (empRows as any)[0]?.id;
      if (!employeeId) return res.status(403).json({ success: false, message: "User not linked to employee" });

      const { instanceStepId } = req.params;
      const { inputData } = req.body;

      const result = await this.service.completeStep(employeeId, instanceStepId, { inputData });
      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  deleteInstance = async (req: Request, res: Response) => {
    try {
      const { instanceId } = req.params;
      const result = await this.service.deleteInstance(instanceId);
      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
}
