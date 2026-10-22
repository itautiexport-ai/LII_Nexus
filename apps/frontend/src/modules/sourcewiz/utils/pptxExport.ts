import pptxgen from "pptxgenjs";

export interface CatalogProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  subCategory: string;
  collectionName: string;
  material: string;
  woodFinish: string;
  metalFinish: string;
  sizeCm: string;
  fobPriceUsd: number;
  moq: number;
  cbm: number;
  gp40ft: number;
  assembledKd: string;
  image: string;
  stockStatus: string;
}

export type ThemeId = "obsidian" | "studio" | "earth" | "teal" | "navy";

export interface DeckTheme {
  id: ThemeId;
  name: string;
  tagline: string;
  badge: string;
  swatch: {
    primary: string;
    accent: string;
    card: string;
    isDark: boolean;
  };
  cover: {
    bg: string;
    titleColor: string;
    subtitleColor: string;
    accentColor: string;
    badgeBg: string;
    badgeText: string;
    cardBg: string;
    cardBorder: string;
    cardText: string;
    footerText: string;
  };
  product: {
    bg: string;
    titleColor: string;
    categoryColor: string;
    skuColor: string;
    priceColor: string;
    priceCardBg: string;
    priceCardBorder: string;
    tableBg: string;
    tableBorder: string;
    tableLabelColor: string;
    tableValColor: string;
    tableHighlightColor: string;
    imgBorderColor: string;
    footerLineColor: string;
    footerTextColor: string;
  };
  closing: {
    bg: string;
    titleColor: string;
    subtitleColor: string;
    cardBg: string;
    cardBorder: string;
    cardText: string;
  };
}

