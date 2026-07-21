# Performance Scoring Engine

An admin-configurable, unlimited-KPI scoring system that automatically computes every employee's weighted composite score — no human ever does the averaging math. This generalizes and extends scoring beyond the fixed 80/10/10 built for Office Performance Management, adding Factory KPIs, department-specific weight overrides, monthly/yearly history, ranking, and trend graphs.

**This is a second, separate scoring system alongside officeperf's existing dashboard score** — see "Two scoring systems" at the bottom for why both exist rather than one replacing the other.

---

## Honesty about data sources — the most important design decision here

The spec asked for 8 KPIs: Flowchart, Checklist, Delegation, Target Achievement, Quality, Attendance, Discipline, Reporting Timeliness. **Six of these have real underlying data already tracked elsewhere in this system and are computed automatically. Two do not — Attendance and Discipline have no time-clock or disciplinary-incident system anywhere in this app** — so fabricating an "automatic" calculation for them would mean inventing numbers from nothing. Instead:

| KPI | Calculation type | Real data source |
|---|---|---|
| Flowchart | `flowchart` (auto) | officeperf's flowchart task completion rate |
| Checklist | `checklist` (auto) | officeperf's checklist instance completion rate |
| Delegation | `delegation` (auto) | officeperf's delegated task completion rate |
| Target Achievement | `target_achievement` (auto) | individual worker output vs. quota (`production_entries`) |
| Quality | `quality` (auto) | rejection+rework rate on the employee's approved factory production entries |
| Reporting Timeliness | `timeliness` (auto) | share of factory production entries submitted the same day as the entry date |
| Attendance | `manual` | **no data source exists** — a person records the score |
| Discipline | `manual` | **no data source exists** — a person records the score |

"No manual calculation" is honored at the level that matters: **the weighted composite is always computed by the system, never by a human doing arithmetic.** A `manual` KPI still requires a human to supply its raw input (there being nothing else to derive it from) — but combining that input with everything else into the final score is 100% automatic, exactly like every other KPI. This is a deliberate, documented distinction, not a shortcut.

Admin can add unlimited new KPIs of any calculation type at any time via `POST /kpi-definitions` — the system isn't limited to these 8.

---

## MySQL schema

Four tables in `008_scoring_engine.sql`:

| Table | Purpose |
|---|---|
| `kpi_definitions` | Unlimited KPIs: name, category (office/factory), calculation type, default weightage, status |
| `kpi_department_weightages` | Per-department weight override for a KPI (unique per KPI+department) |
| `employee_kpi_scores` | One row per employee/KPI/period, with `weightage_used` **snapshotted** at computation time — a later change to a KPI's default weight never silently rewrites the meaning of historical scores |
| `employee_composite_scores` | The automatically-computed weighted composite per employee/period — this is what gets ranked and charted |

## How a composite score is computed

For an employee + period (e.g. employee X, monthly, 2026-07):
1. Load every **active** KPI definition.
2. For each, resolve the weight: the employee's department's override if one exists for that KPI, otherwise the KPI's global default.
3. Compute (or fetch, for `manual` KPIs) the raw 0–100 score.
4. **A KPI with nothing to evaluate in the period is excluded from both the numerator and the weight total** (not scored as 0) — same convention as officeperf's dashboard score, kept consistent on purpose. If literally no KPI had anything to evaluate, the composite is `null`.
5. Weighted average over the present KPIs, persisted (upserted) to `employee_composite_scores`.

Verified end-to-end against real data: an employee with Checklist (0%, weight 10), Delegation (100%, weight 10), and Target Achievement (91.67%, weight 20) — with Flowchart/Quality/Timeliness/Attendance/Discipline all `null` (nothing due/no data) — produced exactly `(0×10 + 100×10 + 91.67×20)/(10+10+20) = 70.84`. Recording a manual Attendance score of 88 immediately and correctly shifted it to 74.27. Setting a department-specific Delegation weight override of 50 (up from the default 10) immediately and correctly shifted it to 85.70 — all three numbers checked by hand against the actual API response.

