import React, { useState, useEffect } from "react";
import "../Sourcewiz.css";
import {
  generateProductPptx,
  DECK_THEMES,
  ThemeId,
  DeckTheme,
  CatalogProductItem,
  PresentationFieldsConfig,
  DEFAULT_PRESENTATION_FIELDS,
} from "../utils/pptxExport";
import { exportProductsToExcel } from "../utils/excelExport";
import { catalogueShareApi, SharedDeckData } from "../api/catalogueShareApi";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80";

const INITIAL_MOCK_PRODUCTS: CatalogProductItem[] = [
  {
    id: "1",
    sku: "SW-LII-DT-12557",
    name: "Muddo Solid Oak Dining Table",
    category: "Furniture",
    subCategory: "Dining Table",
    collectionName: "Muddo Collection",
    material: "Mango Wood / Solid Oak",
    woodFinish: "Natural Matte",
    metalFinish: "Powder Coated Brass",
    sizeCm: "150 x 150 x 76",
    fobPriceUsd: 285.0,
    moq: 20,
    cbm: 0.706,
    gp40ft: 72,
    assembledKd: "KD",
    image: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=600&auto=format&fit=crop&q=80",
    stockStatus: "In Stock",
  },
  {
    id: "2",
    sku: "SW-LII-OC-04",
    name: "Minimalist Ergonomic Executive Chair",
    category: "Furniture",
    subCategory: "Dining Chair",
    collectionName: "Nordic Office Series",
    material: "Solid Teak Wood & Leather",
    woodFinish: "Walnut Stain",
    metalFinish: "Chrome Accent",
    sizeCm: "60 x 62 x 95",
    fobPriceUsd: 110.0,
    moq: 50,
    cbm: 0.18,
    gp40ft: 148,
    assembledKd: "Assembled",
    image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&auto=format&fit=crop&q=80",
    stockStatus: "Sample Ready",
  },
  {
    id: "3",
    sku: "SW-LII-AC-09",
    name: "Handcrafted Rattan Lounge Armchair",
    category: "Outdoor",
    subCategory: "Lounge Chair",
    collectionName: "Balinesia Rattan Line",
    material: "Natural Rattan & Teak Frame",
    woodFinish: "Honey Matte",
    metalFinish: "N/A",
    sizeCm: "85 x 80 x 75",
    fobPriceUsd: 185.0,
    moq: 30,
    cbm: 0.42,
    gp40ft: 96,
    assembledKd: "Assembled",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80",
    stockStatus: "Made to Order",
  },
  {
    id: "4",
    sku: "SW-LII-SB-12",
    name: "Industrial Brass & Mango Wood Sideboard",
    category: "Storage",
    subCategory: "Cabinet",
    collectionName: "Heritage Brass Line",
    material: "Seasoned Mango Wood",
    woodFinish: "Distressed Antique",
    metalFinish: "Brushed Solid Brass",
    sizeCm: "180 x 45 x 85",
    fobPriceUsd: 320.0,
    moq: 15,
    cbm: 0.58,
    gp40ft: 64,
    assembledKd: "Semi KD",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80",
    stockStatus: "In Stock",
  },
];

