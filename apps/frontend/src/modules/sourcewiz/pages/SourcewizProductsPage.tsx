import React, { useState, useEffect } from "react";
import "../Sourcewiz.css";
import {
  generateProductPptx,
  DECK_THEMES,
  ThemeId,
  DeckTheme,
  CatalogProductItem,
} from "../utils/pptxExport";

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
  const [activeSlide, setActiveSlide] = useState(0);

  // Deck Options & Theme
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>("obsidian");
  const [customerName, setCustomerName] = useState("West Elm Global Sourcing");
  const [deckTitle, setDeckTitle] = useState("Curated Product Presentation Deck");
  const [includePricing, setIncludePricing] = useState(true);

  // Export progress
  const [isExportingPpt, setIsExportingPpt] = useState(false);
  const [exportProgressMsg, setExportProgressMsg] = useState("");

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
        includePricing,
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => setIsPptModalOpen(true)}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "6px",
                padding: "7px 14px",
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
                gap: "6px",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
              }}
            >
              <span>{isExportingPpt ? "⏳" : "📊"}</span>
              <span>
                {isExportingPpt
                  ? exportProgressMsg || "Generating PPT..."
                  : `Create PPT (${selectedIds.length})`}
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

                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "#1e293b",
                      cursor: "pointer",
                      marginTop: "14px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={includePricing}
                      onChange={(e) => setIncludePricing(e.target.checked)}
                      style={{ cursor: "pointer" }}
                    />
                    Include Wholesale FOB Prices & MOQ in Deck
                  </label>
                </div>
              </div>

              {/* LIVE SLIDE PREVIEW SECTION */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    2. Live 16:9 Slide Canvas ({currentTheme.name} Theme)
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
                          <span>Total Volume: {selectedProducts.reduce((acc, p) => acc + (p.cbm || 0), 0).toFixed(2)} CBM</span>
                          <span>FOB Mundra / Pipavav, India</span>
                          <span>{includePricing ? "FOB Pricing & MOQ Included" : "Specs & Dimensions Deck"}</span>
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
                                <span style={{ fontSize: "0.68rem", fontWeight: 800, color: `#${currentTheme.product.categoryColor}`, textTransform: "uppercase" }}>
                                  {product.category} • {product.subCategory}
                                </span>
                                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: "2px 0 0 0", color: `#${currentTheme.product.titleColor}` }}>
                                  {product.name}
                                </h3>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                {includePricing && (
                                  <span style={{ fontSize: "1.05rem", fontWeight: 800, color: `#${currentTheme.product.priceColor}`, display: "block" }}>
                                    ${product.fobPriceUsd.toFixed(2)} USD
                                  </span>
                                )}
                                <span style={{ fontSize: "0.68rem", color: `#${currentTheme.product.skuColor}` }}>
                                  SKU: {product.sku}
                                </span>
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
                                  <div>
                                    <span style={{ color: `#${currentTheme.product.tableLabelColor}` }}>Collection: </span>
                                    <strong style={{ color: `#${currentTheme.product.tableValColor}` }}>{product.collectionName}</strong>
                                  </div>
                                  <div>
                                    <span style={{ color: `#${currentTheme.product.tableLabelColor}` }}>Material: </span>
                                    <span style={{ color: `#${currentTheme.product.tableValColor}` }}>{product.material}</span>
                                  </div>
                                  <div>
                                    <span style={{ color: `#${currentTheme.product.tableLabelColor}` }}>Finish: </span>
                                    <span style={{ color: `#${currentTheme.product.tableValColor}` }}>{product.woodFinish}</span>
                                  </div>
                                  <div>
                                    <span style={{ color: `#${currentTheme.product.tableLabelColor}` }}>Size: </span>
                                    <span style={{ color: `#${currentTheme.product.tableValColor}` }}>{product.sizeCm} cm</span>
                                  </div>
                                  <div>
                                    <span style={{ color: `#${currentTheme.product.tableLabelColor}` }}>Assembly: </span>
                                    <span style={{ color: `#${currentTheme.product.tableValColor}` }}>{product.assembledKd}</span>
                                  </div>
                                </div>

                                <div
                                  style={{
                                    background: `#${currentTheme.product.priceCardBg}`,
                                    border: `1px solid #${currentTheme.product.priceCardBorder}`,
                                    borderRadius: "5px",
                                    padding: "5px 7px",
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    textAlign: "center",
                                  }}
                                >
                                  <div>
                                    <span style={{ fontSize: "0.62rem", color: `#${currentTheme.product.skuColor}`, display: "block" }}>Unit CBM</span>
                                    <strong style={{ color: `#${currentTheme.product.tableHighlightColor}` }}>{product.cbm} m³</strong>
                                  </div>
                                  <div>
                                    <span style={{ fontSize: "0.62rem", color: `#${currentTheme.product.skuColor}`, display: "block" }}>40'ft Container</span>
                                    <strong style={{ color: `#${currentTheme.product.tableHighlightColor}` }}>{product.gp40ft} pcs</strong>
                                  </div>
                                </div>
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

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setIsPptModalOpen(false)}
                  style={{
                    background: "#f1f5f9",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "7px 16px",
                    fontWeight: 600,
                    fontSize: "0.80rem",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadPptx()}
                  disabled={isExportingPpt}
                  style={{
                    background: isExportingPpt ? "#64748b" : "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "7px 20px",
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
    </div>
  );
}
