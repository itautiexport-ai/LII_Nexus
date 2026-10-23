import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Sourcewiz.css";
import {
  generateProductPptx,
  DECK_THEMES,
  ThemeId,
  DeckTheme,
  CatalogProductItem,
  PresentationFieldsConfig,
  DEFAULT_PRESENTATION_FIELDS,
  convertMasterThemeToDeckTheme,
} from "../utils/pptxExport";
import { exportProductsToExcel } from "../utils/excelExport";
import { catalogueShareApi, SharedDeckData } from "../api/catalogueShareApi";
import { pptMasterApi, PptMasterTheme, PptFrontPage } from "../../admin/masterdata/api/pptMasterApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import { useIsSystemAdmin } from "../../auth/hooks/usePermissions";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80";

const INITIAL_MOCK_PRODUCTS: CatalogProductItem[] = [];

/* ==========================================================================
   Executive SVG Icons (Lucide-grade vector icons)
   ========================================================================== */
function IconSearch({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconSliders({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function IconPalette({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill={color} />
      <circle cx="17.5" cy="10.5" r=".5" fill={color} />
      <circle cx="8.5" cy="7.5" r=".5" fill={color} />
      <circle cx="6.5" cy="12.5" r=".5" fill={color} />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-4.4-4.5-8-10-8z" />
    </svg>
  );
}

function IconFileSpreadsheet({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M8 13h2" />
      <path d="M14 13h2" />
      <path d="M8 17h2" />
      <path d="M14 17h2" />
    </svg>
  );
}

function IconShare({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function IconDownload({ size = 15, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconTable({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
    </svg>
  );
}

function IconGrid({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

function IconLinkActivity({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
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

function IconEye({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconSquare({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
    </svg>
  );
}

function IconCheckSquare({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconEdit({ size = 13, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function IconTrash({ size = 13, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function IconAlertTriangle({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export default function SourcewizProductsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isSysAdmin = useIsSystemAdmin();
  const isAdmin =
    isSysAdmin ||
    (user?.email || "").toLowerCase().trim() === "admin@liinexus.com" ||
    (user?.email || "").toLowerCase().trim() === "admin" ||
    (user?.roles || []).some((r) => r.toLowerCase().includes("admin"));

  const [products, setProducts] = useState<CatalogProductItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Delete modal confirmation states
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState(false);

  const handleEditProduct = (productId: string) => {
    navigate(`/admin/sourcewiz/product-form?editId=${productId}`);
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (!isAdmin) {
      alert("Permission denied. Deletion is strictly reserved for the Administrator account.");
      return;
    }
    setDeleteConfirmation({ id: productId, name: productName });
  };

  const confirmDeleteProduct = () => {
    if (!deleteConfirmation) return;
    const { id } = deleteConfirmation;
    const updated = products.filter((p) => String(p.id) !== String(id));
    setProducts(updated);
    setSelectedIds((prev) => prev.filter((i) => String(i) !== String(id)));
    localStorage.setItem("lii_product_catalogue_items", JSON.stringify(updated));
    localStorage.setItem("lii_product_catalog_items", JSON.stringify(updated));
    setDeleteConfirmation(null);
  };

  const confirmBulkDelete = () => {
    if (!isAdmin) return;
    const updated = products.filter((p) => !selectedIds.includes(String(p.id)));
    setProducts(updated);
    setSelectedIds([]);
    localStorage.setItem("lii_product_catalogue_items", JSON.stringify(updated));
    localStorage.setItem("lii_product_catalog_items", JSON.stringify(updated));
    setBulkDeleteConfirmation(false);
  };

  // Selected products for presentation (default empty)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal & Presentation Studio State
  const [isPptModalOpen, setIsPptModalOpen] = useState(false);
  const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Deck Options, Theme & Front Page
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>("obsidian");
  const [selectedFrontPageId, setSelectedFrontPageId] = useState<string>("default");
  const [customThemes, setCustomThemes] = useState<PptMasterTheme[]>([]);
  const [customFrontPages, setCustomFrontPages] = useState<PptFrontPage[]>([]);
  const [customerName, setCustomerName] = useState("West Elm Global Sourcing");
  const [deckTitle, setDeckTitle] = useState("Curated Product Presentation Deck");
  const [fieldsConfig, setFieldsConfig] = useState<PresentationFieldsConfig>(DEFAULT_PRESENTATION_FIELDS);

  // Load custom master themes & front pages
  useEffect(() => {
    pptMasterApi.getThemes().then((data) => setCustomThemes(data || [])).catch(console.error);
    pptMasterApi.getFrontPages().then((data) => setCustomFrontPages(data || [])).catch(console.error);
  }, []);

  // Combined themes map (Built-ins + Custom Master Themes)
  const allThemesMap = React.useMemo(() => {
    const map: Record<string, DeckTheme> = { ...DECK_THEMES };
    customThemes.forEach((ct) => {
      map[ct.id] = convertMasterThemeToDeckTheme(ct);
    });
    return map;
  }, [customThemes]);

  const activeFrontPage = customFrontPages.find((fp) => fp.id === selectedFrontPageId);

  // Sorting State
  const [sortField, setSortField] = useState<"name" | "sku" | "fobPriceUsd" | "cbm" | "stockStatus" | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: "name" | "sku" | "fobPriceUsd" | "cbm" | "stockStatus") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

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
        if (Array.isArray(parsed)) {
          // Purge default dummy mock items from user's storage
          const mockIds = new Set(["1", "2", "3", "4"]);
          const mockSkus = new Set(["SW-LII-DT-12557", "SW-LII-OC-04", "SW-LII-AC-09", "SW-LII-SB-12"]);
          const realUserProducts = parsed.filter(
            (p) => !mockIds.has(String(p.id)) && !mockSkus.has(String(p.sku))
          );
          setProducts(realUserProducts);
          localStorage.setItem("lii_product_catalogue_items", JSON.stringify(realUserProducts));
          localStorage.setItem("lii_product_catalog_items", JSON.stringify(realUserProducts));
          return;
        }
      }
      setProducts([]);
    } catch (e) {
      console.error("Failed to load products from localStorage:", e);
      setProducts([]);
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

  const displayedProducts = React.useMemo(() => {
    if (!sortField) return filteredProducts;
    return [...filteredProducts].sort((a, b) => {
      const aVal: any = a[sortField];
      const bVal: any = b[sortField];
      if (typeof aVal === "string") {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? (Number(aVal) || 0) - (Number(bVal) || 0) : (Number(bVal) || 0) - (Number(aVal) || 0);
    });
  }, [filteredProducts, sortField, sortAsc]);

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  const handleSelectProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === displayedProducts.length && displayedProducts.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedProducts.map((p) => p.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleDownloadPptx = async (themeOverride?: ThemeId) => {
    if (selectedProducts.length === 0) return;
    setIsExportingPpt(true);
    try {
      const thId = themeOverride || selectedThemeId;
      const thObj = allThemesMap[thId] || DECK_THEMES.obsidian;
      const fpObj = customFrontPages.find((fp) => fp.id === selectedFrontPageId);

      await generateProductPptx(selectedProducts, {
        themeId: thId,
        customTheme: thObj,
        frontPageImageUrl: fpObj?.image_url,
        frontPageOverlayText: fpObj ? Boolean(fpObj.overlay_text) : true,
        frontPageTextTheme: fpObj?.text_theme || "light",
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

  const currentTheme: DeckTheme = allThemesMap[selectedThemeId] || DECK_THEMES.obsidian;

  return (
    <div className="sw-container">
      {/* EXECUTIVE ENTERPRISE HEADER */}
      <div className="sw-page-header">
        <div>
          <div className="sw-header-title-group">
            <h1 className="sw-page-title">
              Product Catalogue
            </h1>
            <span className="sw-count-badge">
              {products.length} Products Recorded
            </span>
          </div>
        </div>

        {/* Header Actions: View Switcher & Shared Links */}
        <div className="sw-header-actions">
          <div className="sw-view-switcher">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`sw-view-btn ${viewMode === "table" ? "active" : ""}`}
            >
              <IconTable size={14} />
              <span>Table View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`sw-view-btn ${viewMode === "grid" ? "active" : ""}`}
            >
              <IconGrid size={14} />
              <span>Grid View</span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadSharedDecksHistory}
            className="sw-btn-link-activity"
            title="View shared presentation links and buyer view activity"
          >
            <IconLinkActivity size={14} color="#475569" />
            <span>Shared Links Activity</span>
          </button>
        </div>
      </div>

      {/* UNIFIED FILTER & SEARCH TOOLBAR */}
      <div className="sw-toolbar">
        {/* Left: Select All & Category Pills */}
        <div className="sw-toolbar-left">
          <button
            type="button"
            onClick={handleSelectAll}
            className={`sw-select-all-btn ${
              selectedIds.length === displayedProducts.length && displayedProducts.length > 0 ? "active" : ""
            }`}
          >
            {selectedIds.length === displayedProducts.length && displayedProducts.length > 0 ? (
              <IconCheckSquare size={15} color="#2563eb" />
            ) : (
              <IconSquare size={15} color="#64748b" />
            )}
            <span>
              {selectedIds.length === displayedProducts.length && displayedProducts.length > 0
                ? "Deselect All"
                : "Select All"}
            </span>
          </button>

          <div className="sw-toolbar-divider" />

          <div className="sw-category-pills">
            {categories.map((cat) => {
              const count = cat === "All" ? products.length : products.filter((p) => p.category === cat).length;
              const isActive = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`sw-category-pill ${isActive ? "active" : ""}`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Unified Search Input */}
        <div className="sw-search-wrapper">
          <span className="sw-search-icon">
            <IconSearch size={15} />
          </span>
          <input
            type="text"
            placeholder="Search SKU, product name, material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sw-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="sw-search-clear"
              title="Clear search"
            >
              <IconClose size={14} />
            </button>
          )}
        </div>
      </div>

      {/* EXECUTIVE OBSIDIAN FLOATING ACTION DOCK ("X Items Selected") */}
      {selectedIds.length > 0 && (
        <div className="sw-action-dock">
          {/* Left: Selection Counter & Theme Selector */}
          <div className="sw-dock-left">
            <div className="sw-dock-count-group">
              <span className="sw-dock-badge">
                {selectedIds.length}
              </span>
              <div>
                <div className="sw-dock-label">
                  {selectedIds.length} Item{selectedIds.length > 1 ? "s" : ""} Selected
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="sw-dock-clear-link"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <div className="sw-dock-divider" />

            {/* Quick Theme Selector Dropdown */}
            <div className="sw-theme-selector-group">
              <span className="sw-theme-label">Presentation Theme:</span>
              <select
                value={selectedThemeId}
                onChange={(e) => setSelectedThemeId(e.target.value as ThemeId)}
                className="sw-theme-select"
              >
                <optgroup label="System Executive Themes">
                  {Object.values(DECK_THEMES).map((th) => (
                    <option key={th.id} value={th.id}>
                      {th.name} ({th.badge})
                    </option>
                  ))}
                </optgroup>
                {customThemes.length > 0 && (
                  <optgroup label="Custom Master Themes">
                    {customThemes.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name} ({ct.badge || "CUSTOM"})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Quick Front Page Selector Dropdown */}
            <div className="sw-theme-selector-group">
              <span className="sw-theme-label">Front Page:</span>
              <select
                value={selectedFrontPageId}
                onChange={(e) => setSelectedFrontPageId(e.target.value)}
                className="sw-theme-select"
                title="Select front cover slide template"
              >
                <option value="default">Default Themed Cover</option>
                {customFrontPages.length > 0 && (
                  <optgroup label="Uploaded Master Front Pages">
                    {customFrontPages.map((fp) => (
                      <option key={fp.id} value={fp.id}>
                        {fp.title} ({fp.overlay_text ? "Text Overlay" : "Artwork Only"})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <Link
              to="/admin/ppt-themes"
              title="Upload & configure themes and front pages in Master Data"
              style={{
                color: "#94a3b8",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: "0.72rem",
                textDecoration: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px dashed rgba(255,255,255,0.18)",
                transition: "all 0.15s ease",
              }}
            >
              <span>+ Masters</span>
            </Link>
          </div>

          {/* Right: Refined Executive Actions with crisp SVG icons */}
          <div className="sw-dock-right">
            {/* Field Selection / Details Option Button */}
            <button
              type="button"
              onClick={() => setIsFieldsModalOpen(true)}
              className="sw-btn-dock sw-btn-dock-config"
              title="Select which product details to include or exclude (Pricing, Specs, MOQ, Logistics, Slides)"
            >
              <IconSliders size={14} color="#93c5fd" />
              <span>Details to Include ({activeFieldsCount}/15)</span>
            </button>

            {/* Themes & Live Slide Preview */}
            <button
              type="button"
              onClick={() => setIsPptModalOpen(true)}
              className="sw-btn-dock sw-btn-dock-ghost"
              title="Open full interactive presentation studio and visual slide preview"
            >
              <IconPalette size={14} color="#cbd5e1" />
              <span>Themes & Preview</span>
            </button>

            {/* Export Excel (.xlsx) */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="sw-btn-dock sw-btn-dock-excel"
              title="Export product specifications and commercial details to Excel (.xlsx)"
            >
              <IconFileSpreadsheet size={14} color="#6ee7b7" />
              <span>Export Excel</span>
            </button>

            {/* Share Web Link with Buyer */}
            <button
              type="button"
              onClick={handleGenerateShareLink}
              disabled={isGeneratingLink}
              className="sw-btn-dock sw-btn-dock-share"
              title="Generate interactive presentation link with real-time buyer view notifications"
            >
              <IconShare size={14} color="#d8b4fe" />
              <span>{isGeneratingLink ? "Creating Link..." : "Share Link with Buyer"}</span>
            </button>

            {/* Download PowerPoint (.pptx) */}
            <button
              type="button"
              onClick={() => handleDownloadPptx()}
              disabled={isExportingPpt}
              className="sw-btn-dock sw-btn-dock-primary"
              title="Download high-resolution PowerPoint presentation deck (.pptx)"
            >
              <IconDownload size={14} color="#ffffff" />
              <span>
                {isExportingPpt
                  ? exportProgressMsg || "Generating PPT..."
                  : `Download PPT (${selectedIds.length})`}
              </span>
            </button>

            {/* Delete Selected (Admin Only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setBulkDeleteConfirmation(true)}
                className="sw-btn-dock"
                style={{
                  background: "rgba(225, 29, 72, 0.16)",
                  color: "#fecdd3",
                  border: "1px solid rgba(225, 29, 72, 0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
                title="Delete all selected products from catalogue (Admin only)"
              >
                <IconTrash size={14} color="#fecdd3" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* PRIMARY VIEW 1: ENTERPRISE DATA TABLE */}
      {viewMode === "table" ? (
        <div className="sw-table-card">
          <div className="sw-table-wrapper">
            <table className="sw-enterprise-table sw-table" data-no-enhance="true">
              <thead>
                <tr>
                  <th style={{ width: "44px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === displayedProducts.length && displayedProducts.length > 0
                      }
                      onChange={handleSelectAll}
                      style={{ cursor: "pointer" }}
                    />
                  </th>
                  <th style={{ width: "64px" }}>Image</th>
                  <th
                    onClick={() => handleSort("name")}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    title="Sort by Name"
                  >
                    Product Name & Category {sortField === "name" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th
                    onClick={() => handleSort("sku")}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    title="Sort by SKU"
                  >
                    SKU & Collection {sortField === "sku" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th>Materials & Finish</th>
                  <th>Dimensions & Assembly</th>
                  <th
                    onClick={() => handleSort("cbm")}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    title="Sort by CBM"
                  >
                    CBM / 40'ft GP {sortField === "cbm" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th
                    onClick={() => handleSort("fobPriceUsd")}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    title="Sort by FOB Price"
                  >
                    FOB Price & MOQ {sortField === "fobPriceUsd" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th
                    onClick={() => handleSort("stockStatus")}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    title="Sort by Status"
                  >
                    Status {sortField === "stockStatus" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: "64px 24px", textAlign: "center", color: "#64748b" }}>
                      <div style={{ maxWidth: "420px", margin: "0 auto", textAlign: "center" }}>
                        <div style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          background: "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 16px auto",
                          color: "#94a3b8"
                        }}>
                          <IconSliders size={26} color="#94a3b8" />
                        </div>
                        <h3 style={{ margin: "0 0 6px 0", fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                          No Products in Catalogue
                        </h3>
                        <p style={{ margin: "0 0 18px 0", fontSize: "0.85rem", color: "#64748b" }}>
                          No products have been added yet. Use the Product Form to create your first product.
                        </p>
                        <Link
                          to="/admin/sourcewiz/product-form"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "9px 20px",
                            background: "#0d9488",
                            color: "#ffffff",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "0.86rem",
                            textDecoration: "none",
                            boxShadow: "0 2px 4px rgba(13, 148, 136, 0.2)",
                          }}
                        >
                          + Add Product Form
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedProducts.map((product) => {
                    const isSelected = selectedIds.includes(product.id);
                    return (
                      <tr
                        key={product.id}
                        onClick={() => handleSelectProduct(product.id)}
                        className={isSelected ? "sw-row-active" : ""}
                      >
                        {/* Checkbox */}
                        <td
                          style={{ textAlign: "center" }}
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
                        <td>
                          <div className="sw-thumb-box">
                            <img
                              src={product.image}
                              alt={product.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = FALLBACK_IMG;
                              }}
                              className="sw-thumb-img"
                            />
                          </div>
                        </td>

                        {/* Name & Category */}
                        <td>
                          <div className="sw-product-title-text">
                            {product.name}
                          </div>
                          <div className="sw-product-category-text">
                            {product.category} • {product.subCategory}
                          </div>
                        </td>

                        {/* SKU & Collection */}
                        <td>
                          <span className="sw-sku-code">
                            {product.sku}
                          </span>
                          <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "3px" }}>
                            {product.collectionName}
                          </div>
                        </td>

                        {/* Materials & Finish */}
                        <td>
                          <div style={{ color: "#1e293b", fontWeight: 600, fontSize: "0.80rem" }}>
                            {product.material}
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "2px" }}>
                            {product.woodFinish} {product.metalFinish && product.metalFinish !== "N/A" ? `• ${product.metalFinish}` : ""}
                          </div>
                        </td>

                        {/* Size & Assembly */}
                        <td>
                          <div style={{ color: "#1e293b", fontWeight: 600, fontSize: "0.80rem", fontVariantNumeric: "tabular-nums" }}>
                            {product.sizeCm} cm
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "2px" }}>
                            Assembly: <strong>{product.assembledKd}</strong>
                          </div>
                        </td>

                        {/* CBM / 40'ft */}
                        <td>
                          <div style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.82rem", fontVariantNumeric: "tabular-nums" }}>
                            {product.cbm} m³
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", fontVariantNumeric: "tabular-nums", marginTop: "2px" }}>
                            40'GP: {product.gp40ft} pcs
                          </div>
                        </td>

                        {/* Price & MOQ */}
                        <td>
                          <div style={{ color: "#0f172a", fontWeight: 800, fontSize: "0.92rem", fontVariantNumeric: "tabular-nums" }}>
                            ${product.fobPriceUsd.toFixed(2)}
                            <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 500, marginLeft: "4px" }}>
                              FOB
                            </span>
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
                            MOQ: {product.moq} pcs
                          </div>
                        </td>

                        {/* Stock Status Pill Badge */}
                        <td>
                          {product.stockStatus === "In Stock" ? (
                            <span className="sw-status-pill sw-status-pill-instock">
                              <span className="sw-dot" />
                              <span>In Stock</span>
                            </span>
                          ) : product.stockStatus === "Sample Ready" ? (
                            <span className="sw-status-pill sw-status-pill-sample">
                              <span className="sw-dot" />
                              <span>Sample Ready</span>
                            </span>
                          ) : (
                            <span className="sw-status-pill sw-status-pill-mto">
                              <span className="sw-dot" />
                              <span>Made to Order</span>
                            </span>
                          )}
                        </td>

                        {/* Actions: Preview, Edit (All Users), Delete (Admin Only) */}
                        <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", justifyContent: "flex-end" }}>
                            {/* Preview */}
                            <button
                              type="button"
                              onClick={() => {
                                if (!selectedIds.includes(product.id)) {
                                  setSelectedIds([...selectedIds, product.id]);
                                }
                                setIsPptModalOpen(true);
                              }}
                              style={{
                                padding: "6px 10px",
                                fontSize: "0.74rem",
                                fontWeight: 600,
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                background: "#ffffff",
                                color: "#334155",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "#94a3b8";
                                e.currentTarget.style.background = "#f8fafc";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "#cbd5e1";
                                e.currentTarget.style.background = "#ffffff";
                              }}
                              title="Preview in presentation deck"
                            >
                              <IconEye size={13} color="#64748b" />
                              <span>Preview</span>
                            </button>

                            {/* Edit Button - AVAILABLE TO ALL USERS */}
                            <button
                              type="button"
                              onClick={() => handleEditProduct(product.id)}
                              style={{
                                padding: "6px 10px",
                                fontSize: "0.74rem",
                                fontWeight: 600,
                                borderRadius: "6px",
                                border: "1px solid #bae6fd",
                                background: "#f0f9ff",
                                color: "#0284c7",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "#38bdf8";
                                e.currentTarget.style.background = "#e0f2fe";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "#bae6fd";
                                e.currentTarget.style.background = "#f0f9ff";
                              }}
                              title="Edit product details"
                            >
                              <IconEdit size={13} color="#0284c7" />
                              <span>Edit</span>
                            </button>

                            {/* Delete Button - STRICTLY ADMIN ONLY */}
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                style={{
                                  padding: "6px 10px",
                                  fontSize: "0.74rem",
                                  fontWeight: 600,
                                  borderRadius: "6px",
                                  border: "1px solid #fecdd3",
                                  background: "#fff1f2",
                                  color: "#e11d48",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = "#fb7185";
                                  e.currentTarget.style.background = "#ffe4e6";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = "#fecdd3";
                                  e.currentTarget.style.background = "#fff1f2";
                                }}
                                title="Delete product (Admin only)"
                              >
                                <IconTrash size={13} color="#e11d48" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
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
          {displayedProducts.length === 0 ? (
            <div style={{
              gridColumn: "1 / -1",
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px dashed #cbd5e1",
              padding: "64px 24px",
              textAlign: "center",
            }}>
              <div style={{ maxWidth: "420px", margin: "0 auto", textAlign: "center" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px auto",
                  color: "#94a3b8"
                }}>
                  <IconSliders size={26} color="#94a3b8" />
                </div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                  No Products in Catalogue
                </h3>
                <p style={{ margin: "0 0 18px 0", fontSize: "0.85rem", color: "#64748b" }}>
                  No products have been added yet. Use the Product Form to create your first product.
                </p>
                <Link
                  to="/admin/sourcewiz/product-form"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 20px",
                    background: "#0d9488",
                    color: "#ffffff",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "0.86rem",
                    textDecoration: "none",
                    boxShadow: "0 2px 4px rgba(13, 148, 136, 0.2)",
                  }}
                >
                  + Add Product Form
                </Link>
              </div>
            </div>
          ) : (
            displayedProducts.map((product) => {
            const isSelected = selectedIds.includes(product.id);
            return (
              <div
                key={product.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "10px",
                  border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                  overflow: "hidden",
                  boxShadow: isSelected ? "0 4px 14px rgba(37, 99, 235, 0.12)" : "0 1px 3px rgba(0, 0, 0, 0.04)",
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
                      borderRadius: "6px",
                      padding: "4px 9px",
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.12)",
                    }}
                  >
                    {isSelected ? <IconCheckSquare size={13} color="#60a5fa" /> : <IconSquare size={13} color="#64748b" />}
                    <span>{isSelected ? "Selected" : "Select"}</span>
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      zIndex: 3,
                    }}
                  >
                    {product.stockStatus === "In Stock" ? (
                      <span className="sw-status-pill sw-status-pill-instock" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                        <span className="sw-dot" />
                        <span>In Stock</span>
                      </span>
                    ) : product.stockStatus === "Sample Ready" ? (
                      <span className="sw-status-pill sw-status-pill-sample" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                        <span className="sw-dot" />
                        <span>Sample Ready</span>
                      </span>
                    ) : (
                      <span className="sw-status-pill sw-status-pill-mto" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                        <span className="sw-dot" />
                        <span>Made to Order</span>
                      </span>
                    )}
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
                    <span className="sw-sku-code">
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

                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedIds.includes(product.id)) {
                            setSelectedIds([...selectedIds, product.id]);
                          }
                          setIsPptModalOpen(true);
                        }}
                        style={{
                          padding: "6px 9px",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#334155",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "all 0.15s ease",
                        }}
                        title="Preview in presentation deck"
                      >
                        <IconEye size={12} color="#64748b" />
                        <span>Preview</span>
                      </button>

                      {/* Edit Button - AVAILABLE TO ALL USERS */}
                      <button
                        type="button"
                        onClick={() => handleEditProduct(product.id)}
                        style={{
                          padding: "6px 9px",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          borderRadius: "6px",
                          border: "1px solid #bae6fd",
                          background: "#f0f9ff",
                          color: "#0284c7",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "all 0.15s ease",
                        }}
                        title="Edit product details"
                      >
                        <IconEdit size={12} color="#0284c7" />
                        <span>Edit</span>
                      </button>

                      {/* Delete Button - STRICTLY ADMIN ONLY */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          style={{
                            padding: "6px 9px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            borderRadius: "6px",
                            border: "1px solid #fecdd3",
                            background: "#fff1f2",
                            color: "#e11d48",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            transition: "all 0.15s ease",
                          }}
                          title="Delete product (Admin only)"
                        >
                          <IconTrash size={12} color="#e11d48" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
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
              {/* THEME & FRONT PAGE SELECTION SECTION */}
              <div style={{ marginBottom: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#475569",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    1. Choose Presentation Theme ({Object.keys(allThemesMap).length} Themes Available)
                  </div>

                  <Link
                    to="/admin/ppt-themes"
                    target="_blank"
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      color: "#2563eb",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    + Manage Themes & Upload Front Pages in Masters &rarr;
                  </Link>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: "10px",
                    marginBottom: "20px",
                  }}
                >
                  {Object.values(allThemesMap).map((th) => {
                    const isSelected = selectedThemeId === th.id;
                    const isCustom = !Object.keys(DECK_THEMES).includes(th.id);
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
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
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

                          <span
                            style={{
                              fontSize: "0.62rem",
                              fontWeight: 800,
                              padding: "1px 6px",
                              borderRadius: "4px",
                              background: isCustom ? "#ecfdf5" : "#f1f5f9",
                              color: isCustom ? "#065f46" : "#64748b",
                            }}
                          >
                            {isCustom ? "MASTER" : "SYSTEM"}
                          </span>
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

                {/* 2. CHOOSE FRONT PAGE / COVER SLIDE TEMPLATE */}
                <div style={{ marginBottom: "10px" }}>
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
                    2. Choose Front Page / Cover Template ({customFrontPages.length + 1} Options)
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    {/* Default Themed Cover Option */}
                    <div
                      onClick={() => setSelectedFrontPageId("default")}
                      style={{
                        background: "#ffffff",
                        borderRadius: "8px",
                        padding: "10px",
                        border: selectedFrontPageId === "default" ? "2px solid #2563eb" : "1px solid #e2e8f0",
                        boxShadow: selectedFrontPageId === "default" ? "0 4px 12px rgba(37, 99, 235, 0.15)" : "none",
                        cursor: "pointer",
                        position: "relative",
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "56px",
                          height: "36px",
                          borderRadius: "4px",
                          background: currentTheme.swatch.primary,
                          border: `1px solid ${currentTheme.swatch.accent}55`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: currentTheme.swatch.accent,
                          fontSize: "0.70rem",
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        THEME
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.80rem", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          Default Themed Cover
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                          Uses selected theme colorway
                        </div>
                      </div>
                      {selectedFrontPageId === "default" && (
                        <span style={{ color: "#2563eb", fontWeight: 800, fontSize: "0.85rem" }}>✓</span>
                      )}
                    </div>

                    {/* Custom Uploaded Front Pages */}
                    {customFrontPages.map((fp) => {
                      const isSelected = selectedFrontPageId === fp.id;
                      return (
                        <div
                          key={fp.id}
                          onClick={() => setSelectedFrontPageId(fp.id)}
                          style={{
                            background: "#ffffff",
                            borderRadius: "8px",
                            padding: "10px",
                            border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                            boxShadow: isSelected ? "0 4px 12px rgba(37, 99, 235, 0.15)" : "none",
                            cursor: "pointer",
                            position: "relative",
                            display: "flex",
                            gap: "10px",
                            alignItems: "center",
                          }}
                        >
                          <img
                            src={fp.image_url}
                            alt={fp.title}
                            style={{
                              width: "56px",
                              height: "36px",
                              borderRadius: "4px",
                              objectFit: "cover",
                              flexShrink: 0,
                              background: "#0f172a",
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: "0.80rem", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {fp.title}
                            </div>
                            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                              {fp.overlay_text ? "Text Overlay" : "Artwork Only"}
                            </div>
                          </div>
                          {isSelected && (
                            <span style={{ color: "#2563eb", fontWeight: 800, fontSize: "0.85rem" }}>✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
                          ? activeFrontPage
                            ? `url(${activeFrontPage.image_url}) center/cover no-repeat`
                            : `#${currentTheme.cover.bg}`
                          : activeSlide === selectedProducts.length + 1
                          ? `#${currentTheme.closing.bg}`
                          : `#${currentTheme.product.bg}`,
                      color:
                        activeSlide === 0
                          ? activeFrontPage && activeFrontPage.text_theme === "dark"
                            ? "#0f172a"
                            : `#${currentTheme.cover.titleColor}`
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
                      activeFrontPage && !activeFrontPage.overlay_text ? (
                        <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                          <div style={{
                            alignSelf: "flex-start",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            background: "rgba(15, 23, 42, 0.8)",
                            color: "#ffffff",
                            fontSize: "0.70rem",
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            backdropFilter: "blur(4px)",
                          }}>
                            {activeFrontPage.title.toUpperCase()} • FULL BLEED ARTWORK (NO TEXT OVERLAY)
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          position: "relative",
                          zIndex: 2,
                          background: activeFrontPage
                            ? activeFrontPage.text_theme === "dark"
                              ? "rgba(255, 255, 255, 0.72)"
                              : "rgba(0, 0, 0, 0.65)"
                            : "transparent",
                          margin: "-24px",
                          padding: "24px",
                          backdropFilter: activeFrontPage ? "blur(3px)" : "none",
                        }}>
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
                                color: activeFrontPage && activeFrontPage.text_theme === "dark" ? "#0f172a" : `#${currentTheme.cover.titleColor}`,
                              }}
                            >
                              {deckTitle}
                            </h1>
                            <p style={{
                              fontSize: "0.90rem",
                              color: activeFrontPage && activeFrontPage.text_theme === "dark" ? "#334155" : `#${currentTheme.cover.subtitleColor}`,
                              margin: 0
                            }}>
                              Prepared for {customerName} • {selectedProducts.length} Premium Form-Recorded Items
                            </p>
                          </div>

                          <div
                            style={{
                              background: activeFrontPage && activeFrontPage.text_theme === "dark" ? "rgba(255,255,255,0.85)" : `#${currentTheme.cover.cardBg}`,
                              border: `1px solid #${currentTheme.cover.cardBorder}`,
                              borderRadius: "6px",
                              padding: "8px 12px",
                              fontSize: "0.74rem",
                              color: activeFrontPage && activeFrontPage.text_theme === "dark" ? "#1e293b" : `#${currentTheme.cover.cardText}`,
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
                      )
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
                  <IconFileSpreadsheet size={15} color="#059669" />
                  <span>Export Excel</span>
                </button>

                <button
                  type="button"
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
                  <IconShare size={15} color="#7e22ce" />
                  <span>{isGeneratingLink ? "Creating Link..." : "Share Link with Buyer"}</span>
                </button>

                <button
                  type="button"
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
                  <IconDownload size={15} color="#ffffff" />
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
                  <IconSliders size={18} color="#93c5fd" />
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
                  <IconFileSpreadsheet size={15} color="#059669" />
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
                  <IconShare size={15} color="#7e22ce" />
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
                  <IconDownload size={15} color="#ffffff" />
                  <span>Download PPT ({selectedIds.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SINGLE PRODUCT CONFIRMATION MODAL (ADMIN ONLY) */}
      {deleteConfirmation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setDeleteConfirmation(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "26px 28px",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <IconAlertTriangle size={24} color="#dc2626" />
            </div>

            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
              Delete Product?
            </h3>

            <p style={{ margin: "0 0 20px 0", fontSize: "0.88rem", color: "#64748b", lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong style={{ color: "#0f172a" }}>"{deleteConfirmation.name}"</strong>? This will remove it from the catalogue.
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                style={{
                  padding: "10px 20px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                style={{
                  padding: "10px 22px",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  borderRadius: "8px",
                  border: "none",
                  background: "#e11d48",
                  color: "#ffffff",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(225, 29, 72, 0.3)",
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL (ADMIN ONLY) */}
      {bulkDeleteConfirmation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setBulkDeleteConfirmation(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "26px 28px",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <IconAlertTriangle size={24} color="#dc2626" />
            </div>

            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
              Delete Selected Products?
            </h3>

            <p style={{ margin: "0 0 20px 0", fontSize: "0.88rem", color: "#64748b", lineHeight: 1.5 }}>
              Are you sure you want to permanently delete all <strong style={{ color: "#0f172a" }}>{selectedIds.length}</strong> selected products from the catalogue?
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setBulkDeleteConfirmation(false)}
                style={{
                  padding: "10px 20px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBulkDelete}
                style={{
                  padding: "10px 22px",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  borderRadius: "8px",
                  border: "none",
                  background: "#e11d48",
                  color: "#ffffff",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(225, 29, 72, 0.3)",
                }}
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
