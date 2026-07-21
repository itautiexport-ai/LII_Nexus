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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmExcelService = void 0;
const XLSX = __importStar(require("xlsx"));
const DomainError_1 = require("../../../../core/domain/errors/DomainError");
const EXPORT_COLUMNS = [
    "leadCode", "inquiryDate", "contactName", "companyName", "country", "city", "phone", "email",
    "leadSource", "leadCategory", "productCategory", "inquiryDetails", "merchantName", "salesStage",
    "forecastAmount", "winProbability", "weightedForecast", "expectedCloseDate", "nextFollowUpDate",
    "followUpRemarks", "nextAction", "delayDays", "status", "priority", "createdByName", "updatedByName",
];
const IMPORT_REQUIRED_COLUMNS = ["inquiryDate", "contactName", "leadSource", "leadCategory"];
const VALID_LEAD_SOURCES = ["trade_fair", "whatsapp", "email", "website", "referral", "other"];
const VALID_LEAD_CATEGORIES = ["export", "domestic", "hotel_restaurant_project", "buyer_agent", "repeat_customer"];
class CrmExcelService {
    /** Exports the exact core CRM fields as a single-sheet workbook. */
    exportLeads(leads) {
        const rows = leads.map((lead) => {
            const row = {};
            for (const col of EXPORT_COLUMNS) {
                row[col] = lead[col] ?? "";
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
    parseImportFile(buffer) {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName)
            throw new DomainError_1.ValidationError("The uploaded file has no sheets.");
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
        if (rows.length === 0)
            throw new DomainError_1.ValidationError("The uploaded file has no data rows.");
        const results = [];
        const errors = [];
        rows.forEach((row, index) => {
            const rowNum = index + 2; // +1 for header, +1 for 1-indexing
            for (const col of IMPORT_REQUIRED_COLUMNS) {
                if (!row[col])
                    errors.push(`Row ${rowNum}: missing required field "${col}".`);
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
                    leadSource: row.leadSource,
                    leadCategory: row.leadCategory,
                    productCategory: row.productCategory ? String(row.productCategory) : null,
                    inquiryDetails: row.inquiryDetails ? String(row.inquiryDetails) : null,
                    forecastAmount: row.forecastAmount ? Number(row.forecastAmount) : null,
                    winProbability: row.winProbability ? Number(row.winProbability) : null,
                    expectedCloseDate: row.expectedCloseDate ? String(row.expectedCloseDate) : null,
                    nextFollowUpDate: row.nextFollowUpDate ? String(row.nextFollowUpDate) : null,
                    priority: row.priority ?? "medium",
                });
            }
        });
        if (errors.length > 0) {
            throw new DomainError_1.ValidationError(`Import failed with ${errors.length} error(s).`, errors.slice(0, 20));
        }
        return results;
    }
}
exports.CrmExcelService = CrmExcelService;
//# sourceMappingURL=CrmExcelService.js.map