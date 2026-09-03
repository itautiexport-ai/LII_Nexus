import React, { useEffect, useState } from "react";
import { securityCustomApi, SecurityNightFormRecord } from "../api/securityCustomApi";
import { useNavigate } from "react-router-dom";

const CHECKPOINTS = [
  { id: "501", label: "एच टी पैनल रूम / पिछे वाला गेट 501- फोटो", short: "HT Panel / Back Gate 501" },
  { id: "502", label: "पावर पैनल रूम / ट्रांसफारमर 502- फोटो", short: "Power Panel / Transformer 502" },
  { id: "503", label: "बॉयलर / आँपरेटर /हैल्पर 503- फोटो", short: "Boiler / Operator / Helper 503" },
  { id: "504", label: "डस्ट कलेक्टर एरिया 504-फोटो", short: "Dust Collector Area 504" },
  { id: "505", label: "मशीन शॉप पॉवर पैनल 505- फोटो", short: "Machine Shop Power Panel 505" },
  { id: "506", label: "सीएनसी वुडन / आँपरेटर 506- फोटो", short: "CNC Wooden / Operator 506" },
  { id: "507", label: "पेन्ट बूथ 507- फोटो", short: "Paint Booth 507" },
  { id: "508", label: "सेन्डिंग एरिया 508 फोटो", short: "Sanding Area 508" },
  { id: "509", label: "पैकिंग हॉल 509- फोटो", short: "Packing Hall 509" },
  { id: "510", label: "फायर पैनल 510- फोटो", short: "Fire Panel 510" },
  { id: "511", label: "सीएनसी लेजर मशीन पैनल 511- फोटो", short: "CNC Laser Panel 511" },
  { id: "512", label: "पाउडर कोटिंग प्लांट पैनल 512- फोटो", short: "Powder Coating Panel 512" },
  { id: "513", label: "एसएस वर्क्स शॉप एंव पैनल 513- फोटो", short: "SS Works Panel 513" },
  { id: "514", label: "प्रथम तल पैनल रूम 514- फोटो", short: "1st Floor Panel Room 514" },
  { id: "515", label: "प्रथम तल पैकिंग एरिया 515- फोटो", short: "1st Floor Packing 515" },
  { id: "516", label: "प्रथम तल रॉ मैटेरियल एरिया 516- फोटो", short: "1st Floor Raw Material 516" },
  { id: "517", label: "ऑफिस एरिया के पास खेड होकर गार्ड स्वयं की फोटो खीचेगा 517- फोटो", short: "Office Area Selfie 517" },
  { id: "selfie", label: "स्वयं की फोटो मशीन के साथ", short: "Selfie with Machine" },
];

interface LogImage {
  url: string;
  label: string;
  capturedAt?: string;
}

function parseImages(imageUrlStr: string | null): LogImage[] {
  if (!imageUrlStr) return [];
  if (imageUrlStr.startsWith("{")) {
    try {
      const obj = JSON.parse(imageUrlStr);
      return Object.entries(obj).map(([checkpointId, data]: [string, any]) => {
        const cp = CHECKPOINTS.find((c) => c.id === checkpointId);
        return {
          url: data.url || data,
          label: cp ? cp.label : `Checkpoint ${checkpointId}`,
          capturedAt: data.capturedAt,
        };
      });
    } catch (e) {
      // Fallback on error
    }
  }

  // Fallback to legacy comma-separated list
  return imageUrlStr.split(",").map((url, idx) => ({
    url,
    label: `Photo #${idx + 1}`,
  }));
}

export default function SecurityNightLogHistoryPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<SecurityNightFormRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeImageModal, setActiveImageModal] = useState<{ url: string; time: string; location: string } | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    setLoading(true);
    try {
      const data = await securityCustomApi.getNightForms();
      setRecords(data || []);
    } catch (err: any) {
      console.error("Failed to load Security Night Log records", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this Night Log entry?")) return;
    try {
      await securityCustomApi.deleteNightForm(id);
      loadRecords();
    } catch (err: any) {
      console.error("Failed to delete record", err);
    }
  }

  // Filtered records
  const filteredRecords = records.filter((r) => {
    const matchSearch =
      r.guard_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.gate_location && r.gate_location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.observations && r.observations.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === "all" || r.patrol_status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <button
            onClick={() => navigate("/admin/hr/security/night-form")}
            style={{
              marginBottom: "12px",
              background: "#673ab7",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ← Fill Form / फॉर्म भरें
          </button>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
            Security Night Log History
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Dedicated history log repository for all submitted security night patrol logs and verified photo captures.
          </p>
        </div>
        <button
          onClick={loadRecords}
          style={{
            padding: "8px 16px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#334155",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          🔄 Refresh Logs
        </button>
      </div>

      {/* Main Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          padding: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search guard name, location or observations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: "220px", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", color: "#334155" }}
          >
            <option value="all">All Patrol Statuses</option>
            <option value="normal">Normal</option>
            <option value="minor issue">Minor Issue</option>
            <option value="major alert">Major Alert</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ color: "#64748b", fontSize: "14px", padding: "16px 0" }}>Loading history logs...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Verified Photos</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Real-Time Capture</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Guard Name</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Shift Date</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Location</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Patrol Status</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Observations</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Remarks</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "28px", fontStyle: "italic", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                      No Security Night Log entries found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    const parsedImages = parseImages(r.image_url);

                    return (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        {/* Photo Thumbnails */}
                        <td style={{ padding: "10px 12px" }}>
                          {parsedImages.length > 0 ? (
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", maxWidth: "240px" }}>
                              {parsedImages.map((img, idx) => {
                                // Extract checkpoint ID or numeric short badge from label
                                const match = img.label.match(/\d{3}/);
                                const badgeText = match ? match[0] : img.label.toLowerCase().includes("selfie") ? "Self" : String(idx + 1);

                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      position: "relative",
                                      display: "inline-block",
                                      cursor: "pointer",
                                    }}
                                    onClick={() =>
                                      setActiveImageModal({
                                        url: img.url,
                                        time: img.capturedAt
                                          ? new Date(img.capturedAt).toLocaleString()
                                          : r.photo_captured_at
                                          ? new Date(r.photo_captured_at).toLocaleString()
                                          : new Date(r.created_at).toLocaleString(),
                                        location: img.label,
                                      })
                                    }
                                  >
                                    <img
                                      src={img.url}
                                      alt={img.label}
                                      style={{
                                        width: "42px",
                                        height: "42px",
                                        objectFit: "cover",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                      }}
                                    />
                                    <span
                                      style={{
                                        position: "absolute",
                                        bottom: "-2px",
                                        right: "-2px",
                                        background: "#673ab7",
                                        color: "#ffffff",
                                        fontSize: "9px",
                                        padding: "1px 4px",
                                        borderRadius: "4px",
                                        fontWeight: "700",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                                      }}
                                    >
                                      {badgeText}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>No Photos</span>
                          )}
                        </td>

                        {/* Real-Time Stamp */}
                        <td style={{ padding: "10px 12px", fontSize: "12px", color: "#0369a1", fontWeight: "600" }}>
                          {r.photo_captured_at ? (
                            <span>🕒 {new Date(r.photo_captured_at).toLocaleString()}</span>
                          ) : (
                            <span style={{ color: "#64748b" }}>{new Date(r.created_at).toLocaleString()}</span>
                          )}
                        </td>

                        <td style={{ padding: "10px 12px", fontWeight: "600", fontSize: "14px", color: "#0f172a" }}>
                          {r.guard_name}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: "14px", color: "#334155" }}>
                          {r.shift_date}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: "14px", color: "#334155" }}>
                          {r.gate_location || "-"}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: "14px" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              background: r.patrol_status === "Normal" ? "#dcfce7" : "#fee2e2",
                              color: r.patrol_status === "Normal" ? "#166534" : "#991b1b",
                            }}
                          >
                            {r.patrol_status}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: "14px", color: "#334155", whiteSpace: "pre-line" }}>
                          {r.observations || "-"}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: "14px", color: "#334155" }}>
                          {r.remarks || "-"}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <button
                            onClick={() => handleDelete(r.id)}
                            style={{
                              background: "transparent",
                              border: "1px solid #ef4444",
                              color: "#ef4444",
                              padding: "4px 10px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Screen Image Modal */}
      {activeImageModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setActiveImageModal(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              maxWidth: "520px",
              width: "90%",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "#0f172a" }}>
              🔒 Verified Security Guard Photo
            </h3>
            <img
              src={activeImageModal.url}
              alt="Full Size"
              style={{ width: "100%", maxHeight: "380px", objectFit: "contain", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
            <div style={{ marginTop: "12px", fontSize: "13px", color: "#334155", textAlign: "left" }}>
              <div style={{ marginBottom: "4px" }}>
                <strong>Area / Location:</strong>
                <div style={{ marginTop: "2px", color: "#0369a1", fontWeight: "600" }}>{activeImageModal.location}</div>
              </div>
              <div>
                <strong>Verified Captured Time:</strong> 🕒 {activeImageModal.time}
              </div>
            </div>
            <button
              onClick={() => setActiveImageModal(null)}
              style={{
                marginTop: "16px",
                padding: "6px 18px",
                background: "#475569",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