export const DECK_THEMES: Record<ThemeId, DeckTheme> = {
  obsidian: {
    id: "obsidian",
    name: "Executive Obsidian",
    tagline: "Luxury Midnight Slate & Amber Gold",
    badge: "LUXURY EXPORT",
    swatch: {
      primary: "#0f172a",
      accent: "#f59e0b",
      card: "#1e293b",
      isDark: true,
    },
    cover: {
      bg: "0F172A",
      titleColor: "FFFFFF",
      subtitleColor: "CBD5E1",
      accentColor: "F59E0B",
      badgeBg: "D97706",
      badgeText: "FFFFFF",
      cardBg: "1E293B",
      cardBorder: "334155",
      cardText: "94A3B8",
      footerText: "64748B",
    },
    product: {
      bg: "0F172A",
      titleColor: "FFFFFF",
      categoryColor: "F59E0B",
      skuColor: "94A3B8",
      priceColor: "F59E0B",
      priceCardBg: "1E293B",
      priceCardBorder: "334155",
      tableBg: "1E293B",
      tableBorder: "334155",
      tableLabelColor: "94A3B8",
      tableValColor: "F1F5F9",
      tableHighlightColor: "F59E0B",
      imgBorderColor: "334155",
      footerLineColor: "334155",
      footerTextColor: "64748B",
    },
    closing: {
      bg: "0F172A",
      titleColor: "FFFFFF",
      subtitleColor: "CBD5E1",
      cardBg: "1E293B",
      cardBorder: "334155",
      cardText: "E2E8F0",
    },
  },
  studio: {
    id: "studio",
    name: "Studio Minimalist",
    tagline: "Clean Editorial White & Charcoal",
    badge: "NORDIC CLEAN",
    swatch: {
      primary: "#ffffff",
      accent: "#18181b",
      card: "#f4f4f5",
      isDark: false,
    },
    cover: {
      bg: "FFFFFF",
      titleColor: "09090B",
      subtitleColor: "52525B",
      accentColor: "18181B",
      badgeBg: "18181B",
      badgeText: "FFFFFF",
      cardBg: "F4F4F5",
      cardBorder: "E4E4E7",
      cardText: "52525B",
      footerText: "71717A",
    },
    product: {
      bg: "FFFFFF",
      titleColor: "09090B",
      categoryColor: "18181B",
      skuColor: "71717A",
      priceColor: "09090B",
      priceCardBg: "F4F4F5",
      priceCardBorder: "E4E4E7",
      tableBg: "FAFAFA",
      tableBorder: "E4E4E7",
      tableLabelColor: "52525B",
      tableValColor: "09090B",
      tableHighlightColor: "18181B",
      imgBorderColor: "E4E4E7",
      footerLineColor: "E4E4E7",
      footerTextColor: "71717A",
    },
    closing: {
      bg: "FFFFFF",
      titleColor: "09090B",
      subtitleColor: "52525B",
      cardBg: "F4F4F5",
      cardBorder: "E4E4E7",
      cardText: "27272A",
    },
  },
  earth: {
    id: "earth",
    name: "Heritage Teak",
    tagline: "Warm Artisan Wood, Taupe & Espresso",
    badge: "HANDCRAFTED",
    swatch: {
      primary: "#291811",
      accent: "#b45309",
      card: "#fbf7f0",
      isDark: false,
    },
    cover: {
      bg: "1C120C",
      titleColor: "FFFBEB",
      subtitleColor: "D6C7B2",
      accentColor: "D97706",
      badgeBg: "B45309",
      badgeText: "FFFFFF",
      cardBg: "2E1D14",
      cardBorder: "452B1E",
      cardText: "D6C7B2",
      footerText: "8C7262",
    },
    product: {
      bg: "FFFDF9",
      titleColor: "291811",
      categoryColor: "B45309",
      skuColor: "785A48",
      priceColor: "B45309",
      priceCardBg: "FBF7F0",
      priceCardBorder: "EADBC8",
      tableBg: "FBF7F0",
      tableBorder: "EADBC8",
      tableLabelColor: "785A48",
      tableValColor: "291811",
      tableHighlightColor: "B45309",
      imgBorderColor: "EADBC8",
      footerLineColor: "EADBC8",
      footerTextColor: "8C7262",
    },
    closing: {
      bg: "1C120C",
      titleColor: "FFFBEB",
      subtitleColor: "D6C7B2",
      cardBg: "2E1D14",
      cardBorder: "452B1E",
      cardText: "FFFBEB",
    },
  },
  teal: {
    id: "teal",
    name: "Architectural Teal",
    tagline: "Modern Industrial Slate & Vibrant Teal",
    badge: "FACTORY SPEC",
    swatch: {
      primary: "#0f172a",
      accent: "#0d9488",
      card: "#f0fdfa",
      isDark: false,
    },
    cover: {
      bg: "0F172A",
      titleColor: "FFFFFF",
      subtitleColor: "CBD5E1",
      accentColor: "0D9488",
      badgeBg: "0D9488",
      badgeText: "FFFFFF",
      cardBg: "132338",
      cardBorder: "1E3A5F",
      cardText: "94A3B8",
      footerText: "64748B",
    },
    product: {
      bg: "FFFFFF",
      titleColor: "0F172A",
      categoryColor: "0D9488",
      skuColor: "64748B",
      priceColor: "0D9488",
      priceCardBg: "F0FDFA",
      priceCardBorder: "CCFBF1",
      tableBg: "F8FAFC",
      tableBorder: "E2E8F0",
      tableLabelColor: "475569",
      tableValColor: "0F172A",
      tableHighlightColor: "0D9488",
      imgBorderColor: "E2E8F0",
      footerLineColor: "E2E8F0",
      footerTextColor: "94A3B8",
    },
    closing: {
      bg: "0F172A",
      titleColor: "FFFFFF",
      subtitleColor: "CBD5E1",
      cardBg: "132338",
      cardBorder: "1E3A5F",
      cardText: "E2E8F0",
    },
  },
  navy: {
    id: "navy",
    name: "Corporate Royal",
    tagline: "Classic Navy & Sapphire Global Procurement",
    badge: "GLOBAL PROCUREMENT",
    swatch: {
      primary: "#0a192f",
      accent: "#1d4ed8",
      card: "#eff6ff",
      isDark: false,
    },
    cover: {
      bg: "0A192F",
      titleColor: "FFFFFF",
      subtitleColor: "94A3B8",
      accentColor: "38BDF8",
      badgeBg: "2563EB",
      badgeText: "FFFFFF",
      cardBg: "112240",
      cardBorder: "233554",
      cardText: "94A3B8",
      footerText: "64748B",
    },
    product: {
      bg: "FFFFFF",
      titleColor: "0A192F",
      categoryColor: "1D4ED8",
      skuColor: "475569",
      priceColor: "1D4ED8",
      priceCardBg: "EFF6FF",
      priceCardBorder: "DBEAFE",
      tableBg: "F8FAFC",
      tableBorder: "E2E8F0",
      tableLabelColor: "475569",
      tableValColor: "0A192F",
      tableHighlightColor: "1D4ED8",
      imgBorderColor: "E2E8F0",
      footerLineColor: "E2E8F0",
      footerTextColor: "94A3B8",
    },
    closing: {
      bg: "0A192F",
      titleColor: "FFFFFF",
      subtitleColor: "94A3B8",
      cardBg: "112240",
      cardBorder: "233554",
      cardText: "E2E8F0",
    },
  },
};

