import * as XLSX from "xlsx";
import { CatalogProductItem, PresentationFieldsConfig, DEFAULT_PRESENTATION_FIELDS } from "./pptxExport";

export interface ExportExcelOptions {
  deckTitle?: string;
  customerName?: string;
  includePricing?: boolean;
  fields?: Partial<PresentationFieldsConfig>;
}

export function exportProductsToExcel(
  products: CatalogProductItem[],
  options: ExportExcelOptions = {}
): void {
  const {
    deckTitle = "LII_Product_Catalogue",
    customerName = "",
  } = options;

  const fields: PresentationFieldsConfig = {
    ...DEFAULT_PRESENTATION_FIELDS,
    ...(options.includePricing !== undefined ? { includePricing: options.includePricing } : {}),
    ...(options.fields || {}),
  };

  // Transform data for Excel rows based on selected fields
  const dataRows = products.map((item, idx) => {
    const row: Record<string, string | number> = {
      "S.No.": idx + 1,
    };

    if (fields.includeSku) {
      row["SKU Code"] = item.sku || `PROD-${idx + 1}`;
    }

    row["Product Name"] = item.name;

    if (fields.includeCategory) {
      row["Category"] = item.category || "General";
      row["Sub Category"] = item.subCategory || "General";
    }

    if (fields.includeCollection) {
      row["Collection"] = item.collectionName || "-";
    }

    if (fields.includeMaterial) {
      row["Material"] = item.material || "-";
    }

    if (fields.includeWoodFinish) {
      row["Wood Finish"] = item.woodFinish || "Standard";
    }

    if (fields.includeMetalFinish) {
      row["Metal Finish"] = item.metalFinish || "N/A";
    }

    if (fields.includeDimensions) {
      row["Dimensions (L x W x H cm)"] = item.sizeCm || "-";
    }

    if (fields.includePricing) {
      row["FOB Price (USD $)"] = Number((item.fobPriceUsd || 0).toFixed(2));
    }

    if (fields.includeMoq) {
      row["MOQ (Pcs)"] = item.moq || 1;
    }

    if (fields.includeCbm) {
      row["Unit CBM (m³)"] = Number((item.cbm || 0).toFixed(3));
    }

    if (fields.includeContainerQty) {
      row["40' HQ Qty (Pcs)"] = item.gp40ft || Math.floor(68 / (item.cbm || 0.5));
    }

    if (fields.includeAssembly) {
      row["Assembly Type"] = item.assembledKd || "KD";
    }

    if (fields.includeStockStatus) {
      row["Production Status"] = item.stockStatus || "Active";
    }

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  // Set column widths based on keys
  if (dataRows.length > 0) {
    const keys = Object.keys(dataRows[0]);
    worksheet["!cols"] = keys.map((k) => {
      if (k === "S.No.") return { wch: 6 };
      if (k === "Product Name") return { wch: 32 };
      if (k.includes("Dimensions")) return { wch: 24 };
      if (k.includes("SKU")) return { wch: 18 };
      if (k.includes("Material") || k.includes("Collection")) return { wch: 22 };
      return { wch: 16 };
    });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Product Catalogue");

  // Generate safe filename
  const sanitizedTitle = (customerName ? `${customerName}_` : "") + deckTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${sanitizedTitle}_${new Date().toISOString().split("T")[0]}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}

