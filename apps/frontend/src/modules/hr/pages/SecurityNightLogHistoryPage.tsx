import React, { useEffect, useState } from "react";
import { securityCustomApi, SecurityNightFormRecord } from "../api/securityCustomApi";
import { useNavigate } from "react-router-dom";

const CHECKPOINTS = [
  { id: "1", label: "1. पैकिंग हॉल - फोटो", short: "Packing Hall", legacyId: "509" },
  { id: "2", label: "2. पेन्ट बूथ - फोटो", short: "Paint Booth", legacyId: "507" },
  { id: "3", label: "3. सेन्डिंग एरिया - फोटो", short: "Sanding Area", legacyId: "508" },
  { id: "4", label: "4. फायर पैनल - फोटो", short: "Fire Panel", legacyId: "510" },
  { id: "5", label: "5. एसएस वर्क्स शाॅप एंव पैनल - फोटो", short: "SS Works Shop & Panel", legacyId: "513" },
  { id: "6", label: "6. पाउडर कोटिंग प्लांट पैनल - फोटो", short: "Powder Coating Plant Panel", legacyId: "512" },
  { id: "7", label: "7. सीएनसी लेजर मशीन पैनल - फोटो", short: "CNC Laser Machine Panel", legacyId: "511" },
  { id: "8", label: "8. प्रथम तल पैनल रूम - फोटो", short: "1st Floor Panel Room", legacyId: "514" },
  { id: "9", label: "9. प्रथम तल पैकिंग एरिया - फोटो", short: "1st Floor Packing Area", legacyId: "515" },
  { id: "10", label: "10. ऑफिस एरिया के पास खेड होकर गार्ड स्वयं की फोटो खीचेगा - फोटो", short: "Office Area Selfie", legacyId: "517" },
  { id: "11", label: "11. केमिकल स्टोर - फोटो", short: "Chemical Store" },
  { id: "12", label: "12. कार्टन रॉ मैटेिरयल एरिया - फोटो", short: "Carton Raw Material Area" },
  { id: "13", label: "13. C.T.P - फोटो", short: "C.T.P" },
  { id: "14", label: "14. एच टी पैनल रूम / पिछे वाला गेट - फोटो", short: "HT Panel Room / Back Gate", legacyId: "501" },
  { id: "15", label: "15. पावर पैनल रूम / ट्रांसफारमर - फोटो", short: "Power Panel Room / Transformer", legacyId: "502" },
  { id: "16", label: "16. वुड स्टोर - फोटो", short: "Wood Store" },
  { id: "17", label: "17. सीज़निंग चैम्बर - फोटो", short: "Seasoning Chamber" },
  { id: "18", label: "18. बॉयलर / आँपरेटर /हैल्पर - फोटो", short: "Boiler / Operator / Helper", legacyId: "503" },
  { id: "19", label: "19. मशीन शोप पॉवर पैनल - फोटो", short: "Machine Shop Power Panel", legacyId: "505" },
  { id: "20", label: "20. डस्ट कलेक्टर एरिया - फोटो", short: "Dust Collector Area", legacyId: "504" },
  { id: "21", label: "21. मशीन शोप (इनसाइड) - फोटो", short: "Machine Shop (Inside)" },
  { id: "22", label: "22. सीएनसी वुडन / आँपरेटर - फोटो", short: "CNC Wooden / Operator", legacyId: "506" },
  { id: "23", label: "23. मशीन शोप (आउटसाइड) - फोटो", short: "Machine Shop (Outside)" },
  { id: "24", label: "24. नया प्लांट - फोटो", short: "New Plant" },
  { id: "25", label: "25. गेट नई फैक्ट्री - फोटो", short: "New Factory Gate" },
  { id: "26", label: "26. कैंटीन - फोटो", short: "Canteen" },
  { id: "27", label: "27. स्वयं की फोटो मशीन के साथ - फोटो", short: "Selfie with Machine", legacyId: "selfie" },
];

interface LogImage {
  id?: string;
  url: string;
  label: string;
  short?: string;
  capturedAt?: string;
}

function parseImages(imageUrlStr: string | null): LogImage[] {
  if (!imageUrlStr) return [];
  if (imageUrlStr.startsWith("{")) {
    try {
      const obj = JSON.parse(imageUrlStr);
      const entries = Object.entries(obj).map(([checkpointId, data]: [string, any]) => {
        const cp = CHECKPOINTS.find((c) => c.id === checkpointId || (c as any).legacyId === checkpointId);
        return {
          id: checkpointId,
          url: data.url || data,
          label: cp ? cp.label : `Checkpoint ${checkpointId}`,
          short: cp ? cp.short : undefined,
          capturedAt: data.capturedAt,
        };
      });
      // Sort entries according to CHECKPOINTS sequence
      entries.sort((a, b) => {
        const idxA = CHECKPOINTS.findIndex((c) => c.id === a.id || (c as any).legacyId === a.id);
        const idxB = CHECKPOINTS.findIndex((c) => c.id === b.id || (c as any).legacyId === b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        return 0;
      });
      return entries;
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
                  <th style={{ padding: "12px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>Observations / प्रमुख निष्कर्ष</th>
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
                                const match = img.label.match(/^(\d+)/) || img.label.match(/\b(\d+)\b/);
                                const badgeText = match ? match[1] : img.label.toLowerCase().includes("selfie") || img.label.includes("स्वयं") ? "Self" : String(idx + 1);

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
