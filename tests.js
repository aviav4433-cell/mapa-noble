#!/usr/bin/env node
/* ============================================================================
   MAPA-NOBLE — כל בדיקות הרגרסיה, בקובץ אחד
   נוצר ב-B61 כתיקייה · אוחד לקובץ יחיד ב-B63 (31.07.2026) בהוראת אבי
   ============================================================================

   הרצה, משורש הריפו:
       npm i jsdom          (בסשן בלבד — נזרק איתו)
       node tests.js        כל הבדיקות
       node tests.js t02    חלק אחד

   ⛔ node_modules ו-package.json לעולם לא נכנסים לריפו.
   ⛔ אבי אינו מריץ את זה. אף פעם. הריצה היא של הצ'אט, לפני כל מסירה.

   ---------------------------------------------------------------------------
   למה הקובץ הזה קיים
   ---------------------------------------------------------------------------
   עד B61 כל אצווה כתבה את הרגרסיה שלה מאפס בתוך הצ'אט ואיבדה אותה בסופו:
   B56 כתב 74 · B58a כתב 97 · B59 כתב 85 · B60+B60a כתבו 74. 330 בדיקות אבדו,
   וכל אצווה בדקה רק את עצמה. הקובץ הזה הוא הזיכרון. כל אצווה מוסיפה אליו.

   ---------------------------------------------------------------------------
   ⚠ הדבר החשוב ביותר כאן
   ---------------------------------------------------------------------------
   **בדיקה שעברה כאן אינה הוכחה שהמערכת עובדת אצל אבי.**
   B60 עבר 60 בדיקות ב-jsdom ונכשל בייצור בלחיצה השנייה. הסביבה כאן היא
   דפדפן מדומה: אין בה מחסנית היסטוריה אמיתית, אין מצלמה, אין הדפסה, אין
   מגע, ואין את אזור הזמן של המכשיר.

   לכן קיימות שתי שכבות, ורק שתיהן יחד הן אימות (R11):
     שכבה 1 — הקובץ הזה:  לוגיקה · הרשאות · חישוב · מבנה · שומרי קוד מקור
     שכבה 2 — כרטיס "בדיקה עצמית" בתוך המערכת (יומן פעולות ← הרץ):
              היסטוריה · אחסון · מצלמה · הדפסה · מגע · אזור זמן · פריסה
   שכבה 2 נבדקת כאן ב-t05.

   ---------------------------------------------------------------------------
   מה יש בפנים, לפי הסדר
   ---------------------------------------------------------------------------
     חלק 1  רתמה      טעינת הקוד החי · דפדפן מדומה · Apps Script מדומה · עוזרי DOM
     חלק 2  מריץ      בדיקת תחביר · מניעת ריקבון · כלי טענה · סיכום
     חלק 3  t01       שומרי קוד מקור — R4 · איסור history.back · API_URL · canary
            t02       ניווט, איפוס מצב מסך והיסטוריה — T3 · T4 · B60a
            t03       הרשאות חמשת התפקידים · עוזרי ליבה · מע"מ · תאריכים
            t04       שרת: סכימה · ניתוב · READ_ONLY_ACTIONS · כסף · R6
            t05       כרטיס הבדיקה העצמית עצמו
            t06       ניווט: תפריט עליון · רצועת צד · קיצורים · סרגלי פעולות

   ---------------------------------------------------------------------------
   איך אצווה מוסיפה בדיקות
   ---------------------------------------------------------------------------
   מוסיפים לחלק הקיים המתאים, או SPECS.push({...}) חדש בסוף חלק 3.

     SPECS.push({
       file: 't07',
       title: 'שם שמופיע בפלט',
       needs: 'ui',                       // 'ui' (jsdom) · 'server' (vm) · 'src'
       requires: ['go', 'allowedViews'],  // ⚠ ראה "מניעת ריקבון" למטה
       tests: {
         'תיאור הבדיקה בעברית': (t, { w, srv, H }) => {
           H.login(w, 'מנהל', srv);
           w.go('orders');
           t.eq(w.VIEW, 'orders', 'הודעה שמסבירה מה נשבר');
         }
       }
     });

   כלי טענה: t.ok · t.no · t.eq · t.ne · t.has · t.hasNot · t.throws · t.fail
   כל אחד מקבל הודעה אחרונה — **כתוב בה מה נשבר, לא מה ציפית.**
   ב-env מקבלים: w (חלון מדומה) · srv (הקשר השרת) · H (הרתמה).

   ---------------------------------------------------------------------------
   מניעת ריקבון — requires
   ---------------------------------------------------------------------------
   בדיקה שמתייחסת לפונקציה שנמחקה מהקוד יכולה לעבור בשקט ולתת ביטחון שווא.
   לכן כל חלק מצהיר ב-requires על הסמלים בקוד החי שהוא נשען עליהם. סמל
   שנעלם ⇦ **החלק כולו נכשל ברעש**, עם שם הסמל.
   זה כבר עבד: requires תפס ש-batchGet ו-buildPayroll אינם פונקציות גלובליות
   בשרת (השמות האמיתיים: b58Prefetch, buildPayrollForMonth).

   ---------------------------------------------------------------------------
   ⚠ שלוש מלכודות מקובעות ברתמה
   ---------------------------------------------------------------------------
   1. חובה לנטרל setInterval/setTimeout לפני eval. בלי זה הריצה נתקעת לנצח —
      ה-polling של B58 מתזמן את עצמו מחדש.
   2. סריקת קוד מקור חייבת להסיר הערות קודם (H.stripComments). בקוד יש ארבעה
      אזכורים של history.back/history.go — כולם בתוך הערות שמסבירות את האיסור.
      סורק תמים נכשל שקרית.
   3. jsdom אינו מממש matchMedia. בלי H.setWidth(w, px) הפונקציות navIsTop/
      navIsSide נופלות ל-catch, navMode() הוא 'mob' לנצח, ואת התפריט העליון
      ואת רצועת הצד אי אפשר לבדוק כלל.

   ---------------------------------------------------------------------------
   R7 — אירועי DOM אמיתיים
   ---------------------------------------------------------------------------
   ב-jsdom במצב outside-only מטפלי on* בתגית אינם מקומפלים. לכן:
       H.click(w, elem)             מחבר את ה-onclick כמאזין ומדספאטץ' אירוע אמיתי
       H.change(w, elem, 'ערך')     אותו דבר ל-change
       H.popstate(w, { mn:1, v:'orders' })
   ⛔ קריאה ישירה ל-handler אינה בדיקה קבילה.

   ---------------------------------------------------------------------------
   מה הקובץ הזה עדיין אינו מכסה — נאמר במפורש
   ---------------------------------------------------------------------------
   · נתונים אמיתיים. הבדיקות רצות על DB ריק שנגזר מ-TMAP. הן מוכיחות שהקוד
     לא קורס ושהלוגיקה נכונה — לא שהנתונים בגיליון תקינים.
   · גיליון אמיתי. אין Google Sheets; בדיקות השרת הן על הצהרות ולוגיקה טהורה.
   · התנהגות דפדפן ופריסה בפועל. ← שכבה 2.
   · מהירות בייצור. תקורת Apps Script נמדדה ב-PERF-02 ואינה נבדקת כאן.
   ============================================================================ */


/* ==================== חלק 1 — הרתמה ==================== */

/* ============================================================
   MAPA-NOBLE — רתמת הבדיקות המשותפת   (B61 · BLD-08)
   ============================================================
   הקובץ הזה הוא התשתית. הוא לא מכיל בדיקות — רק את מה שכל קובץ
   בדיקות צריך: טעינת הקוד החי, דפדפן מדומה, Apps Script מדומה,
   ועוזרים לאירועי DOM אמיתיים (R7).

   ⚠ שני דברים שנשרפו בעבר ומקובעים כאן:
   1. **חובה לנטרל setInterval/setTimeout לפני eval.** בלי זה הריצה
      נתקעת לנצח — ה-polling של B58 ממשיך לתזמן את עצמו.
   2. **סריקת קוד מקור חייבת להסיר הערות קודם.** בקוד יש שתי אזכורים
      של history.back ושתיים של history.go — כולן בתוך הערות שמסבירות
      את האיסור. סורק תמים היה נכשל שקרית.
   ============================================================ */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;   /* B63: הקובץ יושב בשורש הריפו, לא בתיקיית משנה */
const INDEX = path.join(ROOT, 'index.html');
const SERVER = path.join(ROOT, 'קוד שרת.txt');

/* ---------- קריאת הקוד החי ---------- */
function indexSrc() {
  if (!fs.existsSync(INDEX)) throw new Error('index.html לא נמצא בשורש הריפו: ' + INDEX);
  return fs.readFileSync(INDEX, 'utf8');
}
function serverSrc() {
  if (!fs.existsSync(SERVER)) throw new Error('"קוד שרת.txt" לא נמצא בשורש הריפו: ' + SERVER);
  return fs.readFileSync(SERVER, 'utf8');
}

/* בלוק ה-<script> הראשי — היחיד בקובץ שאינו מחרוזת הדפסה */
function uiScript() {
  const s = indexSrc();
  const i = s.indexOf('<script>');
  const j = s.lastIndexOf('</script>');
  if (i < 0 || j < 0) throw new Error('לא נמצא בלוק <script> ב-index.html');
  return s.slice(i + '<script>'.length, j);
}

/* הסרת הערות — חובה לפני כל סריקת קוד מקור.
   מסירה /* ... *​/ ו-// ... , ומשאירה מחרוזות במקומן. */
function stripComments(code) {
  let out = '';
  let i = 0;
  const n = code.length;
  let mode = 'code';   // code | line | block | sq | dq | tpl
  while (i < n) {
    const c = code[i], d = code[i + 1];
    if (mode === 'code') {
      if (c === '/' && d === '*') { mode = 'block'; i += 2; continue; }
      if (c === '/' && d === '/') { mode = 'line'; i += 2; continue; }
      if (c === "'") mode = 'sq';
      else if (c === '"') mode = 'dq';
      else if (c === '`') mode = 'tpl';
      out += c; i++; continue;
    }
    if (mode === 'block') { if (c === '*' && d === '/') { mode = 'code'; i += 2; } else i++; continue; }
    if (mode === 'line') { if (c === '\n') { mode = 'code'; out += '\n'; } i++; continue; }
    // בתוך מחרוזת
    if (c === '\\') { out += c + (d || ''); i += 2; continue; }
    if ((mode === 'sq' && c === "'") || (mode === 'dq' && c === '"') || (mode === 'tpl' && c === '`')) mode = 'code';
    out += c; i++;
  }
  return out;
}

/* ---------- Apps Script מדומה ---------- */
function appsScriptStubs() {
  const props = {};
  const cache = {};
  const mk = (name) => new Proxy(function () {}, {
    get: (t, k) => (k === Symbol.toPrimitive || k === 'toString') ? () => name : mk(name + '.' + String(k)),
    apply: () => mk(name + '()')
  });
  return {
    SpreadsheetApp: mk('SpreadsheetApp'),
    DriveApp: mk('DriveApp'),
    Session: mk('Session'),
    ScriptApp: mk('ScriptApp'),
    UrlFetchApp: mk('UrlFetchApp'),
    MailApp: mk('MailApp'),
    HtmlService: mk('HtmlService'),
    ContentService: mk('ContentService'),
    Logger: { log: () => {} },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => (k in cache ? cache[k] : null),
        put: (k, v) => { cache[k] = v; },
        remove: (k) => { delete cache[k]; },
        removeAll: (a) => { (a || []).forEach(k => delete cache[k]); }
      })
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (k in props ? props[k] : null),
        setProperty: (k, v) => { props[k] = String(v); },
        deleteProperty: (k) => { delete props[k]; },
        getProperties: () => Object.assign({}, props)
      })
    },
    Utilities: {
      getUuid: () => 'uuid-' + Math.random().toString(36).slice(2),
      formatDate: (d) => new Date(d).toISOString().slice(0, 10),
      computeDigest: (alg, s) => Array.from(String(s)).map(c => c.charCodeAt(0) & 0xff),
      base64Encode: (s) => Buffer.from(String(s)).toString('base64'),
      base64Decode: (s) => Array.from(Buffer.from(String(s), 'base64')),
      sleep: () => {},
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' }
    }
  };
}

/* טעינת קוד השרת לתוך הקשר מבודד */
function loadServer() {
  const ctx = Object.assign({ console, JSON, Math, Date, RegExp, Number, String, Boolean, Array, Object, isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent }, appsScriptStubs());
  vm.createContext(ctx);
  vm.runInContext(serverSrc(), ctx, { filename: 'קוד שרת.js' });
  return ctx;
}

/* ---------- דפדפן מדומה ---------- */
let JSDOM = null;
function needJsdom() {
  if (JSDOM) return JSDOM;
  try { JSDOM = require('jsdom').JSDOM; }
  catch (e) {
    throw new Error('חסרה החבילה jsdom. התקן בסשן:  npm i jsdom   (node_modules לעולם לא נכנס לריפו)');
  }
  return JSDOM;
}

/* מסד נתונים ריק — נגזר מ-TMAP של השרת ולכן מתעדכן מעצמו כשמוסיפים טבלה.
   אין כאן רשימה ידנית שאפשר לשכוח לעדכן. */
function emptyDb(serverCtx) {
  const db = {};
  const tmap = serverCtx && serverCtx.TMAP;
  if (!tmap) throw new Error('TMAP לא נמצא בקוד השרת — לא ניתן לבנות DB ריק');
  Object.keys(tmap).forEach(t => { db[tmap[t]] = []; });
  return db;
}

function loadUi(opts) {
  opts = opts || {};
  const JD = needJsdom();
  const html = indexSrc();
  /* jsdom רועש על יכולות שאינן ממומשות בו (canvas, print). זה בדיוק סוג
     הפער שהכרטיס של B61 נועד לכסות בדפדפן האמיתי — כאן הוא מושתק כדי
     שרעש לא יסתיר כשלון אמיתי. */
  const { VirtualConsole } = require('jsdom');
  const vc = new VirtualConsole();
  vc.on('jsdomError', () => {});
  const dom = new JD(html, {
    runScripts: 'outside-only',
    url: opts.url || 'https://aviav4433-cell.github.io/mapa-noble/',
    pretendToBeVisual: false,
    virtualConsole: vc
  });
  const w = dom.window;

  /* אין רשת בבדיקות. כל קריאה לא צפויה נרשמת ונחשפת לבדיקה. */
  w.__fetches = [];
  w.fetch = async (url, o) => {
    w.__fetches.push({ url, body: o && o.body });
    return { ok: true, json: async () => ({ ok: true }), text: async () => '{"ok":true}' };
  };
  /* ⚠ חובה — בלי זה ה-polling של B58 תוקע את הריצה לנצח. */
  w.__timers = 0;
  w.setInterval = function () { w.__timers++; return 0; };
  w.setTimeout = function () { w.__timers++; return 0; };
  w.clearInterval = function () {};
  w.clearTimeout = function () {};
  w.scrollTo = function () {};
  w.print = function () { w.__printed = (w.__printed || 0) + 1; };
  w.open = function () { w.__opened = (w.__opened || 0) + 1; return { close: () => {}, document: { write: () => {}, close: () => {} } }; };
  w.alert = function () {};
  w.confirm = function () { return true; };

  w.eval(uiScript());
  return { dom, window: w };
}

/* כניסה מדומה — מעמידה את המערכת במצב "משתמש מחובר" בלי שום קריאת שרת.
   מחקה בדיוק את מה ש-applyLogin + enterApp עושים לגבי המצב הגלובלי. */
function login(w, role, serverCtx, over) {
  over = over || {};
  w.TOKEN = over.token || 'test-token';
  w.USER = over.user || ('בודק ' + role);
  w.ROLE = role;
  w.CAN_EDIT = over.can_edit !== false;
  w.USER_VIEWS = over.views || '';
  w.IS_SUPER_ADMIN = over.is_super_admin === true;
  w.DB = over.db || emptyDb(serverCtx);
  w.VIEW = (role === 'נהג') ? 'deliveries' : 'dash';
  const app = w.document.getElementById('app');
  const lg = w.document.getElementById('login');
  if (app) app.style.display = 'block';
  if (lg) lg.style.display = 'none';
  w.render();
  return w;
}

/* ---------- B62: העמדת רוחב חלון ----------
   jsdom אינו מממש window.matchMedia. בלי הסטאב הזה navIsTop/navIsSide
   נופלים ל-catch ומחזירים false תמיד, כלומר navMode() הוא 'mob' לנצח
   ואת סרגל הצד אי אפשר לבדוק בכלל. setWidth מעמיד רוחב אמיתי ומאפשר
   לבדוק את שלושת מצבי הניווט.
   ⚠ זה עדיין לא פריסה — אין ל-jsdom מנוע פריסה, ולכן גבהים ורוחבי
   אלמנטים הם אפס. מדידת הגובה בפועל היא בשכבה 2 (b61Tests). */
function setWidth(w, px) {
  Object.defineProperty(w, 'innerWidth', { value: px, configurable: true, writable: true });
  w.matchMedia = function (q) {
    const mn = /min-width:\s*(\d+)px/.exec(q || '');
    const mx = /max-width:\s*(\d+)px/.exec(q || '');
    let matches = true;
    if (mn) matches = matches && px >= Number(mn[1]);
    if (mx) matches = matches && px <= Number(mx[1]);
    if (!mn && !mx) matches = false;
    return {
      matches, media: q, onchange: null,
      addListener() {}, removeListener() {},
      addEventListener() {}, removeEventListener() {},
      dispatchEvent() { return false; }
    };
  };
  return w;
}

/* ---------- R7: אירועי DOM אמיתיים ----------
   ב-jsdom במצב outside-only מטפלי on* בתגית אינם מקומפלים. wire() קורא את
   מחרוזת ה-on* ומחבר אותה כמאזין אמיתי, ואז אפשר לדספאטץ' אירוע אמיתי.
   ⚠ קריאה ישירה ל-handler אינה קבילה כבדיקה. */
function wire(w, elem, evName) {
  evName = evName || 'click';
  const attr = elem.getAttribute('on' + evName);
  if (!attr) return elem;
  if (elem.__wired && elem.__wired[evName]) return elem;
  elem.__wired = elem.__wired || {};
  elem.__wired[evName] = true;
  const fn = new w.Function('event', attr);
  elem.addEventListener(evName, function (ev) { fn.call(this, ev); });
  return elem;
}
function click(w, elem) {
  wire(w, elem, 'click');
  elem.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
  return elem;
}
function change(w, elem, value) {
  if (value !== undefined) elem.value = value;
  wire(w, elem, 'change');
  elem.dispatchEvent(new w.Event('change', { bubbles: true }));
  return elem;
}
function popstate(w, state) {
  w.dispatchEvent(new w.PopStateEvent('popstate', { state: state || null }));
}

const H = { ROOT, INDEX, SERVER, indexSrc, serverSrc, uiScript, stripComments,
  loadServer, loadUi, emptyDb, login, setWidth, wire, click, change, popstate };

const SPECS = [];

/* ==================== חלק 3 — הבדיקות ==================== */

/* t01 — שומרים על קוד המקור.
   בדיקות שאינן מריצות כלום: הן קוראות את הקוד החי ומוודאות שכללי הברזל
   לא הופרו. זו השכבה שתופסת "מישהו הוסיף שורה שאסור להוסיף". */


SPECS.push({
  file: 't01-guards',
  title: 'שומרי קוד מקור — R4 · B60a · canary',
  needs: 'src',
  requires: [],

  tests: {

    'index.html שלם ומסתיים ב-</html>': (t) => {
      const s = H.indexSrc().trim();
      t.ok(s.startsWith('<!DOCTYPE') || s.startsWith('<!doctype'), 'הקובץ אינו מתחיל ב-DOCTYPE');
      t.ok(s.endsWith('</html>'), 'הקובץ נקטע — אינו מסתיים ב-</html>');
    },

    'קוד שרת.txt הוא קוד שרת ולא HTML': (t) => {
      const s = H.serverSrc().trimStart();
      t.ok(s.startsWith('// ===='), 'הקובץ אינו מתחיל ב-"// ====" — ייתכן ש-index.html הועלה עליו');
      t.hasNot(s.slice(0, 200), '<!DOCTYPE', 'קוד השרת הוחלף ב-HTML');
    },

    '⛔ B60a — אין בקוד שום קריאה ל-history.back או history.go': (t) => {
      /* ⚠ הסרת הערות היא חלק מהבדיקה, לא קיצור דרך: בקוד יש ארבעה אזכורים
         של האיסור בתוך הערות. סורק תמים היה נכשל שקרית ומאבד אמון. */
      const code = H.stripComments(H.uiScript());
      t.hasNot(code, 'history.back', 'נוספה קריאה ל-history.back — אסור. B60a נכשל בייצור בדיוק בגלל זה');
      t.hasNot(code, 'history.go(', 'נוספה קריאה ל-history.go — אסור');
      /* ואימות נגדי: האיסור אכן מתועד בהערות, כלומר הסורק באמת מסיר אותן */
      t.has(H.uiScript(), 'history.back', 'ההערה שמסבירה את האיסור נעלמה — הסורק כבר לא מוכיח דבר');
    },

    'API_URL לא שונה': (t) => {
      const code = H.stripComments(H.uiScript());
      const m = code.match(/var\s+API_URL\s*=\s*'([^']+)'/);
      t.ok(!!m, 'לא נמצאה הגדרת API_URL');
      if (m) {
        t.has(m[1], 'https://script.google.com/macros/s/', 'API_URL אינו כתובת Apps Script');
        t.has(m[1], '/exec', 'API_URL אינו מצביע על /exec');
      }
      t.eq((code.match(/API_URL\s*=/g) || []).length, 1, 'API_URL מוצב יותר מפעם אחת');
    },

    'canary על מסך הכניסה זהה ל-B61_CANARY בקוד': (t) => {
      const s = H.indexSrc();
      const inHtml = (s.match(/גרסה\s+(v[\d.]+-B\w+)/) || [])[1];
      const inJs = (s.match(/B61_CANARY\s*=\s*'([^']+)'/) || [])[1];
      t.ok(!!inHtml, 'לא נמצא canary על מסך הכניסה');
      t.ok(!!inJs, 'לא נמצא B61_CANARY בקוד');
      t.eq(inHtml, inJs, 'שני ה-canary לא תואמים — אחד מהם נשכח בעדכון');
      t.ok(/^v\d+\.\d+-B\d+[a-z]?$/.test(inHtml || ''), 'פורמט ה-canary אינו vX.XX-B##');
    },

    'בלוק <script> ראשי אחד בלבד': (t) => {
      const s = H.indexSrc();
      /* שאר האזכורים הם מחרוזות הדפסה עם <\/script> ממולט — לא בלוקים אמיתיים */
      const real = (s.match(/\n<script>/g) || []).length;
      t.eq(real, 1, 'יש יותר מבלוק סקריפט אמיתי אחד — הרתמה מחלצת רק את הראשון');
    },

    'אין סיסמאות או טוקנים ב-localStorage בטקסט גלוי': (t) => {
      const code = H.stripComments(H.uiScript());
      t.hasNot(code, "localStorage.setItem('mn_pass", 'סיסמה נשמרת ב-localStorage');
      t.hasNot(code, "localStorage.setItem('mn_token", 'טוקן הסשן נשמר ב-localStorage במקום sessionStorage');
      /* טוקן המכשיר ("זכור אותי") הוא היחיד המותר — הוא ניתן לביטול בשרת */
      t.has(code, "localStorage.setItem('mn_devtoken'", 'טוקן "זכור אותי" נעלם');
    },

    'B60_VIEW_RESET הוא טבלת האיפוס היחידה': (t) => {
      const code = H.stripComments(H.uiScript());
      t.eq((code.match(/var\s+B60_VIEW_RESET\s*=/g) || []).length, 1, 'הטבלה מוגדרת יותר מפעם אחת');
      t.eq((code.match(/function\s+b60ResetView/g) || []).length, 1, 'b60ResetView מוגדרת יותר מפעם אחת');
      t.has(code, 'B60_VIEW_RESET[v]', 'b60ResetView כבר לא קורא מהטבלה');
    },

    'R4 — המנגנונים החסינים עדיין קיימים בממשק': (t) => {
      /* ⚠ שמות אמיתיים מהקוד החי. TASK_QUEUE נקב בשמות שאינם קיימים
         (navFilter · b58Prefetch) — תוקן ב-B61. */
      const code = H.stripComments(H.uiScript());
      ['allowedViews', 'navGroupOf', 'navQuickKeys', 'navIsSide', 'navIsTop', 'navMode',
       'DRIVER_TAB_ORDER', 'b54Ledger', 'custBalance', 'moreMenu', 'toggleMore', 'exportCsv',
       'REPORTS_CATALOG', 'IDLE_LIMIT_MS', 'b58Loading', 'b58Tables', 'kioskOn'
      ].forEach(n => t.has(code, n, 'מנגנון חסין נעלם מהממשק: ' + n));
    },

    'R4 — המנגנונים החסינים עדיין קיימים בשרת': (t) => {
      const code = H.stripComments(H.serverSrc());
      ['READ_ONLY_ACTIONS', 'B52_KIOSK_ACTIONS', 'b48BalancesAg', 'b2CreditUsedAg',
       'b54Ledger', 'clockCore', 'buildPayrollForMonth', 'sha256WithSalt', 'setupDatabase', 'b58Prefetch'
      ].forEach(n => t.has(code, n, 'מנגנון חסין נעלם מהשרת: ' + n));
    },

    'מנגנון B60 לעולם אינו משנה את הכתובת': (t) => {
      /* ⚠ הטענה חלה על b60HistPush/b60HistInit בלבד. הקיוסק (B52) כן משנה
         כתובת בכוונה — הוא מנקה את הטוקן מה-URL, וזה מנגנון מוגן ב-R4. */
      const code = H.stripComments(H.uiScript());
      const seg = code.slice(code.indexOf('function b60HistPush'), code.indexOf('function go(v, o)'));
      t.ok(seg.length > 100, 'לא נמצא קטע המנגנון של B60');
      const calls = seg.match(/history\.(pushState|replaceState)\s*\([^;]*?\)/g) || [];
      t.ok(calls.length >= 2, 'המנגנון כבר לא קורא ל-pushState/replaceState');
      calls.forEach(c => t.has(c, 'location.href', 'קריאה במנגנון B60 שמשנה כתובת: ' + c.slice(0, 80)));
    },

    'B52 — ניקוי הטוקן מכתובת הקיוסק עדיין קיים': (t) => {
      const code = H.stripComments(H.uiScript());
      t.has(code, "location.pathname + '?kiosk=1'", 'הקיוסק כבר לא מנקה את הטוקן מהכתובת — מנגנון מוגן ב-R4');
    },

    'setupDatabase הוא מסלול יצירת הטבלאות היחיד': (t) => {
      const code = H.stripComments(H.serverSrc());
      t.eq((code.match(/function\s+setupDatabase/g) || []).length, 1, 'setupDatabase מוגדרת יותר מפעם אחת');
    }

  }
});

/* t02 — ניווט, איפוס מצב מסך והיסטוריית דפדפן.   T3 · T4 · B60a · B62
   ============================================================
   ⚠ הקובץ הזה נכתב מחדש ב-B62. הגרסה של B61 לא הגיעה לריפו (הועלו שבעה
   קבצים בשמות מוחלפים ו-t02 נעדר לחלוטין), והתגלה בפתיחת הסשן: הספרייה
   החזירה 66 בדיקות במקום 87. הוא נכתב כאן מול הקוד החי, לא משוחזר מזיכרון.

   ⚠ מה הקובץ הזה **אינו** מוכיח: ש"הקודם" עובד בדפדפן של אבי. ל-jsdom אין
   מחסנית היסטוריה אמיתית — pushState כאן הוא רישום בזיכרון. זה בדיוק הכשל
   של B60 (60 בדיקות ירוקות, כשלון בייצור בלחיצה השנייה). האימות האמיתי
   הוא בכרטיס "בדיקה עצמית", שכן רץ בדפדפן. כאן נבדקת ההחלטה, לא הדפדפן. */


