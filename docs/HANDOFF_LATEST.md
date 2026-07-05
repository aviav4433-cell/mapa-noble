# MAPA-NOBLE — Session Handoff (LATEST — updated 2026-07-05, end of session 3)

**This is the single up-to-date handoff. Ignore any older handoff files. Read `CLAUDE.md` (repo root) first, then `docs/WORK_ORDER_2026-07-05.md`, then this.**

## Current state

- **Phase A (Tasks 4, 5, 8, 9): DEPLOYED and VERIFIED** (delivery/return modals, visual hierarchy, global double-submit guard).
- **Phase B (Task 3, long texts): DEPLOYED and VERIFIED** (smart truncation, `getFullTexts`, `ensureFullTexts`; see previous handoff notes — the critical invariant still holds: always fetch full text before rendering an edit form for notes/tasks/meetings/task_comments, otherwise saving overwrites the full text with the 300-char preview).
- Server: **v2.6, batch G1** (~1,350 lines). NOT in the repo. **Avi attaches the current Code.gs at session start** — if missing, ask before touching the server.
- Frontend version label on login screen is the deployment canary — bump it on every frontend deploy.

## Phase C — DESIGN APPROVED BY AVI (session 3). All open questions CLOSED:

1. **Stages (NOBLE flow):** התקבל → בכביסה → בייבוש → בגיהוץ וקיפול → באריזה → מוכן → במשלוח → נמסר. Weighing happens at the packing stage. **Do NOT touch the existing `STAGES` array** (MAPA rental-wash flow, regression-protected) — define a separate constant for the NOBLE flow.
2. **Portal time-remaining:** historical averages per stage + manual override.
3. **Billing on weighing:** creates a **billable line** (not an auto-invoice); invoices are issued later, consolidated.
4. **Floor worker identity:** new restricted role "עובד רצפה" — sees only his own stuff (attendance, payroll, tasks assigned to him — task text only, no tags/links of others), can add notes/comments.
5. **Floor devices — BOTH modes:** (a) personal phone, logged into the worker's own account, camera scanning; (b) **dedicated shared tablet mode with mandatory worker identification (badge scan or personal code) before each use** — so speed scoring attributes correctly.
6. **Driver scan:** creates a REAL delivery record in the existing deliveries module.
7. **MAPA internal washes:** counted in machine utilization / weights / floor metrics, but **excluded from revenue**. Every relevant screen/report gets a show/hide filter for internal washes (so Avi can see commercial-only revenue and per-machine monthly kg with or without internal).

## Phase C — approved data model

- **New tables (3):** `laundry_intakes` (one batch per customer; customer link, internal-MAPA flag, status, net weight, total charge, intake/delivered timestamps), `intake_carts` (intake↔cart binding with bind/release times), `laundry_events` (append-only journal — the heart: stage, start/end event type, worker, cart, machine, weight, tare snapshot, price-per-kg snapshot at weighing, charge). Derive all state from the log; never mutate history.
- **Existing-table additions:** customers + price-per-kg field; carts + tare weight (and carts screen updated); machines + auto-stage + barcode (scan machine ⇒ stage inferred automatically; worker never picks a stage).
- Greenfield build per the work order: zero code reuse from `docs/legacy_noble_portal.html` (it is the requirements reference only). Native to the ERP: single `doPost` router, `TABLES` registry, token auth, LockService/audit discipline; new write actions must NOT be added to `READ_ONLY_ACTIONS`.

## Phase C — delivery plan (approved): three batches

1. **Batch C1:** new tables + all server logic + intake screen + floor work screen (phone + tablet mode).
2. **Batch C2:** live production board + portal upgrade (current stage + estimated time remaining by historical averages) + dashboard alignment (Task 2).
3. **Batch C3:** billing wiring (billable line at weighing), worker speed scoring/leaderboard, machine utilization dashboard (3 metrics: 05:00–17:00 window; first-start→last-stop; relative to busiest=100%). Internal-wash filter across all of it.

**Testing requirement (Avi's explicit request):** at minimum a basic end-to-end flow test run locally against the server logic with mock data (intake → cart bind → all stages in/out → weigh with tare subtraction and per-kg price → billable line → driver scan → delivered), in the style of the existing integration tests. Manual live-site checklist for Avi after each deploy, in Hebrew.

After each batch: syntax check both files, status table, full Code.gs replacement file + deployment steps in Hebrew.

## Next steps (in order)

1. Execute Batch C1 (nothing coded yet — design only was approved).
2. The second half of the v5.1 fixes table has still not been sent — Avi will send it separately; merge when it arrives.
3. Phase D only after all of Phase C is verified.

## Session hygiene (Avi's standing request)

Monitor conversation size. When the context grows heavy, proactively tell Avi — in Hebrew, one short sentence — to open a fresh chat, and give him the exact opener message. Note: Avi is also watching his plan's usage limits — keep responses lean.

## Communication reminders

All Avi-facing text in Hebrew, simple, step-by-step, no jargon. Full-file replacements only for Code.gs. Status table at every checkpoint. Manual test checklist in Hebrew after every deploy.