## Scores are recomputed on every read, not cached
There's no job scheduler in this stack (documented tradeoff carried over from checklist instance generation). `GET /scores/me`, `/scores/employees/:id`, and every ranking endpoint **recompute from live activity data on every call** rather than serving a stale cached figure. This is correct but not free — ranking all employees for a period means recomputing every one of their composite scores in that single request. Acceptable at the scale this system has been tested at; a real production deployment with hundreds of employees would want to cache computed scores and only recompute on a schedule or on relevant data changes.

## Ranking & Trend

- **Top / Bottom Performers**: `GET /scores/rankings/top-performers` and `.../bottom-performers`, both accepting `periodType`, `periodKey`, `limit`. Employees with no score (`null`) are excluded from ranking entirely, not sorted to the bottom.
- **Department Ranking**: `GET /scores/rankings/departments` — averages each department's scored employees, ranked descending.
- **Trend**: `GET /scores/me/trend` (self) or `/scores/employees/:id/trend` (override), returning the last N periods' composite **and** per-KPI scores, for charting. The frontend renders this with `recharts` as a real line chart, not a placeholder.

All verified live: top/bottom performer ordering, department averaging (correctly excluding an employee with no department), and a 3-month trend correctly showing `null` for months with no activity and the real computed score for the current month.

## Bugs found and fixed during this build

**SQL comment-splitting bug in the migration/seed runner.** `migrate.ts` and `seed.ts` both split `.sql` files into statements by looking for semicolons — but neither stripped `--` comments first. This migration's own header comment contained a semicolon in ordinary prose ("...tracked elsewhere in this system;"), which the naive splitter mistook for a statement terminator, silently truncating the `CREATE TABLE kpi_definitions` statement and producing a syntax error. Found immediately when running this migration against a live database. **Fixed** by stripping full-line `--` comments before splitting, in both runners; re-verified the migration applies cleanly.

**Manual score entry incorrectly required the acting admin to have their own Employee Master record.** The exact "override-permission holder with no employee link" class of bug this project fixed once before in `EmployeeScopeService`, recurring here because `recordManualScore` independently called `requireEmployeeForUser` instead of reusing the established nullable pattern. **Fixed** by making the acting employee ID optional (`entered_by` is nullable) and separating it from the audit log's `actorUserId` (which must always be the real login user ID, not an employee ID — a related consistency bug fixed in the same pass). Re-verified: an admin with the `kpi.score.manual_entry` permission but no personal employee record can now record scores.

## New permission keys
```
kpi.definition.view / .create / .update / .delete
kpi.weightage.manage
kpi.score.manual_entry
kpi.score.view
kpi.ranking.view
```
8 new permissions, seeded and auto-synced onto System Admin.

## React UI
- **KPI Definitions** (admin) — create/edit/deactivate KPIs, inline default-weight editing, and a department-override control per KPI. Shows a running total of active KPI weights with a gentle (non-blocking) warning if it doesn't sum to 100%, since renormalization means the engine handles that gracefully either way.
- **My Score** — overall score card, full KPI breakdown (raw score + weight actually used), and a 6-month trend line chart.
- **Rankings** — tabbed Top Performers / Bottom Performers / Department Ranking.

## Two scoring systems — why both exist
| | officeperf Dashboard Score | This Scoring Engine |
|---|---|---|
| Windows | Today / Week / Month (rolling) | Monthly / Yearly (fixed periods, historical) |
| Weights | Fixed 80/10/10, hardcoded | Unlimited KPIs, admin-editable, department-overridable |
| Categories | Office only (Flowchart/Checklist/Delegation) | Office **and** Factory |
| Purpose | Day-to-day self-service visibility | Formal performance review, ranking, trend analysis |
| Ranking | None | Top/Bottom performers, department ranking |

They weren't merged because the dashboard score's real-time, always-on-3-fixed-categories design is exactly right for its purpose (quick daily visibility) and rewriting it to be "unlimited KPIs" would have made simple daily numbers slower and more complex for no benefit to that use case. The new engine is what a manager or HR admin uses for formal monthly/yearly review and ranking.

## Known limitation
The production frontend bundle is now ~823KB (up from ~465KB) after adding `recharts` (trend charts) and the earlier `reactflow` (workflow flowcharts) — Vite warns about this at build time but it isn't a broken build. Code-splitting these two libraries into separate lazy-loaded chunks would be the natural next optimization; not done in this pass since correctness took priority over bundle size at this stage.