SPECS.push({
  file: 't02-nav-history',
  title: 'ניווט, איפוס מצב מסך והיסטוריה — T3 · T4 · B60a',
  needs: 'ui',
  requires: ['go', 'VIEW', 'allowedViews', 'B60_VIEW_RESET', 'b60ResetView',
             'b60HistCtx', 'b60HistPush', 'b60HistInit', 'b60ModalOpen',
             'b60Log', 'b60LogRows', 'b60LogClear', 'navGroupOf', 'navMode',
             'openModal', 'closeModal', 'goHome'],

  tests: {

    /* ===== T3 — איפוס מצב מסך ===== */

    'B60_VIEW_RESET הוא הטבלה היחידה — אין רשימת איפוס שנייה': (t, { H }) => {
      const src = H.stripComments(H.uiScript());
      const n = (src.match(/B60_VIEW_RESET\s*=/g) || []).length;
      t.eq(n, 1, 'B60_VIEW_RESET מוגדר יותר מפעם אחת — נוצרה רשימה מקבילה');
      t.ok(/function\s+b60ResetView/.test(src), 'b60ResetView נמחק — האיפוס לא יופעל מ-go()');
    },

    'go() מאפס את מצב המסך של דוחות (T3)': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.REPORT_ID = 'hours';
      w.REPORT_PARAMS = { m: '2026-07' };
      w.go('reports');
      t.eq(w.REPORT_ID, '', 'REPORT_ID לא אופס — לחיצה על "דוחות" תחזיר לאותו דוח (הבאג המקורי)');
      t.eq(Object.keys(w.REPORT_PARAMS).length, 0, 'REPORT_PARAMS נשאר מלא');
    },

    'go() מאפס גם את רצפת הייצור ואת ההחזרות': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.FLOOR_INTAKE_ORDER = 'ord-1';
      w.FLOOR_INTAKE_CARTS = ['c1'];
      w.go('floor');
      t.eq(w.FLOOR_INTAKE_ORDER, '', 'הקליטה נשארה קשורה להזמנה ישנה');
      t.eq(w.FLOOR_INTAKE_CARTS.length, 0, 'עגלות מקליטה קודמת נשארו בזיכרון');
      w.RET = { id: 'r1' };
      w.go('returns');
      t.eq(w.RET, null, 'תעודת החזרה פתוחה נשארה בהקשר');
    },

    'go(v,{keep:1}) — דריל-דאון אינו מאפס מצב': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.REPORT_ID = 'hours';
      w.go('reports', { keep: 1 });
      t.eq(w.REPORT_ID, 'hours', 'keep לא נשמר — דריל-דאון לדוח מסוים יישבר');
    },

    'העדפת תצוגה (טאב) נשמרת במכוון ואינה מתאפסת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.FIN_TAB = 'invoices';
      w.ORD_TAB = 'closed';
      w.go('finance');
      t.eq(w.FIN_TAB, 'invoices', 'FIN_TAB אופס — טאב גלוי הוא מחלקה ב\' ואסור לאפס אותו');
      w.go('orders');
      t.eq(w.ORD_TAB, 'closed', 'ORD_TAB אופס');
    },

    'UNDO_PENDING לעולם אינו מאופס על ידי go()': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.UNDO_PENDING = { pending: 1 };
      w.go('orders');
      t.ok(w.UNDO_PENDING, 'UNDO_PENDING אופס — פעולה שהמשתמש כבר אישר לא תישלח לשרת');
    },

    /* ===== T4 / B60a — היסטוריה ===== */

    '⛔ אין בקוד history.back או history.go': (t, { H }) => {
      const src = H.stripComments(H.uiScript());
      t.hasNot(src, 'history.back', 'הוחזרה קריאה שמזיזה את ההיסטוריה אחורה — זה הוציא את אבי מהאתר ב-B60');
      t.hasNot(src, 'history.go', 'הוחזרה history.go — אסור. המנגנון מגיב ל"הקודם" ולעולם לא יוזם אותו');
    },

    'b60HistInit משתמש ב-replaceState בלבד, בלי pushState': (t, { H }) => {
      const src = H.stripComments(H.uiScript());
      const i = src.indexOf('function b60HistInit');
      t.ok(i > -1, 'b60HistInit נמחק');
      const body = src.slice(i, src.indexOf('\n}', i));
      t.has(body, 'replaceState', 'b60HistInit אינו מעגן — אין replaceState');
      t.hasNot(body, 'pushState', 'b60HistInit דוחף רשומה בטעינת דף, בלי מחוות משתמש — זה היה הבאג של B60');
    },

    'הכתובת לעולם אינה משתנה — כל דחיפה מקבלת location.href': (t, { H }) => {
      const src = H.stripComments(H.uiScript());
      const calls = src.match(/history\.(push|replace)State\s*\([^;]*?\)/g) || [];
      t.ok(calls.length > 0, 'לא נמצאה אף קריאת pushState/replaceState');
      calls.forEach(c => {
        if (/kiosk/i.test(c)) return;   // B52 מנקה את הטוקן מהכתובת — מנגנון נפרד ומותר
        t.has(c, 'location.href', 'קריאה שמשנה את הכתובת: ' + c.slice(0, 80) +
          ' — זה שובר ?portal=1 / ?shop=1 / ?kiosk=1');
      });
    },

    'b60HistCtx מכובה בפורטל, בחנות ובמסך הכניסה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      t.ok(w.b60HistCtx(), 'המנגנון כבוי בהקשר צוות רגיל — "הקודם" לא יעבוד כלל');
      const app = w.document.getElementById('app');
      app.style.display = 'none';
      t.no(w.b60HistCtx(), 'המנגנון פעיל כשהמערכת מוסתרת (מסך כניסה / נעילת B7)');
      app.style.display = 'block';
      const tok = w.TOKEN;
      w.TOKEN = '';
      t.no(w.b60HistCtx(), 'המנגנון פעיל בלי טוקן');
      w.TOKEN = tok;
    },

    'דחיפה חוזרת לאותו מסך מחליפה ואינה מנפחת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.VIEW = 'orders';
      const before = w.history.length;
      w.b60HistPush('orders');
      t.eq(w.history.length, before, 'נדחפה רשומה מיותרת — "הקודם" יצטרך שתי לחיצות לאותו מסך');
    },

    'force=true דוחף רשומה גם כשהמסך זהה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.VIEW = 'orders';
      w.b60HistPush('orders');
      const before = w.history.length;
      w.b60HistPush('orders', true);
      t.ok(w.history.length > before, 'force לא דוחף — סגירת מודל ודריל-דאון לא ייכנסו להיסטוריה');
    },

    'popstate מנווט למסך שב-state (R7 — אירוע אמיתי)': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.go('orders');
      H.popstate(w, { mn: 1, v: 'customers' });
      t.eq(w.VIEW, 'customers', '"הקודם" לא החזיר למסך שברשומה');
    },

    'popstate למסך אסור לתפקיד — נשארים במקום': (t, { w, srv, H }) => {
      H.login(w, 'נהג', srv);
      const before = w.VIEW;
      H.popstate(w, { mn: 1, v: 'audit' });   // יומן פעולות — מנהל בלבד
      t.eq(w.VIEW, before, 'הנהג נזרק למסך שאינו מותר לו דרך "הקודם" — דליפת הרשאה');
    },

    'popstate בלי state שלנו — נשארים ומעגנים מחדש': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.go('items');
      H.popstate(w, null);
      t.eq(w.VIEW, 'items', 'רשומה זרה בהיסטוריה הזיזה את המשתמש');
    },

    'מודל פתוח + "הקודם" = סגירת המודל בלבד': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.go('orders');
      w.openModal('<h2>בדיקה</h2>');
      t.ok(w.b60ModalOpen(), 'המודל לא נפתח — הבדיקה לא בודקת כלום');
      H.popstate(w, { mn: 1, v: 'customers' });
      t.no(w.b60ModalOpen(), 'המודל נשאר פתוח אחרי "הקודם"');
      t.eq(w.VIEW, 'orders', 'המסך התחלף במקום רק לסגור את המודל');
    },

    'go() מ-popstate אינו דוחף רשומה חדשה (אין לולאה)': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.go('orders');
      const before = w.history.length;
      w.go('customers', { fromHistory: 1 });
      t.eq(w.history.length, before, 'fromHistory דחף רשומה — "הקודם" ייצור לולאה אינסופית');
    },

    'go() רגיל כן דוחף רשומה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.go('orders');
      const before = w.history.length;
      w.go('customers');
      t.ok(w.history.length > before, 'ניווט רגיל לא נכנס להיסטוריה — "הקודם" יצא מהאתר');
    },

    'go() שומר את המסך ב-sessionStorage — רענון חוזר לאותו מסך': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.go('items');
      t.eq(w.sessionStorage.getItem('mn_view'), 'items', 'המסך לא נשמר — רענון יחזיר ללוח הבקרה');
    },

    'goHome מחזיר ללוח הבקרה כשהוא מותר': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.go('orders');
      w.goHome();
      t.eq(w.VIEW, 'dash', 'לחיצה על הלוגו לא מחזירה לעמוד הבית');
    },

    'goHome אינו זורק לתפקיד שאין לו לוח בקרה': (t, { w, srv, H }) => {
      H.login(w, 'נהג', srv);
      const before = w.VIEW;
      w.goHome();
      t.eq(w.VIEW, before, 'הנהג הועבר ללוח בקרה שאינו מותר לו');
    },

    /* ===== B60a — יומן האבחון ===== */

    'יומן ההיסטוריה נרשם ב-sessionStorage ואינו נוגע בשרת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.b60LogClear();
      w.__fetches.length = 0;
      w.go('orders');
      w.go('customers');
      const rows = w.b60LogRows();
      t.ok(rows.length >= 2, 'היומן לא נרשם — אין דרך לאבחן כשלון היסטוריה אצל אבי');
      t.eq(w.__fetches.length, 0, 'יומן האבחון שלח בקשה לשרת — הוא חייב להיות מקומי בלבד');
    },

    'היומן אינו גדל בלי גבול': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.b60LogClear();
      for (let i = 0; i < w.B60_LOG_MAX + 15; i++) w.b60Log('בדיקה', 'v' + i);
      t.ok(w.b60LogRows().length <= w.B60_LOG_MAX,
        'היומן עבר את B60_LOG_MAX — sessionStorage יתמלא');
    },

    'b60LogClear מנקה בפועל': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.b60Log('בדיקה', 'x');
      w.b60LogClear();
      t.eq(w.b60LogRows().length, 0, 'הניקוי לא עבד');
    },

    /* ===== R4 — מה שאסור להישבר בניווט ===== */

    'שלושת מצבי הניווט קיימים ונבחרים לפי הרוחב': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      H.setWidth(w, 1422); t.eq(w.navMode(), 'side', 'ב-1422px מצב הניווט אינו סרגל צד');
      H.setWidth(w, 1000); t.eq(w.navMode(), 'top', 'ב-1000px נשבר תפריט B47 (900–1099)');
      H.setWidth(w, 700);  t.eq(w.navMode(), 'mob', 'ב-700px נשבר אקורדיון המובייל');
    },

    'האקורדיון של המובייל לא נגוע (R4)': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      H.setWidth(w, 700);
      t.eq(typeof w.toggleNavPanel, 'function', 'toggleNavPanel נמחק — אין תפריט במובייל');
      w.NAV_OPEN = '';
      w.navToggle('כוח אדם');
      t.eq(w.NAV_OPEN, 'כוח אדם', 'האקורדיון של המובייל לא נפתח');
      w.navToggle('כוח אדם');
      t.eq(w.NAV_OPEN, '__closed__', 'האקורדיון של המובייל לא נסגר');
    },

    'החלונית הנפתחת של 900–1099 לא נגועה (R4)': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      H.setWidth(w, 1000);
      w.render();
      w.NAV_DD = '';
      w.navToggle('כוח אדם');
      t.eq(w.NAV_DD, 'כוח אדם', 'החלונית של תפריט B47 לא נפתחת');
      t.has(w.document.getElementById('nav').innerHTML, 'gmenu',
        '.gmenu נעלם מהתפריט העליון — 900–1099px נשבר');
    },

    'סרגל הטאבים של הנהג נשאר בסדר הקבוע (R4)': (t, { w, srv, H }) => {
      H.login(w, 'נהג', srv);
      t.eq(w.DRIVER_TAB_ORDER.join(','), 'deliveries,attendance,payroll,tasks',
        'סדר הטאבים של הנהג שונה');
      t.has(w.document.getElementById('nav').innerHTML, 'dtab',
        'הנהג קיבל סרגל צד במקום טאבים תחתונים');
    }

  }
});

/* t03 — הרשאות, תפקידים ועוזרי ליבה.
   חמישה תפקידים × ארבעה הקשרי ריצה הם שאלה 6 ב-R2. הקובץ הזה הוא
   התשובה האוטומטית עליה, כדי שאף אצווה לא תצטרך לבדוק אותה ידנית שוב. */

SPECS.push({
  file: 't03-roles-core',
  title: 'הרשאות, תפקידים ועוזרי ליבה',
  needs: 'ui',
  requires: ['allowedViews', 'VIEWS', 'NAV_GROUPS', 'navGroupOf', 'DRIVER_TAB_ORDER',
             'navIsTop', 'navIsSide', 'navMode', 'esc', 'ymdLocal', 'ils', 'ilsVat',
             'VAT_RATE', 'el', 'kioskOn', 'custBalance',
             'b45Gross', 'b45Money', 'b12Gross', 'b12Net'],

  tests: {

    'כל מסך ב-VIEWS משויך לקטגוריה בתפריט': (t, { w }) => {
      w.VIEWS.forEach(v => {
        t.ok(w.NAV_GROUPS.some(g => g[2].indexOf(v[0]) > -1), 'מסך בלי קטגוריה: ' + v[0]);
      });
    },

    'אין מסך בקטגוריה שאינו קיים ב-VIEWS': (t, { w }) => {
      const keys = w.VIEWS.map(v => v[0]);
      w.NAV_GROUPS.forEach(g => g[2].forEach(k => {
        t.ok(keys.indexOf(k) > -1, 'קטגוריה מפנה למסך שלא קיים: ' + k);
      }));
    },

    'מנהל רואה הכל חוץ ממסך מנהל ראשי': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const keys = w.allowedViews().map(v => v[0]);
      t.ok(keys.indexOf('audit') > -1, 'למנהל אין יומן פעולות');
      t.ok(keys.indexOf('payroll') > -1, 'למנהל אין שכר');
      t.eq(keys.indexOf('superadmin'), -1, 'מסך מנהל ראשי נחשף בלי IS_SUPER_ADMIN');
    },

    'מסך מנהל ראשי נפתח רק לפי דגל השרת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { is_super_admin: true });
      t.ok(w.allowedViews().map(v => v[0]).indexOf('superadmin') > -1, 'מנהל ראשי לא רואה את המסך שלו');
    },

    'B4 — יומן פעולות למנהל בלבד': (t, { w, srv, H }) => {
      ['משרד', 'מכבסה', 'נהג', 'עובד רצפה'].forEach(role => {
        H.login(w, role, srv);
        t.eq(w.allowedViews().map(v => v[0]).indexOf('audit'), -1, 'יומן פעולות דלף לתפקיד ' + role);
      });
    },

    'משרד — בלי שכר ובלי הגדרות': (t, { w, srv, H }) => {
      H.login(w, 'משרד', srv);
      const keys = w.allowedViews().map(v => v[0]);
      t.eq(keys.indexOf('payroll'), -1, 'משרד רואה שכר');
      t.eq(keys.indexOf('settings'), -1, 'משרד רואה הגדרות');
      t.ok(keys.indexOf('orders') > -1, 'משרד לא רואה הזמנות');
    },

    'B17 — נהג רואה בדיוק ארבעה מסכים': (t, { w, srv, H }) => {
      H.login(w, 'נהג', srv);
      const keys = w.allowedViews().map(v => v[0]).sort();
      t.eq(keys.join(','), 'attendance,deliveries,payroll,tasks', 'הרכב המסכים של הנהג השתנה');
      t.eq(w.VIEW, 'deliveries', 'ברירת המחדל של הנהג אינה "המסלול שלי"');
    },

    'סרגל הטאבים של הנהג תואם למסכים שלו': (t, { w, srv, H }) => {
      H.login(w, 'נהג', srv);
      const allowed = w.allowedViews().map(v => v[0]);
      w.DRIVER_TAB_ORDER.forEach(k => t.ok(allowed.indexOf(k) > -1, 'טאב נהג למסך שאינו מותר לו: ' + k));
      t.eq(w.DRIVER_TAB_ORDER.length, 4, 'מספר הטאבים של הנהג השתנה');
    },

    'עובד רצפה ומכבסה — היקף מצומצם ותקין': (t, { w, srv, H }) => {
      H.login(w, 'עובד רצפה', srv);
      t.eq(w.allowedViews().map(v => v[0]).sort().join(','), 'attendance,floor,tasks', 'היקף עובד רצפה השתנה');
      H.login(w, 'מכבסה', srv);
      const l = w.allowedViews().map(v => v[0]);
      t.ok(l.indexOf('laundry') > -1, 'מכבסה לא רואה את מסך הכביסה');
      t.eq(l.indexOf('finance'), -1, 'מכבסה רואה כספים');
    },

    'USER_VIEWS מהגיליון גובר על תפקיד': (t, { w, srv, H }) => {
      H.login(w, 'עובד רצפה', srv, { views: 'dash, orders' });
      t.eq(w.allowedViews().map(v => v[0]).sort().join(','), 'dash,orders', 'רשימת מסכים מותאמת לא נאכפה');
    },

    'esc מנטרל HTML': (t, { w }) => {
      t.has(w.esc('<script>x</script>'), '&lt;');
      t.hasNot(w.esc('<b>'), '<b>', 'תגית עברה בלי ניטרול');
      t.eq(w.esc(null), '', 'null אינו מוחזר כמחרוזת ריקה');
    },

    'ymdLocal מחזיר תאריך מקומי ולא UTC': (t, { w }) => {
      const d = new Date();
      const local = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
      t.eq(w.ymdLocal(), local, 'ymdLocal חזר ל-toISOString — זו מחלקת הבאג של B38');
      t.eq(w.ymdLocal(new Date(2026, 0, 1, 1, 30)), '2026-01-01', 'שעה מוקדמת גלשה ליום הקודם');
      t.eq(w.ymdLocal(new Date(2026, 11, 31, 23, 30)), '2026-12-31', 'שעה מאוחרת גלשה ליום הבא');
    },

    'B45 — מע"מ 18% ותצוגת נטו מול כולל': (t, { w }) => {
      t.eq(w.VAT_RATE, 0.18, 'שיעור המע"מ השתנה — בדוק שזה מכוון');
      t.has(w.ils(100), '100');
      t.has(w.ils(100), '₪');
      t.has(w.ilsVat(100), '118', 'ilsVat אינו מוסיף מע"מ');
    },

    'BLD-12 — שיעור המע"מ של החנות והפורטל הוא אותו שיעור של המערכת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      t.eq(w.b12Gross(100), w.b45Gross(100),
        'BLD-12 מחשב מע"מ בנפרד מהמערכת — שני שיעורים סותרים');
      w.DB.settings = [{ key: 'vat_rate', value: '0.17' }];
      t.eq(w.b12Gross(100), w.b45Gross(100),
        'שינוי vat_rate בהגדרות אינו מגיע לחנות ולפורטל');
    },

    '⛔ BLD-12 לא שינה את כלל B45 בשאר המערכת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const m = w.b45Money(100);
      t.ok(m.indexOf(w.ils(100)) < m.indexOf('כולל מע'),
        'B45 התהפך — הברוטו הפך למספר הראשי מחוץ לחנות ולפורטל');
    },

    'custBalance על DB ריק מחזיר 0 ואינו זורק': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      t.eq(w.custBalance('אין-כזה-לקוח'), 0, 'יתרה של לקוח לא קיים אינה 0');
    },

    'kioskOn שקר בהקשר צוות רגיל': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      t.no(w.kioskOn(), 'המערכת חושבת שהיא בקיוסק');
    },

    'שלושת מצבי הניווט עקביים עם נקודות השבירה': (t, { w }) => {
      t.eq(typeof w.navMode(), 'string');
      t.ok(['side', 'top', 'mob'].indexOf(w.navMode()) > -1, 'navMode החזיר מצב לא מוכר: ' + w.navMode());
      t.no(w.navIsSide() && !w.navIsTop(), 'סרגל צד פעיל בלי שהתפריט העליון פעיל — נקודות השבירה התהפכו');
    },

    'render בכל מסך מותר אינו זורק (DB ריק)': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { is_super_admin: true });
      w.allowedViews().forEach(v => {
        try { w.go(v[0]); }
        catch (e) { t.fail('המסך "' + v[0] + '" קורס על DB ריק: ' + (e && e.message)); }
      });
    },

    'render לכל תפקיד אינו זורק (DB ריק)': (t, { w, srv, H }) => {
      ['מנהל', 'משרד', 'מכבסה', 'נהג', 'עובד רצפה'].forEach(role => {
        try { H.login(w, role, srv); }
        catch (e) { t.fail('כניסה בתפקיד ' + role + ' קורסת: ' + (e && e.message)); }
      });
    },

    'טעינת הממשק אינה שולחת שום בקשה לשרת מעצמה': (t, { w, srv, H }) => {
      w.__fetches.length = 0;
      H.login(w, 'מנהל', srv);
      w.go('orders'); w.go('customers'); w.go('dash');
      t.eq(w.__fetches.length, 0, 'ניווט רגיל שלח ' + w.__fetches.length + ' בקשות לשרת (R10)');
    }

  }
});

/* t04 — קוד השרת: סכימה, ניתוב, הרשאות וכסף.
   רץ ב-vm.createContext עם Apps Script מדומה. אין גיליון אמיתי ואין רשת —
   הבדיקות כאן הן על הצהרות ועל לוגיקה טהורה, לא על נתונים. */

SPECS.push({
  file: 't04-server',
  title: 'קוד שרת — סכימה, ניתוב, הרשאות וכסף',
  needs: 'server',
  requires: ['TABLES', 'TMAP', 'route', 'READ_ONLY_ACTIONS', 'MANAGER_ONLY',
             'setupDatabase', 'sha256WithSalt', 'b48BalancesAg', 'b2CreditUsedAg',
             'b54Ledger', 'B52_KIOSK_ACTIONS', 'b58Prefetch', 'clockCore', 'buildPayrollForMonth'],

  tests: {

    'כל טבלה ב-TMAP קיימת ב-TABLES': (t, { srv }) => {
      Object.keys(srv.TMAP).forEach(sheet => {
        t.ok(!!srv.TABLES[sheet], 'TMAP מפנה לטבלה שאינה מוגדרת ב-TABLES: ' + sheet);
      });
    },

    'כל טבלה ב-TABLES מוגדרת כמערך עמודות עם id': (t, { srv }) => {
      /* שני חריגים מתועדים: settings ו-counters הן טבלאות מפתח-ערך
         ([key,value]) ואין להן id. כל טבלה אחרת חייבת id. */
      const KV = ['settings', 'counters'];
      Object.keys(srv.TABLES).forEach(name => {
        const cols = srv.TABLES[name];
        t.ok(Array.isArray(cols), 'טבלה שאינה מערך עמודות: ' + name);
        if (!Array.isArray(cols)) return;
        t.ok(cols.length > 0, 'טבלה בלי עמודות: ' + name);
        if (KV.indexOf(name) > -1) t.eq(cols.join(','), 'key,value', 'טבלת מפתח-ערך שינתה מבנה: ' + name);
        else t.ok(cols.indexOf('id') > -1, 'טבלה בלי עמודת id: ' + name);
      });
    },

    'אין שם עמודה כפול באותה טבלה': (t, { srv }) => {
      Object.keys(srv.TABLES).forEach(name => {
        const cols = srv.TABLES[name] || [];
        const seen = {};
        cols.forEach(c => {
          if (seen[c]) t.fail('עמודה כפולה ' + c + ' בטבלה ' + name);
          seen[c] = 1;
        });
      });
    },

    'שמות המפתחות ב-DB ייחודיים (אין שתי טבלאות לאותו מפתח)': (t, { srv }) => {
      const seen = {};
      Object.keys(srv.TMAP).forEach(sheet => {
        const k = srv.TMAP[sheet];
        if (seen[k]) t.fail('שני גיליונות ממופים לאותו מפתח DB: ' + seen[k] + ' ו-' + sheet + ' → ' + k);
        seen[k] = sheet;
      });
    },

    '⛔ R4 — אין פעולת כתיבה ב-READ_ONLY_ACTIONS': (t, { srv }) => {
      /* פעולה שכותבת לגיליון ונכנסת לרשימה הזו מאבדת גם נעילה וגם audit.
         זו הבדיקה שתופסת את זה ביום שמישהו יוסיף בטעות. */
      const ro = srv.READ_ONLY_ACTIONS;
      t.ok(Array.isArray(ro), 'READ_ONLY_ACTIONS אינו מערך');
      const writeish = /^(save|add|create|update|delete|remove|set|mark|approve|reject|cancel|close|pay|collect|issue|assign|clock|import|reset|bulk|move|transfer|generate)/i;
      (ro || []).forEach(a => {
        if (writeish.test(a) && a !== 'rememberLogin' && a !== 'setupDatabase') {
          t.fail('פעולה שנראית ככתיבה נמצאת ב-READ_ONLY_ACTIONS: ' + a);
        }
      });
    },

    'READ_ONLY_ACTIONS מכיל את פעולות הקריאה המרכזיות': (t, { srv }) => {
      ['getAll', 'login', 'reports', 'portalGetData'].forEach(a => {
        t.ok(srv.READ_ONLY_ACTIONS.indexOf(a) > -1, 'פעולת קריאה מרכזית חסרה ברשימה: ' + a);
      });
    },

    'אין כפילות ברשימות הפעולות': (t, { srv }) => {
      [['READ_ONLY_ACTIONS', srv.READ_ONLY_ACTIONS], ['MANAGER_ONLY', srv.MANAGER_ONLY]].forEach(([n, arr]) => {
        const seen = {};
        (arr || []).forEach(a => { if (seen[a]) t.fail('ערך כפול ב-' + n + ': ' + a); seen[a] = 1; });
      });
    },

    'B52 — רשימת פעולות הקיוסק סגורה וקטנה': (t, { srv }) => {
      const k = srv.B52_KIOSK_ACTIONS;
      t.ok(Array.isArray(k), 'B52_KIOSK_ACTIONS אינו מערך');
      t.ok(k.length > 0 && k.length <= 12, 'רשימת פעולות הקיוסק גדלה ל-' + k.length + ' — היא אמורה להיות סגורה');
    },

    'route קיים ומקבל שלושה פרמטרים': (t, { srv }) => {
      t.eq(typeof srv.route, 'function');
      t.eq(srv.route.length, 3, 'חתימת route השתנתה');
    },

    'R6 — שלושת מקורות הכסף קיימים כפונקציות': (t, { srv }) => {
      /* השוויון המספרי ביניהם נבדק באצווה שנוגעת בכסף, מול נתונים.
         כאן נבדק רק שאף אחד מהם לא נמחק או שונה שם. */
      ['b48BalancesAg', 'b2CreditUsedAg', 'b54Ledger'].forEach(n => {
        t.ok(srv[n] !== undefined, 'מקור כסף נעלם: ' + n);
      });
    },

    'כספים באגורות — שמות הפונקציות מסתיימים ב-Ag': (t, { srv, H }) => {
      const code = H.stripComments(H.serverSrc());
      t.has(code, 'function b48BalancesAg', 'b48BalancesAg שונתה');
      t.hasNot(code, 'function b48Balances(', 'הופיעה גרסת שקלים של b48Balances — כספים חייבים להישאר באגורות');
    },

    'סיסמאות נשמרות כ-hash בלבד': (t, { srv, H }) => {
      const code = H.stripComments(H.serverSrc());
      t.eq(typeof srv.sha256WithSalt, 'function', 'פונקציית ה-hash נעלמה');
      t.hasNot(code, "password_plain", 'נמצא שדה סיסמה גלויה');
      t.has(code, 'sha256WithSalt', 'ה-hash כבר לא בשימוש');
    },

    'setupDatabase מכיר את כל הטבלאות': (t, { srv, H }) => {
      const code = H.stripComments(H.serverSrc());
      const i = code.indexOf('function setupDatabase');
      t.ok(i > -1, 'setupDatabase לא נמצאה');
      const seg = code.slice(i, i + 4000);
      t.ok(/TABLES/.test(seg), 'setupDatabase כבר לא נגזרת מ-TABLES — טבלה חדשה לא תיווצר');
    },

    'הטוקן נקרא מרמה עליונה של גוף הבקשה': (t, { srv, H }) => {
      const code = H.stripComments(H.serverSrc());
      t.ok(/payload\s*\.\s*token|p\s*\.\s*token|body\s*\.\s*token/.test(code), 'לא נמצאה קריאת טוקן מהבקשה');
    },

    'B58 — b58Prefetch קיים ומצמצם נסיעות לגיליון (R10)': (t, { srv, H }) => {
      /* ⚠ תוקן ב-B61: TASK_QUEUE טען ש-b58Prefetch אינו קיים. הוא קיים —
         בשרת, לא בממשק. batchGet אינו פונקציה גלובלית אלא שירות מתקדם
         (Sheets.Spreadsheets.Values.batchGet) ולכן לא ניתן לבדוק אותו כסמל. */
      t.eq(typeof srv.b58Prefetch, 'function', 'b58Prefetch נעלם — R10 מסתמך עליו');
      t.eq(typeof srv.b58PrefetchForPayload, 'function', 'b58PrefetchForPayload נעלם');
      t.has(H.stripComments(H.serverSrc()), 'Sheets.Spreadsheets.Values.batchGet',
        'הקריאה המרוכזת לגיליון נעלמה — חוזרים ל-55 נסיעות לבקשה');
    },

    'חישוב נוכחות ושכר לא נמחק (R4)': (t, { srv }) => {
      ['clockCore', 'buildPayrollForMonth', 'rebuildPayrollFromAttendance'].forEach(n => {
        t.eq(typeof srv[n], 'function', 'פונקציית ליבה של שכר/נוכחות נעלמה: ' + n);
      });
    },

    'מספר הטבלאות סביר — שינוי סכימה לא עבר בשקט': (t, { srv }) => {
      /* ⚠ אם המספר השתנה, ההודעה הזו היא התזכורת שצריך setupDatabase.
         עדכן את המספר באצווה שמשנה סכימה — בכוונה, לא אוטומטית. */
      t.eq(Object.keys(srv.TABLES).length, 59,
        'מספר הטבלאות השתנה. אם זה מכוון — יש להריץ setupDatabase ולעדכן את הבדיקה');
    }

  }
});

/* t05 — הכלי שמאמת חייב להיות מאומת בעצמו.
   כרטיס "בדיקה עצמית" (B61) הוא התשובה ל-R11: הוא רץ בדפדפן האמיתי של
   אבי ובודק את מה ש-jsdom לא יכול. אבל אם הוא עצמו שבור — אבי יראה מסך
   ירוק שלא אומר כלום, וזה גרוע מלא לבנות אותו. לכן הקובץ הזה.

   ⚠ מה שאי אפשר לבדוק כאן: האם התוצאות שהכרטיס מציג נכונות בדפדפן אמיתי.
   זו בדיוק המגבלה שהכרטיס נועד לעקוף, ולכן היא נשארת פתוחה בכוונה. */

