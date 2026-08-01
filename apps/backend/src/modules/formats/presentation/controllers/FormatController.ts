import { Request, Response } from "express";
import { MySqlFormatRepository } from "../../infrastructure/repositories/MySqlFormatRepository";
import { ok } from "../../../../shared/utils/apiResponse";

export class FormatController {
  private repo = new MySqlFormatRepository();

  public listFormats = async (req: Request, res: Response) => {
    try {
      const formats = await this.repo.findAll();
      return ok(res, formats);
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ success: false, error: { message: err.message || "Internal server error" } });
    }
  };

  public createFormat = async (req: Request, res: Response) => {
    try {
      const { title, description, icon, fileUrl } = req.body;
      if (!title || !fileUrl) {
        return res.status(400).json({ success: false, error: { message: "Title and fileUrl are required." } });
      }
      
      const format = await this.repo.save({
        title,
        description,
        icon,
        fileUrl
      });
      return ok(res, format);
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ success: false, error: { message: err.message || "Internal server error" } });
    }
  };
}
