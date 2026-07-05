# MAPA-NOBLE — Session Handoff (LATEST — updated 2026-07-05, end of session 6)

**Single up-to-date handoff. Ignore older ones. Read `CLAUDE.md` first, then `docs/WORK_ORDER_2026-07-05.md`, then this.**

## Current state

- **Phases A + B: DEPLOYED and VERIFIED.** G1 long-text invariant holds.
- **Phase C, Batches C1 + C2: DEPLOYED.** Deep manual testing deferred by Avi until Phase C is complete.
- **Phase C, Batch C3 (billing + worker scoring + machine utilization + internal filter): CODE COMPLETE 2026-07-05, syntax-checked (node) + logic smoke-tested (Node GAS mock: invoice creation/dedup, invoice-based payments incl. overpay guard, kg_internal). Delivered to Avi as full files — deployment + verification pending.**
- Version labels to verify at session start: frontend **v5.5** (login screen), server **v2.9** (header comment). Server ~1,841 lines, NOT in repo — Avi attaches Code.gs at session start; if missing, ask before touching the server.
- **C3 adds a column** (`laundry_intakes.invoice_id`) → Avi MUST run `setupDatabase()` once before redeploying.

## What Batch C3 delivered (on top of C2)

- **Billing decision (Avi, 2026-07-05): weighing adds a billable charge to the customer account; NO auto-invoice.** Implementation: weigh already stamps `total_charge` on the intake; a delivered (נמסר), non-internal, un-invoiced intake with charge>0 is an "open billable line". New write action **`nobleCreateInvoice {customer_id}`** consolidates all such intakes into ONE invoice (`order_id:''`, number from 'invoice' counter, VAT), stamping `invoice_id` on each.
- **`addPayment` extended:** accepts `{invoice_id, amount}` without order_id (laundry invoices) — balance validated against invoice total minus its payments; marks שולמה when covered. Original order path untouched.
- **`nobleBoard`** now also returns `today.kg_internal` (net kg today from internal intakes).
- **Frontend v5.5:** Finance has new tab **'laundry' (חיובי מכבסה)** — open charges grouped per customer (count/kg/₪) + "הפק חשבונית מרוכזת" button (`nobleInvoice`); invoices tab shows a 'מכבסה' chip and a 'תשלום' button on open laundry invoices (`laundryPayForm`/`laundryPaySave`); `printInvoice` branches for laundry invoices (lines = billed intakes); receipts list + `printReceipt` resolve customer via invoice fallback; `custBalance` includes open laundry invoices (so the debt KPI and statements see them — note: the server-side 'reports' aging does NOT include laundry invoices yet; candidate for later).
- **Reports screen:** new client-computed section "מכבסה — ביצועים" (`renderNobleReports`, range 7/30/90 days): period stats (kg/revenue/deliveries from delivered intakes — no re-weigh double count), **worker leaderboard** (stage-transition lag: cart's 'סיום' → its next 'התחלה', attributed to the worker who started; 0–1440 min sanity window; medals), **machine utilization** with the 3 work-order metrics (05:00–17:00 window clipped per day; plant first-start→last-stop span; relative to busiest=100%; open stages counted until now, capped 24h).
- **Internal-wash filter:** persisted checkbox (`localStorage mn_incl_internal`, helper `internalChk(fn)`) on dashboard noble card, live board, and reports performance section — affects kg/revenue sums only, never operational visibility.

## Remaining (in order)

1. Avi deploys C3 (setupDatabase + redeploy existing deployment + commit index.html) and runs the manual checklist.
2. Second half of v5.1 fixes table — Avi still hasn't sent it; merge when it arrives.
3. Deep manual test of C1+C2+C3 (Avi deferred), then Phase C is done → Phase D (best-practices sweep; legacy machine-maintenance module is a Phase D candidate).

## Working notes for next session

- laundry_events is append-only — never writeTable on it.
- E2E Node GAS mock pattern works and is cheap — reuse (stubs for Utilities/Session/Cache/Lock/SpreadsheetApp + eval Code.gs with writeTable/appendRowToTable stubbed).
- Avi's uploaded Code.gs has CRLF endings — normalize before str_replace edits; delivering LF is fine for Apps Script paste.
- **CREDITS CRITICAL. Work lean: minimal re-reads, batch everything, one full delivery per batch.** Full-file replacements only; commit path via GitHub web edit.

## Communication reminders

All Avi-facing text in Hebrew, simple, step-by-step. Status + short manual test checklist after every delivery.
