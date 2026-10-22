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
    woodFinish: "Natural",
    metalFinish: "Powder Coated Brass",
    sizeCm: "150X150X76",
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
    sizeCm: "60X62X95",
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
    sizeCm: "85X80X75",
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
    sizeCm: "180X45X85",
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
    if (selectedIds.length === filteredProducts.length) {
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
    <div className="sw-container" style={{ paddingBottom: "40px" }}>
      {/* PROFESSIONAL EXECUTIVE HEADER (Clean, no Add Product button) */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          padding: "20px 24px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "1.55rem",
                fontWeight: 800,
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
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
              }}
            >
              {products.length} Products
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
            Select products below to compose and export presentation-grade PowerPoint (.pptx) decks in tailored design themes.
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "12px 18px",
          marginBottom: "18px",
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
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? "#f8fafc" : "#ffffff",
              color: "#334155",
              fontWeight: 600,
              fontSize: "0.80rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>{selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? "✓" : "☐"}</span>
            {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? "Deselect All" : "Select All"}
          </button>

          <div style={{ width: "1px", height: "22px", background: "#e2e8f0", margin: "0 4px" }} />

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
                    borderRadius: "8px",
                    border: isActive ? "1px solid #0f172a" : "1px solid #e2e8f0",
                    background: isActive ? "#0f172a" : "#f8fafc",
                    color: isActive ? "#ffffff" : "#475569",
                    fontWeight: 600,
                    fontSize: "0.80rem",
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
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.84rem",
              outline: "none",
              color: "#1e293b",
              background: "#ffffff",
            }}
          />
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.80rem" }}>
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

      {/* INLINE THEME & PPT ACTION BAR (Cleanly nested inside container, perfectly responsive) */}
      {selectedIds.length > 0 && (
        <div
          style={{
            background: "#0f172a",
            color: "#ffffff",
            padding: "14px 20px",
            borderRadius: "12px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 14px rgba(15, 23, 42, 0.18)",
            flexWrap: "wrap",
            gap: "12px",
            border: "1px solid #1e293b",
          }}
        >
          {/* Left: Counter & Theme Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  background: "#334155",
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                }}
              >
                {selectedIds.length}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>
                  {selectedIds.length} Product{selectedIds.length > 1 ? "s" : ""} Selected
                </div>
                <button
                  onClick={handleClearSelection}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "#94a3b8",
                    fontSize: "0.72rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.15)" }} />

            {/* Quick Theme Selector Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.80rem", color: "#94a3b8", fontWeight: 600 }}>Theme:</span>
              <select
                value={selectedThemeId}
                onChange={(e) => setSelectedThemeId(e.target.value as ThemeId)}
                style={{
                  background: "#1e293b",
                  color: "#ffffff",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "0.82rem",
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
                borderRadius: "8px",
                padding: "8px 14px",
                fontWeight: 600,
                fontSize: "0.80rem",
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
                borderRadius: "8px",
                padding: "8px 18px",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: isExportingPpt ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
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

      {/* PRODUCTS GRID */}
      {filteredProducts.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px dashed #cbd5e1",
            padding: "48px 24px",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📦</div>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a", marginBottom: "4px" }}>
            No products match your criteria
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            Try adjusting your search query or category filters.
          </p>
        </div>
      ) : (
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
                  borderRadius: "12px",
                  border: isSelected ? "2px solid #0f172a" : "1px solid #e2e8f0",
                  overflow: "hidden",
                  boxShadow: isSelected ? "0 6px 16px -2px rgba(15, 23, 42, 0.12)" : "0 1px 3px rgba(0, 0, 0, 0.04)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {/* Image Container with Top Badges */}
                <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10", background: "#f8fafc", overflow: "hidden" }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMG;
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />

                  {/* Top-Left Selection Checkbox Pill */}
                  <div
                    onClick={() => handleSelectProduct(product.id)}
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      zIndex: 3,
                      background: isSelected ? "#0f172a" : "rgba(255, 255, 255, 0.95)",
                      color: isSelected ? "#ffffff" : "#1e293b",
                      borderRadius: "6px",
                      padding: "4px 9px",
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.12)",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      userSelect: "none",
                    }}
                  >
                    <span>{isSelected ? "✓" : "+"}</span>
                    <span>{isSelected ? "Selected" : "Select for PPT"}</span>
                  </div>

                  {/* Top-Right Status Pill */}
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      zIndex: 3,
                      fontSize: "0.70rem",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background:
                        product.stockStatus === "In Stock"
                          ? "rgba(240, 253, 244, 0.95)"
                          : product.stockStatus === "Sample Ready"
                          ? "rgba(239, 246, 255, 0.95)"
                          : "rgba(254, 243, 199, 0.95)",
                      color:
                        product.stockStatus === "In Stock"
                          ? "#15803d"
                          : product.stockStatus === "Sample Ready"
                          ? "#1d4ed8"
                          : "#b45309",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                    }}
                  >
                    {product.stockStatus}
                  </div>
                </div>

                {/* Card Information */}
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1 }}>
                  {/* Category & Collection */}
                  <div
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "4px",
                    }}
                  >
                    {product.category} • {product.collectionName}
                  </div>

                  {/* Product Title */}
                  <h3
                    style={{
                      margin: "0 0 6px 0",
                      fontSize: "0.96rem",
                      fontWeight: 700,
                      color: "#0f172a",
                      lineHeight: 1.3,
                    }}
                  >
                    {product.name}
                  </h3>

                  {/* SKU Pill */}
                  <div style={{ marginBottom: "12px" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "#475569",
                        background: "#f1f5f9",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontFamily: "monospace",
                      }}
                    >
                      SKU: {product.sku}
                    </span>
                  </div>

                  {/* Specification Details 2x3 Grid */}
                  <div
                    style={{
                      background: "#f8fafc",
                      borderRadius: "8px",
                      padding: "10px",
                      fontSize: "0.74rem",
                      color: "#334155",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px",
                      marginBottom: "14px",
                    }}
                  >
                    <div>
                      <span style={{ color: "#64748b" }}>Material: </span>
                      <strong>{product.material}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Finish: </span>
                      <strong>{product.woodFinish}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Size: </span>
                      <strong>{product.sizeCm} cm</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Assembly: </span>
                      <strong>{product.assembledKd}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Unit CBM: </span>
                      <strong style={{ color: "#0f172a" }}>{product.cbm} m³</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>40'ft GP: </span>
                      <strong style={{ color: "#0f172a" }}>{product.gp40ft} pcs</strong>
                    </div>
                  </div>

                  {/* Bottom Price & Quick Preview */}
                  <div
                    style={{
                      marginTop: "auto",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "10px",
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                        ${product.fobPriceUsd.toFixed(2)}
                        <span style={{ fontSize: "0.70rem", color: "#64748b", fontWeight: 500, marginLeft: "4px" }}>
                          FOB
                        </span>
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                        MOQ: {product.moq} Pcs
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!selectedIds.includes(product.id)) {
                          setSelectedIds([...selectedIds, product.id]);
                        }
                        setIsPptModalOpen(true);
                      }}
                      style={{
                        padding: "5px 12px",
                        fontSize: "0.74rem",
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
                <h2 style={{ margin: 0, fontSize: "1.20rem", fontWeight: 800 }}>
                  PowerPoint Presentation Studio
                </h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "#94a3b8" }}>
                  Select design theme, configure buyer metadata, and export 16:9 presentation deck (.pptx)
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
            <div style={{ padding: "20px 24px", background: "#f8fafc", flex: 1 }}>
              {/* THEME SELECTOR SECTION */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                  1. Choose Presentation Theme ({Object.keys(DECK_THEMES).length} Available)
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
                          borderRadius: "10px",
                          padding: "12px",
                          border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                          boxShadow: isSelected ? "0 4px 12px rgba(37, 99, 235, 0.15)" : "none",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          position: "relative",
                        }}
                      >
                        {/* Swatch Header */}
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "8px" }}>
                          <span
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              background: th.swatch.primary,
                              border: "1px solid rgba(0,0,0,0.1)",
                              display: "inline-block",
                            }}
                          />
                          <span
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              background: th.swatch.accent,
                              border: "1px solid rgba(0,0,0,0.1)",
                              display: "inline-block",
                            }}
                          />
                          <span
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              background: th.swatch.card,
                              border: "1px solid rgba(0,0,0,0.1)",
                              display: "inline-block",
                            }}
                          />
                        </div>

                        <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "#0f172a", marginBottom: "2px" }}>
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
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  padding: "14px 18px",
                  marginBottom: "20px",
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
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                                    <span style={{ color: `#${currentTheme.product.tableLabelColor}` }}>Size (CM): </span>
                                    <span style={{ color: `#${currentTheme.product.tableValColor}` }}>{product.sizeCm}</span>
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
                padding: "16px 24px",
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
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontWeight: 600,
                    fontSize: "0.82rem",
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
                    borderRadius: "8px",
                    padding: "8px 20px",
                    fontWeight: 700,
                    fontSize: "0.82rem",
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
