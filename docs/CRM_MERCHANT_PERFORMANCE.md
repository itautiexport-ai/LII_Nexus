# CRM & Merchant Performance Management

A CRM for Laxmi Ideal Interiors covering export/domestic leads, hotel-restaurant-project inquiries, buyer agent leads, trade fair/WhatsApp/email/website leads, and repeat customer inquiries — plus merchant (salesperson) performance measurement.

**Merchant Score is not a new scoring system.** It's built as 5 new KPIs plugged into the existing Performance Scoring Engine (a new `crm` category alongside `office`/`factory`), so it inherits the same weighted composite, department overrides, ranking, and trend infrastructure already built and tested — rather than a second, parallel scoring mechanism.

---

## Sales stages and status — two different fields, one auto-sync rule

The 12 requested stages are tracked in `sales_stage`; the 5 requested statuses (Active/Won/Lost/Dead/Dormant) are tracked separately in `status`. Moving a lead to `order_won` or `order_lost` **automatically** sets `status` to `won`/`lost` — verified live: `PATCH` a lead's `salesStage` to `order_won`, and `status` flips to `won` in the same response, with no separate status update needed. The single combined "Dead / Dormant" stage doesn't auto-resolve a status (the spec keeps those as two distinct statuses), so an admin sets Dead vs. Dormant manually when a lead reaches that stage.

## Weighted Forecast — always computed, never entered
`weighted_forecast = forecast_amount × win_probability ÷ 100`, recalculated on every create/update, exactly like the Scoring Engine's composite scores — nobody types this number in. Verified: a lead with forecast 50,000 and win probability 60% produced a weighted forecast of exactly 30,000, both on creation and after a later field edit.

## Delay Days — derived, never stored
Same convention used everywhere else in this app: `delay_days` is computed live (today − `next_follow_up_date`, only for `active` leads), not a column that could go stale.

