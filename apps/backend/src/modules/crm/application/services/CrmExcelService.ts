import * as XLSX from "xlsx";
import { LeadWithContext } from "../../domain/entities/Lead";
import { CreateLeadData } from "../../domain/repositories/ICrmRepository";
import { ValidationError } from "../../../../core/domain/errors/DomainError";

const EXPORT_COLUMNS = [
  "leadCode", "inquiryDate", "contactName", "companyName", "country", "city", "phone", "email",
  "leadSource", "leadCategory", "productCategory", "inquiryDetails", "merchantName", "salesStage",
  "forecastAmount", "winProbability", "weightedForecast", "expectedCloseDate", "nextFollowUpDate",
  "followUpRemarks", "nextAction", "delayDays", "status", "priority", "createdByName", "updatedByName",
] as const;

const IMPORT_REQUIRED_COLUMNS = ["inquiryDate", "contactName", "leadSource", "leadCategory"];
const VALID_LEAD_SOURCES = ["trade_fair", "whatsapp", "email", "website", "referral", "other"];
const VALID_LEAD_CATEGORIES = ["export", "domestic", "hotel_restaurant_project", "buyer_agent", "repeat_customer"];

export class CrmExcelService {
  /** Exports the exact core CRM fields as a single-sheet workbook. */
  exportLeads(leads: LeadWithContext[]): Buffer {
    const rows = leads.map((lead) => {
      const row: Record<string, unknown> = {};
      for (const col of EXPORT_COLUMNS) {
        row[col] = (lead as any)[col] ?? "";
      }
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...EXPORT_COLUMNS] });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }

  /** Parses an uploaded workbook into validated lead-creation payloads.
   *  Deliberately strict: any row missing a required field or using an
   *  invalid enum value is rejected with its row number rather than
   *  silently skipped or coerced into something wrong. */
  parseImportFile(buffer: Buffer): Omit<CreateLeadData, "id" | "leadCode" | "createdBy">[] {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new ValidationError("The uploaded file has no sheets.");
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: null });
    if (rows.length === 0) throw new ValidationError("The uploaded file has no data rows.");

    const results: Omit<CreateLeadData, "id" | "leadCode" | "createdBy">[] = [];
    const errors: string[] = [];

    rows.forEach((row, index) => {
      const rowNum = index + 2; // +1 for header, +1 for 1-indexing
      for (const col of IMPORT_REQUIRED_COLUMNS) {
        if (!row[col]) errors.push(`Row ${rowNum}: missing required field "${col}".`);
      }
      if (row.leadSource && !VALID_LEAD_SOURCES.includes(String(row.leadSource))) {
        errors.push(`Row ${rowNum}: invalid leadSource "${row.leadSource}". Must be one of: ${VALID_LEAD_SOURCES.join(", ")}.`);
      }
      if (row.leadCategory && !VALID_LEAD_CATEGORIES.includes(String(row.leadCategory))) {
        errors.push(`Row ${rowNum}: invalid leadCategory "${row.leadCategory}". Must be one of: ${VALID_LEAD_CATEGORIES.join(", ")}.`);
      }
      if (errors.length === 0 || !errors.some((e) => e.startsWith(`Row ${rowNum}:`))) {
        results.push({
          inquiryDate: String(row.inquiryDate),
          contactName: String(row.contactName),
          companyName: row.companyName ? String(row.companyName) : null,
          country: row.country ? String(row.country) : null,
          city: row.city ? String(row.city) : null,
          phone: row.phone ? String(row.phone) : null,
          email: row.email ? String(row.email) : null,
          leadSource: row.leadSource as any,
          leadCategory: row.leadCategory as any,
          productCategory: row.productCategory ? String(row.productCategory) : null,
          inquiryDetails: row.inquiryDetails ? String(row.inquiryDetails) : null,
          forecastAmount: row.forecastAmount ? Number(row.forecastAmount) : null,
          winProbability: row.winProbability ? Number(row.winProbability) : null,
          expectedCloseDate: row.expectedCloseDate ? String(row.expectedCloseDate) : null,
          nextFollowUpDate: row.nextFollowUpDate ? String(row.nextFollowUpDate) : null,
          priority: (row.priority as any) ?? "medium",
        });
      }
    });

    if (errors.length > 0) {
      throw new ValidationError(`Import failed with ${errors.length} error(s).`, errors.slice(0, 20));
    }
    return results;
  }
}
