import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { documentApi, DocumentDetail, inferPreviewKind, LinkEntityType } from "../api/documentApi";
import PermissionGate from "../../../shared/guards/PermissionGate";

const statusColors: Record<string, string> = { pending_approval: "#e08e0b", approved: "#1a7f37", rejected: "#c0392b" };

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [tagsText, setTagsText] = useState("");
  const [linkForm, setLinkForm] = useState<{ entityType: LinkEntityType; entityId: string }>({ entityType: "employee", entityId: "" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    const d = await documentApi.getById(id);
    setDoc(d);
    setTagsText(d.tags.join(", "));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only on route param change
  useEffect(() => { load(); }, [id]);

  async function handleSaveTags() {
    if (!id) return;
    await documentApi.setTags(id, tagsText.split(",").map((t) => t.trim()).filter(Boolean));
    await load();
  }

  async function handleReview(versionId: string, approve: boolean) {
    if (!id) return;
    const rejectionReason = approve ? undefined : (prompt("Rejection reason:") ?? undefined);
    await documentApi.reviewVersion(id, versionId, approve, rejectionReason);
    await load();
  }

  async function handleAddVersion() {
    if (!id) return;
    const fileName = prompt("New version file name:");
    if (!fileName) return;
    await documentApi.addVersion(id, fileName, `https://files.example.com/${encodeURIComponent(fileName)}`, "New version uploaded");
    await load();
  }

  async function handleAddLink(e: FormEvent) {
    e.preventDefault();
    if (!id || !linkForm.entityId) return;
    setError(null);
    try {
      await documentApi.addLink(id, linkForm.entityType, linkForm.entityId);
      setLinkForm({ ...linkForm, entityId: "" });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to add link.");
    }
  }

  if (!doc) return <p>Loading...</p>;

  const latestVersion = doc.versions[0];
  const previewKind = latestVersion ? inferPreviewKind(latestVersion.fileName) : "none";

  return (
    <div>
      <h1 style={{ fontSize: 20 }}>{doc.title}{doc.isConfidential && <span style={{ marginLeft: 8, fontSize: 13, color: "#c0392b" }}>🔒 Confidential</span>}</h1>
      <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>Status: <span style={{ color: statusColors[doc.status] ?? "#999", fontWeight: 600 }}>{doc.status.replace("_", " ")}</span>{doc.expiryDate && ` · Expires ${doc.expiryDate}`}</p>
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 14 }}>
          <h3 style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Preview</h3>
          {latestVersion && previewKind === "pdf" && <embed src={latestVersion.fileUrl} type="application/pdf" width="100%" height="300" />}
          {latestVersion && previewKind === "image" && <img src={latestVersion.fileUrl} alt={latestVersion.fileName} style={{ maxWidth: "100%", maxHeight: 300 }} />}
          {latestVersion && previewKind === "video" && <video src={latestVersion.fileUrl} controls style={{ maxWidth: "100%", maxHeight: 300 }} />}
          {latestVersion && previewKind === "none" && <p style={{ fontSize: 12, color: "#999" }}>No inline preview for this file type: {latestVersion.fileName}</p>}
          {!latestVersion && <p style={{ fontSize: 12, color: "#999" }}>No version uploaded yet.</p>}
        </div>

        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 14 }}>
          <h3 style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Tags</h3>
          <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="comma, separated, tags" style={{ display: "block", width: "100%", padding: 6, marginBottom: 6, boxSizing: "border-box" }} />
          <button onClick={handleSaveTags} style={{ fontSize: 12 }}>Save Tags</button>
        </div>
      </div>

      <h2 style={{ fontSize: 16, marginBottom: 8 }}>Version History</h2>
      <PermissionGate permission="document.create">
        <button onClick={handleAddVersion} style={{ marginBottom: 10 }}>+ Upload New Version</button>
      </PermissionGate>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
        <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #ddd", fontSize: 12, color: "#666" }}><th style={{ padding: 8 }}>Version</th><th style={{ padding: 8 }}>File</th><th style={{ padding: 8 }}>Status</th><th style={{ padding: 8 }}>Uploaded</th><th style={{ padding: 8 }}></th></tr></thead>
        <tbody>
          {doc.versions.map((v) => (
            <tr key={v.id} style={{ borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
              <td style={{ padding: 8 }}>v{v.versionNumber}</td>
              <td style={{ padding: 8 }}>{v.fileName}</td>
              <td style={{ padding: 8, color: statusColors[v.approvalStatus] }}>{v.approvalStatus.replace("_", " ")}{v.rejectionReason && <div style={{ fontSize: 11, color: "#999" }}>{v.rejectionReason}</div>}</td>
              <td style={{ padding: 8, fontSize: 12 }}>{new Date(v.uploadedAt).toLocaleString()}</td>
              <td style={{ padding: 8 }}>
                {v.approvalStatus === "pending_approval" && v.versionNumber === doc.versions[0].versionNumber && (
                  <PermissionGate permission="document.approve">
                    <button onClick={() => handleReview(v.id, true)} style={{ fontSize: 11 }}>Approve</button>{" "}
                    <button onClick={() => handleReview(v.id, false)} style={{ fontSize: 11 }}>Reject</button>
                  </PermissionGate>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: 16, marginBottom: 8 }}>Linked To</h2>
      <form onSubmit={handleAddLink} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <select value={linkForm.entityType} onChange={(e) => setLinkForm({ ...linkForm, entityType: e.target.value as LinkEntityType })} style={{ padding: 6 }}>
          <option value="employee">Employee</option><option value="machine">Machine</option><option value="product">Product</option>
          <option value="department">Department</option><option value="workflow">Workflow</option><option value="crm_lead">CRM Lead</option>
        </select>
        <input placeholder="Entity ID (UUID)" value={linkForm.entityId} onChange={(e) => setLinkForm({ ...linkForm, entityId: e.target.value })} style={{ padding: 6, flex: 1 }} />
        <button type="submit">+ Link</button>
      </form>
      {doc.links.map((l) => (
        <div key={l.id} style={{ fontSize: 13, padding: "4px 0", display: "flex", justifyContent: "space-between" }}>
          <span>{l.entityType}: {l.entityId}</span>
          <button onClick={() => documentApi.removeLink(doc.id, l.id).then(load)} style={{ fontSize: 11 }}>Remove</button>
        </div>
      ))}
      {doc.links.length === 0 && <p style={{ fontSize: 12, color: "#999" }}>Not linked to anything yet.</p>}
    </div>
  );
}
