# User Manual

A practical guide to using LII Performance Nexus day to day. For setting up the system itself, see `INSTALLATION_GUIDE.md`; for admin-only configuration (roles, permissions, KPI definitions, etc.), see `ADMIN_MANUAL.md`.

## Logging in

Go to the app URL, enter your email and password. If you don't have a login yet, ask your admin — see `ADMIN_MANUAL.md` for how new users are created.

If you're evaluating the system with the built-in demo data, see `TESTING_CHECKLIST.md` for the seven test logins covering every role.

## Your Dashboard and Notifications

The bell icon in the header shows your unread notification count and a dropdown of recent ones — click any notification to jump straight to what it's about (a task, a document, a lead). "Mark all read" clears the count. The full Notification Center (left navigation) shows your complete history with filters by module and read state.

Notifications arrive for things like: a task delegated to you, a workflow stage assigned to you, a CRM lead assigned or won/lost, a document nearing expiry, or a scheduled report becoming ready. If a task assigned to you isn't completed by its due date, you'll be automatically escalated to your manager — that's not a bug, it's the built-in escalation ladder.

## Office Performance

**Flowchart tasks**: if your manager has assigned you a stage in a workflow run, it appears in your task list with a due date. Mark it complete when done.

**Checklists**: recurring checklists (daily/weekly/monthly) assigned to your role or department appear automatically each period — check off each item as you complete it.

**Delegation**: tasks your manager delegates to you appear in your Delegation list with a priority and due date. This is the same list that Executive Meeting action items and other modules feed into — one place to see everything assigned to you, regardless of where it originated.

## Factory Performance (Supervisors)

If you're a factory supervisor, you submit daily/shift production entries: target vs. actual quantity, CBM, labour hours, and any delay with a reason. Entries go through a fixed two-step approval (you submit, a Production Head approves or rejects) — only approved entries count toward performance reports, so if something looks off after approval, ask your Production Head to review it again.

## CRM (Merchants)

Your assigned leads appear in the Leads list. Each lead moves through a 12-stage sales pipeline (New Inquiry → ... → Order Won/Lost). Log follow-ups as you make them — the system tracks whether each one was on time, which feeds directly into your own Merchant Score. Missing follow-ups is one of the things Executive Insights specifically flags.

## Reports

The Reports Hub lets you pick from 12 report types (Employee Performance, Department Performance, Factory Performance, Sales Pipeline, and more), apply filters (date range, department, status, etc.), and view the result as a table or one of 7 chart types. Export to Excel, CSV, or PDF, or use your browser's print function directly. Save a filter combination for one-click reuse, mark favourites, or set up a recurring schedule so a report is regenerated automatically and you're notified when it's ready.

## My Behaviour Index

Separate from your performance score, this measures **how** you work: on-time completion, consistency, delay patterns, and (if your manager has submitted it) their qualitative feedback. It updates automatically from your real activity — there's nothing to fill in yourself except accepting your manager's feedback when given.

## Executive Meetings

If you're invited to or organizing a meeting (Daily Production / Weekly Executive / Monthly Management Review / Quarterly Review), you can record the agenda, discussion notes, decisions, and action items. Any action item assigned to you shows up in your own Delegation list automatically — same reminders and escalation rules apply. Minutes of Meeting (MOM) can be viewed on-screen or exported to PDF at any time, including a "carried forward" section listing anything still pending from the previous meeting of that same type.

## Documents

Browse by category (SOPs, Drawings, Work Instructions, QC Formats, Policies, Contracts, Buyer Documents, Machine Manuals, Training Videos), search by title or tag, or find documents linked to a specific employee, machine, product, department, workflow, or CRM lead. PDFs and images preview inline. If a document is marked confidential, you'll only see it if you've been granted that specific permission — ask your admin if you believe you should have access.

Uploading a new version resets a document's approval status — even a previously-approved document needs its replacement reviewed again before staff should treat it as current.

## KPI Engine

If you're responsible for a KPI (visible under KPI Engine → your assigned KPIs), you enter the period's Target and Actual numbers yourself — the system computes the score and traffic light (🔴🟡🟢) from a formula your admin configured. You don't need to do any math; just enter the two raw numbers.

## Getting help

If a page shows a permissions error, that's usually correct behavior, not a bug — your role may not include that capability. Ask your admin, who can adjust it in seconds without any code change (see `ADMIN_MANUAL.md`). If something looks genuinely broken, note exactly what you clicked and what happened, and pass it to your admin or IT contact.
