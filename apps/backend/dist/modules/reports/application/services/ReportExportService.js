"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportExportService = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/** One export pipeline for all 12 report types, made possible by every
 *  report builder returning the same { title, summary, columns, rows }
 *  shape. */
class ReportExportService {
    async toExcelBuffer(report) {
        const workbook = new exceljs_1.default.Workbook();
        const sheet = workbook.addWorksheet("Data");
        const logoPath = path_1.default.join(__dirname, "../../../../../../frontend/public/logo.jpg");
        let hasLogo = false;
        let logoId = -1;
        if (fs_1.default.existsSync(logoPath)) {
            const logoBuffer = fs_1.default.readFileSync(logoPath);
            logoId = workbook.addImage({
                buffer: logoBuffer,
                extension: "jpeg",
            });
            hasLogo = true;
        }
        if (hasLogo) {
            sheet.addImage(logoId, {
                tl: { col: 0, row: 0 },
                ext: { width: 100, height: 50 },
            });
        }
        // Add Title
        sheet.mergeCells('C1:F2');
        const titleCell = sheet.getCell('C1');
        titleCell.value = report.title;
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        // Summary (e.g. Date and Entries)
        let rowCursor = 4;
        for (const stat of report.summary) {
            sheet.getCell(`A${rowCursor}`).value = `${stat.label}: ${stat.value}`;
            sheet.getCell(`A${rowCursor}`).font = { bold: true };
            rowCursor++;
        }
        rowCursor += 1;
        // Filter out internal _id column
        const visibleCols = report.columns.map((c, i) => ({ col: c, i })).filter(({ col }) => col !== "_id");
        const headers = visibleCols.map(({ col }) => col);
        // Header Row
        const headerRow = sheet.getRow(rowCursor);
        headerRow.values = headers;
        headerRow.font = { bold: true };
        rowCursor++;
        // Data Rows
        for (const row of report.rows) {
            const rowData = visibleCols.map(({ i }) => row[i]);
            sheet.getRow(rowCursor).values = rowData;
            rowCursor++;
        }
        // Auto-fit columns roughly
        sheet.columns.forEach((column) => {
            column.width = 15;
        });
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
    toCsvBuffer(report) {
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
    async toPdfBuffer(report) {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 40, size: "A4" });
            const chunks = [];
            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);
            const logoPath = path_1.default.join(__dirname, "../../../../../../frontend/public/logo.jpg");
            let startY = 40;
            if (fs_1.default.existsSync(logoPath)) {
                doc.image(logoPath, 40, 40, { width: 100 });
                startY = 100;
            }
            doc.fontSize(18).text(report.title, 40, startY, { align: "left" });
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
                if (y > 760) {
                    doc.addPage();
                    y = 40;
                }
            }
            if (report.rows.length > 200) {
                doc.moveDown().fontSize(8).fillColor("#999").text(`... and ${report.rows.length - 200} more row(s). Export to Excel or CSV for the full dataset.`);
            }
            doc.end();
        });
    }
}
exports.ReportExportService = ReportExportService;
//# sourceMappingURL=ReportExportService.js.map