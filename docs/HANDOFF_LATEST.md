# MAPA-NOBLE — Session Handoff (LATEST — updated 2026-07-05, end of session 7)

**Single up-to-date handoff. Ignore older ones. Read `CLAUDE.md` first, then `docs/WORK_ORDER_2026-07-05.md`, then this.**

## Current state

- Phases A + B: DEPLOYED and VERIFIED. Phase C (C1+C2+C3): deployed; deep manual test still deferred by Avi.
- **Batch NC4 (v5.1 fixes table, part 1 of merged items): CODE COMPLETE 2026-07-05.** Syntax-checked (node) + logic smoke-tested (GAS mock: laundry invoices in customerBalance/aging, commentSetStatus lifecycle, delete cascades, setPassword username rules). Delivered as full files — deployment + verification pending.
- Version labels to verify: frontend **v5.6** (login screen), server **v3.0** (header). Server NOT in repo — Avi attaches Code.gs at session start.
- **NC4 adds columns** (`task_comments.status/handled_by/handled_ts`) → Avi MUST run `setupDatabase()` once before redeploying.

## What Batch NC4 delivered

- **Server aging report includes laundry invoices:** `customerBalance` now adds open order-less invoices (total minus its payments) — 'reports' aging and the statements match the frontend `custBalance`.
- **Task action-items (fix #1):** any task comment can be promoted to 'לביצוע' (new action `commentSetStatus {comment_id, status}` — write action, NOT read-only). Open items float in an amber "משימות לביצוע" card at the top of the task view with a "סמן כטופל" button; handled items return to the regular comment flow with a chip "טופל ע"י X · ts". Kanban cards show a "⚑ n לביצוע" badge.
- **Delete with cascade (fix #2):** manager-pin delete buttons added to task and meeting detail views. Server: deleting a task deletes its comments; deleting a meeting detaches (not deletes) its tasks; deleting ANY entity now removes links pointing at it (LINK_TYPES map in the delete case). Frontend `entName` shows '(נמחק)' and `entOpen` toasts instead of crashing on orphan links. Notes remain undeletable by design.
- **Full timestamps (fix #3):** orders/portal-orders `created_at` and units `created` now `nowTs()` (business `date` fields untouched — they are compared lexically as dates!). Task detail shows `fmtTs(created_at)`; agreement print slices date only.
- **Login credentials editor (fix #4):** frontend bug fixed — it sent `newPassword`, server expects `new_password` (setPassword silently failed!). The manager "פרטי כניסה" modal now edits username AND password together. Server: username change is manager-only, uniqueness-checked, trimmed+lowercased.
- **Clickable dashboard charts (fix #5):** revenue bars → `revMonthDetail(mk)` modal (invoice list incl. 'מכבסה' type, total, link to finance); donut legend rows → `ordersStatusDetail(st)` modal (clickable order rows → openOrder, link to orders screen).
- **Refresh button (fix #6):** rewritten with busy-state, success toast, and error toasts (was silent on failure).
- **Refresh keeps place + idle lock (fix #7):** current view persisted in `sessionStorage mn_view`, restored in `enterApp` (render() still enforces permissions). 10-minute idle lock (30s interval check) clears the session token and returns to login with a message. Shared-tablet mode is exempt. Device "remember me" token is kept — a full page reload after idle lock will auto-login; flagged to Avi as accepted behavior.
- **Shared tablet lock (fix #8):** `floorTabletToggle` now requires manager pin both to enable and disable (via new generic `confirmManagerPin(msg,btn,cb)`); `doLogout` in tablet mode also requires manager pin.

## Remaining (in order)

1. Avi deploys NC4 (setupDatabase → redeploy existing deployment → commit index.html) and runs the manual checklist.
2. Manual test results of the C3 checklist were never reported (placeholder left empty in session 7) — collect them.
3. Deep manual test of Phase C, then Phase D (best-practices sweep; legacy machine-maintenance module is a Phase D candidate).

## Working notes for next session

- This session's uploaded Code.gs had **LF** endings (not CRLF as before) — check per file, don't assume.
- laundry_events is append-only — never writeTable on it.
- GAS mock pattern reused successfully — cheap, keep using it.
- CREDITS CRITICAL. Work lean: minimal re-reads, batch everything, one full delivery per batch.

## Communication reminders

All Avi-facing text in Hebrew, simple, step-by-step. Status + short manual test checklist after every delivery.
