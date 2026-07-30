#!/usr/bin/env node
/* ============================================================
   MAPA-NOBLE — מריץ הבדיקות   (B61 · BLD-08)
   ============================================================
   הרצה מתוך שורש הריפו:   node tests/run.js
   הרצת קובץ אחד:          node tests/run.js t02

   **אבי לא מריץ את זה. אף פעם.** הריצה היא אצל הצ'אט, לפני כל מסירה.
   מי שמריץ הוא הצ'אט שבונה את האצווה — וחייב לדווח את המספר.

   ⚠ שלושה כללים שהמריץ אוכף בעצמו:
   1. **בדיקת תחביר לפני הכול.** node --check על בלוק ה-<script> ועל
      קוד השרת. אם התחביר שבור — עוצרים מיד, בלי להריץ בדיקה אחת.
   2. **מניעת ריקבון.** כל קובץ בדיקות מצהיר ב-requires על הסמלים
      בקוד החי שהוא נשען עליהם. סמל שנמחק מהקוד ⇦ **הקובץ כולו נכשל
      ברעש**, ולא עובר בשקט. זה מה שמונע ספרייה של בדיקות מתות.
   3. **אין רשת.** fetch מוחלף; כל קריאה לא צפויה נספרת וניתנת לבדיקה.
   ============================================================ */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const H = require('./harness');

const only = process.argv[2] || '';
const RED = s => '\x1b[31m' + s + '\x1b[0m';
const GRN = s => '\x1b[32m' + s + '\x1b[0m';
const YEL = s => '\x1b[33m' + s + '\x1b[0m';
const DIM = s => '\x1b[2m' + s + '\x1b[0m';

/* ---------- שלב 0: בדיקת תחביר ---------- */
function syntaxCheck() {
  const tmp = path.join(__dirname, '.syntax');
  fs.mkdirSync(tmp, { recursive: true });
  const a = path.join(tmp, 'ui.js');
  const b = path.join(tmp, 'server.js');
  fs.writeFileSync(a, H.uiScript(), 'utf8');
  fs.writeFileSync(b, H.serverSrc(), 'utf8');
  const run = f => {
    try { cp.execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); return null; }
    catch (e) { return String(e.stderr || e.message).split('\n').slice(0, 4).join('\n'); }
  };
  const ea = run(a), eb = run(b);
  fs.rmSync(tmp, { recursive: true, force: true });
  return { ui: ea, server: eb };
}

/* ---------- כלי טענה ---------- */
function makeT() {
  const fails = [];
  const t = {
    ok(v, msg) { if (!v) fails.push(msg || 'ציפיתי לערך אמת, קיבלתי ' + JSON.stringify(v)); },
    no(v, msg) { if (v) fails.push(msg || 'ציפיתי לערך שקר, קיבלתי ' + JSON.stringify(v)); },
    eq(a, b, msg) { if (a !== b) fails.push((msg ? msg + ' — ' : '') + 'ציפיתי ל-' + JSON.stringify(b) + ', קיבלתי ' + JSON.stringify(a)); },
    ne(a, b, msg) { if (a === b) fails.push((msg ? msg + ' — ' : '') + 'ציפיתי שיהיה שונה מ-' + JSON.stringify(b)); },
    has(hay, needle, msg) { if (String(hay).indexOf(needle) === -1) fails.push((msg ? msg + ' — ' : '') + 'לא נמצא: ' + needle); },
    hasNot(hay, needle, msg) { if (String(hay).indexOf(needle) > -1) fails.push((msg ? msg + ' — ' : '') + 'נמצא ואסור: ' + needle); },
    throws(fn, msg) { let th = false; try { fn(); } catch (e) { th = true; } if (!th) fails.push(msg || 'ציפיתי לשגיאה'); },
    fail(msg) { fails.push(msg || 'נכשל'); },
    _fails: fails
  };
  return t;
}

/* ---------- מניעת ריקבון ---------- */
function checkRequires(spec, scope, label) {
  const missing = (spec.requires || []).filter(name => {
    const v = scope[name];
    return v === undefined || v === null;
  });
  if (!missing.length) return null;
  return 'ריקבון בדיקות — ' + missing.length + ' סמלים שהקובץ נשען עליהם כבר לא קיימים ב' + label +
    ':\n        ' + missing.join(', ') +
    '\n        או שהקוד השתנה והבדיקה צריכה עדכון, או שנמחק משהו בטעות. אין לעבור על זה בשתיקה.';
}