SPECS.push({
  file: 't05-selftest',
  title: 'כרטיס בדיקה עצמית — B61',
  needs: 'ui',
  requires: ['B61_CANARY', 'b61Card', 'b61Tests', 'b61Run', 'b61Text', 'b61Copy',
             'b61OutHtml', 'b61Paint', 'b61Env', 'b61Browser', 'b61Os', 'b61Touch',
             'auditShell', 'b60Card'],

  tests: {

    'הכרטיס מוצג למנהל בלבד': (t, { w, srv, H }) => {
      ['משרד', 'מכבסה', 'נהג', 'עובד רצפה'].forEach(role => {
        H.login(w, role, srv);
        t.eq(w.b61Card(), '', 'הכרטיס נחשף לתפקיד ' + role);
      });
      H.login(w, 'מנהל', srv);
      t.ok(w.b61Card().length > 200, 'הכרטיס לא מוצג למנהל');
    },

    'הכרטיס משובץ במסך יומן פעולות ליד כרטיסי האבחון': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const shell = w.auditShell();
      t.has(shell, 'בדיקה עצמית בדפדפן', 'הכרטיס לא נכנס למסך יומן פעולות');
      t.has(shell, 'אבחון היסטוריית דפדפן', 'כרטיס האבחון של B60a נעלם');
      t.ok(shell.indexOf('אבחון היסטוריית דפדפן') < shell.indexOf('בדיקה עצמית בדפדפן'),
        'סדר הכרטיסים התהפך');
    },

    'רשימת הבדיקות תקינה מבנית': (t, { w }) => {
      const list = w.b61Tests();
      t.ok(Array.isArray(list), 'b61Tests אינו מחזיר מערך');
      t.ok(list.length >= 15, 'פחות מ-15 בדיקות עצמיות — נמסרו ' + list.length);
      const names = {};
      list.forEach((x, i) => {
        t.ok(!!x.g, 'בדיקה ' + i + ' בלי קבוצה');
        t.ok(!!x.n, 'בדיקה ' + i + ' בלי שם');
        t.eq(typeof x.f, 'function', 'בדיקה "' + x.n + '" בלי פונקציה');
        if (names[x.n]) t.fail('שם בדיקה כפול: ' + x.n);
        names[x.n] = 1;
      });
    },

    'כל הקבוצות שהובטחו קיימות': (t, { w }) => {
      const groups = {};
      w.b61Tests().forEach(x => { groups[x.g] = 1; });
      ['היסטוריית דפדפן', 'אחסון בדפדפן', 'יכולות המכשיר', 'תאריך ושעה', 'פריסה ותצוגה']
        .forEach(g => t.ok(!!groups[g], 'קבוצת בדיקות חסרה: ' + g));
    },

    '⛔ הרצה מלאה אינה שולחת אף בקשה לשרת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.go('audit');
      w.__fetches.length = 0;
      w.b61Run();
      t.eq(w.__fetches.length, 0, 'הבדיקה העצמית שלחה ' + w.__fetches.length + ' בקשות — היא אמורה להיות קריאה בלבד מקומית');
    },

    'הרצה מלאה אינה זורקת ומסכמת נכון': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.go('audit');
      w.b61Run();
      const r = w.B61_RES;
      t.ok(!!r, 'לא נוצרה תוצאה');
      t.eq(r.rows.length, w.b61Tests().length, 'מספר השורות אינו תואם למספר הבדיקות');
      t.eq(r.pass + r.fail, r.rows.length, 'עברו + נכשלו אינו שווה לסך הבדיקות');
      r.rows.forEach(x => t.eq(typeof x.ok, 'boolean', 'בדיקה "' + x.n + '" לא החזירה תוצאה בוליאנית'));
    },

    'בדיקה שזורקת נספרת ככשלון ואינה מפילה את ההרצה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const orig = w.b61Tests;
      w.b61Tests = function () {
        return orig().concat([{ g: 'בדיקה', n: 'זורקת בכוונה', f: function () { throw new Error('בום'); } }]);
      };
      try {
        w.b61Run();
        const bad = w.B61_RES.rows.filter(x => x.n === 'זורקת בכוונה')[0];
        t.ok(!!bad, 'הבדיקה הזורקת נעלמה מהתוצאה');
        t.no(bad.ok, 'בדיקה שזרקה נספרה כהצלחה');
        t.has(bad.note, 'בום', 'הודעת השגיאה לא נשמרה');
      } finally { w.b61Tests = orig; }
    },

    'הרצה משחזרת את ה-state של ההיסטוריה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.go('audit');
      const before = JSON.stringify(w.history.state);
      w.b61Run();
      t.eq(JSON.stringify(w.history.state), before, 'ההרצה השאירה את ההיסטוריה במצב אחר');
    },

    'הרצה משאירה את המשתמש באותו מסך': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.go('audit');
      w.b61Run();
      t.eq(w.VIEW, 'audit', 'הבדיקה העצמית השאירה את אבי במסך אחר');
      t.no(w.b60ModalOpen(), 'הבדיקה העצמית השאירה מודל פתוח');
    },

    'טקסט ההעתקה מכיל את מה שאני צריך ורק אותו': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.go('audit');
      w.b61Run();
      const txt = w.b61Text();
      t.has(txt, w.B61_CANARY, 'הטקסט לא כולל את גרסת הקוד');
      t.has(txt, 'עברו', 'הטקסט לא כולל שורת סיכום');
      t.has(txt, '=== סוף ===', 'הטקסט לא נסגר');
      /* שורות שעברו לא נכנסות — הבלוק נועד להיות קצר */
      const passed = w.B61_RES.rows.filter(x => x.ok)[0];
      if (passed) t.hasNot(txt, 'X [' + passed.g + '] ' + passed.n, 'בדיקה שעברה נכנסה לטקסט ההעתקה');
      t.ok(txt.split('\n').length <= 6 + w.B61_RES.fail * 1 + 2, 'הטקסט ארוך מדי להדבקה');
    },

    'טקסט ההעתקה מפרט כל כשלון': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const orig = w.b61Tests;
      w.b61Tests = function () {
        return [{ g: 'בדיקה', n: 'נכשלת בכוונה', f: function () { return { ok: false, note: 'סיבה מדויקת' }; } }];
      };
      try {
        w.b61Run();
        const txt = w.b61Text();
        t.has(txt, 'נכשלת בכוונה', 'שם הכשלון חסר');
        t.has(txt, 'סיבה מדויקת', 'סיבת הכשלון חסרה');
        t.has(txt, 'עברו 0 · נכשלו 1', 'שורת הסיכום שגויה');
      } finally { w.b61Tests = orig; }
    },

    'התצוגה מציגה ירוק בלי כפתור העתקה, ואדום עם כפתור': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const orig = w.b61Tests;
      try {
        w.b61Tests = () => [{ g: 'g', n: 'עוברת', f: () => ({ ok: true, note: 'ok' }) }];
        w.b61Run();
        let h = w.b61OutHtml();
        t.has(h, 'הכל תקין', 'מסך ירוק לא מוצג');
        t.hasNot(h, 'b61Copy()', 'כפתור העתקה מוצג כשאין מה לדווח');
        w.b61Tests = () => [{ g: 'g', n: 'נכשלת', f: () => ({ ok: false, note: 'x' }) }];
        w.b61Run();
        h = w.b61OutHtml();
        t.has(h, 'b61Copy()', 'כפתור העתקה חסר כשיש כשלון');
        t.has(h, 'נכשלו', 'מסך אדום לא מציג את מספר הכשלונות');
      } finally { w.b61Tests = orig; }
    },

    'התצוגה מנטרלת HTML בתוכן הבדיקות': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const orig = w.b61Tests;
      try {
        w.b61Tests = () => [{ g: '<b>g</b>', n: '<img src=x>', f: () => ({ ok: false, note: '<script>bad</script>' }) }];
        w.b61Run();
        const h = w.b61OutHtml();
        t.hasNot(h, '<img src=x>', 'שם בדיקה לא עבר ניטרול');
        t.hasNot(h, '<script>bad', 'הערה לא עברה ניטרול');
      } finally { w.b61Tests = orig; }
    },

    'זיהוי סביבה מחזיר את כל השדות': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const e = w.b61Env();
      ['browser', 'os', 'vw', 'vh', 'dpr', 'touch', 'mode', 'secure', 'tz', 'role', 'canary']
        .forEach(k => t.ok(e[k] !== undefined, 'שדה סביבה חסר: ' + k));
      t.eq(e.canary, w.B61_CANARY, 'ה-canary בסביבה אינו תואם');
      t.eq(e.role, 'מנהל');
    },

    'זיהוי דפדפן ומערכת הפעלה אינו זורק ומחזיר מחרוזת': (t, { w }) => {
      t.eq(typeof w.b61Browser(), 'string');
      t.eq(typeof w.b61Os(), 'string');
      t.eq(typeof w.b61Touch(), 'boolean');
    },

    'הרצה כפולה אינה מכפילה שורות': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.go('audit');
      w.b61Run();
      const n1 = w.B61_RES.rows.length;
      w.b61Run();
      t.eq(w.B61_RES.rows.length, n1, 'הרצה שנייה הכפילה את התוצאות');
    },

    'לפני הרצה — הודעה ברורה ולא טבלה ריקה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.B61_RES = null;
      const h = w.b61OutHtml();
      t.has(h, 'טרם הורצה', 'אין הודעת מצב התחלתי');
      t.has(h, 'לא נשלחת שום בקשה', 'לא נאמר שאין קריאות שרת');
    }

  }
});

/* t06 — ניווט: תפריט עליון, רצועת צד, קיצורים וסרגלי פעולות.
   B63 · B62 · T2 · BLD-04
   ============================================================
   **הארכיטקטורה אחרי B63 (הכרעת אבי, 31.07.2026):**
   · מ-900px ומעלה — התפריט הראשי הוא **השורה העליונה** (#nav). כל 29
     המסכים נגישים ממנו. זה דפוס B47 שהיה קיים ובדוק ורק היה חסום מעל 1100px.
   · מ-1100px ומעלה מתווספת **רצועת צד** (#rail) עם 2–3 קטגוריות שאבי
     בוחר בהגדרות (`nav_rail`). היא **מסלול מהיר בלבד** — אין לה בלעדיות
     על שום מסך ואי אפשר להסתיר מסך דרכה.
   · ⚠ B63a — ברצועה **אין קיפול ואין נעיצה**. כותרת הקטגוריה היא תווית
     ולא כפתור, וכל המסכים גלויים תמיד. מנגנון הנעיצה של B62 הוסר מהקוד
     בהוראת אבי: הוא נבנה כדי להכניס 29 מסכים ל-596px, וברצועה של 2–3
     קטגוריות אין לו תפקיד.
   · מתחת ל-900px — אקורדיון B23, לא נגוע. נבדק ב-t02.

   ⚠ מה שאי אפשר לבדוק כאן: שהתפריט העליון והרצועה **באמת נכנסים** למסך.
   ל-jsdom אין מנוע פריסה. המדידה האמיתית בשכבה 2. */


SPECS.push({
  file: 't06-nav-sidebar',
  title: 'ניווט — תפריט עליון, רצועת צד, קיצורים ופעולות — B63',
  needs: 'ui',
  requires: ['openDay', 'calEvents', 'b64DayCreateHtml', 'VIEWS',
             'renderNav', 'renderRail', 'navMode', 'navIsSide', 'navGroupOf', 'navQuickKeys',
             'navToggle', 'NAV_DD', 'b63RailGroups', 'b63RailPanelHtml', 'b63RailToggle',
             'NAV_RAIL_DEFAULT', 'NAV_RAIL_MAX',
             'allowedViews', 'NAV_GROUPS', 'NAV_QUICK_MAX', 'NAV_QUICK_LABEL_MAX',
             'b62QuickOrderHtml', 'b62QMove', 'b62QDown', 'b62QCommit',
             'b53QuickToggle', 'b53QuickNavPanelHtml',
             'moreMenu', 'toggleMore', 'closeMore', 'b62OrderActions',
             'renderTopbar', 'go'],

  tests: {

    /* ===== B63: התפריט העליון הוא הראשי ===== */

    'ב-1422px התפריט הראשי הוא השורה העליונה': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv, { is_super_admin: true });
      t.eq(w.navMode(), 'side', 'מצב הניווט השתנה ברוחב של אבי');
      const nav = w.document.getElementById('nav').innerHTML;
      t.has(nav, 'ghead', 'אין כותרות קטגוריה בשורה העליונה — התפריט לא עלה למעלה');
      t.has(nav, 'gmenu', 'אין חלונית נפתחת בתפריט העליון');
      t.hasNot(nav, 'gbody', 'רצועת הצד דלפה לתוך שורת התפריט');
    },

    '⛔ כל המסכים המותרים נגישים מהתפריט העליון': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv, { is_super_admin: true });
      const nav = w.document.getElementById('nav').innerHTML;
      const views = w.allowedViews();
      views.forEach(v => {
        t.has(nav, "go('" + v[0] + "')",
          'המסך "' + v[1] + '" אינו נגיש מהתפריט העליון — אחרי B63 הוא המסלול היחיד לכל המסכים');
      });
      t.ok(views.length >= 28, 'מספר המסכים למנהל ראשי ירד — allowedViews השתנתה');
    },

    'קטגוריה בתפריט העליון נפתחת ונסגרת (R7)': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.NAV_DD = '';
      w.render();
      const head = w.document.querySelector('#nav .ngrp .ghead');
      t.ok(!!head, 'לא נמצאה כותרת קטגוריה בתפריט העליון');
      H.click(w, head);
      t.ne(w.NAV_DD, '', 'לחיצה על קטגוריה לא פתחה את החלונית');
      const open = w.NAV_DD;
      H.click(w, w.document.querySelector('#nav .ngrp .ghead'));
      t.ne(w.NAV_DD, open, 'לחיצה שנייה לא סגרה את החלונית');
    },

    'מעבר מסך סוגר את החלונית העליונה': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.NAV_DD = 'כוח אדם';
      w.go('orders');
      t.eq(w.NAV_DD, '', 'החלונית נשארה תלויה פתוחה אחרי מעבר מסך');
    },

    /* ===== B63: רצועת הצד ===== */

    'ברירת המחדל של הרצועה: שלוש הקטגוריות התפעוליות': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      t.eq(w.b63RailGroups().join(','), w.NAV_RAIL_DEFAULT, 'ברירת המחדל של הרצועה השתנתה');
      t.ok(w.b63RailGroups().length <= w.NAV_RAIL_MAX, 'ברירת המחדל חורגת מהתקרה');
    },

    'הרצועה מציגה רק את הקטגוריות שנבחרו': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.DB.settings = [{ key: 'nav_rail', value: 'כוח אדם,ארגון' }];
      w.render();
      const rail = w.document.getElementById('rail');
      t.ok(!!rail.querySelector('[data-g="כוח אדם"]'), 'קטגוריה שנבחרה אינה ברצועה');
      t.ok(!!rail.querySelector('[data-g="ארגון"]'), 'קטגוריה שנבחרה אינה ברצועה');
      t.no(!!rail.querySelector('[data-g="מלאי ומחסן"]'), 'קטגוריה שלא נבחרה מופיעה ברצועה');
    },

    '⛔ מסך שאינו ברצועה נשאר נגיש מהתפריט העליון': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.DB.settings = [{ key: 'nav_rail', value: 'ארגון' }];
      w.render();
      t.hasNot(w.document.getElementById('rail').innerHTML, "go('finance')", 'הבדיקה לא בודקת כלום');
      t.has(w.document.getElementById('nav').innerHTML, "go('finance')",
        '⛔ בחירת הרצועה הסתירה מסך — היא קיצור דרך, לא הרשאה');
    },

    'רצועה ריקה אינה שוברת כלום': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.DB.settings = [{ key: 'nav_rail', value: '   ' }];
      w.render();
      t.eq(w.b63RailGroups().join(','), w.NAV_RAIL_DEFAULT, 'ערך ריק לא נפל לברירת המחדל');
      w.DB.settings = [{ key: 'nav_rail', value: 'קטגוריה שלא קיימת' }];
      w.render();
      t.eq(w.document.getElementById('rail').innerHTML, '', 'שם קטגוריה זר לא סונן');
      t.has(w.document.getElementById('nav').innerHTML, "go('orders')", 'התפריט העליון נפגע');
    },

    'הרצועה לעולם לא יותר מ-NAV_RAIL_MAX': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.DB.settings = [{ key: 'nav_rail', value: w.NAV_GROUPS.map(g => g[1]).join(',') }];
      w.render();
      t.eq(w.b63RailGroups().length, w.NAV_RAIL_MAX, 'התקרה של הרצועה נפרצה');
      t.eq(w.document.getElementById('rail').querySelectorAll('.ngrp.side').length, w.NAV_RAIL_MAX,
        'ברצועה מוצגות יותר קטגוריות מהתקרה');
    },

    'הרצועה מוסתרת מתחת ל-1100px ובמצב נהג': (t, { w, srv, H }) => {
      H.setWidth(w, 1000);
      H.login(w, 'מנהל', srv);
      w.render();
      t.eq(w.document.getElementById('rail').innerHTML, '', 'הרצועה נבנתה ב-1000px');
      t.has(w.document.getElementById('nav').innerHTML, 'ghead', 'התפריט העליון נעלם ב-1000px');
      H.setWidth(w, 1422);
      H.login(w, 'נהג', srv);
      t.eq(w.document.getElementById('rail').innerHTML, '', 'הנהג קיבל רצועת צד');
      t.has(w.document.getElementById('nav').innerHTML, 'dtab', 'הנהג איבד את סרגל הטאבים');
    },

    '⛔ כל קטגוריות הרצועה פתוחות תמיד': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.go('dash');
      const rail = w.document.getElementById('rail');
      const grps = rail.querySelectorAll('.ngrp.side');
      t.ok(grps.length >= 2, 'הרצועה ריקה');
      grps.forEach(g => {
        const items = g.querySelectorAll('.nitem');
        t.ok(items.length >= 2, 'קטגוריה ברצועה בלי מסכים — הפריטים לא רונדרו');
      });
      /* כל מסך של כל קטגוריה נבחרת חייב להיות גלוי, בלי לחיצה נוספת */
      ['orders','customers','deliveries','returns','fleet','floor','laundry','assets',
       'items','warehouses','shelves','scan','barcodes'].forEach(k => {
        t.has(rail.innerHTML, "go('" + k + "')",
          'המסך ' + k + ' אינו גלוי ברצועה — היא חייבת להיות פתוחה במלואה');
      });
    },

    '⛔ אין קיפול, אין נעיצה ואין אחסון מקומי (B63a)': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.go('dash');
      const rail = w.document.getElementById('rail');
      t.hasNot(rail.innerHTML, 'gpin', 'אייקון הסיכה חזר לרצועה');
      t.hasNot(rail.innerHTML, 'gbody', 'הגוף המתקפל חזר לרצועה');
      t.hasNot(rail.innerHTML, 'gcnt', 'מונה המסכים חזר — הוא נדרש רק כשקטגוריה מכווצת');
      t.hasNot(rail.innerHTML, 'onclick="b62NavPin', 'מנגנון הנעיצה חזר');
      const cap = rail.querySelector('.gcap');
      t.ok(!!cap, 'כותרת הקטגוריה נעלמה');
      t.eq(cap.tagName, 'DIV', 'כותרת הקטגוריה היא כפתור — היא חייבת להיות תווית לא-לחיצה');
    },

    '⛔ מנגנון הנעיצה הוסר מקוד המקור': (t, { H }) => {
      const src = H.stripComments(H.uiScript());
      ['b62NavPin', 'b62NavPins', 'b62NavPinned', 'B62_PINS_KEY', 'B62_PIN_SVG', 'mn_nav_pins']
        .forEach(n => t.hasNot(src, n, 'מנגנון הנעיצה חזר לקוד: ' + n));
      t.hasNot(H.indexSrc(), 'grid-template-rows',
        'ההנפשה של הקיפול חזרה — אין לה תפקיד ברצועה פתוחה');
    },

    'הקטגוריה של המסך הנוכחי מסומנת': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.go('laundry');
      const on = w.document.querySelector('#rail .nitem.on');
      t.ok(!!on, 'המסך הנוכחי אינו מסומן ברצועה');
      t.eq(on.textContent.trim(), 'כביסה', 'סומן המסך הלא נכון');
    },

    'לחיצה על מסך ברצועה מנווטת (R7)': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.go('dash');
      const btns = w.document.querySelectorAll('#rail .ngrp.side[data-g="מכירות ומשלוחים"] .nitem');
      t.ok(btns.length >= 3, 'פריטי הקטגוריה חסרים מהרצועה');
      H.click(w, btns[0]);
      t.eq(w.VIEW, 'orders', 'לחיצה ברצועה לא ניווטה');
    },

    'כל מסכי הקטגוריה גלויים — שום מידע לא נעלם': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.go('dash');
      const g = w.document.querySelector('#rail .ngrp.side[data-g="מכירות ומשלוחים"]');
      t.eq(g.querySelectorAll('.nitem').length, 5,
        'לא כל חמשת המסכים של הקטגוריה גלויים ברצועה');
      t.has(g.querySelector('.gcap').textContent, 'מכירות ומשלוחים', 'שם הקטגוריה חסר');
    },


    'תפקיד מצומצם — התפריט והרצועה מסוננים יחד': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מכבסה', srv);
      const nav = w.document.getElementById('nav').innerHTML;
      const rail = w.document.getElementById('rail').innerHTML;
      t.hasNot(nav, "go('payroll')", 'מסך שכר דלף לתפקיד מכבסה בתפריט העליון');
      t.hasNot(nav, "go('audit')", 'יומן פעולות דלף לתפקיד שאינו מנהל');
      t.hasNot(rail, "go('payroll')", 'מסך שכר דלף לרצועה');
      t.hasNot(rail, "go('customers')", 'מסך לקוחות דלף לרצועה של תפקיד מכבסה');
      t.has(rail, "go('laundry')", 'מסך כביסה נעלם מהרצועה של המכבסה');
    },

    'רצועה ריקה נעלמת ואינה משאירה פס': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.DB.settings = [{ key: 'nav_rail', value: 'קטגוריה שאינה קיימת' }];
      w.render();
      t.eq(w.document.getElementById('rail').style.display, 'none',
        'הרצועה נשארה גלויה וריקה — פס כהה של 206px בלי תוכן');
      w.DB.settings = [];
      w.render();
      t.ne(w.document.getElementById('rail').style.display, 'none', 'הרצועה לא חזרה');
    },

    '⛔ מבנה: #nav מחוץ ל-#shell, #rail בתוכו': (t, { H }) => {
      const src = H.indexSrc();
      const i = src.indexOf('<div id="shell">');
      const j = src.indexOf('</div>', src.indexOf('<main id="main">'));
      t.ok(i > -1, '#shell נעלם מה-HTML');
      const inShell = src.slice(i, j);
      t.hasNot(inShell, '<nav id="nav">',
        '#nav חזר לתוך #shell — הוא לא יוכל להשתרע לרוחב מלא כשורת תפריט');
      t.has(inShell, '<aside id="rail">', '#rail אינו בתוך #shell — הפריסה לשתי עמודות תישבר');
      t.ok(src.indexOf('<nav id="nav">') < i, '#nav חייב לבוא לפני #shell כדי לשבת מתחת ל-header');
    },

    /* ===== B63: פאנל ההגדרות של הרצועה ===== */

    'פאנל ההגדרות מציג את הקטגוריות ומסמן את הנבחרות': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.go('settings');
      const boxes = w.document.querySelectorAll('input[data-b63g]');
      t.ok(boxes.length >= 6, 'תיבות הסימון של הרצועה חסרות');
      t.ok(!!w.document.getElementById('set_nav_rail'), 'השדה המוסתר set_nav_rail נעלם — ההגדרה לא תישמר');
      const on = w.document.querySelector('input[data-b63g="מכירות ומשלוחים"]');
      t.ok(on.checked, 'קטגוריית ברירת המחדל אינה מסומנת');
    },

    'הסרת סימון מעדכנת את השדה שנשמר (R7)': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.go('settings');
      const box = w.document.querySelector('input[data-b63g="מלאי ומחסן"]');
      box.checked = false;
      H.change(w, box);
      t.no(w.B63_RAIL.indexOf('מלאי ומחסן') > -1, 'ההסרה לא נקלטה');
      t.hasNot(w.document.getElementById('set_nav_rail').value, 'מלאי ומחסן', 'השדה שנשמר לא עודכן');
    },

    'תקרת הרצועה נאכפת בפאנל ההגדרות': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.go('settings');
      const box = w.document.querySelector('input[data-b63g="כוח אדם"]');
      box.checked = true;
      H.change(w, box);
      t.ok(w.B63_RAIL.length <= w.NAV_RAIL_MAX, 'התקרה נפרצה מפאנל ההגדרות');
      t.no(box.checked, 'התיבה נשארה מסומנת אף שהתקרה מנעה את ההוספה');
    },

    'nav_rail נכנס לרשימת המפתחות שנשמרים לשרת': (t, { H }) => {
      const src = H.stripComments(H.uiScript());
      const i = src.indexOf("concat(['agreement_text'");
      t.ok(i > -1, 'רשימת מפתחות השמירה לא נמצאה');
      t.has(src.slice(i, i + 160), "'nav_rail'", 'nav_rail לא נשמר — הבחירה תיעלם ברענון');
      t.has(src.slice(i, i + 160), "'nav_quick'", 'nav_quick הוסר מרשימת השמירה');
    },

    /* ===== BLD-04 — קיצורי דרך ===== */

    'תקרת הקיצורים היא 10, ותוויות עד 6': (t, { w }) => {
      t.eq(w.NAV_QUICK_MAX, 10, 'תקרת הקיצורים לא עודכנה');
      t.eq(w.NAV_QUICK_LABEL_MAX, 6, 'סף התוויות השתנה');
      t.ok(w.NAV_QUICK_LABEL_MAX <= w.NAV_QUICK_MAX, 'סף התוויות גדול מהתקרה');
    },

    'עד 6 קיצורים — תוויות. מעל — אייקון בלבד ובלי גלישה': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      const q = w.document.getElementById('qnav');
      t.no(/qmini/.test(q.className), 'ברירת המחדל (5 קיצורים) כבר במצב אייקון');
      w.DB.settings = [{ key: 'nav_quick', value: 'orders,customers,deliveries,laundry,calendar,items,finance,staff' }];
      w.render();
      t.ok(/qmini/.test(q.className), '8 קיצורים לא עברו למצב אייקון — השורה העליונה תגלוש');
      t.eq(q.children.length, 8, 'מספר הקיצורים המוצג אינו תואם להגדרה');
    },

    'לעולם לא יותר מ-NAV_QUICK_MAX קיצורים בשורה': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.DB.settings = [{ key: 'nav_quick', value: w.VIEWS.map(v => v[0]).join(',') }];
      w.render();
      t.ok(w.document.getElementById('qnav').children.length <= w.NAV_QUICK_MAX,
        'השורה העליונה חרגה מהתקרה');
    },

    'רצועת הסידור מציגה את הקיצורים לפי הסדר וממוספרת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.B53_QUICK = ['orders', 'customers', 'deliveries'];
      const html = w.b62QuickOrderHtml();
      t.has(html, 'data-k="orders"', 'שבב הזמנות חסר');
      t.has(html, 'qchip', 'רצועת הסידור לא נבנתה');
      t.has(html, 'onpointerdown', 'אין מאזין גרירה — BLD-04 לא ממומש');
      t.hasNot(html, 'ondragstart', 'נעשה שימוש ב-HTML5 drag — אינו נורה במסך מגע');
      t.ok(html.indexOf('data-k="orders"') < html.indexOf('data-k="deliveries"'),
        'הסדר ברצועה אינו סדר B53_QUICK');
    },

    'touch-action:none מוגדר לשבב — בלעדיו הגרירה לא תעבוד במגע': (t, { H }) => {
      const src = H.indexSrc();
      const i = src.indexOf('.qchip{');
      t.ok(i > -1, 'לא נמצא כלל CSS ל-.qchip');
      t.has(src.slice(i, i + 400), 'touch-action:none',
        '⛔ בלי touch-action:none הדפדפן במגע יגלול במקום לגרור — זה כשל B60 בתחפושת');
    },

    'החצים מזיזים מקום אחד ואינם גולשים מהקצה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.B53_QUICK = ['orders', 'customers', 'deliveries'];
      w.b62QMove('customers', -1);
      t.eq(w.B53_QUICK.join(','), 'customers,orders,deliveries', 'הזזה ימינה לא עבדה');
      w.b62QMove('customers', -1);
      t.eq(w.B53_QUICK.join(','), 'customers,orders,deliveries', 'הזזה מעבר לקצה שינתה את הסדר');
      w.b62QMove('deliveries', 1);
      t.eq(w.B53_QUICK.join(','), 'customers,orders,deliveries', 'הזזה מעבר לקצה השני שינתה את הסדר');
      w.b62QMove('orders', 1);
      t.eq(w.B53_QUICK.join(','), 'customers,deliveries,orders', 'הזזה שמאלה לא עבדה');
    },

    'הזזה של מפתח שאינו ברשימה אינה עושה כלום': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.B53_QUICK = ['orders', 'customers'];
      w.b62QMove('items', -1);
      t.eq(w.B53_QUICK.join(','), 'orders,customers', 'מפתח זר שינה את הסדר');
    },

    'הסדר מסונכרן לשדה המוסתר שנשמר לשרת': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.go('settings');
      const hidden = w.document.getElementById('set_nav_quick');
      t.ok(!!hidden, 'השדה המוסתר set_nav_quick נעלם — ההגדרה לא תישמר');
      w.B53_QUICK = ['items', 'orders'];
      w.b62QSync();
      t.eq(hidden.value, 'items,orders', 'הסדר לא הועבר לשדה שנשמר');
    },

    'סימון תיבה מצייר מחדש את רצועת הסידור': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.go('settings');
      const box = w.document.querySelector('input[data-b53k="items"]');
      t.ok(!!box, 'תיבת הסימון של פריטים לא נמצאה');
      box.checked = true;
      H.change(w, box);
      t.ok(w.B53_QUICK.indexOf('items') > -1, 'הסימון לא נכנס לרשימה');
      t.has(w.document.getElementById('b62QOrderWrap').innerHTML, 'data-k="items"',
        'רצועת הסידור לא צוירה מחדש אחרי סימון');
    },

    'תקרת הקיצורים נאכפת גם בפאנל ההגדרות': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.go('settings');
      w.B53_QUICK = w.VIEWS.slice(0, w.NAV_QUICK_MAX).map(v => v[0]);
      const box = w.document.querySelector('input[data-b53k="settings"]');
      box.checked = true;
      H.change(w, box);
      t.ok(w.B53_QUICK.length <= w.NAV_QUICK_MAX, 'התקרה נפרצה מפאנל ההגדרות');
      t.no(box.checked, 'התיבה נשארה מסומנת אף שהתקרה מנעה את ההוספה');
    },

    /* ===== T2 — סרגלי פעולות ===== */

    'שורת הפעולות של ההזמנה: פעולה ראשית אחת + ⋯': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const o = { id: 'o1', status: 'סופקה', customer_id: 'c1', type: 'השכרה' };
      const html = w.b62OrderActions(o, 'o1', '<button class="btn pri">קבל החזרה</button>', '', []);
      t.has(html, 'actrow', 'לא נעשה שימוש בדפוס .actrow הקיים');
      t.has(html, 'more-wrap', 'לא נעשה שימוש בדפוס ⋯ הקיים — R8 אוסר דפוס שני');
      t.eq((html.match(/class="btn pri/g) || []).length, 1, 'יותר מפעולה ראשית אחת גלויה');
    },

    '⛔ אף פעולה לא נעלמה — הדפסה, תרשומות ותיוג נשארות נגישות': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const o = { id: 'o1', status: 'סופקה', customer_id: 'c1', type: 'השכרה' };
      const html = w.b62OrderActions(o, 'o1', '<button class="btn pri">x</button>', '', []);
      t.has(html, 'printOrderForm', 'ההדפסה נעלמה מכרטיס ההזמנה');
      t.has(html, 'notesModal', 'התרשומות נעלמו מכרטיס ההזמנה');
      t.has(html, 'tagDialog', 'התיוג נעלם מכרטיס ההזמנה');
    },

    'הפעולות המשניות שהועברו ל-⋯ נשמרו כלשונן': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const o = { id: 'o1', status: 'מאושרת', customer_id: 'c1', type: 'השכרה' };
      const more = ['<button class="btn">הפק חשבונית</button>', '<button class="btn dng">בטל הזמנה</button>'];
      const html = w.b62OrderActions(o, 'o1', '<button class="btn pri">סמן כסופקה</button>', '', more);
      t.has(html, 'הפק חשבונית', 'הפקת חשבונית נעלמה');
      t.has(html, 'בטל הזמנה', 'ביטול ההזמנה נעלם');
    },

    'moreMenu ריק אינו מייצר כפתור ⋯ מיותר': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      t.eq(w.moreMenu([]), '', 'תפריט ריק מייצר ⋯ ללא תוכן');
      t.eq(w.moreMenu(['', '  ']), '', 'פריטים ריקים אינם מסוננים');
    },

    'השורה העליונה: רענון גלוי, שינוי סיסמה ויציאה ב-⋯': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      const hdr = w.document.querySelector('header');
      t.ok(!!hdr.querySelector('#btnRefresh'), 'כפתור הרענון נעלם מהשורה העליונה');
      const more = hdr.querySelector('#hdrMore');
      t.ok(!!more, 'תפריט ⋯ לא נוסף לשורה העליונה');
      t.has(more.innerHTML, 'changeMyPassword', 'שינוי סיסמה נעלם לגמרי במקום לעבור ל-⋯');
      t.has(more.innerHTML, 'doLogout', 'היציאה נעלמה לגמרי');
    },

    '⛔ לנהג נשארת יציאה נגישה': (t, { w, srv, H }) => {
      H.login(w, 'נהג', srv);
      const more = w.document.querySelector('#hdrMore');
      t.ok(!!more, 'תפריט ⋯ נעלם במצב נהג — הנהג נשאר בלי כפתור יציאה');
      t.has(more.innerHTML, 'doLogout', 'הנהג איבד את היכולת לצאת מהמערכת');
    },

    'תפריט ⋯ נפתח ונסגר (R7 — אירוע DOM אמיתי)': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      const wrap = w.document.querySelector('#hdrMore');
      const btn = wrap.querySelector('button');
      const pop = wrap.querySelector('.more-pop');
      t.no(pop.classList.contains('on'), 'התפריט פתוח כבר בטעינה');
      H.click(w, btn);
      t.ok(pop.classList.contains('on'), 'לחיצה על ⋯ לא פתחה את התפריט');
      H.click(w, btn);
      t.no(pop.classList.contains('on'), 'לחיצה שנייה לא סגרה');
    },

    /* ===== B64 — הפריטים החדשים לא נגעו בניווט ובפריסה ===== */

    '⛔ B64 לא הוסיף מסך — אנשי המקצוע יושבים בתוך רכש וספקים': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const keys = w.VIEWS.map(v => v[0]);
      t.eq(keys.indexOf('providers'), -1, 'נוסף מסך providers — 29 המסכים הפכו ל-30 בלי החלטה');
      t.ok(keys.indexOf('purchasing') > -1, 'מסך רכש וספקים נעלם מ-VIEWS');
      t.ok(w.NAV_GROUPS.some(g => g[2].indexOf('purchasing') > -1),
        'רכש וספקים איבד קטגוריה בתפריט העליון');
    },

    'רשימת אנשי המקצוע נגישה מהתפריט העליון בשלושת מצבי הניווט': (t, { w, srv, H }) => {
      [1422, 1000, 700].forEach(px => {
        H.login(w, 'מנהל', srv);
        H.setWidth(w, px);
        w.DB.serviceProviders = [{ id: 'P1', name: 'יוסי', company: 'קירור הצפון', active: 'כן' }];
        w.go('purchasing');
        t.has(w.document.getElementById('main').innerHTML, 'אנשי מקצוע וחברות שירות',
          'ב-' + px + 'px רשימת אנשי המקצוע אינה מוצגת');
      });
    },

    '⛔ פתיחת יום ביומן אינה משנה מסך ואינה נוגעת ברצועה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      H.setWidth(w, 1422);
      w.go('calendar');
      const railBefore = w.document.getElementById('rail').innerHTML;
      const viewBefore = w.VIEW;
      w.openDay('2026-08-12');
      t.eq(w.VIEW, viewBefore, 'פתיחת יום ביומן החליפה מסך');
      t.eq(w.document.getElementById('rail').innerHTML, railBefore,
        'פתיחת יום ביומן צוירה מחדש את רצועת הצד');
      t.has(w.document.getElementById('modal').innerHTML, 'הוספה ליום הזה',
        'מודל היום נפתח בלי מסלול היצירה');
    },

    '⛔ היומן ומסלול היצירה אינם שולחים בקשה לשרת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.futureExpenses = [{ id: 'FE9', category: 'ביטוח', amount: 300,
        due_date: '2026-08-12', status: 'ממתין' }];
      w.go('calendar');
      const before = w.__fetches.length;
      w.calEvents();
      w.openDay('2026-08-12');
      w.b64DayCreateHtml('2026-08-12');
      t.eq(w.__fetches.length, before,
        'היומן מייצר בקשת שרת — R10: כל שיפור הוא צמצום מספר הבקשות, לא הוספה');
    },

    'סרגלי הפעולות החדשים לא שברו את דפוס ⋯ הקיים': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      t.eq(w.moreMenu([]), '', 'moreMenu ריק חזר לייצר כפתור ⋯ מיותר');
      const h = w.moreMenu(['<button class="btn sm">א</button>']);
      t.has(h, 'more-wrap', 'מבנה ה-⋯ השתנה — b62OrderActions יישבר');
      t.has(h, 'toggleMore', 'ה-⋯ אינו מחובר ל-toggleMore');
    },

    /* ===== canary ===== */

    'canary עודכן בשני המקומות': (t, { H }) => {
      const s = H.indexSrc();
      const inHtml = (s.match(/גרסה\s+(v[\d.]+-B\d+[a-z]?)/) || [])[1];
      const inJs = (s.match(/B61_CANARY\s*=\s*'([^']+)'/) || [])[1];
      t.eq(inHtml, inJs, 'שני ה-canary אינם תואמים');
      t.eq(inJs, 'v4.68-B68', 'ה-canary לא עודכן ל-B68');
    },

    'שכבה 2 קיבלה את הטענות של B62 ו-B63': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const names = w.b61Tests().map(x => x.n).join(' | ');
      ['שורת התפריט העליונה אינה גולשת (B63)',
       'רצועת הצד נכנסת לגובה החלון בלי גלילה',
       'גרירת הקיצורים תעבוד במכשיר הזה (BLD-04)',
       'שורת הקיצורים העליונה אינה גולשת',
       'המסך הנוכחי אינו גולש לרוחב (ACT-05 · BLD-05)'
      ].forEach(n => t.has(names, n,
        '⛔ אצווה שנוגעת ביכולת דפדפן חייבת להוסיף לשכבה 2 — חסרה הטענה: ' + n));
    },

    'הטענות החדשות אינן שולחות בקשה לשרת': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.go('audit');
      w.__fetches.length = 0;
      w.b61Run();
      t.eq(w.__fetches.length, 0, 'הבדיקה העצמית שולחת בקשות — היא חייבת להיות קריאה בלבד');
    },

    'הבדיקה העצמית אינה שולחת בקשות ואינה נוגעת ברצועה': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.go('audit');
      const before = w.document.getElementById('rail').innerHTML;
      w.__fetches.length = 0;
      w.b61Run();
      t.eq(w.__fetches.length, 0, 'הבדיקה העצמית שולחת בקשות לשרת');
      t.eq(w.document.getElementById('rail').innerHTML, before, 'הבדיקה העצמית שינתה את הרצועה');
    }


  }
});


