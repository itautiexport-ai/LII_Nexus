import fs from "fs";
import path from "path";

export interface ParsedRow {
  sNo: string;
  departmentName: string;
  gross: string;
  days: string;
  otHrs: string;
  grossAmt: string;
  otAmt: string;
}

export class FileParsingService {
  async parseSalarySheet(filePath: string): Promise<ParsedRow[]> {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".pdf") {
      return this.parsePdf(filePath);
    }
    return [];
  }

  private async parsePdf(filePath: string): Promise<ParsedRow[]> {
    try {
      // Use pdfjs-dist v3 legacy CJS build for positional text extraction
      const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
      
      const data = new Uint8Array(fs.readFileSync(filePath));
      const doc = await pdfjsLib.getDocument({ data }).promise;
      const allRows: ParsedRow[] = [];

      for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
        const page = await doc.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Group text items by Y coordinate (each row in the table shares a Y value)
        const rowsByY: Record<number, { x: number; text: string }[]> = {};
        for (const item of textContent.items as any[]) {
          if (!item.str || item.str.trim() === "") continue;
          const y = Math.round(item.transform[5]);
          const x = Math.round(item.transform[4]);
          if (!rowsByY[y]) rowsByY[y] = [];
          rowsByY[y].push({ x, text: item.str.trim() });
        }

        // Sort rows by Y descending (PDF coordinates are bottom-up)
        const sortedYs = Object.keys(rowsByY)
          .map(Number)
          .sort((a, b) => b - a);

        for (const y of sortedYs) {
          const cells = rowsByY[y].sort((a, b) => a.x - b.x);
          const texts = cells.map((c) => c.text);

          // Skip header rows, title rows, and "Grand Total"
          if (texts.some((t) => t.includes("SR NO") || t.includes("SALARY SHEET") || t.includes("Grand Total"))) {
            continue;
          }

          // A valid data row starts with a number (sNo)
          if (texts.length >= 7 && /^\d+$/.test(texts[0])) {
            allRows.push({
              sNo: texts[0],
              departmentName: texts[1],
              gross: texts[2],
              days: texts[3],
              otHrs: texts[4],
              grossAmt: texts[5],
              otAmt: texts[6],
            });
          }
        }
      }

      return allRows;
    } catch (e) {
      console.error("PDF parsing error:", e);
      return [];
    }
  }
}
