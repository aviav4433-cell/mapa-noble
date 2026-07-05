# MAPA-NOBLE ERP — Work Order (Batch 1, 2026-07-05)

## READ THIS FIRST — Navigation & Context

1. **Read `CLAUDE.md` from the repo root before touching anything.** It contains the architecture, the client↔server protocol, security rules, deployment process, known pitfalls, and the mandatory multi-task work method. Repo: `aviav4433-cell/mapa-noble` (branch `main`). Frontend can be pulled from: `https://raw.githubusercontent.com/aviav4433-cell/mapa-noble/main/index.html`
2. **Server code (`Code.gs`) is NOT in the repo** (intentionally — the repo is public). The owner will upload the current `Code.gs` at session start. If he forgot, ask for it before starting any task that touches the server. Do not trust handoff documents about code state — read the actual code.
3. **Live site:** https://aviav4433-cell.github.io/mapa-noble/ — Hebrew RTL UI on GitHub Pages.
4. **Deployment:** frontend → commit to `main`. Server → owner pastes full `Code.gs` into the Apps Script editor and redeploys **the existing deployment** with a new version (never a new deployment — that changes the URL). Always deliver the server as one complete file for full replacement, never as snippets.

## Communication rules (mandatory)

- **All communication with the owner (Avi) is in Hebrew.** Simple, non-technical Hebrew: he is a business owner with sharp product intuition but no programming background. Explain like to a smart colleague, not to a developer. Step-by-step instructions for anything he must do manually.
- Work internally (code, comments, commits) in English or as the existing codebase dictates.
- When a task is ambiguous, ask him — in Hebrew, one focused question at a time, with concrete options to choose from rather than open questions.
- Report progress with the tracking table (see Execution Protocol).

## Execution Protocol (mandatory)

1. Build a tracking table: task #, description, status (pending / in progress / done / verified / blocked-waiting-for-Avi).
2. Work in phases as defined below. After each phase: syntax-check both files (`node --check` / `new Function`), then report status.
3. **Two-sides rule:** any change touching both server and frontend is implemented in the same phase, never split.
4. Any new server action that writes to Sheets must NOT be added to `READ_ONLY_ACTIONS` (locking + audit depend on this).
5. Follow the existing token protocol exactly as documented in `CLAUDE.md`. Do not redesign auth.
6. End of session: full status table + a short manual test checklist for Avi in Hebrew (what to click, what should happen).

---

## PHASE A — Quick UI fixes (Tasks 4, 5, 8, 9)

### Task 4 — Deliveries: row click opens a detail view
**Problem:** Clicking a delivery row in the deliveries screen does nothing.
**Required:** Clicking a row opens a modal with full delivery details: delivery number, customer (linked — clicking navigates to the customer), date, driver, vehicle, line items with quantities, related order/invoice links, status, and any notes. Include action buttons appropriate to the delivery's status. Show as much useful information as the data model allows.
**Acceptance:** Click any delivery row → rich detail modal opens; customer link navigates correctly; no console errors.

### Task 5 — Returns: same treatment as deliveries
**Problem:** Returns screen has never been live-tested; row click behavior unknown/absent.
**Required:** Clicking a return row opens a detail modal (same pattern as Task 4) with navigation to the related customer. Verify the whole returns flow renders correctly with real data shapes.
**Acceptance:** Click any return row → detail modal opens; customer navigation works.

### Task 8 — Visual hierarchy in note/task detail views
**Problem:** When opening a note/task detail view, the body text and its metadata (date, author, etc.) render in the same font — the eye can't separate content from metadata.
**Required:** Emphasize the body text (larger/bolder) and de-emphasize metadata (smaller, muted color). Apply consistently across all note/task/protocol detail views.
**Acceptance:** Body text is clearly visually dominant in every such view.

### Task 9 — Prevent double-submit on save
**Problem:** The app can be slow; the save button stays active during save, so a double-click saves the record multiple times.
**Required:** On any save click: immediately disable the button, change it to a gray disabled style, cursor becomes default (not pointer), and re-enable only after the server responds (success or error). Apply globally to all save/submit buttons — implement once as a shared helper, not per-button copies.
**Acceptance:** Rapid double/triple click on any save button produces exactly one saved record.

