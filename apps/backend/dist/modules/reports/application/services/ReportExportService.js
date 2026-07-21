"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportExportService = void 0;
const XLSX = __importStar(require("xlsx"));
const pdfkit_1 = __importDefault(require("pdfkit"));
/** One export pipeline for all 12 report types, made possible by every
 *  report builder returning the same { title, summary, columns, rows }
 *  shape. */
class ReportExportService {
    toExcelBuffer(report) {
        const workbook = XLSX.utils.book_new();
        // Filter out internal _id column
        const visibleCols = report.columns.map((c, i) => ({ col: c, i })).filter(({ col }) => col !== "_id");
        const dataRows = report.rows.map((row) => Object.fromEntries(visibleCols.map(({ col, i }) => [col, row[i]])));
        const headers = visibleCols.map(({ col }) => col);
        const dataSheet = XLSX.utils.json_to_sheet(dataRows, { header: headers });
        XLSX.utils.book_append_sheet(workbook, dataSheet, "Data");
        return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
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