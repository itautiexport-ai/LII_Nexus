import { useEffect, useState } from "react";
import { notificationApi, EscalationRuleRecord } from "../api/notificationApi";
import { rolesApi, RoleRecord } from "../../admin/roles/api/rolesApi";

export default function EscalationRulesPage() {
  const [rules, setRules] = useState<EscalationRuleRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [runResult, setRunResult] = useState<any>(null);

  async function load() {
    const [ruleList, roleList] = await Promise.all([notificationApi.listEscalationRules(), rolesApi.list()]);
    setRules(ruleList);
    setRoles(roleList);
  }
  useEffect(() => { load(); }, []);

  async function handleUpdate(level: number, changes: Partial<{ targetRoleId: string | null; escalateAfterHours: number }>) {
    await notificationApi.updateEscalationRule(level, changes);
    await load();
  }

  async function handleRunCheck() {
    setRunResult(await notificationApi.runEscalationCheck());
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h1 style={{ fontSize: 20 }}>Escalation Rules</h1>
        <button onClick={handleRunCheck}>Run Escalation Check Now</button>
      </div>
      <p style={{ fontSize: 13, color: "#777", marginBottom: 16 }}>
        A single global 5-level ladder. Level 1 is always the original assignee. Level 2 falls back to the assignee's direct manager
        if no role is set below; levels 3-5 (HOD/COO/CEO) require a role to be configured, or escalation to that level is skipped.
        There is no job scheduler in this system — this check runs on demand.
      </p>

      {runResult && (
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 12, marginBottom: 16, fontSize: 13 }}>
          {runResult.map((r: any) => <div key={r.level}>Level {r.level}: checked {r.candidatesChecked}, escalated {r.escalated}, skipped (unresolved) {r.skippedUnresolved}</div>)}
        </div>
      )}

      {rules.map((r) => (
        <div key={r.level} style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 14, marginBottom: 10, maxWidth: 560, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <strong style={{ minWidth: 100 }}>Level {r.level} — {r.levelLabel.toUpperCase()}</strong>
          <label style={{ fontSize: 12 }}>
            Target Role
            <select value={r.targetRoleId ?? ""} onChange={(e) => handleUpdate(r.level, { targetRoleId: e.target.value || null })} style={{ display: "block", padding: 6, marginTop: 4 }}>
              <option value="">— Unconfigured{r.level === 2 ? " (uses manager chain)" : ""} —</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 12 }}>
            Escalate After (hours)
            <input type="number" min={1} value={r.escalateAfterHours} onChange={(e) => handleUpdate(r.level, { escalateAfterHours: Number(e.target.value) })} style={{ display: "block", padding: 6, marginTop: 4, width: 100 }} />
          </label>
        </div>
      ))}
    </div>
  );
}
