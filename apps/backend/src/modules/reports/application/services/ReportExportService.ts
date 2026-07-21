import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";
import { ReportResult } from "../../domain/entities/Report";

/** One export pipeline for all 12 report types, made possible by every
 *  report builder returning the same { title, summary, columns, rows }
 *  shape. */
export class ReportExportService {
  toExcelBuffer(report: ReportResult): Buffer {
    const workbook = XLSX.utils.book_new();
    // Filter out internal _id column
    const visibleCols = report.columns.map((c, i) => ({ col: c, i })).filter(({ col }) => col !== "_id");
    const dataRows = report.rows.map((row) => Object.fromEntries(visibleCols.map(({ col, i }) => [col, row[i]])));
    const headers = visibleCols.map(({ col }) => col);
    const dataSheet = XLSX.utils.json_to_sheet(dataRows, { header: headers });
    XLSX.utils.book_append_sheet(workbook, dataSheet, "Data");
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }

  toCsvBuffer(report: ReportResult): Buffer {
    // Filter out internal _id column
    const visibleIdxs = report.columns.map((c, i) => ({ col: c, i })).filter(({ col }) => col !== "_id");
    const lines = [visibleIdxs.map(({ col }) => col).join(",")];
    for (const row of report.rows) {
      lines.push(visibleIdxs.map(({ i }) => {
        const value = row[i] === null ? "" : String(row[i]);
        return value.includes(",") || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(","));
    }
    return Buffer.from(lines.join("\n"), "utf-8");
  }

  async toPdfBuffer(report: ReportResult): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(18).text(report.title, { align: "left" });
      doc.fontSize(9).fillColor("#666").text(`Generated ${new Date(report.generatedAt).toLocaleString()}`);
      doc.moveDown();

      doc.fontSize(12).fillColor("#000").text("Summary");
      doc.fontSize(10);
      for (const stat of report.summary) {
        doc.text(`${stat.label}: ${stat.value}`);
      }
      doc.moveDown();

      doc.fontSize(12).text("Data");
      doc.fontSize(8);
      // Filter out internal _id column for PDF
      const visiblePdfCols = report.columns.map((c, i) => ({ col: c, i })).filter(({ col }) => col !== "_id");
      const colWidth = Math.floor(500 / Math.max(1, visiblePdfCols.length));
      const startX = doc.x;
      let y = doc.y;
      visiblePdfCols.forEach(({ col }, idx) => doc.text(col, startX + idx * colWidth, y, { width: colWidth }));
      y += 14;
      for (const row of report.rows.slice(0, 200)) {
        visiblePdfCols.forEach(({ i }, idx) => doc.text(row[i] === null ? "" : String(row[i]), startX + idx * colWidth, y, { width: colWidth }));
        y += 14;
        if (y > 760) { doc.addPage(); y = 40; }
      }
      if (report.rows.length > 200) {
        doc.moveDown().fontSize(8).fillColor("#999").text(`... and ${report.rows.length - 200} more row(s). Export to Excel or CSV for the full dataset.`);
      }

      doc.end();
    });
  }
}