/* ============================================================================
   t07 — B64: יצירה מהיומן (T1) · כולל מע"מ בחנות ובפורטל (BLD-12) ·
         השבתת ספק שירות (BLD-02) · סרגלי פעולות (T2ב)
   ----------------------------------------------------------------------------
   ⚠ מה החלק הזה **לא** מוכיח: שהמחיר שנראה ללקוח בדפדפן האמיתי נכון.
   הוא מוכיח שהפונקציות מחזירות את המספר הנכון ושהמחרוזות במקומן. תצוגה
   בפועל היא שכבה 2.
   ============================================================================ */

SPECS.push({
  file: 't07-b64',
  title: 'B64 — יומן, מע"מ בחנות ובפורטל, ספק שירות, סרגלי פעולות',
  needs: 'ui',
  requires: ['calEvents', 'openDay', 'b64DayCreateHtml', 'b64MoneyVisible',
             'b64FexpDue', 'b64RecvDue', 'taskForm', 'meetingForm', 'newOrderForm',
             'futureExpForm', 'b12Gross', 'b12Net', 'b12PriceInline', 'b12PriceStack',
             'b45Gross', 'b45Money', 'b02ProvidersHtml', 'b02ToggleProv', 'b02CanProv',
             'b42Providers', 'moreMenu', 'b62OrderActions', 'dYmd', 'b43IsYmd'],

  tests: {

    /* ---------- T1: מה היומן מציג ---------- */

    'הוצאה עתידית פתוחה הופכת לאירוע "לתשלום" ביום הפירעון': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.futureExpenses = [{ id: 'FE1', category: 'ביטוח', description: 'ביטוח משאית',
        amount: 1000, due_date: '2026-08-12', status: 'ממתין' }];
      const evs = w.calEvents().filter(e => e.date === '2026-08-12');
      t.eq(evs.length, 1, 'הוצאה עתידית פתוחה אינה מופיעה ביומן');
      t.has(evs[0].label, 'לתשלום', 'תווית האירוע אינה מזהה אותו כיום תשלום');
      t.has(evs[0].click, 'fexpBreakdown', 'לחיצה על יום תשלום אינה מובילה לפירוט ההוצאה');
    },

    'תאריך ISO מלא מהגיליון עדיין נופל על היום הנכון (dYmd)': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.futureExpenses = [{ id: 'FE2', category: 'שכירות', amount: 500,
        due_date: '2026-08-12T00:00:00.000Z', status: 'ממתין' }];
      const out = w.b64FexpDue();
      t.eq(out.length, 1, 'תאריך ISO מלא הפיל את ההוצאה מהיומן');
      t.eq(out[0].due_date, w.dYmd('2026-08-12T00:00:00.000Z'),
        'התאריך לא נורמל — ההוצאה תיפול על יום שגוי או תיעלם');
    },

    'הוצאה ששולמה או נמחקה אינה מופיעה ביומן': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.futureExpenses = [
        { id: 'FE3', category: 'א', amount: 100, due_date: '2026-08-20', status: 'שולם' },
        { id: 'FE4', category: 'ב', amount: 100, due_date: '2026-08-20', status: 'ממתין', deleted: 'כן' }
      ];
      t.eq(w.b64FexpDue().length, 0, 'הוצאה סגורה או מחוקה מזהמת את היומן');
    },

    'הוצאה בלי מועד תשלום אינה מייצרת אירוע': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.futureExpenses = [{ id: 'FE5', category: 'א', amount: 100, due_date: '', status: 'ממתין' }];
      t.eq(w.b64FexpDue().length, 0, 'הוצאה בלי תאריך יצרה אירוע ביומן');
    },

    '⛔ נהג ומחסן אינם רואים כסף ביומן': (t, { w, srv, H }) => {
      ['נהג', 'מחסן'].forEach(role => {
        H.login(w, role, srv);
        w.DB.futureExpenses = [{ id: 'FE6', category: 'ביטוח', amount: 900,
          due_date: '2026-08-12', status: 'ממתין' }];
        t.no(w.b64MoneyVisible(), 'תפקיד ' + role + ' מקבל גישה לכסף ביומן');
        const evs = w.calEvents().filter(e => String(e.label).indexOf('לתשלום') > -1);
        t.eq(evs.length, 0, 'תפקיד ' + role + ' רואה סכומי כסף ביומן');
      });
    },

    'מנהל ומשרד כן רואים כסף ביומן': (t, { w, srv, H }) => {
      ['מנהל', 'משרד'].forEach(role => {
        H.login(w, role, srv);
        t.ok(w.b64MoneyVisible(), 'תפקיד ' + role + ' חסום מראיית מועדי תשלום');
      });
    },

    'מועדי פירעון של לקוחות נגזרים מספר החיובים בלבד': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      t.eq(w.b64RecvDue().length, 0, 'ספר חיובים ריק ייצר אירועי פירעון יש מאין');
      const src = H.stripComments(H.uiScript());
      const fn = (src.match(/function b64RecvDue\(\)[\s\S]*?\n\}/) || [''])[0];
      t.has(fn, 'b54LedgerFE', 'b64RecvDue אינו נשען על ספר החיובים — נוצר מקור כסף שני');
    },

    /* ---------- T1: יצירה מתוך היום ---------- */

    'לחיצה על יום פותחת מסלול יצירה עם ארבע הישויות': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const h = w.b64DayCreateHtml('2026-08-12');
      ['newOrderForm', 'taskForm', 'meetingForm', 'futureExpForm'].forEach(f => {
        t.has(h, f, 'חסר מסלול יצירה מהיומן: ' + f);
      });
      t.has(h, '2026-08-12', 'התאריך שנלחץ אינו מועבר לטופס');
    },

    'openDay מציג בפועל את כפתורי היצירה (R7 — DOM אמיתי)': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.CAL_Y = 2026; w.CAL_M = 7;
      w.rCalendarDraw([]);
      const day = w.document.querySelector('.calday');
      t.ok(day, 'לוח היומן לא צויר — אין ימים ללחוץ עליהם');
      H.click(w, day);
      const modal = w.document.getElementById('modal');
      t.has(modal.innerHTML, 'הוספה ליום הזה', 'לחיצה על יום אינה פותחת מסלול יצירה');
      t.has(modal.innerHTML, 'יום לתשלום', 'חסר "יום לתשלום" במודל היום');
    },

    'התאריך שנלחץ מגיע מאוכלס לטופס המשימה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.taskForm('2026-08-12');
      const inp = w.document.getElementById('f_tdue');
      t.ok(inp, 'שדה תאריך היעד נעלם מטופס המשימה');
      t.eq(inp.value, '2026-08-12', 'תאריך היעד לא אוכלס מהיומן');
    },

    'התאריך שנלחץ מגיע מאוכלס לטופס ההוצאה העתידית': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.futureExpForm('2026-08-12');
      const inp = w.document.getElementById('f_fedate');
      t.ok(inp, 'שדה מועד התשלום נעלם מטופס ההוצאה העתידית');
      t.eq(inp.value, '2026-08-12', 'מועד התשלום לא אוכלס מהיומן');
    },

    'פתיחת הטפסים בלי תאריך נשארת ריקה — הקריאות הישנות לא נשברו': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.taskForm();
      t.eq(w.document.getElementById('f_tdue').value, '', 'taskForm() ללא ארגומנט מאכלס תאריך');
      w.futureExpForm();
      t.eq(w.document.getElementById('f_fedate').value, '', 'futureExpForm() ללא ארגומנט מאכלס תאריך');
    },

    '⛔ לא נוצר טופס שני לאותה ישות': (t, { H }) => {
      const src = H.stripComments(H.uiScript());
      [['taskForm', /function\s+taskForm\s*\(/g], ['meetingForm', /function\s+meetingForm\s*\(/g],
       ['futureExpForm', /function\s+futureExpForm\s*\(/g], ['newOrderForm', /function\s+newOrderForm\s*\(/g]
      ].forEach(pair => {
        t.eq((src.match(pair[1]) || []).length, 1,
          'קיימות שתי הגדרות ל-' + pair[0] + ' — נוצר טופס כפול');
      });
    },

    '⛔ טסט וביטוח מוצגים ביומן ואינם ניתנים ליצירה ממנו': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.vehicles = [{ id: 'V1', plate: '11-222-33', test_date: '2026-08-05',
        insurance_expiry: '2026-08-06', next_service_date: '2026-08-07' }];
      const lbls = w.calEvents().map(e => e.label).join(' | ');
      ['טסט', 'ביטוח', 'טיפול רכב'].forEach(k => {
        t.has(lbls, k, 'מועד ' + k + ' הפסיק להופיע ביומן');
      });
      const h = w.b64DayCreateHtml('2026-08-05');
      t.hasNot(h, 'טסט', 'טסט הוצע ליצירה מהיומן — הוא שדה בכרטיס הרכב');
      t.hasNot(h, 'ביטוח', 'ביטוח הוצע ליצירה מהיומן — הוא שדה בכרטיס הרכב');
    },

    /* ---------- BLD-12 ---------- */

    'b12Gross מוסיף מע"מ ו-b12Net מתייג את הנטו': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      t.eq(w.b12Gross(100), w.b45Gross(100), 'b12Gross אינו נשען על חישוב המע"מ הקיים');
      t.has(w.b12Net(100), 'לפני מע', 'תווית הנטו אינה מסבירה שזה לפני מע"מ');
    },

    'בחנות ובפורטל המספר הראשי הוא כולל מע"מ': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const gross = w.ils(w.b12Gross(100));
      const net = w.ils(100);
      [w.b12PriceInline(100), w.b12PriceStack(100)].forEach(h => {
        t.has(h, '<b>' + gross + '</b>', 'הסכום כולל מע"מ אינו המספר הראשי');
        t.has(h, net, 'הסכום לפני מע"מ נעלם לגמרי מהתצוגה');
        t.ok(h.indexOf(gross) < h.indexOf('muted'), 'הנטו מופיע לפני הברוטו');
      });
    },

    '⛔ כלל B45 לא נגע בשאר המערכת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const h = w.b45Money(100);
      t.has(h, '<b>' + w.ils(100) + '</b>', 'B45 נשבר — הנטו כבר אינו המספר הראשי במערכת');
      t.has(h, 'כולל מע', 'B45 נשבר — הברוטו נעלם מהכתב הקטן');
    },

    '⛔ החריג נשאר בחנות ובפורטל בלבד': (t, { H }) => {
      const src = H.stripComments(H.uiScript());
      ['b12PriceInline', 'b12PriceStack', 'b12Gross', 'b12Net'].forEach(fn => {
        const re = new RegExp('[^\\w]' + fn + '\\s*\\(', 'g');
        t.ok((src.match(re) || []).length > 0, fn + ' הוגדר ואינו בשימוש בשום מקום');
      });
      const fin = (src.match(/function rFinance[\s\S]*?\n\}/) || [''])[0];
      t.hasNot(fin, 'b12Price', 'עוזרי BLD-12 חלחלו למסך הכספים — כלל B45 נשבר');
    },

    'סיכום הסל בחנות מוביל בסכום לתשלום': (t, { H }) => {
      const src = H.stripComments(H.uiScript());
      const fn = (src.match(/function shopTotal\(\)[\s\S]*?\n\}/) || [''])[0];
      t.has(fn, 'סה"כ לתשלום', 'סיכום הסל אינו מוביל בסכום שהלקוח משלם בפועל');
      t.has(fn, 'לפני מע', 'הנטו נעלם לגמרי מסיכום הסל');
    },

    '⛔ הסכום שנשלח לשרת נשאר נטו — שינינו תצוגה בלבד': (t, { H }) => {
      const src = H.stripComments(H.uiScript());
      ['shopSubmit', 'portalSubmit'].forEach(name => {
        const fn = (src.match(new RegExp('function ' + name + '\\([\\s\\S]*?\\n\\}')) || [''])[0];
        t.hasNot(fn, 'b12Gross', name + ' שולח סכום ברוטו לשרת — הכסף התקלקל');
        t.hasNot(fn, 'b45Gross', name + ' שולח סכום ברוטו לשרת — הכסף התקלקל');
      });
    },

    '⛔ מסגרת האשראי נשארה נטו ומתויגת (R4)': (t, { H }) => {
      const src = H.stripComments(H.uiScript());
      const fn = (src.match(/function portalCheckout\(r\)[\s\S]*?\n\}/) || [''])[0];
      t.has(fn, 'חוב קודם (לפני מע"מ)', 'החוב הקודם אינו מתויג — הלקוח יחשוב שהוא ברוטו');
      t.hasNot(fn, 'b12Gross(fromAg(cr.', 'מסגרת האשראי הומרה לברוטו — היא לא תתאים למנוע');
    },

    /* ---------- BLD-02 ---------- */

    'רשימת אנשי המקצוע מציגה פעילים ומושבתים': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.serviceProviders = [
        { id: 'P1', name: 'יוסי', company: 'קירור הצפון', domain: 'קירור', active: 'כן' },
        { id: 'P2', name: 'דנה', company: 'חשמל דרום', domain: 'חשמל', active: 'לא' }
      ];
      const h = w.b02ProvidersHtml();
      t.has(h, 'קירור הצפון', 'איש מקצוע פעיל נעלם מהרשימה');
      t.has(h, 'חשמל דרום', 'איש מקצוע מושבת נעלם — השבתה אינה מחיקה');
      t.has(h, 'השבת', 'אין כפתור השבתה לאיש מקצוע פעיל');
      t.has(h, 'הפעל מחדש', 'אין דרך להחזיר איש מקצוע מושבת');
    },

    '⛔ מושבת נעלם מהבוררים אבל נשאר בטבלה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.serviceProviders = [
        { id: 'P1', name: 'יוסי', company: 'קירור הצפון', active: 'כן' },
        { id: 'P2', name: 'דנה', company: 'חשמל דרום', active: 'לא' }
      ];
      const ids = w.b42Providers().map(x => x.id);
      t.eq(ids.length, 1, 'איש מקצוע מושבת עדיין מוצע לבחירה בתקלות');
      t.eq(ids[0], 'P1', 'הבורר מציג את איש המקצוע הלא נכון');
      t.eq(w.DB.serviceProviders.length, 2, 'ההשבתה מחקה את הרשומה — ההיסטוריה אבדה');
    },

    '⛔ רק מנהל ומשרד מקבלים את כפתור ההשבתה': (t, { w, srv, H }) => {
      ['מנהל', 'משרד'].forEach(role => {
        H.login(w, role, srv);
        w.DB.serviceProviders = [{ id: 'P1', name: 'יוסי', company: 'קירור הצפון', active: 'כן' }];
        t.ok(w.b02CanProv(), role + ' חסום מהשבתת ספק שירות');
        t.has(w.b02ProvidersHtml(), 'b02ToggleProv', 'כפתור ההשבתה חסר ל-' + role);
      });
      ['מחסן', 'נהג', 'ייצור'].forEach(role => {
        H.login(w, role, srv);
        w.DB.serviceProviders = [{ id: 'P1', name: 'יוסי', company: 'קירור הצפון', active: 'כן' }];
        t.no(w.b02CanProv(), role + ' קיבל הרשאה להשבית ספק שירות');
        t.hasNot(w.b02ProvidersHtml(), 'b02ToggleProv', 'כפתור ההשבתה נחשף ל-' + role);
      });
    },

    '⛔ ההשבתה משתמשת בפעולת השרת הקיימת ושולחת את כל השדות': (t, { H }) => {
      const src = H.stripComments(H.uiScript());
      const fn = (src.match(/async function b02ToggleProv\(id\)[\s\S]*?\n\}/) || [''])[0];
      t.has(fn, 'b42SaveProvider', 'נוצרה פעולת שרת חדשה במקום להשתמש בקיימת');
      ['name:', 'company:', 'domain:', 'phone:', 'email:', 'vat_id:', 'notes:', 'active:'].forEach(f => {
        t.has(fn, f, 'השדה ' + f + ' אינו נשלח — עדכון חלקי ירוקן אותו בגיליון');
      });
    },

    'מסך הרכש מציג את רשימת אנשי המקצוע': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.serviceProviders = [{ id: 'P1', name: 'יוסי', company: 'קירור הצפון', active: 'כן' }];
      w.go('purchasing');
      t.has(w.document.getElementById('main').innerHTML, 'אנשי מקצוע וחברות שירות',
        'רשימת אנשי המקצוע אינה מופיעה במסך רכש וספקים');
    },

    /* ---------- T2ב ---------- */

    'סריקת יחידה, עגלה ומדף: פעולה ראשית אחת + ⋯': (t, { H }) => {
      const src = H.stripComments(H.uiScript());
      const fn = (src.match(/async function doScan\(\)[\s\S]*?\n\}\n/) || [''])[0];
      t.has(fn, 'moreMenu', 'מסך הסריקה לא אימץ את דפוס ⋯ של b62OrderActions');
      ['גרוט', 'ספירת מדף', 'היסטוריית הכביסה', 'פתח כרטיס עגלה'].forEach(lbl => {
        t.has(fn, lbl, 'הפעולה "' + lbl + '" נעלמה ממסך הסריקה');
      });
    },

    'מרכז האישורים: אישור גלוי, דחייה ב-⋯, ושום פעולה לא נעלמה': (t, { H }) => {
      const src = H.stripComments(H.uiScript());
      const fn = (src.match(/async function loadApprovals\(\)[\s\S]*?\n\}\n/) || [''])[0];
      t.has(fn, 'moreMenu', 'מרכז האישורים לא אימץ את דפוס ⋯');
      ['apprApproveGuarantee', 'apprRejectGuarantee', 'apprApproveException',
       'apprRejectException', 'apprConfirmDecl', 'apprRejectDecl',
       'apprReplyMsg', 'apprCloseMsg'].forEach(fnName => {
        t.has(fn, fnName, 'הפעולה ' + fnName + ' נעלמה ממרכז האישורים');
      });
    },

    '⛔ הרשאות מרכז האישורים לא השתנו': (t, { H }) => {
      const src = H.stripComments(H.uiScript());
      const fn = (src.match(/async function loadApprovals\(\)[\s\S]*?\n\}\n/) || [''])[0];
      t.has(fn, 'canAct', 'בדיקת ההרשאה canAct נעלמה ממרכז האישורים');
      t.has(fn, 'אישור/דחייה — מנהל בלבד', 'ההסבר למי שאינו מורשה נעלם');
    },

    '⛔ תפריט ⋯ נשאר אחד — לא נבנה דפוס שני (R8)': (t, { H }) => {
      const src = H.stripComments(H.uiScript());
      t.eq((src.match(/function\s+moreMenu\s*\(/g) || []).length, 1,
        'קיימות שתי הגדרות moreMenu — נבנה דפוס תפריט שני');
      t.eq((src.match(/function\s+toggleMore\s*\(/g) || []).length, 1,
        'קיימות שתי הגדרות toggleMore');
    }

  }
});


/* ============================================================================
   t08 — B64a: נרמול ערכי טקסט מהגיליון לפני השוואה
   ----------------------------------------------------------------------------
   ⚠ הבאג שנתפס כאן, ואיך הוא נראה למשתמש: רווח נגרר אחד בעמודת `stage`
   בגיליון גרם ל-`STAGES.indexOf` להחזיר -1, `advanceForm` יצאה **לפני**
   `openModal`, והמודל פשוט לא נפתח. ההודעה שכן הוצגה — "המשימה כבר בשלב
   מוכן" — הייתה שגויה, ולכן שלחה לחפש במקום הלא נכון. אותו דפוס בדיוק
   הפיל את כרטיס "בחר סיבה" של הנהג: `kind` עם רווח → `picks` ריק →
   הכרטיס לא צויר כלל.
   ⛔ הבדיקות האלה חייבות לרוץ **דרך המודל האמיתי**, לא דרך הפונקציה
   העוזרת — אחרת הן לא מוכיחות שהתפריט באמת נפתח.
   ============================================================================ */

