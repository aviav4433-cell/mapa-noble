# MAPA-NOBLE — Session Handoff (LATEST — updated 2026-07-05, end of session 2)

**This is the single up-to-date handoff. Ignore any older handoff files. Read `CLAUDE.md` (repo root) first, then `docs/WORK_ORDER_2026-07-05.md`, then this.**

## Current state — VERIFIED by Avi on 2026-07-05

- **Phase A (Tasks 4, 5, 8, 9): DEPLOYED and VERIFIED.** Delivery/return detail modals (`openDelivery`), visual hierarchy (`.doc-body`/`.doc-meta`), global double-submit guard (`showBusy` disables all buttons + `apiBusy`). The earlier "nothing changed" report was browser cache — resolved.
- **Phase B (Task 3, long texts): DEPLOYED and VERIFIED.** Chosen strategy: smart truncation (option ג).
  - Server v2.6 (batch G1): `getAll` returns long text fields truncated to `LONG_TEXT_PREVIEW` (300 chars) with a `<field>_trunc: 1` flag. Sheet data itself is NEVER truncated. New read-only action `getFullTexts {table, ids}` returns full text of whitelisted fields only (`LONG_TEXT_FIELDS = { notes:[text], tasks:[details], meetings:[protocol], task_comments:[text] }`). Added to both `READ_ONLY_ACTIONS` and `READ_ACTIONS`.
  - Frontend: helper `ensureFullTexts(table, recs)` + `anyTrunc`. `openTask`, `openMeeting`, `printMeeting`, `notesModal` are now async and fetch full text before rendering. **Critical invariant: `openMeeting` MUST fetch the full protocol before rendering the edit textarea, otherwise saving overwrites the full protocol with the preview. Preserve this in any future edit flow for these tables.**
  - Known limitation (accepted by Avi): the notes-screen search only searches the first 300 chars of each note.
- UI extras deployed: favicon (inline SVG in `<head>`) + version label on the login screen ("גרסה 5.2 · 05.07.2026"). **The version label is the deployment canary — bump it on every frontend deploy** so Avi can instantly tell cached vs. live.

## Server file (Code.gs)

- Current server version: **v2.6, batch G1** (~1,350 lines). NOT in the repo (repo is public — intentional). **Avi attaches the current Code.gs at the start of every session.** If missing and the task touches the server — ask for it before starting.
- Deployment reminder: always edit the EXISTING deployment (new version), never create a new deployment.

## Next steps (in order)

1. **Phase C** — NOBLE production-floor module (Tasks 1, 2, 6). The big one. Follow the work order precisely: study `docs/legacy_noble_portal.html` first, greenfield rebuild (zero legacy code reuse), event-log architecture, machine-implies-stage, price snapshot at weighing, cart tare weight. Before coding, ask Avi the two open questions from the work order (time-remaining estimation method; weighing → invoice vs. billable line).
2. The second half of the v5.1 fixes table has still not been sent — Avi will send it separately; merge into the work order when it arrives.
3. Phase D only after C is verified.

## Session hygiene (Avi's standing request)

Monitor conversation size. When the context grows heavy, proactively tell Avi — in Hebrew, one short sentence — to open a fresh chat, and give him the exact opener message. Do not wait for him to ask.

## Communication reminders

All Avi-facing text in Hebrew, simple, step-by-step, no jargon. Full-file replacements only for Code.gs. Status table at every checkpoint. Manual test checklist in Hebrew after every deploy.
