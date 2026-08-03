import { FormEvent, useEffect, useState } from "react";
import { performanceApi, GoalRecord } from "../api/performanceApi";
import { useMyEmployee } from "../hooks/useMyEmployee";

const emptyForm = { title: "", description: "", unit: "", targetValue: "", weight: "0", targetDate: "" };

export default function GoalsPage() {
  const { employee, loading: loadingEmployee } = useMyEmployee();
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [progressDrafts, setProgressDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!employee) return;
    setGoals(await performanceApi.listGoals(employee.id));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately re-runs only when `employee` resolves, not on every `load` identity change
  useEffect(() => { load(); }, [employee]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!employee) return;
    setError(null);
    try {
      await performanceApi.createGoal({
        employeeId: employee.id,
        title: form.title,
        description: form.description || undefined,
        unit: form.unit || undefined,
        targetValue: form.targetValue ? Number(form.targetValue) : undefined,
        weight: form.weight ? Number(form.weight) : 0,
        targetDate: form.targetDate || undefined,
      });
      setForm(emptyForm);
      setShowCreate(false);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to create goal.");
    }
  }

  async function handleLogProgress(goalId: string) {
    const raw = progressDrafts[goalId];
    if (!raw) return;
    await performanceApi.logProgress(goalId, Number(raw));
    setProgressDrafts({ ...progressDrafts, [goalId]: "" });
    await load();
  }

  async function handleCancel(goalId: string) {
    if (!confirm("Cancel this goal?")) return;
    await performanceApi.removeGoal(goalId);
    await load();
  }

  if (loadingEmployee) return <p>Loading...</p>;
  if (!employee) {
    return (
      <div>
        <h1 style={{ fontSize: 20 }}>My Goals</h1>
        <p style={{ color: "#777" }}>
          Your login isn't linked to an Employee Master record yet. Ask an admin to link your account to your employee record
          (this happens on the Employee Master screen) before goals or reviews can be tracked for you.
        </p>
      </div>
    );
  }

  const totalWeight = goals.filter((g) => g.status === "active").reduce((sum, g) => sum + g.weight, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20 }}>My Goals</h1>
        <button onClick={() => setShowCreate((v) => !v)}>{showCreate ? "Cancel" : "+ New Goal"}</button>
      </div>
      {totalWeight !== 100 && goals.some((g) => g.status === "active") && (
        <p style={{ fontSize: 12, color: "#a66", marginTop: 4 }}>
          Active goal weights currently total {totalWeight}% (not 100%) — this affects how much each goal contributes to a review's goal-driven score.
        </p>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} style={{ margin: "16px 0", padding: 16, border: "1px solid #ddd", maxWidth: 480 }}>
          <input placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ display: "block", width: "100%", marginBottom: 8, padding: 6 }} />
          <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ display: "block", width: "100%", marginBottom: 8, padding: 6 }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input placeholder="Unit (e.g. %, units, $)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} style={{ padding: 6, flex: 1 }} />
            <input placeholder="Target value" type="number" value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} style={{ padding: 6, flex: 1 }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input placeholder="Weight % (of total)" type="number" min={0} max={100} value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} style={{ padding: 6, flex: 1 }} />
            <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} style={{ padding: 6, flex: 1 }} />
          </div>
          {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
          <button type="submit">Create Goal</button>
        </form>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Goal</th>
            <th style={{ padding: 8 }}>Progress</th>
            <th style={{ padding: 8 }}>Weight</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Log progress</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {goals.map((g) => (
            <tr key={g.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>
                <strong>{g.title}</strong>
                {g.description && <div style={{ fontSize: 12, color: "#777" }}>{g.description}</div>}
              </td>
              <td style={{ padding: 8 }}>
                {g.targetValue !== null ? (
                  <span>{g.currentValue}{g.unit ?? ""} / {g.targetValue}{g.unit ?? ""} ({g.achievementPercentage ?? 0}%)</span>
                ) : (
                  <span>{g.currentValue}{g.unit ?? ""} (no target set)</span>
                )}
              </td>
              <td style={{ padding: 8 }}>{g.weight}%</td>
              <td style={{ padding: 8 }}>{g.status}</td>
              <td style={{ padding: 8 }}>
                {g.status === "active" && (
                  <span style={{ display: "flex", gap: 4 }}>
                    <input
                      type="number"
                      placeholder="New value"
                      style={{ width: 90, padding: 4 }}
                      value={progressDrafts[g.id] ?? ""}
                      onChange={(e) => setProgressDrafts({ ...progressDrafts, [g.id]: e.target.value })}
                    />
                    <button onClick={() => handleLogProgress(g.id)}>Log</button>
                  </span>
                )}
              </td>
              <td style={{ padding: 8 }}>
                {g.status === "active" && <button onClick={() => handleCancel(g.id)}>Cancel</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
