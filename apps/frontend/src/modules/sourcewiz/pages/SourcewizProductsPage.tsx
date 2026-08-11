import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Sourcewiz.css";

interface CatalogProduct {
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
  stockStatus: "In Stock" | "Made to Order" | "Sample Ready";
}

const INITIAL_MOCK_PRODUCTS: CatalogProduct[] = [
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
    image: "https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?w=600&auto=format&fit=crop&q=80",
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
  const navigate = useNavigate();

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<CatalogProduct[]>(INITIAL_MOCK_PRODUCTS);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("lii_product_catalog_items");
      if (saved) {
        const parsed: CatalogProduct[] = JSON.parse(saved);
        if (parsed.length > 0) {
          const defaultIds = new Set(INITIAL_MOCK_PRODUCTS.map(p => p.id));
          const filteredCustom = parsed.filter(p => !defaultIds.has(p.id));
          setProducts([...filteredCustom, ...INITIAL_MOCK_PRODUCTS]);
        }
      }
    } catch (e) {
      console.error("Failed to load products from localStorage:", e);
    }
  }, []);

  // Selected product IDs for PPT / Email Deck
  const [selectedIds, setSelectedIds] = useState<string[]>(["1", "4"]);

  // Modal States
  const [isPptModalOpen, setIsPptModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Email form state
  const [emailForm, setEmailForm] = useState({
    customerName: "West Elm Global Sourcing",
    customerEmail: "buyer@westelm.com",
    subject: "LII Exports - Curated B2B Product Presentation & Catalog Deck",
    includePricing: true,
    customMessage: "Dear Buyer Team,\n\nPlease find attached the official presentation deck for our latest collection. All specs, dimensions, container loading quantities, and FOB prices are included.",
  });

  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  const categories = ["All", "Furniture", "Outdoor", "Storage", "Decor"];

  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === "All" || p.category === categoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.collectionName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

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

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  const handleSendEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSentSuccess(true);
    setTimeout(() => {
      setEmailSentSuccess(false);
      setIsEmailModalOpen(false);
    }, 3000);
  };

  return (
    <div className="sw-container">
      {/* Top Banner */}
      <div className="sw-header-gradient" style={{ marginBottom: "24px" }}>
        <div>
          <h1 className="sw-title">
            <span>📦 Product Catalog</span>
            <span className="sw-badge-pro">CATALOG DECK & PPT ENGINE</span>
          </h1>
          <p className="sw-subtitle">
            Form-Recorded Product Master Catalog • Select Products, Create PPT Presentations & Email Directly to Buyers
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            className="sw-btn sw-btn-primary"
            onClick={() => navigate("/admin/sourcewiz/product-form")}
          >
            ➕ Fill Product Form
          </button>
        </div>
      </div>

      {/* Merchant Selection Action Bar */}
      {selectedIds.length > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            padding: "16px 24px",
            borderRadius: "12px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "1.2rem" }}>🎯</span>
            <div>
              <span style={{ fontWeight: 800, fontSize: "1.05rem" }}>
                {selectedIds.length} Product{selectedIds.length > 1 ? "s" : ""} Selected
              </span>
              <span style={{ fontSize: "0.82rem", color: "#94a3b8", marginLeft: "12px" }}>
                Ready to generate PPT Presentation deck or email buyer directly
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setIsPptModalOpen(true)}
              style={{
                background: "#0d9488",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(13, 148, 136, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              📊 Create PPT Presentation ({selectedIds.length})
            </button>
            <button
              onClick={() => setIsEmailModalOpen(true)}
              style={{
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(37, 99, 235, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              📧 Email Directly to Customer
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="sw-card" style={{ marginBottom: "24px" }}>
        <div
          className="sw-card-body"
          style={{
            padding: "16px 24px",
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={handleSelectAll}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: selectedIds.length === filteredProducts.length ? "#eef2ff" : "#fff",
                color: selectedIds.length === filteredProducts.length ? "#4f46e5" : "#475569",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              {selectedIds.length === filteredProducts.length ? "✓ Deselect All" : "Select All Products"}
            </button>

            <div style={{ display: "flex", gap: "8px" }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`sw-tab-btn ${categoryFilter === cat ? "active" : ""}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            placeholder="🔍 Search SKU, Product Name, Material, Collection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              minWidth: "320px",
              fontSize: "0.88rem",
            }}
          />
        </div>
      </div>

      {/* Form-Recorded Products Grid */}
      <div className="sw-products-grid">
        {filteredProducts.map((product) => {
          const isSelected = selectedIds.includes(product.id);
          return (
            <div
              key={product.id}
              className="sw-product-card"
              style={{
                border: isSelected ? "2px solid #0d9488" : "1px solid #e2e8f0",
                boxShadow: isSelected ? "0 4px 12px rgba(13, 148, 136, 0.15)" : "none",
                position: "relative",
              }}
            >
              {/* Checkbox Selector */}
              <div
                onClick={() => handleSelectProduct(product.id)}
                style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  zIndex: 3,
                  background: isSelected ? "#0d9488" : "rgba(255, 255, 255, 0.9)",
                  color: isSelected ? "#fff" : "#475569",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontWeight: 800,
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSelectProduct(product.id)}
                  style={{ cursor: "pointer" }}
                />
                {isSelected ? "Selected" : "Select for PPT"}
              </div>

              <img src={product.image} alt={product.name} className="sw-product-img" />

              <div className="sw-product-info">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h3 className="sw-product-title">{product.name}</h3>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: product.stockStatus === "In Stock" ? "#f0fdf4" : "#eff6ff",
                      color: product.stockStatus === "In Stock" ? "#16a34a" : "#2563eb",
                      border: `1px solid ${product.stockStatus === "In Stock" ? "#bbf7d0" : "#bfdbfe"}`,
                    }}
                  >
                    {product.stockStatus}
                  </span>
                </div>

                <div className="sw-product-sku" style={{ fontWeight: 800, color: "#4f46e5" }}>
                  SKU: {product.sku} • {product.collectionName}
                </div>

                {/* Detailed Recorded Attributes */}
                <div className="sw-product-specs" style={{ fontSize: "0.80rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  <div><strong>Category:</strong> {product.category}</div>
                  <div><strong>Sub-Cat:</strong> {product.subCategory}</div>
                  <div><strong>Material:</strong> {product.material}</div>
                  <div><strong>Wood Finish:</strong> {product.woodFinish}</div>
                  <div><strong>Size (CM):</strong> {product.sizeCm}</div>
                  <div><strong>Assembled/KD:</strong> {product.assembledKd}</div>
                  <div><strong>MOQ:</strong> {product.moq} Pcs</div>
                  <div><strong>CBM:</strong> {product.cbm} m³</div>
                  <div><strong>40'ft GP:</strong> {product.gp40ft} Pcs</div>
                </div>

                <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", display: "block" }}>FOB Price</span>
                    <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0d9488" }}>
                      ${product.fobPriceUsd.toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="sw-btn sw-btn-secondary"
                      style={{ padding: "6px 10px", fontSize: "0.78rem" }}
                      onClick={() => {
                        setSelectedIds([product.id]);
                        setIsPptModalOpen(true);
                      }}
                    >
                      📊 PPT Deck
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: PPT PRESENTATION DECK GENERATOR */}
      {isPptModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(6px)",
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
              maxWidth: "1000px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 28px",
                background: "#0f172a",
                color: "#ffffff",
                borderRadius: "16px 16px 0 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>
                  📊 Interactive B2B PowerPoint Deck Preview
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#94a3b8" }}>
                  {selectedProducts.length} Selected Products Included • Export Format: PowerPoint Presentation (.pptx)
                </p>
              </div>
              <button
                onClick={() => setIsPptModalOpen(false)}
                style={{ background: "none", border: "none", color: "#fff", fontSize: "1.5rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Slide Navigation Tabs */}
            <div
              style={{
                background: "#1e293b",
                padding: "10px 24px",
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                borderBottom: "1px solid #334155",
              }}
            >
              <button
                onClick={() => setActiveSlide(0)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "0.80rem",
                  fontWeight: 700,
                  border: activeSlide === 0 ? "2px solid #0d9488" : "1px solid #475569",
                  background: activeSlide === 0 ? "#0d9488" : "#334155",
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                Slide 1: Cover Presentation
              </button>
              {selectedProducts.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setActiveSlide(idx + 1)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "0.80rem",
                    fontWeight: 700,
                    border: activeSlide === idx + 1 ? "2px solid #0d9488" : "1px solid #475569",
                    background: activeSlide === idx + 1 ? "#0d9488" : "#334155",
                    color: "#ffffff",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Slide {idx + 2}: {p.sku}
                </button>
              ))}
            </div>

            {/* Slide Canvas Render */}
            <div style={{ padding: "32px", background: "#f1f5f9", flex: 1, display: "flex", justifyContent: "center" }}>
              {/* 16:9 Aspect PPT Slide Box */}
              <div
                style={{
                  width: "100%",
                  maxWidth: "840px",
                  aspectRatio: "16 / 9",
                  background: activeSlide === 0 ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" : "#ffffff",
                  color: activeSlide === 0 ? "#ffffff" : "#0f172a",
                  borderRadius: "12px",
                  boxShadow: "0 15px 30px rgba(0,0,0,0.15)",
                  padding: "36px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  border: "1px solid #e2e8f0",
                }}
              >
                {activeSlide === 0 ? (
                  /* COVER SLIDE */
                  <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.90rem", fontWeight: 800, letterSpacing: "0.1em", color: "#818cf8" }}>
                        LII EXPORTS • B2B EXPORT CATALOG
                      </span>
                      <span style={{ background: "#0d9488", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 800 }}>
                        2026 COLLECTION
                      </span>
                    </div>

                    <div>
                      <h1 style={{ fontSize: "2.4rem", fontWeight: 800, margin: "0 0 12px 0", lineHeight: 1.2 }}>
                        Curated Product Presentation Deck
                      </h1>
                      <p style={{ fontSize: "1.1rem", color: "#c7d2fe", margin: 0 }}>
                        Prepared for {emailForm.customerName} • {selectedProducts.length} Premium Form-Recorded Items
                      </p>
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "16px", display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#94a3b8" }}>
                      <span>Confidential Trade Presentation</span>
                      <span>Total Volume: {selectedProducts.reduce((acc, p) => acc + p.cbm, 0).toFixed(2)} CBM</span>
                    </div>
                  </div>
                ) : (
                  /* PRODUCT SLIDE */
                  (() => {
                    const product = selectedProducts[activeSlide - 1];
                    return (
                      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0d9488", paddingBottom: "12px" }}>
                          <div>
                            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0d9488", textTransform: "uppercase" }}>
                              {product.category} • {product.subCategory}
                            </span>
                            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "2px 0 0 0", color: "#0f172a" }}>
                              {product.name}
                            </h2>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0d9488", display: "block" }}>
                              ${product.fobPriceUsd.toFixed(2)} USD
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>SKU: {product.sku}</span>
                          </div>
                        </div>

                        {/* Slide Content Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", margin: "16px 0", flex: 1 }}>
                          <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #cbd5e1", background: "#f8fafc" }}>
                            <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>

                          <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0", fontSize: "0.82rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                              <div style={{ fontWeight: 800, color: "#1e293b", marginBottom: "8px", fontSize: "0.90rem" }}>
                                Technical & Specification Details
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px", color: "#334155" }}>
                                <div><strong>Collection:</strong> {product.collectionName}</div>
                                <div><strong>Material:</strong> {product.material}</div>
                                <div><strong>Wood Finish:</strong> {product.woodFinish}</div>
                                <div><strong>Dimensions (CM):</strong> {product.sizeCm}</div>
                                <div><strong>Assembly:</strong> {product.assembledKd}</div>
                              </div>
                            </div>

                            <div style={{ background: "#ffffff", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", textAlign: "center" }}>
                              <div>
                                <span style={{ fontSize: "0.70rem", color: "#64748b", display: "block" }}>Unit CBM</span>
                                <strong>{product.cbm} m³</strong>
                              </div>
                              <div>
                                <span style={{ fontSize: "0.70rem", color: "#64748b", display: "block" }}>40'ft GP Qty</span>
                                <strong>{product.gp40ft} Pcs</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b", borderTop: "1px solid #e2e8f0", paddingTop: "8px" }}>
                          <span>LII Exports Product Deck</span>
                          <span>Slide {activeSlide + 1} of {selectedProducts.length + 1}</span>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div
              style={{
                padding: "20px 28px",
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
                borderRadius: "0 0 16px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                Formats Available: PowerPoint (.pptx) & High-Res PDF Presentation Deck
              </span>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  className="sw-btn sw-btn-secondary"
                  onClick={() => setIsPptModalOpen(false)}
                >
                  Close
                </button>
                <button
                  className="sw-btn sw-btn-primary"
                  onClick={() => {
                    alert(`PowerPoint presentation deck (.pptx) generated and downloaded for ${selectedProducts.length} products!`);
                  }}
                  style={{ background: "#0d9488", color: "#fff" }}
                >
                  📥 Download PowerPoint (.pptx)
                </button>
                <button
                  className="sw-btn sw-btn-primary"
                  onClick={() => {
                    setIsPptModalOpen(false);
                    setIsEmailModalOpen(true);
                  }}
                  style={{ background: "#2563eb", color: "#fff" }}
                >
                  📧 Email PPT to Customer Directly
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DIRECT CUSTOMER EMAIL MODULE */}
      {isEmailModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(6px)",
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
              maxWidth: "600px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
              padding: "28px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>
                📧 Email Presentation Deck to Customer
              </h3>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {emailSentSuccess && (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#15803d",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  fontWeight: 600,
                  fontSize: "0.90rem",
                }}
              >
                ✅ Presentation Deck & PPT emailed successfully to {emailForm.customerEmail}!
              </div>
            )}

            <form onSubmit={handleSendEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                  Customer / Buyer Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={emailForm.customerName}
                  onChange={(e) => setEmailForm({ ...emailForm, customerName: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                  Customer Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={emailForm.customerEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, customerEmail: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                  Email Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                  Cover Email Message
                </label>
                <textarea
                  rows={4}
                  value={emailForm.customMessage}
                  onChange={(e) => setEmailForm({ ...emailForm, customMessage: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontFamily: "inherit", fontSize: "0.88rem" }}
                />
              </div>

              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
                  Attachments & Presentation Formats:
                </div>
                <div style={{ display: "flex", gap: "12px", fontSize: "0.80rem", color: "#475569" }}>
                  <span>📎 PowerPoint Deck (.pptx)</span>
                  <span>📎 PDF Catalog Spec Sheet</span>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", marginTop: "4px" }}>
                  <input
                    type="checkbox"
                    checked={emailForm.includePricing}
                    onChange={(e) => setEmailForm({ ...emailForm, includePricing: e.target.checked })}
                  />
                  Include Wholesale FOB Prices & Container Quantities in Deck
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="sw-btn sw-btn-secondary"
                  onClick={() => setIsEmailModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sw-btn sw-btn-primary"
                  style={{ background: "#2563eb", color: "#fff", padding: "10px 24px" }}
                >
                  📧 Send Presentation Email to Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
