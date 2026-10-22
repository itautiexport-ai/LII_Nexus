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

export interface PptExportOptions {
  customerName?: string;
  deckTitle?: string;
  includePricing?: boolean;
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
 */
export async function generateProductPptx(
  products: CatalogProductItem[],
  options: PptExportOptions = {}
): Promise<void> {
  const {
    customerName = "Valued Global Sourcing Partner",
    deckTitle = "Curated Product Presentation Deck",
    includePricing = true,
    onProgress,
  } = options;

  if (!products || products.length === 0) {
    throw new Error("No products selected to generate PowerPoint presentation.");
  }

  onProgress?.(0, products.length + 2, "Initializing PowerPoint deck engine...");

  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "LII Performance Nexus";
  pptx.company = "LII Exports";
  pptx.title = `LII Exports - ${deckTitle}`;
  pptx.subject = "Curated B2B Product Catalogue Presentation Deck";

  const totalCbm = products.reduce((acc, p) => acc + (Number(p.cbm) || 0), 0);

  // -------------------------------------------------------------
  // SLIDE 1: COVER SLIDE
  // -------------------------------------------------------------
  onProgress?.(1, products.length + 2, "Creating Cover Slide...");
  const coverSlide = pptx.addSlide();
  coverSlide.background = { color: "0F172A" }; // Deep slate dark

  // Header Subtitle & Badge
  coverSlide.addText("LII EXPORTS • B2B EXPORT CATALOGUE", {
    x: 0.8,
    y: 0.8,
    w: 6.0,
    h: 0.4,
    fontSize: 11,
    bold: true,
    color: "818CF8",
  });

  coverSlide.addText("2026 OFFICIAL COLLECTION", {
    x: 7.2,
    y: 0.75,
    w: 2.2,
    h: 0.35,
    fontSize: 9,
    bold: true,
    color: "FFFFFF",
    align: "center",
    fill: { color: "0D9488" },
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
    color: "FFFFFF",
    lineSpacing: 38,
  });

  // Customer sub-heading
  coverSlide.addText(`Prepared for ${customerName} • ${products.length} Curated Product${products.length > 1 ? "s" : ""}`, {
    x: 0.8,
    y: 2.6,
    w: 8.6,
    h: 0.45,
    fontSize: 13,
    color: "C7D2FE",
  });

  // Summary Metrics Card
  coverSlide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 3.3,
    w: 8.4,
    h: 1.1,
    fill: { color: "1E293B" },
    line: { color: "334155", width: 1 },
  });

  const pricingNote = includePricing ? "FOB Pricing & MOQ Included" : "Specs & Dimensions (Pricing Confidential)";

  coverSlide.addText(
    `Total Selected Volume: ${totalCbm.toFixed(2)} m³   |   Total Products: ${products.length} Items   |   Port: FOB Mundra/Pipavav, India\n${pricingNote}`,
    {
      x: 1.0,
      y: 3.45,
      w: 8.0,
      h: 0.8,
      fontSize: 11,
      color: "94A3B8",
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
    color: "64748B",
  });

  // -------------------------------------------------------------
  // SLIDES 2..N: PRODUCT SLIDES
  // -------------------------------------------------------------
  for (let idx = 0; idx < products.length; idx++) {
    const p = products[idx];
    onProgress?.(idx + 2, products.length + 2, `Building Slide ${idx + 2} (${p.sku})...`);

    const pSlide = pptx.addSlide();
    pSlide.background = { color: "FFFFFF" };

    // 1. Category / Subcategory Tag
    pSlide.addText(`${(p.category || "FURNITURE").toUpperCase()} • ${(p.subCategory || "GENERAL").toUpperCase()}`, {
      x: 5.3,
      y: 0.4,
      w: 4.2,
      h: 0.25,
      fontSize: 10,
      bold: true,
      color: "0D9488",
    });

    // 2. Product Name
    pSlide.addText(p.name || "Product Item", {
      x: 5.3,
      y: 0.65,
      w: 4.2,
      h: 0.65,
      fontSize: 17,
      bold: true,
      color: "0F172A",
      valign: "top",
    });

    // 3. Price & SKU Card
    pSlide.addShape(pptx.ShapeType.roundRect, {
      x: 5.3,
      y: 1.35,
      w: 4.2,
      h: 0.65,
      fill: { color: "F8FAFC" },
      line: { color: "E2E8F0", width: 1 },
    });

    if (includePricing) {
      pSlide.addText(`$${Number(p.fobPriceUsd || 0).toFixed(2)} USD`, {
        x: 5.45,
        y: 1.4,
        w: 2.2,
        h: 0.35,
        fontSize: 14,
        bold: true,
        color: "0D9488",
      });
      pSlide.addText(`MOQ: ${p.moq || 10} Pcs`, {
        x: 5.45,
        y: 1.72,
        w: 2.2,
        h: 0.22,
        fontSize: 8.5,
        color: "64748B",
      });
    } else {
      pSlide.addText("Wholesale Export Specification", {
        x: 5.45,
        y: 1.45,
        w: 2.2,
        h: 0.45,
        fontSize: 11,
        bold: true,
        color: "0D9488",
      });
    }

    pSlide.addText(`SKU: ${p.sku}\nStatus: ${p.stockStatus || "Active"}`, {
      x: 7.7,
      y: 1.4,
      w: 1.7,
      h: 0.55,
      fontSize: 9,
      bold: true,
      color: "475569",
      align: "right",
    });

    // 4. Specifications Table
    const tableRows = [
      [
        { text: "Collection", options: { bold: true, color: "475569" } },
        { text: p.collectionName || "Factory Collection", options: { color: "1E293B", bold: true } },
      ],
      [
        { text: "Material", options: { bold: true, color: "475569" } },
        { text: p.material || "Wood / Metal", options: { color: "1E293B" } },
      ],
      [
        { text: "Wood Finish", options: { bold: true, color: "475569" } },
        { text: p.woodFinish || "Natural", options: { color: "1E293B" } },
      ],
      [
        { text: "Metal Finish", options: { bold: true, color: "475569" } },
        { text: p.metalFinish || "N/A", options: { color: "1E293B" } },
      ],
      [
        { text: "Dimensions (CM)", options: { bold: true, color: "475569" } },
        { text: `${p.sizeCm || "N/A"} CM`, options: { color: "1E293B" } },
      ],
      [
        { text: "Assembly", options: { bold: true, color: "475569" } },
        { text: p.assembledKd || "KD", options: { color: "1E293B" } },
      ],
      [
        { text: "Unit CBM", options: { bold: true, color: "475569" } },
        { text: `${Number(p.cbm || 0).toFixed(3)} m³`, options: { color: "0D9488", bold: true } },
      ],
      [
        { text: "40ft GP Qty", options: { bold: true, color: "475569" } },
        { text: `${p.gp40ft || 0} Pcs`, options: { color: "0D9488", bold: true } },
      ],
    ];

    pSlide.addTable(tableRows, {
      x: 5.3,
      y: 2.15,
      w: 4.2,
      h: 2.6,
      fontSize: 9,
      fill: { color: "F8FAFC" },
      border: { type: "solid", pt: 1, color: "E2E8F0" },
      margin: [3, 5, 3, 5],
      colW: [1.4, 2.8],
    });

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
        // Fallback placeholder box
        pSlide.addShape(pptx.ShapeType.roundRect, {
          x: 0.6,
          y: 0.5,
          w: 4.4,
          h: 4.3,
          fill: { color: "F1F5F9" },
          line: { color: "CBD5E1", width: 1 },
        });
        pSlide.addText(`📸 ${p.name}\n[${p.sku}]`, {
          x: 0.8,
          y: 2.2,
          w: 4.0,
          h: 1.0,
          fontSize: 12,
          bold: true,
          color: "64748B",
          align: "center",
        });
      }
    } else {
      // Placeholder box
      pSlide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6,
        y: 0.5,
        w: 4.4,
        h: 4.3,
        fill: { color: "F1F5F9" },
        line: { color: "CBD5E1", width: 1 },
      });
      pSlide.addText(`📸 ${p.name}\n[${p.sku}]`, {
        x: 0.8,
        y: 2.2,
        w: 4.0,
        h: 1.0,
        fontSize: 12,
        bold: true,
        color: "64748B",
        align: "center",
      });
    }

    // 6. Slide Footer
    pSlide.addShape(pptx.ShapeType.line, {
      x: 0.6,
      y: 4.95,
      w: 8.8,
      h: 0,
      line: { color: "E2E8F0", width: 1 },
    });

    pSlide.addText("LII Exports • B2B Product Catalogue Presentation Deck", {
      x: 0.6,
      y: 5.0,
      w: 5.0,
      h: 0.3,
      fontSize: 8,
      color: "94A3B8",
    });

    pSlide.addText(`Slide ${idx + 2} of ${products.length + 2}`, {
      x: 7.4,
      y: 5.0,
      w: 2.0,
      h: 0.3,
      fontSize: 8,
      color: "94A3B8",
      align: "right",
    });
  }

  // -------------------------------------------------------------
  // SLIDE FINAL: CLOSING SLIDE
  // -------------------------------------------------------------
  onProgress?.(products.length + 2, products.length + 2, "Adding Closing Slide...");
  const closingSlide = pptx.addSlide();
  closingSlide.background = { color: "0F172A" };

  closingSlide.addText("Thank You for Exploring LII Exports", {
    x: 0.8,
    y: 1.4,
    w: 8.4,
    h: 0.8,
    fontSize: 28,
    bold: true,
    color: "FFFFFF",
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
      color: "C7D2FE",
      align: "center",
    }
  );

  closingSlide.addShape(pptx.ShapeType.roundRect, {
    x: 1.5,
    y: 3.0,
    w: 7.0,
    h: 1.5,
    fill: { color: "1E293B" },
    line: { color: "334155", width: 1 },
  });

  closingSlide.addText(
    "📧 Email: exports@liinexus.com   |   sales@liinexus.com\n🌐 Web: www.liiexports.com   |   Direct: +91 98290 00000\n📍 Factory: Export Promotion Industrial Park, Jodhpur, Rajasthan, India\n✨ Handcrafted Solid Wood, Natural Rattan & Architectural Metal Furniture",
    {
      x: 1.7,
      y: 3.15,
      w: 6.6,
      h: 1.2,
      fontSize: 11,
      color: "E2E8F0",
      align: "center",
      lineSpacing: 20,
    }
  );

  onProgress?.(products.length + 2, products.length + 2, "Downloading PowerPoint presentation (.pptx)...");

  const sanitizedFileName = `LII_Product_Catalogue_Deck_${new Date().toISOString().slice(0, 10)}.pptx`;
  await pptx.writeFile({ fileName: sanitizedFileName });
}
