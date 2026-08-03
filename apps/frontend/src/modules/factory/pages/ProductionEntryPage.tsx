import { FormEvent, useEffect, useState } from "react";
import { factoryApi, DirectReport, LineShiftSummary } from "../api/factoryApi";
import { productionLinesApi, ProductionLineRecord } from "../../admin/factory/productionLines/api/productionLinesApi";
import { shiftsApi, ShiftRecord } from "../../admin/factory/shifts/api/shiftsApi";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ProductionEntryPage() {
  const [lines, setLines] = useState<ProductionLineRecord[]>([]);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [directReports, setDirectReports] = useState<DirectReport[]>([]);

  const [lineId, setLineId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [date, setDate] = useState(today());
  const [summary, setSummary] = useState<LineShiftSummary | null>(null);

  const [newEntry, setNewEntry] = useState({ employeeId: "", quantityProduced: "", targetQuantity: "" });
  const [editDrafts, setEditDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([productionLinesApi.list(), shiftsApi.list(), factoryApi.myDirectReports()]).then(([l, s, dr]) => {
      setLines(l);
      setShifts(s);
      setDirectReports(dr);
      if (l[0]) setLineId(l[0].id);
      const generalShift = s.find((sh) => sh.name.toLowerCase() === "general");
      if (generalShift) setShiftId(generalShift.id);
      else if (s[0]) setShiftId(s[0].id);
    });
  }, []);

  async function loadSummary() {
    if (!lineId || !shiftId || !date) return;
    setSummary(await factoryApi.getSummary(lineId, shiftId, date));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately re-runs only when the line/shift/date selector changes
  useEffect(() => { loadSummary(); }, [lineId, shiftId, date]);

  async function handleAddEntry(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await factoryApi.createEntry({
        employeeId: newEntry.employeeId,
        lineId, shiftId, entryDate: date,
        quantityProduced: Number(newEntry.quantityProduced),
        targetQuantity: newEntry.targetQuantity ? Number(newEntry.targetQuantity) : null,
      });
      setNewEntry({ employeeId: "", quantityProduced: "", targetQuantity: "" });
      await loadSummary();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to record entry.");
    }
  }

  async function handleUpdateQuantity(entryId: string) {
    const raw = editDrafts[entryId];
    if (!raw) return;
    try {
      await factoryApi.updateEntry(entryId, { quantityProduced: Number(raw) });
      setEditDrafts({ ...editDrafts, [entryId]: "" });
      await loadSummary();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message ?? "Failed to update entry.");
    }
  }

  async function handleDelete(entryId: string) {
    if (!confirm("Delete this entry?")) return;
    await factoryApi.removeEntry(entryId);
    await loadSummary();
  }

  const alreadyLoggedIds = new Set(summary?.entries.map((e) => e.employeeId) ?? []);
  const availableReports = directReports.filter((r) => !alreadyLoggedIds.has(r.id));

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Production Entry</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <select value={lineId} onChange={(e) => setLineId(e.target.value)} style={{ padding: 6 }}>
          <option value="">— Line —</option>
          {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={shiftId} onChange={(e) => setShiftId(e.target.value)} style={{ padding: 6 }}>
          <option value="">— Shift —</option>
          {shifts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: 6 }} />
      </div>

      {summary && (
        <div style={{ marginBottom: 16, padding: 12, background: "#f7f7f7", maxWidth: 480 }}>
          <strong>Line total:</strong> {summary.totalProduced}
          {summary.totalTarget !== null && (
            <> / {summary.totalTarget} target ({summary.achievementPercentage}%)</>
          )}
        </div>
      )}

      {directReports.length === 0 ? (
        <p style={{ color: "#777" }}>You have no direct reports assigned in Employee Master, so there's nobody to log entries for.</p>
      ) : (
        availableReports.length > 0 && (
          <form onSubmit={handleAddEntry} style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <select required value={newEntry.employeeId} onChange={(e) => setNewEntry({ ...newEntry, employeeId: e.target.value })} style={{ padding: 6 }}>
              <option value="">— Worker —</option>
              {availableReports.map((r) => <option key={r.id} value={r.id}>{r.fullName}</option>)}
            </select>
            <input type="number" placeholder="Quantity produced" required min={0} value={newEntry.quantityProduced}
              onChange={(e) => setNewEntry({ ...newEntry, quantityProduced: e.target.value })} style={{ padding: 6, width: 140 }} />
            <input type="number" placeholder="Target (optional)" min={0} value={newEntry.targetQuantity}
              onChange={(e) => setNewEntry({ ...newEntry, targetQuantity: e.target.value })} style={{ padding: 6, width: 140 }} />
            <button type="submit">Add Entry</button>
          </form>
        )
      )}
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Worker</th>
            <th style={{ padding: 8 }}>Produced</th>
            <th style={{ padding: 8 }}>Target</th>
            <th style={{ padding: 8 }}>Achievement</th>
            <th style={{ padding: 8 }}>Correct</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {summary?.entries.map((entry) => (
            <tr key={entry.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{entry.employeeName} ({entry.employeeCode})</td>
              <td style={{ padding: 8 }}>{entry.quantityProduced}</td>
              <td style={{ padding: 8 }}>{entry.targetQuantity ?? "—"}</td>
              <td style={{ padding: 8 }}>{entry.achievementPercentage ?? "—"}{entry.achievementPercentage !== null ? "%" : ""}</td>
              <td style={{ padding: 8 }}>
                <span style={{ display: "flex", gap: 4 }}>
                  <input type="number" placeholder="New qty" style={{ width: 90, padding: 4 }}
                    value={editDrafts[entry.id] ?? ""} onChange={(e) => setEditDrafts({ ...editDrafts, [entry.id]: e.target.value })} />
                  <button onClick={() => handleUpdateQuantity(entry.id)}>Update</button>
                </span>
              </td>
              <td style={{ padding: 8 }}>
                <button onClick={() => handleDelete(entry.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