## Follow-ups: one field on the lead, a full history in a separate table
`crm_leads.next_follow_up_date` is always "the current pending one." Logging a new follow-up (`POST /crm/leads/:id/followups`) does two things atomically: it completes whatever follow-up was previously pending (marking it `on_time` or late based on today's date vs. its due date) and opens a new one. `crm_lead_followups` is the full history — the only way to actually compute "follow-ups completed on time" vs. "delayed follow-ups" per merchant, which a single date field could never answer.

## Access control: self-only-or-override, not manager-of
Deliberately simpler than the manager-of pattern used for Delegation/Goals elsewhere in this app: **a merchant's own leads are always visible/editable; anyone else's require `crm.lead.view` / `crm.lead.update`.** A CRM lead assignment isn't an org-chart relationship — it's direct ownership. Verified live: the assigned merchant sees their lead and its full follow-up history; an unrelated employee with no override permission gets a clean `403`.

## Merchant Performance Metrics
All computed live via `GET /crm/merchant-metrics/me` (self) or `/crm/merchant-metrics/:merchantId` (override), matching the requested list exactly:

| Metric | How it's computed |
|---|---|
| Leads assigned / Active / Won / Lost / Dead | Direct counts, grouped by `status` |
| Follow-ups due / completed on time / delayed | From `crm_lead_followups` history |
| Forecast value / Weighted forecast value | Summed over the merchant's *active* leads only |
| Conversion % | Won ÷ (Won + Lost) |
| Average response time | Average days between `inquiry_date` and the first follow-up ever logged |
| Lead ageing | Average days since `inquiry_date`, active leads only |
| Merchant Score | Pulled directly from the Scoring Engine's composite score for that employee |

## The 5 Merchant Score KPIs (seeded into the Scoring Engine)

| KPI | Default weight | What it measures |
|---|---|---|
| Follow-up Discipline | 30% | % of follow-ups completed on or before their due date, in the scoring period |
| Lead Conversion | 25% | Won ÷ (Won + Lost), closed in the scoring period |
| Pipeline Value | 20% | Average win probability across currently active leads — a real, directly computable proxy for pipeline health without needing an arbitrary sales target |
| Delay Control | 15% | Share of active leads that are *not* currently overdue for follow-up |
| Data Update Discipline | 10% | Share of assigned leads updated within the last 14 days |

Like every other KPI in this system: admin-editable weights, department-overridable, and a KPI with nothing to evaluate in a period is excluded from the composite (not scored as 0). Because these are just KPIs in the same engine, a merchant's Merchant Score can — and, in testing, does — blend with any Office/Factory KPIs also assigned to that same employee, if they hold multiple roles. That's intended behavior of a shared engine, not a leak between systems.

## Excel Import / Export
- **Export** (`GET /crm/leads/export`, needs `crm.lead.export`): every core CRM field, one row per lead, a real `.xlsx` workbook (verified: `file` reports "Microsoft Excel 2007+").
- **Import** (`POST /crm/leads/import`, needs `crm.lead.import`, multipart `file` field): strict validation — every row is checked before *any* row is written; a single invalid `leadSource` or missing required field rejects the whole file with the exact row number and reason, rather than silently skipping bad rows or partially importing.

## The 7 CRM Dashboards
All under `/crm/dashboards/*`, gated behind `crm.dashboard.view`:
1. **CEO CRM** — company-wide status breakdown, active leads by category, count of overdue follow-ups.
2. **Merchant** — every merchant's full metrics table side by side, sorted by Merchant Score.
3. **Lead Source** — volume and conversion % per channel (trade fair/WhatsApp/email/website/referral/other).
4. **Export vs Domestic** — the two buckets compared head to head on volume, win/loss, and forecast.
5. **Follow-up Delay** — the full list of currently overdue leads, plus an overdue-vs-total breakdown per merchant.
6. **Forecast Pipeline** — every active lead's forecast and weighted forecast, grouped by sales stage.
7. **Won / Lost Analysis** — win/loss counts and won value, broken down by category × source.

## Bugs found and fixed during this build (four real ones)

**1. `created_by`/`logged_by`/`uploaded_by` were `NOT NULL` foreign keys to `employees`.** The fourth occurrence of this exact bug class in this project (conflating a login user ID with the employee ID it should resolve to) — an admin with no personal Employee Master record couldn't create a lead, log a follow-up, or attach a file at all, failing with a foreign key violation on the very first live test. **Fixed** with migration `011_crm_nullable_actor_fks.sql`, relaxing all three to nullable — these are audit-attribution fields, not access-control fields.

**2. That same fix immediately broke lead retrieval.** `WITH_CONTEXT_SELECT` used an `INNER JOIN` on `created_by`, so once that column could legitimately be `NULL`, every lead created by an unlinked admin vanished from `GET /crm/leads/:id` and the list endpoint entirely (silently — no error, just a `404`/empty result). **Fixed** by changing it to a `LEFT JOIN`; caught immediately because the exact same lead that had just been created successfully returned "not found" two calls later.

**3. `DELAYED` is a MySQL reserved word** (legacy `INSERT DELAYED` syntax) — used as a raw column alias in two different places (`MerchantMetricsService` and the Scoring Engine's new `crm_delay_control` calculator), both failing with a SQL syntax error the first time either was actually queried, not caught by any static check. **Fixed** by renaming both aliases to `delayed_count`.

**4. Bulk Excel import generated duplicate lead codes.** `bulkImport` originally computed *all* rows' lead codes upfront (looping over `nextLeadCodeSequence()`, a `COUNT(*)`) before inserting any of them — since none of the batch's own rows were in the database yet, every row in a multi-row file received the identical "next" code, and the second row's insert failed on a duplicate-key violation. Caught by testing with a real 3-row file, the exact scenario a real user would hit immediately. **Fixed** by generating each code immediately before inserting that row (interleaved, not pre-batched), so the count genuinely reflects prior rows in the same import; re-verified with the same 3-row file producing three genuinely sequential, unique codes.

All four are documented in the project README's running audit log alongside every other bug found across this project's build history.

## New permission keys
```
crm.lead.view / .create / .update / .delete / .assign / .import / .export
crm.dashboard.view
```
8 new permissions, seeded and auto-synced onto System Admin.

## UI
Deliberately plain — white background, grey borders and muted text, no dark theme — per the "professional, clean, white/grey" requirement, distinct from the CEO Command Center's dark-mode-capable styling. Leads list has search, 4 filters (status/source/category/overdue-only), and pagination; the detail page groups Pipeline/Forecast/Ownership into cards with inline-editable fields; the dashboard page is a 7-tab layout matching the pattern already established for other multi-view dashboards in this app.

## What's out of scope for this pass
- No real file storage behind attachments (filename + URL only, same documented limitation as every other file-upload feature in this app).
- No automatic reminder/notification when a follow-up becomes overdue — visibility is via the Follow-up Delay dashboard and the lead list's overdue filter, not a push notification.
- Import only creates new leads; there's no update-existing-lead-by-code import mode in this pass.
