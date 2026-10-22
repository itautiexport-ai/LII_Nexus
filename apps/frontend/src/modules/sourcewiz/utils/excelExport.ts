import * as XLSX from "xlsx";
import { CatalogProductItem } from "./pptxExport";

export interface ExportExcelOptions {
  deckTitle?: string;
  customerName?: string;
  includePricing?: boolean;
}

export function exportProductsToExcel(
  products: CatalogProductItem[],
  options: ExportExcelOptions = {}
): void {
  const {
    deckTitle = "LII_Product_Catalogue",
    customerName = "",
    includePricing = true,
  } = options;

  // Transform data for Excel rows
  const dataRows = products.map((item, idx) => {
    const row: Record<string, string | number> = {
      "S.No.": idx + 1,
      "SKU Code": item.sku || `PROD-${idx + 1}`,
      "Product Name": item.name,
      Category: item.category || "General",
      "Sub Category": item.subCategory || "General",
      Collection: item.collectionName || "-",
      Material: item.material || "-",
      "Wood Finish": item.woodFinish || "Standard",
      "Metal Finish": item.metalFinish || "N/A",
      "Dimensions (L x W x H cm)": item.sizeCm || "-",
    };

    if (includePricing) {
      row["FOB Price (USD $)"] = Number((item.fobPriceUsd || 0).toFixed(2));
    }

    row["MOQ (Pcs)"] = item.moq || 1;
    row["Unit CBM (m³)"] = Number((item.cbm || 0).toFixed(3));
    row["40' HQ Qty (Pcs)"] = item.gp40ft || Math.floor(68 / (item.cbm || 0.5));
    row["Assembly Type"] = item.assembledKd || "KD";
    row["Production Status"] = item.stockStatus || "Active";

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  // Set column widths for clean readability
  worksheet["!cols"] = [
    { wch: 6 },  // S.No
    { wch: 20 }, // SKU
    { wch: 34 }, // Name
    { wch: 16 }, // Category
    { wch: 18 }, // Sub Category
    { wch: 22 }, // Collection
    { wch: 24 }, // Material
    { wch: 18 }, // Wood Finish
    { wch: 18 }, // Metal Finish
    { wch: 22 }, // Dimensions
    ...(includePricing ? [{ wch: 16 }] : []), // FOB Price
    { wch: 12 }, // MOQ
    { wch: 15 }, // Unit CBM
    { wch: 18 }, // 40' HQ Qty
    { wch: 16 }, // Assembly
    { wch: 18 }, // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Product Catalogue");

  // Generate safe filename
  const sanitizedTitle = (customerName ? `${customerName}_` : "") + deckTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${sanitizedTitle}_${new Date().toISOString().split("T")[0]}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
