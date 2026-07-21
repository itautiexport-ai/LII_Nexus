# CEO Command Center

A single, answer-oriented view over data that already exists across every module built in this project — **no new database tables**. This is deliberately a pure aggregation layer, not a new business system: every number on this page traces back to a table built for Organization, Office Performance Management, Factory Performance Management, the Workflow Engine, or the Scoring Engine.

The design goal, per your framing: **this is not a dashboard, it's an answer to "what requires my attention?"** — critical alerts and delayed items are surfaced first, not buried under vanity metrics.

---

## Sections, and where each number actually comes from

| Section | Data source | Notes |
|---|---|---|
| **Business Health** | Scoring Engine — average composite score across all scored employees, current month | Sample size (`employeesScored`) travels with the average, since "92% across 2 people" means something very different from "92% across 200" |
| **Production Health** | `factory_production_entries`, current month, **all statuses** (not just approved) | Deliberately includes submitted/rejected entries too — this section answers "how is the floor doing overall," not just "how much got approved" |
| **People Health** | Active employee count + Scoring Engine composite scores | "At risk" = composite score < 50%, a judgment-call threshold, documented as such |
| **Department Health** | Scoring Engine's department ranking, reused directly | Same data as the Rankings page's Department tab |
| **Order Health** | `workflow_runs` status counts + distinct `order_reference` status counts from factory entries | "Order" spans both concepts in this system — a workflow run and a factory production order — both counted |
| **Delayed Tasks** | `flowchart_tasks` + `delegated_tasks`, company-wide, past due date, not completed | Same "delayed" definition used everywhere else in this app: assigned, open, past due |
| **Delayed Orders** | Workflow runs still `in_progress` with at least one delayed task inside them | A run is "delayed" if *any* stage in it is stuck, not just the current one |
| **Delayed Production** | Factory entries either unreviewed >2 days after their entry date, or recording >60 minutes of floor delay | Both thresholds are judgment calls, called out as such in code comments — not universal truths |
| **Critical Alerts** | A small, bounded rules engine (see below) | Not a general-purpose rules configuration UI — a fixed handful of conditions leadership would actually want surfaced |
| **Top / Bottom Performers** | Scoring Engine ranking, top/bottom 5 | Same underlying data as the Rankings page, reused directly rather than recomputed independently |
| **Factory Heat Map** | Per-department target achievement % minus defect % (approved entries, current month) | A department hitting its quantity target while producing a lot of rejects does **not** show green — the heat map blends both, not just raw output |
| **Weekly Trends** | Flowchart + delegation completion rate, last 6 ISO weeks | The Scoring Engine only stores monthly/yearly history (no weekly period), so this is computed fresh from raw task data rather than reusing stored scores |
| **Monthly Trends** | Company-wide average composite score, last 6 months, via the Scoring Engine | Reuses the same ranking computation as Business Health, just repeated per historical month |
| **AI Placeholder** | Nothing — `available: false` | Genuinely inert. No AI integration exists anywhere in this system. This is reserved UI space with an honest message, not a simulated insight. |

## The critical alerts rules engine (current rules)
- Any employee scoring below 50% this month → critical
- Any department averaging below 50% this month → critical
- Any workflow run with an overdue stage → warning
- Any production entries rejected this month → warning
- Factory-wide defect rate (rejection + rework ÷ actual) above 10% this month → critical

These are hardcoded thresholds, not admin-configurable in this pass — a natural next step would be moving these into the Scoring Engine's KPI framework (e.g., an "alert threshold" field per KPI), but that wasn't built here to keep this pass scoped to aggregation, not a new rules-configuration system.

## Drill-down
Every section is clickable and navigates to an **already-built page** in this app rather than duplicating detail UI:
- Business Health / Top/Bottom Performers / Department Health → Rankings page
- Production Health / Factory Heat Map / Order Health (factory) → Factory Production Entries page
- People at Risk → Employees page
- Delayed Tasks → Delegation page
- Delayed Orders → the specific Workflow Run's detail page (Flowchart)
- Order Health (workflow runs) → Flowchart Runs list

This was a deliberate choice: building 15 new detail views would have meant either shallow duplicates of pages that already exist, or a much larger scope than "aggregate what's already there and let people click through to the real thing."

## Verified live
Every section was checked against real data end-to-end, including the arithmetic: production health's target achievement (`470/700 actual÷target = 67.14%`) and defect rate (`7 defects/470 actual = 1.49%`) were both hand-verified against the exact test data in the database. Permission gating (`commandcenter.view`) was confirmed to correctly return `403` for a user without it.

## Performance note
`GET /command-center/overview` recomputes company-wide scores multiple times internally (once for the current-month ranked list reused across Business/People Health and Top/Bottom Performers, then separately for each of the last 6 months' Monthly Trend). This was optimized once already during this build (the current-month computation used to run 3 separate times before being consolidated into one shared call) but the 6-month trend is inherently 6 separate historical computations — there's no caching layer anywhere in this scoring system, a tradeoff documented since the Scoring Engine was first built. Fine at this project's tested scale; a real deployment with hundreds of employees would want to cache computed period scores.

## Dark / Light mode
Implemented as a self-contained toggle scoped to this page (not a global app-wide theme retrofit — the rest of this large app uses fixed inline colors, and rewriting every existing page's theming was out of scope for what was actually requested: dark/light mode *for the Command Center*). Persisted to `localStorage` so it remembers your preference between visits. Every color on the page — including the heat map and health-status indicators — is driven by a small theme token object, not hardcoded hex values, so the two modes stay visually consistent.

## Responsive layout
Built entirely with CSS Grid `repeat(auto-fit, minmax(Npx, 1fr))` rather than JavaScript-driven breakpoints — cards naturally reflow from a single column on a phone to 3–4 columns on a large monitor with no media-query logic to maintain. This was a deliberate simplification: it's more robust than hand-rolled breakpoints and requires no window-resize listeners.