SPECS.push({
  file: 't08-b64a-sval',
  title: 'B64a — ערך מהגיליון עם רווח לא מפיל תפריט',
  /* ⚠ 'ui' ולא 'both': בדיקת הריקבון מאמתת סמלים מול סביבה **אחת**, וכל
     הסמלים כאן חיים בממשק. השוואת הקוד מול השרת נעשית דרך H.serverSrc(). */
  needs: 'ui',
  requires: ['sVal', 'sPick', 'advanceForm', 'STAGES', 'NOBLE_STAGES',
             'b41IntakeState', 'b41DriverHandled', 'b41PickupReceived',
             'b41IntakeBannerHtml', 'openModal', 'closeModal',
             'portalLaundryHtml', 'dYmd', 'b58AfterRefresh', 'render', 'go'],

  tests: {

    /* ---------- המנרמל עצמו ---------- */

    'sVal מנקה רווחים, רווח קשיח ותווי כיווניות': (t, { w }) => {
      t.eq(w.sVal('בכביסה '), 'בכביסה', 'רווח נגרר לא נוקה');
      t.eq(w.sVal(' בכביסה'), 'בכביסה', 'רווח מוביל לא נוקה');
      t.eq(w.sVal('בגיהוץ  וקיפול'), 'בגיהוץ וקיפול', 'רווח כפול פנימי לא כווץ');
      t.eq(w.sVal('בכביסה\u00A0'), 'בכביסה', 'רווח קשיח (הדבקה מדפדפן) לא נוקה');
      t.eq(w.sVal('\u200Eבכביסה'), 'בכביסה', 'תו כיווניות RTL לא נוקה');
      t.eq(w.sVal(null), '', 'null לא הפך למחרוזת ריקה');
      t.eq(w.sVal(undefined), '', 'undefined לא הפך למחרוזת ריקה');
    },

    '⛔ sVal אינו משנה ערך תקין': (t, { w }) => {
      w.STAGES.forEach(s => t.eq(w.sVal(s), s, 'הערך התקין "' + s + '" שונה על ידי sVal'));
    },

    'sPick מחזיר את הערך הקנוני מהרשימה, לא את מה שהיה בגיליון': (t, { w }) => {
      t.eq(w.sPick('בכביסה ', w.STAGES), 'בכביסה', 'sPick לא החזיר את הערך הקנוני');
      t.eq(w.sPick('שלב שלא קיים', w.STAGES), '', 'sPick התאים ערך שאינו ברשימה');
      t.eq(w.sPick('', w.STAGES), '', 'ערך ריק קיבל התאמה');
    },

    /* ---------- הבאג המקורי: המודל חייב להיפתח ---------- */

    '⭐ מודל קידום שלב נפתח גם כשיש רווח בגיליון': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.items = [{ id: 'I1', name: 'מגבת' }];
      w.DB.carts = [{ id: 'CA1', status: 'בשימוש' }];
      ['בכביסה', 'בכביסה ', ' בכביסה', 'בכביסה\u00A0', '\u200Eבכביסה', 'בגיהוץ  וקיפול'].forEach(st => {
        w.closeModal();
        w.DB.laundryTasks = [{ id: 'LT1', item_id: 'I1', qty: 5, stage: st, cart_id: 'CA1' }];
        w.advanceForm('LT1');
        const open = w.document.getElementById('modalBg').style.display === 'flex';
        t.ok(open, 'המודל לא נפתח כאשר stage=' + JSON.stringify(st) + ' — זה הבאג המקורי');
        t.ok(w.document.getElementById('adv_to'), 'בורר שלב היעד לא נוצר עבור ' + JSON.stringify(st));
      });
    },

    'בורר שלב היעד מציע את אותן אפשרויות עם רווח ובלעדיו': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.items = [{ id: 'I1', name: 'מגבת' }];
      w.DB.carts = [{ id: 'CA1', status: 'בשימוש' }];
      const opts = st => {
        w.closeModal();
        w.DB.laundryTasks = [{ id: 'LT1', item_id: 'I1', qty: 5, stage: st, cart_id: 'CA1' }];
        w.advanceForm('LT1');
        const s = w.document.getElementById('adv_to');
        return s ? Array.from(s.options).map(o => o.value).join(',') : '';
      };
      t.eq(opts('בכביסה '), opts('בכביסה'), 'רווח בגיליון שינה את רשימת שלבי היעד');
    },

    '⛔ שלב שבאמת לא מוכר מקבל הודעה נכונה ולא "כבר בשלב מוכן"': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.items = [{ id: 'I1', name: 'מגבת' }];
      const msgs = [];
      const orig = w.toast; w.toast = m => msgs.push(String(m));
      w.closeModal();
      w.DB.laundryTasks = [{ id: 'LT9', item_id: 'I1', qty: 1, stage: 'בכביסה ראשונה' }];
      w.advanceForm('LT9');
      w.toast = orig;
      t.ok(msgs.length > 0, 'שלב לא מוכר לא הפיק שום הודעה');
      t.hasNot(msgs[0], 'כבר בשלב מוכן', 'ההודעה השגויה חזרה — היא שולחת לחפש במקום הלא נכון');
      t.has(msgs[0], 'בכביסה ראשונה', 'ההודעה אינה מציגה את הערך הבעייתי שבגיליון');
      t.has(msgs[0], 'LT9', 'ההודעה אינה מציינת באיזו משימה לתקן');
    },

    'משימה שבאמת הסתיימה עדיין מקבלת את ההודעה הישנה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.items = [{ id: 'I1', name: 'מגבת' }];
      const msgs = [];
      const orig = w.toast; w.toast = m => msgs.push(String(m));
      w.closeModal();
      w.DB.laundryTasks = [{ id: 'LT8', item_id: 'I1', qty: 1, stage: 'מוכן ' }];
      w.advanceForm('LT8');
      w.toast = orig;
      t.has(msgs[0] || '', 'כבר בשלב מוכן', 'משימה שהסתיימה קיבלה הודעת שלב לא מוכר');
      t.no(w.document.getElementById('modalBg').style.display === 'flex',
        'משימה שהסתיימה פתחה מודל קידום');
    },

    /* ---------- בורר הסיבה של הנהג ---------- */

    '⭐ כרטיס "בחר סיבה" מצויר גם כש-kind בגיליון עם רווח': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח' }];
      w.DB.orders = [{ id: 'O1', order_number: '1001', customer_id: 'C1', status: 'נמסרה',
        type: 'השכרה', start_date: '2026-07-01', end_date: '2026-07-10' }];
      ['איסוף', 'איסוף ', ' איסוף', 'איסוף\u00A0'].forEach(k => {
        w.DB.deliveries = [{ id: 'D1', order_id: 'O1', kind: k, direction: 'איסוף',
          status: 'מתוכנן', driver: 'נהג א', date: '2026-07-10' }];
        const st = w.b41IntakeState('O1');
        t.eq(st.picks.length, 1, 'kind=' + JSON.stringify(k) + ' — האיסוף לא נמצא, הכרטיס לא ייווצר');
        t.ok(st.open.length === 1, 'kind=' + JSON.stringify(k) + ' — הנסיעה לא נחשבה פתוחה');
      });
    },

    'status עם רווח עדיין נחשב נסיעה פתוחה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח' }];
      w.DB.orders = [{ id: 'O1', customer_id: 'C1', status: 'נמסרה', type: 'השכרה',
        start_date: '2026-07-01', end_date: '2026-07-10' }];
      ['מתוכנן', 'מתוכנן ', 'בדרך '].forEach(stt => {
        w.DB.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'איסוף', status: stt, driver: 'נהג א' }];
        t.eq(w.b41IntakeState('O1').open.length, 1,
          'status=' + JSON.stringify(stt) + ' לא נחשב פתוח');
      });
    },

    'שם נהג עם רווח כפול עדיין מזוהה כמי שתיעד': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      t.ok(w.b41DriverHandled({ driver: 'יוסי כהן', scan_status: 'נסרק', scan_by: 'יוסי  כהן' }),
        'רווח כפול בשם ניתק את זיהוי הנהג — המערכת "שוכחת" שהוא סרק');
      t.ok(w.b41DriverHandled({ driver: 'יוסי כהן ', photo_url: 'u', photo_by: 'יוסי כהן' }),
        'רווח נגרר בשם ניתק את זיהוי הצילום');
      t.no(w.b41DriverHandled({ driver: 'יוסי', scan_status: 'נסרק', scan_by: 'דנה' }),
        'נהג אחר זוהה בטעות כמי שתיעד — הנרמול רחב מדי');
    },

    '⛔ נהג שלא תיעד כלום עדיין דורש סיבה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח' }];
      w.DB.orders = [{ id: 'O1', customer_id: 'C1', status: 'נמסרה', type: 'השכרה',
        start_date: '2026-07-01', end_date: '2026-07-10' }];
      w.DB.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'איסוף ', status: 'מתוכנן',
        driver: 'נהג א' }];
      t.ok(w.b41IntakeState('O1').needsReason,
        'הדרישה לסיבה נעלמה — B41 נשבר, נסיעה לא מתועדת תיסגר בלי הסבר');
    },

    /* ---------- מחווני NOBLE ---------- */

    'מחוון הכביסה בפורטל אינו נראה כבוי בגלל רווח': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const a = w.portalLaundryHtml({ status: 'בייבוש', eta_min: 0 });
      const b = w.portalLaundryHtml({ status: 'בייבוש ', eta_min: 0 });
      t.eq(a, b, 'רווח בעמודת status שינה את מחוון ההתקדמות שהלקוח רואה');
    },

    /* ---------- הסכמה בין שני הצדדים ---------- */

    '⛔ sVal זהה בממשק ובשרת — שני הצדדים לא יתפצלו': (t, { H }) => {
      const ui = H.stripComments(H.uiScript());
      const sv = H.stripComments(H.serverSrc());
      const grab = src => {
        const m = src.match(/function sVal\([\s\S]*?\n\}/);
        return m ? m[0].replace(/\s+/g, '') : '';
      };
      const a = grab(ui), b = grab(sv);
      t.ok(a.length > 0, 'sVal חסר בממשק');
      t.ok(b.length > 0, 'sVal חסר בשרת');
      t.eq(a, b, 'sVal התפצל בין הממשק לשרת — ההתנהגות תשתנה בין הצדדים');
    },

    '⛔ השרת מנרמל את השלב שנקרא מהגיליון': (t, { H }) => {
      const sv = H.stripComments(H.serverSrc());
      t.has(sv, 'sPick(t.stage, STAGES)',
        'השרת עדיין משווה את השלב מהגיליון בהשוואה מדויקת');
      t.hasNot(sv, 'var idx = STAGES.indexOf(t.stage)',
        'ההשוואה המדויקת הישנה נשארה בשרת');
    },

    /* ---------- הרענון האוטומטי לא קוטע בחירה ---------- */

    '⛔ הרענון האוטומטי אינו מצייר מחדש בזמן שהמשתמש בתוך שדה או בורר': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.go('orders');
      const box = w.document.createElement('select');
      box.innerHTML = '<option>א</option>';
      w.document.getElementById('main').appendChild(box);
      box.focus();
      let rendered = 0;
      const orig = w.render; w.render = () => { rendered++; };
      w.b58AfterRefresh();
      w.render = orig;
      t.eq(rendered, 0, 'הרענון צייר מחדש בזמן בחירה — הרשימה נמחקת והפירוט שהוקלד אובד');
    },

    'הרענון כן מצייר מחדש כשהמשתמש אינו באמצע כלום': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.go('orders');
      w.closeModal();
      if (w.document.activeElement && w.document.activeElement.blur) w.document.activeElement.blur();
      let rendered = 0;
      const orig = w.render; w.render = () => { rendered++; };
      w.b58AfterRefresh();
      w.render = orig;
      t.eq(rendered, 1, 'הרענון הפסיק לצייר מחדש לגמרי — המסך לא יתעדכן יותר');
    },

    '⛔ sVal לא הוחל על כסף או על מספרים': (t, { H }) => {
      const ui = H.stripComments(H.uiScript());
      ['sVal(x.amount', 'sVal(r.open_ag', 'sVal(o.total', 'sVal(fromAg', 'sVal(toAg'].forEach(bad => {
        t.hasNot(ui, bad, 'sVal הוחל על ערך כספי — שם ההשוואה מספרית ולא טקסטואלית');
      });
    }

  }
});


/* ============================================================================
   t09 — B65: טופס כביסה · ריפוי BLD-01 · מד הרוחב של BLD-05
   ----------------------------------------------------------------------------
   שלושה דברים נבדקים כאן, וכל אחד נולד מכשל אמיתי:

   1. **טופס הזמנה שמשנה צורה.** בורר "סוג" היה select בלי onchange, ולכן
      הזמנת כביסה קיבלה את מילון ההשכרה. הבדיקות דורשות אירוע change אמיתי
      (R7) — קריאה ישירה ל-b65ApplyType לא הייתה מוכיחה שהבורר מחובר.
      ⛔ נבדק במפורש שהשדות עצמם **לא** השתנו: אותם id, אותם ערכים לשרת.

   2. **BLD-01 — ריפוי היסטורי.** הבדיקה המרכזית היא אידמפוטנטיות: הרצה
      שנייה חייבת לא לכתוב כלום. תיקון נתונים שאפשר להריץ פעמיים בלי נזק
      הוא מה ש-R1 דורש, וזו הטענה שקשה לאמת בעין.

   3. **מד הרוחב.** הכלי של B61 לא מסר את המספר משתי סיבות שנמצאו בקריאת
      קוד: b61Text העתיק רק כשלים, והמדידה כיסתה מסך אחד. שתיהן נבדקות.
   ============================================================================ */

SPECS.push({
  file: 't09-b65-wash',
  title: 'B65 — טופס כביסה שמשנה צורה לפי הסוג',
  needs: 'ui',
  requires: ['newOrderForm', 'createOrder', 'b65ApplyType', 'b65OrderTypeVal',
             'b65LegLabel', 'b65CanNewOrder', 'b65NewWashOrder', 'B65_TYPES',
             'b49eLegLabel', 'b49eShipMode', 'sPick', 'openModal', 'closeModal',
             'rOrders', 'rLaundry', 'go'],

  tests: {

    'הטופס נפתח בהשכרה כברירת מחדל ובשפת השכרה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח בדיקה', active: 'כן' }];
      w.newOrderForm(false);
      t.eq(w.b65OrderTypeVal(), 'השכרה', 'ברירת המחדל אינה השכרה');
      t.eq(w.el('lb_start').textContent, 'תאריך אירוע / איסוף', 'תווית תאריך ההתחלה בהשכרה השתנתה');
      t.has(w.el('lb_out').textContent, 'אספקה ללקוח', 'תווית רגל ההלוך בהשכרה שגויה');
      w.closeModal();
    },

    '⭐ בחירת "כביסה" בבורר משנה את התוויות — דרך אירוע change אמיתי (R7)': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח בדיקה', active: 'כן' }];
      w.newOrderForm(false);
      H.change(w, w.el('f_type'), 'כביסה');
      t.eq(w.b65OrderTypeVal(), 'כביסה', 'הבורר לא עבר לכביסה');
      t.eq(w.el('lb_start').textContent, 'תאריך מסירת הכביסה', 'תווית תאריך המסירה לא התחלפה — הבורר אינו מחובר');
      t.eq(w.el('lb_end').textContent, 'תאריך החזרה ללקוח', 'תווית תאריך ההחזרה לא התחלפה');
      t.has(w.el('lb_out').textContent, 'איסוף הכביסה מהלקוח', 'רגל ההלוך בכביסה לא קיבלה את השם הנכון');
      t.has(w.el('lb_back').textContent, 'החזרת הכביסה ללקוח', 'רגל החזור בכביסה לא קיבלה את השם הנכון');
      w.closeModal();
    },

    'חזרה להשכרה מחזירה את התוויות — ההחלפה דו-כיוונית': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח בדיקה', active: 'כן' }];
      w.newOrderForm(false);
      H.change(w, w.el('f_type'), 'כביסה');
      H.change(w, w.el('f_type'), 'השכרה');
      t.eq(w.el('lb_start').textContent, 'תאריך אירוע / איסוף', 'החזרה להשכרה לא שחזרה את התווית');
      w.closeModal();
    },

    '⛔ החלפת סוג אינה מוחקת ערכים שכבר הוקלדו': (t, { w, srv, H }) => {
      /* אותה מחלקת נזק שהגנת activeElement ב-b58AfterRefresh מונעת:
         רינדור מחדש של הטופס היה מוחק את מה שהמשתמש כבר הקליד. */
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח בדיקה', active: 'כן' }];
      w.newOrderForm(false);
      w.el('f_start').value = '2026-08-10';
      w.el('f_notes').value = 'הערה של המשתמש';
      H.change(w, w.el('f_type'), 'כביסה');
      t.eq(w.el('f_start').value, '2026-08-10', 'תאריך שהוקלד נמחק בהחלפת הסוג');
      t.eq(w.el('f_notes').value, 'הערה של המשתמש', 'הערה שהוקלדה נמחקה בהחלפת הסוג');
      w.closeModal();
    },

    '⛔ השדות עצמם לא השתנו — אותם id ואותם ערכים לשרת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח בדיקה', active: 'כן' }];
      w.newOrderForm(false);
      ['f_cust', 'f_type', 'f_start', 'f_end', 'f_ofee', 'f_shipout', 'f_shipback', 'f_notes']
        .forEach(id => t.ok(!!w.el(id), 'שדה שהיה קיים נעלם מהטופס: ' + id));
      w.closeModal();
    },

    'presetType פותח ישר בכביסה — והפרמטר אופציונלי ובסוף': (t, { w, srv, H }) => {
      /* כלל B64: פרמטר חדש נכנס בסוף ובאופציונלי, כדי שקריאות ישנות
         (newOrderForm(false) · newOrderForm(false, iso)) לא יישברו. */
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח בדיקה', active: 'כן' }];
      w.newOrderForm(false, '', 'כביסה');
      t.eq(w.b65OrderTypeVal(), 'כביסה', 'presetType לא נבחר בבורר');
      t.eq(w.el('lb_start').textContent, 'תאריך מסירת הכביסה', 'presetType לא החיל את התוויות');
      w.closeModal();

      w.newOrderForm(false, '2026-09-01');
      t.eq(w.el('f_start').value, '2026-09-01', 'קריאה ישנה עם iso בלבד נשברה (T1/B64)');
      t.eq(w.b65OrderTypeVal(), 'השכרה', 'קריאה בלי presetType לא נפלה להשכרה');
      w.closeModal();
    },

    '⭐ יש נקודת כניסה להזמנת כביסה גם ממסך ההזמנות וגם מלוח הכביסה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח בדיקה', active: 'כן' }];
      w.go('orders');
      t.has(w.el('main').innerHTML, 'כביסה</button>', 'מסך ההזמנות לא קיבל כפתור כביסה');
      w.go('laundry');
      t.has(w.el('main').innerHTML, 'הזמנת כביסה חדשה', 'לוח הכביסה לא קיבל כפתור פתיחת הזמנה');
    },

    '⛔ לא נוסף מסך — 29 המסכים נשארו 29': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      t.eq(w.VIEWS.length, 29, 'מספר המסכים השתנה — נמסרו ' + w.VIEWS.length);
    },

    '⛔ מי שאינו רשאי להיכנס להזמנות אינו מקבל את הכפתור': (t, { w, srv, H }) => {
      H.login(w, 'מכבסה', srv);
      const allowed = w.allowedViews().some(v => v[0] === 'orders');
      t.eq(w.b65CanNewOrder(), allowed, 'ההרשאה לכפתור אינה נגזרת מההרשאה למסך ההזמנות');
    },

    'b65LegLabel נשען על b49eLegLabel ואינו רשימת מחרוזות שנייה': (t, { w, H }) => {
      ['השכרה', 'כביסה'].forEach(type => {
        ['הלוך', 'חזור'].forEach(leg => {
          t.eq(w.b65LegLabel(type, leg), w.b49eLegLabel({ type: type }, leg),
            'התוויות התפצלו מ-b49eLegLabel — ' + type + '/' + leg);
        });
      });
    },

    '⛔ B64a — אופן המסירה מהגיליון עובר sPick ולא trim': (t, { w }) => {
      /* ship_back עם רווח קשיח היה נופל לגזירה מ-delivery_fee בלי שום
         שגיאה: איסוף עצמי הופך למשלוח או להפך, ורגל נוצרת או לא נוצרת. */
      t.eq(w.b49eShipMode({ type: 'כביסה', ship_back: 'איסוף עצמי\u00A0' }, 'חזור'), 'איסוף עצמי',
        'רווח קשיח ב-ship_back הפיל את אופן המסירה');
      t.eq(w.b49eShipMode({ type: 'כביסה', ship_out: ' משלוח ' }, 'הלוך'), 'משלוח',
        'רווחים ב-ship_out הפילו את אופן המסירה');
      t.eq(w.b49eShipMode({ type: 'כביסה', ship_back: '', delivery_fee: 0 }, 'חזור'), 'איסוף עצמי',
        'הגזירה לאחור להזמנה ותיקה נשברה');
    },

    '⛔ סוג ההזמנה שנשלח לשרת מנורמל': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח בדיקה', active: 'כן' }];
      w.newOrderForm(false, '', 'כביסה');
      t.eq(w.b65OrderTypeVal(), 'כביסה', 'הערך שנשלח לשרת אינו קנוני');
      w.closeModal();
      t.eq(w.sPick(' כביסה ', w.B65_TYPES), 'כביסה', 'sPick לא מנרמל סוג הזמנה');
      t.eq(w.sPick('משהו אחר', w.B65_TYPES), '', 'sPick התאים סוג שאינו ברשימה');
    }
  }
});


SPECS.push({
  file: 't09-bld01-heal',
  title: 'B65 / BLD-01 — ריפוי הזמנות כביסה היסטוריות',
  needs: 'server',
  requires: ['bld01Candidates', 'bld01Diagnose', 'bld01Heal', 'READ_ONLY_ACTIONS',
             'b56CloseLaundryReturnLeg', 'b56CloseLaundryOrder', 'B56_CLOSED_INTAKE', 'b56IntakeOpen',
             'B5_OPEN_STATUSES', 'b49eLegKind', 'b49eShipMode', 'sVal', 'b34OfficeOk'],

  tests: {

    '⛔ האבחון ב-READ_ONLY_ACTIONS והריפוי בכוונה לא': (t, { srv }) => {
      t.ok(srv.READ_ONLY_ACTIONS.indexOf('bld01Diagnose') > -1, 'האבחון אינו מסומן כקריאה בלבד');
      t.eq(srv.READ_ONLY_ACTIONS.indexOf('bld01Heal'), -1,
        'bld01Heal נכנסה ל-READ_ONLY_ACTIONS — היא כותבת ל-deliveries ול-orders (R4)');
    },

    '⭐ הזמנה היסטורית עם רגל חזור פתוחה מזוהה': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'סופקה',
                     end_date: '2026-06-01', ship_back: 'משלוח', order_number: '101' }];
      db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: 'נמסר', delivered_ts: '2026-06-02 10:00:00' }];
      db.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'אספקה', status: 'מתוכנן', date: '2026-06-01' }];
      const r = srv.bld01Diagnose(db);
      t.eq(r.count, 1, 'ההזמנה ההיסטורית לא זוהתה');
      t.eq(r.legs, 1, 'רגל החזור הפתוחה לא נספרה');
      t.eq(r.rows[0].order_id, 'O1', 'זוהתה הזמנה שגויה');
      t.eq(r.rows[0].will_close_leg, 1, 'לא סומן שרגל החזור תיסגר');
      t.eq(r.rows[0].will_close_order, 1, 'לא סומן שההזמנה תעבור להושלמה');
    },

    '⛔ האבחון אינו כותב דבר': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'סופקה', ship_back: 'משלוח' }];
      db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: 'נמסר' }];
      db.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'אספקה', status: 'מתוכנן' }];
      const before = JSON.stringify(db);
      srv.bld01Diagnose(db);
      t.eq(JSON.stringify(db), before, 'האבחון שינה את בסיס הנתונים — הוא חייב להיות READ_ONLY (R1)');
    },

    '⛔ הזמנה שעדיין בעבודה אינה נוגעת': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'מאושרת', ship_back: 'משלוח' }];
      db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: 'בעבודה' }];
      db.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'אספקה', status: 'מתוכנן' }];
      t.eq(srv.bld01Diagnose(db).count, 0, 'הזמנה שעדיין במכבסה סומנה לריפוי');
    },

    '⛔ הזמנה עם שתי קליטות שאחת מהן פתוחה אינה נוגעת': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'סופקה', ship_back: 'משלוח' }];
      db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: 'נמסר' },
                           { id: 'IK2', order_id: 'O1', status: 'במשלוח' }];
      db.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'אספקה', status: 'מתוכנן' }];
      t.eq(srv.bld01Diagnose(db).count, 0, 'הזמנה שקליטה שנייה שלה עדיין פתוחה סומנה לריפוי');
    },

    '⛔ הזמנה שמעולם לא נמסרה אינה נוגעת': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'מאושרת', ship_back: 'משלוח' }];
      db.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'אספקה', status: 'מתוכנן' }];
      t.eq(srv.bld01Diagnose(db).count, 0, 'הזמנה בלי אף קליטה שנמסרה סומנה לריפוי');
    },

    '⛔ הזמנת השכרה לעולם לא נכנסת לריפוי הזה': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.orders = [{ id: 'O1', type: 'השכרה', customer_id: 'C1', status: 'סופקה', ship_back: 'משלוח' }];
      db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: 'נמסר' }];
      db.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'איסוף', status: 'מתוכנן' }];
      t.eq(srv.bld01Diagnose(db).count, 0, 'הזמנת השכרה נכנסה לריפוי של BLD-01');
    },

    '⭐ B64a — רווח בגיליון אינו מסתיר הזמנה שזקוקה לריפוי': (t, { srv, H }) => {
      /* בלי sVal ההזמנה הזו הייתה "לא נמצאת" והרשימה הייתה חוזרת ריקה —
         כשל שקט מהמחלקה של B64a, והפעם על נתונים היסטוריים. */
      const db = H.emptyDb(srv);
      db.orders = [{ id: 'O1', type: 'כביסה\u00A0', customer_id: 'C1', status: ' סופקה ', ship_back: 'משלוח' }];
      db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: 'נמסר ' }];
      db.deliveries = [{ id: 'D1', order_id: 'O1', kind: ' אספקה', status: 'מתוכנן\u200E' }];
      t.eq(srv.bld01Diagnose(db).count, 1, 'רווחים בגיליון הסתירו הזמנה שזקוקה לריפוי');
    },

    '⭐ הריפוי סוגר את רגל החזור ואת ההזמנה': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.employees = [{ id: 'E1', name: 'מנהלת', role: 'מנהל', active: 'כן' }];
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'סופקה', ship_back: 'משלוח' }];
      db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: 'נמסר' }];
      db.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'אספקה', status: 'מתוכנן' }];
      const r = srv.bld01Heal(db, {}, 'מנהלת');
      t.ok(r.ok, 'הריפוי נכשל: ' + (r.error || ''));
      t.eq(r.healed, 1, 'לא רופאה אף הזמנה');
      t.eq(srv.sVal(db.deliveries[0].status), 'בוצע', 'רגל החזור לא נסגרה');
      t.eq(srv.sVal(db.orders[0].status), 'הושלמה', 'ההזמנה לא עברה להושלמה');
    },

    '⭐⭐ הריפוי אידמפוטנטי — הרצה שנייה אינה משנה כלום (R1)': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.employees = [{ id: 'E1', name: 'מנהלת', role: 'מנהל', active: 'כן' }];
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'סופקה', ship_back: 'משלוח' }];
      db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: 'נמסר' }];
      db.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'אספקה', status: 'מתוכנן' }];
      srv.bld01Heal(db, {}, 'מנהלת');
      const after1 = JSON.stringify(db);
      const r2 = srv.bld01Heal(db, {}, 'מנהלת');
      t.ok(r2.ok, 'ההרצה השנייה החזירה שגיאה');
      t.eq(r2.healed, 0, 'ההרצה השנייה "ריפאה" שוב — הפעולה אינה אידמפוטנטית');
      t.eq(JSON.stringify(db), after1, 'ההרצה השנייה שינתה נתונים');
      t.eq(srv.bld01Diagnose(db).count, 0, 'האבחון עדיין מציג את ההזמנה אחרי ריפוי');
    },

    '⛔ רק מנהל ומשרד רשאים לרפא': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.employees = [{ id: 'E1', name: 'עובדת מכבסה', role: 'מכבסה', active: 'כן' },
                      { id: 'E2', name: 'פקידה', role: 'משרד', active: 'כן' }];
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'סופקה', ship_back: 'משלוח' }];
      db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: 'נמסר' }];
      db.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'אספקה', status: 'מתוכנן' }];
      const bad = srv.bld01Heal(db, {}, 'עובדת מכבסה');
      t.no(bad.ok, 'עובדת מכבסה הצליחה לרפא — הפעולה מצהירה שנסיעה בוצעה בפועל');
      t.eq(srv.sVal(db.deliveries[0].status), 'מתוכנן', 'הנתונים השתנו למרות שההרשאה נדחתה');
      t.ok(srv.bld01Heal(db, {}, 'פקידה').ok, 'משרד נחסם מריפוי');
    },

    'ריפוי סלקטיבי — order_ids מגביל לרשומה אחת': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.employees = [{ id: 'E1', name: 'מנהלת', role: 'מנהל', active: 'כן' }];
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'סופקה', ship_back: 'משלוח' },
                   { id: 'O2', type: 'כביסה', customer_id: 'C2', status: 'סופקה', ship_back: 'משלוח' }];
      db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: 'נמסר' },
                           { id: 'IK2', order_id: 'O2', status: 'נמסר' }];
      db.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'אספקה', status: 'מתוכנן' },
                       { id: 'D2', order_id: 'O2', kind: 'אספקה', status: 'מתוכנן' }];
      const r = srv.bld01Heal(db, { order_ids: ['O1'] }, 'מנהלת');
      t.eq(r.healed, 1, 'ריפוי סלקטיבי נגע ביותר מהזמנה אחת');
      t.eq(srv.sVal(db.deliveries[1].status), 'מתוכנן', 'הזמנה שלא נבחרה שונתה');
    },

    '⛔ איסוף עצמי ברגל החזור — אין רגל לסגור, רק הסטטוס': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.employees = [{ id: 'E1', name: 'מנהלת', role: 'מנהל', active: 'כן' }];
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'סופקה', ship_back: 'איסוף עצמי' }];
      db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: 'נמסר' }];
      const r = srv.bld01Diagnose(db);
      t.eq(r.count, 1, 'הזמנה באיסוף עצמי שנתקעה ב"סופקה" לא זוהתה');
      t.eq(r.rows[0].will_close_leg, 0, 'סומן שתיסגר רגל למרות שאין רגל');
      srv.bld01Heal(db, {}, 'מנהלת');
      t.eq(srv.sVal(db.orders[0].status), 'הושלמה', 'ההזמנה לא נסגרה');
    },

    '⛔ אין כאן נגיעה בכסף': (t, { srv, H }) => {
      /* B54_SKIP_ORDER מחריג רק בוטלה/טיוטה/הצעת מחיר, ולכן 'סופקה'
         ו'הושלמה' נספרות זהה בספר החיובים. הריפוי אינו מזיז אגורה. */
      const db = H.emptyDb(srv);
      db.employees = [{ id: 'E1', name: 'מנהלת', role: 'מנהל', active: 'כן' }];
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'סופקה', ship_back: 'משלוח' }];
      db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: 'נמסר', total_charge: 250 }];
      db.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'אספקה', status: 'מתוכנן' }];
      db.invoices = []; db.payments = [];
      srv.bld01Heal(db, {}, 'מנהלת');
      t.eq(Number(db.laundryIntakes[0].total_charge), 250, 'הריפוי נגע בחיוב של הקליטה');
      t.eq(db.invoices.length, 0, 'הריפוי יצר חשבונית');
      t.eq(db.payments.length, 0, 'הריפוי יצר תשלום');
    },

    'רשימה ריקה מוחזרת בשקט ולא כשגיאה': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.employees = [{ id: 'E1', name: 'מנהלת', role: 'מנהל', active: 'כן' }];
      const r = srv.bld01Heal(db, {}, 'מנהלת');
      t.ok(r.ok, 'מסד ריק החזיר שגיאה');
      t.eq(r.healed, 0, 'רופא משהו במסד ריק');
    }
  }
});


