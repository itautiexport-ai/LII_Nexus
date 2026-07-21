import { useState, useEffect, FormEvent } from "react";
import { axiosInstance } from "../../../../services/api/axiosInstance";

export default function ModuleWeightsPage() {
  const [fmsWeight, setFmsWeight] = useState(20);
  const [checklistWeight, setChecklistWeight] = useState(20);
  const [delegationWeight, setDelegationWeight] = useState(20);
  const [hodWeight, setHodWeight] = useState(20);
  const [hrWeight, setHrWeight] = useState(20);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    fetchWeights();
  }, []);

  async function fetchWeights() {
    try {
      const res = await axiosInstance.get("/module-weights");
      const data = res.data.data;
      setFmsWeight(data.fmsWeight ?? 20);
      setChecklistWeight(data.checklistWeight ?? 20);
      setDelegationWeight(data.delegationWeight ?? 20);
      setHodWeight(data.hodWeight ?? 20);
      setHrWeight(data.hrWeight ?? 20);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load weights");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const total = fmsWeight + checklistWeight + delegationWeight + hodWeight + hrWeight;
    if (Math.abs(total - 100) > 0.1) {
      setMessage(`Total weight of all modules must equal 100%. Current total: ${total.toFixed(1)}%`);
      setMessageType("error");
      setSaving(false);
      return;
    }

    try {
      await axiosInstance.put("/module-weights", {
        fmsWeight,
        checklistWeight,
        delegationWeight,
        hodWeight,
        hrWeight
      });
      setMessage("Weights saved successfully!");
      setMessageType("success");
    } catch (err) {
      console.error(err);
      setMessage("Failed to save weights");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  const total = fmsWeight + checklistWeight + delegationWeight + hodWeight + hrWeight;

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "24px 28px",
    marginBottom: 24,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box"
  };

  const badgeStyle = (sum: number): React.CSSProperties => ({
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 700,
    background: Math.abs(sum - 100) <= 0.1 ? "#dcfce7" : "#fee2e2",
    color: Math.abs(sum - 100) <= 0.1 ? "#15803d" : "#dc2626"
  });

  return (
    <div style={{ padding: "28px 24px", maxWidth: 680, margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Weights Configuration</h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 6 }}>
          Configure the weight percentage for the 5 components (FMS, Checklist, Delegation, HOD Score, and HR Score). The sum must equal exactly 100%.
        </p>
      </div>

      {message && (
        <div style={{
          padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 14,
          background: messageType === "success" ? "#dcfce7" : "#fee2e2",
          color: messageType === "success" ? "#15803d" : "#dc2626",
          border: `1px solid ${messageType === "success" ? "#bbf7d0" : "#fecaca"}`
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1d4ed8", margin: 0 }}>Weights Allocation</h2>
            <span style={badgeStyle(total)}>
              Overall Total: {total.toFixed(1)}%
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={labelStyle}>FMS Weight (%)</label>
              <input
                type="number"
                min="0" max="100" step="0.1"
                value={fmsWeight}
                onChange={e => setFmsWeight(parseFloat(e.target.value) || 0)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Checklist Weight (%)</label>
              <input
                type="number"
                min="0" max="100" step="0.1"
                value={checklistWeight}
                onChange={e => setChecklistWeight(parseFloat(e.target.value) || 0)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Delegation Weight (%)</label>
              <input
                type="number"
                min="0" max="100" step="0.1"
                value={delegationWeight}
                onChange={e => setDelegationWeight(parseFloat(e.target.value) || 0)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>HOD Score Weight (%)</label>
              <input
                type="number"
                min="0" max="100" step="0.1"
                value={hodWeight}
                onChange={e => setHodWeight(parseFloat(e.target.value) || 0)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>HR Score Weight (%)</label>
              <input
                type="number"
                min="0" max="100" step="0.1"
                value={hrWeight}
                onChange={e => setHrWeight(parseFloat(e.target.value) || 0)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            padding: "11px 28px",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? "Saving..." : "Save Weights"}
        </button>
      </form>
    </div>
  );
}
