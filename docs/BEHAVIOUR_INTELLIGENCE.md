# Behaviour Intelligence Engine

Measures **how** people work — consistency, discipline, delay patterns, improvement trend — as a deliberately separate axis from the Performance Scoring Engine, which measures **what** got produced. Both systems can look at the same employee and say genuinely different things: someone can hit their targets (high performance score) while being erratic about deadlines (low behaviour index), or vice versa.

## The Behaviour Index — 11 components, one weighted composite

Same "no manual calculation" principle as every other scoring system in this app: components are computed from real data, weights are admin-configurable, and the final index is always system-computed — never hand-averaged.

| Component | Default weight | Source |
|---|---|---|
| On-Time Completion % | 20% | Flowchart + Delegation tasks due in the period |
| Delay Frequency | 10% | Inverse of how often work was late (flowchart + delegation) |
| Average Delay | 10% | Inverse of average days late, delayed items only |
| Task Completion Consistency | 10% | Stability of on-time rate over the last 3 months (low swings = high consistency) |
| Checklist Discipline | 10% | Checklist completion rate |
| Delegation Discipline | 10% | Delegated task on-time completion rate |
| Follow-up Discipline | 10% | CRM follow-up on-time rate (merchants only) |
| CRM Data Discipline | 5% | Share of leads updated in the last 14 days (merchants only) |
| Attendance Impact | 5% | **Reused directly from the Scoring Engine's manual Attendance KPI** — not a duplicate entry mechanism |
| Improvement Trend | 5% | This period's base index vs. the previous period's stored index |
| Manager Feedback | 5% | A manager's 1-5 rating for the period, scaled to 0-100 |

Verified live, by hand: an employee with components present at weights totaling 70 produced `68.19` (`(50×20+100×10+100×10+33.33×10+50×10+100×5+88×5)/70`); after a manager submitted feedback, the same employee's index recalculated to exactly `68.98` with the new weight total of 75 — both numbers checked against the raw component data, not just trusted.

**A component with nothing to evaluate is excluded, not scored as zero** — the same renormalization convention used everywhere else in this app.

## Manager Feedback — a genuinely new input

Nothing in this system captured a qualitative signal about how someone works until now. `POST /behaviour/feedback` is **manager-only** (the direct manager, or an HR/admin override) — the same authorization pattern as Delegation, reusing `EmployeeScopeService.authorizeManagerOnly()`. One rating per employee per period (resubmitting updates it rather than stacking duplicates). Verified live: a non-manager attempting to submit feedback for someone else's report was correctly denied with a 403.

## Health Scores — six views, six different scopes

- **Department Health**: average Behaviour Index across a department's employees.
- **Workflow Health**: on-time completion rate across all flowchart tasks.
- **Factory Health**: on-time submission rate and average delay minutes per factory department — a *behaviour* view (are entries submitted on time, consistently), distinct from the Scoring Engine's Factory KPIs, which measure output volume.
- **CRM Health**: aggregate follow-up discipline and data-update discipline across the whole CRM.
- **Merchant Health**: per-merchant follow-up discipline, pulled directly from each merchant's own Behaviour Index rather than recomputed separately.
- **Executive Health**: company-wide average, weighted by department headcount.

## Analytics
Top Performers, Bottom Performers, Most Improved, Most Delayed, Most Consistent, Repeat Defaulters, Repeated Delay Reasons, Department Comparison, and Historical (Behaviour) Trend — all computed live from real data. Two worth calling out:
- **Repeat Defaulters**: an employee who lands in the bottom 20% for at least 2 of the last 3 periods. Verified live: with thin test data (one employee having substantial history), this correctly and honestly flagged them, rather than being silently suppressed for looking odd on a small dataset.
- **Repeated Delay Reasons**: aggregates `factory_production_entries.delay_reason` — the *only* place in this entire system a genuine free-text delay-reason field exists. Flowchart and Delegation tasks only have general remarks, not a dedicated delay-reason field, and this is stated plainly rather than fabricating a reason field elsewhere.

## The Insights Engine — real rules, explicitly not AI

Six deterministic, threshold-based rules, all admin-configurable via `insight_rules` ("Everything configurable" per the spec):

| Rule | Generates |
|---|---|
| Productivity Drop | *"Assembly productivity reduced by 9%."* — factory department target achievement vs. prior period |
| Merchant Missed Follow-ups | *"Merchant A missed 6 follow-ups."* — count of late follow-ups per merchant |
| Department Declining | *"Department Quality is declining."* — department Behaviour Index down N points vs. prior period |
| Consistency Improved | *"Machine Shop consistency improved."* — factory on-time submission rate up vs. prior period |
| Repeat Defaulter | Flags an employee repeatedly landing in the bottom performer list |
| Delay Spike | Reserved for a future delay-frequency-spike rule (seeded, not yet wired to a check in this pass) |

Verified live: running the engine against real (if thin) test data produced two genuine, correctly-worded insights — a department-declining finding and a repeat-defaulter finding — both traceable back to the actual underlying numbers, not scripted text.

**`generateNarrativeSummary()` is the clearly marked, currently-inert seam for a future OpenAI (or similar) integration.** Today it's a plain-text concatenation of the rule-based findings — genuinely no AI model is called anywhere in this engine, per the explicit "do NOT integrate AI yet" instruction. When that integration happens, this is the one method that would change; everything upstream of it (the rules, the thresholds, the data) stays exactly the same.

## Bugs found and fixed during this build

**1. A self-inflicted schema contradiction.** `manager_feedback.submitted_by` was declared `NOT NULL` while its foreign key action was `ON DELETE SET NULL` — a direct contradiction MySQL correctly rejected at `CREATE TABLE` time. **Fixed** by making the column nullable, consistent with every other actor-attribution field fixed the same way earlier in this project (an admin override with no personal Employee Master record should still be able to act).

**2. A real logic bug caught by reading my own code carefully, not just testing it.** `ManagerFeedbackService.submit` used `authorizeManagerOnly()`'s return value as if it were the *acting manager's* employee record — but that method returns the *target* (the direct report being reviewed), not the actor. This would have silently recorded the wrong person as the feedback's author. **Fixed** by resolving the actor's own employee record separately (nullable, best-effort) for `submitted_by`, while still using `authorizeManagerOnly()` purely for its authorization check.

Both are documented in the README's running audit log.

## New permission keys
```
behaviour.index.view
behaviour.component.manage
behaviour.feedback.submit / .view
behaviour.insight.manage / .run
behaviour.health.view
```
7 new permissions, seeded and auto-synced onto System Admin.

## UI
My Behaviour Index (component breakdown), Behaviour Analytics (9-tab), Health Dashboards (6-tab), Executive Insights (findings + narrative + rule config), Manager Feedback (submission form + history), and Behaviour Components (admin weight editor) — six focused pages rather than one overloaded screen.

## Scope decisions
- No department-specific weight overrides for behaviour components (unlike the Scoring Engine's KPIs) — behaviour is measured as an individual pattern, not compared against a department-specific target, so a single global weighting was kept deliberately simpler.
- Consistency is computed live over the last 3 months rather than relying on this engine's own stored history, avoiding a chicken-and-egg problem on an employee's very first computed period.
- The "Delay Spike" insight rule is seeded and configurable but not yet wired to an actual check in this pass — a natural next addition using the same pattern as the other five rules.