export default function SourcewizProductsPage() {
  const [products, setProducts] = useState<CatalogProductItem[]>(INITIAL_MOCK_PRODUCTS);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Selected products for presentation
  const [selectedIds, setSelectedIds] = useState<string[]>(["1", "4"]);

  // Modal & Presentation Studio State
  const [isPptModalOpen, setIsPptModalOpen] = useState(false);
  const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Deck Options & Theme
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>("obsidian");
  const [customerName, setCustomerName] = useState("West Elm Global Sourcing");
  const [deckTitle, setDeckTitle] = useState("Curated Product Presentation Deck");
  const [fieldsConfig, setFieldsConfig] = useState<PresentationFieldsConfig>(DEFAULT_PRESENTATION_FIELDS);

  // Field customization toggles & presets
  const toggleField = (key: keyof PresentationFieldsConfig) => {
    setFieldsConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyPreset = (preset: "all" | "hidePricing" | "specsOnly" | "minimal") => {
    if (preset === "all") {
      setFieldsConfig({
        includeCoverSlide: true,
        includeClosingSlide: true,
        includePricing: true,
        includeMoq: true,
        includeStockStatus: true,
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
      });
    } else if (preset === "hidePricing") {
      setFieldsConfig({
        ...DEFAULT_PRESENTATION_FIELDS,
        includePricing: false,
        includeMoq: false,
      });
    } else if (preset === "specsOnly") {
      setFieldsConfig({
        ...DEFAULT_PRESENTATION_FIELDS,
        includePricing: false,
        includeMoq: false,
        includeStockStatus: false,
      });
    } else if (preset === "minimal") {
      setFieldsConfig({
        includeCoverSlide: true,
        includeClosingSlide: true,
        includePricing: false,
        includeMoq: false,
        includeStockStatus: false,
        includeSku: true,
        includeCategory: false,
        includeCollection: false,
        includeMaterial: true,
        includeWoodFinish: true,
        includeMetalFinish: false,
        includeDimensions: true,
        includeAssembly: false,
        includeCbm: false,
        includeContainerQty: false,
      });
    }
  };

  const activeFieldsCount = Object.values(fieldsConfig).filter(Boolean).length;

  // Export progress
  const [isExportingPpt, setIsExportingPpt] = useState(false);
  const [exportProgressMsg, setExportProgressMsg] = useState("");

  // Excel & Share Link State
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [generatedDeck, setGeneratedDeck] = useState<SharedDeckData | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Deck History State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [sharedDecksHistory, setSharedDecksHistory] = useState<SharedDeckData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem("lii_product_catalogue_items") ||
        localStorage.getItem("lii_product_catalog_items");
      if (saved) {
        const parsed: CatalogProductItem[] = JSON.parse(saved);
        if (parsed.length > 0) {
          const defaultIds = new Set(INITIAL_MOCK_PRODUCTS.map((p) => p.id));
          const filteredCustom = parsed.filter((p) => !defaultIds.has(p.id));
          setProducts([...filteredCustom, ...INITIAL_MOCK_PRODUCTS]);
        }
      }
    } catch (e) {
      console.error("Failed to load products from localStorage:", e);
    }
  }, []);

  const categories = ["All", "Furniture", "Outdoor", "Storage", "Decor"];

  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === "All" || p.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCat;
    const matchesSearch =
      (p.name || "").toLowerCase().includes(q) ||
      (p.sku || "").toLowerCase().includes(q) ||
      (p.material || "").toLowerCase().includes(q) ||
      (p.collectionName || "").toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  const handleSelectProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleDownloadPptx = async (themeOverride?: ThemeId) => {
    if (selectedProducts.length === 0) return;
    setIsExportingPpt(true);
    try {
      await generateProductPptx(selectedProducts, {
        themeId: themeOverride || selectedThemeId,
        customerName: customerName || "Global Sourcing Partner",
        deckTitle: deckTitle || "Curated Product Presentation Deck",
        includePricing: fieldsConfig.includePricing,
        fields: fieldsConfig,
        onProgress: (_curr, _tot, msg) => setExportProgressMsg(msg),
      });
    } catch (err: any) {
      console.error("PowerPoint generation error:", err);
      alert("Failed to create PowerPoint presentation: " + (err?.message || "Unknown error"));
    } finally {
      setIsExportingPpt(false);
      setExportProgressMsg("");
    }
  };

  const handleExportExcel = () => {
    if (selectedProducts.length === 0) return;
    exportProductsToExcel(selectedProducts, {
      deckTitle: deckTitle || "LII_Product_Catalogue",
      customerName: customerName || "",
      includePricing: fieldsConfig.includePricing,
      fields: fieldsConfig,
    });
  };

  const handleGenerateShareLink = async () => {
    if (selectedProducts.length === 0) return;
    setIsGeneratingLink(true);
    try {
      const result = await catalogueShareApi.createSharedDeck({
        title: deckTitle || "Curated Product Presentation Deck",
        customerName: customerName || "",
        themeId: selectedThemeId,
        includePricing: fieldsConfig.includePricing,
        fieldsConfig,
        products: selectedProducts,
      });
      setGeneratedDeck(result);
      setCopySuccess(false);
      setShareModalOpen(true);
    } catch (err: any) {
      console.error("Failed to generate share link:", err);
      alert("Failed to create shared presentation link: " + (err?.response?.data?.error?.message || err?.message));
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedDeck) return;
    const fullUrl = `${window.location.origin}/view-deck/${generatedDeck.token}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    });
  };

  const loadSharedDecksHistory = async () => {
    setLoadingHistory(true);
    setHistoryModalOpen(true);
    try {
      const data = await catalogueShareApi.getMySharedDecks();
      setSharedDecksHistory(data);
    } catch (err) {
      console.error("Failed to load shared decks history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const currentTheme: DeckTheme = DECK_THEMES[selectedThemeId] || DECK_THEMES.obsidian;

  return (
    <div
      className="sw-container"
      style={{
        paddingBottom: "40px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Inter, Arial, sans-serif',
      }}
    >
      {/* ENTERPRISE HEADER */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "18px 24px",
          marginBottom: "18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "1.45rem",
                fontWeight: 700,
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              Product Catalogue
            </h1>
            <span
              style={{
                background: "#f1f5f9",
                color: "#475569",
                fontSize: "0.74rem",
                fontWeight: 700,
                padding: "2px 10px",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {products.length} Items Recorded
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
            Select items from the product master table to generate high-resolution, export-grade PowerPoint (.pptx) presentations for international buyer inquiries.
          </p>
        </div>

        {/* View Switcher: Table vs Grid */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              background: "#f1f5f9",
              borderRadius: "8px",
              padding: "3px",
              display: "flex",
              border: "1px solid #e2e8f0",
            }}
          >
            <button
              onClick={() => setViewMode("table")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: viewMode === "table" ? "#ffffff" : "transparent",
                color: viewMode === "table" ? "#0f172a" : "#64748b",
                fontWeight: viewMode === "table" ? 700 : 500,
                fontSize: "0.78rem",
                cursor: "pointer",
                boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.15s ease",
              }}
            >
              <span>☰</span> Table View
            </button>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: viewMode === "grid" ? "#ffffff" : "transparent",
                color: viewMode === "grid" ? "#0f172a" : "#64748b",
                fontWeight: viewMode === "grid" ? 700 : 500,
                fontSize: "0.78rem",
                cursor: "pointer",
                boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.15s ease",
              }}
            >
              <span>⊞</span> Grid View
            </button>
          </div>

          <button
            onClick={loadSharedDecksHistory}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontWeight: 600,
              fontSize: "0.78rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              transition: "all 0.15s ease",
            }}
            title="View shared presentation links and buyer view activity"
          >
            <span>🔗</span>
            <span>Shared Links Activity</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "12px 18px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
        }}
      >
        {/* Category Filter Pills & Select All */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={handleSelectAll}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background:
                selectedIds.length === filteredProducts.length && filteredProducts.length > 0
                  ? "#f1f5f9"
                  : "#ffffff",
              color: "#334155",
              fontWeight: 600,
              fontSize: "0.78rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>
              {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? "✓" : "☐"}
            </span>
            {selectedIds.length === filteredProducts.length && filteredProducts.length > 0
              ? "Deselect All"
              : "Select All"}
          </button>

          <div style={{ width: "1px", height: "20px", background: "#e2e8f0", margin: "0 4px" }} />

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {categories.map((cat) => {
              const count = cat === "All" ? products.length : products.filter((p) => p.category === cat).length;
              const isActive = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: isActive ? "1px solid #0f172a" : "1px solid #e2e8f0",
                    background: isActive ? "#0f172a" : "#f8fafc",
                    color: isActive ? "#ffffff" : "#475569",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", minWidth: "260px" }}>
          <input
            type="text"
            placeholder="Search SKU, name, material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 12px 7px 32px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "0.82rem",
              outline: "none",
              color: "#1e293b",
              background: "#ffffff",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              fontSize: "0.80rem",
            }}
          >
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "0.75rem",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* INLINE THEME & PPT PRESENTATION DOCK */}
      {selectedIds.length > 0 && (
        <div
          style={{
            background: "#0f172a",
            color: "#ffffff",
            padding: "12px 18px",
            borderRadius: "10px",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 14px rgba(15, 23, 42, 0.15)",
            flexWrap: "wrap",
            gap: "12px",
            border: "1px solid #1e293b",
          }}
        >
          {/* Left: Counter & Theme Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "0.74rem",
                }}
              >
                {selectedIds.length}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                  {selectedIds.length} Item{selectedIds.length > 1 ? "s" : ""} Selected
                </div>
                <button
                  onClick={handleClearSelection}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "#94a3b8",
                    fontSize: "0.70rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <div style={{ width: "1px", height: "22px", background: "rgba(255,255,255,0.15)" }} />

            {/* Quick Theme Selector Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600 }}>Theme:</span>
              <select
                value={selectedThemeId}
                onChange={(e) => setSelectedThemeId(e.target.value as ThemeId)}
                style={{
                  background: "#1e293b",
                  color: "#ffffff",
                  border: "1px solid #334155",
                  borderRadius: "6px",
                  padding: "6px 10px",
                  fontSize: "0.80rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {Object.values(DECK_THEMES).map((th) => (
                  <option key={th.id} value={th.id}>
                    {th.name} ({th.badge})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {/* Field Selection / Details Option Button */}
            <button
              onClick={() => setIsFieldsModalOpen(true)}
              style={{
                background: "rgba(59, 130, 246, 0.2)",
                color: "#93c5fd",
                border: "1px solid rgba(59, 130, 246, 0.45)",
                borderRadius: "6px",
                padding: "7px 13px",
                fontWeight: 700,
                fontSize: "0.78rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
              title="Select which product details to include or exclude (Pricing, Specs, MOQ, Logistics, Slides)"
            >
              <span>⚙</span>
              <span>Details to Include ({activeFieldsCount}/15)</span>
            </button>

            <button
              onClick={() => setIsPptModalOpen(true)}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "6px",
                padding: "7px 12px",
                fontWeight: 600,
                fontSize: "0.78rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              🎨 Themes & Preview
            </button>

            {/* Option: Export Excel */}
            <button
              onClick={handleExportExcel}
              style={{
                background: "rgba(16, 185, 129, 0.2)",
                color: "#34d399",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                borderRadius: "6px",
                padding: "7px 13px",
                fontWeight: 600,
                fontSize: "0.78rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
              title="Export product details and specs to Excel (.xlsx)"
            >
              <span>📊</span>
              <span>Export Excel</span>
            </button>

            {/* Option: Share Link with Buyer */}
            <button
              onClick={handleGenerateShareLink}
              disabled={isGeneratingLink}
              style={{
                background: isGeneratingLink ? "#475569" : "rgba(168, 85, 247, 0.22)",
                color: "#c084fc",
                border: "1px solid rgba(168, 85, 247, 0.4)",
                borderRadius: "6px",
                padding: "7px 13px",
                fontWeight: 600,
                fontSize: "0.78rem",
                cursor: isGeneratingLink ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
              title="Generate web presentation link with real-time open notifications"
            >
              <span>{isGeneratingLink ? "⏳" : "🔗"}</span>
              <span>{isGeneratingLink ? "Creating Link..." : "Share Link with Buyer"}</span>
            </button>

            {/* Option: Download PowerPoint */}
            <button
              onClick={() => handleDownloadPptx()}
              disabled={isExportingPpt}
              style={{
                background: isExportingPpt ? "#64748b" : "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "7px 16px",
                fontWeight: 700,
                fontSize: "0.80rem",
                cursor: isExportingPpt ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
              }}
              title="Download PowerPoint presentation deck (.pptx)"
            >
              <span>{isExportingPpt ? "⏳" : "📥"}</span>
              <span>
                {isExportingPpt
                  ? exportProgressMsg || "Generating PPT..."
                  : `Download PPT (${selectedIds.length})`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* PRIMARY VIEW 1: ENTERPRISE DATA TABLE */}
      {viewMode === "table" ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.82rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    color: "#475569",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  <th style={{ padding: "12px 14px", width: "40px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === filteredProducts.length && filteredProducts.length > 0
                      }
                      onChange={handleSelectAll}
                      style={{ cursor: "pointer" }}
                    />
                  </th>
                  <th style={{ padding: "12px 14px", width: "60px" }}>Image</th>
                  <th style={{ padding: "12px 14px" }}>Product Name & Category</th>
                  <th style={{ padding: "12px 14px" }}>SKU & Collection</th>
                  <th style={{ padding: "12px 14px" }}>Materials & Finish</th>
                  <th style={{ padding: "12px 14px" }}>Size & Assembly</th>
                  <th style={{ padding: "12px 14px" }}>CBM / 40'ft GP</th>
                  <th style={{ padding: "12px 14px" }}>FOB Price & MOQ</th>
                  <th style={{ padding: "12px 14px" }}>Status</th>
                  <th style={{ padding: "12px 14px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: "36px", textAlign: "center", color: "#64748b" }}>
                      No products found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const isSelected = selectedIds.includes(product.id);
                    return (
                      <tr
                        key={product.id}
                        onClick={() => handleSelectProduct(product.id)}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: isSelected ? "#f8fafc" : "#ffffff",
                          cursor: "pointer",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "#fcfdfd";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "#ffffff";
                        }}
                      >
                        {/* Checkbox */}
                        <td
                          style={{ padding: "12px 14px", textAlign: "center" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectProduct(product.id)}
                            style={{ cursor: "pointer" }}
                          />
                        </td>

                        {/* Image Thumbnail */}
                        <td style={{ padding: "10px 14px" }}>
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "6px",
                              overflow: "hidden",
                              border: "1px solid #e2e8f0",
                              background: "#f8fafc",
                            }}
                          >
                            <img
                              src={product.image}
                              alt={product.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = FALLBACK_IMG;
                              }}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                        </td>

                        {/* Name & Category */}
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem", marginBottom: "2px" }}>
                            {product.name}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            {product.category} • {product.subCategory}
                          </div>
                        </td>

                        {/* SKU & Collection */}
                        <td style={{ padding: "12px 14px" }}>
                          <div
                            style={{
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "#334155",
                              background: "#f1f5f9",
                              display: "inline-block",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              marginBottom: "3px",
                            }}
                          >
                            {product.sku}
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "#64748b" }}>
                            {product.collectionName}
                          </div>
                        </td>

                        {/* Materials & Finish */}
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ color: "#1e293b", fontWeight: 600 }}>{product.material}</div>
                          <div style={{ fontSize: "0.74rem", color: "#64748b" }}>
                            Finish: {product.woodFinish} {product.metalFinish !== "N/A" ? `• ${product.metalFinish}` : ""}
                          </div>
                        </td>

                        {/* Size & Assembly */}
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ color: "#1e293b", fontVariantNumeric: "tabular-nums" }}>
                            {product.sizeCm} cm
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "#64748b" }}>
                            Assembly: <strong>{product.assembledKd}</strong>
                          </div>
                        </td>

                        {/* CBM / 40'ft */}
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ color: "#0f172a", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                            {product.cbm} m³
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", fontVariantNumeric: "tabular-nums" }}>
                            40'ft: {product.gp40ft} pcs
                          </div>
                        </td>

                        {/* Price & MOQ */}
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ color: "#0f172a", fontWeight: 800, fontSize: "0.92rem", fontVariantNumeric: "tabular-nums" }}>
                            ${product.fobPriceUsd.toFixed(2)}
                            <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 500, marginLeft: "4px" }}>
                              FOB
                            </span>
                          </div>
                          <div style={{ fontSize: "0.70rem", color: "#64748b" }}>
                            MOQ: {product.moq} pcs
                          </div>
                        </td>

                        {/* Stock Status */}
                        <td style={{ padding: "12px 14px" }}>
                          <span
                            style={{
                              fontSize: "0.70rem",
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: "4px",
                              background:
                                product.stockStatus === "In Stock"
                                  ? "#f0fdf4"
                                  : product.stockStatus === "Sample Ready"
                                  ? "#eff6ff"
                                  : "#fef3c7",
                              color:
                                product.stockStatus === "In Stock"
                                  ? "#15803d"
                                  : product.stockStatus === "Sample Ready"
                                  ? "#1d4ed8"
                                  : "#b45309",
                              border: `1px solid ${
                                product.stockStatus === "In Stock"
                                  ? "#bbf7d0"
                                  : product.stockStatus === "Sample Ready"
                                  ? "#bfdbfe"
                                  : "#fde68a"
                              }`,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {product.stockStatus}
                          </span>
                        </td>

                        {/* Action */}
                        <td style={{ padding: "12px 14px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              if (!selectedIds.includes(product.id)) {
                                setSelectedIds([...selectedIds, product.id]);
                              }
                              setIsPptModalOpen(true);
                            }}
                            style={{
                              padding: "5px 10px",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#334155",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Preview Slide →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW 2: COMPACT CLEAN GRID */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredProducts.map((product) => {
            const isSelected = selectedIds.includes(product.id);
            return (
              <div
                key={product.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "10px",
                  border: isSelected ? "2px solid #0f172a" : "1px solid #e2e8f0",
                  overflow: "hidden",
                  boxShadow: isSelected ? "0 4px 14px rgba(15, 23, 42, 0.12)" : "0 1px 3px rgba(0, 0, 0, 0.04)",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10", background: "#f8fafc", overflow: "hidden" }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMG;
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />

                  <div
                    onClick={() => handleSelectProduct(product.id)}
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      zIndex: 3,
                      background: isSelected ? "#0f172a" : "rgba(255, 255, 255, 0.95)",
                      color: isSelected ? "#ffffff" : "#1e293b",
                      borderRadius: "5px",
                      padding: "3px 8px",
                      fontWeight: 700,
                      fontSize: "0.70rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
                    }}
                  >
                    <span>{isSelected ? "✓" : "+"}</span>
                    <span>{isSelected ? "Selected" : "Select for PPT"}</span>
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      zIndex: 3,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: "4px",
                      background:
                        product.stockStatus === "In Stock"
                          ? "#f0fdf4"
                          : product.stockStatus === "Sample Ready"
                          ? "#eff6ff"
                          : "#fef3c7",
                      color:
                        product.stockStatus === "In Stock"
                          ? "#15803d"
                          : product.stockStatus === "Sample Ready"
                          ? "#1d4ed8"
                          : "#b45309",
                    }}
                  >
                    {product.stockStatus}
                  </div>
                </div>

                <div style={{ padding: "14px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "3px" }}>
                    {product.category} • {product.collectionName}
                  </div>

                  <h3 style={{ margin: "0 0 6px 0", fontSize: "0.92rem", fontWeight: 700, color: "#0f172a" }}>
                    {product.name}
                  </h3>

                  <div style={{ marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "#334155",
                        background: "#f1f5f9",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontFamily: "monospace",
                      }}
                    >
                      SKU: {product.sku}
                    </span>
                  </div>

                  <div
                    style={{
                      background: "#f8fafc",
                      borderRadius: "6px",
                      padding: "8px 10px",
                      fontSize: "0.72rem",
                      color: "#334155",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "4px",
                      marginBottom: "12px",
                    }}
                  >
                    <div><span style={{ color: "#64748b" }}>Material: </span><strong>{product.material}</strong></div>
                    <div><span style={{ color: "#64748b" }}>Finish: </span><strong>{product.woodFinish}</strong></div>
                    <div><span style={{ color: "#64748b" }}>Size: </span><strong>{product.sizeCm} cm</strong></div>
                    <div><span style={{ color: "#64748b" }}>Assembly: </span><strong>{product.assembledKd}</strong></div>
                    <div><span style={{ color: "#64748b" }}>CBM: </span><strong>{product.cbm} m³</strong></div>
                    <div><span style={{ color: "#64748b" }}>40'ft: </span><strong>{product.gp40ft} pcs</strong></div>
                  </div>

                  <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                    <div>
                      <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>
                        ${product.fobPriceUsd.toFixed(2)}
                        <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 500, marginLeft: "4px" }}>FOB</span>
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "#64748b" }}>MOQ: {product.moq} Pcs</div>
                    </div>

                    <button
                      onClick={() => {
                        if (!selectedIds.includes(product.id)) {
                          setSelectedIds([...selectedIds, product.id]);
                        }
                        setIsPptModalOpen(true);
                      }}
                      style={{
                        padding: "5px 10px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#334155",
                        cursor: "pointer",
                      }}
                    >
                      Preview Slide →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL-FEATURED PRESENTATION STUDIO MODAL */}
      {isPptModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "1060px",
              width: "100%",
              maxHeight: "94vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 24px",
                background: "#0f172a",
                color: "#ffffff",
                borderRadius: "16px 16px 0 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                  PowerPoint Presentation Studio
                </h2>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.76rem", color: "#94a3b8" }}>
                  Select design theme, configure client metadata, and download 16:9 presentation deck (.pptx)
                </p>
              </div>
              <button
                onClick={() => setIsPptModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "1.4rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "18px 24px", background: "#f8fafc", flex: 1 }}>
              {/* THEME SELECTOR SECTION */}
              <div style={{ marginBottom: "18px" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "10px",
                  }}
                >
                  1. Choose Presentation Theme ({Object.keys(DECK_THEMES).length} Executive Themes)
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {Object.values(DECK_THEMES).map((th) => {
                    const isSelected = selectedThemeId === th.id;
                    return (
                      <div
                        key={th.id}
                        onClick={() => setSelectedThemeId(th.id)}
                        style={{
                          background: "#ffffff",
                          borderRadius: "8px",
                          padding: "12px",
                          border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                          boxShadow: isSelected ? "0 4px 12px rgba(37, 99, 235, 0.15)" : "none",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          position: "relative",
                        }}
                      >
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "8px" }}>
                          <span
                            style={{
                              width: "16px",
                              height: "16px",
                              borderRadius: "50%",
                              background: th.swatch.primary,
                              border: "1px solid rgba(0,0,0,0.1)",
                              display: "inline-block",
                            }}
                          />
                          <span
                            style={{
                              width: "16px",
                              height: "16px",
                              borderRadius: "50%",
                              background: th.swatch.accent,
                              border: "1px solid rgba(0,0,0,0.1)",
                              display: "inline-block",
                            }}
                          />
                          <span
                            style={{
                              width: "16px",
                              height: "16px",
                              borderRadius: "50%",
                              background: th.swatch.card,
                              border: "1px solid rgba(0,0,0,0.1)",
                              display: "inline-block",
                            }}
                          />
                        </div>

                        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#0f172a", marginBottom: "2px" }}>
                          {th.name}
                        </div>
                        <div style={{ fontSize: "0.70rem", color: "#64748b", lineHeight: 1.3 }}>
                          {th.tagline}
                        </div>

                        {isSelected && (
                          <div
                            style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                              background: "#2563eb",
                              color: "#fff",
                              borderRadius: "50%",
                              width: "16px",
                              height: "16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.60rem",
                              fontWeight: 800,
                            }}
                          >
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DECK METADATA & SETTINGS ROW */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  padding: "14px 18px",
                  marginBottom: "18px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "14px",
                  alignItems: "center",
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Client / Buyer Organization:
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. West Elm Global Sourcing"
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.80rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Presentation Title:
                  </label>
                  <input
                    type="text"
                    value={deckTitle}
                    onChange={(e) => setDeckTitle(e.target.value)}
                    placeholder="e.g. Curated Collection 2026"
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.80rem",
                    }}
                  />
                </div>

              </div>

              {/* DETAILS TO INCLUDE / CUSTOM FIELDS SECTION */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  padding: "16px 20px",
                  marginBottom: "18px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      2. Presentation Details & Field Inclusions ({activeFieldsCount} / 15 Enabled)
                    </span>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.72rem", color: "#64748b" }}>
                      Choose which specifications, pricing details, and slides to include or exclude in your presentation deck.
                    </p>
                  </div>

                  {/* Preset Pills */}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => applyPreset("all")}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.70rem",
                        fontWeight: 600,
                        background: activeFieldsCount === 15 ? "#2563eb" : "#f1f5f9",
                        color: activeFieldsCount === 15 ? "#ffffff" : "#334155",
                        border: "1px solid #cbd5e1",
                        borderRadius: "14px",
                        cursor: "pointer",
                      }}
                    >
                      ✓ Select All (15)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("hidePricing")}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.70rem",
                        fontWeight: 600,
                        background: !fieldsConfig.includePricing && !fieldsConfig.includeMoq ? "#2563eb" : "#f1f5f9",
                        color: !fieldsConfig.includePricing && !fieldsConfig.includeMoq ? "#ffffff" : "#334155",
                        border: "1px solid #cbd5e1",
                        borderRadius: "14px",
                        cursor: "pointer",
                      }}
                    >
                      Hide Pricing Only
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("specsOnly")}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.70rem",
                        fontWeight: 600,
                        background: !fieldsConfig.includePricing && !fieldsConfig.includeMoq && !fieldsConfig.includeStockStatus ? "#2563eb" : "#f1f5f9",
                        color: !fieldsConfig.includePricing && !fieldsConfig.includeMoq && !fieldsConfig.includeStockStatus ? "#ffffff" : "#334155",
                        border: "1px solid #cbd5e1",
                        borderRadius: "14px",
                        cursor: "pointer",
                      }}
                    >
                      Specs Only (Buyer Safe)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("minimal")}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.70rem",
                        fontWeight: 600,
                        background: activeFieldsCount <= 7 ? "#2563eb" : "#f1f5f9",
                        color: activeFieldsCount <= 7 ? "#ffffff" : "#334155",
                        border: "1px solid #cbd5e1",
                        borderRadius: "14px",
                        cursor: "pointer",
                      }}
                    >
                      Minimal
                    </button>
                  </div>
                </div>

                {/* 4 Categorized Columns */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {/* Category 1: Commercials & Pricing */}
                  <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>💰</span> Commercial & Pricing
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", cursor: "pointer", color: "#334155" }}>
                        <input
                          type="checkbox"
                          checked={fieldsConfig.includePricing}
                          onChange={() => toggleField("includePricing")}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span>FOB Price ($ USD)</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", cursor: "pointer", color: "#334155" }}>
                        <input
                          type="checkbox"
                          checked={fieldsConfig.includeMoq}
                          onChange={() => toggleField("includeMoq")}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span>Minimum Order Qty (MOQ)</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", cursor: "pointer", color: "#334155" }}>
                        <input
                          type="checkbox"
                          checked={fieldsConfig.includeStockStatus}
                          onChange={() => toggleField("includeStockStatus")}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span>Stock / Production Status</span>
                      </label>
                    </div>
                  </div>

                  {/* Category 2: Product Identification */}
                  <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🏷️</span> Classification & SKU
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", cursor: "pointer", color: "#334155" }}>
                        <input
                          type="checkbox"
                          checked={fieldsConfig.includeSku}
                          onChange={() => toggleField("includeSku")}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span>SKU Code Badge</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", cursor: "pointer", color: "#334155" }}>
                        <input
                          type="checkbox"
                          checked={fieldsConfig.includeCategory}
                          onChange={() => toggleField("includeCategory")}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span>Category & Subcategory</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", cursor: "pointer", color: "#334155" }}>
                        <input
                          type="checkbox"
                          checked={fieldsConfig.includeCollection}
                          onChange={() => toggleField("includeCollection")}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span>Collection Name</span>
                      </label>
                    </div>
                  </div>

                  {/* Category 3: Materials & Specs */}
                  <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🪵</span> Materials & Finishes
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", cursor: "pointer", color: "#334155" }}>
                        <input
                          type="checkbox"
                          checked={fieldsConfig.includeMaterial}
                          onChange={() => toggleField("includeMaterial")}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span>Material Composition</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", cursor: "pointer", color: "#334155" }}>
                        <input
                          type="checkbox"
                          checked={fieldsConfig.includeWoodFinish}
                          onChange={() => toggleField("includeWoodFinish")}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span>Wood Finish</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", cursor: "pointer", color: "#334155" }}>
                        <input
                          type="checkbox"
                          checked={fieldsConfig.includeMetalFinish}
                          onChange={() => toggleField("includeMetalFinish")}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span>Metal Finish</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", cursor: "pointer", color: "#334155" }}>
                        <input
                          type="checkbox"
                          checked={fieldsConfig.includeDimensions}
                          onChange={() => toggleField("includeDimensions")}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span>Dimensions (L x W x H cm)</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", cursor: "pointer", color: "#334155" }}>
                        <input
                          type="checkbox"
                          checked={fieldsConfig.includeAssembly}
                          onChange={() => toggleField("includeAssembly")}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span>Assembly Type (KD / Assembled)</span>
                      </label>
                    </div>
                  </div>

                  {/* Category 4: Logistics & Slides Structure */}
                  <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>🚢</span> Logistics & Slides
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", cursor: "pointer", color: "#334155" }}>
                        <input
                          type="checkbox"
                          checked={fieldsConfig.includeCbm}
                          onChange={() => toggleField("includeCbm")}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span>Unit CBM (m³)</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", cursor: "pointer", color: "#334155" }}>
                        <input
                          type="checkbox"
                          checked={fieldsConfig.includeContainerQty}
                          onChange={() => toggleField("includeContainerQty")}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span>40' HQ Container Capacity</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", cursor: "pointer", color: "#334155" }}>
                        <input
                          type="checkbox"
                          checked={fieldsConfig.includeCoverSlide}
                          onChange={() => toggleField("includeCoverSlide")}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span>Deck Cover Slide</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", cursor: "pointer", color: "#334155" }}>
                        <input
                          type="checkbox"
                          checked={fieldsConfig.includeClosingSlide}
                          onChange={() => toggleField("includeClosingSlide")}
                          style={{ accentColor: "#2563eb" }}
                        />
                        <span>Closing & Contact Slide</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE SLIDE PREVIEW SECTION */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    3. Live 16:9 Slide Canvas ({currentTheme.name} Theme)
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    Showing slide {activeSlide + 1} of {selectedProducts.length + 2}
                  </span>
                </div>

                {/* Slide Navigator Tabs */}
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    overflowX: "auto",
                    paddingBottom: "6px",
                    marginBottom: "10px",
                  }}
                >
                  <button
                    onClick={() => setActiveSlide(0)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "6px",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      border: activeSlide === 0 ? "2px solid #2563eb" : "1px solid #cbd5e1",
                      background: activeSlide === 0 ? "#2563eb" : "#ffffff",
                      color: activeSlide === 0 ? "#ffffff" : "#475569",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Cover Slide
                  </button>

                  {selectedProducts.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => setActiveSlide(idx + 1)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "6px",
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        border: activeSlide === idx + 1 ? "2px solid #2563eb" : "1px solid #cbd5e1",
                        background: activeSlide === idx + 1 ? "#2563eb" : "#ffffff",
                        color: activeSlide === idx + 1 ? "#ffffff" : "#475569",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Slide {idx + 2}: {p.sku}
                    </button>
                  ))}

                  <button
                    onClick={() => setActiveSlide(selectedProducts.length + 1)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "6px",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      border: activeSlide === selectedProducts.length + 1 ? "2px solid #2563eb" : "1px solid #cbd5e1",
                      background: activeSlide === selectedProducts.length + 1 ? "#2563eb" : "#ffffff",
                      color: activeSlide === selectedProducts.length + 1 ? "#ffffff" : "#475569",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Closing Slide
                  </button>
                </div>

                {/* THE LIVE 16:9 CANVAS */}
                <div
                  style={{
                    background: "#090d16",
                    padding: "20px",
                    borderRadius: "10px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "760px",
                      aspectRatio: "16 / 9",
                      background:
                        activeSlide === 0
                          ? `#${currentTheme.cover.bg}`
                          : activeSlide === selectedProducts.length + 1
                          ? `#${currentTheme.closing.bg}`
                          : `#${currentTheme.product.bg}`,
                      color:
                        activeSlide === 0
                          ? `#${currentTheme.cover.titleColor}`
                          : activeSlide === selectedProducts.length + 1
                          ? `#${currentTheme.closing.titleColor}`
                          : `#${currentTheme.product.titleColor}`,
                      borderRadius: "8px",
                      boxShadow: "0 15px 30px rgba(0,0,0,0.3)",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {activeSlide === 0 ? (
                      /* COVER SLIDE LIVE PREVIEW */
                      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span
                            style={{
                              fontSize: "0.76rem",
                              fontWeight: 800,
                              letterSpacing: "0.1em",
                              color: `#${currentTheme.cover.accentColor}`,
                            }}
                          >
                            LII EXPORTS • B2B EXPORT CATALOGUE
                          </span>
                          <span
                            style={{
                              background: `#${currentTheme.cover.badgeBg}`,
                              color: `#${currentTheme.cover.badgeText}`,
                              padding: "2px 8px",
                              borderRadius: "10px",
                              fontSize: "0.68rem",
                              fontWeight: 800,
                            }}
                          >
                            {currentTheme.badge}
                          </span>
                        </div>

                        <div>
                          <h1
                            style={{
                              fontSize: "1.9rem",
                              fontWeight: 800,
                              margin: "0 0 8px 0",
                              lineHeight: 1.2,
                              color: `#${currentTheme.cover.titleColor}`,
                            }}
                          >
                            {deckTitle}
                          </h1>
                          <p style={{ fontSize: "0.90rem", color: `#${currentTheme.cover.subtitleColor}`, margin: 0 }}>
                            Prepared for {customerName} • {selectedProducts.length} Premium Form-Recorded Items
                          </p>
                        </div>

                        <div
                          style={{
                            background: `#${currentTheme.cover.cardBg}`,
                            border: `1px solid #${currentTheme.cover.cardBorder}`,
                            borderRadius: "6px",
                            padding: "8px 12px",
                            fontSize: "0.74rem",
                            color: `#${currentTheme.cover.cardText}`,
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          {fieldsConfig.includeCbm && (
                            <span>Total Volume: {selectedProducts.reduce((acc, p) => acc + (p.cbm || 0), 0).toFixed(2)} CBM</span>
                          )}
                          <span>FOB Mundra / Pipavav, India</span>
                          <span>{fieldsConfig.includePricing ? "FOB Pricing & MOQ Included" : "Specs & Dimensions Deck"}</span>
                        </div>
                      </div>
                    ) : activeSlide === selectedProducts.length + 1 ? (
                      /* CLOSING SLIDE LIVE PREVIEW */
                      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "center" }}>
                        <div style={{ fontSize: "0.76rem", fontWeight: 700, color: `#${currentTheme.closing.subtitleColor}` }}>
                          LII EXPORTS • GLOBAL MANUFACTURING PARTNER
                        </div>
                        <div>
                          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: `#${currentTheme.closing.titleColor}`, margin: "0 0 6px 0" }}>
                            Thank You for Exploring LII Exports
                          </h2>
                          <p style={{ fontSize: "0.82rem", color: `#${currentTheme.closing.subtitleColor}`, margin: 0 }}>
                            For custom sampling, container bookings, and factory audits, our export merchants are at your service.
                          </p>
                        </div>
                        <div
                          style={{
                            background: `#${currentTheme.closing.cardBg}`,
                            border: `1px solid #${currentTheme.closing.cardBorder}`,
                            borderRadius: "6px",
                            padding: "10px",
                            fontSize: "0.74rem",
                            color: `#${currentTheme.closing.cardText}`,
                            display: "flex",
                            justifyContent: "space-around",
                          }}
                        >
                          <div>📧 exports@liinexus.com</div>
                          <div>🌐 www.liiexports.com</div>
                          <div>📍 Jodhpur, Rajasthan, India</div>
                        </div>
                      </div>
                    ) : (
                      /* PRODUCT SLIDE LIVE PREVIEW */
                      (() => {
                        const product = selectedProducts[activeSlide - 1];
                        return (
                          <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            {/* Slide Header */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                borderBottom: `2px solid #${currentTheme.product.categoryColor}`,
                                paddingBottom: "6px",
                              }}
                            >
                              <div>
                                {fieldsConfig.includeCategory && (
                                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: `#${currentTheme.product.categoryColor}`, textTransform: "uppercase" }}>
                                    {product.category} • {product.subCategory}
                                  </span>
                                )}
                                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: "2px 0 0 0", color: `#${currentTheme.product.titleColor}` }}>
                                  {product.name}
                                </h3>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                {fieldsConfig.includePricing && (
                                  <span style={{ fontSize: "1.05rem", fontWeight: 800, color: `#${currentTheme.product.priceColor}`, display: "block" }}>
                                    ${product.fobPriceUsd.toFixed(2)} USD
                                  </span>
                                )}
                                {fieldsConfig.includeSku && (
                                  <span style={{ fontSize: "0.68rem", color: `#${currentTheme.product.skuColor}` }}>
                                    SKU: {product.sku}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Content Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "16px", margin: "10px 0", flex: 1 }}>
                              <div
                                style={{
                                  borderRadius: "6px",
                                  overflow: "hidden",
                                  border: `1px solid #${currentTheme.product.imgBorderColor}`,
                                  background: `#${currentTheme.product.tableBg}`,
                                  position: "relative",
                                }}
                              >
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = FALLBACK_IMG;
                                  }}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                                {fieldsConfig.includeStockStatus && (
                                  <span
                                    style={{
                                      position: "absolute",
                                      top: 6,
                                      left: 6,
                                      background: "rgba(0,0,0,0.75)",
                                      color: "#34d399",
                                      padding: "2px 6px",
                                      borderRadius: 4,
                                      fontSize: "0.65rem",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {product.stockStatus || "Active"}
                                  </span>
                                )}
                              </div>

                              <div
                                style={{
                                  background: `#${currentTheme.product.tableBg}`,
                                  borderRadius: "6px",
                                  padding: "10px",
                                  border: `1px solid #${currentTheme.product.tableBorder}`,
                                  fontSize: "0.72rem",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                }}
                              >
                                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                  <div style={{ fontWeight: 700, color: `#${currentTheme.product.titleColor}`, marginBottom: "2px" }}>
                                    Technical Specifications
                                  </div>
                                  {fieldsConfig.includeCollection && (
                                    <div>
                                      <span style={{ color: `#${currentTheme.product.tableLabelColor}` }}>Collection: </span>
                                      <strong style={{ color: `#${currentTheme.product.tableValColor}` }}>{product.collectionName}</strong>
                                    </div>
                                  )}
                                  {fieldsConfig.includeMaterial && (
                                    <div>
                                      <span style={{ color: `#${currentTheme.product.tableLabelColor}` }}>Material: </span>
                                      <span style={{ color: `#${currentTheme.product.tableValColor}` }}>{product.material}</span>
                                    </div>
                                  )}
                                  {fieldsConfig.includeWoodFinish && (
                                    <div>
                                      <span style={{ color: `#${currentTheme.product.tableLabelColor}` }}>Wood Finish: </span>
                                      <span style={{ color: `#${currentTheme.product.tableValColor}` }}>{product.woodFinish}</span>
                                    </div>
                                  )}
                                  {fieldsConfig.includeMetalFinish && (
                                    <div>
                                      <span style={{ color: `#${currentTheme.product.tableLabelColor}` }}>Metal Finish: </span>
                                      <span style={{ color: `#${currentTheme.product.tableValColor}` }}>{product.metalFinish}</span>
                                    </div>
                                  )}
                                  {fieldsConfig.includeDimensions && (
                                    <div>
                                      <span style={{ color: `#${currentTheme.product.tableLabelColor}` }}>Size: </span>
                                      <span style={{ color: `#${currentTheme.product.tableValColor}` }}>{product.sizeCm} cm</span>
                                    </div>
                                  )}
                                  {fieldsConfig.includeAssembly && (
                                    <div>
                                      <span style={{ color: `#${currentTheme.product.tableLabelColor}` }}>Assembly: </span>
                                      <span style={{ color: `#${currentTheme.product.tableValColor}` }}>{product.assembledKd}</span>
                                    </div>
                                  )}
                                </div>

                                {(fieldsConfig.includeMoq || fieldsConfig.includeCbm || fieldsConfig.includeContainerQty) && (
                                  <div
                                    style={{
                                      background: `#${currentTheme.product.priceCardBg}`,
                                      border: `1px solid #${currentTheme.product.priceCardBorder}`,
                                      borderRadius: "5px",
                                      padding: "5px 7px",
                                      display: "grid",
                                      gridTemplateColumns: `repeat(${[fieldsConfig.includeMoq, fieldsConfig.includeCbm, fieldsConfig.includeContainerQty].filter(Boolean).length || 1}, 1fr)`,
                                      textAlign: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    {fieldsConfig.includeMoq && (
                                      <div>
                                        <span style={{ fontSize: "0.60rem", color: `#${currentTheme.product.skuColor}`, display: "block" }}>MOQ</span>
                                        <strong style={{ color: `#${currentTheme.product.tableHighlightColor}` }}>{product.moq} pcs</strong>
                                      </div>
                                    )}
                                    {fieldsConfig.includeCbm && (
                                      <div>
                                        <span style={{ fontSize: "0.60rem", color: `#${currentTheme.product.skuColor}`, display: "block" }}>Unit CBM</span>
                                        <strong style={{ color: `#${currentTheme.product.tableHighlightColor}` }}>{product.cbm} m³</strong>
                                      </div>
                                    )}
                                    {fieldsConfig.includeContainerQty && (
                                      <div>
                                        <span style={{ fontSize: "0.60rem", color: `#${currentTheme.product.skuColor}`, display: "block" }}>40'ft Container</span>
                                        <strong style={{ color: `#${currentTheme.product.tableHighlightColor}` }}>{product.gp40ft} pcs</strong>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Slide Footer */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "0.68rem",
                                color: `#${currentTheme.product.footerTextColor}`,
                                borderTop: `1px solid #${currentTheme.product.footerLineColor}`,
                                paddingTop: "5px",
                              }}
                            >
                              <span>LII Exports Presentation Deck</span>
                              <span>Slide {activeSlide + 1} of {selectedProducts.length + 2}</span>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div
              style={{
                padding: "14px 24px",
                background: "#ffffff",
                borderTop: "1px solid #e2e8f0",
                borderRadius: "0 0 16px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ fontSize: "0.80rem", color: "#64748b" }}>
                Active Theme: <strong>{currentTheme.name}</strong> • Format: 16:9 Widescreen (.pptx)
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <button
                  onClick={() => setIsPptModalOpen(false)}
                  style={{
                    background: "#f1f5f9",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "7px 14px",
                    fontWeight: 600,
                    fontSize: "0.80rem",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>

                <button
                  onClick={handleExportExcel}
                  style={{
                    background: "rgba(16, 185, 129, 0.12)",
                    color: "#059669",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "6px",
                    padding: "7px 14px",
                    fontWeight: 600,
                    fontSize: "0.80rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  title="Download complete specs in Excel"
                >
                  <span>📊</span>
                  <span>Export Excel</span>
                </button>

                <button
                  onClick={handleGenerateShareLink}
                  disabled={isGeneratingLink}
                  style={{
                    background: isGeneratingLink ? "#f1f5f9" : "rgba(168, 85, 247, 0.12)",
                    color: "#7e22ce",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    borderRadius: "6px",
                    padding: "7px 14px",
                    fontWeight: 600,
                    fontSize: "0.80rem",
                    cursor: isGeneratingLink ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  title="Generate shareable link for buyer"
                >
                  <span>{isGeneratingLink ? "⏳" : "🔗"}</span>
                  <span>{isGeneratingLink ? "Creating Link..." : "Share Link with Buyer"}</span>
                </button>

                <button
                  onClick={() => handleDownloadPptx()}
                  disabled={isExportingPpt}
                  style={{
                    background: isExportingPpt ? "#64748b" : "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "7px 18px",
                    fontWeight: 700,
                    fontSize: "0.80rem",
                    cursor: isExportingPpt ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                  }}
                >
                  <span>{isExportingPpt ? "⏳" : "📥"}</span>
                  <span>
                    {isExportingPpt
                      ? exportProgressMsg || "Generating PowerPoint..."
                      : `Download PowerPoint (${selectedProducts.length} Items)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHARE PRESENTATION LINK MODAL */}
      {shareModalOpen && generatedDeck && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "560px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "18px 24px",
                background: "linear-gradient(135deg, #1e293b, #0f172a)",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(168, 85, 247, 0.2)",
                    color: "#c084fc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                  }}
                >
                  🔗
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                    Share Presentation with Buyer
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#94a3b8" }}>
                    Public presentation link with real-time open alerts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShareModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "22px 24px" }}>
              {/* Real-time Tracking Alert Banner */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  marginBottom: "18px",
                }}
              >
                <div style={{ fontSize: "20px", lineHeight: 1 }}>🔔</div>
                <div>
                  <strong style={{ fontSize: "0.82rem", color: "#166534", display: "block", marginBottom: "2px" }}>
                    Real-Time Buyer Open Notification Active
                  </strong>
                  <p style={{ margin: 0, fontSize: "0.76rem", color: "#15803d", lineHeight: 1.45 }}>
                    As soon as the buyer opens this presentation link on their phone or browser, you will immediately receive an alert in your top bell icon.
                  </p>
                </div>
              </div>

              {/* Deck Info Box */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "18px",
                }}
              >
                <div style={{ fontSize: "0.74rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600, marginBottom: "3px" }}>
                  Presentation Deck
                </div>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                  {generatedDeck.title}
                </div>
                <div style={{ display: "flex", gap: "12px", fontSize: "0.76rem", color: "#475569", flexWrap: "wrap" }}>
                  <div>
                    Recipient: <strong style={{ color: "#1e293b" }}>{generatedDeck.customerName || "International Buyer"}</strong>
                  </div>
                  <div>•</div>
                  <div>
                    Items: <strong style={{ color: "#1e293b" }}>{generatedDeck.products?.length || selectedProducts.length} items</strong>
                  </div>
                  <div>•</div>
                  <div>
                    Theme: <strong style={{ color: "#1e293b", textTransform: "capitalize" }}>{generatedDeck.themeId}</strong>
                  </div>
                </div>
              </div>

              {/* URL Display & Copy */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Shareable Presentation URL
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/view-deck/${generatedDeck.token}`}
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#f8fafc",
                      fontSize: "0.80rem",
                      color: "#1e293b",
                      fontFamily: "monospace",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleCopyLink}
                    style={{
                      padding: "9px 18px",
                      background: copySuccess ? "#10b981" : "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                      fontSize: "0.80rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s ease",
                      minWidth: "105px",
                      justifyContent: "center",
                    }}
                  >
                    <span>{copySuccess ? "✓" : "📋"}</span>
                    <span>{copySuccess ? "Copied!" : "Copy Link"}</span>
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Hello ${generatedDeck.customerName ? generatedDeck.customerName : "Partner"},\n\nPlease review our curated product presentation deck:\n${window.location.origin}/view-deck/${generatedDeck.token}\n\nLakshya International`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "9px 14px",
                    background: "#25d366",
                    color: "#fff",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.80rem",
                  }}
                >
                  <span>💬</span> Share on WhatsApp
                </a>

                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    `Product Presentation: ${generatedDeck.title}`
                  )}&body=${encodeURIComponent(
                    `Dear ${generatedDeck.customerName || "Buyer"},\n\nPlease review our curated export presentation deck at the link below:\n\n${window.location.origin}/view-deck/${generatedDeck.token}\n\nKind regards,\nLakshya International`
                  )}`}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "9px 14px",
                    background: "#f1f5f9",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.80rem",
                  }}
                >
                  <span>✉️</span> Share via Email
                </a>

                <a
                  href={`/view-deck/${generatedDeck.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    padding: "9px 14px",
                    background: "#ffffff",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.80rem",
                  }}
                >
                  <span>↗</span> Buyer Preview
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHARED DECKS HISTORY MODAL */}
      {historyModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "800px",
              maxHeight: "85vh",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "18px 24px",
                background: "linear-gradient(135deg, #1e293b, #0f172a)",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                  Shared Presentation Links & Buyer Tracking
                </h3>
                <p style={{ margin: 0, fontSize: "0.76rem", color: "#94a3b8" }}>
                  Monitor links shared with buyers and real-time open status
                </p>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Content Table */}
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px" }}>
              {loadingHistory ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                  Loading shared links activity...
                </div>
              ) : sharedDecksHistory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔗</div>
                  <h4 style={{ margin: "0 0 6px 0", color: "#334155" }}>No Shared Links Generated Yet</h4>
                  <p style={{ margin: 0, fontSize: "0.80rem" }}>
                    Select products from the table above and click "Share Link with Buyer" to generate your first link.
                  </p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.80rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "10px 12px", color: "#475569", fontWeight: 700 }}>Title / Buyer</th>
                      <th style={{ padding: "10px 12px", color: "#475569", fontWeight: 700 }}>Theme</th>
                      <th style={{ padding: "10px 12px", color: "#475569", fontWeight: 700 }}>Buyer Views</th>
                      <th style={{ padding: "10px 12px", color: "#475569", fontWeight: 700 }}>Last Viewed</th>
                      <th style={{ padding: "10px 12px", color: "#475569", fontWeight: 700, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sharedDecksHistory.map((deck) => (
                      <tr key={deck.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{deck.title}</div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                            For: <strong>{deck.customerName || "International Buyer"}</strong> • Created {new Date(deck.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              background: "#f1f5f9",
                              color: "#334155",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              textTransform: "capitalize",
                            }}
                          >
                            {deck.themeId}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          {deck.viewCount > 0 ? (
                            <span
                              style={{
                                background: "rgba(16, 185, 129, 0.12)",
                                color: "#059669",
                                padding: "3px 10px",
                                borderRadius: "12px",
                                fontSize: "0.74rem",
                                fontWeight: 700,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <span>👀</span>
                              <span>{deck.viewCount} view{deck.viewCount > 1 ? "s" : ""}</span>
                            </span>
                          ) : (
                            <span
                              style={{
                                background: "#f1f5f9",
                                color: "#64748b",
                                padding: "3px 10px",
                                borderRadius: "12px",
                                fontSize: "0.74rem",
                                fontWeight: 600,
                              }}
                            >
                              Not opened yet
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px", color: "#64748b", fontSize: "0.74rem" }}>
                          {deck.lastViewedAt
                            ? new Date(deck.lastViewedAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })
                            : "—"}
                        </td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}/view-deck/${deck.token}`;
                                navigator.clipboard.writeText(url);
                                alert("Link copied to clipboard:\n" + url);
                              }}
                              style={{
                                padding: "5px 10px",
                                background: "#f8fafc",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                color: "#334155",
                                cursor: "pointer",
                              }}
                              title="Copy presentation link"
                            >
                              📋 Copy
                            </button>
                            <a
                              href={`/view-deck/${deck.token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: "5px 10px",
                                background: "#2563eb",
                                color: "#fff",
                                borderRadius: "6px",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                textDecoration: "none",
                              }}
                            >
                              Open ↗
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setHistoryModalOpen(false)}
                style={{
                  padding: "7px 18px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontSize: "0.80rem",
                  fontWeight: 600,
                  color: "#334155",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED PRESENTATION FIELDS CUSTOMIZATION MODAL */}
      {isFieldsModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "860px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "18px 24px",
                background: "#0f172a",
                color: "#ffffff",
                borderRadius: "16px 16px 0 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>⚙</span>
                  <span>Presentation Details & Content Options</span>
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "#94a3b8" }}>
                  Select exactly what details to include or exclude before generating your PPT, Excel file, or Buyer Link.
                </p>
              </div>
              <button
                onClick={() => setIsFieldsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "1.4rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Presets Bar */}
            <div
              style={{
                padding: "12px 24px",
                background: "#f1f5f9",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "0.76rem", color: "#475569", fontWeight: 700 }}>
                Quick Presets:
              </span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => applyPreset("all")}
                  style={{
                    padding: "5px 12px",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    background: activeFieldsCount === 15 ? "#2563eb" : "#ffffff",
                    color: activeFieldsCount === 15 ? "#ffffff" : "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "16px",
                    cursor: "pointer",
                  }}
                >
                  ✓ Select All Fields (15)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("hidePricing")}
                  style={{
                    padding: "5px 12px",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    background: !fieldsConfig.includePricing && !fieldsConfig.includeMoq ? "#2563eb" : "#ffffff",
                    color: !fieldsConfig.includePricing && !fieldsConfig.includeMoq ? "#ffffff" : "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "16px",
                    cursor: "pointer",
                  }}
                >
                  Hide Pricing Only
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("specsOnly")}
                  style={{
                    padding: "5px 12px",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    background: !fieldsConfig.includePricing && !fieldsConfig.includeMoq && !fieldsConfig.includeStockStatus ? "#2563eb" : "#ffffff",
                    color: !fieldsConfig.includePricing && !fieldsConfig.includeMoq && !fieldsConfig.includeStockStatus ? "#ffffff" : "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "16px",
                    cursor: "pointer",
                  }}
                >
                  Specs Only (Buyer Safe)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("minimal")}
                  style={{
                    padding: "5px 12px",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    background: activeFieldsCount <= 7 ? "#2563eb" : "#ffffff",
                    color: activeFieldsCount <= 7 ? "#ffffff" : "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "16px",
                    cursor: "pointer",
                  }}
                >
                  Minimal (Images + Basic)
                </button>
              </div>
            </div>

            {/* Modal Body: 4 Categories */}
            <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
              {/* Card 1: Commercial & Pricing */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#0f172a", fontSize: "0.85rem", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span>💰</span> Commercial & Pricing
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={fieldsConfig.includePricing}
                      onChange={() => toggleField("includePricing")}
                      style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#2563eb" }}
                    />
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>FOB Price ($ USD)</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Shows unit FOB price in US Dollars per product</div>
                    </div>
                  </label>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={fieldsConfig.includeMoq}
                      onChange={() => toggleField("includeMoq")}
                      style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#2563eb" }}
                    />
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>Minimum Order Qty (MOQ)</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Displays required minimum order quantity in pieces</div>
                    </div>
                  </label>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={fieldsConfig.includeStockStatus}
                      onChange={() => toggleField("includeStockStatus")}
                      style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#2563eb" }}
                    />
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>Stock / Production Status</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>In Stock, Sample Ready, or Made-to-Order badge</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Card 2: Identification & Classification */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#0f172a", fontSize: "0.85rem", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span>🏷️</span> Classification & SKU
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={fieldsConfig.includeSku}
                      onChange={() => toggleField("includeSku")}
                      style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#2563eb" }}
                    />
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>SKU Code</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Unique product code identifier on slide and image</div>
                    </div>
                  </label>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={fieldsConfig.includeCategory}
                      onChange={() => toggleField("includeCategory")}
                      style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#2563eb" }}
                    />
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>Category & Subcategory</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Header classification banner (e.g. FURNITURE • DINING TABLE)</div>
                    </div>
                  </label>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={fieldsConfig.includeCollection}
                      onChange={() => toggleField("includeCollection")}
                      style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#2563eb" }}
                    />
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>Collection Name</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Design collection or factory line name</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Card 3: Materials & Technical Specs */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#0f172a", fontSize: "0.85rem", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span>🪵</span> Materials & Finishes
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={fieldsConfig.includeMaterial}
                      onChange={() => toggleField("includeMaterial")}
                      style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#2563eb" }}
                    />
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>Material Composition</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Wood type, iron/brass gauge, natural cane, etc.</div>
                    </div>
                  </label>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={fieldsConfig.includeWoodFinish}
                      onChange={() => toggleField("includeWoodFinish")}
                      style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#2563eb" }}
                    />
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>Wood Finish</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Natural matte, walnut stain, rustic distressed, etc.</div>
                    </div>
                  </label>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={fieldsConfig.includeMetalFinish}
                      onChange={() => toggleField("includeMetalFinish")}
                      style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#2563eb" }}
                    />
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>Metal Finish</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Powder coated brass, black matte, chrome, etc.</div>
                    </div>
                  </label>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={fieldsConfig.includeDimensions}
                      onChange={() => toggleField("includeDimensions")}
                      style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#2563eb" }}
                    />
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>Dimensions (CM)</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Length x Width x Height in centimeters</div>
                    </div>
                  </label>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={fieldsConfig.includeAssembly}
                      onChange={() => toggleField("includeAssembly")}
                      style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#2563eb" }}
                    />
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>Assembly Type</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>KD (Knock Down Flat Pack) or Fully Assembled</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Card 4: Logistics & Slide Deck Structure */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#0f172a", fontSize: "0.85rem", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                  <span>🚢</span> Logistics & Deck Slides
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={fieldsConfig.includeCbm}
                      onChange={() => toggleField("includeCbm")}
                      style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#2563eb" }}
                    />
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>Unit CBM (m³)</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Packaged cubic meter volume per item</div>
                    </div>
                  </label>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={fieldsConfig.includeContainerQty}
                      onChange={() => toggleField("includeContainerQty")}
                      style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#2563eb" }}
                    />
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>40' HQ Container Capacity</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Estimated pieces fitting in a 40-foot container</div>
                    </div>
                  </label>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={fieldsConfig.includeCoverSlide}
                      onChange={() => toggleField("includeCoverSlide")}
                      style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#2563eb" }}
                    />
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>Cover Slide</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>First title slide with client organization & summary</div>
                    </div>
                  </label>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={fieldsConfig.includeClosingSlide}
                      onChange={() => toggleField("includeClosingSlide")}
                      style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "#2563eb" }}
                    />
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>Closing Slide</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Final contact slide with factory address & inquiry email</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div
              style={{
                padding: "16px 24px",
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
                borderRadius: "0 0 16px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ fontSize: "0.80rem", color: "#475569" }}>
                Active Selection: <strong style={{ color: "#2563eb" }}>{activeFieldsCount} of 15 fields enabled</strong>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => setIsFieldsModalOpen(false)}
                  style={{
                    padding: "8px 14px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    color: "#334155",
                    fontSize: "0.80rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Done
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFieldsModalOpen(false);
                    handleExportExcel();
                  }}
                  style={{
                    padding: "8px 14px",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                    borderRadius: "6px",
                    color: "#059669",
                    fontSize: "0.80rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>📊</span>
                  <span>Export Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFieldsModalOpen(false);
                    handleGenerateShareLink();
                  }}
                  disabled={isGeneratingLink}
                  style={{
                    padding: "8px 14px",
                    background: "rgba(168, 85, 247, 0.15)",
                    border: "1px solid rgba(168, 85, 247, 0.35)",
                    borderRadius: "6px",
                    color: "#7e22ce",
                    fontSize: "0.80rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>🔗</span>
                  <span>Share Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFieldsModalOpen(false);
                    handleDownloadPptx();
                  }}
                  disabled={isExportingPpt}
                  style={{
                    padding: "8px 18px",
                    background: "#2563eb",
                    border: "none",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "0.80rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
                  }}
                >
                  <span>📥</span>
                  <span>Download PPT ({selectedIds.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