SPECS.push({
  file: 't09-b65-width',
  title: 'B65 — מד הרוחב שפותח את BLD-05',
  needs: 'ui',
  requires: ['b65MeasureNow', 'b65RecordWidth', 'b65WidthSummary', 'B65_WMAP',
             'B65_WIDE', 'B65_WKEY', 'b61Tests', 'b61Text', 'b61Run', 'render', 'go', 'navMode'],

  tests: {

    'ששת המסכים הרחבים של ACT-05 הם הרשימה': (t, { w }) => {
      ['items', 'orders', 'finance', 'payroll', 'audit', 'reports']
        .forEach(v => t.ok(w.B65_WIDE.indexOf(v) > -1, 'מסך רחב חסר מרשימת המדידה: ' + v));
      t.eq(w.B65_WIDE.length, 6, 'רשימת המסכים הרחבים שינתה גודל');
    },

    '⛔ המדידה מחזירה null כשאין פריסה — ואינה קורסת': (t, { w, srv, H }) => {
      /* ב-jsdom clientWidth הוא 0. המדידה חייבת לצאת בשקט ולא להפיל
         את render, אחרת כל המערכת מפסיקה להיצבע בסביבת הבדיקה. */
      H.login(w, 'מנהל', srv);
      t.eq(w.b65MeasureNow(), null, 'המדידה החזירה ערך למרות שאין פריסה');
      w.b65RecordWidth();
      w.go('orders');
      t.eq(w.VIEW, 'orders', 'render נשבר בגלל המדידה');
    },

    '⭐ הסיכום מוצא את המקסימום ואת המסך שדרש אותו': (t, { w }) => {
      Object.keys(w.B65_WMAP).forEach(k => { delete w.B65_WMAP[k]; });
      w.B65_WMAP.orders  = { need: 1180, win: 1512, mode: 'side', rail: 206, over: 0 };
      w.B65_WMAP.payroll = { need: 1340, win: 1512, mode: 'side', rail: 206, over: 0 };
      w.B65_WMAP.audit   = { need: 990,  win: 1512, mode: 'side', rail: 206, over: 0 };
      const sm = w.b65WidthSummary();
      t.eq(sm.max, 1340, 'המקסימום חושב שגוי');
      t.eq(sm.maxView, 'payroll', 'המסך הרחב ביותר זוהה שגוי');
      t.eq(sm.wideSeen, 3, 'ספירת המסכים הרחבים שנמדדו שגויה');
      t.eq(sm.missing.length, 3, 'רשימת המסכים החסרים שגויה');
    },

    '⭐⭐ הטענה של BLD-05 נכשלת כל עוד לא נמדדו כל ששת המסכים': (t, { w, srv, H }) => {
      /* זו הנקודה: מספר חלקי גרוע ממספר חסר, כי הוא נראה כמו תשובה.
         כל עוד חסר מסך אחד — הבדיקה אדומה ואבי רואה בדיוק מה חסר. */
      H.login(w, 'מנהל', srv);
      Object.keys(w.B65_WMAP).forEach(k => { delete w.B65_WMAP[k]; });
      /* ⚠ מלכודת: גם הטענה הישנה (ACT-05 · BLD-05) מכילה 'BLD-05'.
         הבורר חייב להיות ייחודי לטענה החדשה, אחרת נבדקת הישנה. */
      const find = () => w.b61Tests().filter(x => x.n.indexOf('רוחב מרבי') > -1)[0];
      const test = find();
      t.ok(!!test, 'הטענה של BLD-05 אינה קיימת בכרטיס הבדיקה העצמית');
      t.no(test.f().ok, 'הטענה עברה למרות שלא נמדד שום מסך');

      w.B65_WIDE.forEach(v => { w.B65_WMAP[v] = { need: 1100, win: 1512, mode: 'side', rail: 206, over: 0 }; });
      const full = find().f();
      t.ok(full.ok, 'הטענה נכשלה למרות שכל ששת המסכים נמדדו');
      t.has(full.note, '1100', 'המספר המכריע אינו מופיע בטענה');
    },

    '⭐⭐ בלוק ההעתקה כולל את המספר גם כשהכל עבר': (t, { w, srv, H }) => {
      /* התקלה שחסמה את BLD-05 ארבע פעמים: b61Text העתיק **רק כשלים**,
         ולכן כשהפריסה נכנסה — והיא נכנסה — המספר לא הגיע לצ'אט מעולם. */
      H.login(w, 'מנהל', srv);
      Object.keys(w.B65_WMAP).forEach(k => { delete w.B65_WMAP[k]; });
      w.B65_WIDE.forEach(v => { w.B65_WMAP[v] = { need: 1210, win: 1512, mode: 'side', rail: 206, over: 0 }; });
      w.B61_RES = { at: new Date(), pass: 20, fail: 0, rows: [],
                    env: { canary: w.B61_CANARY, browser: 'x', os: 'y', vw: 1512, vh: 900, dpr: 2, touch: false, mode: 'side', tz: 'Asia/Jerusalem', role: 'מנהל' } };
      const txt = w.b61Text();
      t.has(txt, 'BLD-05', 'מקטע הרוחב חסר מבלוק ההעתקה');
      t.has(txt, '1210', 'המספר המכריע אינו מועתק כשאין כשלים');
      t.has(txt, 'payroll', 'פירוט המסכים אינו מועתק');
    },

    'מסכים שטרם נמדדו מסומנים בבלוק ההעתקה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      Object.keys(w.B65_WMAP).forEach(k => { delete w.B65_WMAP[k]; });
      w.B65_WMAP.orders = { need: 1000, win: 1512, mode: 'side', rail: 206, over: 0 };
      w.B61_RES = { at: new Date(), pass: 20, fail: 0, rows: [],
                    env: { canary: w.B61_CANARY, browser: 'x', os: 'y', vw: 1512, vh: 900, dpr: 2, touch: false, mode: 'side', tz: 'Asia/Jerusalem', role: 'מנהל' } };
      t.has(w.b61Text(), 'טרם נמדדו', 'הבלוק אינו מציין אילו מסכים חסרים');
    },

    '⛔ הטענה הישנה על המסך הנוכחי לא הוסרה (t05)': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const names = w.b61Tests().map(x => x.n).join(' | ');
      t.has(names, 'המסך הנוכחי אינו גולש לרוחב', 'הטענה של ACT-05 הוסרה מהכרטיס');
      t.has(names, 'רוחב מרבי בכל המסכים', 'הטענה החדשה של BLD-05 לא נוספה');
    },

    '⛔ אין history.back/go במנגנון המדידה': (t, { H }) => {
      const src = H.stripComments(H.indexSrc());
      const seg = src.slice(src.indexOf('function b65MeasureNow'), src.indexOf('function b61Browser'));
      t.hasNot(seg, 'history.back', 'history.back חדר למנגנון המדידה');
      t.hasNot(seg, 'history.go', 'history.go חדר למנגנון המדידה');
    },

    '⛔ המדידה אינה שולחת בקשת שרת': (t, { H }) => {
      const src = H.stripComments(H.indexSrc());
      const seg = src.slice(src.indexOf('function b65MeasureNow'), src.indexOf('function b61Browser'));
      t.hasNot(seg, 'api(', 'המדידה קוראת לשרת — היא חייבת להיות מקומית לחלוטין (R10)');
      t.hasNot(seg, 'act(', 'המדידה קוראת לפעולת שרת');
    }
  }
});


SPECS.push({
  file: 't10-b66-server',
  title: 'B66 — שורות אומדן · סגירת הזמנת כביסה · קיוסק רב-טאבלטי',
  needs: 'server',
  requires: ['approveOrder', 'ORDER_TYPES', 'sVal', 'sPick',
             'b56CloseLaundryOrder', 'b56IntakeOpen', 'B56_CLOSED_INTAKE',
             'NOBLE_STAGES', 'NOBLE_MACHINE_STAGES', 'B5_OPEN_STATUSES',
             'b52Devices', 'b52NextDeviceN', 'b52VerifyKioskToken', 'b52DeviceKey',
             'b52RegisterDevice', 'b52RevokeDevice', 'B52_TOKEN_KEY', 'B52_DEV_PREFIX',
             'B52_MAX_DEVICES', 'B52_NAME_MAX', 'B52_KIOSK_ACTIONS', 'READ_ONLY_ACTIONS',
             'b54RawOrderTotalAg', 'sha256Hex', 'PropertiesService'],

  tests: {

    /* ---------- BLD-15 — שורות בהזמנת כביסה הן אומדן ולא חובה ---------- */

    '⭐ BLD-15 — הזמנת כביסה בלי שורות מאושרת': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'טיוטה' }];
      const r = srv.approveOrder(db, 'O1');
      t.ok(r.ok, 'הזמנת כביסה בלי שורות נחסמה: ' + (r.error || ''));
      t.eq(db.orders[0].status, 'מאושרת', 'הסטטוס לא עבר למאושרת');
    },

    '⛔ הזמנת השכרה בלי שורות נשארת חסומה': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.orders = [{ id: 'O1', type: 'השכרה', customer_id: 'C1', status: 'טיוטה' }];
      const r = srv.approveOrder(db, 'O1');
      t.no(r.ok, 'הזמנת השכרה בלי שורות אושרה — שם השורות הן הכסף');
      t.has(r.error, 'אין פריטים', 'הודעת השגיאה של השכרה השתנתה');
      t.eq(db.orders[0].status, 'טיוטה', 'הסטטוס השתנה למרות הכישלון');
    },

    '⭐⭐ B64a — סוג עם רווח קשיח ותו כיווניות עדיין נתפס ככביסה': (t, { srv, H }) => {
      /* בדיוק הכשל השקט של B64a: השוואה מדויקת הייתה מחזירה "השכרה בלי שורות"
         והמשתמש היה נחסם בלי להבין למה. */
      ['כביסה ', ' כביסה', 'כביסה\u00A0', '\u200Fכביסה\u200E'].forEach(ty => {
        const db = H.emptyDb(srv);
        db.orders = [{ id: 'O1', type: ty, customer_id: 'C1', status: 'טיוטה' }];
        const r = srv.approveOrder(db, 'O1');
        t.ok(r.ok, 'סוג ' + JSON.stringify(ty) + ' לא נתפס ככביסה: ' + (r.error || ''));
      });
    },

    '⛔ סוג לא מוכר או ריק — שורות עדיין נדרשות (ברירת המחדל המחמירה)': (t, { srv, H }) => {
      ['', 'משהו אחר', null, undefined].forEach(ty => {
        const db = H.emptyDb(srv);
        db.orders = [{ id: 'O1', type: ty, customer_id: 'C1', status: 'טיוטה' }];
        const r = srv.approveOrder(db, 'O1');
        t.no(r.ok, 'סוג ' + JSON.stringify(ty) + ' קיבל את הפטור של כביסה');
      });
    },

    '⛔ בדיקת המלאי בהשכרה לא נפגעה — ורצה גם כשהסוג עם רווח': (t, { srv, H }) => {
      ['השכרה', 'השכרה ', '\u00A0השכרה'].forEach(ty => {
        const db = H.emptyDb(srv);
        db.orders = [{ id: 'O1', type: ty, customer_id: 'C1', status: 'טיוטה',
                       start_date: '2026-09-01', end_date: '2026-09-03' }];
        db.orderLines = [{ id: 'L1', order_id: 'O1', item_id: 'I1', qty: 5, unit_price: 10 }];
        db.items = [{ id: 'I1', name: 'מפה לבנה', qty: 2, type: 'השכרה' }];
        const r = srv.approveOrder(db, 'O1');
        t.no(r.ok, 'סוג ' + JSON.stringify(ty) + ' דילג על בדיקת המלאי — כשל B64a');
        t.has(r.error, 'אין מספיק מלאי', 'הודעת המלאי השתנתה');
      });
    },

    '⛔ הזמנת כביסה אינה עוברת בדיקת מלאי גם כשיש לה שורות אומדן': (t, { srv, H }) => {
      /* השורות בכביסה אינן שריון — availableQty פטור נכון (type==='השכרה' בלבד). */
      const db = H.emptyDb(srv);
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'טיוטה',
                     start_date: '2026-09-01', end_date: '2026-09-03' }];
      db.orderLines = [{ id: 'L1', order_id: 'O1', item_id: 'I1', qty: 999, unit_price: 0 }];
      db.items = [{ id: 'I1', name: 'מגבת', qty: 1, type: 'השכרה' }];
      const r = srv.approveOrder(db, 'O1');
      t.ok(r.ok, 'אומדן כמותי בכביסה נחסם על מלאי: ' + (r.error || ''));
    },

    '⛔ שאר החסימות של approveOrder לא נגעו': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'מאושרת' }];
      t.no(srv.approveOrder(db, 'O1').ok, 'הזמנה שאינה טיוטה אושרה שוב');
      t.no(srv.approveOrder(db, 'NOPE').ok, 'הזמנה שאינה קיימת אושרה');

      const db2 = H.emptyDb(srv);
      db2.orders = [{ id: 'O2', type: 'כביסה', customer_id: 'C1', status: 'טיוטה',
                      payment_status: 'ממתין לתשלום' }];
      const r2 = srv.approveOrder(db2, 'O2');
      t.no(r2.ok, 'B2/D2 — הזמנה שטרם עברה תשלום אושרה. BLD-15 פתח פרצה');
      t.has(r2.error, 'תשלום', 'הודעת חסימת התשלום השתנתה');
    },

    '⭐ החשבונית עוברת: כביסה בלי שורות עם קליטה ששוקלה מייצרת סכום': (t, { srv, H }) => {
      /* C8 — b54RawOrderTotalAg סופר את חיוב הקליטה, ולכן sub > 0 בלי אף שורה. */
      const db = H.emptyDb(srv);
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'מאושרת' }];
      db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', customer_id: 'C1', internal: '',
                             status: 'נמסר', total_charge: 120, net_weight_kg: 10, price_per_kg: 12 }];
      t.ok(typeof srv.b54RawOrderTotalAg === 'function', 'b54RawOrderTotalAg נעלמה');
      t.ok(srv.b54RawOrderTotalAg(db, db.orders[0]) > 0,
        'הזמנת כביסה בלי שורות יצאה בסכום אפס — החשבונית תיחסם');
    },

    /* ---------- #2 — הזמנת כביסה לא נסגרת בזמן שהכביסה במכונה ---------- */

    '⭐⭐ באג הייצור: הזמנה עם קליטה בכל אחד משלבי העבודה אינה נסגרת': (t, { srv, H }) => {
      srv.NOBLE_STAGES.filter(s => s !== 'נמסר').forEach(stage => {
        const db = H.emptyDb(srv);
        db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'סופקה' }];
        db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: stage }];
        t.no(srv.b56CloseLaundryOrder(db, db.orders[0]),
          'הזמנה נסגרה בזמן שהקליטה בסטטוס ' + stage);
        t.eq(db.orders[0].status, 'סופקה', 'הסטטוס שונה למרות שהקליטה פתוחה (' + stage + ')');
      });
    },

    '⛔ ארבעת שלבי המכונה — אלה שהרשימה הישנה החסירה': (t, { srv, H }) => {
      srv.NOBLE_MACHINE_STAGES.forEach(stage => {
        const db = H.emptyDb(srv);
        db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'סופקה' }];
        db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: stage }];
        t.no(srv.b56CloseLaundryOrder(db, db.orders[0]),
          'שלב המכונה ' + stage + ' לא נחשב "קליטה פתוחה" — זה הבאג המקורי');
      });
    },

    '⭐ הבדיקה המחייבת: שתי קליטות, אחת בייבוש ואחת נמסרה — לא נסגרת': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'סופקה' }];
      db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: 'בייבוש' },
                           { id: 'IK2', order_id: 'O1', status: 'נמסר' }];
      t.no(srv.b56CloseLaundryOrder(db, db.orders[0]),
        'ההזמנה נסגרה על הקליטה שנמסרה בזמן שהשנייה במייבש');
      t.eq(db.orders[0].status, 'סופקה', 'הסטטוס עבר להושלמה');
    },

    '⭐ כשכל הקליטות נמסרו ואין רגל פתוחה — ההזמנה כן נסגרת': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'סופקה' }];
      db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: 'נמסר' },
                           { id: 'IK2', order_id: 'O1', status: 'נמסר' }];
      t.ok(srv.b56CloseLaundryOrder(db, db.orders[0]), 'הזמנה שהסתיימה במלואה לא נסגרה');
      t.eq(db.orders[0].status, 'הושלמה', 'הסטטוס לא עבר להושלמה');
    },

    '⛔ B64a — סטטוס נמסר עם רווח קשיח נספר כסגור': (t, { srv, H }) => {
      ['נמסר ', ' נמסר', 'נמסר\u00A0', '\u200Eנמסר'].forEach(st => {
        const db = H.emptyDb(srv);
        db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'סופקה' }];
        db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: st }];
        t.ok(srv.b56CloseLaundryOrder(db, db.orders[0]),
          'סטטוס ' + JSON.stringify(st) + ' לא זוהה כ"נמסר" — ההזמנה תישאר פתוחה לנצח');
      });
    },

    '⛔ B64a — סוג הזמנה עם רווח נתפס גם כאן (שורש BLD-01)': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.orders = [{ id: 'O1', type: ' כביסה ', customer_id: 'C1', status: 'סופקה' }];
      db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: 'נמסר' }];
      t.ok(srv.b56CloseLaundryOrder(db, db.orders[0]),
        'הזמנת כביסה עם רווח בסוג לא נסגרה — זה בדיוק מה שיצר את BLD-01');
    },

    '⛔ הזמנת השכרה לעולם לא נסגרת במסלול הזה': (t, { srv, H }) => {
      ['השכרה', ' השכרה '].forEach(ty => {
        const db = H.emptyDb(srv);
        db.orders = [{ id: 'O1', type: ty, customer_id: 'C1', status: 'סופקה' }];
        db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: 'נמסר' }];
        t.no(srv.b56CloseLaundryOrder(db, db.orders[0]), 'הזמנת השכרה נסגרה במסלול הכביסה');
      });
    },

    '⛔ רגל משלוח פתוחה עדיין מונעת סגירה': (t, { srv, H }) => {
      const db = H.emptyDb(srv);
      db.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'סופקה' }];
      db.laundryIntakes = [{ id: 'IK1', order_id: 'O1', status: 'נמסר' }];
      db.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'אספקה', status: 'מתוכנן' }];
      t.no(srv.b56CloseLaundryOrder(db, db.orders[0]), 'ההזמנה נסגרה עם נסיעה פתוחה');
    },

    '⛔ ההגדרה היא ערך אחד ולא רשימה — כדי שלא תתיישן שוב': (t, { srv }) => {
      t.eq(srv.B56_CLOSED_INTAKE, 'נמסר', 'ערך הסגירה השתנה');
      t.eq(typeof srv.b56IntakeOpen, 'function', 'b56IntakeOpen נעלמה');
      t.no(srv.b56IntakeOpen({ status: 'נמסר' }), 'נמסר סווג כפתוח');
      t.ok(srv.b56IntakeOpen({ status: 'התקבל' }), 'התקבל סווג כסגור');
      t.ok(srv.b56IntakeOpen({}), 'קליטה בלי סטטוס סווגה כסגורה — הכיוון המסוכן');
      t.ok(srv.b56IntakeOpen(null), 'קליטה ריקה סווגה כסגורה');
    },

    /* ---------- BLD-03 — קיוסק לשני טאבלטים ומעלה ---------- */

    '⭐⭐ שני רישומים = שני מכשירים, ושניהם מאמתים': (t, { srv }) => {
      const P = srv.PropertiesService.getScriptProperties();
      Object.keys(P.getProperties()).forEach(k => P.deleteProperty(k));
      const r1 = srv.b52RegisterDevice('כניסה ראשית');
      const r2 = srv.b52RegisterDevice('מחסן');
      t.ok(r1.ok && r2.ok, 'רישום נכשל');
      t.ne(r1.kiosk_token, r2.kiosk_token, 'שני הטאבלטים קיבלו את אותו טוקן');
      t.eq(srv.b52Devices().length, 2, 'הרישום השני דרס את הראשון — זה הבאג של BLD-03');
      t.ok(!!srv.b52VerifyKioskToken(r1.kiosk_token), 'הטאבלט הראשון הפסיק לאמת');
      t.ok(!!srv.b52VerifyKioskToken(r2.kiosk_token), 'הטאבלט השני אינו מאמת');
      t.ne(srv.b52DeviceKey(srv.b52VerifyKioskToken(r1.kiosk_token)),
           srv.b52DeviceKey(srv.b52VerifyKioskToken(r2.kiosk_token)),
           'שני המכשירים חולקים מזהה להגבלת קצב — נעילה של אחד תנעל את השני');
    },

    '⛔ R4 — הרישום הישן (מפתח יחיד) ממשיך לעבוד בלי רישום מחדש': (t, { srv }) => {
      const P = srv.PropertiesService.getScriptProperties();
      Object.keys(P.getProperties()).forEach(k => P.deleteProperty(k));
      const oldTok = 'TOKEN-OF-EXISTING-TABLET';
      P.setProperty(srv.B52_TOKEN_KEY, srv.sha256Hex(oldTok));
      t.ok(!!srv.b52VerifyKioskToken(oldTok), 'הטאבלט שכבר רשום אצל אבי הפסיק להחתים');
      const devs = srv.b52Devices();
      t.eq(devs.length, 1, 'הרישום הישן לא נספר');
      t.eq(devs[0].n, 0, 'הרישום הישן לא קיבל מספר 0');
      const r = srv.b52RegisterDevice('טאבלט שני');
      t.ok(r.ok, 'רישום נוסף נכשל');
      t.ok(!!srv.b52VerifyKioskToken(oldTok), 'רישום חדש דרס את המכשיר הישן');
      t.eq(srv.b52Devices().length, 2, 'שני המכשירים לא מופיעים יחד');
    },

    '⛔ ביטול מכשיר אחד אינו נוגע באחרים': (t, { srv }) => {
      const P = srv.PropertiesService.getScriptProperties();
      Object.keys(P.getProperties()).forEach(k => P.deleteProperty(k));
      const a = srv.b52RegisterDevice('א');
      const b = srv.b52RegisterDevice('ב');
      const rv = srv.b52RevokeDevice(a.device_n);
      t.ok(rv.ok, 'הביטול נכשל');
      t.eq(srv.b52VerifyKioskToken(a.kiosk_token), '', 'טוקן שבוטל עדיין מאמת');
      t.ok(!!srv.b52VerifyKioskToken(b.kiosk_token), 'ביטול של אחד הפיל את השני');
      t.eq(srv.b52Devices().length, 1, 'מספר המכשירים אחרי ביטול שגוי');
    },

    '⛔ ביטול בלי מזהה מכשיר אינו מוחק כלום': (t, { srv }) => {
      const P = srv.PropertiesService.getScriptProperties();
      Object.keys(P.getProperties()).forEach(k => P.deleteProperty(k));
      srv.b52RegisterDevice('א');
      srv.b52RegisterDevice('ב');
      const rv = srv.b52RevokeDevice(undefined);
      t.no(rv.ok, 'ביטול בלי מזהה הצליח — ביטול גורף היה מוריד את כל המתחם');
      t.eq(srv.b52Devices().length, 2, 'מכשירים נמחקו בביטול בלי מזהה');
      const rv2 = srv.b52RevokeDevice(99);
      t.no(rv2.ok, 'ביטול של מכשיר שאינו קיים החזיר הצלחה');
    },

    '⛔ תקרת המכשירים נאכפת, וההודעה מסבירה מה לעשות': (t, { srv }) => {
      const P = srv.PropertiesService.getScriptProperties();
      Object.keys(P.getProperties()).forEach(k => P.deleteProperty(k));
      for (let i = 0; i < srv.B52_MAX_DEVICES; i++)
        t.ok(srv.b52RegisterDevice('ט' + i).ok, 'רישום ' + i + ' נכשל');
      const over = srv.b52RegisterDevice('אחד יותר מדי');
      t.no(over.ok, 'נרשם מכשיר מעבר לתקרה');
      t.has(over.error, 'בטל רישום', 'ההודעה אינה אומרת מה לעשות');
      t.eq(srv.b52Devices().length, srv.B52_MAX_DEVICES, 'מספר המכשירים חרג מהתקרה');
    },

    '⛔ מספר מכשיר מתפנה ונעשה בו שימוש חוזר': (t, { srv }) => {
      const P = srv.PropertiesService.getScriptProperties();
      Object.keys(P.getProperties()).forEach(k => P.deleteProperty(k));
      const a = srv.b52RegisterDevice('א');
      const b = srv.b52RegisterDevice('ב');
      t.eq(a.device_n, 1, 'המכשיר הראשון לא קיבל מספר 1');
      t.eq(b.device_n, 2, 'המכשיר השני לא קיבל מספר 2');
      srv.b52RevokeDevice(1);
      const c = srv.b52RegisterDevice('ג');
      t.eq(c.device_n, 1, 'המספר שהתפנה לא נוצל');
      t.ok(!!srv.b52VerifyKioskToken(b.kiosk_token), 'המכשיר השני נפגע');
    },

    '⛔⛔ hash לעולם לא יוצא ללקוח': (t, { srv, H }) => {
      const P = srv.PropertiesService.getScriptProperties();
      Object.keys(P.getProperties()).forEach(k => P.deleteProperty(k));
      const r1 = srv.b52RegisterDevice('כניסה');
      const devs = srv.b52Devices();
      t.eq(devs.length, 1, 'רשימת המכשירים לא נבנתה');
      t.eq(devs[0].name, 'כניסה', 'השם הידידותי לא נשמר');
      /* זו בדיוק השורה ש-b52KioskStatus מחזירה ללקוח. אם מישהו יוסיף כאן
         שדה נוסף, ה-hash ידלוף — ולכן הבדיקה על הצורה הזו ולא על route. */
      const wire = devs.map(d => ({ n: d.n, name: d.name, created: d.created, legacy: d.n === 0 ? 1 : 0 }));
      const blob = JSON.stringify(wire);
      t.hasNot(blob, srv.sha256Hex(r1.kiosk_token), 'ה-hash של הטוקן דלף ללקוח');
      t.hasNot(blob, r1.kiosk_token, 'הטוקן עצמו דלף בסטטוס');
      t.ok(devs[0].hash && devs[0].hash.length > 0, 'b52Devices הפסיקה להחזיר hash לשימוש פנימי');
      /* השומר האמיתי: הקוד שמרכיב את התשובה חייב למפות ולא להחזיר את המערך כמו שהוא. */
      const src = H.stripComments(H.serverSrc());
      t.has(src, 'devices: devKS.map(', 'b52KioskStatus מחזיר את מערך המכשירים כפי שהוא — ה-hash ידלוף');
    },

    '⛔ שם ארוך נקצץ, שם ריק מקבל ברירת מחדל, והשם עובר sVal': (t, { srv }) => {
      const P = srv.PropertiesService.getScriptProperties();
      Object.keys(P.getProperties()).forEach(k => P.deleteProperty(k));
      const long = srv.b52RegisterDevice('ב'.repeat(80));
      t.eq(long.device_name.length, srv.B52_NAME_MAX, 'השם לא נקצץ לאורך המרבי');
      const blank = srv.b52RegisterDevice('   ');
      t.eq(blank.device_name, 'טאבלט ' + blank.device_n, 'שם ריק לא קיבל ברירת מחדל');
      const spaced = srv.b52RegisterDevice(' מחסן\u00A0צפון ');
      t.eq(spaced.device_name, 'מחסן צפון', 'השם לא עבר sVal');
    },

    '⛔ טוקן ריק או שגוי אינו מאמת, ורשומה פגומה אינה מפילה את הרשימה': (t, { srv }) => {
      const P = srv.PropertiesService.getScriptProperties();
      Object.keys(P.getProperties()).forEach(k => P.deleteProperty(k));
      t.eq(srv.b52VerifyKioskToken(''), '', 'טוקן ריק אומת');
      t.eq(srv.b52VerifyKioskToken(null), '', 'טוקן null אומת');
      t.eq(srv.b52VerifyKioskToken('לא-קיים'), '', 'טוקן שגוי אומת');
      P.setProperty(srv.B52_DEV_PREFIX + '3', 'זה לא JSON');
      P.setProperty(srv.B52_DEV_PREFIX + 'לא-מספר', '{"h":"x"}');
      const good = srv.b52RegisterDevice('תקין');
      t.ok(!!srv.b52VerifyKioskToken(good.kiosk_token), 'רשומה פגומה מנעה אימות של מכשיר תקין');
      t.eq(srv.b52Devices().length, 1, 'רשומה פגומה נספרה כמכשיר');
    },

    '⛔ B52_KIOSK_ACTIONS לא נפתחה — הרשימה הסגורה נשארה סגורה (R4/R8)': (t, { srv }) => {
      t.eq(srv.B52_KIOSK_ACTIONS.length, 2, 'מספר פעולות הקיוסק השתנה');
      t.ok(srv.B52_KIOSK_ACTIONS.indexOf('b52KioskClock') > -1, 'b52KioskClock הוסרה');
      t.ok(srv.B52_KIOSK_ACTIONS.indexOf('checkVersion') > -1, 'checkVersion הוסרה');
      ['b52RegisterKiosk', 'b52RevokeKiosk', 'b52KioskStatus'].forEach(a => {
        t.eq(srv.B52_KIOSK_ACTIONS.indexOf(a), -1,
          a + ' נפתחה למי שמחזיק בטוקן מכשיר — פרצת אבטחה');
      });
    },

    '⛔ אף פעולת קיוסק חדשה לא נכנסה ל-READ_ONLY_ACTIONS': (t, { srv }) => {
      ['b52RegisterKiosk', 'b52RevokeKiosk'].forEach(a => {
        t.eq(srv.READ_ONLY_ACTIONS.indexOf(a), -1, a + ' כותבת ל-ScriptProperties ואסור לה להיות READ_ONLY');
      });
      t.ok(srv.READ_ONLY_ACTIONS.indexOf('b52KioskStatus') > -1, 'b52KioskStatus הוצאה מ-READ_ONLY_ACTIONS');
    }
  }
});


SPECS.push({
  file: 't10-b66-ui',
  title: 'B66 — הממשק: שפת האומדן ופאנל הטאבלטים',
  needs: 'ui',
  requires: ['openOrder', 'createOrder', 'b65OrderTypeVal', 'B65_TYPES', 'sVal',
             'b52KioskPanelHtml', 'b52LoadKioskStatus', 'b52RegisterKiosk',
             'b52RevokeKiosk', 'B61_CANARY', 'go'],

  tests: {

    '⛔⛔ רשימת סוגי ההזמנה זהה בממשק ובשרת': (t, { w, srv }) => {
      /* אם השתיים מתפצלות, השרת יפטור סוג שהממשק לא יודע ליצור — או להפך.
         אותה משפחת כשלים של sVal/sPick ב-B64a. */
      t.eq(JSON.stringify(w.B65_TYPES), JSON.stringify(srv.ORDER_TYPES),
        'B65_TYPES בממשק ו-ORDER_TYPES בשרת התפצלו');
    },

    '⭐ כרטיס הזמנת כביסה אומר במפורש שהשורות אינן חובה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'טיוטה',
                       start_date: '2026-09-01', end_date: '2026-09-03' }];
      w.openOrder('O1');
      const html = w.el('modal').innerHTML;
      t.has(html, 'אומדן כמותי (לא חובה)', 'הכותרת אינה אומרת שהשורות אינן חובה');
      t.has(html, 'אפשר לאשר הזמנת כביסה גם בלי אף שורה', 'ההסבר על אישור בלי שורות חסר');
      t.has(html, '+ הוסף פריט', '⛔ מקטע הפריטים הוסתר — אבי ביקש שיישאר אפשרי');
      w.closeModal();
    },

    '⛔ כרטיס הזמנת השכרה לא קיבל את שפת האומדן': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.orders = [{ id: 'O1', type: 'השכרה', customer_id: 'C1', status: 'טיוטה',
                       start_date: '2026-09-01', end_date: '2026-09-03' }];
      w.openOrder('O1');
      const html = w.el('modal').innerHTML;
      t.hasNot(html, 'אומדן כמותי (לא חובה)', 'הזמנת השכרה קיבלה שפת אומדן');
      t.hasNot(html, 'מחיר (אומדן)', 'עמודת המחיר בהשכרה סומנה כאומדן');
      w.closeModal();
    },

    '⛔ B64a — סוג עם רווח מקבל את אותה תווית בדיוק כמו בשרת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.orders = [{ id: 'O1', type: ' כביסה\u00A0', customer_id: 'C1', status: 'טיוטה',
                       start_date: '2026-09-01', end_date: '2026-09-03' }];
      w.openOrder('O1');
      t.has(w.el('modal').innerHTML, 'אומדן כמותי (לא חובה)',
        'סוג עם רווח קיבל שפת השכרה בזמן שהשרת מאשר אותו כביסה — אי-אחידות');
      w.closeModal();
    },

    '⛔ ההודעה אחרי שמירת הזמנה אינה דורשת פריטים בכביסה': (t, { w, H }) => {
      const src = H.stripComments(H.uiScript());
      t.has(src, 'אפשר להוסיף אומדן כמותי (לא חובה)', 'הודעת הכביסה לא נוספה');
      t.has(src, "'נשמר — הוסף פריטים'", 'הודעת ההשכרה נמחקה במקום להישאר לצד הודעת הכביסה');
      t.has(src, 'act(\'create\',{table:\'orders\'', 'עוגן createOrder השתנה');
      t.has(src, '}},b66Msg)', 'ההודעה עדיין קבועה ואינה נגזרת מהסוג');
    },

    '⭐ פאנל הקיוסק מציג רשימת טאבלטים ומאפשר רישום נוסף': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const html = w.b52KioskPanelHtml();
      t.has(html, 'b52KDevs', 'אין מקום לרשימת הטאבלטים');
      t.has(html, 'b52KName', 'אין שדה שם לטאבלט');
      t.has(html, 'רישום טאבלט נוסף', 'הכפתור עדיין מדבר על רישום יחיד');
      t.hasNot(html, 'רישום חדש מבטל את הקודם', 'הטקסט עדיין מבטיח דריסה');
      t.has(html, 'אינו</b> מבטל את הקודמים', 'הטקסט אינו מבהיר שרישום מוסיף');
    },

    '⛔ הפאנל נשאר למנהל בלבד': (t, { w, srv, H }) => {
      ['משרד', 'מכבסה', 'נהג', 'עובד רצפה'].forEach(role => {
        H.login(w, role, srv);
        t.eq(w.b52KioskPanelHtml(), '', 'פאנל הקיוסק נחשף לתפקיד ' + role);
      });
    },

    '⛔ ביטול רישום דורש מזהה מכשיר — אין כפתור שמבטל את כולם': (t, { w, H }) => {
      const src = H.stripComments(H.uiScript());
      t.has(src, 'async function b52RevokeKiosk(n)', 'הביטול אינו פר-מכשיר');
      t.hasNot(src, 'b52RevBtn', 'כפתור הביטול הגורף לא הוסר');
      t.has(src, "device_n: n", 'הביטול אינו שולח מזהה מכשיר');
    },

    '⛔ שם טאבלט עם גרש או מרכאה אינו שובר את כפתור הביטול': (t, { w, srv, H }) => {
      /* esc() מגן על '<' בלבד. שם עם גרש בתוך onclick היה מנתק את הכפתור
         בשקט — בדיוק מחלקת הכשלים ה"שקטים" של B64a, רק ב-HTML. */
      H.login(w, 'מנהל', srv);
      w.el('modal').innerHTML = '<div id="b52KDevs"></div><div id="b52KState"></div>';
      w.B52_DEVS = [];
      const devs = [{ n: 1, name: "כניסה 'ראשית'", created: '', legacy: 0 },
                    { n: 2, name: 'מחסן "צפון"', created: '', legacy: 0 }];
      const box = w.el('b52KDevs');
      box.innerHTML = devs.map(function (d) {
        return '<button class="btn ghost sm" onclick="b52RevokeKiosk(' + Number(d.n) + ')">ביטול רישום</button>';
      }).join('');
      const btns = box.querySelectorAll('button');
      t.eq(btns.length, 2, 'לא נוצרו שני כפתורי ביטול');
      t.eq(btns[0].getAttribute('onclick'), 'b52RevokeKiosk(1)', 'הגרש בשם דלף לתוך onclick');
      t.eq(btns[1].getAttribute('onclick'), 'b52RevokeKiosk(2)', 'המרכאות בשם דלפו לתוך onclick');
      const src = H.stripComments(H.uiScript());
      t.hasNot(src, "onclick=\"b52RevokeKiosk('+Number(d.n)+',", 'השם חזר לתוך onclick');
      w.closeModal();
    },

    '⛔ R4 — מנגנוני B52 ו-B65 לא נפגעו': (t, { w }) => {
      ['b52CopyKioskLink', 'kioskApi', 'kioskAutoRefresh', 'kioskClockScreen',
       'b65ApplyType', 'b65OrderTypeVal', 'b65LegLabel', 'b65WidthSummary',
       'b65MeasureNow', 'b65RecordWidth', 'sVal', 'sPick'].forEach(n => {
        t.ok(typeof w[n] === 'function' || w[n] !== undefined, 'נעלם מנגנון חסין: ' + n);
      });
      t.eq(w.KIOSK.mode, 'clock', 'מצב הקיוסק ההתחלתי השתנה');
    }
  }
});


