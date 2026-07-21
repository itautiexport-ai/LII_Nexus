import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { documentApi, DocumentRecord, CATEGORY_LABELS, DocumentCategory } from "../api/documentApi";
import PermissionGate from "../../../shared/guards/PermissionGate";

const statusColors: Record<string, string> = { draft: "#999", pending_approval: "#e08e0b", approved: "#1a7f37", rejected: "#c0392b" };

export default function DocumentsListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DocumentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");

  async function load() {
    const res = await documentApi.list({ search: search || undefined, category: category || undefined, tag: tag || undefined });
    setItems(res.items);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs on filter changes only
  useEffect(() => { load(); }, [search, category, tag]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20 }}>Documents</h1>
        <PermissionGate permission="document.create">
          <button onClick={() => navigate("/admin/documents/new")}>+ Upload Document</button>
        </PermissionGate>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input placeholder="Search title..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: 6, flex: 1 }} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: 6 }}>
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input placeholder="Filter by tag..." value={tag} onChange={(e) => setTag(e.target.value)} style={{ padding: 6 }} />
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}><th style={{ padding: 8 }}>Title</th><th style={{ padding: 8 }}>Category</th><th style={{ padding: 8 }}>Status</th><th style={{ padding: 8 }}>Expiry</th><th style={{ padding: 8 }}>Updated</th></tr></thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.id} style={{ borderBottom: "1px solid #eee", cursor: "pointer" }} onClick={() => navigate(`/admin/documents/${d.id}`)}>
              <td style={{ padding: 8, fontWeight: 600 }}>{d.title}{d.isConfidential && <span style={{ marginLeft: 6, fontSize: 11, color: "#c0392b" }}>🔒 confidential</span>}</td>
              <td style={{ padding: 8 }}>{CATEGORY_LABELS[d.category as DocumentCategory]}</td>
              <td style={{ padding: 8 }}><span style={{ color: statusColors[d.status], fontWeight: 600 }}>{d.status.replace("_", " ")}</span></td>
              <td style={{ padding: 8 }}>{d.expiryDate ?? "—"}</td>
              <td style={{ padding: 8, fontSize: 12, color: "#777" }}>{new Date(d.updatedAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={5} style={{ padding: 16, textAlign: "center", color: "#999" }}>No documents found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
