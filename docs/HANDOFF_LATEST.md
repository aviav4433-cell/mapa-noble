# MAPA-NOBLE — Session Handoff (LATEST — updated 2026-07-05, end of session 5)

**Single up-to-date handoff. Ignore older ones. Read `CLAUDE.md` first, then `docs/WORK_ORDER_2026-07-05.md`, then this.**

## Current state

- **Phases A + B: DEPLOYED and VERIFIED.** G1 long-text invariant still holds (always fetch full text before rendering an edit form for notes/tasks/meetings/task_comments).
- **Phase C, Batch C1: DEPLOYED.** Avi ran the happy-path checks quickly and they passed; deep manual testing deferred by his decision until Phase C is complete.
- **Phase C, Batch C2 (live board + portal + dashboard): CODE COMPLETE 2026-07-05, syntax-checked + logic smoke-tested (Node GAS mock), approved by Avi, deployment by Avi in progress/likely done.** Verify version labels at session start: frontend **v5.4** (login screen), server **v2.8** (header comment).
- Server: **v2.8 (batch NC2)**, ~1,794 lines. NOT in repo — Avi attaches Code.gs at session start; if missing, ask before touching the server. No new sheets in C2 → `setupDatabase()` NOT required for it.

## What Batch C2 delivered (on top of C1)

- **Server:** read-only action `nobleBoard` (in READ_ONLY_ACTIONS) returning: active intakes with per-cart progress (done stages / open stage / machine / open_ts), weigh rollup, `eta_min`; machines with busy-info; stage averages; today stats (events, kg, opened, delivered). Helpers: `nobleStageAvgs` (avg minutes per stage from התחלה→סיום pairs, 1–1440 min sanity window; manual override via settings key **`noble_eta_override`**, format `בכביסה=45,בייבוש=30`; fallback 60 min), `nobleCartProgress`, `nobleEtaMin` (open stage counts half; intake ETA = slowest cart). `portalGetData` now also returns `laundry` (last 10 intakes: status, eta_min, net, charge).
- **Frontend v5.4:** floor view has third tab **'board' (לוח חי)** — auto-refreshes every 60s via plain `api` (not apiBusy) with VIEW/FLOOR_TAB guards; manager-only ETA override editor saving via `updateSetting`. Dashboard: `nobleDashCard` (computed locally from DB, shown only if any intake exists). Portal: "הכביסה שלי" cards via `portalLaundryHtml` (stage progress dots + ETA + weight/charge).

## Remaining (in order)

1. **Batch C3 (next):** billing wiring (weighing ⇒ billable line; consolidated invoicing later — ask Avi the open question from the work order: auto-invoice vs billable line), worker speed scoring/leaderboard (stage-transition lag per worker from laundry_events), machine utilization dashboard (3 metrics: 05:00–17:00; first-start→last-stop; relative to busiest=100%), internal-wash show/hide filter across revenue/kg screens.
2. Second half of v5.1 fixes table — Avi still hasn't sent it; merge when it arrives.
3. Phase D only after all of Phase C is verified. Deep manual test of C1+C2 also pending (Avi deferred).

## Working notes for next session

- laundry_events is append-only — **never writeTable on it**; state derives from the log.
- E2E mock pattern (Node stubs for Utilities/Session/Cache/Lock + eval Code.gs with writeTable/appendRowToTable stubbed) works and is cheap — reuse for C3.
- **CREDITS ARE CRITICAL (<10%). Work lean: minimal file re-reads, batch everything, one full delivery per batch, no interim rounds.** Deliver Code.gs + index.html as full files for pasting; commit path via GitHub web edit (upload is flaky for Avi).

## Communication reminders

All Avi-facing text in Hebrew, simple, step-by-step. Full-file replacements only. Status + short manual test checklist after every delivery.
