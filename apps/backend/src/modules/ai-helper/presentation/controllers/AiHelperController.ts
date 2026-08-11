import { Request, Response } from "express";
import { AiHelperService } from "../../application/services/AiHelperService";

const aiHelperService = new AiHelperService();

export class AiHelperController {
  static async query(req: Request, res: Response) {
    try {
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({ error: { message: "Prompt is required" } });
      }

      const userId = (req as any).user?.id || (req as any).user?.userId;
      const result = await aiHelperService.processQuery(prompt, userId);

      return res.json({
        success: true,
        data: result
      });
    } catch (err: any) {
      console.error("AiHelperController error:", err);
      return res.status(500).json({
        error: { message: err.message || "Failed to process AI query" }
      });
    }
  }
}
