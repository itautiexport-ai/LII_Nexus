import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { costingApi, CostingRequestBunch, CostingRequestItem, isDirectorApprover } from "../api/costingApi";
import { useAuthStore } from "../../auth/hooks/useAuthStore";

export default function CostingRequestsBunchesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const canApprove = isDirectorApprover(user);

  const [bunches, setBunches] = useState<CostingRequestBunch[]>([]);
  const [loading, setLoading] = useState(true);

  // Folder navigation state: null = Root (All Merchant Folders), string = Inside Merchant Folder
  const merchantInUrl = searchParams.get("merchant") || null;
  const [selectedFolder, setSelectedFolder] = useState<string | null>(merchantInUrl);

  // In-folder search & filter
  const [batchSearch, setBatchSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [folderSearch, setFolderSearch] = useState("");

  // Expanded batches state inside folder
  const [expandedBatches, setExpandedBatches] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadBunches();
  }, []);

  // Keep state synced with URL param
  useEffect(() => {
    if (merchantInUrl !== selectedFolder) {
      setSelectedFolder(merchantInUrl);
    }
  }, [merchantInUrl]);

  const loadBunches = async () => {
    setLoading(true);
    try {
      const data = await costingApi.getBunches();
      setBunches(data || []);
    } catch (err) {
      console.error("Failed to load costing request bunches:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFolder = (merchantName: string) => {
    setSelectedFolder(merchantName);
    setBatchSearch("");
    setStatusFilter("ALL");
    setSearchParams({ merchant: merchantName });
  };

  const handleBackToFolders = () => {
    setSelectedFolder(null);
    setSearchParams({});
  };

  const toggleBatchExpand = (bunchId: string) => {
    setExpandedBatches((prev) => ({
      ...prev,
      [bunchId]: !prev[bunchId],
    }));
  };

  // Group data by merchant folder
  const merchantFolders = useMemo(() => {
    const map: Record<
      string,
      {
        merchant: string;
        bunches: CostingRequestBunch[];
        totalBatches: number;
        totalProducts: number;
        approvedProducts: number;
        reviewProducts: number;
        inProgressProducts: number;
        notStartedProducts: number;
        approvedInrTotal: number;
        approvedUsdTotal: number;
        completedBatches: number;
        inProgressBatches: number;
        pendingBatches: number;
      }
    > = {};

    bunches.forEach((b) => {
      const m = (b.merchant_name || "Unassigned").trim();
      if (!map[m]) {
        map[m] = {
          merchant: m,
          bunches: [],
          totalBatches: 0,
          totalProducts: 0,
          approvedProducts: 0,
          reviewProducts: 0,
          inProgressProducts: 0,
          notStartedProducts: 0,
          approvedInrTotal: 0,
          approvedUsdTotal: 0,
          completedBatches: 0,
          inProgressBatches: 0,
          pendingBatches: 0,
        };
      }

      map[m].bunches.push(b);
      map[m].totalBatches += 1;
      const items = b.items || [];
      const pCount = items.length || b.total_products || 0;
      map[m].totalProducts += pCount;

      if (b.status === "Completed") map[m].completedBatches += 1;
      else if (b.status === "In Progress") map[m].inProgressBatches += 1;
      else map[m].pendingBatches += 1;

      items.forEach((it) => {
        if (it.stage === "Approved") {
          map[m].approvedProducts += 1;
          if (it.final_price) {
            map[m].approvedInrTotal += Number(it.final_price);
            map[m].approvedUsdTotal += it.final_price_usd ? Number(it.final_price_usd) : Number(it.final_price) / 86.5;
          }
        } else if (it.stage === "In Review") {
          map[m].reviewProducts += 1;
        } else if (it.stage === "In Progress") {
          map[m].inProgressProducts += 1;
        } else {
          map[m].notStartedProducts += 1;
        }
      });
    });

    return Object.values(map);
  }, [bunches]);

  // Filter folders at root
  const filteredFolders = useMemo(() => {
    if (!folderSearch.trim()) return merchantFolders;
    const q = folderSearch.trim().toLowerCase();
    return merchantFolders.filter((f) => f.merchant.toLowerCase().includes(q));
  }, [merchantFolders, folderSearch]);

  // Active folder data when inside a folder
  const activeFolderData = useMemo(() => {
    if (!selectedFolder) return null;
    return merchantFolders.find(
      (f) => f.merchant.toLowerCase() === selectedFolder.trim().toLowerCase()
    );
  }, [merchantFolders, selectedFolder]);

  // Batches within active folder (filtered)
  const activeFolderBatches = useMemo(() => {
    if (!activeFolderData) return [];
    return activeFolderData.bunches.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (batchSearch.trim()) {
        const q = batchSearch.trim().toLowerCase();
        const match =
          (b.bunch_code || "").toLowerCase().includes(q) ||
          (b.client_name || "").toLowerCase().includes(q) ||
          (b.notes || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [activeFolderData, statusFilter, batchSearch]);

  const isCurrentUser = (merchantName: string) => {
    if (!user?.fullName) return false;
    return merchantName.trim().toLowerCase() === user.fullName.trim().toLowerCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <span style={{ padding: "4px 10px", borderRadius: 12, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700 }}>✅ Completed</span>;
      case "In Progress":
        return <span style={{ padding: "4px 10px", borderRadius: 12, background: "#e0f2fe", color: "#0369a1", fontSize: 12, fontWeight: 700 }}>🛠️ In Progress</span>;
      default:
        return <span style={{ padding: "4px 10px", borderRadius: 12, background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 700 }}>⏳ Pending</span>;
    }
  };

  const getItemStageBadge = (stage: string) => {
    switch (stage) {
      case "Approved":
        return <span style={{ padding: "3px 8px", borderRadius: 10, background: "#dcfce7", color: "#166534", fontSize: 11, fontWeight: 700 }}>✅ Approved</span>;
      case "In Review":
        return <span style={{ padding: "3px 8px", borderRadius: 10, background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 700 }}>⏳ Under Review</span>;
      case "In Progress":
        return <span style={{ padding: "3px 8px", borderRadius: 10, background: "#e0f2fe", color: "#0369a1", fontSize: 11, fontWeight: 700 }}>🛠️ In Progress</span>;
      case "Rejected":
        return <span style={{ padding: "3px 8px", borderRadius: 10, background: "#fee2e2", color: "#991b1b", fontSize: 11, fontWeight: 700 }}>❌ Rejected</span>;
      default:
        return <span style={{ padding: "3px 8px", borderRadius: 10, background: "#f1f5f9", color: "#64748b", fontSize: 11, fontWeight: 700 }}>⏳ Not Started</span>;
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
              style={{ cursor: "pointer", color: selectedFolder ? "#2563eb" : "#1e293b", fontWeight: 700 }}
            >
              📁 Merchant Folders
            </span>
            {selectedFolder && (
              <>
                <span>/</span>
                <span style={{ color: "#1e293b", fontWeight: 700 }}>
                  📂 {selectedFolder}
                </span>
              </>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>{selectedFolder ? "📂" : "🗂️"}</span>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#111827" }}>
                {selectedFolder ? `${selectedFolder}'s Folder` : "Merchant Folders"}
              </h1>
              <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "#6b7280" }}>
                {selectedFolder
                  ? `Detailed costing request bunches and products submitted by ${selectedFolder}.`
                  : "Each user has a dedicated folder. Click a folder to open and inspect detailed costing data."}
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {selectedFolder && (
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
            No costing requests have been submitted yet. Submitting a request creates a merchant folder automatically.
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
      ) : !selectedFolder ? (
        /* ========================================================================= */
        /* ROOT VIEW: MERCHANT FOLDERS DIRECTORY GRID                                */
        /* ========================================================================= */
        <div>
          {/* Quick Filter Bar */}
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
              const isMine = isCurrentUser(folder.merchant);
              return (
                <div
                  key={folder.merchant}
                  onClick={() => handleOpenFolder(folder.merchant)}
                  style={{
                    background: isMine ? "#fdfcff" : "#ffffff",
                    border: isMine ? "2px solid #818cf8" : "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "20px 22px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.04)",
                    position: "relative",
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
                            {folder.merchant}
                          </h3>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 500 }}>
                            {folder.totalBatches} {folder.totalBatches === 1 ? "Batch" : "Batches"} • {folder.totalProducts} Products
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
                          ⏸️ {folder.notStartedProducts} Pending
                        </span>
                      )}
                    </div>

                    {/* Approved Total display */}
                    {folder.approvedInrTotal > 0 && (
                      <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginBottom: 12, background: "#f0fdf4", padding: "6px 10px", borderRadius: 6 }}>
                        Approved Total: ${folder.approvedUsdTotal.toFixed(2)} (₹{folder.approvedInrTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                      </div>
                    )}
                  </div>

                  {/* Folder Footer Action */}
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
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                      Batches: {folder.completedBatches} Done • {folder.inProgressBatches} Active
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
        /* INSIDE MERCHANT FOLDER VIEW: DETAILED BATCHES & PRODUCTS                   */
        /* ========================================================================= */
        <div>
          {/* Quick Folder Switcher Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, overflowX: "auto", paddingBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              Switch Folder:
            </span>
            {merchantFolders.map((mf) => {
              const isSelected = selectedFolder.toLowerCase() === mf.merchant.toLowerCase();
              return (
                <button
                  key={mf.merchant}
                  type="button"
                  onClick={() => handleOpenFolder(mf.merchant)}
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
                  <span>{mf.merchant}</span>
                  <span style={{ background: isSelected ? "#2563eb" : "#e2e8f0", color: isSelected ? "#ffffff" : "#475569", borderRadius: 10, padding: "1px 6px", fontSize: 10 }}>
                    {mf.totalBatches}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Folder Details Box */}
          {activeFolderData && (
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
                      {activeFolderData.merchant}
                    </h2>
                    {isCurrentUser(activeFolderData.merchant) && (
                      <span style={{ background: "#ede9fe", color: "#6d28d9", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 10 }}>
                        ⭐ My Folder
                      </span>
                    )}
                    <span style={{ fontSize: 13, color: "#64748b" }}>
                      • <strong>{activeFolderData.totalBatches}</strong> Batches ({activeFolderData.totalProducts} Total Products)
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 14, fontSize: 12, marginTop: 8, flexWrap: "wrap" }}>
                    <span style={{ color: "#16a34a", fontWeight: 700 }}>
                      ✅ Approved: {activeFolderData.approvedProducts}
                    </span>
                    <span style={{ color: "#d97706", fontWeight: 700 }}>
                      ⏳ In Review: {activeFolderData.reviewProducts}
                    </span>
                    <span style={{ color: "#2563eb", fontWeight: 700 }}>
                      🛠️ In Progress: {activeFolderData.inProgressProducts}
                    </span>
                    <span style={{ color: "#64748b", fontWeight: 600 }}>
                      ⏸️ Not Started: {activeFolderData.notStartedProducts}
                    </span>
                  </div>
                </div>

                {/* Search & Filter inside active folder */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder="Search batches in this folder..."
                    value={batchSearch}
                    onChange={(e) => setBatchSearch(e.target.value)}
                    style={{
                      padding: "7px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: 6,
                      fontSize: 13,
                      outline: "none",
                      width: 220,
                    }}
                  />

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 12, fontWeight: 600 }}
                  >
                    <option value="ALL">All Batch Status</option>
                    <option value="Pending">⏳ Pending</option>
                    <option value="In Progress">🛠️ In Progress</option>
                    <option value="Completed">✅ Completed</option>
                  </select>

                  {(batchSearch || statusFilter !== "ALL") && (
                    <button
                      type="button"
                      onClick={() => {
                        setBatchSearch("");
                        setStatusFilter("ALL");
                      }}
                      style={{ background: "none", border: "none", color: "#2563eb", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* BATCHES TABLE IN THIS FOLDER */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700 }}>Batch Code</th>
                      <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700 }}>Client / Buyer</th>
                      <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700 }}>Created Date</th>
                      <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700 }}>Products</th>
                      <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700 }}>Priority</th>
                      <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700 }}>Costing Status Breakdown</th>
                      <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700 }}>Batch State</th>
                      <th style={{ padding: "12px 18px", color: "#475569", fontWeight: 700, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeFolderBatches.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                          No batches found in {activeFolderData.merchant}'s folder.
                        </td>
                      </tr>
                    ) : (
                      activeFolderBatches.map((bunch, idx) => {
                        const items = bunch.items || [];
                        const approvedCount = items.filter((it) => it.stage === "Approved").length;
                        const reviewCount = items.filter((it) => it.stage === "In Review").length;
                        const progressCount = items.filter((it) => it.stage === "In Progress").length;
                        const pendingCount = items.filter((it) => it.stage === "Pending").length;
                        const isExpanded = !!expandedBatches[bunch.id];

                        // Calculate approved amount
                        let batchApprovedInr = 0;
                        let batchApprovedUsd = 0;
                        items.forEach((it) => {
                          if (it.stage === "Approved" && it.final_price) {
                            batchApprovedInr += Number(it.final_price);
                            batchApprovedUsd += it.final_price_usd ? Number(it.final_price_usd) : Number(it.final_price) / 86.5;
                          }
                        });

                        return (
                          <React.Fragment key={bunch.id}>
                            <tr
                              style={{
                                borderBottom: isExpanded ? "none" : "1px solid #f1f5f9",
                                background: idx % 2 === 0 ? "#ffffff" : "#fbfcfe",
                              }}
                            >
                              <td style={{ padding: "14px 18px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <button
                                    type="button"
                                    onClick={() => toggleBatchExpand(bunch.id)}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      fontSize: 12,
                                      padding: 0,
                                      color: "#64748b",
                                    }}
                                    title={isExpanded ? "Collapse products" : "Expand products"}
                                  >
                                    {isExpanded ? "▼" : "▶"}
                                  </button>
                                  <span
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 800,
                                      color: "#4f46e5",
                                      background: "#ede9fe",
                                      padding: "4px 10px",
                                      borderRadius: 6,
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    {bunch.bunch_code}
                                  </span>
                                </div>
                                {bunch.notes && (
                                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontStyle: "italic", maxWidth: 220, paddingLeft: 18 }}>
                                    "{bunch.notes}"
                                  </div>
                                )}
                              </td>

                              <td style={{ padding: "14px 18px", color: "#334155", fontWeight: 600 }}>
                                {bunch.client_name || "—"}
                              </td>

                              <td style={{ padding: "14px 18px", color: "#64748b", fontSize: 12 }}>
                                {bunch.created_at ? new Date(bunch.created_at).toLocaleDateString() : "—"}
                                <span style={{ display: "block", fontSize: 11, color: "#94a3b8" }}>
                                  {bunch.created_at ? new Date(bunch.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                                </span>
                              </td>

                              <td style={{ padding: "14px 18px" }}>
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    background: "#f1f5f9",
                                    color: "#334155",
                                    padding: "4px 10px",
                                    borderRadius: 12,
                                  }}
                                >
                                  {items.length || bunch.total_products} Products
                                </span>
                              </td>

                              <td style={{ padding: "14px 18px" }}>
                                {getPriorityBadge(bunch.priority)}
                              </td>

                              {/* Progress Breakdown */}
                              <td style={{ padding: "14px 18px" }}>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 11 }}>
                                  {approvedCount > 0 && (
                                    <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>
                                      ✅ {approvedCount} Approved
                                    </span>
                                  )}
                                  {reviewCount > 0 && (
                                    <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>
                                      ⏳ {reviewCount} Review
                                    </span>
                                  )}
                                  {progressCount > 0 && (
                                    <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>
                                      🛠️ {progressCount} In Progress
                                    </span>
                                  )}
                                  {pendingCount > 0 && (
                                    <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: 6, fontWeight: 600 }}>
                                      ⏸️ {pendingCount} Pending
                                    </span>
                                  )}
                                </div>
                                {batchApprovedInr > 0 && (
                                  <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, marginTop: 4 }}>
                                    Approved: ${batchApprovedUsd.toFixed(2)} (₹{batchApprovedInr.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                                  </div>
                                )}
                              </td>

                              <td style={{ padding: "14px 18px" }}>
                                {getStatusBadge(bunch.status)}
                              </td>

                              {/* Actions */}
                              <td style={{ padding: "14px 18px", textAlign: "right" }}>
                                <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                                  <button
                                    type="button"
                                    onClick={() => toggleBatchExpand(bunch.id)}
                                    style={{
                                      padding: "6px 12px",
                                      background: isExpanded ? "#f1f5f9" : "#ffffff",
                                      color: "#475569",
                                      border: "1px solid #cbd5e1",
                                      borderRadius: 6,
                                      fontWeight: 600,
                                      fontSize: 12,
                                      cursor: "pointer",
                                    }}
                                  >
                                    {isExpanded ? "Hide SKUs" : "👁️ View SKUs"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => navigate(`/admin/costing/sku-wise?bunchCode=${bunch.bunch_code}`)}
                                    style={{
                                      padding: "6px 14px",
                                      background: "#2563eb",
                                      color: "#ffffff",
                                      border: "none",
                                      borderRadius: 6,
                                      fontWeight: 700,
                                      fontSize: 12,
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      boxShadow: "0 1px 2px rgba(37, 99, 235, 0.2)",
                                    }}
                                  >
                                    <span>Costing Sheet</span>
                                    <span>➔</span>
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* EXPANDED ROW: PRODUCTS WITHIN THIS BATCH */}
                            {isExpanded && (
                              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                <td colSpan={8} style={{ padding: "12px 24px 20px 24px" }}>
                                  <div
                                    style={{
                                      background: "#ffffff",
                                      border: "1px solid #e2e8f0",
                                      borderRadius: 8,
                                      padding: "16px 20px",
                                      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
                                    }}
                                  >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
                                        <span>📦 Products inside Batch</span>
                                        <strong style={{ color: "#4f46e5" }}>{bunch.bunch_code}</strong>
                                        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 400 }}>({items.length} items)</span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => navigate(`/admin/costing/sku-wise?bunchCode=${bunch.bunch_code}`)}
                                        style={{
                                          background: "none",
                                          border: "none",
                                          color: "#2563eb",
                                          fontSize: 12,
                                          fontWeight: 700,
                                          cursor: "pointer",
                                        }}
                                      >
                                        Open full table in SKU Wise Costing ➔
                                      </button>
                                    </div>

                                    {items.length === 0 ? (
                                      <div style={{ padding: 16, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                                        No individual product items attached to this batch.
                                      </div>
                                    ) : (
                                      <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                          <thead>
                                            <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                                              <th style={{ padding: "8px 10px" }}>Product Info</th>
                                              <th style={{ padding: "8px 10px" }}>Type & Specs</th>
                                              <th style={{ padding: "8px 10px" }}>Dimensions</th>
                                              <th style={{ padding: "8px 10px" }}>Wood</th>
                                              <th style={{ padding: "8px 10px" }}>Stage</th>
                                              <th style={{ padding: "8px 10px" }}>Approved Price</th>
                                              <th style={{ padding: "8px 10px", textAlign: "right" }}>Costing</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {items.map((it) => (
                                              <tr key={it.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                <td style={{ padding: "8px 10px" }}>
                                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    {it.image_url ? (
                                                      <img
                                                        src={it.image_url}
                                                        alt=""
                                                        style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4, border: "1px solid #e2e8f0" }}
                                                        onError={(e) => ((e.target as any).style.display = "none")}
                                                      />
                                                    ) : (
                                                      <div style={{ width: 32, height: 32, borderRadius: 4, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                                                        🪑
                                                      </div>
                                                    )}
                                                    <div>
                                                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{it.product_name}</div>
                                                      <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600 }}>{it.product_code}</div>
                                                    </div>
                                                  </div>
                                                </td>

                                                <td style={{ padding: "8px 10px", color: "#475569" }}>
                                                  {it.product_type || "—"}
                                                  {it.collection_name && <span style={{ display: "block", fontSize: 11, color: "#94a3b8" }}>{it.collection_name}</span>}
                                                </td>

                                                <td style={{ padding: "8px 10px", color: "#475569" }}>
                                                  {it.overall_size || "—"}
                                                </td>

                                                <td style={{ padding: "8px 10px", color: "#475569" }}>
                                                  {it.wood_type || "—"}
                                                </td>

                                                <td style={{ padding: "8px 10px" }}>
                                                  {getItemStageBadge(it.stage)}
                                                </td>

                                                <td style={{ padding: "8px 10px" }}>
                                                  {it.stage === "Approved" && it.final_price ? (
                                                    <span style={{ fontWeight: 700, color: "#16a34a" }}>
                                                      ${(it.final_price_usd ? Number(it.final_price_usd) : Number(it.final_price) / 86.5).toFixed(2)}
                                                      <span style={{ fontSize: 11, color: "#64748b", marginLeft: 4 }}>
                                                        (₹{Number(it.final_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                                                      </span>
                                                    </span>
                                                  ) : (
                                                    <span style={{ color: "#94a3b8" }}>—</span>
                                                  )}
                                                </td>

                                                <td style={{ padding: "8px 10px", textAlign: "right" }}>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const params = new URLSearchParams({
                                                        requestId: it.id,
                                                        bunchCode: it.bunch_code,
                                                        productCode: it.product_code,
                                                        productName: it.product_name,
                                                        clientName: it.client_name || "",
                                                        woodType: it.wood_type || "",
                                                        overallSize: it.overall_size || "",
                                                        productType: it.product_type || "",
                                                        collectionName: it.collection_name || "",
                                                        merchantName: it.merchant_name || "",
                                                      });
                                                      navigate(`/admin/costing/new?${params.toString()}`);
                                                    }}
                                                    style={{
                                                      padding: "4px 10px",
                                                      background: it.stage === "Approved" ? "#f1f5f9" : "#2563eb",
                                                      color: it.stage === "Approved" ? "#334155" : "#ffffff",
                                                      border: "none",
                                                      borderRadius: 4,
                                                      fontSize: 11,
                                                      fontWeight: 700,
                                                      cursor: "pointer",
                                                    }}
                                                  >
                                                    {it.stage === "Approved" ? "👁️ View Sheet" : it.stage === "Pending" ? "⚡ Do Costing" : "✏️ Edit Costing"}
                                                  </button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
