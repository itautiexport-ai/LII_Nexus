import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { costingApi, CostingRequestItem, FURNITURE_PRODUCT_TYPES, parseItemImageUrls } from "../api/costingApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";

const TARGET_CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  AUD: "A$",
  CAD: "C$",
};

interface MerchantFolder {
  folderKey: string;
  userId?: string;
  merchantName: string;
  items: CostingRequestItem[];
  totalProducts: number;
  approvedProducts: number;
  reviewProducts: number;
  inProgressProducts: number;
  notStartedProducts: number;
  rejectedProducts: number;
  approvedInrTotal: number;
  approvedUsdTotal: number;
  lastUpdatedAt?: string;
}

export default function CostingRequestsBunchesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const [allItems, setAllItems] = useState<CostingRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Folder navigation state: null = Root (All Merchant Folders), string = Inside a Merchant's Folder
  const merchantInUrl = searchParams.get("merchant") || null;
  const [selectedFolderKey, setSelectedFolderKey] = useState<string | null>(merchantInUrl);

  // Filters
  const [folderSearch, setFolderSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [galleryModal, setGalleryModal] = useState<{ title: string; urls: string[]; index: number } | null>(null);

  // Edit Request Modal State (inside Merchant Folder)
  const [editingItem, setEditingItem] = useState<CostingRequestItem | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    product_name: "",
    costing_code: "",
    buyer_code: "",
    client_name: "",
    product_type: "",
    wood_type: "",
    overall_size: "",
    collection_name: "",
    sample_availability: "Not Available",
    priority: "Normal" as "Normal" | "High" | "Urgent",
    target_price: "",
    target_currency: "USD",
    description: "",
  });

  const openEditModal = (it: CostingRequestItem) => {
    setEditingItem(it);
    setEditForm({
      product_name: it.product_name || "",
      costing_code: it.costing_code || it.product_code || "",
      buyer_code: it.buyer_code || "",
      client_name: it.client_name || "",
      product_type: it.product_type || "",
      wood_type: it.wood_type || "",
      overall_size: it.overall_size || "",
      collection_name: it.collection_name || "",
      sample_availability: it.sample_availability || "Not Available",
      priority: it.priority || "Normal",
      target_price: it.target_price !== undefined && it.target_price !== null ? String(it.target_price) : "",
      target_currency: it.target_currency || "USD",
      description: it.description || "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editForm.product_name.trim()) {
      alert("Product Name is required.");
      return;
    }
    setEditSaving(true);
    try {
      await costingApi.updateRequestItemDetails(editingItem.id, {
        product_name: editForm.product_name.trim(),
        costing_code: editForm.costing_code.trim() || undefined,
        buyer_code: editForm.buyer_code.trim(),
        client_name: editForm.client_name.trim() || undefined,
        product_type: editForm.product_type.trim() || undefined,
        wood_type: editForm.wood_type.trim() || undefined,
        overall_size: editForm.overall_size.trim() || undefined,
        collection_name: editForm.collection_name.trim() || undefined,
        sample_availability: editForm.sample_availability || "Not Available",
        priority: editForm.priority,
        target_price: editForm.target_price.trim() !== "" ? Number(editForm.target_price) : null,
        target_currency: editForm.target_currency || "USD",
        description: editForm.description.trim() || undefined,
      });
      setEditingItem(null);
      await loadAllItems();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || "Failed to update costing request.");
    } finally {
      setEditSaving(false);
    }
  };

  useEffect(() => {
    loadAllItems();
  }, []);

  useEffect(() => {
    if (merchantInUrl !== selectedFolderKey) {
      setSelectedFolderKey(merchantInUrl);
    }
  }, [merchantInUrl]);

  const loadAllItems = async () => {
    setLoading(true);
    try {
      const data = await costingApi.getRequestItems();
      setAllItems(data || []);
    } catch (err) {
      console.error("Failed to load merchant costing records:", err);
    } finally {
      setLoading(false);
    }
  };

  // Group ALL costing request items by User ID (created_by) / Merchant Name into ONE permanent folder per user
  const merchantFolders = useMemo<MerchantFolder[]>(() => {
    const map: Record<string, MerchantFolder> = {};

    allItems.forEach((item) => {
      const displayName = (item.merchant_name || "Unassigned").trim();
      const key = item.created_by ? `uid:${item.created_by}` : `name:${displayName.toLowerCase()}`;

      if (!map[key]) {
        map[key] = {
          folderKey: key,
          userId: item.created_by || undefined,
          merchantName: displayName,
          items: [],
          totalProducts: 0,
          approvedProducts: 0,
          reviewProducts: 0,
          inProgressProducts: 0,
          notStartedProducts: 0,
          rejectedProducts: 0,
          approvedInrTotal: 0,
          approvedUsdTotal: 0,
          lastUpdatedAt: item.created_at,
        };
      }

      const folder = map[key];
      folder.items.push(item);
      folder.totalProducts += 1;

      if (item.created_at && (!folder.lastUpdatedAt || new Date(item.created_at) > new Date(folder.lastUpdatedAt))) {
        folder.lastUpdatedAt = item.created_at;
        // Keep the latest display name if user updated it
        if (displayName && displayName !== "Unassigned") {
          folder.merchantName = displayName;
        }
      }

      if (item.stage === "Approved") {
        folder.approvedProducts += 1;
        if (item.final_price) {
          folder.approvedInrTotal += Number(item.final_price);
          folder.approvedUsdTotal += item.final_price_usd
            ? Number(item.final_price_usd)
            : Number(item.final_price) / 86.5;
        }
      } else if (item.stage === "In Review") {
        folder.reviewProducts += 1;
      } else if (item.stage === "In Progress") {
        folder.inProgressProducts += 1;
      } else if (item.stage === "Rejected") {
        folder.rejectedProducts += 1;
      } else {
        folder.notStartedProducts += 1;
      }
    });

    return Object.values(map).sort((a, b) => {
      const tA = a.lastUpdatedAt ? new Date(a.lastUpdatedAt).getTime() : 0;
      const tB = b.lastUpdatedAt ? new Date(b.lastUpdatedAt).getTime() : 0;
      return tB - tA;
    });
  }, [allItems]);

  const handleOpenFolder = (folder: MerchantFolder) => {
    setSelectedFolderKey(folder.merchantName);
    setItemSearch("");
    setStageFilter("ALL");
    setSearchParams({ merchant: folder.merchantName });
  };

  const handleBackToFolders = () => {
    setSelectedFolderKey(null);
    setSearchParams({});
  };

  const filteredFolders = useMemo(() => {
    if (!folderSearch.trim()) return merchantFolders;
    const q = folderSearch.trim().toLowerCase();
    return merchantFolders.filter((f) => f.merchantName.toLowerCase().includes(q));
  }, [merchantFolders, folderSearch]);

  const activeFolder = useMemo(() => {
    if (!selectedFolderKey) return null;
    const target = selectedFolderKey.trim().toLowerCase();
    return (
      merchantFolders.find(
        (f) =>
          f.folderKey.toLowerCase() === target ||
          f.merchantName.toLowerCase() === target ||
          (f.userId && f.userId.toLowerCase() === target)
      ) || null
    );
  }, [merchantFolders, selectedFolderKey]);

  const activeFolderItems = useMemo(() => {
    if (!activeFolder) return [];
    return activeFolder.items.filter((it) => {
      if (stageFilter !== "ALL" && it.stage !== stageFilter) return false;
      if (itemSearch.trim()) {
        const q = itemSearch.trim().toLowerCase();
        const match =
          (it.costing_code || "").toLowerCase().includes(q) ||
          (it.buyer_code || "").toLowerCase().includes(q) ||
          (it.product_name || "").toLowerCase().includes(q) ||
          (it.client_name || "").toLowerCase().includes(q) ||
          (it.product_type || "").toLowerCase().includes(q) ||
          (it.wood_type || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [activeFolder, stageFilter, itemSearch]);

  const isCurrentUserFolder = (folder: MerchantFolder) => {
    if (!user) return false;
    if (folder.userId && user.id && folder.userId === user.id) return true;
    if (user.fullName && folder.merchantName.trim().toLowerCase() === user.fullName.trim().toLowerCase()) return true;
    return false;
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case "Approved":
        return <span style={{ padding: "4px 10px", borderRadius: 12, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700 }}>✅ Approved</span>;
      case "In Review":
        return <span style={{ padding: "4px 10px", borderRadius: 12, background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 700 }}>⏳ Under Review</span>;
      case "In Progress":
        return <span style={{ padding: "4px 10px", borderRadius: 12, background: "#e0f2fe", color: "#0369a1", fontSize: 12, fontWeight: 700 }}>🛠️ In Progress</span>;
      case "Rejected":
        return <span style={{ padding: "4px 10px", borderRadius: 12, background: "#fee2e2", color: "#991b1b", fontSize: 12, fontWeight: 700 }}>❌ Rejected</span>;
      default:
        return <span style={{ padding: "4px 10px", borderRadius: 12, background: "#f1f5f9", color: "#64748b", fontSize: 12, fontWeight: 700 }}>⏳ Not Started</span>;
    }
  };

  const getPriorityBadge = (p?: string) => {
    switch (p) {
      case "Urgent":
        return <span style={{ padding: "3px 8px", borderRadius: 4, background: "#fee2e2", color: "#991b1b", fontSize: 11, fontWeight: 700 }}>🔴 Urgent</span>;
      case "High":
        return <span style={{ padding: "3px 8px", borderRadius: 4, background: "#ffedd5", color: "#c2410c", fontSize: 11, fontWeight: 700 }}>🟠 High</span>;
      default:
        return <span style={{ padding: "3px 8px", borderRadius: 4, background: "#f0fdf4", color: "#166534", fontSize: 11, fontWeight: 700 }}>🟢 Normal</span>;
    }
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto", color: "#1f2937", fontFamily: "inherit" }}>
      {/* Top Header & Breadcrumb */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", marginBottom: 6 }}>
            <span
              onClick={handleBackToFolders}
              style={{ cursor: "pointer", color: activeFolder ? "#2563eb" : "#1e293b", fontWeight: 700 }}
            >
              📁 Merchant Folders
            </span>
            {activeFolder && (
              <>
                <span>/</span>
                <span style={{ color: "#1e293b", fontWeight: 700 }}>
                  📂 {activeFolder.merchantName}
                </span>
              </>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>{activeFolder ? "📂" : "🗂️"}</span>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#111827" }}>
                {activeFolder ? `${activeFolder.merchantName}` : "Merchant Folders"}
              </h1>
              <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "#6b7280" }}>
                {activeFolder
                  ? `All costing requests submitted by ${activeFolder.merchantName} across all dates.`
                  : "Each user has a dedicated folder containing all costing requests they submit."}
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {activeFolder && (
            <button
              type="button"
              onClick={handleBackToFolders}
              style={{
                padding: "8px 16px",
                background: "#f1f5f9",
                color: "#334155",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>← Back to All Folders</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#6b7280", background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb" }}>
          Loading merchant folders...
        </div>
      ) : merchantFolders.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: "#6b7280", background: "#ffffff", borderRadius: 8, border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1f2937" }}>No Merchant Folders Found</div>
          <p style={{ margin: "6px 0 18px 0", fontSize: 14, color: "#6b7280" }}>
            No costing requests have been submitted yet. Submitting a request automatically creates a folder under the user's name.
          </p>
          <button
            onClick={() => navigate("/admin/costing/request-center")}
            style={{
              padding: "10px 20px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            + Create First Costing Request
          </button>
        </div>
      ) : !activeFolder ? (
        /* ========================================================================= */
        /* ROOT VIEW: MERCHANT FOLDERS DIRECTORY GRID (1 FOLDER PER USER)            */
        /* ========================================================================= */
        <div>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "14px 18px",
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 400 }}>
              <span style={{ fontSize: 16 }}>🔍</span>
              <input
                type="text"
                placeholder="Search merchant folders by name..."
                value={folderSearch}
                onChange={(e) => setFolderSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  outline: "none",
                }}
              />
              {folderSearch && (
                <button
                  type="button"
                  onClick={() => setFolderSearch("")}
                  style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                >
                  Clear
                </button>
              )}
            </div>

            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
              Total Folders: <strong style={{ color: "#0f172a" }}>{filteredFolders.length}</strong>
            </div>
          </div>

          {/* FOLDERS GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 20,
            }}
          >
            {filteredFolders.map((folder) => {
              const isMine = isCurrentUserFolder(folder);
              return (
                <div
                  key={folder.folderKey}
                  onClick={() => handleOpenFolder(folder)}
                  style={{
                    background: isMine ? "#fdfcff" : "#ffffff",
                    border: isMine ? "2px solid #818cf8" : "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "20px 22px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.08)";
                    e.currentTarget.style.borderColor = "#3b82f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.04)";
                    e.currentTarget.style.borderColor = isMine ? "#818cf8" : "#e2e8f0";
                  }}
                >
                  <div>
                    {/* Folder Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 10,
                            background: isMine ? "#ede9fe" : "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 26,
                          }}
                        >
                          📁
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                            {folder.merchantName}
                          </h3>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 500 }}>
                            {folder.totalProducts} {folder.totalProducts === 1 ? "Costing Request" : "Costing Requests"}
                          </div>
                        </div>
                      </div>

                      {isMine && (
                        <span
                          style={{
                            background: "#ede9fe",
                            color: "#6d28d9",
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: 12,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          ⭐ My Folder
                        </span>
                      )}
                    </div>

                    {/* Progress Pills */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "14px 0" }}>
                      {folder.approvedProducts > 0 && (
                        <span style={{ background: "#dcfce7", color: "#166534", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>
                          ✅ {folder.approvedProducts} Approved
                        </span>
                      )}
                      {folder.reviewProducts > 0 && (
                        <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>
                          ⏳ {folder.reviewProducts} In Review
                        </span>
                      )}
                      {folder.inProgressProducts > 0 && (
                        <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>
                          🛠️ {folder.inProgressProducts} In Progress
                        </span>
                      )}
                      {folder.notStartedProducts > 0 && (
                        <span style={{ background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6 }}>
                          ⏸️ {folder.notStartedProducts} Not Started
                        </span>
                      )}
                      {folder.rejectedProducts > 0 && (
                        <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>
                          ❌ {folder.rejectedProducts} Rejected
                        </span>
                      )}
                    </div>

                    {folder.approvedInrTotal > 0 && (
                      <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginBottom: 12, background: "#f0fdf4", padding: "6px 10px", borderRadius: 6 }}>
                        Approved Total: ${folder.approvedUsdTotal.toFixed(2)} (₹{folder.approvedInrTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                      </div>
                    )}
                  </div>

                  {/* Folder Footer */}
                  <div
                    style={{
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                      {folder.lastUpdatedAt ? `Last Request: ${new Date(folder.lastUpdatedAt).toLocaleDateString()}` : ""}
                    </span>
                    <span style={{ color: "#2563eb", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                      Open Folder ➔
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* INSIDE MERCHANT FOLDER: ALL COSTING REQUESTS BY THIS USER (ALL DATES)     */
        /* ========================================================================= */
        <div>
          {/* Quick Folder Switcher Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, overflowX: "auto", paddingBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              Switch Folder:
            </span>
            {merchantFolders.map((mf) => {
              const isSelected = activeFolder.folderKey === mf.folderKey;
              return (
                <button
                  key={mf.folderKey}
                  type="button"
                  onClick={() => handleOpenFolder(mf)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 20,
                    border: isSelected ? "2px solid #2563eb" : "1px solid #cbd5e1",
                    background: isSelected ? "#eff6ff" : "#ffffff",
                    color: isSelected ? "#1d4ed8" : "#475569",
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: 12,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{isSelected ? "📂" : "📁"}</span>
                  <span>{mf.merchantName}</span>
                  <span style={{ background: isSelected ? "#2563eb" : "#e2e8f0", color: isSelected ? "#ffffff" : "#475569", borderRadius: 10, padding: "1px 6px", fontSize: 10 }}>
                    {mf.totalProducts}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Folder Content Box */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            {/* Folder Header Banner */}
            <div
              style={{
                padding: "18px 24px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>📂</span>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                    {activeFolder.merchantName}
                  </h2>
                  {isCurrentUserFolder(activeFolder) && (
                    <span style={{ background: "#ede9fe", color: "#6d28d9", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 10 }}>
                      ⭐ My Folder
                    </span>
                  )}
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    • <strong>{activeFolder.totalProducts}</strong> Total Costing Requests
                  </span>
                </div>

                <div style={{ display: "flex", gap: 14, fontSize: 12, marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>
                    ✅ Approved: {activeFolder.approvedProducts}
                  </span>
                  <span style={{ color: "#d97706", fontWeight: 700 }}>
                    ⏳ Under Review: {activeFolder.reviewProducts}
                  </span>
                  <span style={{ color: "#2563eb", fontWeight: 700 }}>
                    🛠️ In Progress: {activeFolder.inProgressProducts}
                  </span>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>
                    ⏸️ Not Started: {activeFolder.notStartedProducts}
                  </span>
                  {activeFolder.approvedInrTotal > 0 && (
                    <span style={{ color: "#15803d", fontWeight: 800 }}>
                      | Approved Total: ${activeFolder.approvedUsdTotal.toFixed(2)} (₹{activeFolder.approvedInrTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                    </span>
                  )}
                </div>
              </div>

              {/* Search & Stage Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Search costing code, buyer code, product..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  style={{
                    padding: "7px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 13,
                    outline: "none",
                    width: 260,
                  }}
                />

                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, fontWeight: 600 }}
                >
                  <option value="ALL">All Stages</option>
                  <option value="Pending">⏳ Not Started</option>
                  <option value="In Progress">🛠️ In Progress</option>
                  <option value="In Review">⏳ Under Review</option>
                  <option value="Approved">✅ Approved</option>
                  <option value="Rejected">❌ Rejected</option>
                </select>

                {(itemSearch || stageFilter !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setItemSearch("");
                      setStageFilter("ALL");
                    }}
                    style={{ background: "none", border: "none", color: "#2563eb", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* ALL REQUESTS TABLE INSIDE THIS MERCHANT FOLDER */}
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table data-no-enhance="true" style={{ width: "100%", minWidth: 1220, borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                    <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Costing Code</th>
                    <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Buyer Code</th>
                    <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Product Info</th>
                    <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Client / Buyer</th>
                    <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Target Price</th>
                    <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Requested Date</th>
                    <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Priority</th>
                    <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Status</th>
                    <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Approved Price</th>
                    <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700, textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeFolderItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                        No costing requests found in {activeFolder.merchantName}'s folder.
                      </td>
                    </tr>
                  ) : (
                    activeFolderItems.map((it, idx) => (
                      <tr
                        key={it.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: idx % 2 === 0 ? "#ffffff" : "#fbfcfe",
                        }}
                      >
                        {/* Costing Code */}
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 6,
                              background: "#dcfce7",
                              color: "#166534",
                              fontWeight: 800,
                              fontSize: 13,
                            }}
                          >
                            {it.costing_code || it.product_code || "—"}
                          </span>
                        </td>

                        {/* Buyer Code */}
                        <td style={{ padding: "12px 16px" }}>
                          {it.buyer_code ? (
                            <span
                              style={{
                                padding: "3px 8px",
                                borderRadius: 4,
                                background: "#ede9fe",
                                color: "#6d28d9",
                                fontWeight: 700,
                                fontSize: 12,
                              }}
                            >
                              {it.buyer_code}
                            </span>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>—</span>
                          )}
                        </td>

                        {/* Product Info */}
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {(() => {
                              const photos = parseItemImageUrls(it);
                              if (photos.length === 0) {
                                return (
                                  <div
                                    style={{
                                      width: 42,
                                      height: 42,
                                      borderRadius: 6,
                                      background: "#f1f5f9",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 18,
                                    }}
                                  >
                                    🪑
                                  </div>
                                );
                              }
                              return (
                                <div
                                  onClick={() => setGalleryModal({ title: it.product_name, urls: photos, index: 0 })}
                                  style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}
                                  title={photos.length > 1 ? `Click to view all ${photos.length} photos` : "Click to enlarge"}
                                >
                                  <img
                                    src={photos[0]}
                                    alt=""
                                    style={{ width: 42, height: 42, objectFit: "cover", borderRadius: 6, border: "1px solid #e2e8f0" }}
                                    onError={(e) => ((e.target as any).style.display = "none")}
                                  />
                                  {photos.length > 1 && (
                                    <span
                                      style={{
                                        position: "absolute",
                                        bottom: -4,
                                        right: -4,
                                        background: "#2563eb",
                                        color: "#ffffff",
                                        fontSize: 9,
                                        fontWeight: 800,
                                        padding: "1px 5px",
                                        borderRadius: 8,
                                      }}
                                    >
                                      +{photos.length - 1}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                            <div>
                              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                                {it.product_name}
                              </div>
                              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                                {[it.product_type, it.wood_type].filter(Boolean).join(" • ") || "—"}
                              </div>
                              {it.overall_size && (
                                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                                  Size: {it.overall_size}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Client / Buyer */}
                        <td style={{ padding: "12px 16px", color: "#334155", fontWeight: 600 }}>
                          {it.client_name || "—"}
                        </td>

                        {/* Target Price */}
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                          {it.target_price !== undefined && it.target_price !== null && Number(it.target_price) > 0 ? (
                            <span
                              style={{
                                padding: "4px 9px",
                                borderRadius: 6,
                                background: "#fffbeb",
                                border: "1px solid #fde68a",
                                color: "#b45309",
                                fontWeight: 800,
                                fontSize: 13,
                                display: "inline-block",
                              }}
                            >
                              {TARGET_CURRENCY_SYMBOLS[(it.target_currency || "USD").toUpperCase()] || `${it.target_currency || "USD"} `}
                              {Number(it.target_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>—</span>
                          )}
                        </td>

                        {/* Requested Date */}
                        <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>
                          {it.created_at ? new Date(it.created_at).toLocaleDateString() : "—"}
                          <span style={{ display: "block", fontSize: 11, color: "#94a3b8" }}>
                            {it.created_at ? new Date(it.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </td>

                        {/* Priority */}
                        <td style={{ padding: "12px 16px" }}>
                          {getPriorityBadge(it.priority)}
                        </td>

                        {/* Stage / Status */}
                        <td style={{ padding: "12px 16px" }}>
                          {getStageBadge(it.stage)}
                        </td>

                        {/* Approved Price (Latest Buyer Quote if mentioned, else Approved USD & INR) */}
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                          {it.stage === "Approved" ? (
                            it.latest_buyer_quote && it.latest_buyer_quote.amount > 0 ? (
                              (() => {
                                const q = it.latest_buyer_quote!;
                                const rate = q.usd_rate && q.usd_rate > 0 ? q.usd_rate : 86.5;
                                const symMap: Record<string, string> = {
                                  USD: "$",
                                  INR: "₹",
                                  EUR: "€",
                                  GBP: "£",
                                  AED: "AED ",
                                  AUD: "A$",
                                  CAD: "C$",
                                };
                                const sym = symMap[q.currency] || `${q.currency} `;
                                const inrVal = q.currency === "INR" ? q.amount : q.currency === "USD" ? q.amount * rate : null;
                                const usdVal = q.currency === "USD" ? q.amount : q.currency === "INR" ? q.amount / rate : null;
                                return (
                                  <div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>
                                      {sym}{q.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    {q.currency === "USD" && inrVal !== null && (
                                      <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginTop: 2 }}>
                                        ₹{inrVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </div>
                                    )}
                                    {q.currency === "INR" && usdVal !== null && (
                                      <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginTop: 2 }}>
                                        ${usdVal.toFixed(2)}
                                      </div>
                                    )}
                                    <div style={{ fontSize: 10, color: "#6d28d9", fontWeight: 700, marginTop: 2 }}>
                                      {q.label}
                                    </div>
                                  </div>
                                );
                              })()
                            ) : it.final_price ? (
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>
                                  ${(it.final_price_usd ? Number(it.final_price_usd) : Number(it.final_price) / 86.5).toFixed(2)}
                                </div>
                                <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginTop: 2 }}>
                                  ₹{Number(it.final_price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>—</span>
                            )
                          ) : (
                            <span style={{ color: "#94a3b8" }}>—</span>
                          )}
                        </td>

                        {/* Edit Request Action */}
                        <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(it)}
                            style={{
                              padding: "6px 12px",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #93c5fd",
                              borderRadius: 6,
                              fontWeight: 700,
                              fontSize: 12,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Costing Request Modal */}
      {editingItem && (
        <div
          onClick={() => !editSaving && setEditingItem(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 700,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                ✏️ Edit Costing Request
              </h3>
              <button
                type="button"
                onClick={() => !editSaving && setEditingItem(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    Product Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.product_name}
                    onChange={(e) => setEditForm((p) => ({ ...p, product_name: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    Costing Code
                  </label>
                  <input
                    type="text"
                    value={editForm.costing_code}
                    onChange={(e) => setEditForm((p) => ({ ...p, costing_code: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    Buyer Code
                  </label>
                  <input
                    type="text"
                    value={editForm.buyer_code}
                    onChange={(e) => setEditForm((p) => ({ ...p, buyer_code: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    Client / Buyer Name
                  </label>
                  <input
                    type="text"
                    value={editForm.client_name}
                    onChange={(e) => setEditForm((p) => ({ ...p, client_name: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    Buyer Target Price <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <select
                      value={editForm.target_currency}
                      onChange={(e) => setEditForm((p) => ({ ...p, target_currency: e.target.value }))}
                      style={{ width: 84, padding: "8px 6px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, fontWeight: 700, background: "#f8fafc" }}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="AED">AED</option>
                      <option value="AUD">AUD</option>
                      <option value="CAD">CAD</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Target Price"
                      value={editForm.target_price}
                      onChange={(e) => setEditForm((p) => ({ ...p, target_price: e.target.value }))}
                      style={{ flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 6, border: "1.5px solid #f59e0b", background: "#fffbeb", fontSize: 13, fontWeight: 700 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    Product Type
                  </label>
                  <select
                    value={editForm.product_type}
                    onChange={(e) => setEditForm((p) => ({ ...p, product_type: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                  >
                    <option value="">-- Select Product Type --</option>
                    {FURNITURE_PRODUCT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    Wood Type
                  </label>
                  <input
                    type="text"
                    value={editForm.wood_type}
                    onChange={(e) => setEditForm((p) => ({ ...p, wood_type: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    Overall Size / Dimensions
                  </label>
                  <input
                    type="text"
                    value={editForm.overall_size}
                    onChange={(e) => setEditForm((p) => ({ ...p, overall_size: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    Collection Name
                  </label>
                  <input
                    type="text"
                    value={editForm.collection_name}
                    onChange={(e) => setEditForm((p) => ({ ...p, collection_name: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    Sample Status
                  </label>
                  <select
                    value={editForm.sample_availability}
                    onChange={(e) => setEditForm((p) => ({ ...p, sample_availability: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                  >
                    <option value="Not Available">Not Available</option>
                    <option value="Sample Available">Sample Available</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    Priority
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm((p) => ({ ...p, priority: e.target.value as any }))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                  >
                    <option value="Normal">🟢 Normal</option>
                    <option value="High">🟠 High</option>
                    <option value="Urgent">🔴 Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                  Specifications / Notes
                </label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  disabled={editSaving}
                  onClick={() => setEditingItem(null)}
                  style={{ padding: "8px 16px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  style={{ padding: "8px 20px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: 6, fontWeight: 700, cursor: editSaving ? "not-allowed" : "pointer" }}
                >
                  {editSaving ? "Updating..." : "Save & Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Angle Photo Gallery Modal */}
      {galleryModal && (
        <div
          onClick={() => setGalleryModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.72)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 20,
              maxWidth: 680,
              width: "100%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>
                {galleryModal.title} ({galleryModal.index + 1} / {galleryModal.urls.length})
              </div>
              <button
                type="button"
                onClick={() => setGalleryModal(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 700 }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", background: "#f8fafc", borderRadius: 8, overflow: "hidden", minHeight: 340, maxHeight: 480 }}>
              <img
                src={galleryModal.urls[galleryModal.index]}
                alt=""
                style={{ maxWidth: "100%", maxHeight: 460, objectFit: "contain" }}
              />
            </div>
            {galleryModal.urls.length > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() =>
                    setGalleryModal((prev) =>
                      prev ? { ...prev, index: (prev.index - 1 + prev.urls.length) % prev.urls.length } : null
                    )
                  }
                  style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
                >
                  ◀ Previous
                </button>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>
                  Photo {galleryModal.index + 1} of {galleryModal.urls.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setGalleryModal((prev) =>
                      prev ? { ...prev, index: (prev.index + 1) % prev.urls.length } : null
                    )
                  }
                  style={{ padding: "8px 16px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
                >
                  Next ▶
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
