# MAPA-NOBLE — Session Handoff (LATEST — updated 2026-07-05, end of session 4)

**Single up-to-date handoff. Ignore older ones. Read `CLAUDE.md` first, then `docs/WORK_ORDER_2026-07-05.md`, then this.**

## Current state

- **Phases A + B: DEPLOYED and VERIFIED** (see work order; G1 long-text invariant still holds: always fetch full text before rendering an edit form for notes/tasks/meetings/task_comments).
- **Phase C, Batch C1: DEPLOYED 2026-07-05, code-verified (41/41 automated E2E assertions passed), awaiting Avi's live manual test.**
- Frontend: **v5.3** in repo & live (version label on login screen is the deployment canary — bump on every deploy).
- Server: **v2.7 (batch NC1)**, ~1,670 lines. NOT in repo — Avi attaches Code.gs at session start; if missing, ask before touching the server. `setupDatabase()` was run (new sheets/columns created).

## What Batch C1 delivered

- **3 new tables:** `laundry_intakes` (batch per customer; internal-MAPA flag; status; net kg; total charge; delivery_id link), `intake_carts` (bind/release, active flag), `laundry_events` (append-only journal: stage, event_type [קליטה/התחלה/סיום/שקילה/סטטוס/העמסה/מסירה], worker, cart, machine, gross/tare/net kg, price-per-kg snapshot, charge). **Never call writeTable on laundry_events — appendRowToTable only.** State derives from the log (e.g., intake weight rollup = last weigh event per cart, so re-weigh replaces).
- **Column additions:** customers.price_per_kg; carts.tare_kg; machines.auto_stage + machines.barcode (all appended at end of their sheets).
- **Server actions (write, NOT in READ_ONLY_ACTIONS):** nobleIntake, nobleStageStart (machine scan ⇒ stage from auto_stage; blocks inactive machines, missing auto_stage, open stage per cart), nobleStageEnd, nobleWeigh (gross − tare = net × price; blocks non-positive net & missing customer price; internal ⇒ charge 0), nobleMarkReady (requires ≥1 weigh, no open stages), nobleDriverScan (creates REAL delivery, kind 'משלוח מכבסה', links intake.delivery_id), nobleDeliver (releases carts, closes bindings, delivery → 'בוצע' + note_number). Read-only: nobleCartInfo.
- **NOBLE_STAGES** (server + frontend): התקבל→בכביסה→בייבוש→בגיהוץ וקיפול→באריזה→מוכן→במשלוח→נמסר. Separate constant — the legacy MAPA `STAGES` array untouched (regression-protected).
- **Frontend:** new 'floor' view (רצפת ייצור) — intake tab + work tab, big-button worker UX, camera scan hook (FLOOR_CAM in camFound), tablet shared mode (localStorage mn_floor_tablet) requiring per-action worker PIN; new role 'עובד רצפה' (sees floor/attendance/tasks only); cart & machine forms now support EDIT + tare/auto_stage/barcode; customer form has price-per-kg. Floor actions use apiBusy (double-click safe), not act().
- **NOTE (flagged to Avi):** employees.pin column repurposed — it now identifies workers in shared-tablet mode (server resolves worker_pin → employee). Ensure every floor worker has a pin.

## Remaining (in order)

1. **Batch C2:** live production board + customer-portal upgrade (current stage + time-remaining from historical stage averages with manual override) + dashboard alignment (Task 2).
2. **Batch C3:** billing wiring (weighing ⇒ billable line, consolidated invoicing later), worker speed scoring/leaderboard, machine utilization dashboard (3 metrics: 05:00–17:00; first-start→last-stop; relative to busiest=100%), internal-wash show/hide filter across all revenue/kg screens.
3. Second half of v5.1 fixes table — Avi still hasn't sent it; merge when it arrives.
4. Phase D only after all of Phase C is verified.

## Working notes for next session

- E2E test harness exists (session 4): Node mock of the GAS environment driving route() through the full flow. Rebuild similar mocks for C2/C3 testing (cheap, ~150 lines).
- GitHub web *upload* was flaky for Avi ("Something went really wrong"); reliable path: Add file → Create new file / edit → paste full content → Commit. Deliver frontend as full-file content for pasting.
- Session hygiene: monitor context weight; Avi is low on plan credits — keep responses lean, batch work, avoid re-reading large files unnecessarily.

## Communication reminders

All Avi-facing text in Hebrew, simple, step-by-step. Full-file replacements only for Code.gs. Status table at every checkpoint. Manual test checklist after every deploy.