---

## PHASE B — Architecture decision (Task 3) — DISCUSS BEFORE CODING

### Task 3 — Long-text storage strategy on Google Sheets
**Owner's concern:** Notes/tasks/protocols may hold long text in single cells; he fears this will slow down or freeze the app. He prefers staying on Sheets if possible.
**Required:** First analyze, then recommend, then implement only after his approval:
1. Assess the real limits (Sheets cell limit is 50,000 chars; the bigger risk is `getAll` payload size — the app loads all tables into `DB` on login).
2. Evaluate options: (a) keep as-is with a size cap per note; (b) separate `long_texts` sheet keyed by text-ID, loaded lazily only when a note is opened; (c) any better pattern from your knowledge — but staying on Sheets as the datastore.
3. Present the recommendation to Avi in Hebrew, in simple terms with the trade-offs, and let him choose.
**Acceptance:** A decision approved by Avi; implementation only after approval.

---

## PHASE C — NOBLE Laundry Production-Floor Module (Tasks 1, 2, 6) — THE BIG ONE

This is a full module, not a fix. Before coding, verify what already exists in the codebase (there is a stages array `STAGES = ['התקבל','בכביסה','בייבוש','בגיהוץ וקיפול','מוכן']` and a weighing feature — map what's implemented vs. missing).

### Legacy system reference (validated prototype — study before designing)

The previous NOBLE system (AppSheet, 13 tables / 48 views / 63 actions) implemented this exact flow in production. Its client portal is preserved at **`docs/legacy_noble_portal.html`** in the repo — read it. The owner's instruction: use it as the base for understanding the logic, **then surpass it tenfold**.

**Legacy data model (adopt these proven patterns):**

| Legacy table | Purpose | Key columns |
|---|---|---|
| קליטה (intake) | One laundry batch per customer | customer link, status, price-per-kg snapshot, total charge, intake time, paid flag, delivery time, "all carts released" flag |
| קליטת עגלות | Intake↔cart binding | intake link, cart link, bind time, active flag |
| עגלות (carts) | Cart registry | cart id, status, active intake, active customer, availability |
| יומן (journal) | **Append-only event log — the heart of the system** | event id, customer link, cart link, **stage name**, timestamp, worker link, intake link, machine link, cart scan, machine scan, weight kg, **price-per-kg at weighing time**, charge amount |
| מכונות (machines) | Machine registry | machine id, type, status, **auto-stage**, fault flag |
| תשלומים (payments) | Customer payments | customer link, date, amount, reference |
| תיקונים + עדכוני תיקונים | Machine maintenance | fault, category, priority, repair cost, **downtime**, status, updates thread |

**Design principles proven by the legacy system — mandatory in the new module:**
1. **Event-log architecture:** every floor action is an appended journal event (stage, time, worker, cart, machine, weight, charge). Never mutate history; derive current state from the log. Add one `laundry_events` table to the ERP following this pattern.
2. **Machine implies stage:** each machine record carries its stage (`auto-stage`). Worker scans cart + machine → the system infers the stage automatically. The worker never picks a stage from a menu.
3. **Price snapshot at weighing:** the per-kg price is copied into the event at weighing time, so later price changes never corrupt historical billing.
4. **Active-machine inference (portal):** a machine is "working now" on a batch if its last event for that intake is within a rolling window (legacy used 4h). Reuse for the live board and portal.
5. **Intake carries the billing rollup** (total charge, paid flag); payments live in their own table and reconcile against intakes.

**What the legacy system lacked — these are the "tenfold" upgrades (integrate into Tasks 1/2/6):**
- Explicit start/end event pairs per stage (legacy had single timestamps) — required for utilization and worker-speed analytics.
- Cart tare weight (legacy carts had no weight column) — required for net-weight billing.
- Live production floor board, worker scoring, machine-utilization dashboards (Task 6).
- Integration with the ERP's existing customers/invoices/employees instead of standalone tables — map legacy concepts onto existing ERP tables where they exist; create new tables only for intake, cart-binding, and events.
- The legacy machine-maintenance module (תיקונים) is NOT in scope for Phase C — list it as a Phase D candidate.

### Task 1 — Production-floor workflow (core logic)
The complete flow, as specified by the owner:

1. **Intake ("קליטה"):** Laundry arrives → an intake record is opened, linked to a customer (or marked as internal MAPA rental textile).
2. **Cart binding:** The intake is linked to one or more carts (e.g., customer "ישרוטל" → cart 101). From this point, every action is recorded against that laundry batch by scanning the cart barcode.
3. **Work screen for floor workers:** Worker scans cart + machine (e.g., cart 101 + washer A1) → system records entry: customer X entered machine Y at date/time. A dedicated "finish wash" button records the end time. (Machines will later be connected for automatic timestamps — design the data model so automation can plug in.)
4. **Same scan-in/scan-out pattern for each stage:** washing → drying → ironing/folding → packing. Each stage records start/end timestamps per cart.
5. **Weighing at the end (before delivery):** Worker enters total weight → system subtracts the cart's own weight (tare) → net weight × customer's per-kg price = charge. **Requires:** (a) a per-kg laundry price field on the customer record; (b) a tare-weight column on the carts table + the carts management screen updated accordingly.
6. **Driver scan:** Driver scans on loading → status becomes "delivery".
7. **Live production board:** Every stage is reflected on a live work board.
8. **Customer portal view:** Each customer sees only their own laundry — current stage and estimated time remaining.

**Acceptance:** Full happy-path scenario passes end-to-end: intake → cart bind → wash in/out → dry in/out → iron in/out → weigh (net weight and charge computed correctly with tare subtraction and per-kg price) → driver scan → delivered; the live board and the customer portal reflect each transition.

### Task 2 — Dashboard alignment to the laundry logic
Review the entire dashboard (and any affected screens) and adapt it to the production-floor logic — including visually. Owner grants freedom: apply best practices from leading ERP/production software; add functions and views he wouldn't know to ask for.

### Task 6 — Reports, billing, and analytics on top of the flow
Once the flow exists, wire automatically everything that derives from it:
1. **Billing:** weighing results feed customer charges/invoices.
2. **Worker scoring:** measure stage-transition speed per worker (e.g., wash finished 13:00 but entered ironing only 14:30 → 1.5h lag attributed). Leaderboard of fastest stage-movers.
3. **Machine utilization dashboard**, three metrics:
   - (a) Utilization across the working day 05:00–17:00.
   - (b) Utilization from first machine start to last machine stop.
   - (c) Relative: busiest machine = 100%, others as a percentage of it.

**Acceptance:** Billing figures verifiably correct on a test scenario; both dashboards render with real data.

---

## PHASE D — Enrichment pass (Task 7) — ONLY AFTER PHASE C IS VERIFIED

### Task 7 — Industry best-practices sweep
Survey what world-class ERP/production systems offer for laundry/production management and add high-value functions, views, and efficiencies — under the project's guiding principle: **crystal-clear UI, accessible to a user with no computer education, "in his language."** Developers build UIs for developers; this system must present all that professional power in plain, obvious controls. Propose the list to Avi in Hebrew first (short bullet list, plain words), implement what he approves.

---

## Open questions for Avi (ask in Hebrew at session start)

1. (Resolved — legacy portal file is in the repo at `docs/legacy_noble_portal.html`; the full AppSheet documentation exists if deeper detail is needed.)
2. Task 1 (portal): "כמה זמן נשאר" — should time-remaining be a manual estimate per stage, or computed from historical averages? (Recommend: historical averages, with manual override.)
3. Task 6 (billing): should weighing auto-create an invoice, or add a billable line for later invoicing? (Affects the accounting flow.)

## Phase order & checkpoints

Execute A → B → C → D, with an Avi-facing checkpoint (deploy + manual test checklist in Hebrew) after each phase. Do not start C before A is deployed and verified — small wins first, then the big build on a stable base.
