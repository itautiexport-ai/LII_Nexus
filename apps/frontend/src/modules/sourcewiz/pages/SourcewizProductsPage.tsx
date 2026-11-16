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

export const DEFAULT_SOURCEWIZ_PRODUCTS: CatalogProductItem[] = [
  {
    id: "12834",
    sku: "12834",
    name: "Cognac Leather Lounge Armchair",
    category: "Chairs",
    subCategory: "Lounge Chairs",
    collectionName: "Nordic Haven",
    material: "Top Grain Leather & Matte Steel",
    fobPriceUsd: 185.0,
    moq: 50,
    cbm: 0.42,
    dimensions: "82 x 78 x 76 cm",
    stockStatus: "In Stock",
    image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80"],
    createdAt: "2026-11-13T10:00:00.000Z",
  },
  {
    id: "12655",
    sku: "12655",
    name: "Solid Acacia Wood Credenza Sideboard",
    category: "Storage",
    subCategory: "Sideboards",
    collectionName: "Heritage Oak",
    material: "Kiln-Dried Solid Acacia Wood",
    fobPriceUsd: 340.0,
    moq: 30,
    cbm: 0.88,
    dimensions: "160 x 45 x 75 cm",
    stockStatus: "In Stock",
    image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80"],
    createdAt: "2026-11-09T14:30:00.000Z",
  },
  {
    id: "1309",
    sku: "1309",
    name: "Minimalist Beige Curved Dining Chair",
    category: "Chairs",
    subCategory: "Dining Chairs",
    collectionName: "Modern Minimal",
    material: "Textured Boucle & Solid Ash Wood",
    fobPriceUsd: 110.0,
    moq: 100,
    cbm: 0.28,
    dimensions: "58 x 56 x 78 cm",
    stockStatus: "In Stock",
    image: "https://images.unsplash.com/photo-1580481077195-c328a37db729?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1580481077195-c328a37db729?auto=format&fit=crop&w=800&q=80"],
    createdAt: "2026-11-05T09:15:00.000Z",
  },
  {
    id: "2702",
    sku: "2702",
    name: "Sculptural Grey Fabric Accent Armchair",
    category: "Chairs",
    subCategory: "Accent Chairs",
    collectionName: "Artisan Atelier",
    material: "Woven Melange & Solid Walnut",
    fobPriceUsd: 145.0,
    moq: 60,
    cbm: 0.35,
    dimensions: "64 x 62 x 75 cm",
    stockStatus: "In Stock",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
    images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80"],
    createdAt: "2026-11-05T08:45:00.000Z",
  },
];

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
  const [activeMainTab, setActiveMainTab] = useState<"all_products" | "categories">("all_products");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [subCategoryFilter, setSubCategoryFilter] = useState("All");
  const [collectionFilter, setCollectionFilter] = useState("All");
  const [materialFilter, setMaterialFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "id-asc" | "price-asc" | "price-desc">("recent");
  const [manageMode, setManageMode] = useState(false);
  const [isSmartSearchOpen, setIsSmartSearchOpen] = useState(false);
  const [smartSearchQuery, setSmartSearchQuery] = useState("");
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSubCategoryDropdownOpen, setIsSubCategoryDropdownOpen] = useState(false);
  const [isCollectionDropdownOpen, setIsCollectionDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");

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
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Purge default dummy mock items from user's storage
          const mockIds = new Set(["1", "2", "3", "4"]);
          const mockSkus = new Set(["SW-LII-DT-12557", "SW-LII-OC-04", "SW-LII-AC-09", "SW-LII-SB-12"]);
          const realUserProducts = parsed.filter(
            (p) => !mockIds.has(String(p.id)) && !mockSkus.has(String(p.sku))
          );
          if (realUserProducts.length > 0) {
            setProducts(realUserProducts);
            return;
          }
        }
      }
      setProducts(DEFAULT_SOURCEWIZ_PRODUCTS);
      localStorage.setItem("lii_product_catalogue_items", JSON.stringify(DEFAULT_SOURCEWIZ_PRODUCTS));
      localStorage.setItem("lii_product_catalog_items", JSON.stringify(DEFAULT_SOURCEWIZ_PRODUCTS));
    } catch (e) {
      console.error("Failed to load products from localStorage:", e);
      setProducts(DEFAULT_SOURCEWIZ_PRODUCTS);
    }
  }, []);

  const allCategories = React.useMemo(() => {
    const set = new Set(["All", "Chairs", "Tables", "Storage", "Sofas", "Outdoor", "Decor"]);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const allSubCategories = React.useMemo(() => {
    const set = new Set(["All", "Lounge Chairs", "Dining Chairs", "Accent Chairs", "Sideboards", "Coffee Tables", "Dining Tables"]);
    products.forEach((p) => {
      if (p.subCategory) set.add(p.subCategory);
    });
    return Array.from(set);
  }, [products]);

  const allCollections = React.useMemo(() => {
    const set = new Set(["All", "Nordic Haven", "Heritage Oak", "Modern Minimal", "Artisan Atelier", "Coastal Retreat"]);
    products.forEach((p) => {
      if (p.collectionName) set.add(p.collectionName);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = React.useMemo(() => {
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

  const displayedProducts = React.useMemo(() => {
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
    <div style={{ padding: "20px 32px 60px", maxWidth: "1440px", margin: "0 auto", fontFamily: "var(--sw-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)", color: "#111827" }}>
      {/* TOP HEADER BAR: STATUS PILL & USER AVATAR */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
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

      {/* NAVIGATION TABS: ALL PRODUCTS & CATEGORIES */}
      <div
        style={{
          display: "flex",
          gap: "28px",
          borderBottom: "1.5px solid #e5e7eb",
          marginBottom: "20px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveMainTab("all_products")}
          style={{
            background: "none",
            border: "none",
            padding: "10px 4px 14px",
            fontSize: "15px",
            fontWeight: activeMainTab === "all_products" ? 600 : 500,
            color: activeMainTab === "all_products" ? "#111827" : "#6b7280",
            cursor: "pointer",
            position: "relative",
          }}
        >
          All Products
          {activeMainTab === "all_products" && (
            <span
              style={{
                position: "absolute",
                bottom: "-1.5px",
                left: 0,
                right: 0,
                height: "2.5px",
                background: "#0f766e",
                borderRadius: "2px",
              }}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("categories")}
          style={{
            background: "none",
            border: "none",
            padding: "10px 4px 14px",
            fontSize: "15px",
            fontWeight: activeMainTab === "categories" ? 600 : 500,
            color: activeMainTab === "categories" ? "#111827" : "#6b7280",
            cursor: "pointer",
            position: "relative",
          }}
        >
          Categories
          {activeMainTab === "categories" && (
            <span
              style={{
                position: "absolute",
                bottom: "-1.5px",
                left: 0,
                right: 0,
                height: "2.5px",
                background: "#0f766e",
                borderRadius: "2px",
              }}
            />
          )}
        </button>
      </div>

      {activeMainTab === "all_products" ? (
        <>
          {/* CONTROL ROW 1: SEARCH, SMART SEARCH, ADD PRODUCT, MANAGE PRODUCTS */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
              marginBottom: "16px",
            }}
          >
            {/* Search capsule & Smart Search */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Search here"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "270px",
                    padding: "9px 36px 9px 18px",
                    borderRadius: "9999px",
                    border: "1.5px solid #e5e7eb",
                    fontSize: "13.5px",
                    outline: "none",
                    background: "#ffffff",
                    color: "#111827",
                    transition: "border-color 0.15s ease",
                  }}
                />
                <span style={{ position: "absolute", right: "13px", color: "#9ca3af", pointerEvents: "none", display: "flex" }}>
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
                  gap: "6px",
                  boxShadow: "0 1px 2px rgba(99, 102, 241, 0.08)",
                }}
              >
                <IconSparkles size={14} color="#4338ca" />
                <span>Smart Search</span>
              </button>
            </div>

            {/* Right Buttons: Add Product & Manage Products */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Link
                to="/admin/sourcewiz/product-form"
                style={{
                  background: "#f0fdfa",
                  border: "1.5px solid #2dd4bf",
                  color: "#0f766e",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  padding: "8px 20px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <span>Add Product</span>
              </Link>

              <button
                type="button"
                onClick={() => setManageMode(!manageMode)}
                style={{
                  background: manageMode ? "#0f766e" : "#115e59",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  padding: "8px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  boxShadow: "0 1px 3px rgba(17, 94, 89, 0.2)",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{manageMode ? "Exit Manage" : "Manage Products"}</span>
              </button>
            </div>
          </div>

          {/* CONTROL ROW 2: CATEGORY, SUB CATEGORY, COLLECTION, MORE FILTERS, RECENT FIRST */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            {/* Filter Dropdown Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {/* Category Pill */}
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
                    gap: "6px",
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

              {/* Sub Category Pill */}
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
                    gap: "6px",
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

              {/* Collection Name Pill */}
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
                    gap: "6px",
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                  gap: "6px",
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
                    gap: "6px",
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

          {/* MORE FILTERS DRAWER / PANEL */}
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

          {/* SHOWING COUNTER */}
          <div style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500, marginBottom: "18px" }}>
            Showing 1-{displayedProducts.length} of {products.length > 4 ? products.length : "2085"} Products
          </div>

          {/* PRODUCT CARDS 4-COLUMN GRID */}
          {displayedProducts.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                background: "#f9fafb",
                borderRadius: "14px",
                border: "1px dashed #d1d5db",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🪑</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: "0 0 6px 0" }}>
                No Products Match Your Criteria
              </h3>
              <p style={{ color: "#6b7280", fontSize: "0.88rem", maxWidth: "420px", margin: "0 auto 18px" }}>
                Try adjusting your search query, clearing filters, or adding a new product to your catalogue.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("All");
                  setSubCategoryFilter("All");
                  setCollectionFilter("All");
                  setMaterialFilter("All");
                  setStockFilter("All");
                }}
                style={{
                  background: "#0f766e",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "20px",
              }}
            >
              {displayedProducts.map((product) => {
                const isSelected = selectedIds.includes(product.id);
                return (
                  <div
                    key={product.id}
                    style={{
                      background: "#ffffff",
                      border: isSelected ? "1.5px solid #0f766e" : "1px solid #e5e7eb",
                      borderRadius: "14px",
                      padding: "16px",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: isSelected ? "0 4px 14px rgba(15, 118, 110, 0.12)" : "0 1px 3px rgba(0,0,0,0.02)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => {
                      if (manageMode) {
                        handleSelectProduct(product.id);
                      } else {
                        navigate(`/admin/sourcewiz/products/${product.sku || product.id}`);
                      }
                    }}
                  >
                    {/* Checkbox (visible in manage mode or when selected) */}
                    {(manageMode || isSelected) && (
                      <div
                        style={{
                          position: "absolute",
                          top: 14,
                          left: 14,
                          zIndex: 2,
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: isSelected ? "#0f766e" : "#ffffff",
                          border: isSelected ? "2px solid #0f766e" : "2px solid #cbd5e1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProduct(product.id);
                        }}
                      >
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    )}

                    {/* Quick action buttons on card top-right (Edit / PPT preview / Delete) */}
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        display: "flex",
                        gap: "6px",
                        zIndex: 2,
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!selectedIds.includes(product.id)) {
                            setSelectedIds([...selectedIds, product.id]);
                          }
                          setIsPptModalOpen(true);
                        }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.9)",
                          border: "1px solid #e5e7eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#475569",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        }}
                        title="Preview in presentation deck"
                      >
                        <IconEye size={13} color="#475569" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProduct(product.id);
                        }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.9)",
                          border: "1px solid #e5e7eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#0284c7",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        }}
                        title="Edit product"
                      >
                        <IconEdit size={13} color="#0284c7" />
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product.id, product.name);
                          }}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.9)",
                            border: "1px solid #fecdd3",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#e11d48",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                          }}
                          title="Delete product"
                        >
                          <IconTrash size={13} color="#e11d48" />
                        </button>
                      )}
                    </div>

                    {/* Centered Image Box */}
                    <div
                      style={{
                        height: "220px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "8px",
                        overflow: "hidden",
                        borderRadius: "8px",
                        background: "#ffffff",
                      }}
                    >
                      <img
                        src={product.images?.[0] || product.image || FALLBACK_IMG}
                        alt={product.name || `Product ${product.sku || product.id}`}
                        style={{
                          maxHeight: "100%",
                          maxWidth: "100%",
                          objectFit: "contain",
                          transition: "transform 0.25s ease",
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_IMG;
                        }}
                      />
                    </div>

                    {/* Bottom Metadata Info */}
                    <div style={{ marginTop: "14px", borderTop: "1px solid #f3f4f6", paddingTop: "12px" }}>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
                        ID : {product.sku || product.id}
                      </div>
                      <div style={{ fontSize: "12.5px", color: "#6b7280", marginTop: "4px" }}>
                        Added on {formatProductDate(product.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* CATEGORIES TAB VIEW */
        <div>
          <div style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500, marginBottom: "20px" }}>
            Explore products organized by collection and category
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {[
              {
                name: "Chairs",
                desc: "Lounge armchairs, accent chairs & dining seating",
                count: products.filter((p) => (p.category || "").toLowerCase() === "chairs").length || 3,
                img: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80",
              },
              {
                name: "Storage",
                desc: "Solid wood sideboards, buffets & cabinets",
                count: products.filter((p) => (p.category || "").toLowerCase() === "storage").length || 1,
                img: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80",
              },
              {
                name: "Tables",
                desc: "Dining tables, coffee tables & console accents",
                count: products.filter((p) => (p.category || "").toLowerCase() === "tables").length || 0,
                img: "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=600&q=80",
              },
              {
                name: "Sofas",
                desc: "Modular sectionals, loveseats & upholstered daybeds",
                count: products.filter((p) => (p.category || "").toLowerCase() === "sofas").length || 0,
                img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80",
              },
              {
                name: "Outdoor",
                desc: "Weather-resistant teak, rope & powder-coated sets",
                count: products.filter((p) => (p.category || "").toLowerCase() === "outdoor").length || 0,
                img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
              },
              {
                name: "Decor",
                desc: "Architectural lighting, mirrors & ceramic accents",
                count: products.filter((p) => (p.category || "").toLowerCase() === "decor").length || 0,
                img: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
              },
            ].map((cat) => (
              <div
                key={cat.name}
                onClick={() => {
                  setCategoryFilter(cat.name);
                  setActiveMainTab("all_products");
                }}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "14px",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ height: "180px", overflow: "hidden", background: "#f8fafc" }}>
                  <img
                    src={cat.img}
                    alt={cat.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: 0 }}>
                      {cat.name}
                    </h3>
                    <span
                      style={{
                        background: "#f0fdfa",
                        color: "#0f766e",
                        fontWeight: 600,
                        fontSize: "12px",
                        padding: "3px 10px",
                        borderRadius: "9999px",
                      }}
                    >
                      {cat.count} items
                    </span>
                  </div>
                  <p style={{ fontSize: "12.5px", color: "#6b7280", margin: "6px 0 0 0" }}>
                    {cat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FLOATING ACTION DOCK (AVAILABLE IN MANAGE MODE OR WHEN PRODUCTS ARE SELECTED) */}
      {(manageMode || selectedIds.length > 0) && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            background: "#090d16",
            borderRadius: "14px",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.12)",
            maxWidth: "94vw",
            flexWrap: "wrap",
          }}
        >
          {/* Left: Count & Select All */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
              {selectedIds.length}
            </span>
            <div style={{ color: "#ffffff", fontSize: "13.5px", fontWeight: 600 }}>
              {selectedIds.length} Item{selectedIds.length !== 1 ? "s" : ""} Selected
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
              {selectedIds.length === displayedProducts.length && displayedProducts.length > 0 ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.15)" }} />

          {/* Right: Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setIsFieldsModalOpen(true)}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#93c5fd",
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <IconSliders size={13} color="#93c5fd" />
              <span>Details ({activeFieldsCount}/15)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPptModalOpen(true)}
              disabled={selectedIds.length === 0}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#e2e8f0",
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                opacity: selectedIds.length === 0 ? 0.5 : 1,
              }}
            >
              <IconPalette size={13} color="#e2e8f0" />
              <span>Theme & Preview</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={selectedIds.length === 0}
              style={{
                background: "rgba(16, 185, 129, 0.16)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                color: "#6ee7b7",
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                opacity: selectedIds.length === 0 ? 0.5 : 1,
              }}
            >
              <IconFileSpreadsheet size={13} color="#6ee7b7" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateShareLink}
              disabled={selectedIds.length === 0 || isGeneratingLink}
              style={{
                background: "rgba(168, 85, 247, 0.16)",
                border: "1px solid rgba(168, 85, 247, 0.35)",
                color: "#d8b4fe",
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: selectedIds.length === 0 || isGeneratingLink ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                opacity: selectedIds.length === 0 ? 0.5 : 1,
              }}
            >
              <IconShare size={13} color="#d8b4fe" />
              <span>{isGeneratingLink ? "Creating..." : "Share Link"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadPptx()}
              disabled={selectedIds.length === 0 || isExportingPpt}
              style={{
                background: "#0f766e",
                border: "none",
                color: "#ffffff",
                padding: "7px 16px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: selectedIds.length === 0 || isExportingPpt ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                opacity: selectedIds.length === 0 ? 0.5 : 1,
              }}
            >
              <IconDownload size={13} color="#ffffff" />
              <span>{isExportingPpt ? exportProgressMsg || "Generating..." : `Download PPT (${selectedIds.length})`}</span>
            </button>

            {isAdmin && selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setBulkDeleteConfirmation(true)}
                style={{
                  background: "rgba(225, 29, 72, 0.16)",
                  border: "1px solid rgba(225, 29, 72, 0.4)",
                  color: "#fecdd3",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <IconTrash size={13} color="#fecdd3" />
                <span>Delete ({selectedIds.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setManageMode(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontSize: "12px",
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              Done
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
            padding: "20px",
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
              Describe what you are looking for in natural language (e.g. materials, design style, price point, or function).
            </p>

            <div style={{ position: "relative", marginBottom: "16px" }}>
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

            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
                Suggested Prompts
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[
                  "Cognac leather armchairs",
                  "Solid acacia wood sideboard",
                  "Curved beige dining chair",
                  "Grey accent armchair",
                  "Chairs under $150",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setSmartSearchQuery(prompt);
                      setSearchQuery(prompt);
                      setIsSmartSearchOpen(false);
                    }}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      borderRadius: "9999px",
                      padding: "5px 12px",
                      fontSize: "12px",
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
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
