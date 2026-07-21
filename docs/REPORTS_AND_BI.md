# Reports & Business Intelligence

A dynamic reporting layer over data that already exists across every module in this system — **no new business data tables**. This migration only adds the metadata layer (saved filter sets, favourites, schedules, configurable widgets, run history); every report itself is a query reusing tables from Organization, Office Performance, Factory Performance, CRM, the Workflow Engine, and the Scoring Engine.

## Design: a fixed catalog, not an ad-hoc report builder

"Every module should automatically generate reports" was interpreted as **12 fixed, built-in report types**, each backed by a real query — the same "aggregate what's already there" philosophy as the CEO Command Center — rather than a general-purpose drag-and-drop report designer, which would have been a different (and much larger) product. Admins can save specific filter combinations, favourite them, schedule them, and pin them to a personal dashboard, but the underlying report *definitions* are fixed:

Employee Performance, Department Performance, Office Performance, Factory Performance, Workflow Reports, Checklist Reports, Delegation Reports, CRM Reports, Sales Pipeline, Merchant Performance, Production Reports, Executive Reports.

## One uniform result shape drives everything

Every report builder — regardless of what it reports on — returns the exact same shape:
```
{ reportType, title, generatedAt, filters, summary: [{label, value}], columns: string[], rows: cell[][], chartSeries: [{name, value}] }
```
This uniformity is what makes **one** export pipeline (Excel/CSV/PDF) and **one** frontend table+chart renderer work generically across all 12 report types, instead of 12 bespoke rendering paths. Verified live: `sales_pipeline`, `employee_performance`, and `executive_reports` all returned correctly-shaped, correctly-computed data through the identical code path — the sales pipeline's weighted forecast total (`38,500`) and the employee performance average score (`85.73`) were both checked against the underlying data.

## Filters
Date range, Department, Employee, Merchant, Buyer/Company, Customer, and Status — stored as JSON on saved/scheduled reports (since which filters apply varies by report type; a rigid column-per-filter schema would mean many always-NULL columns for most reports) and passed as query parameters when running or exporting a report live.

## Export: Excel, CSV, PDF — all genuinely real
- **Excel**: `xlsx`, a real two-sheet workbook (Summary + Data). Verified: `file` reports "Microsoft Excel 2007+".
- **CSV**: a real, correctly-quoted CSV file. Verified against actual report data.
- **PDF**: `pdfkit`, a real rendered PDF with the report title, summary stats, and a data table (paginated at 200 rows, with a note directing to Excel/CSV for the full dataset beyond that). Verified: `file` reports "PDF document, version 1.3".
- **Print**: implemented honestly as a frontend `window.print()` action, not a backend feature — there's nothing for a backend to generate for "print the page I'm currently looking at."

## Charts — all 7 requested types are real, not approximations
Built entirely on `recharts` (already in this app for the Scoring Engine and Command Center): Bar, Line, Area, and Pie are recharts' native components; **Treemap** and **Gauge** use recharts' actual `Treemap` and `RadialBarChart` components — genuinely supported, not faked; **Heat Map** is a colored grid (the same pattern already built for the CEO Command Center's Factory Heat Map, generalized here to work with any report's chart series). One shared `ReportChart` component renders all of them from the same `{name, value}[]` data shape.

## Saved Reports, Favourites, Scheduled Reports, Dashboard Widgets
All four verified live end-to-end:
- **Saved Reports**: a named filter+chart-type combination, reloadable with one click.
- **Favourites**: a lightweight pointer to a report type (optionally a specific saved report) for quick access.
- **Scheduled Reports**: daily/weekly/monthly, each with a computed `next_due_at`.
- **Dashboard Widgets**: a user's own configurable set of report+chart-type tiles, with drag-free reordering via an explicit reorder call (verified: adding two widgets, then reordering them, correctly swapped their `sort_order`).

## Scheduled reports: honest about having no job scheduler
Consistent with every other "scheduled" feature already built in this project (checklist generation, KPI scoring, notification escalation): there is no cron/job runner in this stack. `POST /reports/scheduled/run-due` computes and runs whatever is currently due — exactly as a real scheduled job would, just not on an actual timer. **It also reuses the Notification Engine** to raise a real in-app notification for the report's owner when their scheduled report runs — verified live: aging a scheduled report's due date and triggering the check produced both a `report_run_history` row and a genuine notification, another real cross-module integration rather than a fifth parallel delivery mechanism.

## Bug found and fixed during this build
**`JSON.parse()` on an already-parsed value.** MySQL's `JSON` column type is automatically deserialized into a JavaScript object by the `mysql2` driver — but `mapSaved`/`mapScheduled` called `JSON.parse(row.filters)` unconditionally, assuming it was still a string. This threw `"[object Object]" is not valid JSON` the moment a saved report or scheduled report was actually created against a live database. **Fixed** by checking the type before parsing (`typeof value === "string" ? JSON.parse(value) : value`), applied to both mapping functions; re-verified by creating a saved report, a favourite, and a scheduled report, all succeeding and correctly returning `filters` as a real object.

## New permission keys
```
report.view
report.view.company
report.export
report.schedule.manage
report.schedule.run
```
5 new permissions, seeded and auto-synced onto System Admin.

## UI
- **Reports Hub**: report type + chart type pickers, a filter bar (date range, buyer/customer/status), summary stat cards, the chart, a data table, and Excel/CSV/PDF/Print buttons plus Save/Favourite — all in one page, with a sidebar of previously saved reports for one-click reload.
- **Scheduled Reports**: create/pause/resume/delete schedules, with an explicit "Run Due Reports Now" action and an honest note that this system has no background scheduler.
- **My Dashboard**: add/remove personal widgets, each rendering its own live chart from the same `ReportChart` component used in the Hub.

## What's out of scope for this pass
- Report definitions themselves aren't user-configurable (no custom SQL, no arbitrary column selection) — only filters, chart type, and scheduling are.
- Scheduled report "delivery" is an in-app notification, not an emailed file attachment (no email integration exists anywhere in this system, consistent with the Notification Engine's documented channel limitations).
- Widget drag-and-drop repositioning isn't implemented visually in this pass; reordering is available via the API and could be wired to a drag handle in a future pass.
