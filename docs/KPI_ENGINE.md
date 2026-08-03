# KPI Engine

A configurable KPI Engine where **admin creates KPIs without coding** — deliberately separate from the Performance Scoring Engine built earlier in this project, which is a genuinely different mechanism.

## Why this is a new module, not an extension of the Scoring Engine

The existing Performance Scoring Engine's KPIs are backed by fixed, hardcoded `calculation_type` dispatch (`flowchart`, `checklist`, `crm_followup_discipline`, etc.) — adding a new KPI type there means writing a new case in `ScoringEngineService`. That's a real, deliberate design for KPIs whose data already lives somewhere else in this system.

This request asks for something else: **a formula field, typed by an admin, with no code change required** — and it explicitly wants Purchase, Quality, and HR categories, none of which have any automated data source anywhere in this system (no Purchasing module, no dedicated HR/leave module). The natural, honest design for both requirements at once: every KPI here is fed by **manually entered Target and Actual values per period**, and a small **admin-typed arithmetic formula** computes the score from them. This is the same reasoning that kept the Behaviour Index separate from the Scoring Engine earlier — different mechanism, different module, clearly cross-referenced rather than silently overlapping.

## The formula evaluator — the safety-critical core of this feature

`KpiFormulaEvaluator` is a small, hand-written recursive-descent arithmetic parser. **It never calls `eval()` or `new Function()`.** A formula may only contain digits, a decimal point, the two variables `target` and `actual`, the four arithmetic operators, parentheses, and whitespace — anything else is rejected before it's ever stored, with a specific, honest error naming exactly what was wrong.

Verified live, against every boundary that matters for a feature that executes admin-supplied text:
- **Code injection attempt** (`process.exit(1)`) → rejected: `Unknown term "process" in formula.`
- **Disallowed syntax** (semicolons, `require(...)`) → rejected: `Formula may only contain numbers, target, actual, + - * / ( ) and whitespace.`
- **Unknown variable** (`revenue/cost`) → rejected: `Unknown term "revenue" in formula.`
- **Division by zero** → rejected at evaluation time with a clear message, not a silent `Infinity` or `NaN` propagating into a score.
- **Mismatched parentheses** → rejected as a syntax error.
- **A genuinely valid formula** (`actual/target*100`) → accepted, and test-evaluated with sample values (target=100, actual=90 → 90) so an admin can see what it computes *before* saving it.

Formulas are re-validated on every update, not just at creation — a KPI can never end up with a formula that wasn't checked against the whitelist.

## Every requested field, present and admin-editable
Name, Formula, Weightage, Target, Actual, Frequency (daily/weekly/monthly/quarterly/yearly — independently chosen per KPI, unlike the Scoring Engine's fixed monthly/yearly), Responsible Person, Department — plus per-KPI Green/Amber traffic-light thresholds, since "Everything configurable" was explicit in the request.

## Traffic Light — verified against real thresholds, not just described
Green/Amber/Red bands are set per KPI (defaults 90/70, both editable). Verified live: an entry scoring 95 against a 90-green threshold correctly returned `green`; an entry scoring 60 against a 70-amber threshold correctly returned `red` — computed and stored at entry time, not derived ad hoc later.

## Score Calculation — Department, Employee, Company
All three are a weighted average of the *current period's* entry for each relevant active KPI (each KPI's own frequency determines what "current period" means for it). A KPI with no entry yet for its current period is **excluded from the average, not treated as zero** — the same renormalization convention used consistently by the Scoring Engine and the Behaviour Index throughout this project. Verified live: a company score correctly averaged only the one KPI with a current-period entry, explicitly reporting `1 of 2 KPIs scored` rather than silently penalizing the KPI still awaiting its first entry.

## Dashboard, History, Trend
The dashboard shows the traffic-light distribution across all active KPIs' current periods, the company score, and a list of KPIs still awaiting an entry this period (clicking through takes you straight to record one). History and trend pull every past entry for a KPI, charted with reference lines at its own green/amber thresholds so a look at the graph tells you when it crossed into trouble, not just what the raw numbers were.

## This is the third consecutive module to ship its schema clean on the first migration attempt
`responsible_employee_id`, `department_id`, and `entered_by` were all designed nullable from the very first draft — the same lesson, applied a third time running, after the Executive Meeting Engine and Document Management System both benefited from it. The entire feature set — formula validation at every one of its safety boundaries, score computation, traffic-light thresholds, history, dashboard aggregation, and self-service employee scoring — passed live testing with zero fixes required.

## New permission keys
```
kpiengine.definition.view / .manage
kpiengine.entry.manage
kpiengine.score.view
```
4 new permissions, seeded and auto-synced onto System Admin.

## UI
KPI Definitions (the no-code creation form, with a live "Test Formula" button showing a sample score before saving), a KPI Detail page (record this period's Target/Actual, trend chart with threshold reference lines, full history), a Dashboard (traffic-light counts, pending entries), and a Scores page (Company/Department/Employee tabs).

## What's intentionally out of scope
- No department-level weight overrides (unlike the Scoring Engine) — a KPI's weightage is global, keeping the no-code creation flow simple.
- Purchase and HR KPIs are, by design, entirely manual-entry — there's no automated pipeline behind them because none exists anywhere in this system; that's the honest state of things, not a gap in this feature.
