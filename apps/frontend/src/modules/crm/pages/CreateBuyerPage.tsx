import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { buyerDirectoryApi, ContactItem } from "../api/buyerDirectoryApi";
import { masterDataApi, Buyer as MasterBuyer } from "../../admin/masterdata/api/masterDataApi";

const CONTAINER_TYPE_OPTIONS = [
  "40' High Cube (HC)",
  "40' Normal / Standard (GP)",
  "20' Feet (GP)",
  "45' High Cube",
  "LCL / Pallets",
];

const INITIAL_FORM = {
  master_buyer_id: "",
  buyer_name: "",
  buyer_code: "",
  alias_name: "",
  country: "",
  city: "",
  existing_skus: 0,
  annual_containers: 0,
  monthly_containers: 0,
  container_types: ["40' High Cube (HC)"] as string[],
  email: "",
  sourcing_person: "",
  contacts: [
    { label: "Primary Phone", number: "" },
    { label: "Mobile / WhatsApp", number: "" },
  ] as ContactItem[],
  address: "",
  notes: "",
};

export default function CreateBuyerPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [masterBuyers, setMasterBuyers] = useState<MasterBuyer[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load master buyers
  useEffect(() => {
    masterDataApi.getBuyers().then((b) => setMasterBuyers(b || [])).catch(() => {});
  }, []);

  // If edit mode, load existing buyer record
  useEffect(() => {
    if (id) {
      setLoading(true);
      buyerDirectoryApi
        .getById(id)
        .then((entry) => {
          let parsedContainers: string[] = [];
          if (entry.container_types) {
            try {
              parsedContainers = JSON.parse(entry.container_types);
            } catch {
              parsedContainers = entry.container_types.split(",").map((s) => s.trim());
            }
          }

          let parsedContacts: ContactItem[] = [];
          if (entry.contact_details) {
            try {
              parsedContacts = JSON.parse(entry.contact_details);
            } catch {
              if (entry.phone) parsedContacts.push({ label: "Primary Phone", number: entry.phone });
              if (entry.alternate_phone) parsedContacts.push({ label: "Mobile / WhatsApp", number: entry.alternate_phone });
            }
          }
          if (parsedContacts.length === 0) {
            if (entry.phone) parsedContacts.push({ label: "Primary Phone", number: entry.phone });
            if (entry.alternate_phone) parsedContacts.push({ label: "Mobile / WhatsApp", number: entry.alternate_phone });
          }
          if (parsedContacts.length === 0) {
            parsedContacts = [
              { label: "Primary Phone", number: "" },
              { label: "Mobile / WhatsApp", number: "" },
            ];
          }

          setForm({
            master_buyer_id: entry.master_buyer_id || "",
            buyer_name: entry.buyer_name,
            buyer_code: entry.buyer_code || "",
            alias_name: entry.alias_name || "",
            country: entry.country || "",
            city: entry.city || "",
            existing_skus: entry.existing_skus || 0,
            annual_containers: entry.annual_containers || 0,
            monthly_containers: entry.monthly_containers || 0,
            container_types: parsedContainers,
            email: entry.email || "",
            sourcing_person: entry.sourcing_person || "",
            contacts: parsedContacts,
            address: entry.address || "",
            notes: entry.notes || "",
          });
        })
        .catch((err) => {
          console.error(err);
          setMessage({ type: "error", text: "Failed to load buyer details for editing" });
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  // When user selects from master buyers dropdown
  const handleSelectMasterBuyer = (selectedId: string) => {
    if (!selectedId) {
      setForm((prev) => ({ ...prev, master_buyer_id: "" }));
      return;
    }

    const mb = masterBuyers.find((b) => b.id === selectedId);
    if (mb) {
      setForm((prev) => ({
        ...prev,
        master_buyer_id: mb.id,
        buyer_name: mb.name,
        buyer_code: mb.buyer_code || "",
        alias_name: mb.alias_name || "",
      }));
    }
  };

  const handleToggleContainerType = (type: string) => {
    setForm((prev) => {
      const exists = prev.container_types.includes(type);
      const updated = exists
        ? prev.container_types.filter((t) => t !== type)
        : [...prev.container_types, type];
      return { ...prev, container_types: updated };
    });
  };

  const handleAddContact = () => {
    if (form.contacts.length >= 4) return;
    setForm((prev) => ({
      ...prev,
      contacts: [...prev.contacts, { label: "Alternate Contact", number: "" }],
    }));
  };

  const handleRemoveContact = (index: number) => {
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index),
    }));
  };

  const handleContactChange = (index: number, field: "label" | "number", value: string) => {
    setForm((prev) => {
      const next = [...prev.contacts];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, contacts: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.buyer_name.trim()) {
      setMessage({ type: "error", text: "Buyer Name is required" });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const validContacts = form.contacts.filter((c) => c.number.trim());
      const payload = {
        master_buyer_id: form.master_buyer_id || null,
        buyer_name: form.buyer_name.trim(),
        buyer_code: form.buyer_code.trim() || null,
        alias_name: form.alias_name.trim() || null,
        country: form.country.trim() || null,
        city: form.city.trim() || null,
        existing_skus: Number(form.existing_skus) || 0,
        annual_containers: Number(form.annual_containers) || 0,
        monthly_containers: Number(form.monthly_containers) || 0,
        container_types: form.container_types,
        email: form.email.trim() || null,
        sourcing_person: form.sourcing_person.trim() || null,
        contact_details: validContacts,
        phone: validContacts[0]?.number || null,
        alternate_phone: validContacts[1]?.number || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (isEdit && id) {
        await buyerDirectoryApi.update(id, payload);
        setMessage({ type: "success", text: `Buyer "${form.buyer_name}" updated successfully!` });
      } else {
        await buyerDirectoryApi.create(payload);
        setMessage({ type: "success", text: `Buyer "${form.buyer_name}" created successfully!` });
        setForm(INITIAL_FORM);
      }

      // Automatically navigate to Buyer Directory after 1.2s or allow user to click
      setTimeout(() => {
        navigate("/admin/crm/buyer-directory");
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save buyer details" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading buyer details...</div>;
  }

  return (
    <div style={{ padding: "28px 36px", maxWidth: 1000, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      <style>{`
        .bd-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          background: #ffffff;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box;
        }
        .bd-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .bd-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
      `}</style>

      {/* Header & Breadcrumb */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", marginBottom: 6 }}>
            <Link to="/admin" style={{ color: "#64748b", textDecoration: "none" }}>Sales & CRM</Link>
            <span>/</span>
            <span style={{ color: "#2563eb", fontWeight: 600 }}>{isEdit ? "Edit Buyer" : "Create Buyer"}</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.02em" }}>
            {isEdit ? "Edit Buyer Profile" : "Create Buyer"}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
            Register new buyer commercial specifications, container allocation, SKU tracking, and sourcing contacts.
          </p>
        </div>

        <div>
          <Link
            to="/admin/crm/buyer-directory"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 18px",
              background: "#ffffff",
              color: "#334155",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            📋 View Buyer Directory
          </Link>
        </div>
      </div>

      {/* Notification Message */}
      {message && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 8,
            marginBottom: 22,
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

      {/* Form Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          padding: 28,
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Master Buyer Auto-fill Dropdown */}
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "16px 20px", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1e40af" }}>
                💡 Select from Master Data Buyers:
              </span>
              <span style={{ fontSize: 12, color: "#3b82f6" }}>
                Auto-populates Buyer Name, Code & Alias instantly
              </span>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={form.master_buyer_id}
                onChange={(e) => handleSelectMasterBuyer(e.target.value)}
                className="bd-input"
                style={{ maxWidth: 400, background: "#ffffff", borderColor: "#93c5fd", fontWeight: 500 }}
              >
                <option value="">-- Choose Master Buyer (or enter manually below) --</option>
                {masterBuyers.map((mb) => (
                  <option key={mb.id} value={mb.id}>
                    {mb.name} {mb.buyer_code ? `(${mb.buyer_code})` : ""} {mb.alias_name ? `• ${mb.alias_name}` : ""}
                  </option>
                ))}
              </select>
              {form.master_buyer_id && (
                <button
                  type="button"
                  onClick={() => handleSelectMasterBuyer("")}
                  style={{ background: "#dbeafe", border: "none", color: "#1e40af", fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 6, cursor: "pointer" }}
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Row 1: Identification */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, marginBottom: 20 }}>
            <div>
              <label className="bd-label">Buyer Name *</label>
              <input
                required
                placeholder="e.g. El Corte"
                value={form.buyer_name}
                onChange={(e) => setForm({ ...form, buyer_name: e.target.value })}
                className="bd-input"
              />
            </div>

            <div>
              <label className="bd-label">Buyer Code (Auto-populated)</label>
              <input
                placeholder="e.g. ECI"
                value={form.buyer_code}
                onChange={(e) => setForm({ ...form, buyer_code: e.target.value })}
                className="bd-input"
                style={{ fontFamily: "monospace" }}
              />
            </div>

            <div>
              <label className="bd-label">Alias Name (Auto-populated)</label>
              <input
                placeholder="e.g. El Corte Inglés S.A."
                value={form.alias_name}
                onChange={(e) => setForm({ ...form, alias_name: e.target.value })}
                className="bd-input"
              />
            </div>
          </div>

          {/* Row 2: Location & Primary Contact */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, marginBottom: 20 }}>
            <div>
              <label className="bd-label">Country</label>
              <input
                placeholder="e.g. Spain, USA, Germany"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="bd-input"
              />
            </div>

            <div>
              <label className="bd-label">City</label>
              <input
                placeholder="e.g. Madrid, Barcelona"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="bd-input"
              />
            </div>

            <div>
              <label className="bd-label">Main Sourcing Person Name</label>
              <input
                placeholder="e.g. Carlos Rodriguez"
                value={form.sourcing_person}
                onChange={(e) => setForm({ ...form, sourcing_person: e.target.value })}
                className="bd-input"
              />
            </div>

            <div>
              <label className="bd-label">Emailing Address</label>
              <input
                type="email"
                placeholder="e.g. carlos@elcorte.es"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bd-input"
              />
            </div>
          </div>

          {/* Row 3: Commercial & Container Volumes */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18, marginBottom: 20 }}>
            <div>
              <label className="bd-label">Existing SKUs Purchased</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 45"
                value={form.existing_skus || ""}
                onChange={(e) => setForm({ ...form, existing_skus: Number(e.target.value) || 0 })}
                className="bd-input"
              />
            </div>

            <div>
              <label className="bd-label">Containers / Year (Annual)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 24"
                value={form.annual_containers || ""}
                onChange={(e) => setForm({ ...form, annual_containers: Number(e.target.value) || 0 })}
                className="bd-input"
              />
            </div>

            <div>
              <label className="bd-label">Containers / Month (Monthly)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 2.0"
                value={form.monthly_containers || ""}
                onChange={(e) => setForm({ ...form, monthly_containers: Number(e.target.value) || 0 })}
                className="bd-input"
              />
            </div>
          </div>

          {/* Row 4: Container Types Multi-Selection */}
          <div style={{ marginBottom: 20, background: "#f8fafc", padding: "16px 18px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <label className="bd-label" style={{ marginBottom: 10 }}>
              Container Types Purchased (Select all that apply)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {CONTAINER_TYPE_OPTIONS.map((opt) => {
                const selected = form.container_types.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleToggleContainerType(opt)}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: selected ? 700 : 500,
                      border: selected ? "1px solid #2563eb" : "1px solid #cbd5e1",
                      background: selected ? "#2563eb" : "#ffffff",
                      color: selected ? "#ffffff" : "#475569",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {selected ? "✓ " : "+ "} {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 5: Dynamic Contact Details */}
          <div style={{ marginBottom: 20, background: "#f8fafc", padding: "16px 18px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <label className="bd-label" style={{ margin: 0 }}>
                Contact Numbers / Channels (Add up to 3-4 contacts)
              </label>
              {form.contacts.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddContact}
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    color: "#1d4ed8",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "5px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  + Add Another Contact
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              {form.contacts.map((contact, index) => (
                <div key={index} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    placeholder="Label (e.g. Mobile)"
                    value={contact.label}
                    onChange={(e) => handleContactChange(index, "label", e.target.value)}
                    style={{
                      width: 140,
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#334155",
                      background: "#fff",
                    }}
                  />
                  <input
                    placeholder="Phone / WhatsApp number"
                    value={contact.number}
                    onChange={(e) => handleContactChange(index, "number", e.target.value)}
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: 6,
                      fontSize: 13,
                      background: "#fff",
                    }}
                  />
                  {form.contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(index)}
                      style={{
                        background: "#fee2e2",
                        border: "none",
                        color: "#dc2626",
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                      title="Remove contact"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Row 6: Address & Notes */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18, marginBottom: 26 }}>
            <div>
              <label className="bd-label">Office / Delivery Port Address</label>
              <input
                placeholder="e.g. Calle Hermosilla 112, Madrid / Destination Port: Valencia"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="bd-input"
              />
            </div>

            <div>
              <label className="bd-label">Notes & Commercial Terms</label>
              <input
                placeholder="e.g. Standard 60-day credit, FOB Mundra"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="bd-input"
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "11px 26px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
              }}
            >
              {saving ? "Saving..." : isEdit ? "✓ Update Buyer Profile" : "✓ Create Buyer Profile"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/crm/buyer-directory")}
              style={{
                padding: "11px 20px",
                background: "#f1f5f9",
                color: "#475569",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
