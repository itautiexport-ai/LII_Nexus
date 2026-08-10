import { Request, Response } from "express";
import { ExportService } from "../../application/services/ExportService";

export class ExportController {
  constructor(private exportService: ExportService) {}

  downloadExport = async (req: Request, res: Response) => {
    const moduleType = req.query.module as string;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    if (!moduleType) {
      return res.status(400).json({ status: "error", message: "module parameter is required" });
    }

    const workbook = await this.exportService.generateExport(moduleType, startDate, endDate);

    const fileName = `${moduleType}_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  };
}