export interface PresentationFieldsConfig {
  includeCoverSlide: boolean;
  includeClosingSlide: boolean;
  includePricing: boolean;
  includeMoq: boolean;
  includeSku: boolean;
  includeCategory: boolean;
  includeCollection: boolean;
  includeMaterial: boolean;
  includeWoodFinish: boolean;
  includeMetalFinish: boolean;
  includeDimensions: boolean;
  includeAssembly: boolean;
  includeCbm: boolean;
  includeContainerQty: boolean;
  includeStockStatus: boolean;
}

export const DEFAULT_PRESENTATION_FIELDS: PresentationFieldsConfig = {
  includeCoverSlide: true,
  includeClosingSlide: true,
  includePricing: true,
  includeMoq: true,
  includeSku: true,
  includeCategory: true,
  includeCollection: true,
  includeMaterial: true,
  includeWoodFinish: true,
  includeMetalFinish: true,
  includeDimensions: true,
  includeAssembly: true,
  includeCbm: true,
  includeContainerQty: true,
  includeStockStatus: true,
};

export interface PptExportOptions {
  themeId?: ThemeId;
  customerName?: string;
  deckTitle?: string;
  includePricing?: boolean;
  fields?: Partial<PresentationFieldsConfig>;
  onProgress?: (current: number, total: number, message: string) => void;
}

/**
 * Safely converts an image URL or blob into a Base64 data URL.
 * Falls back gracefully to null if CORS or network issues occur.
 */
async function toBase64DataUrl(url: string): Promise<string | null> {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("data:image/")) return url;

  // 1. Try standard fetch with CORS
  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch {
    // Continue to canvas fallback
  }

  // 2. Try Image canvas conversion
  try {
    return await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || 600;
          canvas.height = img.naturalHeight || 450;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      // Timeout safeguard so export never hangs
      setTimeout(() => resolve(null), 3000);
      img.src = url;
    });
  } catch {
    return null;
  }
}

/**
 * Generates and downloads a presentation-ready 16:9 B2B PowerPoint (.pptx) deck
 * with dynamic executive theme customization.
 */
