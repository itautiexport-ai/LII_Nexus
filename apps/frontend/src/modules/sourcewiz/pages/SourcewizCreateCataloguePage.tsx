import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import { masterDataApi } from "../../admin/masterdata/api/masterDataApi";
import {
  generateProductPptx,
  DECK_THEMES,
  ThemeId,
  CatalogProductItem,
  PresentationFieldsConfig,
  DEFAULT_PRESENTATION_FIELDS,
} from "../utils/pptxExport";
import { exportProductsToExcel } from "../utils/excelExport";
import { catalogueShareApi, SharedDeckData } from "../api/catalogueShareApi";
import { catalogueError, catalogueProductsApi } from "../api/catalogueProductsApi";
import { getProductImageUrls } from "../utils/productImages";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80";

const DEFAULT_BUYERS: {name: string; email?: string}[] = [];

function formatProductDate(dateStr?: string, defaultFallback = "Nov 13, 26"): string {
  if (!dateStr) return defaultFallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return defaultFallback;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const day = String(d.getDate()).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${month} ${day}, ${year}`;
  } catch {
    return defaultFallback;
  }
}

/* ==========================================================================
   Lucide-grade vector SVG Icons
   ========================================================================== */
function IconSearch({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconChevronDown({ size = 13, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconArrowUpDown({ size = 13, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  );
}

function IconSparkles({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}

function IconFilterBars({ size = 13, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="6" y1="12" x2="18" y2="12" />
      <line x1="8" y1="18" x2="16" y2="18" />
    </svg>
  );
}

function IconClose({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function SourcewizCreateCataloguePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  // Wizard Step: Defaults directly to Step 2 (Select Products) as requested by user, unless ?step=1 is explicitly passed
  const initialStep = searchParams.get("step") === "1" ? 1 : 2;
  const [step, setStep] = useState<1 | 2>(initialStep);

  // Step 1 Form Fields
  const [buyerCompany, setBuyerCompany] = useState(searchParams.get("buyer") || "ELIAS Global Sourcing");
  const [buyerEmail, setBuyerEmail] = useState(searchParams.get("email") || "");
  const [catalogueName, setCatalogueName] = useState(searchParams.get("name") || "test for test");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [buyerOptions, setBuyerOptions] = useState<{ name: string; email?: string }[]>(DEFAULT_BUYERS);
  const [isBuyerDropdownOpen, setIsBuyerDropdownOpen] = useState(false);
  const [formError, setFormError] = useState("");

  // Hover & Click Card Overlay State (Select Product / View details)
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Step 2 Products & Selection State
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [products, setProducts] = useState<CatalogProductItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [subCategoryFilter, setSubCategoryFilter] = useState("All");
  const [collectionFilter, setCollectionFilter] = useState("All");
  const [materialFilter, setMaterialFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "id-asc" | "price-asc" | "price-desc">("recent");

  // Dropdowns
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSubCategoryDropdownOpen, setIsSubCategoryDropdownOpen] = useState(false);
  const [isCollectionDropdownOpen, setIsCollectionDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [isSmartSearchOpen, setIsSmartSearchOpen] = useState(false);
  const [smartSearchQuery, setSmartSearchQuery] = useState("");

  // Presentation Settings & Export
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>("obsidian");
  const [fieldsConfig, setFieldsConfig] = useState<PresentationFieldsConfig>(DEFAULT_PRESENTATION_FIELDS);
  const [isExportingPpt, setIsExportingPpt] = useState(false);
  const [exportProgressMsg, setExportProgressMsg] = useState("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedDeck, setGeneratedDeck] = useState<SharedDeckData | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Load buyers from master data
  useEffect(() => {
    masterDataApi
      .getBuyers()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const combined = [
            ...data.map((b: any) => ({ name: b.name, email: b.email || "" })),
            ...DEFAULT_BUYERS.filter((db) => !data.some((b: any) => b.name?.toLowerCase() === db.name.toLowerCase())),
          ];
          setBuyerOptions(combined);
        }
      })
      .catch(() => {
        // Fallback to default buyers
      });
  }, []);

  // Read the same server catalogue as the product form, list and detail pages.
  useEffect(() => {
    let active = true;
    catalogueProductsApi.list().then(data => { if (active) setProducts(data); })
      .catch(error => { if (active) setProductsError(catalogueError(error)); })
      .finally(() => { if (active) setProductsLoading(false); });
    return () => { active = false; };
  }, []);

  const allCategories = useMemo(() => {
    const set = new Set(["All", "Chairs", "Tables", "Storage", "Sofas", "Outdoor", "Decor"]);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const allSubCategories = useMemo(() => {
    const set = new Set(["All", "Lounge Chairs", "Dining Chairs", "Accent Chairs", "Sideboards", "Coffee Tables", "Dining Tables"]);
    products.forEach((p) => {
      if (p.subCategory) set.add(p.subCategory);
    });
    return Array.from(set);
  }, [products]);

  const allCollections = useMemo(() => {
    const set = new Set(["All", "Nordic Haven", "Heritage Oak", "Modern Minimal", "Artisan Atelier", "Coastal Retreat"]);
    products.forEach((p) => {
      if (p.collectionName) set.add(p.collectionName);
    });
    return Array.from(set);
  }, [products]);

  // Filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "All" && (p.category || "").toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      if (subCategoryFilter !== "All" && (p.subCategory || "").toLowerCase() !== subCategoryFilter.toLowerCase()) {
        return false;
      }
      if (collectionFilter !== "All" && (p.collectionName || "").toLowerCase() !== collectionFilter.toLowerCase()) {
        return false;
      }
      if (materialFilter !== "All" && !(p.material || "").toLowerCase().includes(materialFilter.toLowerCase())) {
        return false;
      }
      if (stockFilter !== "All" && (p.stockStatus || "").toLowerCase() !== stockFilter.toLowerCase()) {
        return false;
      }
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matches =
          (p.name || "").toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q) ||
          (p.id || "").toLowerCase().includes(q) ||
          (p.material || "").toLowerCase().includes(q) ||
          (p.collectionName || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q) ||
          (p.subCategory || "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [products, categoryFilter, subCategoryFilter, collectionFilter, materialFilter, stockFilter, searchQuery]);

  // Sorting
  const displayedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortOrder === "recent") {
      return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sortOrder === "oldest") {
      return list.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    } else if (sortOrder === "id-asc") {
      return list.sort((a, b) => String(a.sku || a.id).localeCompare(String(b.sku || b.id)));
    } else if (sortOrder === "price-asc") {
      return list.sort((a, b) => (Number(a.fobPriceUsd) || 0) - (Number(b.fobPriceUsd) || 0));
    } else if (sortOrder === "price-desc") {
      return list.sort((a, b) => (Number(b.fobPriceUsd) || 0) - (Number(a.fobPriceUsd) || 0));
    }
    return list;
  }, [filteredProducts, sortOrder]);

  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));

  const handleSelectBuyer = (name: string, email?: string) => {
    setBuyerCompany(name);
    if (email && !buyerEmail) {
      setBuyerEmail(email);
    }
    setIsBuyerDropdownOpen(false);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerCompany.trim()) {
      setFormError("Please select or enter the Buyer Company.");
      return;
    }
    if (!catalogueName.trim()) {
      setFormError("Please enter a name for the catalogue.");
      return;
    }
    setFormError("");
    setStep(2);
  };

  const toggleProductSelect = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedProductIds.length === displayedProducts.length && displayedProducts.length > 0) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(displayedProducts.map((p) => p.id));
    }
  };

  // PowerPoint Deck Export
  const handleDownloadPptx = async () => {
    if (selectedProducts.length === 0) {
      alert("Please select at least 1 product to include in the presentation deck.");
      return;
    }
    setIsExportingPpt(true);
    try {
      const thObj = DECK_THEMES[selectedThemeId] || DECK_THEMES.obsidian;
      await generateProductPptx(selectedProducts, {
        themeId: selectedThemeId,
        customTheme: thObj,
        customerName: buyerCompany || "Global Sourcing Partner",
        deckTitle: catalogueName || "Curated Product Catalogue Deck",
        includePricing: fieldsConfig.includePricing,
        fields: fieldsConfig,
        onProgress: (_curr, _tot, msg) => setExportProgressMsg(msg),
      });
      saveCatalogueRecord("Exported PPTX");
    } catch (err: any) {
      console.error("PPT generation error:", err);
      alert("Failed to create PowerPoint presentation: " + (err?.message || "Unknown error"));
    } finally {
      setIsExportingPpt(false);
      setExportProgressMsg("");
    }
  };

  // Excel (.xlsx) Export
  const handleExportExcel = () => {
    if (selectedProducts.length === 0) {
      alert("Please select at least 1 product to export.");
      return;
    }
    exportProductsToExcel(selectedProducts, {
      deckTitle: catalogueName || "LII_Product_Catalogue",
      customerName: buyerCompany || "",
      includePricing: fieldsConfig.includePricing,
      fields: fieldsConfig,
    });
    saveCatalogueRecord("Exported Excel");
  };

  // Share Presentation Web Link
  const handleGenerateShareLink = async () => {
    if (selectedProducts.length === 0) {
      alert("Please select at least 1 product to generate a share link.");
      return;
    }
    setIsGeneratingLink(true);
    try {
      const result = await catalogueShareApi.createSharedDeck({
        title: catalogueName || "Curated Product Presentation Deck",
        customerName: buyerCompany || "",
        themeId: selectedThemeId,
        includePricing: fieldsConfig.includePricing,
        fieldsConfig,
        products: selectedProducts,
      });
      setGeneratedDeck(result);
      setCopySuccess(false);
      saveCatalogueRecord("Generated Web Link", result.token);
    } catch (err: any) {
      console.error("Failed to generate share link:", err);
      alert("Failed to create presentation link: " + (err?.response?.data?.error?.message || err?.message));
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

  // Save record in local storage history
  const saveCatalogueRecord = (formatType: string, token?: string) => {
    try {
      const existing = JSON.parse(localStorage.getItem("lii_created_catalogues") || "[]");
      const record = {
        id: "cat-" + Date.now(),
        buyerCompany,
        buyerEmail,
        catalogueName,
        formatType,
        token: token || "",
        productCount: selectedProducts.length,
        themeId: selectedThemeId,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("lii_created_catalogues", JSON.stringify([record, ...existing]));
      setSaveSuccessMsg(`Catalogue "${catalogueName}" saved successfully!`);
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    } catch (e) {
      console.error("Failed to save catalogue record:", e);
    }
  };

  return (
    <div
      style={{
        padding: "20px 36px 80px",
        maxWidth: 1440,
        margin: "0 auto",
        fontFamily: "var(--sw-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        color: "#111827",
      }}
    >
      {/* ── TOP HEADER STATUS BAR (STATUS PILL & AVATAR) ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "#e6f4ea",
            color: "#137333",
            padding: "5px 14px",
            borderRadius: "9999px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#16a34a",
              display: "inline-block",
            }}
          />
          <span>1 Task in progress</span>
        </div>

        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#86efac",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#166534",
          }}
          title={user?.fullName || "User Profile"}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      </div>

      {saveSuccessMsg && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1.5px solid #86efac",
            color: "#15803d",
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span>✓</span>
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ── STEP 1: CREATE A NEW CATALOGUE FORM ── */}
      {step === 1 ? (
        <div>
          {/* Breadcrumb */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "13px",
              color: "#6b7280",
              marginBottom: 20,
            }}
          >
            <Link
              to="/admin/sourcewiz"
              style={{
                color: "#6b7280",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
            >
              Dashboard
            </Link>
            <span>/</span>
            <span style={{ fontWeight: 600, color: "#111827" }}>Create Catalogues</span>
          </div>

          <div style={{ maxWidth: 640 }}>
            {/* Title & Subtitle */}
            <h1
              style={{
                fontSize: "30px",
                fontWeight: 700,
                color: "#111827",
                margin: "0 0 6px 0",
                letterSpacing: "-0.025em",
              }}
            >
              Create a new catalogue
            </h1>
            <p
              style={{
                fontSize: "14.5px",
                color: "#6b7280",
                margin: "0 0 36px 0",
              }}
            >
              Enter the following details
            </p>

            {formError && (
              <div
                style={{
                  background: "#fff1f2",
                  border: "1px solid #fecdd3",
                  color: "#e11d48",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  fontSize: "13.5px",
                  marginBottom: "20px",
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleNextStep}>
              {/* Field 1: Buyer Company */}
              <div style={{ marginBottom: 24, position: "relative" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#111827",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ color: "#e11d48", fontWeight: 700 }}>*</span>
                  <span>Buyer Company</span>
                  <span
                    title="Select registered client company or enter full agency name"
                    style={{
                      color: "#9ca3af",
                      cursor: "pointer",
                      fontSize: "13px",
                      marginLeft: 2,
                    }}
                  >
                    ⓘ
                  </span>
                </label>

                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Full name of buying company/agency"
                    value={buyerCompany}
                    onChange={(e) => {
                      setBuyerCompany(e.target.value);
                      setIsBuyerDropdownOpen(true);
                    }}
                    onFocus={() => setIsBuyerDropdownOpen(true)}
                    style={{
                      width: "100%",
                      padding: "12px 40px 12px 16px",
                      borderRadius: "8px",
                      border: "1.5px solid #e5e7eb",
                      fontSize: "14px",
                      outline: "none",
                      background: "#ffffff",
                      color: "#111827",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsBuyerDropdownOpen(!isBuyerDropdownOpen)}
                    style={{
                      position: "absolute",
                      right: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#9ca3af",
                      display: "flex",
                      alignItems: "center",
                      padding: 0,
                    }}
                  >
                    <IconChevronDown size={16} color="#9ca3af" />
                  </button>
                </div>

                {isBuyerDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                      maxHeight: "220px",
                      overflowY: "auto",
                      zIndex: 50,
                    }}
                  >
                    {buyerOptions
                      .filter((b) =>
                        !buyerCompany ||
                        b.name.toLowerCase().includes(buyerCompany.toLowerCase())
                      )
                      .map((b) => (
                        <div
                          key={b.name}
                          onClick={() => handleSelectBuyer(b.name, b.email)}
                          style={{
                            padding: "10px 16px",
                            fontSize: "13.5px",
                            cursor: "pointer",
                            borderBottom: "1px solid #f8fafc",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            color: "#1e293b",
                          }}
                          onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLElement).style.background = "#f0fdfa")
                          }
                          onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.background = "#ffffff")
                          }
                        >
                          <span style={{ fontWeight: 500 }}>{b.name}</span>
                          {b.email && (
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>{b.email}</span>
                          )}
                        </div>
                      ))}
                    <div
                      onClick={() => setIsBuyerDropdownOpen(false)}
                      style={{
                        padding: "8px 16px",
                        fontSize: "12px",
                        color: "#0f766e",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "center",
                        background: "#f8fafc",
                      }}
                    >
                      Close Dropdown
                    </div>
                  </div>
                )}
              </div>

              {/* Field 2: Buyer Email ID */}
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#111827",
                    marginBottom: 8,
                  }}
                >
                  Buyer Email ID (optional)
                </label>
                <input
                  type="email"
                  placeholder="Enter buyer email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "1.5px solid #e5e7eb",
                    fontSize: "14px",
                    outline: "none",
                    background: "#ffffff",
                    color: "#111827",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Field 3: Name of the catalogue */}
              <div style={{ marginBottom: 36 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#111827",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ color: "#e11d48", fontWeight: 700 }}>*</span>
                  <span>Name of the catalogue</span>
                </label>
                <input
                  type="text"
                  placeholder="Catalogue name"
                  value={catalogueName}
                  onChange={(e) => setCatalogueName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "1.5px solid #e5e7eb",
                    fontSize: "14px",
                    outline: "none",
                    background: "#ffffff",
                    color: "#111827",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Action Button: Next */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  style={{
                    background: "#115e59",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 42px",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(17, 94, 89, 0.2)",
                    transition: "all 0.15s ease",
                  }}
                >
                  Next
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* ── STEP 2: SELECT PRODUCTS (MATCHING EXACT SOURCEWIZ SCREENSHOT) ── */
        <div>
          {/* Breadcrumb: Dashboard / Create Catalogues / Select Products */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "13px",
              color: "#6b7280",
              marginBottom: 18,
            }}
          >
            <Link
              to="/admin/sourcewiz"
              style={{
                color: "#6b7280",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
            >
              Dashboard
            </Link>
            <span>/</span>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                background: "none",
                border: "none",
                color: "#6b7280",
                cursor: "pointer",
                padding: 0,
                fontSize: "13px",
              }}
            >
              Create Catalogues
            </button>
            <span>/</span>
            <span style={{ fontWeight: 600, color: "#111827" }}>Select Products</span>
          </div>

          {/* Big Title: Catalogue Name (e.g. test for test) */}
          <div style={{ margin: "0 0 24px 0" }}>
            {isEditingTitle ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                <input
                  type="text"
                  value={catalogueName}
                  onChange={(e) => setCatalogueName(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                  autoFocus
                  style={{
                    fontSize: "26px",
                    fontWeight: 700,
                    color: "#111827",
                    letterSpacing: "-0.02em",
                    padding: "4px 12px",
                    borderRadius: "8px",
                    border: "2px solid #0d7a5f",
                    outline: "none",
                    background: "#ffffff",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(false)}
                  style={{
                    background: "#0d7a5f",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "7px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
              </div>
            ) : (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                <h1
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#111827",
                    margin: 0,
                    letterSpacing: "-0.02em",
                    cursor: "pointer",
                  }}
                  onClick={() => setIsEditingTitle(true)}
                  title="Click to edit catalogue name"
                >
                  {catalogueName || "test for test"}
                </h1>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#9ca3af",
                    cursor: "pointer",
                    padding: "4px",
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: "4px",
                  }}
                  title="Rename Catalogue"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Control Row 1: Search here, Smart Search, Select all checkbox */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 14,
              marginBottom: 16,
            }}
          >
            {/* Left: Search capsule & Smart Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Search here"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: 270,
                    padding: "9px 36px 9px 18px",
                    borderRadius: "9999px",
                    border: "1.5px solid #e5e7eb",
                    fontSize: "13.5px",
                    outline: "none",
                    background: "#ffffff",
                    color: "#111827",
                  }}
                />
                <span style={{ position: "absolute", right: 13, color: "#9ca3af", pointerEvents: "none", display: "flex" }}>
                  <IconSearch size={16} />
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsSmartSearchOpen(true)}
                style={{
                  background: "linear-gradient(135deg, #dbe4ff 0%, #ede9fe 100%)",
                  border: "1px solid #c7d2fe",
                  color: "#4338ca",
                  fontSize: "13px",
                  fontWeight: 600,
                  padding: "8px 20px",
                  borderRadius: "9999px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 1px 2px rgba(99, 102, 241, 0.08)",
                }}
              >
                <IconSparkles size={14} color="#4338ca" />
                <span>Smart Search</span>
              </button>
            </div>

            {/* Right: Select all checkbox */}
            <div>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  userSelect: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                <input
                  type="checkbox"
                  checked={
                    selectedProductIds.length === displayedProducts.length &&
                    displayedProducts.length > 0
                  }
                  onChange={handleSelectAll}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    cursor: "pointer",
                    accentColor: "#115e59",
                  }}
                />
                <span>Select all</span>
              </label>
            </div>
          </div>

          {/* Control Row 2: Category, Sub Category, Collection, More Filters, Recent first */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {/* Filter Dropdown Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {/* Category Dropdown Pill */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                    setIsSubCategoryDropdownOpen(false);
                    setIsCollectionDropdownOpen(false);
                    setIsSortDropdownOpen(false);
                  }}
                  style={{
                    background: categoryFilter !== "All" ? "#f0fdfa" : "#ffffff",
                    border: categoryFilter !== "All" ? "1.5px solid #0f766e" : "1px solid #e5e7eb",
                    borderRadius: "9999px",
                    padding: "7px 16px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: categoryFilter !== "All" ? "#0f766e" : "#374151",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{categoryFilter === "All" ? "Category" : categoryFilter}</span>
                  <IconChevronDown size={13} color={categoryFilter !== "All" ? "#0f766e" : "#6b7280"} />
                </button>

                {isCategoryDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      zIndex: 40,
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                      minWidth: "160px",
                      padding: "6px 0",
                    }}
                  >
                    {allCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategoryFilter(cat);
                          setIsCategoryDropdownOpen(false);
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 16px",
                          textAlign: "left",
                          background: categoryFilter === cat ? "#f0fdfa" : "none",
                          border: "none",
                          fontSize: "13px",
                          color: categoryFilter === cat ? "#0f766e" : "#374151",
                          fontWeight: categoryFilter === cat ? 600 : 400,
                          cursor: "pointer",
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub Category Dropdown Pill */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsSubCategoryDropdownOpen(!isSubCategoryDropdownOpen);
                    setIsCategoryDropdownOpen(false);
                    setIsCollectionDropdownOpen(false);
                    setIsSortDropdownOpen(false);
                  }}
                  style={{
                    background: subCategoryFilter !== "All" ? "#f0fdfa" : "#ffffff",
                    border: subCategoryFilter !== "All" ? "1.5px solid #0f766e" : "1px solid #e5e7eb",
                    borderRadius: "9999px",
                    padding: "7px 16px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: subCategoryFilter !== "All" ? "#0f766e" : "#374151",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{subCategoryFilter === "All" ? "Sub Category" : subCategoryFilter}</span>
                  <IconChevronDown size={13} color={subCategoryFilter !== "All" ? "#0f766e" : "#6b7280"} />
                </button>

                {isSubCategoryDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      zIndex: 40,
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                      minWidth: "170px",
                      padding: "6px 0",
                    }}
                  >
                    {allSubCategories.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => {
                          setSubCategoryFilter(sub);
                          setIsSubCategoryDropdownOpen(false);
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 16px",
                          textAlign: "left",
                          background: subCategoryFilter === sub ? "#f0fdfa" : "none",
                          border: "none",
                          fontSize: "13px",
                          color: subCategoryFilter === sub ? "#0f766e" : "#374151",
                          fontWeight: subCategoryFilter === sub ? 600 : 400,
                          cursor: "pointer",
                        }}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Collection Name Dropdown Pill */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCollectionDropdownOpen(!isCollectionDropdownOpen);
                    setIsCategoryDropdownOpen(false);
                    setIsSubCategoryDropdownOpen(false);
                    setIsSortDropdownOpen(false);
                  }}
                  style={{
                    background: collectionFilter !== "All" ? "#f0fdfa" : "#ffffff",
                    border: collectionFilter !== "All" ? "1.5px solid #0f766e" : "1px solid #e5e7eb",
                    borderRadius: "9999px",
                    padding: "7px 16px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: collectionFilter !== "All" ? "#0f766e" : "#374151",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{collectionFilter === "All" ? "Collection N..." : collectionFilter}</span>
                  <IconChevronDown size={13} color={collectionFilter !== "All" ? "#0f766e" : "#6b7280"} />
                </button>

                {isCollectionDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      zIndex: 40,
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                      minWidth: "170px",
                      padding: "6px 0",
                    }}
                  >
                    {allCollections.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => {
                          setCollectionFilter(col);
                          setIsCollectionDropdownOpen(false);
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 16px",
                          textAlign: "left",
                          background: collectionFilter === col ? "#f0fdfa" : "none",
                          border: "none",
                          fontSize: "13px",
                          color: collectionFilter === col ? "#0f766e" : "#374151",
                          fontWeight: collectionFilter === col ? 600 : 400,
                          cursor: "pointer",
                        }}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: More Filters & Recent first */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
                style={{
                  background: isMoreFiltersOpen || materialFilter !== "All" || stockFilter !== "All" ? "#f0fdfa" : "#ffffff",
                  border: isMoreFiltersOpen || materialFilter !== "All" || stockFilter !== "All" ? "1.5px solid #0f766e" : "1px solid #e5e7eb",
                  borderRadius: "9999px",
                  padding: "7px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: isMoreFiltersOpen || materialFilter !== "All" || stockFilter !== "All" ? "#0f766e" : "#374151",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <IconFilterBars size={13} color="#374151" />
                <span>More Filters</span>
              </button>

              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsSortDropdownOpen(!isSortDropdownOpen);
                    setIsCategoryDropdownOpen(false);
                    setIsSubCategoryDropdownOpen(false);
                    setIsCollectionDropdownOpen(false);
                  }}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "9999px",
                    padding: "7px 16px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#374151",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <IconArrowUpDown size={13} color="#374151" />
                  <span>
                    {sortOrder === "recent"
                      ? "Recent first"
                      : sortOrder === "oldest"
                      ? "Oldest first"
                      : sortOrder === "price-asc"
                      ? "Price: Low to High"
                      : sortOrder === "price-desc"
                      ? "Price: High to Low"
                      : "ID / SKU (A-Z)"}
                  </span>
                </button>

                {isSortDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      right: 0,
                      zIndex: 40,
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                      minWidth: "170px",
                      padding: "6px 0",
                    }}
                  >
                    {[
                      { id: "recent", label: "Recent first" },
                      { id: "oldest", label: "Oldest first" },
                      { id: "id-asc", label: "ID / SKU (A-Z)" },
                      { id: "price-asc", label: "Price: Low to High" },
                      { id: "price-desc", label: "Price: High to Low" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSortOrder(item.id as any);
                          setIsSortDropdownOpen(false);
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 16px",
                          textAlign: "left",
                          background: sortOrder === item.id ? "#f0fdfa" : "none",
                          border: "none",
                          fontSize: "13px",
                          color: sortOrder === item.id ? "#0f766e" : "#374151",
                          fontWeight: sortOrder === item.id ? 600 : 400,
                          cursor: "pointer",
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* More Filters Popover Drawer */}
          {isMoreFiltersOpen && (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px 20px",
                marginBottom: "20px",
                display: "flex",
                flexWrap: "wrap",
                gap: "24px",
                alignItems: "center",
              }}
            >
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>
                  Material
                </label>
                <select
                  value={materialFilter}
                  onChange={(e) => setMaterialFilter(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "13px",
                    color: "#334155",
                  }}
                >
                  <option value="All">All Materials</option>
                  <option value="Wood">Solid Wood / Acacia / Ash</option>
                  <option value="Leather">Top Grain Leather</option>
                  <option value="Boucle">Textured Boucle</option>
                  <option value="Fabric">Woven Fabric / Velvet</option>
                  <option value="Metal">Steel / Brass / Metal</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>
                  Stock Status
                </label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "13px",
                    color: "#334155",
                  }}
                >
                  <option value="All">All Availability</option>
                  <option value="In Stock">In Stock Only</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Made to Order">Made to Order</option>
                </select>
              </div>

              {(materialFilter !== "All" || stockFilter !== "All" || categoryFilter !== "All" || subCategoryFilter !== "All" || collectionFilter !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setMaterialFilter("All");
                    setStockFilter("All");
                    setCategoryFilter("All");
                    setSubCategoryFilter("All");
                    setCollectionFilter("All");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#e11d48",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                    alignSelf: "flex-end",
                    marginBottom: "6px",
                  }}
                >
                  Reset All Filters
                </button>
              )}
            </div>
          )}

          {/* Showing Counter: Showing 1-99 of 2085 Products */}
          <div style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500, margin: "20px 0 16px 0" }}>
            {productsLoading ? "Loading catalogue… " : productsError ? `Catalogue error: ${productsError} ` : ""}Showing {displayedProducts.length ? 1 : 0}-{displayedProducts.length} of {products.length} Products
          </div>

          {/* ── 4-COLUMN PRODUCT CARDS GRID (EXACT SCREENSHOT LAYOUT) ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            {displayedProducts.map((product) => {
              const isSelected = selectedProductIds.includes(product.id);
              const imgUrl = getProductImageUrls(product)[0] || FALLBACK_IMG;
              const isOverlayVisible = hoveredCardId === product.id || activeCardId === product.id;

              return (
                <div
                  key={product.id}
                  onMouseEnter={() => setHoveredCardId(product.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  style={{
                    background: "#ffffff",
                    border: isSelected ? "1.5px solid #0d7a5f" : "1px solid #e5e7eb",
                    borderRadius: "14px",
                    padding: "16px",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: isSelected
                      ? "0 4px 16px rgba(13, 122, 95, 0.14)"
                      : isOverlayVisible
                      ? "0 4px 14px rgba(0,0,0,0.06)"
                      : "0 1px 3px rgba(0,0,0,0.02)",
                    transition: "all 0.18s ease",
                  }}
                >
                  {/* Subtle Selected Indicator Badge (top-right) */}
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        zIndex: 4,
                        background: "#0d7a5f",
                        color: "#ffffff",
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 4px rgba(13, 122, 95, 0.3)",
                      }}
                      title="Product Selected"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}

                  {/* Centered Image Box with Click/Hover Action Overlay */}
                  <div
                    onClick={() => {
                      setActiveCardId((prev) => (prev === product.id ? null : product.id));
                    }}
                    style={{
                      height: 220,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 8,
                      position: "relative",
                      overflow: "hidden",
                      borderRadius: 8,
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={product.name || `Product ${product.id}`}
                      style={{
                        maxHeight: "100%",
                        maxWidth: "100%",
                        objectFit: "contain",
                        transition: "transform 0.25s ease",
                        transform: isOverlayVisible ? "scale(1.02)" : "scale(1)",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMG;
                      }}
                    />

                    {/* Action Overlay: Select product & View details (matching screenshot exactly) */}
                    {isOverlayVisible && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 9,
                          background: "rgba(255, 255, 255, 0.4)",
                          backdropFilter: "blur(0.5px)",
                          padding: "0 18px",
                          zIndex: 10,
                          animation: "fadeIn 0.15s ease",
                        }}
                      >
                        {/* 1. Select Product Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProductSelect(product.id);
                          }}
                          style={{
                            width: "100%",
                            maxWidth: "205px",
                            padding: "9px 14px",
                            background: "#0d7a5f",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "13.5px",
                            fontWeight: 600,
                            cursor: "pointer",
                            boxShadow: "0 2px 5px rgba(13, 122, 95, 0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            transition: "background 0.15s ease, transform 0.1s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#0b664f")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#0d7a5f")}
                        >
                          {isSelected ? (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Selected</span>
                            </>
                          ) : (
                            <span>Select product</span>
                          )}
                        </button>

                        {/* 2. View details Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/sourcewiz/products/${product.id}`);
                          }}
                          style={{
                            width: "100%",
                            maxWidth: "205px",
                            padding: "8px 14px",
                            background: "#ffffff",
                            color: "#0d7a5f",
                            border: "1px solid #0d7a5f",
                            borderRadius: "4px",
                            fontSize: "13.5px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            transition: "background 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f0fdf4")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                        >
                          <span>View details</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bottom Metadata Info */}
                  <div style={{ marginTop: 14, borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
                      ID : {product.id}
                    </div>
                    <div style={{ fontSize: "12.5px", color: "#6b7280", marginTop: 4 }}>
                      Added on {formatProductDate(product.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── FLOATING ACTION DOCK (AVAILABLE WHEN PRODUCTS ARE SELECTED) ── */}
          {selectedProductIds.length > 0 && (
            <div
              style={{
                position: "fixed",
                bottom: 24,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 50,
                background: "#090d16",
                borderRadius: "14px",
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                gap: 20,
                boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.12)",
                maxWidth: "94vw",
                flexWrap: "wrap",
              }}
            >
              {/* Left Count & Selection Control */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    background: "#0f766e",
                    color: "#ffffff",
                    padding: "3px 10px",
                    borderRadius: "9999px",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {selectedProductIds.length}
                </span>
                <div style={{ color: "#ffffff", fontSize: "13.5px", fontWeight: 600 }}>
                  {selectedProductIds.length} Products Selected for <strong style={{ color: "#2dd4bf" }}>{buyerCompany}</strong>
                </div>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    color: "#cbd5e1",
                    fontSize: "12px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  {selectedProductIds.length === displayedProducts.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.15)" }} />

              {/* Right Export Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  style={{
                    background: "rgba(16, 185, 129, 0.16)",
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                    color: "#6ee7b7",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Export Excel
                </button>

                <button
                  type="button"
                  onClick={handleGenerateShareLink}
                  disabled={isGeneratingLink}
                  style={{
                    background: "rgba(168, 85, 247, 0.16)",
                    border: "1px solid rgba(168, 85, 247, 0.35)",
                    color: "#d8b4fe",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: isGeneratingLink ? "not-allowed" : "pointer",
                  }}
                >
                  {isGeneratingLink ? "Creating..." : "Share Link"}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPptx}
                  disabled={isExportingPpt}
                  style={{
                    background: "#0f766e",
                    border: "none",
                    color: "#ffffff",
                    padding: "7px 18px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: isExportingPpt ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{isExportingPpt ? exportProgressMsg || "Building PPT..." : `Download PPT (${selectedProductIds.length})`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => saveCatalogueRecord("Draft")}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: "#cbd5e1",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save Catalogue
                </button>
              </div>
            </div>
          )}

          {/* AI SMART SEARCH POPUP MODAL */}
          {isSmartSearchOpen && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(15, 23, 42, 0.5)",
                backdropFilter: "blur(4px)",
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
              }}
              onClick={() => setIsSmartSearchOpen(false)}
            >
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  maxWidth: "560px",
                  width: "100%",
                  padding: "24px 28px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                  border: "1px solid #e2e8f0",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        background: "linear-gradient(135deg, #c7d2fe 0%, #e0e7ff 100%)",
                        color: "#4338ca",
                        padding: "4px 10px",
                        borderRadius: "9999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                      }}
                    >
                      AI SEARCH
                    </span>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: 0 }}>
                      Smart Search Catalogue
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSmartSearchOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
                  >
                    <IconClose size={18} />
                  </button>
                </div>

                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
                  Describe what you are looking for in natural language to quickly filter matching products.
                </p>

                <div style={{ position: "relative", marginBottom: 16 }}>
                  <input
                    type="text"
                    placeholder="e.g. Tan leather armchair with metal sled legs..."
                    value={smartSearchQuery}
                    onChange={(e) => setSmartSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setSearchQuery(smartSearchQuery);
                        setIsSmartSearchOpen(false);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "1.5px solid #c7d2fe",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    autoFocus
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setIsSmartSearchOpen(false)}
                    style={{
                      background: "#f1f5f9",
                      border: "none",
                      color: "#64748b",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery(smartSearchQuery);
                      setIsSmartSearchOpen(false);
                    }}
                    style={{
                      background: "#0f766e",
                      border: "none",
                      color: "#ffffff",
                      padding: "8px 20px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