/* ==================== t11 — B67 / BLD-16: חוב שכר ברמת העובד ====================
   ⚠ זו אצווה שנוגעת בכסף שיוצא בפועל. כל בדיקה כאן מגינה על באג כספי אמיתי. */

SPECS.push({
  file: 't11-b67-srv',
  title: 'B67 — השרת: הקצאת תשלום לחוב הישן ביותר',
  needs: 'server',
  requires: ['b67PayOneRow', 'b67PayEmployee', 'b67EmployeeOpenRows', 'b67EmployeeDebt',
             'b67FlushWrites', 'writeTable', 'payrollPaidSum', 'syncFutureExpenseForPayroll',
             'cashBalanceSrv', 'handle', 'MANAGER_ONLY', 'READ_ONLY_ACTIONS', 'sVal'],

  tests: {

    '⭐ הדוגמה של אבי: 10,000 יולי + 20,000 אוגוסט · תשלום 5,000': (t, { srv, H }) => {
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני');
      B67.pr(db, 'P7', 'E1', '2026-07', 10000, 'אושר');
      B67.pr(db, 'P8', 'E1', '2026-08', 20000, 'אושר');
      const r = srv.b67PayEmployee(db, { employee_id: 'E1', amount: 5000, method: 'העברה' }, 'מנהל');
      t.ok(r.ok, 'התשלום נדחה: ' + r.error);
      t.eq(r.allocations.length, 1, 'התשלום פוצל ליותר מחודש אחד');
      t.eq(r.allocations[0].month, '2026-07', 'התשלום לא נכנס לחוב הישן ביותר');
      t.eq(r.allocations[0].amount, 5000, 'סכום ההקצאה שגוי');
      t.eq(srv.b67EmployeeDebt(db, 'E1'), 25000, 'סך החוב אחרי התשלום שגוי');
      t.eq(Math.round((10000 - srv.payrollPaidSum(db, 'P7')) * 100) / 100, 5000, 'יולי לא ירד ל-5,000');
      t.eq(srv.payrollPaidSum(db, 'P8'), 0, 'אוגוסט נגע — אסור, הוא החדש יותר');
      t.eq(srv.sVal(db.payroll.find(x => x.id === 'P8').status), 'אושר', 'סטטוס אוגוסט השתנה');
    },

    'תשלום שגולש חודש — יולי נסגר והעודף לאוגוסט': (t, { srv }) => {
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני');
      B67.pr(db, 'P7', 'E1', '2026-07', 10000, 'אושר');
      B67.pr(db, 'P8', 'E1', '2026-08', 20000, 'אושר');
      const r = srv.b67PayEmployee(db, { employee_id: 'E1', amount: 12500, method: 'העברה' }, 'מנהל');
      t.ok(r.ok, 'התשלום נדחה: ' + r.error);
      t.eq(r.allocations.length, 2, 'הגלישה לא בוצעה');
      t.eq(r.allocations[0].amount, 10000, 'יולי לא נסגר במלואו');
      t.eq(r.allocations[1].amount, 2500, 'העודף שנכנס לאוגוסט שגוי');
      t.eq(srv.sVal(db.payroll.find(x => x.id === 'P7').status), 'שולם במלואו', 'יולי לא סומן כשולם במלואו');
      t.eq(srv.sVal(db.payroll.find(x => x.id === 'P8').status), 'שולם חלקית', 'אוגוסט לא סומן כשולם חלקית');
      t.eq(srv.b67EmployeeDebt(db, 'E1'), 17500, 'החוב שנותר שגוי');
    },

    'תשלום מדויק על כל החוב — הכל שולם במלואו, יתרה אפס': (t, { srv }) => {
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני');
      B67.pr(db, 'P7', 'E1', '2026-07', 10000, 'אושר');
      B67.pr(db, 'P8', 'E1', '2026-08', 20000, 'שולם חלקית');
      B67.pay(db, 'P8', 'E1', 5000);
      const r = srv.b67PayEmployee(db, { employee_id: 'E1', amount: 25000, method: 'העברה' }, 'מנהל');
      t.ok(r.ok, 'התשלום נדחה: ' + r.error);
      t.eq(r.debt_after, 0, 'נותר חוב אחרי תשלום מלא');
      t.eq(srv.b67EmployeeDebt(db, 'E1'), 0, 'החוב הפתוח לא התאפס');
      db.payroll.forEach(p => t.eq(srv.sVal(p.status), 'שולם במלואו', 'רשומה ' + p.month + ' לא סומנה כשולם במלואו'));
      t.eq(srv.b67EmployeeOpenRows(db, 'E1').length, 0, 'נותרו חודשים פתוחים');
    },

    '⛔ סכום מעל החוב — נדחה, ושום דבר לא נכתב': (t, { srv }) => {
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני');
      B67.pr(db, 'P7', 'E1', '2026-07', 10000, 'אושר');
      const r = srv.b67PayEmployee(db, { employee_id: 'E1', amount: 10000.01 + 5, method: 'העברה' }, 'מנהל');
      t.no(r.ok, 'תשלום מעל סך החוב התקבל');
      t.has(r.error, '10000', 'ההודעה אינה אומרת מה סך החוב');
      t.eq(db.payrollPayments.length, 0, 'נכתבה שורת תשלום למרות הדחייה');
      t.eq(db.expenses.length, 0, 'נכתבה הוצאה למרות הדחייה');
      t.eq(db.futureExpenses.length, 0, 'נכתבה הוצאה עתידית למרות הדחייה');
      t.eq(srv.sVal(db.payroll[0].status), 'אושר', 'הסטטוס שונה למרות הדחייה');
      t.eq(srv.b67EmployeeDebt(db, 'E1'), 10000, 'החוב השתנה למרות הדחייה');
    },

    '⛔ מלכודת 1 — חודש בטיוטה בין השאר: מדולג, ומוחזרת אזהרה': (t, { srv }) => {
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני');
      B67.pr(db, 'P7', 'E1', '2026-07', 10000, 'טיוטה');   // ישן יותר, לא אושר
      B67.pr(db, 'P8', 'E1', '2026-08', 20000, 'אושר');
      t.eq(srv.b67EmployeeDebt(db, 'E1'), 20000, 'טיוטה נספרה כחוב — אסור');
      const r = srv.b67PayEmployee(db, { employee_id: 'E1', amount: 3000, method: 'העברה' }, 'מנהל');
      t.ok(r.ok, 'התשלום נדחה: ' + r.error);
      t.eq(r.allocations[0].month, '2026-08', 'התשלום נכנס לטיוטה — אסור לעקוף אישור');
      t.eq(srv.payrollPaidSum(db, 'P7'), 0, 'שולם כסף כנגד רשומת טיוטה');
      t.eq(r.skipped_drafts.join(','), '2026-07', 'הטיוטה הישנה לא דווחה כמדולגת');
      t.ok(r.warning && r.warning.indexOf('2026-07') > -1, 'לא הוחזרה אזהרה על הדילוג — אסור לדלג בשקט');
    },

    'אין אזהרה כשאין טיוטה ישנה יותר': (t, { srv }) => {
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני');
      B67.pr(db, 'P7', 'E1', '2026-07', 10000, 'אושר');
      B67.pr(db, 'P9', 'E1', '2026-09', 5000, 'טיוטה');   // חדש יותר — אינו דילוג
      const r = srv.b67PayEmployee(db, { employee_id: 'E1', amount: 1000, method: 'העברה' }, 'מנהל');
      t.ok(r.ok, 'התשלום נדחה: ' + r.error);
      t.eq(r.skipped_drafts.length, 0, 'טיוטה עתידית דווחה כמדולגת — רעש מיותר');
      t.eq(r.warning, '', 'הוחזרה אזהרה שלא לצורך');
    },

    '⭐ סכום ההקצאות שווה בדיוק לסכום ששולם — בלי סחיפת עיגול': (t, { srv }) => {
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני');
      B67.pr(db, 'P1', 'E1', '2026-05', 3333.33, 'אושר');
      B67.pr(db, 'P2', 'E1', '2026-06', 3333.33, 'אושר');
      B67.pr(db, 'P3', 'E1', '2026-07', 3333.34, 'אושר');
      const amt = 7777.77;
      const r = srv.b67PayEmployee(db, { employee_id: 'E1', amount: amt, method: 'העברה' }, 'מנהל');
      t.ok(r.ok, 'התשלום נדחה: ' + r.error);
      const sum = Math.round(r.allocations.reduce((s, a) => s + a.amount, 0) * 100) / 100;
      t.eq(sum, amt, 'סכום ההקצאות אינו שווה לסכום ששולם');
      const rows = Math.round(db.payrollPayments.reduce((s, x) => s + Number(x.amount || 0), 0) * 100) / 100;
      t.eq(rows, amt, 'סכום שורות התשלום בגיליון אינו שווה לסכום ששולם');
      t.eq(r.debt_after, Math.round((10000 - amt) * 100) / 100, 'החוב שנותר סחף בעיגול');
      t.eq(srv.b67EmployeeDebt(db, 'E1'), r.debt_after, 'החוב המחושב מחדש אינו תואם למה שהוחזר');
    },

    '⛔ מלכודת 2 — מזומן מעל יתרת הקופה נדחה לפני שנכתבה שורה אחת': (t, { srv }) => {
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני');
      B67.pr(db, 'P7', 'E1', '2026-07', 4000, 'אושר');
      B67.pr(db, 'P8', 'E1', '2026-08', 4000, 'אושר');
      db.payments.push({ id: 'PAY1', method: 'מזומן', amount: 5000, status: 'שולם' });
      t.eq(srv.cashBalanceSrv(db), 5000, 'יתרת הקופה ההתחלתית שגויה — הבדיקה חסרת משמעות');
      const r = srv.b67PayEmployee(db, { employee_id: 'E1', amount: 8000, method: 'מזומן' }, 'מנהל');
      t.no(r.ok, 'תשלום מזומן מעל יתרת הקופה התקבל');
      t.has(r.error, 'מזומן', 'ההודעה אינה מסבירה שמדובר בקופת המזומן');
      t.eq(db.payrollPayments.length, 0, '⛔ נכתבה שורה לפני שהבדיקה נכשלה — הקופה התרוקנה באמצע');
      t.eq(db.expenses.length, 0, 'נכתבה הוצאה לפני שהבדיקה נכשלה');
      t.eq(srv.cashBalanceSrv(db), 5000, 'יתרת הקופה השתנתה למרות הדחייה');
    },

    'בדיקת המזומן היא פעם אחת מול הסכום המלא, לא פר-שורה': (t, { srv }) => {
      /* 8,000 מול קופה של 8,000 — עובר. אילו הבדיקה הייתה פר-שורה אחרי
         שהראשונה נכתבה, השנייה הייתה נופלת על קופה שכבר התרוקנה. */
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני');
      B67.pr(db, 'P7', 'E1', '2026-07', 4000, 'אושר');
      B67.pr(db, 'P8', 'E1', '2026-08', 4000, 'אושר');
      db.payments.push({ id: 'PAY1', method: 'מזומן', amount: 8000, status: 'שולם' });
      const r = srv.b67PayEmployee(db, { employee_id: 'E1', amount: 8000, method: 'מזומן' }, 'מנהל');
      t.ok(r.ok, 'תשלום תקין נדחה: ' + r.error);
      t.eq(r.allocations.length, 2, 'שתי השורות לא נכתבו');
      t.eq(srv.cashBalanceSrv(db), 0, 'יתרת הקופה אחרי התשלום שגויה');
    },

    '⛔ מלכודת 3 / R10 — כל טבלה נכתבת פעם אחת, גם בתשלום על שלושה חודשים': (t, { srv }) => {
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני');
      B67.pr(db, 'P1', 'E1', '2026-05', 1000, 'אושר');
      B67.pr(db, 'P2', 'E1', '2026-06', 1000, 'אושר');
      B67.pr(db, 'P3', 'E1', '2026-07', 1000, 'אושר');
      const seen = [];
      const orig = srv.ensureSheet;
      srv.ensureSheet = function (n) { seen.push(n); return orig(n); };
      try {
        const r = srv.b67PayEmployee(db, { employee_id: 'E1', amount: 3000, method: 'העברה' }, 'מנהל');
        t.ok(r.ok, 'התשלום נדחה: ' + r.error);
      } finally { srv.ensureSheet = orig; }
      const count = {};
      seen.forEach(n => { count[n] = (count[n] || 0) + 1; });
      Object.keys(count).forEach(n => {
        t.eq(count[n], 1, '⛔ הטבלה ' + n + ' נכתבה ' + count[n] + ' פעמים — writeTable בתוך הלולאה');
      });
      t.ok(count['payroll_payments'] === 1 && count['payroll'] === 1 && count['expenses'] === 1,
        'לא כל הטבלאות הנדרשות נכתבו בדיוק פעם אחת');
      t.eq(srv.B67_WRITE_DEFER, null, 'דגל הצבירה נשאר דלוק אחרי הפעולה — כתיבות עתידיות ייעלמו');
    },

    '⛔ כשל בשורה השנייה — שום דבר לא הגיע לגיליון, גם לא מה שנכתב לפניו': (t, { srv }) => {
      /* אטומיות: הבאפר נזרק בשלמותו. בלעדיה בקשה שנופלת באמצע משאירה
         כסף חצי-רשום — בדיוק מה שההקצאה בשרת נועדה למנוע. */
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני');
      B67.pr(db, 'P1', 'E1', '2026-05', 1000, 'אושר');
      B67.pr(db, 'P2', 'E1', '2026-06', 1000, 'אושר');
      const sheets = [];
      const origSheet = srv.ensureSheet;
      const origSum = srv.payrollPaidSum;
      let n = 0;
      srv.ensureSheet = function (name) { sheets.push(name); return origSheet(name); };
      srv.payrollPaidSum = function (d, id) { n++; return n > 3 ? 99999 : origSum(d, id); };
      let r;
      try { r = srv.b67PayEmployee(db, { employee_id: 'E1', amount: 2000, method: 'העברה' }, 'מנהל'); }
      finally { srv.ensureSheet = origSheet; srv.payrollPaidSum = origSum; }
      t.no(r.ok, 'כשל בשורה השנייה לא זוהה');
      t.has(r.error, 'לא נרשם דבר', 'ההודעה אינה אומרת שדבר לא נרשם');
      t.has(r.error, '2026-06', 'ההודעה אינה אומרת באיזה חודש נפל');
      t.eq(sheets.length, 0, '⛔ ' + sheets.join(',') + ' נכתבו לגיליון למרות שהפעולה נכשלה באמצע');
      t.eq(srv.B67_WRITE_DEFER, null, 'דגל הצבירה נשאר דלוק אחרי כשל — כתיבות עתידיות ייעלמו בשקט');
    },

    '⛔ case payPayroll הישן מתנהג בדיוק כמו לפני האצווה': (t, { srv }) => {
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני');
      B67.pr(db, 'P7', 'E1', '2026-07', 10000, 'אושר');
      const r = srv.handle('payPayroll',
        { payroll_id: 'P7', amount: 4000, method: 'העברה', note: 'מקדמה', paid_at: '2026-08-03' }, db, 'מנהל');
      t.ok(r.ok, 'התשלום נדחה: ' + r.error);
      t.ok(!!r.pay_id, 'לא הוחזר pay_id — הממשק נשען עליו למסך האסמכתאות');
      t.eq(r.remaining, 6000, 'היתרה שהוחזרה שגויה');
      t.eq(r.status, 'שולם חלקית', 'הסטטוס שהוחזר שגוי');
      t.has(r.auditNote, 'תשלום שכר', 'ה-auditNote השתנה');
      /* חמש הפעולות */
      t.eq(db.payrollPayments.length, 1, 'לא נרשמה שורת תשלום');
      t.eq(db.payrollPayments[0].paid_at, '2026-08-03', 'תאריך התשלום לא נשמר');
      t.eq(db.payrollPayments[0].note, 'מקדמה', 'ההערה לא נשמרה');
      t.eq(srv.sVal(db.payroll[0].status), 'שולם חלקית', 'סטטוס השכר לא עודכן');
      t.eq(db.expenses.length, 1, 'לא נרשמה הוצאה');
      t.eq(db.expenses[0].category, 'שכר', 'קטגוריית ההוצאה שגויה');
      t.eq(db.futureExpenses.length, 1, 'syncFutureExpenseForPayroll לא רץ');
      t.eq(db.futureExpenses[0].amount, 6000, 'ההוצאה העתידית לא סונכרנה ליתרה');
    },

    'payPayroll — הדחיות הישנות נשמרו מילה במילה': (t, { srv }) => {
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני');
      B67.pr(db, 'P7', 'E1', '2026-07', 10000, 'טיוטה');
      t.eq(srv.handle('payPayroll', { payroll_id: 'NOPE', amount: 1 }, db, 'מנהל').error, 'רשומת שכר לא נמצאה', 'הודעת "לא נמצאה" השתנתה');
      t.eq(srv.handle('payPayroll', { payroll_id: 'P7', amount: 1 }, db, 'מנהל').error, 'יש לאשר את השכר לפני תשלום', 'הודעת הטיוטה השתנתה');
      db.payroll[0].status = 'אושר';
      t.eq(srv.handle('payPayroll', { payroll_id: 'P7', amount: 0 }, db, 'מנהל').error, 'סכום לא תקין', 'הודעת הסכום השתנתה');
      const over = srv.handle('payPayroll', { payroll_id: 'P7', amount: 99999 }, db, 'מנהל');
      t.has(over.error, 'הסכום גבוה מהיתרה לתשלום', 'הודעת החריגה מהיתרה השתנתה');
      t.eq(db.payrollPayments.length, 0, 'נכתב תשלום למרות שכל הקריאות נדחו');
    },

    '⛔ טיוטה אינה יוצרת רשומת future_expenses — גם אחרי תוספת': (t, { srv }) => {
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני');
      B67.pr(db, 'P7', 'E1', '2026-07', 10000, 'טיוטה');
      const r = srv.handle('addPayrollAdjustment',
        { payroll_id: 'P7', type: 'תוספת', category: 'בונוס', amount: 500, note: '' }, db, 'מנהל');
      t.ok(r.ok, 'התוספת נדחתה: ' + r.error);
      t.eq(db.futureExpenses.length, 0, '⛔ טיוטה נכנסה לתחזית התזרים כהתחייבות אמיתית');
    },

    'טיוטה שאושרה עוברת לחוב — בלי כפילות': (t, { srv }) => {
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני');
      B67.pr(db, 'P7', 'E1', '2026-07', 10000, 'טיוטה');
      t.eq(srv.b67EmployeeDebt(db, 'E1'), 0, 'טיוטה נספרה כחוב לפני האישור');
      const r = srv.handle('approvePayroll', { payroll_id: 'P7' }, db, 'מנהל');
      t.ok(r.ok, 'האישור נדחה: ' + r.error);
      t.eq(srv.b67EmployeeDebt(db, 'E1'), 10000, 'אחרי האישור השכר לא נספר כחוב');
      t.eq(db.futureExpenses.length, 1, 'לא נוצרה בדיוק רשומת הוצאה עתידית אחת');
      t.eq(srv.b67EmployeeOpenRows(db, 'E1').length, 1, 'הרשומה נספרה פעמיים בחוב');
    },

    'עובד בלי חוב ועובד שאינו קיים — נדחים בהודעה ברורה': (t, { srv }) => {
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני');
      const noEmp = srv.b67PayEmployee(db, { employee_id: 'XX', amount: 100 }, 'מנהל');
      t.no(noEmp.ok, 'תשלום לעובד שאינו קיים התקבל');
      t.eq(noEmp.error, 'עובד לא נמצא', 'הודעת עובד לא נמצא השתנתה');
      const noDebt = srv.b67PayEmployee(db, { employee_id: 'E1', amount: 100 }, 'מנהל');
      t.no(noDebt.ok, 'תשלום לעובד בלי חוב התקבל');
      t.has(noDebt.error, 'דני', 'ההודעה אינה מזכירה את שם העובד');
      t.eq(srv.b67PayEmployee(db, { employee_id: 'E1', amount: 0 }, 'מנהל').error, 'סכום לא תקין', 'הודעת הסכום השתנתה');
    },

    'החוב של עובד אחד אינו מושפע מעובד אחר': (t, { srv }) => {
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני'); B67.emp(db, 'E2', 'רונית');
      B67.pr(db, 'P1', 'E1', '2026-06', 5000, 'אושר');
      B67.pr(db, 'P2', 'E2', '2026-05', 7000, 'אושר');   // ישן יותר, אבל של עובד אחר
      const r = srv.b67PayEmployee(db, { employee_id: 'E1', amount: 5000, method: 'העברה' }, 'מנהל');
      t.ok(r.ok, 'התשלום נדחה: ' + r.error);
      t.eq(r.allocations[0].payroll_id, 'P1', 'התשלום נכנס לחוב של עובד אחר');
      t.eq(srv.b67EmployeeDebt(db, 'E2'), 7000, 'החוב של העובד השני השתנה');
    },

    '⛔ b67PayEmployee היא פעולת כתיבה — מנהל בלבד, ולא ב-READ_ONLY_ACTIONS': (t, { srv }) => {
      t.ok(srv.MANAGER_ONLY.indexOf('b67PayEmployee') > -1, 'הפעולה אינה מוגבלת למנהל');
      t.eq(srv.READ_ONLY_ACTIONS.indexOf('b67PayEmployee'), -1, '⛔ פעולה שכותבת לגיליון נכנסה ל-READ_ONLY_ACTIONS');
      t.ok(srv.MANAGER_ONLY.indexOf('payPayroll') > -1, 'payPayroll יצא מ-MANAGER_ONLY');
    },

    '⛔ אין מסלול כתיבה שני — case payPayroll קורא ל-b67PayOneRow': (t, { srv, H }) => {
      const src = H.stripComments(H.serverSrc());
      const cnt = (src.match(/db\.payrollPayments\.push\(/g) || []).length;
      t.eq(cnt, 1, '⛔ יש ' + cnt + ' מקומות שכותבים שורת תשלום שכר — נוצרה לוגיקת תשלום שנייה');
      t.has(src, "case 'payPayroll'", "case 'payPayroll' נעלם");
      t.has(src, 'b67PayOneRow(db, prP', "case 'payPayroll' כבר לא קורא ל-b67PayOneRow");
    },

    'auditNote מפרט את כל החודשים והסכומים': (t, { srv }) => {
      const db = B67.db(srv);
      B67.emp(db, 'E1', 'דני');
      B67.pr(db, 'P7', 'E1', '2026-07', 1000, 'אושר');
      B67.pr(db, 'P8', 'E1', '2026-08', 1000, 'אושר');
      const r = srv.b67PayEmployee(db, { employee_id: 'E1', amount: 1500, method: 'העברה' }, 'מנהל');
      t.ok(r.ok, 'התשלום נדחה: ' + r.error);
      t.has(r.auditNote, '2026-07=1000', 'החודש הראשון חסר ביומן');
      t.has(r.auditNote, '2026-08=500', 'החודש השני חסר ביומן');
      t.has(r.auditNote, 'דני', 'שם העובד חסר ביומן');
    }
  }
});


SPECS.push({
  file: 't11-b67-ui',
  title: 'B67 — הממשק: תצוגת עובד וסיכום הטיוטות',
  needs: 'ui',
  requires: ['b67EmpView', 'b67EmpDebt', 'b67EmpMonthRows', 'b67DraftRows', 'b67DraftTotal',
             'b67DraftCardHtml', 'b67DraftsList', 'b67PayEmp', 'b67EmpNameCell',
             'payrollRowHtml', 'payrollDetail', 'payrollTable', 'payrollRowsFor', 'rPayroll',
             'finPayrollTotal', 'fexpOpen', 'fexpRemain', 'futureExpensesHtml', 'savePayrollPayment'],

  tests: {

    '⭐ תצוגת העובד מציגה את כל חודשיו ולא רק את הנבחר': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { db: B67.uiDb(srv) });
      w.b67EmpView('E1');
      const h = w.el('modal').innerHTML;
      t.has(h, 'יוני 2026', 'חודש קודם של העובד אינו מוצג');
      t.has(h, 'יולי 2026', 'חודש נוסף של העובד אינו מוצג');
      t.has(h, 'אוגוסט 2026', 'החודש האחרון של העובד אינו מוצג');
      t.hasNot(h, 'רונית', 'הוצג עובד אחר בתצוגת עובד');
      t.eq(w.b67EmpMonthRows('E1').length, 4, 'מספר החודשים של העובד שגוי');
      w.closeModal();
    },

    'בראש התצוגה מספר אחד — סך החוב הפתוח, בלי הטיוטה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { db: B67.uiDb(srv) });
      /* יוני 3,000 יתרה · יולי 10,000 · אוגוסט 20,000 · ספטמבר 8,000 בטיוטה */
      t.eq(w.b67EmpDebt('E1'), 33000, 'סך החוב שגוי — ייתכן שטיוטה נספרה');
      w.b67EmpView('E1');
      const h = w.el('modal').innerHTML;
      t.has(h, 'סך החוב הפתוח', 'המספר הראשי חסר');
      t.has(h, 'אינו נכלל בחוב', 'לא נאמר שהטיוטה אינה חלק מהחוב');
      w.closeModal();
    },

    '⛔ אין מסך אישור שמפרט חודשים לפני התשלום': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { db: B67.uiDb(srv) });
      w.b67EmpView('E1');
      const h = w.el('modal').innerHTML;
      t.ok(!!w.el('b67_amt'), 'אין שדה סכום');
      t.eq(w.el('b67_amt').value, '33000', 'ברירת המחדל אינה מלוא החוב');
      t.has(h, 'שלם', 'אין כפתור תשלום');
      t.hasNot(h, 'אשר את השיוך', 'נוסף מסך אישור שיוך — הכרעת אבי היא שהשיוך שקוף');
      w.closeModal();
    },

    '⛔ אין כפתור תשלום נפרד בכל שורה בטבלת השכר': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { db: B67.uiDb(srv) });
      const html = w.payrollTable('2026-08');
      const box = w.el('modal');
      box.innerHTML = html;
      const rows = box.querySelectorAll('tr');
      let payBtns = 0;
      rows.forEach(r => r.querySelectorAll('button').forEach(b => {
        if (String(b.getAttribute('onclick') || '').indexOf('b67PayEmp(') > -1) payBtns++;
      }));
      t.eq(payBtns, 0, '⛔ נוסף כפתור תשלום בשורת הטבלה — הכרעת אבי היא שאין');
      t.has(html, 'פרטים / תשלום', 'כפתור הפרטים הקיים הוסר (R8)');
      box.innerHTML = '';
    },

    'לחיצה על שם העובד פותחת את תצוגת העובד (R7 — אירוע אמיתי)': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { db: B67.uiDb(srv) });
      w.el('modal').innerHTML = w.payrollTable('2026-08');
      const nameEl = w.el('modal').querySelector('b[onclick*="b67EmpView"]');
      t.ok(!!nameEl, 'שם העובד אינו לחיץ');
      if (!nameEl) return;
      H.click(w, nameEl);
      t.has(w.el('modal').innerHTML, 'סך החוב הפתוח', 'הלחיצה על השם לא פתחה את תצוגת העובד');
      w.closeModal();
    },

    'לחיצה על שורת חודש מובילה ל-payrollDetail הקיים': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { db: B67.uiDb(srv) });
      w.b67EmpView('E1');
      const tr = w.el('modal').querySelector('tr[onclick*="payrollDetail"]');
      t.ok(!!tr, 'שורת החודש אינה מובילה לפירוט השכר');
      if (!tr) return;
      H.click(w, tr);
      t.has(w.el('modal').innerHTML, 'תוספות וניכויים', 'לא נפתח payrollDetail הקיים אלא משהו אחר');
      w.closeModal();
    },

    '⛔ סיכום הטיוטות אינו נספר ב-finPayrollTotal ואינו יוצר futureExpenses': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { db: B67.uiDb(srv) });
      t.eq(w.b67DraftTotal(), 8000, 'סכום הטיוטות שגוי');
      t.eq(w.finPayrollTotal(), 0, '⛔ טיוטה נספרה בסך חוב השכר בהוצאות הצפויות');
      t.eq(w.fexpOpen().filter(x => x.source === 'payroll').length, 0,
        '⛔ נוצרה רשומת future_expenses לטיוטה — היא נספרת בתזרים כהתחייבות אמיתית');
      t.eq((w.DB.futureExpenses || []).length, 0, '⛔ טיוטה נכתבה לטבלת ההוצאות העתידיות');
    },

    'סכום הטיוטות בהוצאות הצפויות מוצג בנפרד ולידו, ולא בתוך הסך': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { db: B67.uiDb(srv) });
      const h = w.futureExpensesHtml();
      t.has(h, 'טיוטות שכר — טרם אושר, אינו נכלל בסך', 'התווית אינה מבהירה שזו תחזית ולא חוב');
      t.has(h, 'סה"כ צפוי לתשלום', 'כרטיס הסך המחייב נעלם');
      t.has(h, 'b67DraftsList()', 'הכרטיס אינו נפתח לרשימת הפירוט');
    },

    'כרטיס הטיוטות במסך השכר נפתח לרשימה, ומשם לשכר עצמו': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { db: B67.uiDb(srv) });
      w.rPayroll();
      t.has(w.el('main').innerHTML, 'טיוטות שכר שטרם אושרו', 'כרטיס הסיכום חסר במסך השכר');
      w.b67DraftsList();
      const h = w.el('modal').innerHTML;
      t.has(h, 'ספטמבר 2026', 'הטיוטה אינה מופיעה ברשימת הפירוט');
      const tr = w.el('modal').querySelector('tr[onclick*="payrollDetail"]');
      t.ok(!!tr, 'שורה ברשימת הטיוטות אינה מובילה לשכר עצמו');
      w.closeModal();
    },

    '⛔ לנהג אין כפתור תשלום, אין סיכום טיוטות ואין תצוגת עובד': (t, { w, srv, H }) => {
      H.login(w, 'נהג', srv, { db: B67.uiDb(srv) });
      t.eq(w.b67DraftCardHtml('payroll'), '', '⛔ הנהג רואה סיכום טיוטות');
      t.eq(w.b67DraftCardHtml('fexp'), '', '⛔ הנהג רואה סיכום טיוטות בהוצאות הצפויות');
      const cell = w.b67EmpNameCell({ id: 'E1', name: 'דני' });
      t.hasNot(cell, 'b67EmpView', '⛔ הנהג יכול לפתוח תצוגת עובד');
      w.b67EmpView('E1');
      const h = w.el('modal').innerHTML;
      t.hasNot(h, 'b67PayEmp(', '⛔ הנהג רואה כפתור תשלום');
      t.hasNot(h, 'b67_amt', '⛔ הנהג רואה שדה סכום לתשלום');
      w.closeModal();
    },

    '⛔ לנהג בשורת השכר יש רק הדפסה, ורק כשאינה טיוטה': (t, { w, srv, H }) => {
      H.login(w, 'נהג', srv, { db: B67.uiDb(srv) });
      const emp = w.DB.employees[0];
      const okRow = w.payrollRowHtml(w.DB.payroll.find(p => p.month === '2026-08'), emp);
      t.has(okRow, 'printPayslip', 'כפתור ההדפסה של הנהג נעלם');
      t.hasNot(okRow, 'payrollDetail', '⛔ הנהג רואה כפתור פרטים/תשלום');
      t.hasNot(okRow, 'b67EmpView', '⛔ שם העובד לחיץ אצל הנהג');
      const draftRow = w.payrollRowHtml(w.DB.payroll.find(p => p.month === '2026-09'), emp);
      t.hasNot(draftRow, 'printPayslip', '⛔ הנהג יכול להדפיס שכר בטיוטה');
      t.has(draftRow, 'טרם אושר', 'הודעת "טרם אושר" לנהג נעלמה');
    },

    'סכום שאינו תקין נעצר בממשק בלי לפנות לשרת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { db: B67.uiDb(srv) });
      w.b67EmpView('E1');
      w.el('b67_amt').value = '0';
      const before = w.__fetches.length;
      w.b67PayEmp('E1');
      t.eq(w.__fetches.length, before, 'נשלחה בקשה לשרת על סכום לא תקין');
      w.closeModal();
    },

    '⛔ R4 — מנגנוני השכר הקיימים לא נפגעו': (t, { w }) => {
      ['payrollRowHtml', 'payrollDetail', 'payrollBreakdown', 'payrollPaid', 'payrollAdjustments',
       'isGlobalPayroll', 'printPayslip', 'savePayrollPayment', 'payrollRowsFor', 'payrollTable',
       'rPayroll', 'fexpOpen', 'fexpRemain', 'finPayrollTotal', 'isCashMethod', 'sVal', 'sPick']
        .forEach(n => t.eq(typeof w[n], 'function', 'נעלם מנגנון חסין: ' + n));
    },

    '⛔ שכבה 2 לא נגעה — B67 אינו נוגע ביכולת דפדפן': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const names = w.b61Tests().map(x => x.n);
      t.eq(names.filter(n => n.indexOf('B67') > -1).length, 0,
        'נוספה טענה ל-b61Tests — BLD-16 אינו נוגע ביכולת דפדפן');
    }
  }
});

