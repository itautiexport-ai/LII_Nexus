import { useEffect, useState } from "react";
import { notificationApi, NotificationTemplateRecord } from "../api/notificationApi";

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplateRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { title: string; description: string; priority: string; actionLabel: string }>>({});

  async function load() {
    const list = await notificationApi.listTemplates();
    setTemplates(list);
    const d: typeof drafts = {};
    for (const t of list) d[t.id] = { title: t.defaultTitle, description: t.defaultDescription ?? "", priority: t.defaultPriority, actionLabel: t.defaultActionLabel ?? "" };
    setDrafts(d);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- load only needs to run once on mount
  useEffect(() => { load(); }, []);

  async function handleSave(t: NotificationTemplateRecord) {
    const draft = drafts[t.id];
    await notificationApi.updateTemplate(t.id, {
      defaultTitle: draft.title, defaultDescription: draft.description || null,
      defaultPriority: draft.priority as any, defaultActionLabel: draft.actionLabel || null,
    });
    await load();
  }

  async function handleToggleStatus(t: NotificationTemplateRecord) {
    await notificationApi.updateTemplate(t.id, { status: t.status === "active" ? "inactive" : "active" });
    await load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Notification Templates</h1>
      <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>17 built-in notification types. Edit the default wording, priority, and action label used whenever a module raises this type.</p>

      {templates.map((t) => (
        <div key={t.id} style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 14, marginBottom: 10, maxWidth: 640 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong style={{ fontSize: 13 }}>{t.notificationType.replace(/_/g, " ")}</strong>
            <div>
              <span style={{ fontSize: 11, background: "#eee", padding: "2px 6px", borderRadius: 4, marginRight: 6 }}>{t.module}</span>
              <button onClick={() => handleToggleStatus(t)} style={{ fontSize: 11 }}>{t.status === "active" ? "Deactivate" : "Activate"}</button>
            </div>
          </div>
          <input value={drafts[t.id]?.title ?? ""} onChange={(e) => setDrafts({ ...drafts, [t.id]: { ...drafts[t.id], title: e.target.value } })} style={{ display: "block", width: "100%", padding: 6, marginBottom: 6 }} />
          <textarea value={drafts[t.id]?.description ?? ""} onChange={(e) => setDrafts({ ...drafts, [t.id]: { ...drafts[t.id], description: e.target.value } })} rows={2} style={{ display: "block", width: "100%", padding: 6, marginBottom: 6, boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <select value={drafts[t.id]?.priority ?? "medium"} onChange={(e) => setDrafts({ ...drafts, [t.id]: { ...drafts[t.id], priority: e.target.value } })} style={{ padding: 6 }}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select>
            <input placeholder="Action label" value={drafts[t.id]?.actionLabel ?? ""} onChange={(e) => setDrafts({ ...drafts, [t.id]: { ...drafts[t.id], actionLabel: e.target.value } })} style={{ padding: 6, flex: 1 }} />
            <button onClick={() => handleSave(t)}>Save</button>
          </div>
        </div>
      ))}
    </div>
  );
}
