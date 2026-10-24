import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { buyerDirectoryApi, BuyerDirectoryEntry, ContactItem } from "../api/buyerDirectoryApi";
import { masterDataApi, Buyer as MasterBuyer } from "../../admin/masterdata/api/masterDataApi";
import { useIsSystemAdmin } from "../../auth/hooks/usePermissions";

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

export default function BuyerDirectoryPage() {
  const isSysAdmin = useIsSystemAdmin();
  const formRef = useRef<HTMLDivElement>(null);

  // Data states
  const [directory, setDirectory] = useState<BuyerDirectoryEntry[]>([]);
  const [masterBuyers, setMasterBuyers] = useState<MasterBuyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Form states
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dirData, buyersData] = await Promise.all([
        buyerDirectoryApi.list(),
        masterDataApi.getBuyers().catch(() => []),
      ]);
      setDirectory(dirData || []);
      setMasterBuyers(buyersData || []);
    } catch (err: any) {
      console.error("Failed to load buyer directory:", err);
      setMessage({ type: "error", text: "Failed to load buyer directory records" });
    } finally {
      setLoading(false);
    }
  };

  // When user selects a buyer from the Master Buyers dropdown
  const handleSelectMasterBuyer = (selectedId: string) => {
    if (!selectedId) {
      setForm((prev) => ({
        ...prev,
        master_buyer_id: "",
      }));
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

  // Toggle container type selection
  const handleToggleContainerType = (type: string) => {
    setForm((prev) => {
      const exists = prev.container_types.includes(type);
      const updated = exists
        ? prev.container_types.filter((t) => t !== type)
        : [...prev.container_types, type];
      return { ...prev, container_types: updated };
    });
  };

  // Add another contact row (up to 3)
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

  // Handle Submit (Create or Update)
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

      if (editingId) {
        await buyerDirectoryApi.update(editingId, payload);
        setMessage({ type: "success", text: `Buyer "${form.buyer_name}" updated successfully!` });
      } else {
        await buyerDirectoryApi.create(payload);
        setMessage({ type: "success", text: `Buyer "${form.buyer_name}" added to directory successfully!` });
      }

      setForm(INITIAL_FORM);
      setEditingId(null);
      await loadAll();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save buyer details" });
    } finally {
      setSaving(false);
    }
  };

  // Start Edit
  const handleEdit = (entry: BuyerDirectoryEntry) => {
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
        // fallback
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
    setEditingId(entry.id);
    setFormOpen(true);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  // Delete Action (Admin Only)
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await buyerDirectoryApi.delete(deleteId);
      setMessage({ type: "success", text: "Buyer removed from directory." });
      setDeleteId(null);
      await loadAll();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to delete buyer" });
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Directory
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
        .bd-input {
          width: 100%;
          padding: 9px 12px;
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
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .stat-badge {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px 18px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          display: flex;
          align-items: center;
          gap: 14px;
        }
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
          padding: 13px 14px;
          font-size: 13px;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .bd-table tbody tr:hover td {
          background: #f8fafc;
        }
        .pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s ease;
        }
      `}</style>

      {/* Breadcrumb & Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", marginBottom: 6 }}>
            <Link to="/admin" style={{ color: "#64748b", textDecoration: "none" }}>Sales & CRM</Link>
            <span>/</span>
            <span style={{ color: "#2563eb", fontWeight: 600 }}>Create Buyer & Buyer Directory</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Create Buyer & Buyer Directory
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
            Commercial profile registration, container allocation, SKU tracking, and sourcing contacts directory.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(INITIAL_FORM);
              setFormOpen(true);
              formRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              padding: "9px 18px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
            }}
          >
            ➕ Add New Buyer Profile
          </button>
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

      {/* SECTION 1: CREATE / EDIT BUYER FORM */}
      <div
        ref={formRef}
        style={{
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          marginBottom: 32,
          overflow: "hidden",
        }}
      >
        <div
          onClick={() => setFormOpen(!formOpen)}
          style={{
            padding: "16px 24px",
            background: "#f8fafc",
            borderBottom: formOpen ? "1px solid #e2e8f0" : "none",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>{editingId ? "✏️" : "➕"}</span>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
              {editingId ? "Edit Buyer Profile Details" : "Create Buyer Profile & Specifications"}
            </h2>
            {editingId && (
              <span style={{ fontSize: 12, fontWeight: 700, background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: 4 }}>
                Editing #{editingId.slice(0, 8)}
              </span>
            )}
          </div>
          <span style={{ fontSize: 13, color: "#64748b" }}>
            {formOpen ? "▲ Collapse Form" : "▼ Expand Form"}
          </span>
        </div>

        {formOpen && (
          <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
            {/* Master Buyer Auto-fill Dropdown */}
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "14px 18px", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e40af" }}>
                  💡 Auto-Fill from Master Data Buyers:
                </span>
                <span style={{ fontSize: 12, color: "#3b82f6" }}>
                  Selecting a master buyer automatically fills Buyer Name, Code & Alias
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <select
                  value={form.master_buyer_id}
                  onChange={(e) => handleSelectMasterBuyer(e.target.value)}
                  className="bd-input"
                  style={{ maxWidth: 360, background: "#ffffff", borderColor: "#93c5fd", fontWeight: 500 }}
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
                    style={{ background: "#dbeafe", border: "none", color: "#1e40af", fontSize: 12, fontWeight: 600, padding: "7px 12px", borderRadius: 6, cursor: "pointer" }}
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>

            {/* Row 1: Identification */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 18 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 18 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 18 }}>
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
            <div style={{ marginBottom: 18, background: "#f8fafc", padding: "14px 16px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <label className="bd-label" style={{ marginBottom: 8 }}>
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
                        padding: "6px 14px",
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

            {/* Row 5: Dynamic Contact Details (2-3 contact numbers) */}
            <div style={{ marginBottom: 18, background: "#f8fafc", padding: "14px 16px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
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
                      padding: "4px 10px",
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
                        width: 130,
                        padding: "8px 10px",
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
                        padding: "8px 10px",
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 22 }}>
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

            {/* Form Action Buttons */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "10px 24px",
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
                {saving ? "Saving..." : editingId ? "✓ Update Buyer Profile" : "✓ Create Buyer Profile"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    padding: "10px 18px",
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* SECTION 2: BUYER DIRECTORY TABLE */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Buyer Directory
              </h2>
              <span style={{ fontSize: 12, fontWeight: 700, background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 12 }}>
                {filteredList.length} Buyers
              </span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
              Comprehensive list of all registered buyers with operational details and contacts
            </p>
          </div>

          {/* Search Box */}
          <div style={{ width: 340 }}>
            <input
              placeholder="🔍 Search buyer, code, alias, city, country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bd-input"
              style={{ padding: "8px 14px", borderRadius: 8 }}
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
                <th style={{ textAlign: "center", width: 130 }}>Actions</th>
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
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 180 }}>
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
                      <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                        {/* Edit: Available to all users with module access */}
                        <button
                          type="button"
                          onClick={() => handleEdit(entry)}
                          style={{
                            padding: "5px 10px",
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
                              padding: "5px 10px",
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
                  <td colSpan={8} style={{ padding: 36, textAlign: "center", color: "#94a3b8" }}>
                    No buyer directory entries found. Use the form above to create your first buyer profile!
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