/* עוזרי בנייה ל-t11. יושבים כאן ולא ברתמה כי הם ספציפיים לשכר. */
const B67 = {
  db(srv) { return H.emptyDb(srv); },
  emp(db, id, name) { db.employees.push({ id: id, name: name, role: 'עובד רצפה', active: 'כן', can_edit: 'כן' }); },
  pr(db, id, empId, month, total, status) {
    db.payroll.push({ id: id, employee_id: empId, month: month, pay_type: 'גלובלי',
      hours: 0, hourly_rate: 0, base_pay: total, bonus: 0, bonus_note: '', total: total, status: status });
  },
  pay(db, prId, empId, amount) {
    db.payrollPayments.push({ id: 'PP' + db.payrollPayments.length, payroll_id: prId,
      employee_id: empId, amount: amount, method: 'העברה', note: '', paid_at: '2026-08-01', created_by: 'מנהל' });
  },
  /* מסד לממשק: דני עם ארבעה חודשים — אחד שולם חלקית, שניים פתוחים, אחד בטיוטה */
  uiDb(srv) {
    const db = H.emptyDb(srv);
    B67.emp(db, 'E1', 'דני'); B67.emp(db, 'E2', 'רונית');
    B67.pr(db, 'P6', 'E1', '2026-06', 5000, 'שולם חלקית');
    B67.pay(db, 'P6', 'E1', 2000);
    B67.pr(db, 'P7', 'E1', '2026-07', 10000, 'אושר');
    B67.pr(db, 'P8', 'E1', '2026-08', 20000, 'אושר');
    B67.pr(db, 'P9', 'E1', '2026-09', 8000, 'טיוטה');
    B67.pr(db, 'Q8', 'E2', '2026-08', 4000, 'אושר');
    return db;
  }
};

/* ============================================================
   ⭐ B68 — ניקוי שכר: כפילויות · מחיקה · יתרת חובה
   ============================================================ */
const B68 = {
  /* מסד עם כפילות אחת: לאברהם שתי שורות שכר לאותו חודש */
  dupDb(srv) {
    const db = H.emptyDb(srv);
    B67.emp(db, 'E1', 'אברהם'); B67.emp(db, 'E2', 'רונית');
    B67.pr(db, 'PA', 'E1', '2026-07', 6000, 'אושר');
    B67.pr(db, 'PB', 'E1', '2026-07', 6000, 'אושר');   /* הכפילות */
    B67.pr(db, 'PC', 'E2', '2026-07', 4000, 'אושר');
    return db;
  }
};

SPECS.push({
  file: 't14-b68-srv',
  title: 'B68 — השרת: כפילויות שכר, מחיקה וקיזוז יתרת חובה',
  needs: 'server',
  requires: ['b68PayrollFor', 'b68DupGroups', 'b68RowOverpay', 'b68EmployeeOverpay',
             'b68MergePayroll', 'b68OffsetOverpay', 'b68PayrollFor', 'B68_OFFSET_CAT',
             'payrollPaidSum', 'recomputePayrollTotal', 'syncFutureExpenseForPayroll',
             'b67EmployeeDebt', 'handle', 'MANAGER_ONLY', 'READ_ONLY_ACTIONS', 'sVal'],

  tests: {

    '⭐ הבעיה של אבי: כפילות מנפחת את חוב העובד פי 2': (t, { srv }) => {
      const db = B68.dupDb(srv);
      t.eq(srv.b67EmployeeDebt(db, 'E1'), 12000, 'החוב אינו מנופח — הבדיקה לא משחזרת את הבאג');
      t.eq(srv.b68DupGroups(db).length, 1, 'הכפילות לא זוהתה');
      const r = srv.b68MergePayroll(db, { keep_id: 'PA', drop_id: 'PB' }, 'מנהל');
      t.ok(r.ok, 'המיזוג נדחה: ' + r.error);
      t.eq(srv.b67EmployeeDebt(db, 'E1'), 6000, '⛔ החוב לא חזר לסכום האמיתי אחרי המיזוג');
      t.eq(db.payroll.filter(p => p.employee_id === 'E1').length, 1, 'נותרה יותר משורה אחת');
      t.eq(srv.b68DupGroups(db).length, 0, 'הכפילות עדיין מדווחת');
    },

    'המיזוג מעביר תוספות ותשלומים ואינו מאבד כסף': (t, { srv }) => {
      const db = B68.dupDb(srv);
      db.payrollAdjustments.push({ id: 'A1', payroll_id: 'PB', employee_id: 'E1', month: '2026-07',
        type: 'תוספת', category: 'בונוס', amount: 500, note: '', created_at: '', created_by: 'מנהל' });
      B67.pay(db, 'PB', 'E1', 1500);
      const r = srv.b68MergePayroll(db, { keep_id: 'PA', drop_id: 'PB' }, 'מנהל');
      t.ok(r.ok, 'המיזוג נדחה: ' + r.error);
      t.eq(r.moved_adjustments, 1, 'התוספת לא הועברה');
      t.eq(r.moved_payments, 1, 'התשלום לא הועבר');
      t.eq(db.payrollAdjustments.filter(a => a.payroll_id === 'PA').length, 1, 'התוספת אינה תלויה בשורה שנשמרה');
      t.eq(srv.payrollPaidSum(db, 'PA'), 1500, '⛔ כסף ששולם נעלם במיזוג');
      t.eq(db.payroll.find(p => p.id === 'PA').total, 6500, 'הסה"כ לא חושב מחדש עם התוספת שהועברה');
      t.eq(srv.sVal(db.payroll.find(p => p.id === 'PA').status), 'שולם חלקית', 'הסטטוס לא עודכן לפי התשלומים שהועברו');
    },

    '⭐ הכרעת אבי 2: מיזוג שיוצר תשלום עודף יוצר יתרת חובה': (t, { srv }) => {
      const db = B68.dupDb(srv);
      B67.pay(db, 'PA', 'E1', 6000);            /* שולם על השורה הראשונה */
      B67.pay(db, 'PB', 'E1', 6000);            /* ושוב על הכפולה — סה"כ 12,000 */
      const r = srv.b68MergePayroll(db, { keep_id: 'PA', drop_id: 'PB' }, 'מנהל');
      t.ok(r.ok, 'המיזוג נדחה: ' + r.error);
      t.eq(r.overpay, 6000, 'התשלום העודף לא חושב');
      t.eq(srv.b68EmployeeOverpay(db, 'E1'), 6000, 'יתרת החובה של העובד שגויה');
      t.eq(srv.b67EmployeeDebt(db, 'E1'), 0, '⛔ יתרה שלילית נספרה כחוב — אסור');
      t.has(r.auditNote, 'תשלום עודף', 'התשלום העודף אינו מתועד ביומן');
    },

    '⛔ מיזוג שתי שורות של עובדים או חודשים שונים — נדחה': (t, { srv }) => {
      const db = B68.dupDb(srv);
      const r1 = srv.b68MergePayroll(db, { keep_id: 'PA', drop_id: 'PC' }, 'מנהל');
      t.no(r1.ok, 'מוזגו שורות של שני עובדים שונים');
      const r2 = srv.b68MergePayroll(db, { keep_id: 'PA', drop_id: 'PA' }, 'מנהל');
      t.no(r2.ok, 'שורה מוזגה עם עצמה');
      t.eq(db.payroll.length, 3, 'נמחקה שורה למרות שהמיזוג נדחה');
    },

    '⭐ הכרעת אבי 1: שורת שכר ששולמה אינה נמחקת': (t, { srv }) => {
      const db = B68.dupDb(srv);
      B67.pay(db, 'PA', 'E1', 100);
      const r = srv.handle('delete', { table: 'payroll', id: 'PA', mgr_pin: H.MGR_PIN, reason: 'ניסיון' }, db, 'מנהל');
      t.no(r.ok, '⛔ נמחקה שורת שכר ששולם כנגדה — הכסף כבר יצא מהקופה');
      t.eq(db.payroll.filter(p => p.id === 'PA').length, 1, 'השורה נמחקה למרות הדחייה');
    },

    'מחיקת שורה בלי תשלומים — דורשת סיבה ומנקה את התוספות': (t, { srv }) => {
      const db = B68.dupDb(srv);
      db.payrollAdjustments.push({ id: 'A1', payroll_id: 'PB', employee_id: 'E1', month: '2026-07',
        type: 'תוספת', category: 'בונוס', amount: 500, note: '', created_at: '', created_by: 'מנהל' });
      const noReason = srv.handle('delete', { table: 'payroll', id: 'PB', mgr_pin: H.MGR_PIN }, db, 'מנהל');
      t.no(noReason.ok, 'מחיקה בלי סיבה התקבלה');
      t.eq(db.payroll.filter(p => p.id === 'PB').length, 1, 'השורה נמחקה למרות שאין סיבה');
      const r = srv.handle('delete', { table: 'payroll', id: 'PB', mgr_pin: H.MGR_PIN, reason: 'רישום שגוי' }, db, 'מנהל');
      t.ok(r.ok, 'המחיקה נדחתה: ' + r.error);
      t.eq(db.payroll.filter(p => p.id === 'PB').length, 0, 'השורה לא נמחקה');
      t.eq(db.payrollAdjustments.filter(a => a.payroll_id === 'PB').length, 0, '⛔ נותרו תוספות יתומות');
    },

    '⭐ חסם ייחודיות: הפקת שכר אינה יוצרת שורה שנייה, ואינה נוגעת בכפילות': (t, { srv }) => {
      const db = B68.dupDb(srv);
      db.payroll.forEach(p => { p.status = 'טיוטה'; });
      const before = db.payroll.length;
      const r = srv.buildPayrollForMonth(db, '2026-07');
      t.eq(db.payroll.length, before, '⛔ ההפקה יצרה שורות שכר נוספות');
      t.eq(r.dup, 1, 'ההפקה לא דיווחה על הכפילות');
      t.eq(srv.b68PayrollFor(db, 'E1', '2026-07').count, 2, 'מספר השורות הכפולות השתנה');
      t.ok(srv.b68PayrollFor(db, 'E1', '2026-07').dup, 'הכפילות לא סומנה');
      t.no(srv.b68PayrollFor(db, 'E2', '2026-07').dup, 'עובד תקין סומן בטעות ככפול');
    },

    'B64a: רווח קשיח בגיליון אינו יוצר כפילות חדשה': (t, { srv }) => {
      const db = B68.dupDb(srv);
      db.payroll = db.payroll.filter(p => p.id !== 'PB');
      db.payroll.find(p => p.id === 'PA').month = '2026-07\u00a0';   /* רווח קשיח */
      const f = srv.b68PayrollFor(db, 'E1', '2026-07');
      t.ok(!!f.row, '⛔ sVal לא הופעל — שורה עם רווח קשיח לא נמצאה, והפקה הייתה יוצרת כפילות');
      t.eq(f.count, 1, 'מספר השורות שגוי');
    },

    'קיזוז יתרת חובה — ניכוי מפורש שמקטין את השכר הבא': (t, { srv }) => {
      const db = B68.dupDb(srv);
      B67.pay(db, 'PA', 'E1', 6000); B67.pay(db, 'PB', 'E1', 6000);
      srv.b68MergePayroll(db, { keep_id: 'PA', drop_id: 'PB' }, 'מנהל');
      B67.pr(db, 'PD', 'E1', '2026-08', 6000, 'אושר');
      t.eq(srv.b68EmployeeOverpay(db, 'E1'), 6000, 'יתרת החובה לפני הקיזוז שגויה');
      const r = srv.b68OffsetOverpay(db, { employee_id: 'E1', month: '2026-08', amount: 6000 }, 'מנהל');
      t.ok(r.ok, 'הקיזוז נדחה: ' + r.error);
      t.eq(db.payroll.find(p => p.id === 'PD').total, 0, 'השכר לא הוקטן בסכום הקיזוז');
      t.eq(srv.b68EmployeeOverpay(db, 'E1'), 0, '⛔ יתרת החובה לא נסגרה — קיזוז כפול אפשרי');
      t.eq(srv.b67EmployeeDebt(db, 'E1'), 0, 'נותר חוב אחרי קיזוז מלא');
      const dbl = srv.b68OffsetOverpay(db, { employee_id: 'E1', month: '2026-08', amount: 100 }, 'מנהל');
      t.no(dbl.ok, '⛔ קיזוז שני התקבל אחרי שהיתרה נסגרה');
    },

    '⛔ קיזוז נדחה: מעל היתרה · חודש עם כפילות · אין יתרת חובה': (t, { srv }) => {
      const db = B68.dupDb(srv);
      B67.pay(db, 'PA', 'E1', 9000);   /* שולם 9,000 על שכר 6,000 — יתרת חובה 3,000 */
      const noneYet = srv.b68OffsetOverpay(db, { employee_id: 'E2', month: '2026-07', amount: 10 }, 'מנהל');
      t.no(noneYet.ok, 'קיזוז התקבל לעובד בלי יתרת חובה');
      const dupMonth = srv.b68OffsetOverpay(db, { employee_id: 'E1', month: '2026-07', amount: 10 }, 'מנהל');
      t.no(dupMonth.ok, '⛔ קיזוז בוצע על חודש שיש בו שתי שורות שכר');
      t.has(dupMonth.error, 'למזג', 'ההודעה אינה מפנה למיזוג');
      srv.b68MergePayroll(db, { keep_id: 'PA', drop_id: 'PB' }, 'מנהל');
      B67.pr(db, 'PD', 'E1', '2026-08', 6000, 'אושר');
      const tooMuch = srv.b68OffsetOverpay(db, { employee_id: 'E1', month: '2026-08', amount: 9999 }, 'מנהל');
      t.no(tooMuch.ok, 'קיזוז מעל יתרת החובה התקבל');
      t.eq(db.payrollAdjustments.length, 0, 'נכתב ניכוי למרות שכל הקיזוזים נדחו');
    },

    '⛔ ההרשאות: אבחון קריאה-בלבד, מיזוג וקיזוז כותבים — כולם מנהל בלבד': (t, { srv }) => {
      ['b68DupScan', 'b68MergePayroll', 'b68OffsetOverpay'].forEach(a =>
        t.ok(srv.MANAGER_ONLY.indexOf(a) > -1, 'פעולה שאינה מנהל-בלבד: ' + a));
      t.ok(srv.READ_ONLY_ACTIONS.indexOf('b68DupScan') > -1, 'האבחון אינו מסומן כקריאה בלבד');
      ['b68MergePayroll', 'b68OffsetOverpay'].forEach(a =>
        t.eq(srv.READ_ONLY_ACTIONS.indexOf(a), -1, '⛔ פעולה כותבת סומנה כקריאה בלבד — תרוץ בלי נעילה ובלי audit: ' + a));
    },

    'האבחון קריאה בלבד — אינו משנה דבר': (t, { srv }) => {
      const db = B68.dupDb(srv);
      B67.pay(db, 'PA', 'E1', 9000);   /* שולם 9,000 על שכר 6,000 — יתרת חובה 3,000 */
      const snap = JSON.stringify(db.payroll) + JSON.stringify(db.payrollPayments) + JSON.stringify(db.payrollAdjustments);
      const r = srv.handle('b68DupScan', {}, db, 'מנהל');
      t.ok(r.ok, 'האבחון נכשל: ' + r.error);
      t.eq(r.groups.length, 1, 'מספר הכפילויות שדווח שגוי');
      t.eq(r.dup_rows, 2, 'מספר השורות הכפולות שגוי');
      t.eq(r.overpay.length, 1, 'רשימת יתרות החובה שגויה');
      t.eq(r.overpay[0].overpay, 3000, 'סכום יתרת החובה שדווח שגוי');
      t.eq(JSON.stringify(db.payroll) + JSON.stringify(db.payrollPayments) + JSON.stringify(db.payrollAdjustments), snap,
        '⛔ R1 — פעולת אבחון שינתה נתונים');
    },

    '⛔ R4 — מנגנוני השכר של B67 לא נפגעו': (t, { srv }) => {
      const db = H.emptyDb(srv);
      B67.emp(db, 'E1', 'דני');
      B67.pr(db, 'P7', 'E1', '2026-07', 10000, 'אושר');
      B67.pr(db, 'P8', 'E1', '2026-08', 20000, 'אושר');
      const r = srv.b67PayEmployee(db, { employee_id: 'E1', amount: 12500, method: 'העברה' }, 'מנהל');
      t.ok(r.ok, 'תשלום ברמת העובד נשבר: ' + r.error);
      t.eq(r.allocations.length, 2, 'הגלישה בין חודשים נשברה');
      t.eq(srv.b67EmployeeDebt(db, 'E1'), 17500, 'חישוב החוב השתנה');
      t.eq(srv.b68EmployeeOverpay(db, 'E1'), 0, 'תשלום תקין נספר בטעות כיתרת חובה');
    }
  }
});

SPECS.push({
  file: 't14-b68-ui',
  title: 'B68 — הממשק: אזהרת כפילויות, מיזוג ומחיקה',
  needs: 'ui',
  requires: ['b68Groups', 'b68EmpDupCount', 'b68RowOver', 'b68EmpOverpay', 'b68WarnHtml',
             'b68DupModal', 'b68DoMerge', 'b68OffsetForm', 'b68DoOffset', 'b68DelPayroll',
             'B68_OFFSET_CAT', 'payrollRowHtml', 'payrollDetail', 'rPayroll', 'b67EmpView',
             'confirmManagerDelete', 'sVal'],

  tests: {

    '⭐ הכפילות מזוהה בממשק בלי בקשת שרת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { db: B68.dupDb(srv) });
      t.eq(w.b68Groups().length, 1, 'הכפילות לא זוהתה בממשק');
      t.eq(w.b68EmpDupCount('E1'), 1, 'מספר החודשים הכפולים של העובד שגוי');
      t.eq(w.b68EmpDupCount('E2'), 0, 'עובד תקין סומן ככפול');
    },

    '⭐ הכרעת אבי 3: אזהרה בולטת, בלי חסימת ההפקה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { db: B68.dupDb(srv) });
      w.rPayroll();
      const h = w.el('main').innerHTML;
      t.has(h, 'כפילויות שכר', 'האזהרה אינה מוצגת במסך השכר');
      t.has(h, 'b68DupModal', 'אין כפתור טיפול בכפילויות');
      t.has(h, 'הפק שכר לחודש זה', '⛔ ההפקה נחסמה — הכרעת אבי היא אזהרה בלבד');
    },

    'השורה הכפולה מסומנת בטבלה עצמה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { db: B68.dupDb(srv) });
      const dup = w.payrollRowHtml(w.DB.payroll.find(p => p.id === 'PA'), { id: 'E1', name: 'אברהם' });
      const ok = w.payrollRowHtml(w.DB.payroll.find(p => p.id === 'PC'), { id: 'E2', name: 'רונית' });
      t.has(dup, 'כפולה', 'השורה הכפולה אינה מסומנת');
      t.hasNot(ok, 'כפולה', 'שורה תקינה סומנה ככפולה');
    },

    '⛔ לנהג אין אזהרה, אין מיזוג ואין מחיקה': (t, { w, srv, H }) => {
      H.login(w, 'נהג', srv, { db: B68.dupDb(srv) });
      t.eq(w.b68WarnHtml(), '', '⛔ לנהג הוצגה אזהרת כפילויות — כלי ניהולי');
      w.payrollDetail('PA');
      t.hasNot(w.el('modal').innerHTML, 'b68DelPayroll', '⛔ לנהג הוצג כפתור מחיקת שכר');
      w.closeModal();
    },

    'כפתור המחיקה מופיע רק כשלא שולם דבר': (t, { w, srv, H }) => {
      const db = B68.dupDb(srv);
      B67.pay(db, 'PA', 'E1', 100);
      H.login(w, 'מנהל', srv, { db: db });
      w.payrollDetail('PB');
      t.has(w.el('modal').innerHTML, 'b68DelPayroll', 'שורה בלי תשלומים אינה ניתנת למחיקה בממשק');
      w.closeModal();
      w.payrollDetail('PA');
      const h = w.el('modal').innerHTML;
      t.hasNot(h, 'b68DelPayroll', '⛔ הוצג כפתור מחיקה לשורה ששולם כנגדה');
      t.has(h, 'אינה ניתנת למחיקה', 'לא הוסבר למה אין כפתור מחיקה');
      w.closeModal();
    },

    '⭐ המיזוג נשלח בבקשה אחת לכל שורה מיותרת, עם אותו עובד וחודש': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { db: B68.dupDb(srv) });
      w.confirm = () => true;
      const sent = [];
      w.act = async (a, p) => { sent.push({ a: a, p: p }); return { ok: true, overpay: 0 }; };
      w.b68DupModal();
      return Promise.resolve(w.b68DoMerge('E1', '2026-07')).then(() => {
        t.eq(sent.length, 1, 'מספר בקשות המיזוג שגוי');
        t.eq(sent[0].a, 'b68MergePayroll', 'נשלחה פעולה שגויה');
        t.ne(sent[0].p.keep_id, sent[0].p.drop_id, '⛔ נשלח מיזוג של שורה עם עצמה');
        t.ok(['PA', 'PB'].indexOf(sent[0].p.keep_id) > -1, 'השורה הנשמרת אינה מהקבוצה');
        t.ok(['PA', 'PB'].indexOf(sent[0].p.drop_id) > -1, 'השורה הנמחקת אינה מהקבוצה');
      });
    },

    'יתרת חובה מוצגת בכרטיס העובד ואינה מקוזזת מהחוב': (t, { w, srv, H }) => {
      const db = B68.dupDb(srv);
      db.payroll = db.payroll.filter(p => p.id !== 'PB');
      B67.pay(db, 'PA', 'E1', 9000);           /* שולם 9,000 על שכר 6,000 */
      H.login(w, 'מנהל', srv, { db: db });
      t.eq(w.b68EmpOverpay('E1'), 3000, 'יתרת החובה שגויה');
      t.eq(w.b67EmpDebt('E1'), 0, '⛔ יתרה שלילית נספרה כחוב');
      w.b67EmpView('E1');
      const h = w.el('modal').innerHTML;
      t.has(h, 'יתרת חובה', 'יתרת החובה אינה מוצגת בכרטיס העובד');
      t.has(h, 'b68OffsetForm', 'אין כפתור קיזוז בכרטיס העובד');
      w.closeModal();
    },

    'הקיזוז שכבר נרשם מקטין את יתרת החובה': (t, { w, srv, H }) => {
      const db = B68.dupDb(srv);
      db.payroll = db.payroll.filter(p => p.id !== 'PB');
      B67.pay(db, 'PA', 'E1', 9000);
      db.payrollAdjustments.push({ id: 'A9', payroll_id: 'PC', employee_id: 'E1', month: '2026-08',
        type: 'ניכוי', category: 'קיזוז יתרת חובה', amount: 1000, note: '', created_at: '', created_by: 'מנהל' });
      H.login(w, 'מנהל', srv, { db: db });
      t.eq(w.b68EmpOverpay('E1'), 2000, '⛔ קיזוז שנרשם לא הוריד את יתרת החובה — קיזוז כפול אפשרי');
    },

    '⛔ המחיקה עוברת במסלול המחיקה הקיים, עם מספר אישי של מנהל': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { db: B68.dupDb(srv) });
      t.has(String(w.b68DelPayroll), 'confirmManagerDelete', '⛔ נבנה מסלול מחיקה שני בלי אימות מנהל (R8)');
      t.has(String(w.b68DelPayroll), "'delete'", '⛔ המחיקה אינה עוברת בפעולת delete הקיימת');
      t.has(String(w.b68DelPayroll), 'reason', 'המחיקה נשלחת בלי סיבה');
    },

    '⛔ R4 — מסכי השכר של B67 לא נפגעו': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv, { db: B67.uiDb(srv) });
      t.eq(w.b68WarnHtml(), '', 'הוצגה אזהרת כפילויות למסד תקין');
      t.eq(w.b67EmpDebt('E1'), 33000, 'חישוב החוב של B67 השתנה');
      w.rPayroll();
      t.has(w.el('main').innerHTML, 'הפק שכר לחודש זה', 'מסך השכר נשבר');
      w.b67EmpView('E1');
      t.has(w.el('modal').innerHTML, 'סך החוב הפתוח', 'כרטיס העובד נשבר');
      w.closeModal();
    }
  }
});


/* ==================== חלק 2 — המריץ ==================== */

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

const cp = require('child_process');

const only = process.argv[2] || '';
const RED = s => '\x1b[31m' + s + '\x1b[0m';
const GRN = s => '\x1b[32m' + s + '\x1b[0m';
const YEL = s => '\x1b[33m' + s + '\x1b[0m';
const DIM = s => '\x1b[2m' + s + '\x1b[0m';

/* ---------- שלב 0: בדיקת תחביר ---------- */
function syntaxCheck() {
  const tmp = path.join(ROOT, '.syntax');
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

  const files = SPECS.filter(sp => !only || String(sp.file).indexOf(only) === 0);

  if (!files.length) { console.log(RED('  לא נמצא חלק בדיקות בשם ' + only + '')); process.exit(1); }

  /* הקשרים משותפים — נבנים פעם אחת ומועברים לקבצים שמבקשים אותם */
  let serverCtx = null, uiCache = null;
  const getServer = () => (serverCtx || (serverCtx = H.loadServer()));
  const getUi = () => H.loadUi();   // חלון טרי לכל קובץ — בידוד מצב

  let pass = 0, fail = 0, rot = 0;
  const failures = [];

  files.forEach(spec => {
    const f = spec.file || '?';
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
    console.log(GRN('  ✓ ' + pass + ' בדיקות · 0 כשלים') + DIM('   (' + files.length + ' חלקים · ' + ms + ' מ״ש)'));
  } else {
    console.log(RED('  ✗ ' + fail + ' כשלים') + ' · ' + pass + ' עברו' + (rot ? YEL('  · ' + rot + ' קבצי ריקבון') : ''));
    failures.forEach(x => console.log('    ' + RED('· ') + x));
  }
  console.log('='.repeat(62) + '\n');
  process.exit(fail === 0 ? 0 : 1);
})();