export async function generateProductPptx(
  products: CatalogProductItem[],
  options: PptExportOptions = {}
): Promise<void> {
  const {
    themeId = "obsidian",
    customerName = "Global Sourcing Partner",
    deckTitle = "Curated Product Presentation Deck",
    includePricing = true,
    onProgress,
  } = options;

  const fields: PresentationFieldsConfig = {
    ...DEFAULT_PRESENTATION_FIELDS,
    ...(options.includePricing !== undefined ? { includePricing: options.includePricing } : {}),
    ...(options.fields || {}),
  };

  const theme = DECK_THEMES[themeId] || DECK_THEMES.obsidian;

  if (!products || products.length === 0) {
    throw new Error("No products selected to generate PowerPoint presentation.");
  }

  const totalDeckSlides = (fields.includeCoverSlide ? 1 : 0) + products.length + (fields.includeClosingSlide ? 1 : 0);
  let slideNumber = 0;

  onProgress?.(0, totalDeckSlides, `Initializing ${theme.name} theme...`);

  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "LII Performance Nexus";
  pptx.company = "LII Exports";
  pptx.title = `LII Exports - ${deckTitle}`;
  pptx.subject = `B2B Product Catalogue Deck (${theme.name})`;

  const totalCbm = products.reduce((acc, p) => acc + (Number(p.cbm) || 0), 0);

  // -------------------------------------------------------------
  // SLIDE 1: COVER SLIDE
  // -------------------------------------------------------------
  if (fields.includeCoverSlide) {
    slideNumber++;
    onProgress?.(slideNumber, totalDeckSlides, "Creating Cover Slide...");
    const coverSlide = pptx.addSlide();
    coverSlide.background = { color: theme.cover.bg };

    // Header Subtitle & Badge
    coverSlide.addText("LII EXPORTS • B2B EXPORT CATALOGUE", {
      x: 0.8,
      y: 0.8,
      w: 6.0,
      h: 0.4,
      fontSize: 11,
      bold: true,
      color: theme.cover.accentColor,
    });

    coverSlide.addText(theme.badge, {
      x: 7.2,
      y: 0.75,
      w: 2.2,
      h: 0.35,
      fontSize: 9,
      bold: true,
      color: theme.cover.badgeText,
      align: "center",
      fill: { color: theme.cover.badgeBg },
      shape: pptx.ShapeType.roundRect,
    });

    // Main Deck Title
    coverSlide.addText(deckTitle, {
      x: 0.8,
      y: 1.4,
      w: 8.6,
      h: 1.1,
      fontSize: 32,
      bold: true,
      color: theme.cover.titleColor,
      lineSpacing: 38,
    });

    // Customer sub-heading
    coverSlide.addText(`Prepared for ${customerName} • ${products.length} Curated Product${products.length > 1 ? "s" : ""}`, {
      x: 0.8,
      y: 2.6,
      w: 8.6,
      h: 0.45,
      fontSize: 13,
      color: theme.cover.subtitleColor,
    });

    // Summary Metrics Card
    coverSlide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: 3.3,
      w: 8.4,
      h: 1.1,
      fill: { color: theme.cover.cardBg },
      line: { color: theme.cover.cardBorder, width: 1 },
    });

    const pricingNote = fields.includePricing ? "FOB Pricing & MOQ Included" : "Specs & Dimensions (Pricing Confidential)";

    coverSlide.addText(
      `Total Selected Volume: ${totalCbm.toFixed(2)} m³   |   Total Products: ${products.length} Items   |   Port: FOB Mundra/Pipavav, India\n${pricingNote}`,
      {
        x: 1.0,
        y: 3.45,
        w: 8.0,
        h: 0.8,
        fontSize: 11,
        color: theme.cover.cardText,
        align: "center",
        valign: "middle",
      }
    );

    // Footer
    coverSlide.addText("Confidential B2B Presentation • LII Exports Jodhpur • All Rights Reserved", {
      x: 0.8,
      y: 4.9,
      w: 8.4,
      h: 0.3,
      fontSize: 9,
      color: theme.cover.footerText,
    });
  }

  // -------------------------------------------------------------
  // SLIDES 2..N: PRODUCT SLIDES
  // -------------------------------------------------------------
  for (let idx = 0; idx < products.length; idx++) {
    const p = products[idx];
    slideNumber++;
    onProgress?.(slideNumber, totalDeckSlides, `Building Slide ${slideNumber} (${p.sku})...`);

    const pSlide = pptx.addSlide();
    pSlide.background = { color: theme.product.bg };

    // 1. Category / Subcategory Tag
    if (fields.includeCategory) {
      pSlide.addText(`${(p.category || "FURNITURE").toUpperCase()} • ${(p.subCategory || "GENERAL").toUpperCase()}`, {
        x: 5.3,
        y: 0.4,
        w: 4.2,
        h: 0.25,
        fontSize: 10,
        bold: true,
        color: theme.product.categoryColor,
      });
    }

    // 2. Product Name
    pSlide.addText(p.name || "Product Item", {
      x: 5.3,
      y: fields.includeCategory ? 0.65 : 0.45,
      w: 4.2,
      h: 0.65,
      fontSize: 17,
      bold: true,
      color: theme.product.titleColor,
      valign: "top",
    });

    // 3. Price & SKU Card
    const showCard = fields.includePricing || fields.includeMoq || fields.includeSku || fields.includeStockStatus;
    const cardY = fields.includeCategory ? 1.35 : 1.15;
    if (showCard) {
      pSlide.addShape(pptx.ShapeType.roundRect, {
        x: 5.3,
        y: cardY,
        w: 4.2,
        h: 0.65,
        fill: { color: theme.product.priceCardBg },
        line: { color: theme.product.priceCardBorder, width: 1 },
      });

      if (fields.includePricing) {
        pSlide.addText(`$${Number(p.fobPriceUsd || 0).toFixed(2)} USD`, {
          x: 5.45,
          y: cardY + 0.05,
          w: 2.2,
          h: 0.35,
          fontSize: 14,
          bold: true,
          color: theme.product.priceColor,
        });
        if (fields.includeMoq) {
          pSlide.addText(`MOQ: ${p.moq || 10} Pcs`, {
            x: 5.45,
            y: cardY + 0.37,
            w: 2.2,
            h: 0.22,
            fontSize: 8.5,
            color: theme.product.skuColor,
          });
        }
      } else if (fields.includeMoq) {
        pSlide.addText(`MOQ: ${p.moq || 10} Pcs`, {
          x: 5.45,
          y: cardY + 0.15,
          w: 2.2,
          h: 0.35,
          fontSize: 12,
          bold: true,
          color: theme.product.priceColor,
        });
      }

      const rightLines: string[] = [];
      if (fields.includeSku) rightLines.push(`SKU: ${p.sku}`);
      if (fields.includeStockStatus) rightLines.push(`Status: ${p.stockStatus || "Active"}`);

      if (rightLines.length > 0) {
        pSlide.addText(rightLines.join("\n"), {
          x: 7.7,
          y: cardY + 0.05,
          w: 1.7,
          h: 0.55,
          fontSize: 9,
          bold: true,
          color: theme.product.skuColor,
          align: "right",
        });
      }
    }

    // 4. Specifications Table (Filter fields based on configuration)
    const tableRows: Array<[any, any]> = [];
    if (fields.includeCollection) {
      tableRows.push([
        { text: "Collection", options: { bold: true, color: theme.product.tableLabelColor } },
        { text: p.collectionName || "Factory Collection", options: { color: theme.product.tableValColor, bold: true } },
      ]);
    }
    if (fields.includeMaterial) {
      tableRows.push([
        { text: "Material", options: { bold: true, color: theme.product.tableLabelColor } },
        { text: p.material || "Wood / Metal", options: { color: theme.product.tableValColor } },
      ]);
    }
    if (fields.includeWoodFinish) {
      tableRows.push([
        { text: "Wood Finish", options: { bold: true, color: theme.product.tableLabelColor } },
        { text: p.woodFinish || "Natural", options: { color: theme.product.tableValColor } },
      ]);
    }
    if (fields.includeMetalFinish) {
      tableRows.push([
        { text: "Metal Finish", options: { bold: true, color: theme.product.tableLabelColor } },
        { text: p.metalFinish || "N/A", options: { color: theme.product.tableValColor } },
      ]);
    }
    if (fields.includeDimensions) {
      tableRows.push([
        { text: "Dimensions (CM)", options: { bold: true, color: theme.product.tableLabelColor } },
        { text: `${p.sizeCm || "N/A"} CM`, options: { color: theme.product.tableValColor } },
      ]);
    }
    if (fields.includeAssembly) {
      tableRows.push([
        { text: "Assembly", options: { bold: true, color: theme.product.tableLabelColor } },
        { text: p.assembledKd || "KD", options: { color: theme.product.tableValColor } },
      ]);
    }
    if (fields.includeCbm) {
      tableRows.push([
        { text: "Unit CBM", options: { bold: true, color: theme.product.tableLabelColor } },
        { text: `${Number(p.cbm || 0).toFixed(3)} m³`, options: { color: theme.product.tableHighlightColor, bold: true } },
      ]);
    }
    if (fields.includeContainerQty) {
      tableRows.push([
        { text: "40ft GP Qty", options: { bold: true, color: theme.product.tableLabelColor } },
        { text: `${p.gp40ft || 0} Pcs`, options: { color: theme.product.tableHighlightColor, bold: true } },
      ]);
    }

    if (tableRows.length > 0) {
      const tableY = showCard ? cardY + 0.8 : cardY;
      const tableHeight = Math.min(2.7, Math.max(0.6, tableRows.length * 0.32));

      pSlide.addTable(tableRows, {
        x: 5.3,
        y: tableY,
        w: 4.2,
        h: tableHeight,
        fontSize: 9,
        fill: { color: theme.product.tableBg },
        border: { type: "solid", pt: 1, color: theme.product.tableBorder },
        margin: [3, 5, 3, 5],
        colW: [1.4, 2.8],
      });
    }

    // 5. Left Image Box
    const base64Img = await toBase64DataUrl(p.image);
    if (base64Img) {
      try {
        pSlide.addImage({
          data: base64Img,
          x: 0.6,
          y: 0.5,
          w: 4.4,
          h: 4.3,
          sizing: { type: "contain", w: 4.4, h: 4.3 },
        });
      } catch (err) {
        console.warn(`Could not add image for ${p.sku}, using fallback box:`, err);
        pSlide.addShape(pptx.ShapeType.roundRect, {
          x: 0.6,
          y: 0.5,
          w: 4.4,
          h: 4.3,
          fill: { color: theme.product.tableBg },
          line: { color: theme.product.imgBorderColor, width: 1 },
        });
        pSlide.addText(`📸 ${p.name}\n[${p.sku}]`, {
          x: 0.8,
          y: 2.2,
          w: 4.0,
          h: 1.0,
          fontSize: 12,
          bold: true,
          color: theme.product.skuColor,
          align: "center",
        });
      }
    } else {
      pSlide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6,
        y: 0.5,
        w: 4.4,
        h: 4.3,
        fill: { color: theme.product.tableBg },
        line: { color: theme.product.imgBorderColor, width: 1 },
      });
      pSlide.addText(`📸 ${p.name}\n[${p.sku}]`, {
        x: 0.8,
        y: 2.2,
        w: 4.0,
        h: 1.0,
        fontSize: 12,
        bold: true,
        color: theme.product.skuColor,
        align: "center",
      });
    }

    // 6. Slide Footer
    pSlide.addShape(pptx.ShapeType.line, {
      x: 0.6,
      y: 4.95,
      w: 8.8,
      h: 0,
      line: { color: theme.product.footerLineColor, width: 1 },
    });

    pSlide.addText("LII Exports • B2B Product Catalogue Presentation Deck", {
      x: 0.6,
      y: 5.0,
      w: 5.0,
      h: 0.3,
      fontSize: 8,
      color: theme.product.footerTextColor,
    });

    pSlide.addText(`Slide ${slideNumber} of ${totalDeckSlides}`, {
      x: 7.4,
      y: 5.0,
      w: 2.0,
      h: 0.3,
      fontSize: 8,
      color: theme.product.footerTextColor,
      align: "right",
    });
  }

  // -------------------------------------------------------------
  // SLIDE FINAL: CLOSING SLIDE
  // -------------------------------------------------------------
  if (fields.includeClosingSlide) {
    slideNumber++;
    onProgress?.(slideNumber, totalDeckSlides, "Adding Closing Slide...");
    const closingSlide = pptx.addSlide();
    closingSlide.background = { color: theme.closing.bg };

    closingSlide.addText("Thank You for Exploring LII Exports", {
      x: 0.8,
      y: 1.4,
      w: 8.4,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: theme.closing.titleColor,
      align: "center",
    });

    closingSlide.addText(
      "For sample requests, customized finishes, FOB container quotations, or factory audit visits:",
      {
        x: 0.8,
        y: 2.3,
        w: 8.4,
        h: 0.4,
        fontSize: 13,
        color: theme.closing.subtitleColor,
        align: "center",
      }
    );

    closingSlide.addShape(pptx.ShapeType.roundRect, {
      x: 1.5,
      y: 3.0,
      w: 7.0,
      h: 1.5,
      fill: { color: theme.closing.cardBg },
      line: { color: theme.closing.cardBorder, width: 1 },
    });

    closingSlide.addText(
      "📧 Email: exports@liinexus.com   |   sales@liinexus.com\n🌐 Web: www.liiexports.com   |   Direct: +91 98290 00000\n📍 Factory: Export Promotion Industrial Park, Jodhpur, Rajasthan, India\n✨ Handcrafted Solid Wood, Natural Rattan & Architectural Metal Furniture",
      {
        x: 1.7,
        y: 3.15,
        w: 6.6,
        h: 1.2,
        fontSize: 11,
        color: theme.closing.cardText,
        align: "center",
        lineSpacing: 20,
      }
    );
  }

  onProgress?.(totalDeckSlides, totalDeckSlides, "Downloading PowerPoint presentation (.pptx)...");

  const sanitizedFileName = `LII_${theme.name.replace(/\s+/g, "_")}_Catalogue_Deck_${new Date().toISOString().slice(0, 10)}.pptx`;
  await pptx.writeFile({ fileName: sanitizedFileName });
}