/* ---------- ראשי ---------- */
(function main() {
  const t0 = Date.now();
  console.log('\n' + '='.repeat(62));
  console.log('  MAPA-NOBLE — בדיקות רגרסיה');
  console.log('='.repeat(62));

  const syn = syntaxCheck();
  if (syn.ui || syn.server) {
    console.log(RED('\n  ✗ בדיקת תחביר נכשלה — עוצר לפני שהורצה בדיקה אחת.\n'));
    if (syn.ui) console.log(RED('  index.html:\n') + syn.ui);
    if (syn.server) console.log(RED('  קוד שרת.txt:\n') + syn.server);
    process.exit(1);
  }
  console.log(GRN('  ✓ תחביר: index.html + קוד שרת.txt תקינים'));

  const files = fs.readdirSync(__dirname)
    .filter(f => /\.test\.js$/.test(f))
    .filter(f => !only || f.indexOf(only) === 0)
    .sort();

  if (!files.length) { console.log(RED('  לא נמצאו קבצי בדיקה')); process.exit(1); }

  /* הקשרים משותפים — נבנים פעם אחת ומועברים לקבצים שמבקשים אותם */
  let serverCtx = null, uiCache = null;
  const getServer = () => (serverCtx || (serverCtx = H.loadServer()));
  const getUi = () => H.loadUi();   // חלון טרי לכל קובץ — בידוד מצב

  let pass = 0, fail = 0, rot = 0;
  const failures = [];

  files.forEach(f => {
    const spec = require(path.join(__dirname, f));
    const needs = spec.needs || 'src';
    console.log('\n  ' + DIM('─'.repeat(58)));
    console.log('  ' + (spec.title || f) + DIM('   [' + f + ']'));

    let scope = {}, label = 'קוד', env = {};
    try {
      if (needs === 'server') { const c = getServer(); scope = c; label = 'קוד השרת'; env = { srv: c, H }; }
      else if (needs === 'ui') { const u = getUi(); uiCache = u; scope = u.window; label = 'ממשק'; env = { w: u.window, dom: u.dom, srv: getServer(), H }; }
      else { scope = { src: 1 }; env = { H, srv: getServer() }; }
    } catch (e) {
      console.log('    ' + RED('✗ טעינת הסביבה נכשלה: ' + e.message));
      fail++; failures.push(f + ' — טעינת סביבה: ' + e.message);
      return;
    }

    const rotErr = checkRequires(spec, scope, label);
    if (rotErr) {
      console.log('    ' + RED('✗✗ ' + rotErr));
      rot++; fail++; failures.push(f + ' — ' + rotErr.split('\n')[0]);
      if (uiCache) { try { uiCache.dom.window.close(); } catch (e) {} uiCache = null; }
      return;
    }

    Object.keys(spec.tests).forEach(name => {
      const t = makeT();
      try { spec.tests[name](t, env); }
      catch (e) { t._fails.push('שגיאה בזמן ריצה: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e)); }
      if (t._fails.length) {
        fail++;
        console.log('    ' + RED('✗ ') + name);
        t._fails.forEach(m => console.log('        ' + RED(m)));
        failures.push(f + ' › ' + name);
      } else {
        pass++;
        console.log('    ' + GRN('✓ ') + DIM(name));
      }
    });

    if (uiCache) { try { uiCache.dom.window.close(); } catch (e) {} uiCache = null; }
  });

  const ms = Date.now() - t0;
  console.log('\n' + '='.repeat(62));
  if (fail === 0) {
    console.log(GRN('  ✓ ' + pass + ' בדיקות · 0 כשלים') + DIM('   (' + files.length + ' קבצים · ' + ms + ' מ״ש)'));
  } else {
    console.log(RED('  ✗ ' + fail + ' כשלים') + ' · ' + pass + ' עברו' + (rot ? YEL('  · ' + rot + ' קבצי ריקבון') : ''));
    failures.forEach(x => console.log('    ' + RED('· ') + x));
  }
  console.log('='.repeat(62) + '\n');
  process.exit(fail === 0 ? 0 : 1);
})();
