import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buyerDirectoryApi, BuyerDirectoryEntry, ContactItem } from "../api/buyerDirectoryApi";
import { useIsSystemAdmin } from "../../auth/hooks/usePermissions";

export default function BuyerDirectoryPage() {
  const isSysAdmin = useIsSystemAdmin();
  const navigate = useNavigate();

  const [directory, setDirectory] = useState<BuyerDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await buyerDirectoryApi.list();
      setDirectory(data || []);
    } catch (err: any) {
      console.error("Failed to load buyer directory:", err);
      setMessage({ type: "error", text: "Failed to load buyer directory records" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await buyerDirectoryApi.delete(deleteId);
      setMessage({ type: "success", text: "Buyer removed from directory successfully." });
      setDeleteId(null);
      await loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to delete buyer" });
    } finally {
      setDeleting(false);
    }
  };

  // Filtered List based on Search
  const filteredList = useMemo(() => {
    if (!search.trim()) return directory;
    const q = search.trim().toLowerCase();
    return directory.filter((b) => {
      return (
        b.buyer_name?.toLowerCase().includes(q) ||
        b.buyer_code?.toLowerCase().includes(q) ||
        b.alias_name?.toLowerCase().includes(q) ||
        b.country?.toLowerCase().includes(q) ||
        b.city?.toLowerCase().includes(q) ||
        b.sourcing_person?.toLowerCase().includes(q) ||
        b.email?.toLowerCase().includes(q)
      );
    });
  }, [directory, search]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    const totalBuyers = directory.length;
    const countries = new Set(directory.map((b) => b.country?.trim()).filter(Boolean)).size;
    const totalAnnualContainers = directory.reduce((acc, b) => acc + (Number(b.annual_containers) || 0), 0);
    const totalSkus = directory.reduce((acc, b) => acc + (Number(b.existing_skus) || 0), 0);
    return { totalBuyers, countries, totalAnnualContainers, totalSkus };
  }, [directory]);

  return (
    <div style={{ padding: "28px 36px", maxWidth: 1300, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      <style>{`
        .bd-table th {
          padding: 12px 14px;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          text-align: left;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .bd-table td {
          padding: 14px;
          font-size: 13px;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .bd-table tbody tr:hover td {
          background: #f8fafc;
        }
        .stat-badge {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px 20px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .bd-search-input {
          width: 100%;
          padding: 9px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          background: #ffffff;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .bd-search-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
      `}</style>

      {/* Header & Sub-module Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", marginBottom: 6 }}>
            <Link to="/admin" style={{ color: "#64748b", textDecoration: "none" }}>Sales & CRM</Link>
            <span>/</span>
            <span style={{ color: "#2563eb", fontWeight: 600 }}>Buyer Directory</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Buyer Directory
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
            Comprehensive directory of all registered buyer profiles, shipping volume, and sourcing contacts.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={loadData}
            style={{
              padding: "9px 16px",
              background: "#ffffff",
              color: "#334155",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🔄 Refresh
          </button>
          <Link
            to="/admin/crm/buyers/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 18px",
              background: "#2563eb",
              color: "#ffffff",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
            }}
          >
            ➕ Create Buyer
          </Link>
        </div>
      </div>

      {/* Notification Message */}
      {message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 14,
            fontWeight: 500,
            background: message.type === "success" ? "#ecfdf5" : "#fee2e2",
            color: message.type === "success" ? "#065f46" : "#991b1b",
            border: `1px solid ${message.type === "success" ? "#a7f3d0" : "#fecaca"}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "inherit" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Stats Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
        <div className="stat-badge" style={{ borderLeft: "4px solid #2563eb" }}>
          <div style={{ fontSize: 26, background: "#eff6ff", width: 48, height: 48, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            🏢
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Registered Buyers</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{stats.totalBuyers}</div>
          </div>
        </div>

        <div className="stat-badge" style={{ borderLeft: "4px solid #10b981" }}>
          <div style={{ fontSize: 26, background: "#ecfdf5", width: 48, height: 48, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            🌍
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Export Countries</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#059669" }}>{stats.countries}</div>
          </div>
        </div>

        <div className="stat-badge" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: 26, background: "#fffbeb", width: 48, height: 48, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            🚢
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Annual Containers</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#d97706" }}>{stats.totalAnnualContainers} TEU/Yr</div>
          </div>
        </div>

        <div className="stat-badge" style={{ borderLeft: "4px solid #6366f1" }}>
          <div style={{ fontSize: 26, background: "#eef2ff", width: 48, height: 48, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            📦
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Existing Active SKUs</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#4f46e5" }}>{stats.totalSkus}</div>
          </div>
        </div>
      </div>

      {/* Directory Table Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          padding: 24,
        }}
      >
        {/* Search Bar & Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Buyer Directory Records
              </h2>
              <span style={{ fontSize: 12, fontWeight: 700, background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 12 }}>
                {filteredList.length} Buyers
              </span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
              Commercial details, container volume allocations, and verified contacts
            </p>
          </div>

          <div style={{ width: 350 }}>
            <input
              placeholder="🔍 Search buyer, code, alias, city, country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bd-search-input"
            />
          </div>
        </div>

        {/* Directory Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="bd-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Buyer & Identification</th>
                <th>Location</th>
                <th style={{ textAlign: "right" }}>SKUs</th>
                <th style={{ textAlign: "right" }}>Containers</th>
                <th>Container Types</th>
                <th>Sourcing Person & Email</th>
                <th>Contact Details</th>
                <th style={{ textAlign: "center", width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((entry) => {
                let containerList: string[] = [];
                if (entry.container_types) {
                  try {
                    containerList = JSON.parse(entry.container_types);
                  } catch {
                    containerList = entry.container_types.split(",").map((s) => s.trim());
                  }
                }

                let contactList: ContactItem[] = [];
                if (entry.contact_details) {
                  try {
                    contactList = JSON.parse(entry.contact_details);
                  } catch {
                    if (entry.phone) contactList.push({ label: "Primary", number: entry.phone });
                  }
                }
                if (contactList.length === 0 && entry.phone) {
                  contactList.push({ label: "Primary", number: entry.phone });
                }

                return (
                  <tr key={entry.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                          {entry.buyer_name}
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                          {entry.buyer_code && (
                            <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 11, fontWeight: 700 }}>
                              {entry.buyer_code}
                            </span>
                          )}
                          {entry.alias_name && (
                            <span style={{ color: "#64748b", fontSize: 12 }}>
                              • {entry.alias_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>
                        {entry.country || "—"}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>
                        {entry.city || ""}
                      </div>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <span style={{ fontWeight: 700, color: "#4f46e5", background: "#eef2ff", padding: "2px 8px", borderRadius: 6 }}>
                        {entry.existing_skus || 0}
                      </span>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        {entry.annual_containers || 0} / yr
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        ~{entry.monthly_containers || 0} / mo
                      </div>
                    </td>

                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 190 }}>
                        {containerList.length > 0 ? (
                          containerList.map((ct) => (
                            <span
                              key={ct}
                              style={{
                                background: "#f1f5f9",
                                color: "#334155",
                                fontSize: 11,
                                fontWeight: 600,
                                padding: "2px 6px",
                                borderRadius: 4,
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              {ct}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>
                        {entry.sourcing_person || "—"}
                      </div>
                      {entry.email && (
                        <div style={{ color: "#2563eb", fontSize: 12, marginTop: 2 }}>
                          <a href={`mailto:${entry.email}`} style={{ color: "inherit", textDecoration: "none" }}>
                            ✉️ {entry.email}
                          </a>
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {contactList.length > 0 ? (
                          contactList.map((c, idx) => (
                            <div key={idx} style={{ fontSize: 12 }}>
                              <span style={{ color: "#64748b", fontSize: 11 }}>{c.label}: </span>
                              <span style={{ fontWeight: 600, color: "#0f172a" }}>{c.number}</span>
                            </div>
                          ))
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </div>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        {/* Edit: Available to all users with module access */}
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/crm/buyers/edit/${entry.id}`)}
                          style={{
                            padding: "6px 12px",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            border: "1px solid #bfdbfe",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>

                        {/* Delete: STRICTLY restricted to System Admin */}
                        {isSysAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteId(entry.id)}
                            style={{
                              padding: "6px 12px",
                              background: "#fee2e2",
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                    No buyer directory entries found. Click <strong>"+ Create Buyer"</strong> above to register a buyer profile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal (Admin Only) */}
      {deleteId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 440,
              width: "90%",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 10px", color: "#991b1b" }}>
              ⚠️ Confirm Buyer Deletion
            </h3>
            <p style={{ fontSize: 14, color: "#475569", margin: "0 0 20px", lineHeight: 1.5 }}>
              Are you sure you want to remove this buyer from the Buyer Directory? This action is strictly reserved for the Administrator.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  background: "#dc2626",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
