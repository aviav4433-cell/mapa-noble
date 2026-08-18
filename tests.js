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
      t.eq(inJs, 'v4.80-B80', 'ה-canary לא עודכן ל-B80');
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

    /* ⛔ B72/WASH-17 עדכן את הבדיקה הזו. הכוונה של B66 נשמרת במלואה — הזמנת
       כביסה אינה דורשת שורות ואפשר לאשר אותה ריקה (נאכף ב-approveOrder ונבדק
       ב-t18) — אבל הניסוח "אומדן כמותי" והבורר עצמו הוסרו: המלאי הוא של
       המכבסה, ולקוח שמביא וילונות משלו אינו נספר בו. */
    '⭐ כרטיס הזמנת כביסה — תיאור חופשי במקום בורר מלאי (B66 + WASH-17)': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.orders = [{ id: 'O1', type: 'כביסה', customer_id: 'C1', status: 'טיוטה',
                       start_date: '2026-09-01', end_date: '2026-09-03' }];
      w.openOrder('O1');
      const html = w.el('modal').innerHTML;
      t.has(html, 'תיאור הכביסה', 'מקטע התיאור החופשי חסר בכרטיס הזמנת הכביסה');
      t.has(html, 'החיוב לפי משקל בקליטה', 'ההסבר שהחיוב מגיע מהשקילה נעלם');
      t.has(html, 'w17DescForm(', 'אין דרך לפתוח את טופס התיאור');
      t.hasNot(html, '+ הוסף פריט', '⛔⛔ WASH-17: הבורר חזר להזמנת כביסה');
      t.hasNot(html, 'addLineForm(', '⛔⛔ WASH-17: קריאה ל-addLineForm נשארה בכרטיס כביסה');
      w.closeModal();
    },

    '⛔ כרטיס הזמנת השכרה לא קיבל את שפת האומדן': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.orders = [{ id: 'O1', type: 'השכרה', customer_id: 'C1', status: 'טיוטה',
                       start_date: '2026-09-01', end_date: '2026-09-03' }];
      w.openOrder('O1');
      const html = w.el('modal').innerHTML;
      t.hasNot(html, 'מחיר (אומדן)', 'עמודת המחיר בהשכרה סומנה כאומדן');
      t.hasNot(html, 'תיאור הכביסה', 'הזמנת השכרה קיבלה את מקטע הכביסה');
      /* ⛔ WASH-17: הבורר בהשכרה חייב להישאר בדיוק כמו שהיה */
      t.has(html, '+ הוסף פריט', '⛔⛔ WASH-17 הסיר את הבורר גם מהשכרה — רגרסיה');
      t.has(html, "addLineForm('O1')", '⛔ הכפתור בהשכרה כבר אינו קורא ל-addLineForm');
      w.closeModal();
    },

    '⛔ B64a — סוג עם רווח מקבל את אותה תווית בדיוק כמו בשרת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.orders = [{ id: 'O1', type: ' כביסה\u00A0', customer_id: 'C1', status: 'טיוטה',
                       start_date: '2026-09-01', end_date: '2026-09-03' }];
      w.openOrder('O1');
      const dirty = w.el('modal').innerHTML;
      t.has(dirty, 'תיאור הכביסה',
        'סוג עם רווח קיבל כרטיס השכרה בזמן שהשרת מאשר אותו כביסה — אי-אחידות');
      t.hasNot(dirty, '+ הוסף פריט',
        '⛔⛔ סוג מלוכלך עוקף את WASH-17 והבורר חוזר — בדיוק הבאג של B64a');
      w.closeModal();
    },

    '⛔ ההודעה אחרי שמירת הזמנה אינה דורשת פריטים בכביסה': (t, { w, H }) => {
      const src = H.stripComments(H.uiScript());
      /* WASH-17: אין יותר "אומדן כמותי" בכביסה — ההודעה מפנה לתיאור החופשי */
      t.has(src, 'אפשר להוסיף תיאור קצר (לא חובה)', 'הודעת הכביסה לא נוספה');
      t.hasNot(src, 'אפשר להוסיף אומדן כמותי', 'הניסוח הישן של B66 נשאר לצד החדש');
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


/* ============================================================================
   t15 — B69 / WASH-04: מודול NOBLE עובר את כלל B64a
   ----------------------------------------------------------------------------
   הבאג, ואיך הוא נראה למשתמש: ערך שנקרא מגיליון עלול לחזור עם רווח נגרר,
   רווח קשיח (\u00A0 — נוצר בהדבקה מדפדפן) או תו כיווניות בלתי נראה
   (\u200F — נוצר בהקלדת עברית). כל אחד מהם שובר השוואת מחרוזת מדויקת,
   **והכשל שקט**: אין שגיאה, אין חריגה. במסלול הכביסה זה התבטא בכך ש-
   `total_charge` יצא אפס, שקליטה שנמסרה לא נכנסה לחשבונית לעולם, ושספר
   החיובים פשוט לא הכיר בחיוב.

   ⛔ מה הבדיקות האלה מוכיחות, ומה לא:
   · הן מוכיחות שההתנהגות **זהה** לערך הנקי — לא רק שההשוואה מנורמלת.
   · לאתרי הכסף יש בדיקה נפרדת שמוכיחה שהחיוב **נוצר, בסכום הנכון**.
   · יש בדיקה מפורשת שאף ערך מנורמל **לא נכתב חזרה לגיליון** — הנרמול
     הוא להשוואה בלבד, ואתר שכותב את הערך המנורמל הוא באג ולא תיקון.

   ⚠ שכבה 2: WASH-04 אינו נוגע ביכולת דפדפן. אין כאן טענה ל-b61Tests().
   ============================================================================ */

/* שלוש צורות הלכלוך שנצפו בגיליון. הראשונה נקייה — היא קו הבסיס. */
const W04_DIRT = [
  { n: 'נקי', f: s => s },
  { n: 'רווח נגרר', f: s => s + ' ' },
  { n: 'רווח קשיח \\u00A0', f: s => s + '\u00A0' },
  { n: 'תו כיווניות \\u200F', f: s => '\u200F' + s + ' ' }
];

const W04 = {
  /* קליטה חיצונית באמצע הצינור — עגלה משויכת, מוכנה לשקילה */
  db(srv, over) {
    over = over || {};
    const db = H.emptyDb(srv);
    db.employees = [{ id: 'E1', name: 'עובד', pin: '111', active: 'כן' }];
    db.customers = [{ id: 'C1', name: 'לקוח', active: 'כן', price_per_kg: 10 }];
    db.carts = [{ id: 'CA1', barcode: 'CA1', status: 'בשימוש', tare_kg: 5, condition: 'תקינה' }];
    db.machines = [{ id: 'M1', barcode: 'M1', type: 'מכונת כביסה', status: 'פעילה', auto_stage: 'בכביסה', capacity: 50 }];
    db.laundryIntakes = [{
      id: 'IK1', customer_id: over.internal ? '' : 'C1', internal: over.internal || '',
      status: over.status || 'באריזה', price_per_kg: 10, net_weight_kg: '', total_charge: '',
      intake_ts: '2026-08-01 08:00', delivered_ts: '', delivery_id: '', order_id: '',
      ready_ts: '', invoice_id: '', notes: ''
    }];
    db.intakeCarts = [{ id: 'IC1', intake_id: 'IK1', cart_id: 'CA1', active: 'כן', bind_ts: '', release_ts: '' }];
    return db;
  },
  /* מלכלך כל שדה טקסט שנקרא מגיליון במודול NOBLE — ורק אותם */
  soil(db, f) {
    (db.laundryIntakes || []).forEach(i => { i.status = f(i.status); if (i.internal) i.internal = f(i.internal); });
    (db.intakeCarts || []).forEach(b => { b.active = f(b.active); });
    (db.laundryEvents || []).forEach(e => { e.event_type = f(e.event_type); e.stage = f(e.stage); });
    (db.carts || []).forEach(c => { c.status = f(c.status); if (c.condition) c.condition = f(c.condition); if (c.virtual) c.virtual = f(c.virtual); });
    (db.machines || []).forEach(m => { m.status = f(m.status); m.auto_stage = f(m.auto_stage); });
    (db.employees || []).forEach(e => { e.active = f(e.active); });
    (db.customers || []).forEach(c => { c.active = f(c.active); });
    return db;
  },
  ledgerSum(srv, db) {
    srv.b54Bump();
    return srv.b54Ledger(db).reduce((s, r) => s + r.net_ag, 0);
  }
};


SPECS.push({
  file: 't15-b69-wash04',
  title: 'B69 / WASH-04 — נרמול B64a במודול NOBLE (שרת)',
  needs: 'server',
  requires: ['sVal', 'sPick', 'NOBLE_STAGES', 'NOBLE_MACHINE_STAGES', 'NOBLE_WORK_STAGES',
             'nobleIntake', 'nobleStageStart', 'nobleStageEnd', 'nobleWeigh', 'nobleMarkReady',
             'nobleDriverScan', 'nobleDeliver', 'nobleCartInfo', 'nobleBoard', 'nobleMachineLoad',
             'nobleWeighRollup', 'nobleOpenStarts', 'nobleReleaseCart', 'nobleCreateInvoice',
             'b54Ledger', 'b54Bump', 'b48BalancesAg', 'b2CreditUsedAg',
             'b49cIntakeClosed', 'b49cAfterAdvance', 'b56CloseLaundryReturnLeg', 'b56CloseLaundryOrder',
             'b56IntakeOpen', 'B56_CLOSED_INTAKE', 'STAGES', 'b67PayOneRow', 'b68PayrollFor'],

  tests: {

    /* ---------- ⛔ אתרי הכסף. אלה הראשונים כי הם היקרים ביותר ---------- */

    '⛔ כסף 1: סיכום השקילות מחזיר את החיוב גם עם event_type מלוכלך': (t, { srv }) => {
      W04_DIRT.forEach(d => {
        const db = W04.db(srv);
        db.laundryEvents = [{ id: 'EV1', intake_id: 'IK1', cart_id: 'CA1', event_type: d.f('שקילה'),
          stage: d.f('באריזה'), net_kg: 20, charge: 200 }];
        const r = srv.nobleWeighRollup(db, 'IK1');
        t.eq(r.charge, 200, d.n + ' — ⛔ החיוב יצא אפס. השקילה לא נספרה, והלקוח לא חויב');
        t.eq(r.net, 20, d.n + ' — המשקל נטו אבד');
        t.eq(r.count, 1, d.n + ' — השקילה לא נספרה כלל');
      });
    },

    '⛔ כסף 2: שקילה יוצרת חיוב בסכום הנכון גם על נתונים מלוכלכים': (t, { srv }) => {
      W04_DIRT.forEach(d => {
        const db = W04.soil(W04.db(srv), d.f);
        const r = srv.nobleWeigh(db, { worker_pin: '111', cart_barcode: 'CA1', gross_kg: 25 }, 'מנהל');
        t.ok(r.ok, d.n + ' — השקילה נדחתה: ' + (r.error || ''));
        t.eq(r.charge, 200, d.n + ' — ⛔ החיוב שנוצר אינו 200 (20 ק"ג נטו × 10 ₪)');
        t.eq(db.laundryIntakes[0].total_charge, 200, d.n + ' — החיוב לא נרשם על הקליטה');
      });
    },

    '⛔ כסף 3: כביסה פנימית אינה מחויבת גם כש-internal מלוכלך': (t, { srv }) => {
      W04_DIRT.forEach(d => {
        const db = W04.soil(W04.db(srv, { internal: 'כן' }), d.f);
        const r = srv.nobleWeigh(db, { worker_pin: '111', cart_barcode: 'CA1', gross_kg: 25 }, 'מנהל');
        t.ok(r.ok, d.n + ' — ⛔ שקילת כביסה פנימית נדחתה: ' + (r.error || ''));
        t.eq(r.charge, 0, d.n + ' — ⛔ נוצר חיוב על כביסה פנימית של MAPA');
        t.eq(db.laundryIntakes[0].total_charge, 0, d.n + ' — חיוב פנימי נרשם על הקליטה');
      });
    },

    '⛔ כסף 4: חשבונית מכבסה מרוכזת אוספת קליטה שנמסרה גם עם status מלוכלך': (t, { srv }) => {
      W04_DIRT.forEach(d => {
        const db = W04.db(srv, { status: 'נמסר' });
        db.laundryIntakes[0].total_charge = 200;
        W04.soil(db, d.f);
        const r = srv.nobleCreateInvoice(db, { customer_id: 'C1' }, 'מנהל');
        t.ok(r.ok, d.n + ' — ⛔ הקליטה לא נכנסה לחשבונית: ' + (r.error || ''));
        t.eq(r.invoice.subtotal, 200, d.n + ' — סכום החשבונית שגוי');
        t.eq(r.count, 1, d.n + ' — מספר הקליטות בחשבונית שגוי');
      });
    },

    '⛔ כסף 5: ספר החיובים מחזיר אותו מספר לפני ואחרי הלכלוך (R6)': (t, { srv }) => {
      const clean = (() => {
        const db = W04.db(srv, { status: 'נמסר' });
        db.laundryIntakes[0].total_charge = 200;
        return W04.ledgerSum(srv, db);
      })();
      t.eq(clean, 20000, 'קו הבסיס עצמו שגוי — 200 ₪ הם 20,000 אגורות');
      W04_DIRT.forEach(d => {
        const db = W04.db(srv, { status: 'נמסר' });
        db.laundryIntakes[0].total_charge = 200;
        W04.soil(db, d.f);
        t.eq(W04.ledgerSum(srv, db), clean, d.n + ' — ⛔ ספר החיובים החזיר סכום אחר. R6 הופר');
      });
    },

    '⛔ כסף 6: יתרת הלקוח זהה בשלושת המקורות גם על נתונים מלוכלכים (R6)': (t, { srv }) => {
      /* ⚠ קליטה שנמסרה וטרם רוכזה לחשבונית היא `pending` ו-open_ag שלה אפס
         מתוכנן. כדי לבדוק יתרה אמיתית צריך חשבונית — אחרת הבדיקה מודדת אפס
         ומוכיחה כלום. */
      const mk = (f) => {
        const db = W04.db(srv, { status: 'נמסר' });
        db.laundryIntakes[0].total_charge = 200;
        db.laundryIntakes[0].invoice_id = 'INV1';
        db.invoices = [{ id: 'INV1', number: 1001, order_id: '', customer_id: 'C1',
          date: '2026-08-02', subtotal: 200, vat_rate: 0.18, vat: 36, total: 236, status: 'פתוחה' }];
        W04.soil(db, f);
        srv.b54Bump();
        return { bal: srv.b48BalancesAg(db)['C1'] || 0, credit: srv.b2CreditUsedAg(db, 'C1') };
      };
      const clean = mk(s => s);
      t.ok(clean.bal > 0, 'קו הבסיס עצמו אפס — הבדיקה אינה מוכיחה דבר');
      W04_DIRT.forEach(d => {
        const r = mk(d.f);
        t.eq(r.bal, clean.bal, d.n + ' — ⛔ יתרת הלקוח השתנתה בגלל ערך מלוכלך בקליטה');
        t.eq(r.credit, r.bal, d.n + ' — ⛔ מנוע האשראי וספר החיובים התפצלו (R6)');
      });
    },

    /* ---------- הצינור המלא, מקצה לקצה ---------- */

    '⭐ כל מסלול הכביסה עובד זהה כשכל ערך בגיליון מלוכלך': (t, { srv }) => {
      const run = (f) => {
        const db = H.emptyDb(srv);
        db.employees = [{ id: 'E1', name: 'עובד', pin: '111', active: f('כן') }];
        db.customers = [{ id: 'C1', name: 'לקוח', active: f('כן'), price_per_kg: 10 }];
        db.carts = [{ id: 'CA1', barcode: 'CA1', status: f('פנויה'), tare_kg: 5, condition: f('תקינה') }];
        db.machines = [{ id: 'M1', barcode: 'M1', type: 'מכונה', status: f('פעילה'), auto_stage: f('בכביסה'), capacity: 50 }];
        const steps = {};
        const soil = () => W04.soil(db, f);
        steps.intake = srv.nobleIntake(db, { worker_pin: '111', customer_id: 'C1', cart_barcodes: ['CA1'] }, 'מנהל');
        soil();
        steps.start = srv.nobleStageStart(db, { worker_pin: '111', cart_barcode: 'CA1', machine_barcode: 'M1', portion_kg: 10 }, 'מנהל');
        soil();
        steps.end = srv.nobleStageEnd(db, { worker_pin: '111', cart_barcode: 'CA1' }, 'מנהל');
        soil();
        steps.weigh = srv.nobleWeigh(db, { worker_pin: '111', cart_barcode: 'CA1', gross_kg: 25 }, 'מנהל');
        soil();
        steps.ready = srv.nobleMarkReady(db, { worker_pin: '111', cart_barcode: 'CA1' }, 'מנהל');
        soil();
        steps.scan = srv.nobleDriverScan(db, { worker_pin: '111', cart_barcode: 'CA1' }, 'מנהל');
        (db.deliveries || []).forEach(x => { x.status = f(x.status); x.signature_url = 'sig'; });
        soil();
        steps.deliver = srv.nobleDeliver(db, { worker_pin: '111', cart_barcode: 'CA1' }, 'מנהל');
        return { steps, db };
      };
      W04_DIRT.forEach(d => {
        const { steps, db } = run(d.f);
        ['intake', 'start', 'end', 'weigh', 'ready', 'scan', 'deliver'].forEach(k => {
          t.ok(steps[k] && steps[k].ok, d.n + ' — השלב "' + k + '" נכשל: ' + ((steps[k] || {}).error || 'ללא הודעה'));
        });
        t.eq(steps.start.stage, 'בכביסה', d.n + ' — השלב שנקבע מהמכונה אינו הערך הקנוני');
        t.eq(steps.weigh.charge, 200, d.n + ' — ⛔ החיוב לאורך הצינור שגוי');
        t.eq(srv.sVal(db.laundryIntakes[0].status), 'נמסר', d.n + ' — הקליטה לא נסגרה');
        t.eq(Number(db.laundryIntakes[0].total_charge), 200, d.n + ' — ⛔ החיוב על הקליטה שגוי');
      });
    },

    /* ---------- ⛔ הנרמול הוא להשוואה בלבד ---------- */

    '⛔ שום ערך מנורמל אינו נכתב חזרה לגיליון': (t, { srv }) => {
      /* הערכים המלוכלכים שאנחנו **לא** נוגעים בהם חייבים לחזור כמו שהם.
         אתר שמנקה את הגיליון אגב ההשוואה הוא באג, לא תיקון. */
      const db = W04.db(srv);
      db.customers[0].active = 'כן\u00A0';
      db.employees[0].active = 'כן\u00A0';
      db.machines[0].status = 'פעילה\u00A0';
      db.machines[0].auto_stage = 'בכביסה\u00A0';
      db.intakeCarts[0].active = 'כן\u00A0';
      db.carts[0].condition = 'תקינה\u00A0';
      srv.nobleWeigh(db, { worker_pin: '111', cart_barcode: 'CA1', gross_kg: 25 }, 'מנהל');
      srv.nobleCartInfo(db, { barcode: 'CA1' });
      srv.nobleBoard(db);
      srv.nobleMachineLoad(db);
      t.eq(db.customers[0].active, 'כן\u00A0', '⛔ ערך הלקוח נדרס בגרסה מנורמלת');
      t.eq(db.employees[0].active, 'כן\u00A0', '⛔ ערך העובד נדרס בגרסה מנורמלת');
      t.eq(db.machines[0].status, 'פעילה\u00A0', '⛔ סטטוס המכונה נדרס בגרסה מנורמלת');
      t.eq(db.machines[0].auto_stage, 'בכביסה\u00A0', '⛔ auto_stage נדרס בגרסה מנורמלת');
      t.eq(db.intakeCarts[0].active, 'כן\u00A0', '⛔ שיוך העגלה נדרס בגרסה מנורמלת');
      t.eq(db.carts[0].condition, 'תקינה\u00A0', '⛔ מצב העגלה נדרס בגרסה מנורמלת');
    },

    '⛔ sVal לא הוחל על כסף, על משקל או על מזהים': (t, { H }) => {
      const sv = H.stripComments(H.serverSrc());
      ['sVal(ik.total_charge', 'sVal(i.total_charge', 'sVal(e.charge', 'sVal(e.net_kg',
       'sVal(gross', 'sVal(net)', 'sVal(m.capacity', 'sVal(ev.portion_kg', 'sVal(amtAg',
       'sVal(ik.id', 'sVal(cart.id', 'sVal(mach.id'
      ].forEach(bad => t.hasNot(sv, bad, 'sVal הוחל על ערך מספרי או על מזהה — שם ההשוואה אינה טקסטואלית'));
    },

    /* ---------- sPick מחזיר '' — טיפול מפורש ---------- */

    "⛔ sPick שמחזיר '' מקבל טיפול ואינו ממשיך בשקט": (t, { srv }) => {
      const db = W04.db(srv, { status: 'התקבל' });
      db.machines[0].auto_stage = 'שלב שלא קיים';
      const r = srv.nobleStageStart(db, { worker_pin: '111', cart_barcode: 'CA1', machine_barcode: 'M1' }, 'מנהל');
      t.no(r.ok, "⛔ שלב שאינו ברשימה התקבל — sPick החזיר '' וההרצה המשיכה בשקט");
      t.has(r.error, 'לא הוגדר שלב אוטומטי', 'ההודעה אינה מסבירה מה לתקן');
      t.eq((db.laundryEvents || []).length, 0, '⛔ נרשם אירוע ביומן למרות שהשלב נדחה');
      t.eq(srv.sVal(db.laundryIntakes[0].status), 'התקבל', 'סטטוס הקליטה שונה למרות הדחייה');
    },

    '⭐ השלב שנרשם ביומן הוא הערך הקנוני, לא הערך המלוכלך מהגיליון': (t, { srv }) => {
      const db = W04.db(srv, { status: 'התקבל' });
      db.machines[0].auto_stage = 'בכביסה\u00A0';
      const r = srv.nobleStageStart(db, { worker_pin: '111', cart_barcode: 'CA1', machine_barcode: 'M1' }, 'מנהל');
      t.ok(r.ok, 'התחלת השלב נדחתה: ' + (r.error || ''));
      t.eq(r.stage, 'בכביסה', 'sPick לא החזיר את הערך הקנוני מ-NOBLE_MACHINE_STAGES');
      t.eq(db.laundryEvents[0].stage, 'בכביסה', '⛔ ערך מלוכלך נכתב לתוך יומן האירועים והבאג היה מתרבה');
      t.eq(db.laundryIntakes[0].status, 'בכביסה', '⛔ ערך מלוכלך נכתב לסטטוס הקליטה');
      t.eq(db.machines[0].auto_stage, 'בכביסה\u00A0', '⛔ הגיליון עצמו נדרס — הנרמול הוא להשוואה בלבד');
    },

    /* ---------- מסכי קריאה ---------- */

    'לוח הרצפה, תפוסת המכונות וכרטיס העגלה זהים על נתונים מלוכלכים': (t, { srv }) => {
      const base = (() => {
        const db = W04.db(srv);
        db.laundryEvents = [{ id: 'EV1', intake_id: 'IK1', cart_id: 'CA1', machine_id: 'M1',
          event_type: 'התחלה', stage: 'בכביסה', portion_kg: 10, ts: '2026-08-01 09:00' }];
        return db;
      });
      const ref = (() => {
        const db = base();
        return { board: srv.nobleBoard(db), load: srv.nobleMachineLoad(db), info: srv.nobleCartInfo(db, { barcode: 'CA1' }) };
      })();
      t.eq(ref.board.intakes.length, 1, 'קו הבסיס עצמו ריק — הבדיקה אינה מוכיחה דבר');
      t.eq((ref.load['M1'] || []).length, 1, 'קו הבסיס: המנה אינה במכונה');
      W04_DIRT.forEach(d => {
        const db = W04.soil(base(), d.f);
        const board = srv.nobleBoard(db);
        const load = srv.nobleMachineLoad(db);
        const info = srv.nobleCartInfo(db, { barcode: 'CA1' });
        t.eq(board.intakes.length, 1, d.n + ' — הקליטה נעלמה מהלוח החי');
        t.eq(board.intakes[0].carts.length, 1, d.n + ' — העגלה נעלמה מהלוח');
        t.eq((load['M1'] || []).length, 1, d.n + ' — המנה נעלמה מתפוסת המכונה');
        t.eq(info.machines.length, 1, d.n + ' — המכונה נעלמה מבורר המכונות בכרטיס העגלה');
        t.eq(info.bound_carts.length, 1, d.n + ' — העגלה המשויכת נעלמה מכרטיס העגלה');
        t.eq(info.price_per_kg, ref.info.price_per_kg, d.n + ' — ⛔ המחיר לק"ג השתנה');
      });
    },

    'שחרור עגלה ושיוך מחדש עובדים על נתונים מלוכלכים': (t, { srv }) => {
      W04_DIRT.forEach(d => {
        const db = W04.soil(W04.db(srv, { status: 'מוכן' }), d.f);
        const r = srv.nobleReleaseCart(db, { worker_pin: '111', cart_barcode: 'CA1' }, 'מנהל');
        t.ok(r.ok, d.n + ' — שחרור העגלה נכשל: ' + (r.error || ''));
        t.eq(srv.sVal(db.carts[0].status), 'פנויה', d.n + ' — ⛔ העגלה נשארה תקועה "בשימוש"');
        t.eq(srv.sVal(db.intakeCarts[0].active), 'לא', d.n + ' — השיוך לא נסגר');
      });
    },

    /* ---------- ⛔ R4 — מה שאסור היה להשתנות ---------- */

    '⛔ R4 — מנגנוני B56 · B67 · B68 לא נפגעו': (t, { srv, H }) => {
      const sv = H.stripComments(H.serverSrc());
      t.eq(srv.B56_CLOSED_INTAKE, 'נמסר', 'B56_CLOSED_INTAKE שונה');
      ['function b56IntakeOpen', 'function b56CloseLaundryReturnLeg', 'function b56CloseLaundryOrder',
       'function b49cAfterAdvance', 'function b40SplitLaundry', 'function b54Ledger',
       'function b67PayOneRow', 'B67_WRITE_DEFER', 'function b68PayrollFor',
       'function b68MergePayroll', 'function b68EmployeeOverpay'
      ].forEach(n => t.has(sv, n, 'מנגנון חסין נעלם מהשרת: ' + n));
      t.eq(srv.STAGES.join('|'), 'התקבל|בכביסה|בייבוש|בגיהוץ וקיפול|מוכן', 'STAGES שונתה');
      t.eq(srv.NOBLE_STAGES.length, 8, 'NOBLE_STAGES שונתה');
      t.eq(srv.NOBLE_MACHINE_STAGES.join('|'), 'בכביסה|בייבוש|בגיהוץ וקיפול|באריזה', 'NOBLE_MACHINE_STAGES שונתה');
    },

    '⛔ B67_WRITE_DEFER חוזר ל-null — נרמול NOBLE לא נגע במסלול הכתיבה של השכר': (t, { srv }) => {
      t.eq(srv.B67_WRITE_DEFER, null, '⛔ מאגר הכתיבה הדחויה של B67 נשאר פתוח');
    },

    'b49cIntakeClosed מזהה קליטה סגורה גם עם status מלוכלך': (t, { srv }) => {
      W04_DIRT.forEach(d => {
        t.ok(srv.b49cIntakeClosed({ status: d.f('מוכן') }), d.n + ' — קליטה מוכנה לא זוהתה כסגורה');
        t.ok(srv.b49cIntakeClosed({ status: d.f('נמסר') }), d.n + ' — קליטה שנמסרה לא זוהתה כסגורה');
        t.no(srv.b49cIntakeClosed({ status: d.f('בכביסה') }), d.n + ' — קליטה פעילה סומנה כסגורה');
      });
    }

  }
});


SPECS.push({
  file: 't15b-b69-wash04-ui',
  title: 'B69 / WASH-04 — נרמול B64a במודול NOBLE (ממשק)',
  needs: 'ui',
  requires: ['sVal', 'sPick', 'NOBLE_STAGES', 'b54LedgerFE', 'b48BalancesAgFE', 'custBalance',
             'internalIntakeSet', 'b49cCompletedTs', 'b49bIsVirtual', 'b49dIntakeCartCount',
             'nobleSummaryData', 'floorRenderInfo', 'floorBoardRender', 'rFloor', 'el',
             'openModal', 'closeModal', 'go', 'b61Tests'],

  tests: {

    '⛔ כסף: ספר החיובים בממשק מחזיר אותו מספר לפני ואחרי הלכלוך (R6)': (t, { w, srv, H }) => {
      const build = (f) => {
        H.login(w, 'מנהל', srv);
        w.DB.customers = [{ id: 'C1', name: 'לקוח', active: f('כן') }];
        w.DB.laundryIntakes = [{ id: 'IK1', customer_id: 'C1', internal: '', status: f('נמסר'),
          total_charge: 200, net_weight_kg: 20, delivered_ts: '2026-08-02 10:00',
          intake_ts: '2026-08-01 08:00', invoice_id: '', order_id: '' }];
        delete w.DB._b54Ledger;
        return w.b54LedgerFE().reduce((s, r) => s + r.net_ag, 0);
      };
      const clean = build(s => s);
      t.eq(clean, 20000, 'קו הבסיס שגוי — 200 ₪ הם 20,000 אגורות');
      [s => s + ' ', s => s + '\u00A0', s => '\u200F' + s + ' '].forEach((f, i) => {
        t.eq(build(f), clean, '⛔ ספר החיובים בממשק החזיר סכום אחר על לכלוך מסוג ' + i + '. R6 הופר');
      });
    },

    '⛔ כסף: יתרת הלקוח במסך הגבייה זהה על נתונים מלוכלכים': (t, { w, srv, H }) => {
      const bal = (f) => {
        H.login(w, 'מנהל', srv);
        w.DB.customers = [{ id: 'C1', name: 'לקוח', active: f('כן') }];
        w.DB.laundryIntakes = [{ id: 'IK1', customer_id: 'C1', internal: '', status: f('נמסר'),
          total_charge: 200, net_weight_kg: 20, delivered_ts: '2026-08-02 10:00',
          intake_ts: '2026-08-01 08:00', invoice_id: 'INV1', order_id: '' }];
        /* ⚠ קליטה שטרם רוכזה לחשבונית היא pending ו-open שלה אפס מתוכנן.
           בלי חשבונית הבדיקה מודדת אפס ואינה מוכיחה דבר. */
        w.DB.invoices = [{ id: 'INV1', number: 1001, order_id: '', customer_id: 'C1',
          date: '2026-08-02', subtotal: 200, vat_rate: 0.18, vat: 36, total: 236, status: 'פתוחה' }];
        delete w.DB._b54Ledger;
        return w.custBalance('C1');
      };
      const clean = bal(s => s);
      t.ok(clean > 0, 'קו הבסיס עצמו אפס — הבדיקה אינה מוכיחה דבר');
      [s => s + ' ', s => s + '\u00A0', s => '\u200F' + s + ' '].forEach((f, i) => {
        t.eq(bal(f), clean, '⛔ יתרת הלקוח השתנתה על לכלוך מסוג ' + i);
      });
    },

    'סימון כביסה פנימית וספירת העגלות עמידים ללכלוך': (t, { w, srv, H }) => {
      [s => s, s => s + ' ', s => s + '\u00A0', s => '\u200F' + s + ' '].forEach((f, i) => {
        H.login(w, 'מנהל', srv);
        w.DB.laundryIntakes = [{ id: 'IK1', internal: f('כן'), status: f('מוכן'), ready_ts: '2026-08-01 12:00' },
                               { id: 'IK2', internal: '', status: f('בכביסה') }];
        w.DB.intakeCarts = [{ id: 'IC1', intake_id: 'IK1', cart_id: 'CA1', active: f('כן') },
                            { id: 'IC2', intake_id: 'IK1', cart_id: 'CA2', active: f('לא') }];
        w.DB.carts = [{ id: 'CA1', virtual: f('כן') }, { id: 'CA2', virtual: '' }];
        t.ok(w.internalIntakeSet()['IK1'], i + ' — קליטה פנימית לא זוהתה');
        t.no(!!w.internalIntakeSet()['IK2'], i + ' — קליטה חיצונית סומנה כפנימית');
        t.eq(w.b49cCompletedTs(w.DB.laundryIntakes[0]), '2026-08-01 12:00', i + ' — מועד ההשלמה של קליטה פנימית אבד');
        t.eq(w.b49dIntakeCartCount('IK1'), 1, i + ' — ספירת העגלות המשויכות שגויה');
        t.ok(w.b49bIsVirtual(w.DB.carts[0]), i + ' — עגלה וירטואלית לא זוהתה');
        t.no(w.b49bIsVirtual(w.DB.carts[1]), i + ' — עגלה פיזית סומנה כווירטואלית');
      });
    },

    'דוח ביצועי המכבסה סופר אותם קילוגרמים על נתונים מלוכלכים': (t, { w, srv, H }) => {
      const kg = (f) => {
        H.login(w, 'מנהל', srv);
        w.DB.laundryIntakes = [
          { id: 'IK1', internal: '', status: f('נמסר'), net_weight_kg: 20, total_charge: 200, delivered_ts: '2026-08-07 10:00' },
          { id: 'IK2', internal: f('כן'), status: f('מוכן'), net_weight_kg: 50, total_charge: 0, ready_ts: '2026-08-07 10:00' }
        ];
        return w.nobleSummaryData(30);
      };
      const clean = kg(s => s);
      t.eq(clean.del, 2, 'קו הבסיס: שתי הקליטות אמורות להיספר כהושלמו');
      [s => s + ' ', s => s + '\u00A0', s => '\u200F' + s + ' '].forEach((f, i) => {
        const r = kg(f);
        t.eq(r.del, clean.del, i + ' — מספר הקליטות שהושלמו השתנה');
        t.eq(r.kg, clean.kg, i + ' — ⛔ הקילוגרמים בדוח השתנו. כביסה פנימית נספרה או נשמטה בטעות');
        t.eq(r.rev, clean.rev, i + ' — ההכנסות בדוח השתנו');
      });
    },

    '⭐ כרטיס העגלה ברצפת הייצור מצויר זהה גם עם סטטוס מלוכלך (R7)': (t, { w, srv, H }) => {
      const draw = (f) => {
        H.login(w, 'מנהל', srv);
        w.go('floor');
        w.FLOOR_INFO = {
          ok: true,
          cart: { id: 'CA1', status: f('בשימוש'), tare_kg: 5 },
          intake: { id: 'IK1', status: f('מוכן'), internal: f('כן'), customer_id: '' },
          customer_name: 'פנימי — MAPA', price_per_kg: 0, bound_carts: ['CA1'],
          open_stage: '', open_machine: '', cart_released: false, opens: [],
          machines: [{ id: 'M1', type: 'מכונה', status: f('פעילה'), auto_stage: f('בכביסה'), capacity: 50, load_kg: 0, load_count: 0 }],
          weighed: { net: 20, charge: 0, count: 1, carts: ['CA1'] }
        };
        w.floorRenderInfo();
        return w.el('floorInfo') ? w.el('floorInfo').innerHTML : '';
      };
      /* ⛔ מה שמושווה הוא **המבנה**: הצבע, הכפתורים והמסלול שנבחר.
         טקסט הסטטוס עצמו מוצג כפי שהוא בגיליון — וזה מכוון: המסך מראה
         למשתמש את הערך האמיתי, ולא גרסה מנוקה שתסתיר ממנו את התקלה. */
      const shape = (h) => h.replace(/>[^<]*</g, '><').replace(/\s+/g, ' ');
      const clean = draw(s => s);
      t.ok(clean.length > 50, 'קו הבסיס: כרטיס העגלה לא צויר כלל');
      t.has(clean, 'floorDriver()', 'קו הבסיס: כפתור סריקת הנהג חסר בקליטה מוכנה');
      [s => s + ' ', s => s + '\u00A0', s => '\u200F' + s + ' '].forEach((f, i) => {
        const dirty = draw(f);
        t.ok(dirty.length > 50, i + ' — ⛔ הכרטיס לא צויר. זה בדיוק המסך שלא מגיב');
        t.eq(shape(dirty), shape(clean), i + ' — מבנה הכרטיס, הצבעים או הכפתורים השתנו');
        t.has(dirty, 'floorDriver()', i + ' — ⛔ כפתור ההעמסה נעלם. הקליטה תיתקע ב"מוכן"');
        t.has(dirty, 'var(--teal)', i + ' — צבע התג השתנה — הסטטוס לא זוהה');
      });
    },

    '⛔ sVal לא הוחל על כסף או על מספרים בממשק': (t, { H }) => {
      const ui = H.stripComments(H.uiScript());
      ['sVal(ik.total_charge', 'sVal(i.total_charge', 'sVal(i.net_weight_kg', 'sVal(e.net_kg',
       'sVal(amtAg', 'sVal(m.capacity', 'sVal(c.tare_kg', 'sVal(x.amount', 'sVal(o.total'
      ].forEach(bad => t.hasNot(ui, bad, 'sVal הוחל על ערך כספי או מספרי — שם ההשוואה מספרית'));
    },

    '⛔ sVal/sPick נשארו זהים תו-בתו בין הממשק לשרת (B64a)': (t, { H }) => {
      const grab = (src, name) => {
        const m = H.stripComments(src).match(new RegExp('function ' + name + '\\([\\s\\S]*?\\n\\}'));
        return m ? m[0].replace(/\s+/g, '') : '';
      };
      ['sVal', 'sPick'].forEach(fn => {
        const a = grab(H.uiScript(), fn), b = grab(H.serverSrc(), fn);
        t.ok(a.length > 0, fn + ' חסר בממשק');
        t.eq(a, b, fn + ' התפצל בין הממשק לשרת — ההתנהגות תשתנה בין הצדדים');
      });
    },

    '⛔ שכבה 2 לא נגעה — WASH-04 אינו נוגע ביכולת דפדפן': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const names = w.b61Tests().map(x => x.n);
      t.ok(names.length > 0, 'כרטיס הבדיקה העצמית התרוקן');
      t.no(names.join(' | ').indexOf('WASH') > -1, '⛔ נוספה טענה ל-b61Tests למרות שהאצווה אינה נוגעת ביכולת דפדפן');
    }

  }
});



/* ==================== t16 — B70 / WASH-03: עגלה שחוזרת לאותה קליטה ====================
   ⛔ הבאג שנסגר כאן: nobleWeighRollup ספרה את **השקילה האחרונה של כל עגלה**
   ומחקה בשקט את כל מה שקדם לה. עגלה שהתרוקנה וחזרה לקלוט מאותה הזמנה
   נשקלת שוב בשעה אחרת — 10:00, 12:00, 15:00 — וכל אחת מהן היא כביסה
   אמיתית שהלקוח חייב עליה.
   ⚠ כל בדיקה כאן נכתבה כך שהיא **נכשלת על הקוד שלפני B70**. */

const B70 = {
  /* קליטה חיצונית באמצע הצינור, עגלה CA1 משויכת. מחיר 10 ₪ לק"ג, טרה 5 */
  db(srv, over) {
    over = over || {};
    const db = H.emptyDb(srv);
    db.employees = [{ id: 'E1', name: 'עובד', pin: '111', active: 'כן', role: 'מכבסה' },
                    { id: 'E9', name: 'המנהל', pin: '999', active: 'כן', role: 'מנהל' }];
    db.customers = [{ id: 'C1', name: 'לקוח', active: 'כן', price_per_kg: 10 }];
    db.carts = [{ id: 'CA1', barcode: 'CA1', status: 'בשימוש', tare_kg: 5, condition: 'תקינה' },
                { id: 'CA2', barcode: 'CA2', status: 'בשימוש', tare_kg: 5, condition: 'תקינה' }];
    db.machines = [{ id: 'M1', barcode: 'M1', type: 'מכונת כביסה', status: 'פעילה', auto_stage: 'בכביסה', capacity: 50 }];
    db.laundryIntakes = [{
      id: 'IK1', customer_id: over.internal ? '' : 'C1', internal: over.internal || '',
      status: over.status || 'באריזה', price_per_kg: 10, net_weight_kg: '', total_charge: '',
      intake_ts: '2026-08-01 08:00', delivered_ts: '', delivery_id: '', order_id: '',
      ready_ts: '', invoice_id: '', notes: ''
    }];
    db.intakeCarts = [{ id: 'IC1', intake_id: 'IK1', cart_id: 'CA1', active: 'כן', bind_ts: '', release_ts: '' }];
    return db;
  },
  /* שקילה עם שעה מפורשת — הרתמה מזייפת שעון, ולכן ts נקבע כאן ידנית */
  weigh(db, gross, hhmm, cart) {
    const tare = 5, net = Math.round((gross - tare) * 100) / 100;
    const ev = {
      id: 'EVT-W' + (db.laundryEvents.length + 1), ts: '2026-08-01 ' + hhmm + ':00',
      intake_id: 'IK1', customer_id: db.laundryIntakes[0].customer_id, cart_id: cart || 'CA1',
      machine_id: '', stage: 'באריזה', event_type: 'שקילה', worker_id: 'E1', worker_name: 'עובד',
      gross_kg: gross, tare_kg: tare, net_kg: net,
      price_per_kg: db.laundryIntakes[0].internal ? 0 : 10,
      charge: db.laundryIntakes[0].internal ? 0 : Math.round(net * 10 * 100) / 100,
      note: '', portion_kg: '', ref_id: ''
    };
    db.laundryEvents.push(ev);
    return ev;
  },
  ev(db, type, cart, hhmm) {
    const e = {
      id: 'EVT-' + type + (db.laundryEvents.length + 1), ts: '2026-08-01 ' + (hhmm || '09:00') + ':00',
      intake_id: 'IK1', customer_id: 'C1', cart_id: cart || 'CA1', machine_id: 'M1',
      stage: 'בכביסה', event_type: type, worker_id: 'E1', worker_name: 'עובד',
      gross_kg: '', tare_kg: '', net_kg: '', price_per_kg: '', charge: '', note: '', portion_kg: '', ref_id: ''
    };
    db.laundryEvents.push(e);
    return e;
  }
};

SPECS.push({
  file: 't16-b70-wash03-srv',
  title: 'B70 / WASH-03 — כל שקילה היא חיוב בפני עצמה (שרת)',
  needs: 'server',
  requires: ['nobleWeighRollup', 'b70Weighs', 'b70CartNeedsWeigh', 'b70Seq', 'nobleWeighFix',
             'nobleWeigh', 'nobleMarkReady', 'nobleCartInfo', 'nobleBoard', 'b38VerifyManagerPin',
             'b54Ledger', 'b54Bump', 'b48BalancesAg', 'b2CreditUsedAg', 'TABLES',
             'READ_ONLY_ACTIONS', 'handle', 'sVal', 'nobleEventsOf', 'appendRowToTable'],

  tests: {

    /* ---------- ⛔ הבאג עצמו. הבדיקה הזו נכשלת על הקוד שלפני B70 ---------- */

    '⭐⭐ הדוגמה של אבי: עגלה 001 נשקלה ב-10:00, 12:00 ו-15:00 — שלושת החיובים קיימים': (t, { srv }) => {
      const db = B70.db(srv);
      B70.weigh(db, 25, '10:00');   // נטו 20 → ₪200
      B70.weigh(db, 35, '12:00');   // נטו 30 → ₪300
      B70.weigh(db, 15, '15:00');   // נטו 10 → ₪100
      const roll = srv.nobleWeighRollup(db, 'IK1');
      t.eq(roll.charge, 600, '⛔ החיוב אינו סכום שלוש השקילות. זה בדיוק WASH-03 — שקילה מאוחרת מחקה את הקודמות');
      t.eq(roll.net, 60, '⛔ המשקל הנטו אינו סכום שלוש השקילות');
      t.eq(roll.weighs.length, 3, 'לא הוחזרו שלוש שורות שקילה');
      t.eq(roll.weighs.map(x => x.seq).join(','), '1,2,3', 'מספור השקילות של העגלה שגוי');
      t.eq(roll.carts.length, 1, 'העגלה נספרה יותר מפעם אחת ברשימת העגלות שנשקלו');
    },

    'שתי עגלות, אחת מהן בשני מחזורים — כל ארבע השקילות נספרות': (t, { srv }) => {
      const db = B70.db(srv);
      db.intakeCarts.push({ id: 'IC2', intake_id: 'IK1', cart_id: 'CA2', active: 'כן' });
      B70.weigh(db, 25, '10:00', 'CA1');   // ₪200
      B70.weigh(db, 15, '11:00', 'CA2');   // ₪100
      B70.weigh(db, 35, '13:00', 'CA1');   // ₪300
      B70.weigh(db, 25, '16:00', 'CA2');   // ₪200
      const roll = srv.nobleWeighRollup(db, 'IK1');
      t.eq(roll.charge, 800, '⛔ סכום החיוב של שתי עגלות בשני מחזורים שגוי');
      t.eq(roll.carts.length, 2, 'רשימת העגלות שנשקלו שגויה');
      t.eq(srv.b70Weighs(db, 'IK1', 'CA1').length, 2, 'לא הוחזרו שתי שקילות ל-CA1');
      t.eq(srv.b70Weighs(db, 'IK1', 'CA2').map(x => x.seq).join(','), '1,2', 'מספור השקילות של CA2 שגוי');
    },

    'שקילה דרך nobleWeigh — נוספת ולא דורסת, ומחזירה את מספר השקילה': (t, { srv }) => {
      const db = B70.db(srv);
      const r1 = srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 25 }, 'עובד');
      t.ok(r1.ok, 'השקילה הראשונה נדחתה: ' + r1.error);
      t.eq(r1.cart_seq, 1, 'מספר השקילה הראשונה אינו 1');
      const r2 = srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 35 }, 'עובד');
      t.ok(r2.ok, '⛔ שקילה שנייה של אותה עגלה נדחתה — מחזור נוסף הוא מציאות אמיתית: ' + r2.error);
      t.eq(r2.cart_seq, 2, 'מספר השקילה השנייה אינו 2');
      t.eq(db.laundryIntakes[0].total_charge, 500, '⛔ total_charge אינו סכום שתי השקילות — החיוב הראשון נמחק');
      t.eq(db.laundryIntakes[0].net_weight_kg, 50, 'המשקל הנטו של הקליטה אינו סכום שתי השקילות');
    },

    /* ---------- תיקון מנהל: שורה חדשה, לא דריסה ---------- */

    '⭐ תיקון מנהל — רק הערך המתוקן נספר, והשקילה השנייה לא נגעה': (t, { srv }) => {
      const db = B70.db(srv);
      const e1 = B70.weigh(db, 25, '10:00');   // ₪200
      B70.weigh(db, 35, '12:00');              // ₪300
      const r = srv.nobleWeighFix(db, { event_id: e1.id, gross_kg: 15, reason: 'הוזן ברוטו שגוי', mgr_pin: '999' }, 'המנהל');
      t.ok(r.ok, 'התיקון נדחה: ' + r.error);
      const roll = srv.nobleWeighRollup(db, 'IK1');
      t.eq(roll.charge, 400, '⛔ אחרי תיקון הראשונה ל-₪100, הסך אמור להיות 400 (100+300)');
      t.eq(roll.weighs.length, 2, 'מספר שורות השקילה השתנה — התיקון אינו אמור ליצור שורה נוספת בתצוגה');
      t.ok(roll.weighs[0].fixed, 'השורה הראשונה לא סומנה כמתוקנת');
      t.no(roll.weighs[1].fixed, 'השורה השנייה סומנה כמתוקנת בטעות');
      t.eq(db.laundryIntakes[0].total_charge, 400, 'total_charge לא עודכן אחרי התיקון');
    },

    '⛔ append-only — התיקון מוסיף שורה ליומן ואינו נוגע בשורה המקורית': (t, { srv }) => {
      const db = B70.db(srv);
      const e1 = B70.weigh(db, 25, '10:00');
      const before = JSON.stringify(e1);
      const n = db.laundryEvents.length;
      srv.nobleWeighFix(db, { event_id: e1.id, gross_kg: 15, reason: 'טעות הקלדה', mgr_pin: '999' }, 'המנהל');
      t.eq(JSON.stringify(db.laundryEvents[0]), before, '⛔ השורה המקורית ביומן שונתה. laundry_events הוא append-only');
      t.eq(db.laundryEvents.length, n + 1, 'לא נוספה שורת תיקון ליומן');
      const fix = db.laundryEvents[db.laundryEvents.length - 1];
      t.eq(String(fix.ref_id), e1.id, '⛔ שורת התיקון אינה מצביעה על השקילה שתוקנה (ref_id)');
      t.has(String(fix.note), 'טעות הקלדה', 'סיבת התיקון לא נשמרה ביומן');
      t.has(String(fix.worker_name), 'המנהל', 'שם המתקן לא נשמר ביומן');
    },

    'ביטול שקילה — היא יוצאת מהחיוב אבל נשארת ביומן': (t, { srv }) => {
      const db = B70.db(srv);
      const e1 = B70.weigh(db, 25, '10:00');   // ₪200
      B70.weigh(db, 35, '12:00');              // ₪300
      const r = srv.nobleWeighFix(db, { event_id: e1.id, cancel: true, reason: 'נשקלה פעמיים בטעות', mgr_pin: '999' }, 'המנהל');
      t.ok(r.ok, 'הביטול נדחה: ' + r.error);
      const roll = srv.nobleWeighRollup(db, 'IK1');
      t.eq(roll.charge, 300, 'אחרי ביטול השקילה הראשונה נותר רק החיוב השני');
      t.ok(roll.weighs[0].cancelled, 'השורה המבוטלת לא סומנה כמבוטלת');
      t.eq(roll.weighs.length, 2, 'השורה המבוטלת נעלמה מהתצוגה — היא אמורה להישאר גלויה');
    },

    'שרשרת תיקונים — תיקון של תיקון, האחרון קובע': (t, { srv }) => {
      const db = B70.db(srv);
      const e1 = B70.weigh(db, 25, '10:00');
      srv.nobleWeighFix(db, { event_id: e1.id, gross_kg: 15, reason: 'תיקון ראשון', mgr_pin: '999' }, 'המנהל');
      const fix1 = db.laundryEvents[db.laundryEvents.length - 1];
      srv.nobleWeighFix(db, { event_id: e1.id, gross_kg: 45, reason: 'תיקון שני', mgr_pin: '999' }, 'המנהל');
      const roll = srv.nobleWeighRollup(db, 'IK1');
      t.eq(roll.charge, 400, 'התיקון האחרון (נטו 40) לא קבע');
      t.eq(roll.weighs.length, 1, 'שרשרת התיקונים יצרה שורות כפולות');
      t.ok(fix1.id, 'שורת התיקון הראשון לא נוצרה');
    },

    /* ---------- שערי התיקון ---------- */

    '⛔ תיקון בלי סיבה נדחה, ושום דבר לא נכתב': (t, { srv }) => {
      const db = B70.db(srv);
      const e1 = B70.weigh(db, 25, '10:00');
      const n = db.laundryEvents.length;
      const r = srv.nobleWeighFix(db, { event_id: e1.id, gross_kg: 15, reason: '  ', mgr_pin: '999' }, 'המנהל');
      t.no(r.ok, 'תיקון בלי סיבה התקבל');
      t.has(r.error, 'סיבה', 'ההודעה אינה אומרת שחסרה סיבה');
      t.eq(db.laundryEvents.length, n, 'נכתבה שורה ליומן למרות הדחייה');
      t.eq(srv.nobleWeighRollup(db, 'IK1').charge, 200, 'החיוב השתנה למרות הדחייה');
    },

    '⛔ תיקון בלי מספר אישי של מנהל נדחה': (t, { srv }) => {
      const db = B70.db(srv);
      const e1 = B70.weigh(db, 25, '10:00');
      const n = db.laundryEvents.length;
      const r = srv.nobleWeighFix(db, { event_id: e1.id, gross_kg: 15, reason: 'סיבה תקינה', mgr_pin: '123' }, 'עובד');
      t.no(r.ok, '⛔ תיקון עם קוד מנהל שגוי התקבל');
      t.eq(db.laundryEvents.length, n, 'נכתבה שורה ליומן למרות הדחייה');
    },

    '⛔ אחרי שהקליטה יצאה ללקוח אי אפשר לתקן שקילה': (t, { srv }) => {
      ['במשלוח', 'נמסר'].forEach(st => {
        const db = B70.db(srv);
        const e1 = B70.weigh(db, 25, '10:00');
        db.laundryIntakes[0].status = st;
        const r = srv.nobleWeighFix(db, { event_id: e1.id, gross_kg: 15, reason: 'מאוחר מדי', mgr_pin: '999' }, 'המנהל');
        t.no(r.ok, 'תיקון התקבל בסטטוס ' + st);
        t.has(r.error, st, 'ההודעה אינה אומרת מה הסטטוס');
      });
    },

    '⛔ תיקון של שורה שאינה שקילה נדחה': (t, { srv }) => {
      const db = B70.db(srv);
      const st = B70.ev(db, 'התחלה', 'CA1', '09:00');
      const r = srv.nobleWeighFix(db, { event_id: st.id, gross_kg: 15, reason: 'לא רלוונטי', mgr_pin: '999' }, 'המנהל');
      t.no(r.ok, 'תיקון של אירוע התחלה התקבל');
    },

    /* ---------- הדלת האחורית: מוכן למשלוח בלי לשקול את המחזור ---------- */

    '⭐⭐ עגלה שסיימה מחזור נוסף וטרם נשקלה עליו — "מוכן למשלוח" חסום': (t, { srv }) => {
      const db = B70.db(srv);
      B70.ev(db, 'התחלה', 'CA1', '08:00');
      B70.ev(db, 'סיום', 'CA1', '09:30');
      B70.weigh(db, 25, '10:00');            // מחזור ראשון — נשקל
      B70.ev(db, 'התחלה', 'CA1', '11:00');   // מחזור שני
      B70.ev(db, 'סיום', 'CA1', '12:30');    // הסתיים — וטרם נשקל
      t.ok(srv.b70CartNeedsWeigh(db, 'IK1', 'CA1'), 'העגלה לא זוהתה כמי שסיימה מחזור בלי שקילה');
      const r = srv.nobleMarkReady(db, { cart_barcode: 'CA1' }, 'עובד');
      t.no(r.ok, '⛔ הקליטה סומנה מוכנה בזמן שמחזור שלם לא נשקל — הכביסה הייתה נוסעת בלי חיוב');
      t.has(r.error, 'CA1', 'ההודעה אינה אומרת איזו עגלה');
    },

    'אותה עגלה אחרי שנשקלה על המחזור השני — "מוכן למשלוח" עובר': (t, { srv }) => {
      const db = B70.db(srv);
      B70.ev(db, 'התחלה', 'CA1', '08:00');
      B70.ev(db, 'סיום', 'CA1', '09:30');
      B70.weigh(db, 25, '10:00');
      B70.ev(db, 'התחלה', 'CA1', '11:00');
      B70.ev(db, 'סיום', 'CA1', '12:30');
      B70.weigh(db, 35, '13:00');
      t.no(srv.b70CartNeedsWeigh(db, 'IK1', 'CA1'), 'העגלה סומנה כטעונת שקילה למרות שנשקלה');
      const r = srv.nobleMarkReady(db, { cart_barcode: 'CA1' }, 'עובד');
      t.ok(r.ok, 'סימון מוכן נחסם למרות ששתי השקילות בוצעו: ' + r.error);
      t.eq(srv.nobleWeighRollup(db, 'IK1').charge, 500, 'החיוב אינו סכום שני המחזורים');
    },

    /* ---------- ⛔ הכסף. R6 ---------- */

    '⛔ כסף: total_charge שווה בדיוק לסכום שספר החיובים מכיר בו': (t, { srv }) => {
      const db = B70.db(srv);
      srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 25 }, 'עובד');
      srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 35 }, 'עובד');
      db.laundryIntakes[0].status = 'נמסר';
      db.laundryIntakes[0].delivered_ts = '2026-08-02 10:00';
      srv.b54Bump();
      const led = srv.b54Ledger(db).reduce((s, r) => s + (r.net_ag || 0), 0);
      t.eq(led, Math.round(db.laundryIntakes[0].total_charge * 100), '⛔ ספר החיובים ו-total_charge התפצלו');
      t.eq(led, 50000, '⛔ ספר החיובים לא מכיר בשני המחזורים (500 ₪)');
    },

    '⛔ כסף: שלושת מקורות היתרה מחזירים אותו מספר (R6)': (t, { srv }) => {
      const db = B70.db(srv);
      srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 25 }, 'עובד');
      srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 35 }, 'עובד');
      db.laundryIntakes[0].status = 'נמסר';
      db.laundryIntakes[0].delivered_ts = '2026-08-02 10:00';
      db.laundryIntakes[0].invoice_id = 'INV1';
      db.invoices = [{ id: 'INV1', number: 1001, order_id: '', customer_id: 'C1',
        date: '2026-08-02', subtotal: 500, vat_rate: 0.18, vat: 90, total: 590, status: 'פתוחה' }];
      srv.b54Bump();
      const bal = srv.b48BalancesAg(db)['C1'] || 0;
      t.ok(bal > 0, 'קו הבסיס אפס — הבדיקה אינה מוכיחה דבר');
      t.eq(srv.b2CreditUsedAg(db, 'C1'), bal, '⛔ מנוע האשראי וספר החיובים התפצלו (R6)');
    },

    '⛔ כביסה פנימית נשארת בחיוב 0 גם בשני מחזורים': (t, { srv }) => {
      const db = B70.db(srv, { internal: 'כן' });
      B70.weigh(db, 25, '10:00');
      B70.weigh(db, 35, '12:00');
      const roll = srv.nobleWeighRollup(db, 'IK1');
      t.eq(roll.charge, 0, '⛔ כביסה פנימית קיבלה חיוב');
      t.eq(roll.net, 50, 'המשקל של הכביסה הפנימית לא נצבר — הוא המונה של הניצולת');
    },

    '⛔ תיקון בכביסה פנימית אינו יוצר חיוב': (t, { srv }) => {
      const db = B70.db(srv, { internal: 'כן' });
      const e1 = B70.weigh(db, 25, '10:00');
      const r = srv.nobleWeighFix(db, { event_id: e1.id, gross_kg: 45, reason: 'תיקון משקל', mgr_pin: '999' }, 'המנהל');
      t.ok(r.ok, 'התיקון נדחה: ' + r.error);
      t.eq(srv.nobleWeighRollup(db, 'IK1').charge, 0, '⛔ תיקון בכביסה פנימית ייצר חיוב');
      t.eq(srv.nobleWeighRollup(db, 'IK1').net, 40, 'המשקל המתוקן לא נשמר');
    },

    /* ---------- שומרים ---------- */

    '⛔ העמודה ref_id קיימת בסכימה של laundry_events': (t, { srv }) => {
      t.ok(srv.TABLES.laundry_events.indexOf('ref_id') > -1, 'ref_id חסרה — התיקון לא יכול להצביע על השקילה המקורית');
      t.eq(srv.TABLES.laundry_events[srv.TABLES.laundry_events.length - 1], 'ref_id',
        'ref_id אינה בסוף — המיגרציה של setupDatabase מוסיפה עמודות לסוף בלבד');
    },

    '⛔ nobleWeighFix אינה READ_ONLY — היא כותבת לגיליון': (t, { srv }) => {
      t.no(srv.READ_ONLY_ACTIONS.indexOf('nobleWeighFix') > -1,
        '⛔ פעולה שכותבת לגיליון נכנסה ל-READ_ONLY_ACTIONS (R4)');
    },

    '⛔ אין writeTable על laundry_events בשום מקום': (t, { H }) => {
      const code = H.stripComments(H.serverSrc());
      t.no(/writeTable\s*\(\s*['"]laundry_events['"]/.test(code),
        '⛔ laundry_events הוא append-only — writeTable עליו מוחק את היומן');
    },

    'b70Seq מציג 01/02/03 ולא 1/2/3': (t, { srv }) => {
      t.eq(srv.b70Seq(1), '01', 'מספר שקילה חד-ספרתי אינו מרופד');
      t.eq(srv.b70Seq(2), '02', 'מספר שקילה 2 שגוי');
      t.eq(srv.b70Seq(12), '12', 'מספר שקילה דו-ספרתי רופד בטעות');
    },

    '⛔ lastByCart לא חזר לקוד — זה בדיוק הבאג של WASH-03': (t, { H }) => {
      const code = H.stripComments(H.serverSrc());
      t.no(/lastByCart\s*\[/.test(code),
        '⛔ הדפוס lastByCart חזר לקוד השרת. הוא מוחק חיובים בשקט');
    },

    'nobleCartInfo מחזיר את שורות השקילה ואת דגל השקילה החסרה': (t, { srv }) => {
      const db = B70.db(srv);
      B70.weigh(db, 25, '10:00');
      B70.weigh(db, 35, '12:00');
      const r = srv.nobleCartInfo(db, { barcode: 'CA1' });
      t.ok(r.ok, 'nobleCartInfo נכשל: ' + r.error);
      t.eq(r.weighs.length, 2, 'מסך הרצפה לא מקבל את שתי השקילות');
      t.eq(r.weighs[0].seq, 1, 'מספור השקילות לא הגיע למסך');
      t.no(r.needs_weigh, 'דגל השקילה החסרה נדלק בטעות');
    },

    'לוח המכבסה מציג את החיוב המצטבר': (t, { srv }) => {
      const db = B70.db(srv);
      B70.weigh(db, 25, '10:00');
      B70.weigh(db, 35, '12:00');
      const b = srv.nobleBoard(db);
      const ik = (b.intakes || []).find(x => x.id === 'IK1');
      t.ok(ik, 'הקליטה לא הופיעה בלוח');
      t.eq(ik.charge, 500, '⛔ הלוח מציג חיוב חלקי — שקילה נמחקה');
    }

  }
});


SPECS.push({
  file: 't16b-b70-wash03-ui',
  title: 'B70 / WASH-03 — טבלת השקילות ברצפת הייצור (ממשק)',
  needs: 'ui',
  requires: ['b70Seq', 'b70Hm', 'b70WeighsHtml', 'floorFixWeigh', 'floorFixGo', 'b70CancelToggle',
             'floorRenderInfo', 'floorWeigh', 'el', 'openModal', 'closeModal', 'b61Tests', 'ils'],

  tests: {

    'b70Seq ו-b70Hm בממשק זהים לשרת': (t, { w }) => {
      t.eq(w.b70Seq(1), '01', 'מספר שקילה חד-ספרתי אינו מרופד בממשק');
      t.eq(w.b70Seq(11), '11', 'מספר שקילה דו-ספרתי שגוי בממשק');
      t.eq(w.b70Hm('2026-08-01 14:35:00'), '14:35', 'השעה לא חולצה מחותמת הזמן');
      t.eq(w.b70Hm(''), '', 'חותמת ריקה החזירה משהו');
    },

    '⭐ שלוש שקילות מוצגות עם השעה, המספר והחיוב': (t, { w, srv, H }) => {
      H.login(w, 'מכבסה', srv);
      const html = w.b70WeighsHtml({
        intake: { id: 'IK1', internal: '' },
        weighed: { net: 60, charge: 600, count: 3 },
        weighs: [
          { id: 'E1', ts: '2026-08-01 10:00:00', cart_id: 'CA1', seq: 1, net_kg: 20, charge: 200, fixed: false, cancelled: false },
          { id: 'E2', ts: '2026-08-01 12:00:00', cart_id: 'CA1', seq: 2, net_kg: 30, charge: 300, fixed: false, cancelled: false },
          { id: 'E3', ts: '2026-08-01 15:00:00', cart_id: 'CA1', seq: 3, net_kg: 10, charge: 100, fixed: false, cancelled: false }
        ]
      });
      ['(01)', '(02)', '(03)', '10:00', '12:00', '15:00'].forEach(x =>
        t.has(html, x, 'חסר בטבלת השקילות: ' + x));
      t.has(html, 'שקילות העגלה בקליטה הזו (3)', 'כותרת הטבלה אינה אומרת כמה שקילות יש');
    },

    'שקילה מבוטלת מוצגת כמבוטלת ובלי כפתור תיקון': (t, { w, srv, H }) => {
      H.login(w, 'מכבסה', srv);
      const html = w.b70WeighsHtml({
        intake: { id: 'IK1', internal: '' },
        weighed: { net: 30, charge: 300, count: 2 },
        weighs: [
          { id: 'E1', ts: '2026-08-01 10:00:00', cart_id: 'CA1', seq: 1, net_kg: 0, charge: 0, fixed: true, cancelled: true, fix_note: 'ביטול שקילה · כפילות', fix_by: 'המנהל', fix_ts: '2026-08-01 16:00:00' },
          { id: 'E2', ts: '2026-08-01 12:00:00', cart_id: 'CA1', seq: 2, net_kg: 30, charge: 300, fixed: false, cancelled: false }
        ]
      });
      t.has(html, 'בוטלה', 'שקילה מבוטלת אינה מסומנת');
      t.has(html, 'כפילות', 'סיבת הביטול אינה מוצגת');
      t.eq((html.match(/floorFixWeigh/g) || []).length, 1, 'כפתור תיקון הוצג לשורה מבוטלת');
    },

    '⛔ אין טבלה כשאין שקילות': (t, { w, srv, H }) => {
      H.login(w, 'מכבסה', srv);
      t.eq(w.b70WeighsHtml({ intake: { id: 'IK1' }, weighed: { net: 0, charge: 0, count: 0 }, weighs: [] }), '',
        'הוצגה טבלה ריקה');
    },

    '⭐ עגלה שסיימה מחזור וטרם נשקלה — אין כפתור "מוכן למשלוח" (R7)': (t, { w, srv, H }) => {
      H.login(w, 'מכבסה', srv);
      w.go('floor');
      w.FLOOR_INFO = {
        ok: true, cart: { id: 'CA1', tare_kg: 5, status: 'בשימוש' },
        intake: { id: 'IK1', status: 'באריזה', internal: '' },
        customer_name: 'לקוח', bound_carts: ['CA1'], opens: [], machines: [],
        weighed: { net: 20, charge: 200, count: 1 },
        weighs: [{ id: 'E1', ts: '2026-08-01 10:00:00', cart_id: 'CA1', seq: 1, net_kg: 20, charge: 200, fixed: false, cancelled: false }],
        needs_weigh: true
      };
      w.floorRenderInfo();
      const box = w.el('floorInfo').innerHTML;
      t.no(box.indexOf('floorReady()') > -1, '⛔ כפתור "מוכן למשלוח" הוצג בזמן שמחזור שלם לא נשקל');
      t.has(box, 'סיימה מחזור נוסף', 'אין הסבר למה הכפתור נעלם');
      w.FLOOR_INFO.needs_weigh = false;
      w.floorRenderInfo();
      t.ok(w.el('floorInfo').innerHTML.indexOf('floorReady()') > -1, 'הכפתור לא חזר אחרי שהעגלה נשקלה');
    },

    'מודל התיקון דורש סיבה, מספר אישי, ומאפשר ביטול': (t, { w, srv, H }) => {
      H.login(w, 'מכבסה', srv);
      w.floorFixWeigh('EVT-1', 25);
      const m = w.el('modal').innerHTML;
      ['f_b70reason', 'f_b70pin', 'f_b70cancel', 'f_b70gross'].forEach(id =>
        t.has(m, id, 'שדה חסר במודל התיקון: ' + id));
      t.has(m, 'אינו מוחק', 'המודל אינו מסביר שהתיקון נרשם כשורה חדשה');
      w.el('f_b70cancel').checked = true;
      w.b70CancelToggle();
      t.ok(w.el('f_b70gross').disabled, 'סימון ביטול לא נעל את שדה המשקל');
    },

    '⛔ שכבה 2 לא נגעה — WASH-03 אינו נוגע ביכולת דפדפן': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const names = w.b61Tests().map(x => x.n);
      t.no(names.some(n => /שקיל|B70/.test(n)), '⛔ נוספה טענה לכרטיס הבדיקה העצמית — WASH-03 אינו יכולת דפדפן');
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


/* ==================== t17 — B71 / WASH-10: כסף הכביסה באגורות שלמות ====================
   ⛔ הבאג שנסגר כאן: nRound2 היא Math.round(n*100)/100, והיא מפילה אגורה
   כשהתוצאה נופלת בדיוק על חצי אגורה, בגלל הייצוג הבינארי של המספר.
   0.59 ק"ג × 8.5 ₪ = 5.015 → 5.015*100 הוא 501.49999999999994 → 5.01.
   הסטייה תמיד לרעת העסק. נמדד: 1.9% מהשקילות, 0.4% מסכומי המע"מ.
   ⛔ הכרעת אבי 09.08.2026: חיובים היסטוריים נשארים כפי שהם. משקל אינו כסף. */

const B71 = {
  /* אותה קליטה של B70, אבל במחיר 8.5 ₪ לק"ג וטרה 5 — המחיר שמייצר את חצי האגורה */
  db(srv, over) {
    over = over || {};
    const db = B70.db(srv, over);
    if (!over.internal) db.customers[0].price_per_kg = over.price === undefined ? 8.5 : over.price;
    db.laundryIntakes[0].price_per_kg = over.price === undefined ? 8.5 : over.price;
    return db;
  },
  /* סכום החיובים של הקליטה, מחושב באגורות שלמות ישירות מהיומן — מקור עצמאי */
  sumAg(db, intakeId) {
    return (db.laundryEvents || [])
      .filter(e => String(e.intake_id) === intakeId && String(e.event_type) === 'שקילה')
      .reduce((s, e) => s + Math.round(Number((Number(e.charge || 0) * 100).toFixed(6))), 0);
  }
};

SPECS.push({
  file: 't17-b71-wash10-srv',
  title: 'B71 / WASH-10 — כסף הכביסה באגורות שלמות (שרת)',
  needs: 'server',
  requires: ['w10Cent', 'w10MulAg', 'w10PctAg', 'fromAg', 'toAg', 'nRound2',
             'nobleWeigh', 'nobleWeighFix', 'nobleWeighRollup', 'nobleCreateInvoice',
             'b70Weighs', 'b70CartNeedsWeigh', 'b70Seq', 'nobleMarkReady',
             'b54Ledger', 'b54Bump', 'b48BalancesAg', 'b2CreditUsedAg',
             'b38VerifyManagerPin', 'TABLES', 'VAT_RATE', 'sVal', 'handle', 'READ_ONLY_ACTIONS'],

  tests: {

    /* ---------- ⛔ הסטייה עצמה. הבדיקה הזו מוכיחה שהבאג היה אמיתי ---------- */

    '⭐⭐ סטיית העיגול לפני התיקון — 0.59 ק"ג × 8.5 ₪ נכתב 5.01 במקום 5.02': (t, { srv }) => {
      // הצד השבור: כך המערכת חישבה עד B71. הבדיקה מקבעת את קיום הסטייה.
      t.eq(srv.nRound2(0.59 * 8.5), 5.01,
        'nRound2 כבר אינה מייצרת את הסטייה — הבדיקה איבדה את קו הבסיס שלה');
      // הצד המתוקן: חשבון באגורות שלמות
      t.eq(srv.w10MulAg(0.59, 8.5), 502, '⛔ החישוב באגורות שלמות אינו מחזיר 502 אגורות');
      t.eq(srv.fromAg(srv.w10MulAg(0.59, 8.5)), 5.02, '⛔ ההמרה חזרה לשקלים שגויה');
      // ⛔ וזה מה שנכתב בפועל ליומן, דרך המסלול האמיתי
      const db = B71.db(srv);
      const r = srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 5.59 }, 'עובד');
      t.ok(r.ok, 'השקילה נדחתה: ' + r.error);
      t.eq(r.net_kg, 0.59, 'המשקל הנטו השתנה — משקל אינו כסף, אסור היה לגעת בו');
      t.eq(r.charge, 5.02, '⛔⛔ אגורה נטושה: החיוב שנכתב ליומן הוא 5.01 ולא 5.02');
      t.eq(db.laundryIntakes[0].total_charge, 5.02, '⛔ total_charge של הקליטה נשאר עם האגורה החסרה');
    },

    '⭐ 100 שקילות קטנות — הסכום זהה לחישוב באגורות שלמות': (t, { srv }) => {
      const db = B71.db(srv);
      let expectAg = 0;
      for (let i = 0; i < 100; i++) {
        const gross = 5 + (5 + i) / 100;                 // נטו 0.05 … 1.04 ק"ג
        const r = srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: gross }, 'עובד');
        t.ok(r.ok, 'שקילה ' + (i + 1) + ' נדחתה: ' + r.error);
        expectAg += srv.w10MulAg(r.net_kg, 8.5);
      }
      const roll = srv.nobleWeighRollup(db, 'IK1');
      t.eq(srv.b70Weighs(db, 'IK1').length, 100, '⛔ לא כל 100 השקילות נספרו — צבירת B70 נשברה');
      t.eq(srv.w10Cent(roll.charge), expectAg,
        '⛔⛔ סכום 100 השקילות אינו שווה לסכום באגורות שלמות — נותרה נטישת אגורות');
      t.eq(srv.w10Cent(db.laundryIntakes[0].total_charge), expectAg,
        '⛔ total_charge שנכתב לקליטה אינו הסכום באגורות שלמות');
      // הסכום המצטבר אינו "נכון במקרה": הוא זהה לחישוב עצמאי מהיומן
      t.eq(B71.sumAg(db, 'IK1'), expectAg, '⛔ היומן והסיכום התפצלו');
    },

    '⛔ intake.total_charge שווה לסכום שספר החיובים מכיר בו': (t, { srv }) => {
      const db = B71.db(srv);
      [5.59, 7.33, 6.05, 9.87].forEach(g => srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: g }, 'עובד'));
      db.laundryIntakes[0].status = 'נמסר';
      db.laundryIntakes[0].delivered_ts = '2026-08-02 10:00';
      srv.b54Bump();
      const rows = srv.b54Ledger(db).filter(r => r.intake_id === 'IK1');
      t.ok(rows.length > 0, 'ספר החיובים לא הכיר בקליטה בכלל');
      const ledgerAg = rows.reduce((s, r) => s + Number(r.net_ag || 0), 0);
      t.eq(ledgerAg, srv.toAg(db.laundryIntakes[0].total_charge),
        '⛔⛔ ספר החיובים ו-total_charge התפצלו — לקוח יחויב בסכום אחר ממה שנשקל');
      t.eq(ledgerAg, srv.w10Cent(srv.nobleWeighRollup(db, 'IK1').charge),
        '⛔ הסיכום מהיומן וספר החיובים אינם זהים');
    },

    '⛔ כסף: שלושת מקורות היתרה מחזירים אותו מספר (R6)': (t, { srv }) => {
      const db = B71.db(srv);
      [5.59, 7.33, 6.05].forEach(g => srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: g }, 'עובד'));
      db.laundryIntakes[0].status = 'נמסר';
      db.laundryIntakes[0].delivered_ts = '2026-08-02 10:00';
      // החשבונית נוצרת דרך המסלול האמיתי — היא שהופכת את הקליטה ליתרה פתוחה
      const inv = srv.nobleCreateInvoice(db, { customer_id: 'C1' }, 'מנהל');
      t.ok(inv.ok, 'החשבונית נדחתה: ' + inv.error);
      t.eq(srv.toAg(inv.invoice.subtotal), 502 + 1981 + 893,
        '⛔ סכום החשבונית אינו חיבור שלוש השקילות באגורות שלמות');
      srv.b54Bump();
      const bal = srv.b48BalancesAg(db)['C1'] || 0;
      t.ok(bal > 0, 'קו הבסיס אפס — הבדיקה אינה מוכיחה דבר');
      t.eq(srv.b2CreditUsedAg(db, 'C1'), bal, '⛔ מנוע האשראי וספר החיובים התפצלו (R6)');
      const ledgerAg = srv.b54Ledger(db)
        .filter(r => r.customer_id === 'C1')
        .reduce((s, r) => s + Number(r.open_ag || 0), 0);
      t.eq(ledgerAg, bal, '⛔ b54Ledger ו-b48BalancesAg התפצלו (R6)');
    },

    /* ---------- החשבונית והמע"מ (כלל B45 · מלכודת 4) ---------- */

    '⭐ החשבונית: מע"מ באגורות שלמות, והסה"כ הוא חיבור מדויק ולא עיגול שלישי': (t, { srv }) => {
      const db = B71.db(srv);
      db.laundryIntakes[0].status = 'נמסר';
      db.laundryIntakes[0].delivered_ts = '2026-08-02 10:00';
      db.laundryIntakes[0].total_charge = 1.25;     // 1.25 × 0.18 = 0.225 — בדיוק חצי אגורה
      db.laundryIntakes[0].net_weight_kg = 0.15;
      const r = srv.nobleCreateInvoice(db, { customer_id: 'C1' }, 'מנהל');
      t.ok(r.ok, 'החשבונית נדחתה: ' + r.error);
      t.eq(r.invoice.subtotal, 1.25, 'סכום החשבונית שגוי');
      t.eq(r.invoice.vat, 0.23, '⛔⛔ המע"מ הוא 0.22 — אגורה נטושה בעיגול המע"מ');
      t.eq(r.invoice.total, 1.48, '⛔ הסה"כ אינו סכום מדויק של הנטו והמע"מ');
      t.eq(srv.toAg(r.invoice.total), srv.toAg(r.invoice.subtotal) + srv.toAg(r.invoice.vat),
        '⛔ הסה"כ עוגל בנפרד ואינו שווה לחיבור שני רכיביו');
    },

    'חשבונית על כמה קליטות — הסכום הוא חיבור אגורות ולא סכימת שברים': (t, { srv }) => {
      const db = B71.db(srv);
      const base = db.laundryIntakes[0];
      const mk = (id, amt) => ({
        id: id, customer_id: 'C1', internal: '', status: 'נמסר', net_weight_kg: 1,
        price_per_kg: 8.5, total_charge: amt, intake_ts: '2026-08-01 08:00',
        delivered_ts: '2026-08-02 10:00', delivery_id: '', notes: '', created_by: '',
        invoice_id: '', order_id: '', ready_ts: ''
      });
      base.status = 'נמסר'; base.delivered_ts = '2026-08-02 10:00'; base.total_charge = 5.02;
      db.laundryIntakes.push(mk('IK2', 7.19), mk('IK3', 0.03));
      const r = srv.nobleCreateInvoice(db, { customer_id: 'C1' }, 'מנהל');
      t.ok(r.ok, 'החשבונית נדחתה: ' + r.error);
      t.eq(r.count, 3, 'לא כל הקליטות נכללו');
      t.eq(srv.toAg(r.invoice.subtotal), 502 + 719 + 3, '⛔ סכום החשבונית אינו חיבור אגורות שלמות');
      t.eq(srv.toAg(r.invoice.total), srv.toAg(r.invoice.subtotal) + srv.toAg(r.invoice.vat),
        '⛔ הסה"כ אינו חיבור מדויק');
    },

    /* ---------- ⛔ מה שאסור היה להישבר ---------- */

    '⛔ כביסה פנימית נשארת בחיוב 0 בכל מסלול': (t, { srv }) => {
      const db = B71.db(srv, { internal: 'כן' });
      const r1 = srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 5.59 }, 'עובד');
      t.ok(r1.ok, 'שקילה פנימית נדחתה: ' + r1.error);
      t.eq(r1.charge, 0, '⛔ כביסה פנימית קיבלה חיוב');
      const r2 = srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 7.33 }, 'עובד');
      t.eq(r2.charge, 0, '⛔ המחזור השני של כביסה פנימית קיבלה חיוב');
      const roll = srv.nobleWeighRollup(db, 'IK1');
      t.eq(roll.charge, 0, '⛔ הסיכום של כביסה פנימית אינו אפס');
      t.eq(db.laundryIntakes[0].total_charge, 0, '⛔ total_charge של כביסה פנימית אינו אפס');
      t.ok(roll.net > 0, 'המשקל של הכביסה הפנימית לא נצבר — הוא המונה של הניצולת');
      srv.b54Bump();
      t.eq(srv.b54Ledger(db).filter(r => r.intake_id === 'IK1').length, 0,
        '⛔ כביסה פנימית נכנסה לספר החיובים');
    },

    '⛔ שתי שקילות ויותר לאותה עגלה — הצבירה של B70 לא נשברה': (t, { srv }) => {
      const db = B71.db(srv, { price: 10 });
      db.customers[0].price_per_kg = 10;
      const r1 = srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 25 }, 'עובד');
      const r2 = srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 35 }, 'עובד');
      t.eq(r1.cart_seq, 1, 'מספר השקילה הראשונה אינו 1');
      t.eq(r2.cart_seq, 2, '⛔ שקילה שנייה לא נספרה — מחזור נוסף הוא מציאות אמיתית');
      const roll = srv.nobleWeighRollup(db, 'IK1');
      t.eq(roll.charge, 500, '⛔⛔ החיוב אינו סכום שתי השקילות — הצבירה של B70 נשברה');
      t.eq(roll.net, 50, '⛔ המשקל אינו סכום שתי השקילות');
      t.eq(roll.carts.length, 1, 'העגלה נספרה יותר מפעם אחת');
      t.eq(db.laundryIntakes[0].total_charge, 500, '⛔ total_charge אינו סכום שתי השקילות');
    },

    '⛔ תיקון שקילה — עדיין מחזיר את אותו סכום, ובאגורות שלמות': (t, { srv }) => {
      const db = B71.db(srv);
      srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 5.59 }, 'עובד');   // 5.02
      srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 7.33 }, 'עובד');
      const evs = db.laundryEvents.filter(e => String(e.event_type) === 'שקילה');
      const before = srv.nobleWeighRollup(db, 'IK1').charge;
      const fx = srv.nobleWeighFix(db, {
        event_id: evs[0].id, gross_kg: 5.59, reason: 'נשקל מחדש על אותו משקל', mgr_pin: '999'
      }, 'המנהל');
      t.ok(fx.ok, 'התיקון נדחה: ' + fx.error);
      t.eq(fx.net_kg, 0.59, 'המשקל בתיקון השתנה');
      t.eq(fx.charge, 5.02, '⛔ החיוב בתיקון אינו באגורות שלמות');
      t.eq(srv.nobleWeighRollup(db, 'IK1').charge, before,
        '⛔ תיקון על אותו משקל שינה את הסכום הכולל');
      // התיקון הוא שורה חדשה, לא דריסה
      t.eq(db.laundryEvents.filter(e => String(e.event_type) === 'תיקון שקילה').length, 1,
        '⛔ התיקון לא נרשם כשורה חדשה');
      t.eq(String(db.laundryEvents[db.laundryEvents.length - 1].ref_id), String(evs[0].id),
        '⛔ ה-ref_id של התיקון אינו מצביע על השקילה המקורית');
    },

    'ביטול שקילה — מסיר את מלוא האגורות שלה ולא יותר': (t, { srv }) => {
      const db = B71.db(srv);
      srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 5.59 }, 'עובד');   // 5.02
      srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 7.33 }, 'עובד');
      const evs = db.laundryEvents.filter(e => String(e.event_type) === 'שקילה');
      const second = srv.w10Cent(evs[1].charge);
      const fx = srv.nobleWeighFix(db, {
        event_id: evs[0].id, cancel: true, reason: 'נשקלה עגלה לא נכונה', mgr_pin: '999'
      }, 'המנהל');
      t.ok(fx.ok, 'הביטול נדחה: ' + fx.error);
      t.eq(srv.w10Cent(srv.nobleWeighRollup(db, 'IK1').charge), second,
        '⛔ אחרי הביטול נותר סכום שאינו בדיוק השקילה השנייה');
    },

    /* ---------- שומרי קוד מקור ---------- */

    '⛔ אין writeTable על laundry_events בשום מקום — append-only': (t, { H }) => {
      const src = H.stripComments(H.serverSrc());
      t.hasNot(src, "writeTable('laundry_events'", '⛔⛔ laundry_events נדרס — הוא append-only');
      t.hasNot(src, 'writeTable("laundry_events"', '⛔⛔ laundry_events נדרס — הוא append-only');
    },

    '⛔ lastByCart לא חזר לקוד — זה הבאג של WASH-03': (t, { H }) => {
      t.hasNot(H.stripComments(H.serverSrc()), 'lastByCart',
        '⛔⛔ הדפוס שמחק חיובים בשקט חזר לקוד');
    },

    '⛔ מסלול הכסף של הכביסה כבר אינו עובר ב-nRound2': (t, { H }) => {
      const src = H.stripComments(H.serverSrc());
      ['nRound2(net * price)', 'nRound2(charge)', 'nRound2(sub * VAT_RATE)', 'nRound2(sub + vat)'
      ].forEach(bad => t.hasNot(src, bad,
        '⛔ נקודת נטישת אגורה חזרה למסלול הכביסה: ' + bad));
    },

    '⛔ toAg לא נגע — הוא משרת את מנוע האשראי ואת ספר החיובים (R4)': (t, { srv, H }) => {
      t.has(H.stripComments(H.serverSrc()), 'function toAg(n) { return Math.round(Number(n || 0) * 100); }',
        '⛔⛔ toAg שונה — הוא מזיז יתרות היסטוריות בכל המערכת');
      t.eq(srv.toAg(12.34), 1234, 'toAg שינה התנהגות');
    },

    '⛔ אין שינוי סכימה — שתי הטבלאות לא זזו': (t, { srv }) => {
      t.eq(srv.TABLES.laundry_events.join(','),
        'id,ts,intake_id,customer_id,cart_id,machine_id,stage,event_type,worker_id,worker_name,gross_kg,tare_kg,net_kg,price_per_kg,charge,note,portion_kg,ref_id',
        '⛔ סכימת laundry_events השתנתה — נדרש אישור אבי והרצת setupDatabase');
      t.eq(srv.TABLES.laundry_intakes.join(','),
        'id,customer_id,internal,status,net_weight_kg,price_per_kg,total_charge,intake_ts,delivered_ts,delivery_id,notes,created_by,invoice_id,order_id,ready_ts',
        '⛔ סכימת laundry_intakes השתנתה — נדרש אישור אבי והרצת setupDatabase');
    },

    'העוזרים החדשים עומדים בפני עצמם — 0, ריק ושלילי': (t, { srv }) => {
      t.eq(srv.w10Cent(''), 0, 'ערך ריק לא הוחזר כאפס');
      t.eq(srv.w10Cent(null), 0, 'null לא הוחזר כאפס');
      t.eq(srv.w10Cent(1.005), 101, '⛔ הבאג הבינארי שרד — 1.005 חייב להיות 101 אגורות');
      t.eq(srv.w10MulAg(0, 8.5), 0, 'מכפלה באפס אינה אפס');
      t.eq(srv.w10MulAg(2, 0), 0, 'מחיר אפס אינו מייצר חיוב אפס');
      t.eq(srv.w10PctAg(125, 0.18), 23, '⛔ חישוב המע"מ באגורות שגוי');
      t.eq(srv.fromAg(0), 0, 'fromAg על אפס');
      t.eq(srv.fromAg(502), 5.02, 'fromAg שגוי');
    },

    '⛔ שכבה 2 לא נגעה — WASH-10 אינו נוגע ביכולת דפדפן': (t, { H }) => {
      const ui = H.stripComments(H.uiScript());
      const m = ui.match(/function b61Tests\(\)[\s\S]*?\n\}/);
      t.ok(!!m, 'b61Tests נעלמה מהממשק');
      t.hasNot(m[0], 'WASH',
        '⛔ נוספה טענה ל-b61Tests למרות שהאצווה אינה נוגעת ביכולת דפדפן');
    }

  }
});


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

/* ============================================================
   t18 — B72: WASH-17 · WASH-19 · WASH-14
   ------------------------------------------------------------
   שלושת הפריטים יושבים במסך הקליטה ובכרטיס ההזמנה. אף אחד מהם
   אינו כסף ואף אחד אינו נוגע בסכימה — ולכן חלק גדול מהבדיקות כאן
   הן בדיקות **שלא זז כלום**: הכסף, השריון והרגרסיות של B66/B70/B71.
   ============================================================ */

const B72 = {
  /* לקוח אחד, פריט אחד, שתי הזמנות: כביסה והשכרה. בלי כסף כביסה. */
  db(srv) {
    const db = H.emptyDb(srv);
    db.employees = [{ id: 'E9', name: 'המנהל', pin: '999', active: 'כן', role: 'מנהל' }];
    db.customers = [{ id: 'C1', name: 'לקוח', active: 'כן', price_per_kg: 10 }];
    db.items = [{ id: 'IT1', name: 'מגבת', active: 'כן', prefix: 'MG', barcode: 'MG-001' }];
    db.stockMoves = [{ id: 'SM1', item_id: 'IT1', qty: 100, date: '2026-07-01', warehouse_id: '' }];
    db.orders = [
      { id: 'OW', type: 'כביסה', customer_id: 'C1', status: 'טיוטה', order_number: 1001,
        start_date: '2026-09-01', end_date: '2026-09-03', delivery_fee: 0, notes: '' },
      { id: 'OR', type: 'השכרה', customer_id: 'C1', status: 'טיוטה', order_number: 1002,
        start_date: '2026-09-01', end_date: '2026-09-03', delivery_fee: 0, notes: '' }
    ];
    return db;
  },
  line(orderId) { return { table: 'order_lines', row: { order_id: orderId, item_id: 'IT1', qty: 3 } }; },
  /* משימת כביסה עם שלב שאפשר ללכלך */
  task(stage) {
    return { id: 'W1', order_id: 'OR', item_id: 'IT1', qty: 10, stage: stage,
      cart_id: '', machine_id: '', worker: '', in_date: '2026-09-01', done_date: '',
      warehouse_id: '', target_date: '2026-09-05', package_barcode: '', link_note: '',
      parent_task_id: '', release_mode: '', shelf_code: '', intake_id: '' };
  }
};

SPECS.push({
  file: 't18-b72-wash-srv',
  title: 'B72 / WASH-17 + WASH-14 — השרת: אין שורות בכביסה, שלב קנוני בפיצול',
  needs: 'server',
  requires: ['handle', 'ORDER_TYPES', 'STAGES', 'sVal', 'sPick', 'b40SplitLaundry',
             'approveOrder', 'b54RawOrderTotalAg', 'availableQty', 'reservedQty',
             'b48BalancesAg', 'b2CreditUsedAg', 'b54Ledger', 'TABLES', 'toAg',
             'w10Cent', 'w10MulAg', 'w10PctAg', 'fromAg', 'nRound2'],

  tests: {

    /* ---------- WASH-17 ---------- */

    '⛔⛔ WASH-17: אי אפשר להוסיף שורת פריט להזמנת כביסה': (t, { srv }) => {
      const db = B72.db(srv);
      const r = srv.handle('create', B72.line('OW'), db, 'המנהל');
      t.no(r.ok, '⛔⛔ שורת מלאי נוספה להזמנת כביסה — הבורר חזר דרך השרת');
      t.has(r.error, 'המלאי שייך למכבסה', 'ההודעה אינה מסבירה למה נחסם');
      t.eq(db.orderLines.length, 0, '⛔ השורה נכתבה בכל זאת ל-DB');
    },

    '⛔ WASH-17 + B64a: סוג מלוכלך אינו עוקף את החסימה': (t, { srv }) => {
      [' כביסה', 'כביסה ', ' כביסה\u00A0', '\u200Fכביסה'].forEach((ty, i) => {
        const db = B72.db(srv);
        db.orders[0].type = ty;
        const r = srv.handle('create', B72.line('OW'), db, 'המנהל');
        t.no(r.ok, i + ' — ⛔⛔ סוג מלוכלך עקף את WASH-17 והשורה נוספה');
        t.eq(db.orderLines.length, 0, i + ' — השורה נכתבה ל-DB למרות הדחייה');
      });
    },

    '⛔ רגרסיה: הזמנת השכרה ממשיכה לקבל שורות בדיוק כמו היום': (t, { srv }) => {
      const db = B72.db(srv);
      const r = srv.handle('create', B72.line('OR'), db, 'המנהל');
      t.ok(r.ok, '⛔⛔ WASH-17 חסם גם את ההשכרה: ' + r.error);
      t.eq(db.orderLines.length, 1, 'השורה לא נוספה להזמנת ההשכרה');
      t.eq(Number(db.orderLines[0].qty), 3, 'הכמות השתנתה');
      t.ok(db.orderLines[0].unit_price !== undefined, 'המחיר האוטומטי (linePrice) הפסיק לפעול');
    },

    '⛔ רגרסיה B66: הזמנת כביסה מאושרת בלי אף שורה': (t, { srv }) => {
      const db = B72.db(srv);
      const r = srv.approveOrder(db, 'OW');
      t.ok(r.ok, '⛔ הזמנת כביסה ריקה נחסמה לאישור — רגרסיה של B66: ' + r.error);
      t.eq(db.orders[0].status, 'מאושרת', 'הסטטוס לא התקדם');
    },

    '⛔ הזמנת השכרה בלי שורות נשארת חסומה': (t, { srv }) => {
      const db = B72.db(srv);
      const r = srv.approveOrder(db, 'OR');
      t.no(r.ok, '⛔ השכרה ריקה אושרה — שם השורות הן הכסף');
    },

    '⛔ כסף: b54RawOrderTotalAg לא זזה — שורות כביסה היסטוריות עדיין 0': (t, { srv }) => {
      const db = B72.db(srv);
      /* שורה היסטורית שנוצרה לפני WASH-17 — נשארת בגיליון ואסור שתייצר כסף */
      db.orderLines = [{ id: 'L1', order_id: 'OW', item_id: 'IT1', qty: 3, unit_price: 25, returned_qty: '' }];
      t.eq(srv.b54RawOrderTotalAg(db, db.orders[0]), 0,
        '⛔⛔ שורת כביסה היסטורית הפכה לכסף — b54RawOrderTotalAg זזה');
      /* ולהשכרה — אותו סכום בדיוק כמו לפני האצווה */
      db.orderLines.push({ id: 'L2', order_id: 'OR', item_id: 'IT1', qty: 3, unit_price: 25, returned_qty: '' });
      t.eq(srv.b54RawOrderTotalAg(db, db.orders[1]), srv.toAg(75),
        '⛔ הכסף של הזמנת ההשכרה השתנה');
    },

    '⛔ מלאי: שורת כביסה היסטורית אינה משריינת ואינה מפחיתה זמינות': (t, { srv }) => {
      const db = B72.db(srv);
      const base = srv.availableQty(db, 'IT1', '2026-09-01', '2026-09-03');
      db.orderLines = [{ id: 'L1', order_id: 'OW', item_id: 'IT1', qty: 3, unit_price: 25, returned_qty: '' }];
      db.orders[0].status = 'מאושרת';
      t.eq(srv.availableQty(db, 'IT1', '2026-09-01', '2026-09-03'), base,
        '⛔⛔ הזמנת כביסה משריינת מלאי — זה בדיוק הבאג שדווח');
      t.eq(srv.reservedQty(db, 'IT1', '2026-09-01', '2026-09-03'), 0,
        '⛔ reservedQty ספרה הזמנת כביסה');
    },

    '⛔ R6: שלושת מקורות היתרה מחזירים אותו מספר': (t, { srv }) => {
      const db = B72.db(srv);
      db.orderLines = [{ id: 'L2', order_id: 'OR', item_id: 'IT1', qty: 3, unit_price: 25, returned_qty: '' }];
      db.orders[1].status = 'סופקה';
      db.invoices = [{ id: 'INV1', number: 1001, order_id: 'OR', customer_id: 'C1',
        date: '2026-09-04', subtotal: 75, vat_rate: 0.18, vat: 13.5, total: 88.5, status: 'פתוחה' }];
      const bal = srv.b48BalancesAg(db)['C1'] || 0;
      t.ok(bal > 0, 'קו הבסיס אפס — הבדיקה אינה מוכיחה דבר');
      t.eq(srv.b2CreditUsedAg(db, 'C1'), bal, '⛔ מנוע האשראי וספר החיובים התפצלו (R6)');
    },

    /* ---------- WASH-14 ---------- */

    '⛔⛔ WASH-14: הילדה בפיצול נולדת עם שלב קנוני מ-sPick': (t, { srv }) => {
      [' בכביסה', 'בכביסה ', 'בכביסה\u00A0', '\u200Fבכביסה '].forEach((dirty, i) => {
        const db = B72.db(srv);
        db.laundryTasks = [B72.task(dirty)];
        const r = srv.b40SplitLaundry(db, { task_id: 'W1', qty: 4 }, '2026-09-02',
          (p) => p + '-' + i, 'המנהל');
        t.ok(r.ok, i + ' — הפיצול נדחה: ' + r.error);
        t.eq(r.new_task.stage, 'בכביסה',
          i + ' — ⛔⛔ הילדה נולדה עם שלב מלוכלך. הבאג של B64a מתרבה בכל פיצול');
        t.ok(srv.STAGES.indexOf(r.new_task.stage) > -1,
          i + ' — השלב של הילדה אינו אחד מ-STAGES');
      });
    },

    '⛔ שלב שאינו ברשימה בכלל — מנוקה, ולא נמחק': (t, { srv }) => {
      const db = B72.db(srv);
      db.laundryTasks = [B72.task(' שלב לא מוכר\u00A0')];
      const r = srv.b40SplitLaundry(db, { task_id: 'W1', qty: 4 }, '2026-09-02',
        (p) => p + '-X', 'המנהל');
      t.ok(r.ok, 'הפיצול נדחה: ' + r.error);
      t.eq(r.new_task.stage, 'שלב לא מוכר',
        '⛔ שלב לא מוכר אבד לגמרי — המשימה תיעלם מהלוח בלי עקבות');
    },

    '⛔ הפיצול עצמו לא נשבר — כמויות, אב, ושתי רשומות יומן': (t, { srv }) => {
      const db = B72.db(srv);
      db.laundryTasks = [B72.task('בייבוש')];
      const before = db.laundryTaskEvents.length;
      const r = srv.b40SplitLaundry(db, { task_id: 'W1', qty: 4 }, '2026-09-02',
        (p) => p + '-N', 'המנהל');
      t.ok(r.ok, 'הפיצול נדחה: ' + r.error);
      t.eq(Number(r.task.qty), 6, 'כמות האב אחרי הפיצול שגויה');
      t.eq(Number(r.new_task.qty), 4, 'כמות הילדה שגויה');
      t.eq(r.new_task.parent_task_id, 'W1', 'הקישור לאב נשבר');
      t.eq(r.new_task.order_id, 'OR', 'ההזמנה של הילדה השתנתה');
      t.eq(db.laundryTaskEvents.length - before, 2, 'לא נרשמו שתי רשומות יומן לפיצול');
    },

    /* ---------- שומרי קוד מקור ---------- */

    '⛔ אין שינוי סכימה — שלוש הטבלאות לא זזו': (t, { srv }) => {
      t.eq(srv.TABLES.orders.indexOf('notes') > -1, true,
        '⛔ orders.notes נעלם — התיאור החופשי של WASH-17 נשען עליו');
      t.eq(JSON.stringify(srv.TABLES.order_lines),
        JSON.stringify(['id', 'order_id', 'item_id', 'qty', 'unit_price', 'returned_qty', 'returned_weight']),
        '⛔⛔ סכימת order_lines השתנתה — B72 הוגדר בלי שינוי סכימה');
      t.ok(srv.TABLES.laundry_tasks.indexOf('stage') > -1, '⛔ laundry_tasks.stage נעלם');
    },

    '⛔ B71 לא נשבר — כסף הכביסה עדיין באגורות שלמות': (t, { srv, H }) => {
      t.eq(srv.w10MulAg(0.59, 8.5), 502, '⛔⛔ החישוב באגורות שלמות נשבר');
      t.eq(srv.fromAg(502), 5.02, '⛔ ההמרה חזרה לשקלים נשברה');
      const src = H.stripComments(H.serverSrc());
      t.hasNot(src, "writeTable('laundry_events'", '⛔⛔ laundry_events הוא append-only');
      t.hasNot(src, 'lastByCart', '⛔⛔ הדפוס של WASH-03 חזר לקוד');
    }

  }
});

SPECS.push({
  file: 't18-b72-wash-ui',
  title: 'B72 / WASH-17 + WASH-19 + WASH-14 — הממשק',
  needs: 'ui',
  requires: ['openOrder', 'addLineForm', 'w17Desc', 'w17ItemsHtml', 'w17DescForm',
             'floorIntakeTab', 'floorRenderCartList', 'floorRenderCartPick',
             'w19FreeCarts', 'floorPickCart', 'floorAddCart', 'b49bIsVirtual',
             'rLaundry', 'sVal', 'sPick', 'STAGES', 'go', 'el'],

  tests: {

    /* ---------- WASH-17 ---------- */

    '⛔⛔ WASH-17: בהזמנת כביסה אין שום דרך להוסיף פריט מהמלאי': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.items = [{ id: 'IT1', name: 'מגבת', active: 'כן' }];
      w.DB.orders = [{ id: 'OW', type: 'כביסה', customer_id: 'C1', status: 'טיוטה',
                       start_date: '2026-09-01', end_date: '2026-09-03', notes: '' }];
      w.openOrder('OW');
      const html = w.el('modal').innerHTML;
      t.hasNot(html, '+ הוסף פריט', '⛔⛔ כפתור הבורר חזר לכרטיס הזמנת הכביסה');
      t.hasNot(html, 'addLineForm(', '⛔⛔ קריאה ל-addLineForm נשארה בכרטיס כביסה');
      t.has(html, 'תיאור הכביסה', 'מקטע התיאור החופשי חסר');
      w.closeModal();
      /* גם קריאה ישירה לבורר — השומר השני */
      w.addLineForm('OW');
      t.hasNot(w.el('modal').innerHTML, 'checkAvail(',
        '⛔⛔ קריאה ישירה ל-addLineForm פתחה את בורר המלאי בהזמנת כביסה');
    },

    '⛔ רגרסיה: הבורר בהזמנת השכרה עובד בדיוק כמו היום': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.items = [{ id: 'IT1', name: 'מגבת', active: 'כן', size: '', color: '' }];
      w.DB.orders = [{ id: 'OR', type: 'השכרה', customer_id: 'C1', status: 'טיוטה',
                       start_date: '2026-09-01', end_date: '2026-09-03', notes: '' }];
      w.openOrder('OR');
      t.has(w.el('modal').innerHTML, '+ הוסף פריט', '⛔⛔ WASH-17 הסיר את הבורר גם מהשכרה');
      w.closeModal();
      w.addLineForm('OR');
      const form = w.el('modal').innerHTML;
      t.has(form, 'checkAvail(', '⛔ בדיקת הזמינות נעלמה מהבורר של ההשכרה');
      t.has(form, 'f_item', '⛔ בורר הפריטים נעלם מההשכרה');
      t.has(form, 'מגבת', 'הפריט אינו מופיע בבורר');
    },

    '⭐ התיאור החופשי — רשות, ונחתך ב-20 תווים': (t, { w }) => {
      t.eq(w.w17Desc(''), '', 'ריק אינו ערך תקין — התיאור אמור להיות רשות');
      t.eq(w.w17Desc(null), '', 'null הפיל את החיתוך');
      t.eq(w.w17Desc('חלוקים'), 'חלוקים', 'תיאור קצר השתנה');
      t.eq(w.w17Desc('  וילונות  '), 'וילונות', 'רווחים מיותרים לא נוקו');
      t.eq(w.w17Desc('\u200Fמעורב\u00A0'), 'מעורב', 'סימני כיוון ורווח קשיח לא נוקו (B64a)');
      const long = 'אבגדהוזחטיכלמנסעפצקרשת';   /* 22 תווים */
      t.eq(long.length, 22, 'קו הבסיס של הבדיקה השתנה');
      t.eq(w.w17Desc(long).length, 20, '⛔ התיאור לא נחתך ב-20 תווים');
      t.eq(w.w17Desc(long), long.slice(0, 20), 'החיתוך אינו מהתחלת המחרוזת');
    },

    '⭐ התיאור מוצג בכרטיס ונשמר ל-orders.notes': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.orders = [{ id: 'OW', type: 'כביסה', customer_id: 'C1', status: 'טיוטה',
                       start_date: '2026-09-01', end_date: '2026-09-03', notes: 'חלוקים' }];
      w.openOrder('OW');
      t.has(w.el('modal').innerHTML, 'חלוקים', 'התיאור השמור אינו מוצג בכרטיס');
      w.closeModal();
      w.w17DescForm('OW');
      const f = w.el('modal').innerHTML;
      t.has(f, 'w17_desc', 'שדה התיאור חסר בטופס');
      t.has(f, 'maxlength="20"', '⛔ אין תקרת 20 תווים על שדה הקלט');
      t.has(f, 'w17SaveDesc(', 'אין כפתור שמירה');
      w.closeModal();
    },

    '⛔ הזמנת כביסה בלי אף שורה נפתחת ונראית תקינה (רגרסיה B66)': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.orders = [{ id: 'OW', type: 'כביסה', customer_id: 'C1', status: 'טיוטה',
                       start_date: '2026-09-01', end_date: '2026-09-03', notes: '' }];
      w.openOrder('OW');
      const html = w.el('modal').innerHTML;
      t.has(html, 'החיוב לפי משקל בקליטה', 'ההסבר שהחיוב מגיע מהשקילה נעלם');
      t.has(html, 'אשר (בדיקת מלאי)', '⛔ כפתור האישור נעלם מהזמנת כביסה ריקה');
      t.hasNot(html, 'שורות היסטוריות', 'הוצג מקטע שורות היסטוריות בלי שיש שורות');
      w.closeModal();
    },

    '⭐ שורות היסטוריות בהזמנת כביסה — מוצגות לצפייה, בלי מחיר ובלי הוספה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.items = [{ id: 'IT1', name: 'מגבת', active: 'כן' }];
      w.DB.orders = [{ id: 'OW', type: 'כביסה', customer_id: 'C1', status: 'טיוטה',
                       start_date: '2026-09-01', end_date: '2026-09-03', notes: '' }];
      w.DB.orderLines = [{ id: 'L1', order_id: 'OW', item_id: 'IT1', qty: 3, unit_price: 25, returned_qty: '' }];
      w.openOrder('OW');
      const html = w.el('modal').innerHTML;
      t.has(html, 'שורות היסטוריות', 'שורה היסטורית נעלמה מהמסך בלי הסבר');
      t.has(html, 'מגבת', 'שם הפריט ההיסטורי אינו מוצג');
      t.hasNot(html, '+ הוסף פריט', '⛔⛔ הבורר חזר דרך מסלול השורות ההיסטוריות');
      w.closeModal();
    },

    /* ---------- WASH-19 ---------- */

    '⭐⭐ WASH-19: רשימת עגלות פנויות לצד הסריקה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.carts = [
        { id: 'CA1', barcode: 'CA1', status: 'פנויה', condition: 'תקינה', virtual: '' },
        { id: 'CA2', barcode: 'CA2', status: 'בשימוש', condition: 'תקינה', virtual: '' },
        { id: 'CA3', barcode: 'CA3', status: 'פנויה', condition: 'תקינה', virtual: 'כן' },
        { id: 'CA4', barcode: 'CA4', status: ' פנויה\u00A0', condition: 'תקינה', virtual: '' }
      ];
      w.FLOOR_INTAKE_CARTS = [];
      w.FLOOR_TAB = 'intake';
      w.go('floor');
      const ids = w.w19FreeCarts().map(c => c.id).join(',');
      t.eq(ids, 'CA1,CA4', '⛔ רשימת העגלות הפנויות שגויה. התקבל: ' + ids);
      const sel = w.el('fl_cartpick');
      t.ok(!!sel, '⛔ הרשימה אינה קיימת במסך הקליטה');
      t.has(sel.innerHTML, 'CA1', 'עגלה פנויה חסרה מהרשימה');
      t.hasNot(sel.innerHTML, 'CA2', '⛔ עגלה בשימוש הוצעה לבחירה');
      t.hasNot(sel.innerHTML, 'CA3', '⛔⛔ עגלה וירטואלית הוצעה לבחירה');
    },

    '⛔ WASH-19: הסריקה לא הוסרה — שדה הברקוד והמצלמה במקומם': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.FLOOR_INTAKE_CARTS = [];
      w.FLOOR_TAB = 'intake';
      w.go('floor');
      const body = w.el('floorBody').innerHTML;
      t.ok(!!w.el('fl_icart'), '⛔⛔ שדה סריקת הברקוד הוסר — זה המסלול המהיר ברצפה');
      t.has(body, "floorCam('fl_icart'", '⛔⛔ כפתור הסריקה במצלמה הוסר');
      t.has(body, 'floorAddCart()', '⛔ כפתור "הוסף עגלה" הידני הוסר');
      t.eq(w.el('fl_icart').getAttribute('onkeydown').indexOf('floorAddCart') > -1, true,
        '⛔ Enter בשדה הסריקה כבר אינו מוסיף עגלה');
    },

    '⭐ בחירה מהרשימה מזרימה לאותו מסלול של הסריקה (R7 · R8)': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.carts = [{ id: 'CA1', barcode: 'CA1', status: 'פנויה', condition: 'תקינה', virtual: '' }];
      w.FLOOR_INTAKE_CARTS = [];
      w.FLOOR_TAB = 'intake';
      w.go('floor');
      /* floorAddCart פונה לשרת (nobleCartInfo) — כאן נבדק שהבחירה מגיעה אליו
         דרך שדה הסריקה עצמו, ולא דרך מסלול שני. R7: אירוע change אמיתי. */
      let got = '';
      w.floorAddCart = function () { got = w.el('fl_icart').value; };
      H.change(w, w.el('fl_cartpick'), 'CA1');
      t.eq(got, 'CA1', '⛔ הבחירה לא הגיעה ל-floorAddCart דרך שדה הסריקה');
      t.eq(w.el('fl_cartpick').value, '', 'הרשימה לא התאפסה אחרי הבחירה');
    },

    '⛔ עגלה שכבר ברשימת הקליטה יורדת מרשימת הבחירה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.carts = [{ id: 'CA1', barcode: 'CA1', status: 'פנויה', condition: 'תקינה', virtual: '' },
                    { id: 'CA2', barcode: 'CA2', status: 'פנויה', condition: 'תקינה', virtual: '' }];
      w.FLOOR_INTAKE_CARTS = ['CA1'];
      t.eq(w.w19FreeCarts().map(c => c.id).join(','), 'CA2',
        '⛔ עגלה שכבר נבחרה עדיין מוצעת שוב');
    },

    /* ---------- WASH-14 ---------- */

    '⛔⛔ WASH-14: משימה עם שלב מלוכלך מופיעה בעמודה הנכונה בלוח': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.items = [{ id: 'IT1', name: 'מגבת', active: 'כן' }];
      w.DB.orders = [{ id: 'OR', type: 'השכרה', customer_id: 'C1', status: 'סופקה' }];
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.laundryTasks = [
        { id: 'W1', order_id: 'OR', item_id: 'IT1', qty: 5, stage: 'בכביסה', cart_id: '', machine_id: '' },
        { id: 'W2', order_id: 'OR', item_id: 'IT1', qty: 4, stage: ' בכביסה\u00A0', cart_id: '', machine_id: '' },
        { id: 'W3', order_id: 'OR', item_id: 'IT1', qty: 3, stage: '\u200Fבייבוש ', cart_id: '', machine_id: '' }
      ];
      w.go('laundry');
      const html = w.el('main').innerHTML;
      t.has(html, 'בכביסה<span class="cnt">2</span>',
        '⛔⛔ משימה עם שלב מלוכלך נעלמה מהלוח — הבאג של B64a');
      t.has(html, 'בייבוש<span class="cnt">1</span>',
        '⛔ משימה עם סימן כיוון נעלמה מעמודת הייבוש');
    },

    /* ---------- שכבה 2 ו-canary ---------- */

    '⛔ שכבה 2 לא נגעה — B72 אינו נוגע ביכולת דפדפן': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const names = w.b61Tests().map(x => x.n);
      t.no(names.some(n => /WASH-1[479]|B72/.test(n)),
        '⛔ נוספה טענה לכרטיס הבדיקה העצמית — B72 אינו יכולת דפדפן');
    }

  }
});

/* ============================================================
   t19 — B73: WASH-18
   ------------------------------------------------------------
   קליטת כביסה של לקוח (NOBLE) לא הופיעה בלוח הכביסה, כי
   הלוח קורא laundry_tasks בלבד ולקליטה אין שורת משימה.
   ⛔ הבדיקות הכבדות כאן הן בדיקות **שלא זז כלום**: המלאי
   (inLaundryQty/availableQty), הכסף (R6/B71), ו-append-only של
   laundry_events. אלה בדיוק המלכודות שצוינו לפני האצווה.
   ============================================================ */

const B73 = {
  /* קליטת לקוח פעילה עם עגלה CA1, מנהל ועובד מכבסה.
     בנוסף — מלאי אמיתי של פריט IT1, כדי להוכיח שהוא לא זז. */
  db(srv, over) {
    over = over || {};
    const db = H.emptyDb(srv);
    db.employees = [{ id: 'E1', name: 'עובד', pin: '111', active: 'כן', role: 'מכבסה' },
                    { id: 'E9', name: 'המנהל', pin: '999', active: 'כן', role: 'מנהל' },
                    { id: 'E8', name: 'המשרד', pin: '888', active: 'כן', role: 'משרד' }];
    db.customers = [{ id: 'C1', name: 'לקוח', active: 'כן', price_per_kg: 10 }];
    db.items = [{ id: 'IT1', name: 'מגבת', active: 'כן' }];
    db.stockMoves = [{ id: 'SM1', item_id: 'IT1', qty: 100, date: '2026-07-01', warehouse_id: '' }];
    db.carts = [{ id: 'CA1', barcode: 'CA1', status: 'בשימוש', tare_kg: 5, condition: 'תקינה' },
                { id: 'CA2', barcode: 'CA2', status: 'בשימוש', tare_kg: 5, condition: 'תקינה' }];
    db.machines = [{ id: 'M1', barcode: 'M1', type: 'מכונת כביסה', status: 'פעילה', auto_stage: 'בכביסה', capacity: 50 }];
    db.laundryIntakes = [{
      id: 'IK1', customer_id: over.internal ? '' : 'C1', internal: over.internal || '',
      status: over.status || 'התקבל', price_per_kg: 10, net_weight_kg: '', total_charge: '',
      intake_ts: '2026-08-01 08:00', delivered_ts: '', delivery_id: '', order_id: '',
      ready_ts: '', invoice_id: '', notes: ''
    }];
    db.intakeCarts = [{ id: 'IC1', intake_id: 'IK1', cart_id: 'CA1', active: 'כן', bind_ts: '', release_ts: '' }];
    return db;
  },
  /* אירוע יומן ידני — השעון ברתמה מחזיר תאריך בלבד (לקח B70) */
  ev(db, type, stage, machine, hhmm) {
    const e = {
      id: 'EVT-' + type + (db.laundryEvents.length + 1), ts: '2026-08-01 ' + (hhmm || '09:00') + ':00',
      intake_id: 'IK1', customer_id: 'C1', cart_id: 'CA1', machine_id: machine || '',
      stage: stage, event_type: type, worker_id: 'E1', worker_name: 'עובד',
      gross_kg: '', tare_kg: '', net_kg: '', price_per_kg: '', charge: '', note: '', portion_kg: '', ref_id: ''
    };
    db.laundryEvents.push(e);
    return e;
  }
};

SPECS.push({
  file: 't19-b73-wash18-srv',
  title: 'B73 / WASH-18 — השרת: קידום ידני בלי סריקה, והמלאי לא זז',
  needs: 'server',
  requires: ['w18Advance', 'handle', 'nobleOpenStarts', 'nobleMachineLoad', 'nobleMarkReady',
             'nobleStageStart', 'nobleIntake', 'nobleBoard', 'nobleWeigh', 'b49cAfterAdvance',
             'b34OfficeOk', 'b49cWorkerRef', 'NOBLE_WORK_STAGES', 'NOBLE_STAGES', 'STAGES',
             'inLaundryQty', 'availableQty', 'reservedQty', 'receiveReturn', 'TABLES',
             'b48BalancesAg', 'b2CreditUsedAg', 'b54Ledger', 'w10MulAg', 'fromAg', 'toAg',
             'sVal', 'sPick'],

  tests: {

    /* ---------- ⭐⭐ הפריט עצמו ---------- */

    '⭐⭐ קידום ידני מקדם קליטת NOBLE בלי סריקת עגלה ומכונה': (t, { srv }) => {
      const db = B73.db(srv);
      const r = srv.w18Advance(db, { intake_id: 'IK1', cart_id: 'CA1', to_stage: 'בכביסה' }, 'המנהל');
      t.ok(r.ok, 'הקידום הידני נדחה: ' + r.error);
      t.eq(db.laundryIntakes[0].status, 'בכביסה', '⛔⛔ סטטוס הקליטה לא התקדם');
      t.eq(db.laundryEvents.length, 1, 'לא נרשם בדיוק אירוע התחלה אחד');
      t.eq(srv.sVal(db.laundryEvents[0].event_type), 'התחלה', 'סוג האירוע שגוי');
      t.eq(String(db.laundryEvents[0].machine_id), '', '⛔ נרשמה מכונה לקידום שלא נסרקה בו מכונה');
      t.has(String(db.laundryEvents[0].note), 'קידום ידני', 'האירוע אינו מסומן כידני ביומן');
      t.has(String(db.laundryEvents[0].worker_name), 'המנהל', 'שם המקדם לא נשמר ביומן');
    },

    '⭐ קידום סוגר את המנה הפתוחה של העגלה — בדיוק כמו b49cAfterAdvance': (t, { srv }) => {
      const db = B73.db(srv, { status: 'בכביסה' });
      B73.ev(db, 'התחלה', 'בכביסה', 'M1', '09:00');
      t.eq(srv.nobleOpenStarts(db, 'IK1', 'CA1').length, 1, 'קו הבסיס שגוי — אין מנה פתוחה');
      const r = srv.w18Advance(db, { intake_id: 'IK1', cart_id: 'CA1', to_stage: 'בייבוש' }, 'המנהל');
      t.ok(r.ok, 'הקידום נדחה: ' + r.error);
      const ends = db.laundryEvents.filter(e => srv.sVal(e.event_type) === 'סיום');
      t.eq(ends.length, 1, '⛔ המנה הפתוחה במכונה לא נסגרה — המכונה תישאר תפוסה לנצח');
      t.eq(String(ends[0].machine_id), 'M1', 'הסיום לא נרשם על המכונה שנפתחה');
      const opens = srv.nobleOpenStarts(db, 'IK1', 'CA1');
      t.eq(opens.length, 1, 'אחרי הקידום אמורה להיות מנה פתוחה אחת בלבד');
      t.eq(srv.sVal(opens[0].stage), 'בייבוש', 'השלב הפתוח אינו שלב היעד');
    },

    '⭐ דילוג קדימה וחזרה אחורה — שניהם מותרים (הכרעת אבי 2)': (t, { srv }) => {
      const db = B73.db(srv);
      t.ok(srv.w18Advance(db, { intake_id: 'IK1', cart_id: 'CA1', to_stage: 'באריזה' }, 'המנהל').ok,
        '⛔ דילוג קדימה נחסם');
      t.eq(db.laundryIntakes[0].status, 'באריזה', 'הדילוג לא עדכן את הסטטוס');
      t.ok(srv.w18Advance(db, { intake_id: 'IK1', cart_id: 'CA1', to_stage: 'בכביסה' }, 'המנהל').ok,
        '⛔ חזרה אחורה נחסמה');
      t.eq(db.laundryIntakes[0].status, 'בכביסה', 'החזרה אחורה לא עדכנה את הסטטוס');
    },

    'הפעולה מחוברת למתג הפעולות (handle)': (t, { srv }) => {
      const db = B73.db(srv);
      const r = srv.handle('w18Advance', { intake_id: 'IK1', cart_id: 'CA1', to_stage: 'בכביסה' }, db, 'המנהל');
      t.ok(r && r.ok, '⛔ הפעולה אינה מחוברת ל-handle: ' + (r && r.error));
    },

    /* ---------- ⛔ הכרעה 1א: "מוכן" אינו עוקף את השקילה ---------- */

    '⛔⛔ "מוכן" אינו עובר בקידום הידני — ולא נכתב כלום': (t, { srv }) => {
      const db = B73.db(srv, { status: 'באריזה' });
      B73.ev(db, 'התחלה', 'באריזה', 'M1', '09:00');
      const n = db.laundryEvents.length;
      const r = srv.w18Advance(db, { intake_id: 'IK1', cart_id: 'CA1', to_stage: 'מוכן' }, 'המנהל');
      t.no(r.ok, '⛔⛔ קידום ידני העביר ל"מוכן" ועקף את חובת השקילה');
      t.eq(db.laundryEvents.length, n, '⛔⛔ נכתב אירוע ליומן למרות הדחייה — laundry_events הוא append-only');
      t.eq(db.laundryIntakes[0].status, 'באריזה', 'הסטטוס שונה למרות הדחייה');
    },

    '⛔ סוג מלוכלך של "מוכן" אינו עוקף את החסימה (B64a)': (t, { srv }) => {
      [' מוכן', 'מוכן ', 'מוכן\u00A0', '\u200Fמוכן'].forEach((dirty, i) => {
        const db = B73.db(srv);
        const r = srv.w18Advance(db, { intake_id: 'IK1', cart_id: 'CA1', to_stage: dirty }, 'המנהל');
        t.no(r.ok, i + ' — ⛔⛔ "מוכן" מלוכלך עקף את החסימה');
        t.eq(db.laundryEvents.length, 0, i + ' — נכתב אירוע למרות הדחייה');
      });
    },

    '⛔ רגרסיה B70: nobleMarkReady עדיין חוסמת קליטה שלא נשקלה': (t, { srv }) => {
      const db = B73.db(srv, { status: 'באריזה' });
      const r = srv.nobleMarkReady(db, { intake_id: 'IK1', worker_pin: '999' }, 'המנהל');
      t.no(r.ok, '⛔⛔ קליטה ללא שקילה סומנה כמוכנה — הכביסה תצא בלי חיוב');
      t.has(r.error, 'שקילה', 'הודעת החסימה אינה מדברת על שקילה');
    },

    /* ---------- ⛔ הכרעה 2א: מנהל ומשרד בלבד ---------- */

    '⛔ עובד מכבסה אינו רשאי לקדם ידנית — ולא נכתב כלום': (t, { srv }) => {
      const db = B73.db(srv);
      const r = srv.w18Advance(db, { intake_id: 'IK1', cart_id: 'CA1', to_stage: 'בכביסה' }, 'עובד');
      t.no(r.ok, '⛔⛔ עובד מכבסה עקף את הסריקה בשטח');
      t.eq(db.laundryEvents.length, 0, '⛔ נכתב אירוע למרות דחיית ההרשאה');
      t.eq(db.laundryIntakes[0].status, 'התקבל', 'הסטטוס השתנה למרות דחיית ההרשאה');
    },

    'משרד כן רשאי — אותו שער של b34OfficeOk': (t, { srv }) => {
      const db = B73.db(srv);
      t.ok(srv.w18Advance(db, { intake_id: 'IK1', cart_id: 'CA1', to_stage: 'בכביסה' }, 'המשרד').ok,
        'משרד נחסם — השער אינו b34OfficeOk');
    },

    /* ---------- ⛔ מצבי קצה ---------- */

    '⛔ עגלה שאינה משוייכת לקליטה — ועגלה ריקה': (t, { srv }) => {
      const db = B73.db(srv);
      t.no(srv.w18Advance(db, { intake_id: 'IK1', cart_id: 'CA2', to_stage: 'בכביסה' }, 'המנהל').ok,
        '⛔ קודמה עגלה שאינה שייכת לקליטה');
      t.no(srv.w18Advance(db, { intake_id: 'IK1', cart_id: '', to_stage: 'בכביסה' }, 'המנהל').ok,
        '⛔ קידום בלי עגלה התקבל');
      t.eq(db.laundryEvents.length, 0, '⛔ נכתב אירוע למרות הדחייה');
    },

    '⛔ קליטה שכבר במשלוח או נמסרה — נחסמת': (t, { srv }) => {
      ['במשלוח', 'נמסר'].forEach(st => {
        const db = B73.db(srv, { status: st });
        const r = srv.w18Advance(db, { intake_id: 'IK1', cart_id: 'CA1', to_stage: 'בכביסה' }, 'המנהל');
        t.no(r.ok, st + ' — ⛔ קליטה שעזבה את המפעל קודמה מלוח הכביסה');
        t.eq(db.laundryEvents.length, 0, st + ' — נכתב אירוע למרות הדחייה');
      });
    },

    '⛔ שלב יעד לא חוקי נדחה עם הודעה שמונה את המותרים': (t, { srv }) => {
      const db = B73.db(srv);
      const r = srv.w18Advance(db, { intake_id: 'IK1', cart_id: 'CA1', to_stage: 'שלב לא מוכר' }, 'המנהל');
      t.no(r.ok, '⛔ שלב לא מוכר התקבל');
      t.has(r.error, 'בכביסה', 'ההודעה אינה מונה את השלבים החוקיים');
      t.eq(db.laundryEvents.length, 0, 'נכתב אירוע למרות הדחייה');
    },

    'שלב יעד מלוכלך עובר דרך sPick ונשמר קנוני (B64a)': (t, { srv }) => {
      [' בייבוש', 'בייבוש ', 'בייבוש\u00A0', '\u200Fבייבוש'].forEach((dirty, i) => {
        const db = B73.db(srv);
        const r = srv.w18Advance(db, { intake_id: 'IK1', cart_id: 'CA1', to_stage: dirty }, 'המנהל');
        t.ok(r.ok, i + ' — שלב מלוכלך נדחה: ' + r.error);
        t.eq(db.laundryIntakes[0].status, 'בייבוש', i + ' — ⛔ הסטטוס נשמר מלוכלך — הבאג של B64a מתרבה');
        t.eq(srv.sVal(db.laundryEvents[0].stage), 'בייבוש', i + ' — השלב ביומן אינו קנוני');
      });
    },

    /* ---------- ⛔⛔ המלכודת המרכזית: המלאי לא זז ---------- */

    '⛔⛔ המלאי לא זז — inLaundryQty ו-availableQty זהים לפני ואחרי': (t, { srv }) => {
      const db = B73.db(srv);
      const inBefore = srv.inLaundryQty(db, 'IT1');
      const avBefore = srv.availableQty(db, 'IT1', '2026-09-01', '2026-09-03');
      const rsBefore = srv.reservedQty(db, 'IT1', '2026-09-01', '2026-09-03');
      t.ok(srv.w18Advance(db, { intake_id: 'IK1', cart_id: 'CA1', to_stage: 'בכביסה' }, 'המנהל').ok, 'הקידום נדחה');
      t.eq(srv.inLaundryQty(db, 'IT1'), inBefore,
        '⛔⛔ קליטת NOBLE זלגה ל-inLaundryQty — נוצרו laundry_tasks מזויפות');
      t.eq(srv.availableQty(db, 'IT1', '2026-09-01', '2026-09-03'), avBefore,
        '⛔⛔ הזמינות השתנתה בגלל קליטת כביסה — זו בדיוק המלכודת של WASH-18');
      t.eq(srv.reservedQty(db, 'IT1', '2026-09-01', '2026-09-03'), rsBefore, '⛔ השריון זז');
      t.eq(db.laundryTasks.length, 0, '⛔⛔ נוצרה שורת laundry_tasks לקליטת NOBLE');
    },

    '⛔ גם קליטה דרך nobleIntake אינה מייצרת שורת משימה': (t, { srv }) => {
      const db = B73.db(srv);
      db.carts[1].status = 'פנויה';
      const before = srv.availableQty(db, 'IT1', '2026-09-01', '2026-09-03');
      const r = srv.nobleIntake(db, { customer_id: 'C1', cart_barcodes: ['CA2'], worker_pin: '111' }, 'עובד');
      t.ok(r.ok, 'הקליטה נדחתה: ' + r.error);
      t.eq(db.laundryTasks.length, 0, '⛔⛔ nobleIntake התחילה ליצור laundry_tasks');
      t.eq(srv.availableQty(db, 'IT1', '2026-09-01', '2026-09-03'), before, '⛔⛔ קליטה חדשה הזיזה את המלאי');
    },

    /* ---------- ⛔ לא מזדהם ולא שובר ---------- */

    '⛔ קידום ידני אינו מזדהם את תצוגת המכונות': (t, { srv }) => {
      const db = B73.db(srv);
      srv.w18Advance(db, { intake_id: 'IK1', cart_id: 'CA1', to_stage: 'בכביסה' }, 'המנהל');
      const load = srv.nobleMachineLoad(db);
      t.eq(Object.keys(load).length, 0,
        '⛔ מנה בלי מכונה נכנסה לעומס המכונות — הלוח החי יציג מכונה תפוסה שריקה');
      const b = srv.nobleBoard(db);
      t.ok(b.ok, 'הלוח החי נשבר אחרי קידום ידני: ' + b.error);
      t.eq(b.intakes.length, 1, 'הקליטה נעלמה מהלוח החי');
    },

    '⛔ סריקה רגילה ברצפת הייצור ממשיכה לעבוד אחרי קידום ידני': (t, { srv }) => {
      const db = B73.db(srv);
      srv.w18Advance(db, { intake_id: 'IK1', cart_id: 'CA1', to_stage: 'בייבוש' }, 'המנהל');
      const r = srv.nobleStageStart(db, { cart_barcode: 'CA1', machine_barcode: 'M1', worker_pin: '111' }, 'עובד');
      t.ok(r.ok, '⛔⛔ הסריקה הרגילה נשברה אחרי קידום ידני: ' + r.error);
      t.eq(r.stage, 'בכביסה', 'השלב נקבע על ידי המכונה — וזה לא השתנה');
    },

    '⛔ מסלול הטקסטיל של MAPA לא נגע — receiveReturn עדיין יוצר משימות': (t, { srv }) => {
      const db = B73.db(srv);
      db.orders = [{ id: 'OR', type: 'השכרה', customer_id: 'C1', status: 'סופקה',
                     start_date: '2026-09-01', end_date: '2026-09-03', delivery_fee: 0 }];
      db.orderLines = [{ id: 'L1', order_id: 'OR', item_id: 'IT1', qty: 4, unit_price: 25, returned_qty: '' }];
      const r = srv.receiveReturn(db, 'OR', [{ line_id: 'L1', qty: 4 }], '2026-09-04',
        (p) => p + '-R', 'המנהל');
      t.ok(r.ok, '⛔⛔ החזרת טקסטיל נשברה: ' + r.error);
      t.ok(db.laundryTasks.length > 0, '⛔⛔ receiveReturn הפסיק ליצור laundry_tasks — מסלול MAPA נהרס');
      t.ok(db.laundryTasks.every(x => String(x.item_id) !== ''), '⛔ נוצרה משימה בלי פריט');
    },

    /* ---------- ⛔ כסף וסכימה ---------- */

    '⛔ הכסף לא זז — קידום ידני אינו מחייב ואינו מבטל חיוב': (t, { srv }) => {
      const db = B73.db(srv, { status: 'באריזה' });
      srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 25, worker_pin: '111' }, 'עובד');
      const chargeBefore = db.laundryIntakes[0].total_charge;
      const netBefore = db.laundryIntakes[0].net_weight_kg;
      srv.w18Advance(db, { intake_id: 'IK1', cart_id: 'CA1', to_stage: 'בייבוש' }, 'המנהל');
      t.eq(db.laundryIntakes[0].total_charge, chargeBefore, '⛔⛔ החיוב השתנה בקידום שלב');
      t.eq(db.laundryIntakes[0].net_weight_kg, netBefore, '⛔ המשקל הנטו השתנה בקידום שלב');
    },

    '⛔ R6: שלושת מקורות היתרה מחזירים אותו מספר אחרי קידום ידני': (t, { srv }) => {
      const db = B73.db(srv, { status: 'באריזה' });
      srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 25, worker_pin: '111' }, 'עובד');
      db.laundryIntakes[0].invoice_id = 'INV1';
      db.invoices = [{ id: 'INV1', number: 1001, order_id: '', customer_id: 'C1',
        date: '2026-08-02', subtotal: 200, vat_rate: 0.18, vat: 36, total: 236, status: 'פתוחה' }];
      srv.b54Bump();
      const bal = srv.b48BalancesAg(db)['C1'] || 0;
      t.ok(bal > 0, 'קו הבסיס אפס — הבדיקה אינה מוכיחה דבר');
      srv.w18Advance(db, { intake_id: 'IK1', cart_id: 'CA1', to_stage: 'בייבוש' }, 'המנהל');
      srv.b54Bump();
      const after = srv.b48BalancesAg(db)['C1'] || 0;
      t.eq(after, bal, '⛔⛔ יתרת הלקוח השתנתה בקידום שלב');
      t.eq(srv.b2CreditUsedAg(db, 'C1'), after, '⛔ מנוע האשראי וספר החיובים התפצלו (R6)');
    },

    '⛔ אין שינוי סכימה — שלוש הטבלאות לא זזו': (t, { srv }) => {
      t.eq(JSON.stringify(srv.TABLES.laundry_events),
        JSON.stringify(['id', 'ts', 'intake_id', 'customer_id', 'cart_id', 'machine_id', 'stage',
          'event_type', 'worker_id', 'worker_name', 'gross_kg', 'tare_kg', 'net_kg',
          'price_per_kg', 'charge', 'note', 'portion_kg', 'ref_id']),
        '⛔⛔ סכימת laundry_events השתנתה — B73 הוגדר בלי שינוי סכימה');
      t.eq(srv.TABLES.laundry_tasks[srv.TABLES.laundry_tasks.length - 1], 'intake_id',
        '⛔ סכימת laundry_tasks השתנתה');
      t.ok(srv.TABLES.laundry_intakes.indexOf('status') > -1, '⛔ laundry_intakes.status נעלם');
    },

    '⛔⛔ laundry_events נשאר append-only והדפוס של WASH-03 לא חזר': (t, { H }) => {
      const src = H.stripComments(H.serverSrc());
      t.hasNot(src, "writeTable('laundry_events'", '⛔⛔ laundry_events נדרס — הוא append-only');
      t.hasNot(src, 'writeTable("laundry_events"', '⛔⛔ laundry_events נדרס — הוא append-only');
      t.hasNot(src, 'lastByCart', '⛔⛔ הדפוס של WASH-03 חזר לקוד');
    },

    '⛔ B71 לא נשבר — כסף הכביסה עדיין באגורות שלמות': (t, { srv }) => {
      t.eq(srv.w10MulAg(0.59, 8.5), 502, '⛔⛔ החישוב באגורות שלמות נשבר');
      t.eq(srv.fromAg(502), 5.02, '⛔ ההמרה חזרה לשקלים נשברה');
    },

    '⛔ אין רשימת שלבים שנייה — הקידום נשען על NOBLE_WORK_STAGES': (t, { srv }) => {
      t.eq(JSON.stringify(srv.NOBLE_WORK_STAGES),
        JSON.stringify(['בכביסה', 'בייבוש', 'בגיהוץ וקיפול', 'באריזה']),
        '⛔ רשימת שלבי העבודה השתנתה — הקידום הידני נשען עליה');
    }

  }
});

SPECS.push({
  file: 't19-b73-wash18-ui',
  title: 'B73 / WASH-18 — הממשק: הקליטה על לוח הכביסה',
  needs: 'ui',
  requires: ['rLaundry', 'w18BoardCol', 'w18BoardIntakes', 'w18HasTasks', 'w18Carts',
             'w18CartOpens', 'w18CardHtml', 'w18CanManual', 'w18AdvanceForm', 'w18DoAdvance',
             'w18GoFloor', 'w18Targets', 'go', 'el', 'sVal', 'sPick', 'STAGES', 'NOBLE_STAGES',
             'NOBLE_MACHINE_STAGES', 'advanceForm', 'b49bIsVirtual'],

  tests: {

    /* ---------- ⭐⭐ הפריט עצמו ---------- */

    '⭐⭐ WASH-18: קליטת כביסה של לקוח מופיעה על לוח הכביסה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'מלון הים', active: 'כן' }];
      w.DB.carts = [{ id: 'CA1', barcode: 'CA1', status: 'בשימוש' }];
      w.DB.laundryIntakes = [{ id: 'IK1', customer_id: 'C1', internal: '', status: 'בכביסה',
        intake_ts: '2026-08-16 08:00', ready_ts: '', order_id: '', net_weight_kg: '' }];
      w.DB.intakeCarts = [{ id: 'IC1', intake_id: 'IK1', cart_id: 'CA1', active: 'כן' }];
      w.go('laundry');
      const h = w.el('main').innerHTML;
      t.has(h, 'מלון הים', '⛔⛔ קליטת הלקוח אינה מופיעה בלוח — זה WASH-18 עצמו');
      t.has(h, 'IK1', 'מזהה הקליטה אינו מוצג');
      t.has(h, 'עגלה CA1', 'העגלה אינה מוצגת בכרטיס');
      t.has(h, 'כביסת לקוח', 'הכרטיס אינו מסומן כקליטה — יבלבלו אותה עם משימת טקסטיל');
    },

    '⭐ הקליטה יושבת בעמודת השלב הנכון, ו"באריזה" בעמודת הגיהוץ': (t, { w }) => {
      const mk = st => ({ id: 'IK1', customer_id: 'C1', internal: '', status: st, ready_ts: '' });
      t.eq(w.w18BoardCol(mk('התקבל')), 'התקבל', 'עמודה שגויה ל"התקבל"');
      t.eq(w.w18BoardCol(mk('בייבוש')), 'בייבוש', 'עמודה שגויה ל"בייבוש"');
      t.eq(w.w18BoardCol(mk('באריזה')), 'בגיהוץ וקיפול',
        '⛔ "באריזה" אינו עמודה בלוח — הוא אמור להופיע בגיהוץ וקיפול');
      t.eq(w.w18BoardCol(mk('במשלוח')), '', '⛔ קליטה שיצאה למשלוח נשארה על הלוח');
      t.eq(w.w18BoardCol(mk('נמסר')), '', '⛔ קליטה שנמסרה נשארה על הלוח');
    },

    '⛔ שלב מלוכלך או לא מוכר — הקליטה לא נעלמת (לקח WASH-14)': (t, { w }) => {
      const mk = st => ({ id: 'IK1', customer_id: 'C1', internal: '', status: st, ready_ts: '' });
      [' בכביסה', 'בכביסה ', 'בכביסה ', '‏בכביסה'].forEach((dirty, i) => {
        t.eq(w.w18BoardCol(mk(dirty)), 'בכביסה', i + ' — ⛔⛔ שלב מלוכלך העלים את הקליטה');
      });
      t.eq(w.w18BoardCol(mk('שלב לא מוכר')), 'התקבל',
        '⛔ שלב לא מוכר העלים את הקליטה מהלוח לגמרי');
    },

    /* ---------- ⛔ הכרעה 4א: אין כפילות ---------- */

    '⛔⛔ קליטה שיש לה משימות (החזרת טקסטיל B49c) אינה מוצגת פעמיים': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.laundryIntakes = [{ id: 'IK1', customer_id: '', internal: 'כן', status: 'בכביסה', ready_ts: '' }];
      w.DB.intakeCarts = [{ id: 'IC1', intake_id: 'IK1', cart_id: 'VCART-001', active: 'כן' }];
      w.DB.laundryTasks = [{ id: 'W1', order_id: 'OR', item_id: 'IT1', qty: 4, stage: 'בכביסה',
        cart_id: 'VCART-001', intake_id: 'IK1', done_date: '' }];
      t.ok(w.w18HasTasks('IK1'), 'הזיהוי של קליטה עם משימות נכשל');
      t.eq(w.w18BoardIntakes().length, 0,
        '⛔⛔ החזרת טקסטיל תוצג פעמיים בלוח — גם כמשימה וגם כקליטה');
    },

    'כביסה פנימית בלי משימות — כן מוצגת, עם תג מפורש': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.carts = [{ id: 'CA1', barcode: 'CA1', status: 'בשימוש' }];
      w.DB.laundryIntakes = [{ id: 'IK2', customer_id: '', internal: 'כן', status: 'בייבוש', ready_ts: '' }];
      w.DB.intakeCarts = [{ id: 'IC1', intake_id: 'IK2', cart_id: 'CA1', active: 'כן' }];
      t.eq(w.w18BoardIntakes().length, 1, 'כביסה פנימית ידנית נעלמה מהלוח');
      t.has(w.w18CardHtml(w.DB.laundryIntakes[0]), 'פנימי MAPA',
        '⛔ כביסה פנימית אינה מסומנת — תיראה כאילו היא של לקוח');
    },

    /* ---------- ⛔ הכרעה 2א: מי רואה כפתור קידום ידני ---------- */

    '⛔ כפתור הקידום הידני — למנהל ולמשרד בלבד': (t, { w, srv, H }) => {
      const seed = () => {
        w.DB.carts = [{ id: 'CA1', barcode: 'CA1', status: 'בשימוש' }];
        w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
        w.DB.laundryIntakes = [{ id: 'IK1', customer_id: 'C1', internal: '', status: 'בכביסה', ready_ts: '' }];
        w.DB.intakeCarts = [{ id: 'IC1', intake_id: 'IK1', cart_id: 'CA1', active: 'כן' }];
      };
      H.login(w, 'מנהל', srv); seed();
      t.has(w.w18CardHtml(w.DB.laundryIntakes[0]), 'w18AdvanceForm(', 'מנהל אינו רואה את כפתור הקידום');
      H.login(w, 'משרד', srv); seed();
      t.has(w.w18CardHtml(w.DB.laundryIntakes[0]), 'w18AdvanceForm(', 'משרד אינו רואה את כפתור הקידום');
      H.login(w, 'מכבסה', srv); seed();
      const h = w.w18CardHtml(w.DB.laundryIntakes[0]);
      t.hasNot(h, 'w18AdvanceForm(', '⛔⛔ עובד מכבסה רואה קידום ידני — הכרעה 2א הופרה');
      t.has(h, 'w18GoFloor(', '⛔ עובד מכבסה אינו רואה אפילו קיצור לרצפת הייצור');
    },

    '⛔ טופס הקידום — בורר עגלה (3ב) + בורר שלב עם אזהרת "מוכן"': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.carts = [{ id: 'CA1', barcode: 'CA1', status: 'בשימוש' },
                    { id: 'CA2', barcode: 'CA2', status: 'בשימוש' }];
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.laundryIntakes = [{ id: 'IK1', customer_id: 'C1', internal: '', status: 'בכביסה', ready_ts: '' }];
      w.DB.intakeCarts = [{ id: 'IC1', intake_id: 'IK1', cart_id: 'CA1', active: 'כן' },
                          { id: 'IC2', intake_id: 'IK1', cart_id: 'CA2', active: 'כן' }];
      w.w18AdvanceForm('IK1');
      const f = w.el('modal').innerHTML;
      t.has(f, 'w18_cart', '⛔ אין בורר עגלה — הכרעה 3ב הופרה');
      t.has(f, 'CA2', 'העגלה השנייה אינה בבורר');
      t.has(f, 'w18_to', 'אין בורר שלב יעד');
      t.has(f, 'בייבוש', 'שלב עבודה חסר בבורר');
      t.hasNot(f, '>בכביסה<', 'השלב הנוכחי אמור לרדת מרשימת היעדים');
      t.has(f, 'דורש שכל העגלות נשקלו',
        '⛔⛔ "מוכן" מוצג בלי האזהרה שהוא דורש שקילה');
      w.closeModal();
    },

    '⛔⛔ "מוכן" בממשק זורם ל-nobleMarkReady ולא ל-w18Advance': (t, { w, H }) => {
      const src = H.stripComments(H.uiScript());
      const m = src.match(/async function w18DoAdvance\(\)[\s\S]*?\n\}/) ||
                src.match(/async function w18DoAdvance\([\s\S]*?\n\}/);
      t.ok(!!m, 'w18DoAdvance נעלמה מהממשק');
      t.has(m[0], 'nobleMarkReady',
        '⛔⛔ "מוכן" אינו עובר דרך nobleMarkReady — חובת השקילה נעקפה');
      t.has(m[0], 'w18Advance', 'קידום שלב רגיל אינו נשלח ל-w18Advance');
    },

    /* ---------- ⛔ רגרסיות ---------- */

    '⛔ משימות הטקסטיל של MAPA ממשיכות להופיע בדיוק כמו היום': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.items = [{ id: 'IT1', name: 'מגבת', active: 'כן' }];
      w.DB.orders = [{ id: 'OR', type: 'השכרה', customer_id: 'C1', status: 'סופקה' }];
      w.DB.laundryTasks = [{ id: 'W1', order_id: 'OR', item_id: 'IT1', qty: 4, stage: 'בכביסה',
        cart_id: 'CA9', machine_id: 'M9', done_date: '', intake_id: '' }];
      w.go('laundry');
      const h = w.el('main').innerHTML;
      t.has(h, 'מגבת', '⛔⛔ משימת הטקסטיל נעלמה מהלוח');
      t.has(h, 'advanceForm(', '⛔ כפתור הקידום של משימת טקסטיל נעלם');
      t.has(h, 'laundrySplitForm(', '⛔ כפתור הפיצול נעלם');
    },

    '⛔ מונה העמודה סופר את שני המקורות': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.items = [{ id: 'IT1', name: 'מגבת', active: 'כן' }];
      w.DB.carts = [{ id: 'CA1', barcode: 'CA1', status: 'בשימוש' }];
      w.DB.orders = [{ id: 'OR', type: 'השכרה', customer_id: 'C1', status: 'סופקה' }];
      w.DB.laundryTasks = [{ id: 'W1', order_id: 'OR', item_id: 'IT1', qty: 4, stage: 'בכביסה',
        cart_id: 'CA9', machine_id: 'M9', done_date: '', intake_id: '' }];
      w.DB.laundryIntakes = [{ id: 'IK1', customer_id: 'C1', internal: '', status: 'בכביסה', ready_ts: '' }];
      w.DB.intakeCarts = [{ id: 'IC1', intake_id: 'IK1', cart_id: 'CA1', active: 'כן' }];
      w.go('laundry');
      t.has(w.el('main').innerHTML, 'בכביסה<span class="cnt">2</span>',
        '⛔ מונה העמודה אינו סופר את שני המקורות');
    },

    '⛔ רגרסיה B72: אין דרך להוסיף פריט להזמנת כביסה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'לקוח', active: 'כן' }];
      w.DB.orders = [{ id: 'OW', type: 'כביסה', customer_id: 'C1', status: 'טיוטה',
                       start_date: '2026-09-01', end_date: '2026-09-03', notes: '' }];
      w.openOrder('OW');
      t.hasNot(w.el('modal').innerHTML, '+ הוסף פריט', '⛔⛔ בורר המלאי חזר להזמנת כביסה (B72)');
      w.closeModal();
    },

    '⛔ שכבה 2 לא נגעה — B73 אינו נוגע ביכולת דפדפן': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const names = w.b61Tests().map(x => x.n);
      t.no(names.some(n => /WASH-18|B73/.test(n)),
        '⛔ נוספה טענה לכרטיס הבדיקה העצמית — B73 אינו יכולת דפדפן');
    }

  }
});

/* ==================== t20 — B74 / WASH-20: סוג הזמנה מלוכלך ====================
   השורש: b54Ledger ו-b54RawOrderTotalAg (וצמד המראה שלהן בממשק) השוו
   String(o.type) !== 'כביסה' בהשוואה **גולמית**. הזמנת כביסה שסוגה בגיליון
   נושא רווח קשיח · סימן כיוון · רווח נגרר — נפלה לצד ההשכרה, ושורות
   ההזמנה שלה נספרו ככסף בניגוד ל-C5.
   ⭐ הממצא שקבע את היקף הבדיקות: כשקיימת חשבונית פעילה, baseAg הוא
   toAg(inv.total) (C4א) — ולכן החוב **אינו זז**, רק פירוט השורות בספר.
   החשיפה האמיתית היא הזמנה מלוכלכת **בלי** חשבונית. */

const B74 = {
  /* ארבע צורות לכלוך של אותו ערך. הראשונה נקייה — קו הבסיס. */
  DIRTY: ['כביסה\u00A0', ' כביסה', 'כביסה ', '\u200Eכביסה'],

  db(srv, type, over) {
    over = over || {};
    const db = H.emptyDb(srv);
    db.customers = [{ id: 'C1', name: 'מלון הים', active: 'כן', credit_limit: 100000 }];
    db.items = [{ id: 'IT1', name: 'מגבת', active: 'כן' }];
    db.stockMoves = [{ id: 'SM1', item_id: 'IT1', qty: 100, date: '2026-07-01', warehouse_id: '' }];
    db.orders = [{
      id: 'O1', order_number: 'הז-1', customer_id: 'C1', type: type,
      status: over.status || 'מאושרת', start_date: '2026-08-01', end_date: '2026-08-05',
      delivery_fee: over.fee === undefined ? 0 : over.fee, shortage_charge: 0,
      warehouse_id: '', created_at: '2026-08-01'
    }];
    db.orderLines = [{ id: 'OL1', order_id: 'O1', item_id: 'IT1', qty: 10, unit_price: 25 }];
    if (over.invoice) {
      db.invoices = [{ id: 'V1', number: 'INV-1', order_id: 'O1', customer_id: 'C1',
        status: 'נשלחה', date: '2026-08-05', subtotal: 250, vat: 45, total: 295 }];
    }
    return db;
  },

  /* סך החוב של הלקוח לפי הספר — הצד שנבדק ב-R6 */
  debt(srv, db) { return srv.b54CustomerOpenAg(db)['C1'] || 0; },

  lineRow(srv, db) {
    return srv.b54Ledger(db).filter(r => r.origin_type === 'order_lines');
  }
};

SPECS.push({
  file: 't20-b74-wash20-srv',
  title: 'B74 / WASH-20 — השרת: סוג הזמנה מלוכלך אינו מחייב שורות כביסה',
  needs: 'server',
  requires: ['w17IsWash', 'w20TypeMarks', 'b54Ledger', 'b54RawOrderTotalAg', 'b54CustomerOpenAg',
             'b48BalancesAg', 'b2CreditUsedAg', 'b54LedgerAudit', 'b54Bump', 'orderTotal',
             'b2OrderBalanceAg', 'toAg', 'fromAg', 'sVal', 'sPick', 'ORDER_TYPES',
             'availableQty', 'reservedQty', 'inLaundryQty', 'B54_SKIP_ORDER'],

  tests: {

    /* ---------- ⭐⭐ הפריט עצמו ---------- */

    '⭐⭐ WASH-20: כביסה עם סוג מלוכלך בארבע צורות — הכסף הוא אפס': (t, { srv }) => {
      B74.DIRTY.forEach(ty => {
        const db = B74.db(srv, ty);
        srv.b54Bump();
        t.eq(srv.b54RawOrderTotalAg(db, db.orders[0]), 0,
          '⛔⛔ שורות ההזמנה נספרו ככסף על סוג "' + JSON.stringify(ty) + '" — זה WASH-20 עצמו');
        t.eq(B74.lineRow(srv, db).length, 0,
          '⛔⛔ נוצרה שורת "שורות הזמנה" בספר על סוג מלוכלך "' + JSON.stringify(ty) + '"');
        t.eq(B74.debt(srv, db), 0, '⛔⛔ נוצר חוב שווא ללקוח על כביסה מלוכלכת');
      });
      srv.b54Bump();
    },

    '⛔ קו בסיס — כביסה נקייה הייתה אפס גם קודם, ולא השתנתה': (t, { srv }) => {
      const db = B74.db(srv, 'כביסה');
      srv.b54Bump();
      t.eq(srv.b54RawOrderTotalAg(db, db.orders[0]), 0, 'כביסה נקייה חויבה — רגרסיה ב-C5');
      t.eq(B74.debt(srv, db), 0, 'כביסה נקייה יצרה חוב');
      srv.b54Bump();
    },

    '⛔ רגרסיה: הזמנת השכרה מחויבת בדיוק כמו היום': (t, { srv }) => {
      const db = B74.db(srv, 'השכרה');
      srv.b54Bump();
      t.eq(srv.b54RawOrderTotalAg(db, db.orders[0]), 25000, '⛔ סכום ההשכרה זז — 10 × 25 ₪ = 250 ₪');
      t.eq(B74.lineRow(srv, db).length, 1, '⛔ שורת ההשכרה נעלמה מהספר');
      t.eq(B74.debt(srv, db), 25000, '⛔ חוב ההשכרה זז');
      t.eq(srv.orderTotal(db, 'O1'), 250, 'orderTotal לא מחזיר 250 ₪');
      srv.b54Bump();
    },

    '⛔ השכרה עם סוג מלוכלך — עדיין מחויבת (אין ריכוך לצד השני)': (t, { srv }) => {
      const db = B74.db(srv, ' השכרה\u00A0');
      srv.b54Bump();
      t.eq(srv.b54RawOrderTotalAg(db, db.orders[0]), 25000, 'השכרה מלוכלכת הפסיקה להיות כסף — זו טעות בכיוון ההפוך');
      srv.b54Bump();
    },

    '⛔ סוג שאינו מוכר ואינו ריק — מטופל כהשכרה, בדיוק כמו לפני התיקון': (t, { srv }) => {
      const db = B74.db(srv, 'שירות');
      srv.b54Bump();
      t.eq(srv.b54RawOrderTotalAg(db, db.orders[0]), 25000, '⛔ סוג לא מוכר הפסיק להיחשב — התנהגות השתנתה בלי הכרעה');
      srv.b54Bump();
    },

    '⛔ סוג ריק — מטופל כהשכרה, בדיוק כמו לפני התיקון': (t, { srv }) => {
      const db = B74.db(srv, '');
      srv.b54Bump();
      t.eq(srv.b54RawOrderTotalAg(db, db.orders[0]), 25000, '⛔ הזמנה בלי סוג שינתה התנהגות');
      srv.b54Bump();
    },

    /* ---------- ⭐ הממצא: חשבונית קיימת = הכסף לא זז ---------- */

    '⭐⭐ כביסה מלוכלכת שכבר הופקה לה חשבונית — סך החוב אינו זז (C4א)': (t, { srv }) => {
      const db = B74.db(srv, 'כביסה\u00A0', { invoice: 1, fee: 100 });
      srv.b54Bump();
      const rows = srv.b54Ledger(db);
      t.eq(rows.reduce((s, r) => s + r.open_ag, 0), 29500,
        '⛔⛔ סך החוב זז — סכום המסמך חייב לגבור על השורות (C4א)');
      t.eq(B74.debt(srv, db), 29500, '⛔⛔ חוב הלקוח זז אף שקיימת חשבונית');
      t.eq(B74.lineRow(srv, db).length, 0, '⛔ שורת שורות ההזמנה נשארה בפירוט הספר');
      srv.b54Bump();
    },

    /* ---------- ⭐ R6 — שלושת המקורות ---------- */

    '⛔⛔ R6: שלושת מקורות הכסף מחזירים אותו מספר — על נקי ועל מלוכלך': (t, { srv }) => {
      [['השכרה', 25000], ['כביסה', 0], ['כביסה\u00A0', 0], [' השכרה ', 25000]].forEach(([ty, exp]) => {
        const db = B74.db(srv, ty);
        srv.b54Bump();
        const led = srv.b54CustomerOpenAg(db)['C1'] || 0;
        const bal = srv.b48BalancesAg(db)['C1'] || 0;
        const cred = srv.b2CreditUsedAg(db, 'C1');
        t.eq(led, exp, 'b54Ledger מחזיר ' + led + ' במקום ' + exp + ' על סוג ' + JSON.stringify(ty));
        t.eq(bal, led, '⛔⛔ b48BalancesAg נבדל מהספר — R6 נשבר');
        t.eq(cred, led, '⛔⛔ b2CreditUsedAg נבדל מהספר — מנוע האשראי נשבר');
        srv.b54Bump();
      });
    },

    '⛔ b2OrderBalanceAg על הזמנה שאינה בספר (טיוטה) — כביסה מלוכלכת היא אפס': (t, { srv }) => {
      const db = B74.db(srv, 'כביסה\u00A0', { status: 'טיוטה' });
      srv.b54Bump();
      t.eq(srv.b2OrderBalanceAg(db, 'O1'), 0, '⛔ טיוטת כביסה מלוכלכת מחזיקה יתרה');
      const db2 = B74.db(srv, 'השכרה', { status: 'טיוטה' });
      srv.b54Bump();
      t.eq(srv.b2OrderBalanceAg(db2, 'O1'), 25000, '⛔ טיוטת השכרה איבדה את יתרתה');
      srv.b54Bump();
    },

    /* ---------- ⛔ המלאי לא זז ---------- */

    '⛔ המלאי לא זז: availableQty · reservedQty · inLaundryQty': (t, { srv }) => {
      const clean = B74.db(srv, 'כביסה');
      const dirty = B74.db(srv, 'כביסה\u00A0');
      ['reservedQty', 'inLaundryQty'].forEach(fn => {
        const a = srv[fn](clean, 'IT1', '2026-08-01', '2026-08-05');
        const b = srv[fn](dirty, 'IT1', '2026-08-01', '2026-08-05');
        t.eq(String(b), String(a), '⛔ ' + fn + ' השתנה בין סוג נקי למלוכלך');
      });
      t.eq(srv.availableQty(dirty, 'IT1', '2026-08-01', '2026-08-05'),
           srv.availableQty(clean, 'IT1', '2026-08-01', '2026-08-05'),
           '⛔ availableQty השתנה — התיקון נגע במלאי');
    },

    /* ---------- ⭐ האבחון ---------- */

    '⭐ האבחון מדווח על ההזמנה המלוכלכת ועל הכסף שירד מהחוב': (t, { srv }) => {
      const db = B74.db(srv, 'כביסה\u00A0');
      srv.b54Bump();
      const r = srv.b54LedgerAudit(db, {});
      t.eq(r.dirty_type.count, 1, '⛔ האבחון לא זיהה את ההזמנה המלוכלכת');
      t.eq(r.dirty_type.moved, 250, '⛔ האבחון אינו מדווח את הסכום שירד מהחוב');
      t.eq(r.dirty_type.rows[0].canon, 'כביסה', 'הסוג הקנוני אינו מדווח');
      t.has(String(r.dirty_type.rows[0].marks.join(' ')), 'רווח קשיח', '⛔ סוג הלכלוך אינו מזוהה בשם');
      t.eq(r.counts.orders_wash, 1, '⛔ מונה הזמנות הכביסה עדיין מפספס סוג מלוכלך');
      t.eq(r.phantom.count, 1, '⛔ סעיף החוב השווא עדיין מפספס סוג מלוכלך');
      srv.b54Bump();
    },

    '⭐ האבחון מדווח moved=0 כשקיימת חשבונית — הכסף לא זז': (t, { srv }) => {
      const db = B74.db(srv, 'כביסה\u00A0', { invoice: 1 });
      srv.b54Bump();
      const r = srv.b54LedgerAudit(db, {});
      t.eq(r.dirty_type.count, 1, 'ההזמנה לא דווחה');
      t.eq(r.dirty_type.moved, 0, '⛔⛔ האבחון מדווח שכסף זז בזמן שהחשבונית גוברת (C4א)');
      t.eq(String(r.dirty_type.rows[0].invoice), 'INV-1', 'מספר החשבונית אינו מדווח');
      srv.b54Bump();
    },

    '⛔ האבחון שקט כשהכול נקי — אין ממצא שווא': (t, { srv }) => {
      [['השכרה'], ['כביסה']].forEach(([ty]) => {
        const db = B74.db(srv, ty);
        srv.b54Bump();
        const r = srv.b54LedgerAudit(db, {});
        t.eq(r.dirty_type.count, 0, '⛔ ממצא שווא על סוג נקי ' + ty);
        t.eq(r.unknown_type.count, 0, '⛔ סוג קנוני דווח כלא-מוכר');
        srv.b54Bump();
      });
    },

    '⛔ סוג ריק אינו ממצא · סוג לא מוכר כן': (t, { srv }) => {
      const empty = B74.db(srv, '');
      srv.b54Bump();
      const r1 = srv.b54LedgerAudit(empty, {});
      t.eq(r1.unknown_type.count, 0, '⛔ סוג ריק דווח כממצא — רעש');
      t.eq(r1.dirty_type.count, 0, '⛔ סוג ריק דווח כמלוכלך');
      const unk = B74.db(srv, 'שירות');
      srv.b54Bump();
      const r2 = srv.b54LedgerAudit(unk, {});
      t.eq(r2.unknown_type.count, 1, '⛔ סוג שאינו מוכר אינו מדווח');
      t.eq(r2.dirty_type.count, 0, '⛔ סוג לא מוכר נספר כמלוכלך');
      srv.b54Bump();
    },

    '⛔ הזמנה בוטלה/טיוטה/הצעת מחיר אינה מדווחת באבחון': (t, { srv }) => {
      ['בוטלה', 'טיוטה', 'הצעת מחיר'].forEach(st => {
        const db = B74.db(srv, 'כביסה\u00A0', { status: st });
        srv.b54Bump();
        t.eq(srv.b54LedgerAudit(db, {}).dirty_type.count, 0, '⛔ ' + st + ' דווחה — היא מסוננת מהספר ממילא');
        srv.b54Bump();
      });
    },

    'w20TypeMarks מזהה את חמש צורות הלכלוך בשמן': (t, { srv }) => {
      t.has(srv.w20TypeMarks('כביסה\u00A0').join(' '), 'רווח קשיח', 'רווח קשיח לא זוהה');
      t.has(srv.w20TypeMarks('\u200Eכביסה').join(' '), 'סימן כיוון', 'סימן כיוון לא זוהה');
      t.has(srv.w20TypeMarks(' כביסה').join(' '), 'רווח מוביל', 'רווח מוביל לא זוהה');
      t.has(srv.w20TypeMarks('כביסה ').join(' '), 'רווח נגרר', 'רווח נגרר לא זוהה');
      t.eq(srv.w20TypeMarks('כביסה').length, 0, 'ערך נקי סומן כמלוכלך');
    },

    /* ---------- ⛔ שומרי קוד מקור ---------- */

    '⛔⛔ ההשוואה הגולמית לא חוזרת לנקודות הכסף בשרת': (t, { H }) => {
      /* ⚠ הסריקה מצומצמת לגופי הכסף בכוונה. 19 אתרי תפעול/תצוגה
         עדיין משווים גולמית — הם אינם כסף ואינם בהיקף (מוקצים ל-B75). */
      const src = H.stripComments(H.serverSrc());
      const body = n => {
        const i = src.indexOf('function ' + n);
        return i < 0 ? '' : src.slice(i, src.indexOf('\n}', i));
      };
      ['b54Ledger', 'b54RawOrderTotalAg', 'b54LedgerAudit'].forEach(fn => {
        const b = body(fn);
        t.ok(!!b, fn + ' לא נמצאה בקוד השרת');
        t.eq((b.match(/String\(o\.type\)|o\.type\s*===|o\.type\s*!==/g) || []).length, 0,
          '⛔⛔ חזרה השוואת סוג גולמית בתוך ' + fn + ' — זה בדיוק WASH-20');
        t.has(b, 'w17IsWash', '⛔ ' + fn + ' אינה עוברת דרך w17IsWash');
      });
    },

    '⛔⛔ w17IsWash זהה תו-בתו בין השרת לממשק': (t, { H }) => {
      const grab = s => (s.match(/function w17IsWash\s*\([\s\S]*?\n?\}/) || [])[0] || '';
      const a = grab(H.serverSrc()), b = grab(H.uiScript());
      t.ok(!!a, 'w17IsWash לא נמצאה בקוד השרת');
      t.ok(!!b, 'w17IsWash לא נמצאה בממשק');
      t.eq(a.replace(/\s+/g, ' ').trim(), b.replace(/\s+/g, ' ').trim(),
        '⛔⛔ שתי ההגדרות התפצלו — זו בדיוק מחלקת הכשל של B64a');
    },

    '⛔ toAg לא נגע (R4) · nRound2 לא חזר לנקודות הכסף של B71': (t, { H }) => {
      const src = H.stripComments(H.serverSrc());
      t.ok(/function toAg\s*\(\s*v\s*\)\s*\{\s*return\s+w10Cent\(/.test(src.replace(/\s+/g, ' ')) ||
           /function toAg/.test(src), 'toAg נעלמה מקוד השרת');
      t.eq((src.match(/nRound2\(\s*net\s*\*\s*price\s*\)/g) || []).length, 0,
        '⛔⛔ nRound2(net*price) חזר — B71 נשבר');
      t.eq((src.match(/nRound2\(\s*sub\s*\*\s*VAT_RATE\s*\)/g) || []).length, 0,
        '⛔⛔ nRound2(sub*VAT_RATE) חזר — B71 נשבר');
    }
  }
});

SPECS.push({
  file: 't20-b74-wash20-ui',
  title: 'B74 / WASH-20 — הממשק: אותו מספר בדיוק כמו השרת',
  needs: 'ui',
  requires: ['w17IsWash', 'b54RawOrderTotalAgFE', 'b54LedgerFE', 'custBalance',
             'b54AuditHtml', 'w20RowsHtml', 'toAg', 'fromAg', 'sVal', 'B65_TYPES'],

  tests: {

    /* ⚠⚠ הממשק מטמן את הספר ואת היתרות על אובייקט ה-DB עצמו
       (DB._b54Ledger · DB._b48Bal). בלי delete לפני כל מדידה, בדיקה
       שנייה מודדת את התוצאה של הראשונה ו"עוברת" בלי לבדוק כלום. */

    '⭐⭐ b54RawOrderTotalAgFE — כביסה מלוכלכת בארבע צורות היא אפס': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      ['כביסה\u00A0', ' כביסה', 'כביסה ', '\u200Eכביסה'].forEach(ty => {
        w.DB.customers = [{ id: 'C1', name: 'מלון הים', active: 'כן' }];
        w.DB.orders = [{ id: 'O1', order_number: 'הז-1', customer_id: 'C1', type: ty,
          status: 'מאושרת', start_date: '2026-08-01', end_date: '2026-08-05',
          delivery_fee: 0, shortage_charge: 0 }];
        w.DB.orderLines = [{ id: 'OL1', order_id: 'O1', item_id: 'IT1', qty: 10, unit_price: 25 }];
        w.DB.invoices = []; w.DB.payments = []; w.DB.charges = []; w.DB.laundryIntakes = [];
        delete w.DB._b54Ledger; delete w.DB._b48Bal;
        t.eq(w.b54RawOrderTotalAgFE(w.DB.orders[0]), 0,
          '⛔⛔ הממשק מחייב שורות כביסה על סוג ' + JSON.stringify(ty));
        t.eq(w.b54LedgerFE().filter(r => r.origin_type === 'order_lines').length, 0,
          '⛔⛔ שורת "שורות הזמנה" נוצרה בספר של הממשק');
      });
    },

    '⛔⛔ הממשק והשרת מחזירים אותו מספר בדיוק': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      [['השכרה', 25000], ['כביסה\u00A0', 0], ['שירות', 25000], ['', 25000]].forEach(([ty, exp]) => {
        const db = B74.db(srv, ty);
        srv.b54Bump();
        w.DB.customers = db.customers; w.DB.orders = db.orders; w.DB.orderLines = db.orderLines;
        w.DB.invoices = []; w.DB.payments = []; w.DB.charges = []; w.DB.laundryIntakes = [];
        delete w.DB._b54Ledger; delete w.DB._b48Bal;
        const ui = w.b54RawOrderTotalAgFE(w.DB.orders[0]);
        const sv = srv.b54RawOrderTotalAg(db, db.orders[0]);
        t.eq(ui, sv, '⛔⛔ הממשק (' + ui + ') והשרת (' + sv + ') נבדלו על סוג ' + JSON.stringify(ty));
        t.eq(ui, exp, 'הערך אינו ' + exp + ' על סוג ' + JSON.stringify(ty));
        srv.b54Bump();
      });
    },

    '⛔ רגרסיה: יתרת הלקוח בהשכרה לא זזה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'מלון הים', active: 'כן' }];
      w.DB.orders = [{ id: 'O1', order_number: 'הז-1', customer_id: 'C1', type: 'השכרה',
        status: 'מאושרת', start_date: '2026-08-01', end_date: '2026-08-05',
        delivery_fee: 0, shortage_charge: 0 }];
      w.DB.orderLines = [{ id: 'OL1', order_id: 'O1', item_id: 'IT1', qty: 10, unit_price: 25 }];
      w.DB.invoices = []; w.DB.payments = []; w.DB.charges = []; w.DB.laundryIntakes = [];
      delete w.DB._b54Ledger; delete w.DB._b48Bal;
      t.eq(w.custBalance('C1'), 250, '⛔ יתרת הלקוח בהשכרה זזה');
      w.DB.orders[0].type = 'כביסה\u00A0';
      delete w.DB._b54Ledger; delete w.DB._b48Bal;
      t.eq(w.custBalance('C1'), 0, '⛔⛔ יתרת הלקוח על כביסה מלוכלכת אינה אפס');
    },

    '⛔⛔ ההשוואה הגולמית לא חוזרת לשתי נקודות הכסף בממשק': (t, { H }) => {
      const src = H.stripComments(H.uiScript());
      t.ok(/function b54RawOrderTotalAgFE[\s\S]{0,200}w17IsWash/.test(src),
        '⛔ b54RawOrderTotalAgFE אינה עוברת דרך w17IsWash');
      t.ok(/function b54LedgerFE\b[\s\S]{0,3000}w17IsWash/.test(src),
        '⛔ b54LedgerFE אינה עוברת דרך w17IsWash');
    },

    '⭐ כרטיס האבחון מציג את הממצא החדש ואת הסכום': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const h = w.b54AuditHtml({
        ok: 1, ledger_rows: 3,
        counts: { orders: 1, orders_wash: 1, intakes: 0, invoices: 0, payments: 0, charges: 0 },
        phantom: { count: 0, amount: 0, rows: [] },
        intake_in_bulk: { count: 0, rows: [] }, intake_after_invoice: { count: 0, rows: [] },
        synthetic_invoices: { count: 0, rows: [] }, pay_no_status: { count: 0, amount: 0 },
        pending_intakes: { count: 0, amount: 0 },
        dirty_type: { count: 1, moved: 250, rows: [{ order: 'הז-1', customer: 'מלון הים',
          canon: 'כביסה', raw: 'כביסה\u00A0', marks: ['רווח קשיח'], lines: 250, invoice: '', moved: 250, status: 'מאושרת' }] },
        unknown_type: { count: 0, rows: [] }
      });
      t.has(h, 'WASH-20', 'הסעיף החדש אינו מופיע בכרטיס האבחון');
      t.has(h, 'הז-1', 'ההזמנה אינה מוצגת');
      t.has(h, 'רווח קשיח', '⛔ סוג הלכלוך אינו מוצג — אבי יראה "כביסה" מול "כביסה" ולא יבין');
      t.has(h, 'ירד מהחוב', 'הסכום שירד מהחוב אינו מסומן');
    },

    '⛔ כרטיס האבחון שקט כשאין ממצא, ועובד גם על תשובה ישנה בלי השדות': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const base = {
        ok: 1, ledger_rows: 0,
        counts: { orders: 0, orders_wash: 0, intakes: 0, invoices: 0, payments: 0, charges: 0 },
        phantom: { count: 0, amount: 0, rows: [] },
        intake_in_bulk: { count: 0, rows: [] }, intake_after_invoice: { count: 0, rows: [] },
        synthetic_invoices: { count: 0, rows: [] }, pay_no_status: { count: 0, amount: 0 },
        pending_intakes: { count: 0, amount: 0 }
      };
      const h = w.b54AuditHtml(base);
      t.has(h, 'לא נמצאו — סוג ההזמנה קנוני', '⛔ הסעיף אינו מציג מצב נקי');
      t.ok(h.indexOf('undefined') === -1, '⛔ תשובת שרת ישנה מייצרת undefined על המסך');
    },

    '⛔ שכבה 2 לא נגעה — WASH-20 אינו יכולת דפדפן': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const names = w.b61Tests().map(x => x.n).join(' | ');
      t.ok(names.indexOf('WASH-20') === -1, '⛔ נוספה טענה לשכבה 2 — היא נבדקת בשכבה 1');
    }
  }
});

/* ==================== t21 — B75: הניצולת · שכבת המכונות · הסוג הגולמי שאינו כסף ====================
   שישה פריטים באצווה אחת. הבדיקות כאן מקובצות לפי פריט, כדי שכשל יצביע
   מיד על מי מהם נשבר (M5).
   ⚠ WASH-21 נוגע במלאי ולא בכסף — ולכן יש כאן בדיקת מלאי מלאה
   (availableQty · reservedQty · b48CommittedQty · inLaundryQty) לפני
   ואחרי, על סוג נקי ועל סוג מלוכלך, וגם בדיקת R6 שמוכיחה שהכסף לא זז.
   ============================================================ */

const B75 = {
  DIRTY: ['השכרה\u00A0', ' השכרה', 'השכרה ', '\u200Eהשכרה'],

  /* מלאי: פריט אחד, 100 יחידות במחסן, הזמנת השכרה על 10 */
  invDb(srv, type) {
    const db = H.emptyDb(srv);
    db.settings = [];
    db.customers = [{ id: 'C1', name: 'מלון הים', active: 'כן', price_per_kg: 5, credit_limit: 100000 }];
    db.items = [{ id: 'IT1', name: 'מגבת', active: 'כן', rent_price: 25, wash_price: 3, weight_kg: 0.5, min_stock: '' }];
    db.stockMoves = [{ id: 'SM1', item_id: 'IT1', qty: 100, warehouse_id: '' }];
    db.orders = [{ id: 'O1', order_number: '1001', customer_id: 'C1', type: type, status: 'מאושרת',
      start_date: '2026-09-01', end_date: '2026-09-05', warehouse_id: '', delivery_fee: 0, shortage_charge: 0 }];
    db.orderLines = [{ id: 'OL1', order_id: 'O1', item_id: 'IT1', qty: 10, unit_price: 25, returned_qty: '' }];
    return db;
  },

  /* מכבסה: משימת כביסה פנימית של MAPA שקשורה לקליטת NOBLE */
  washDb(srv, opts) {
    opts = opts || {};
    const db = H.emptyDb(srv);
    db.settings = [];
    db.employees = [{ id: 'E1', name: 'מנהל', role: 'מנהל', active: 'כן', pin: opts.pin || '' }];
    db.customers = [{ id: 'C1', name: 'מלון הים', active: 'כן', price_per_kg: 5 }];
    db.items = [{ id: 'IT1', name: 'מגבת', active: 'כן', weight_kg: opts.itemKg === undefined ? 0.5 : opts.itemKg }];
    db.machines = [
      { id: 'M1', type: 'מכונת כביסה', capacity: 35, status: 'פעילה', auto_stage: 'בכביסה', barcode: 'M1' },
      { id: 'M2', type: 'מכונת כביסה', capacity: 35, status: 'פעילה', auto_stage: 'בכביסה', barcode: 'M2' }
    ];
    db.carts = [
      { id: 'CA1', barcode: 'CA1', status: 'בשימוש', tare_kg: 2, condition: 'תקינה' },
      { id: 'CA2', barcode: 'CA2', status: 'בשימוש', tare_kg: 2, condition: 'תקינה' }
    ];
    db.orders = [{ id: 'OR1', order_number: '2001', customer_id: 'C1', type: 'השכרה', status: 'הוחזרה',
      start_date: '2026-08-01', end_date: '2026-08-10', warehouse_id: '' }];
    db.laundryIntakes = [{ id: 'IK1', customer_id: '', internal: 'כן', status: 'התקבל',
      intake_ts: '2026-08-17 08:00', order_id: '', net_weight_kg: '', price_per_kg: '', total_charge: '' }];
    db.intakeCarts = [{ id: 'IC1', intake_id: 'IK1', cart_id: 'CA1', active: 'כן' }];
    db.laundryTasks = [{ id: 'W1', order_id: 'OR1', item_id: 'IT1', qty: 20, stage: 'התקבל',
      cart_id: 'CA1', machine_id: '', worker: '', in_date: '2026-08-17', done_date: '',
      warehouse_id: '', target_date: '', parent_task_id: '', intake_id: 'IK1' }];
    db.laundryTaskEvents = [];
    return db;
  },

  inv(srv, db) {
    return {
      avail: srv.availableQty(db, 'IT1', '2026-09-02', '2026-09-03'),
      reserved: srv.reservedQty(db, 'IT1', '2026-09-02', '2026-09-03'),
      committed: srv.b48CommittedQty(db, 'IT1'),
      laundry: srv.inLaundryQty(db, 'IT1'),
      free: srv.b48FreeOnShelf(db, 'IT1')
    };
  },
  money(srv, db) {
    srv.b54Bump();
    const bal = srv.b48BalancesAg(db)['C1'] || 0;
    const used = srv.b2CreditUsedAg(db, 'C1');
    const open = srv.b54CustomerOpenAg(db)['C1'] || 0;
    srv.b54Bump();
    return { bal: bal, used: used, open: open };
  }
};

SPECS.push({
  file: 't21-b75-srv',
  title: 'B75 — WASH-15 · 05 · 08 · 13 · 16 · 21 — השרת',
  needs: 'server',
  requires: ['w21IsRental', 'w17IsWash', 'w15MachKey', 'w15ItemKg', 'w15TaskKg', 'w15WeightAudit',
             'w05Occupant', 'w05Gate', 'w08DetachMachine', 'w16ActiveInvoiceOf', 'w16OrderGate',
             'advanceLaundry', 'b40SplitLaundry', 'b49cAfterAdvance', 'nobleDriverScan',
             'nobleOpenStarts', 'nobleMachineLoad', 'nobleWeigh', 'b49dResolveOrder', 'b49dAddCarts',
             'reservedQty', 'b48CommittedQty', 'availableQty', 'inLaundryQty', 'b48FreeOnShelf',
             'b48BalancesAg', 'b2CreditUsedAg', 'b54CustomerOpenAg', 'b54Bump', 'b54RawOrderTotalAg',
             'b38VerifyManagerPin', 'b49eLegKind', 'b49eShipMode', 'sVal', 'sPick', 'STAGES',
             'READ_ONLY_ACTIONS', 'ORDER_TYPES', 'nRound2', 'toAg', 'fromAg'],

  tests: {

    /* ================= WASH-21 — המלאי ================= */

    '⛔⛔ WASH-21: השכרה עם סוג מלוכלך כן משריינת מלאי': (t, { srv }) => {
      const clean = B75.inv(srv, B75.invDb(srv, 'השכרה'));
      t.eq(clean.reserved, 10, 'קו הבסיס נשבר — השכרה נקייה אינה משריינת 10');
      B75.DIRTY.forEach(ty => {
        const got = B75.inv(srv, B75.invDb(srv, ty));
        t.eq(got.reserved, 10,
          '⛔⛔ reservedQty החזיר ' + got.reserved + ' על סוג ' + JSON.stringify(ty) + ' — זה WASH-21 עצמו');
        t.eq(got.committed, 10,
          '⛔⛔ b48CommittedQty החזיר ' + got.committed + ' על סוג ' + JSON.stringify(ty));
        t.eq(got.avail, clean.avail,
          '⛔⛔ availableQty נבדל בין סוג נקי (' + clean.avail + ') לסוג ' + JSON.stringify(ty) + ' (' + got.avail + ')');
        t.eq(got.free, clean.free, '⛔ b48FreeOnShelf נבדל בין נקי למלוכלך');
      });
    },

    '⛔ WASH-21: המלאי על סוג נקי לא זז — רגרסיה מלאה': (t, { srv }) => {
      const g = B75.inv(srv, B75.invDb(srv, 'השכרה'));
      t.eq(g.reserved, 10, '⛔ reservedQty זז');
      t.eq(g.committed, 10, '⛔ b48CommittedQty זז');
      t.eq(g.laundry, 0, '⛔ inLaundryQty זז');
      t.eq(g.avail, 90, '⛔ availableQty זז — 100 − 10 משוריינות');
      t.eq(g.free, 90, '⛔ b48FreeOnShelf זז');
    },

    '⛔ WASH-21: כביסה אינה משריינת מלאי — לא לפני ולא אחרי': (t, { srv }) => {
      ['כביסה', 'כביסה\u00A0', ' כביסה'].forEach(ty => {
        const g = B75.inv(srv, B75.invDb(srv, ty));
        t.eq(g.reserved, 0, '⛔⛔ הזמנת כביסה (' + JSON.stringify(ty) + ') שריינה מלאי של MAPA');
        t.eq(g.committed, 0, '⛔⛔ b48CommittedQty ספר הזמנת כביסה');
        t.eq(g.avail, 100, '⛔ availableQty הושפע מהזמנת כביסה');
      });
    },

    '⛔ סוג לא מוכר וסוג ריק — נשארים השכרה (בלי ריכוך, כמו B74)': (t, { srv }) => {
      ['שירות', '', 'מכירה'].forEach(ty => {
        const g = B75.inv(srv, B75.invDb(srv, ty));
        t.eq(g.reserved, 10, '⛔ סוג ' + JSON.stringify(ty) + ' הפסיק לשריין — שינוי התנהגות בלי הכרעה');
      });
      t.no(srv.w21IsRental(null), 'w21IsRental על null אינו false');
      t.no(srv.w21IsRental(undefined), 'w21IsRental על undefined אינו false');
    },

    '⛔ R6: הכסף לא זז באף אחד משישה הפריטים': (t, { srv }) => {
      const base = B75.money(srv, B75.invDb(srv, 'השכרה'));
      t.eq(base.bal, 25000, 'קו הבסיס נשבר — 10 × 25 ₪ = 250 ₪ = 25000 אגורות');
      t.eq(base.used, base.bal, '⛔ R6: b2CreditUsedAg נבדל מ-b48BalancesAg');
      t.eq(base.open, base.bal, '⛔ R6: b54CustomerOpenAg נבדל מ-b48BalancesAg');
      B75.DIRTY.forEach(ty => {
        const got = B75.money(srv, B75.invDb(srv, ty));
        t.eq(got.bal, base.bal, '⛔⛔ הכסף זז על סוג ' + JSON.stringify(ty));
        t.eq(got.used, got.bal, '⛔ R6 נשבר על סוג ' + JSON.stringify(ty));
        t.eq(got.open, got.bal, '⛔ R6 נשבר על סוג ' + JSON.stringify(ty));
      });
      const wash = B75.money(srv, B75.invDb(srv, 'כביסה\u00A0'));
      t.eq(wash.bal, 0, '⛔⛔ B74 נשבר — כביסה מלוכלכת חזרה להיות כסף');
    },

    '⛔ WASH-21: רגלי ההלוך/חזור נגזרות נכון גם על סוג מלוכלך': (t, { srv }) => {
      const mk = ty => ({ id: 'O1', type: ty, ship_out: '', ship_back: '', delivery_fee: 0 });
      t.eq(srv.b49eLegKind(mk('השכרה'), 'הלוך'), 'אספקה', 'קו הבסיס של השכרה נשבר');
      t.eq(srv.b49eLegKind(mk('כביסה'), 'הלוך'), 'איסוף', 'קו הבסיס של כביסה נשבר');
      t.eq(srv.b49eLegKind(mk('השכרה\u00A0'), 'הלוך'), 'אספקה',
        '⛔⛔ השכרה מלוכלכת קיבלה רגל של כביסה — הנהג היה נוסע לכיוון ההפוך');
      t.eq(srv.b49eLegKind(mk(' כביסה '), 'חזור'), 'אספקה', '⛔⛔ כביסה מלוכלכת קיבלה רגל של השכרה');
      t.eq(srv.b49eShipMode(mk('כביסה\u00A0'), 'הלוך'), 'איסוף עצמי',
        '⛔ כביסה מלוכלכת בלי דמי שינוע אינה איסוף עצמי');
      t.eq(srv.b49eShipMode(mk('השכרה\u00A0'), 'הלוך'), 'משלוח', '⛔ השכרה מלוכלכת שינתה אופן מסירה');
    },

    /* ================= WASH-15 — המונה של הניצולת ================= */

    '⭐⭐ WASH-15: ניצולת של כביסה פנימית אינה אפס': (t, { srv }) => {
      const db = B75.washDb(srv);
      const r = srv.advanceLaundry(db, 'W1', '2026-08-17',
        { cart_id: 'CA1', machine_id: 'M1', to_stage: 'בכביסה' }, p => p + '-1', 'מנהל');
      t.ok(r.ok, 'הקידום נכשל: ' + (r.error || ''));
      t.eq(r.portion_kg, 10, '⛔⛔ משקל המנה אינו 20 יח\' × 0.5 ק"ג = 10');
      const ev = db.laundryEvents.filter(e => srv.sVal(e.event_type) === 'התחלה');
      t.eq(ev.length, 1, 'אירוע ההתחלה לא נכתב ליומן NOBLE');
      t.eq(Number(ev[0].portion_kg), 10,
        '⛔⛔ portion_kg ביומן הוא ' + JSON.stringify(ev[0].portion_kg) + ' — זה WASH-15 עצמו');
      const load = srv.nobleMachineLoad(db)['M1'] || [];
      t.eq(load.length, 1, '⛔ המנה אינה נספרת בעומס המכונה');
      t.eq(load[0].portion_kg, 10, '⛔⛔ load_kg של כביסה פנימית חזר להיות אפס — זה הבאג המקורי');
    },

    '⛔ WASH-15: פריט בלי משקל אינו חוסם — הוא מחזיר ריק': (t, { srv }) => {
      const db = B75.washDb(srv, { itemKg: '' });
      const r = srv.advanceLaundry(db, 'W1', '2026-08-17',
        { cart_id: 'CA1', machine_id: 'M1', to_stage: 'בכביסה' }, p => p + '-1', 'מנהל');
      t.ok(r.ok, '⛔ פריט בלי משקל חסם את הקידום — אין שער חסימה (WASH-07)');
      t.eq(r.portion_kg, '', 'המשקל אינו ריק כשאין נתון');
      const ev = db.laundryEvents.filter(e => srv.sVal(e.event_type) === 'התחלה')[0];
      t.eq(ev.portion_kg, '', '⛔ נכתב אפס במקום ריק — אפס נראה כמו מדידה אמיתית');
      t.has(String(ev.note || ''), 'אין משקל לפריט', 'היומן אינו מסביר למה המשקל חסר');
      t.eq(srv.w15TaskKg(db, null), '', 'w15TaskKg על null אינו ריק');
      t.eq(srv.w15TaskKg(db, { item_id: 'IT1', qty: 0 }), '', 'כמות אפס אינה מחזירה ריק');
    },

    '⭐ WASH-15: האבחון READ_ONLY מדווח על הפריטים החסרים ועל המונה': (t, { srv }) => {
      t.ok(srv.READ_ONLY_ACTIONS.indexOf('w15WeightAudit') > -1,
        '⛔ w15WeightAudit אינה ב-READ_ONLY_ACTIONS — היא קריאה בלבד');
      const db = B75.washDb(srv, { itemKg: '' });
      const a = srv.w15WeightAudit(db);
      t.ok(a.ok, 'האבחון נכשל');
      t.eq(a.tasks_open, 1, 'מספר המשימות הפתוחות שגוי');
      t.eq(a.tasks_no_kg, 1, '⛔ המשימה בלי משקל אינה מדווחת');
      t.eq(a.items_no_weight, 1, '⛔ הפריט חסר המשקל אינו נספר בקטלוג');
      t.eq(a.missing.length, 1, 'פירוט הפריטים החסרים ריק');
      t.eq(a.missing[0].qty, 20, 'הכמות בפירוט שגויה');
      t.eq(a.machines.length, 2, 'המכונות אינן מדווחות');
      const ok = srv.w15WeightAudit(B75.washDb(srv));
      t.eq(ok.tasks_no_kg, 0, '⛔ האבחון מדווח ממצא שווא כשלכל הפריטים יש משקל');
      t.eq(ok.kg_total, 10, 'המשקל הכולל שגוי');
    },

    '⛔ WASH-15: האבחון אינו כותב שום דבר לבסיס הנתונים': (t, { srv }) => {
      const db = B75.washDb(srv);
      const before = JSON.stringify(db);
      srv.w15WeightAudit(db);
      t.eq(JSON.stringify(db), before, '⛔⛔ פעולת האבחון שינתה נתונים — היא חייבת להיות READ_ONLY');
    },

    /* ---- מזהי מכונה לא מנורמלים (ממצא B69, סופח) ---- */

    '⭐⭐ ממצא B69: מזהה מכונה מלוכלך — "סיום" סוגר את "התחלה"': (t, { srv }) => {
      ['M1\u00A0', ' M1', 'M1 ', '\u200EM1'].forEach(dirty => {
        const db = B75.washDb(srv);
        db.laundryEvents = [
          { id: 'E1', ts: '2026-08-17 08:00', intake_id: 'IK1', cart_id: 'CA1', machine_id: 'M1',
            stage: 'בכביסה', event_type: 'התחלה', portion_kg: 10 },
          { id: 'E2', ts: '2026-08-17 09:00', intake_id: 'IK1', cart_id: 'CA1', machine_id: dirty,
            stage: 'בכביסה', event_type: 'סיום', portion_kg: 10 }
        ];
        t.eq(srv.nobleOpenStarts(db, 'IK1', 'CA1').length, 0,
          '⛔⛔ "סיום" עם מזהה ' + JSON.stringify(dirty) + ' לא סגר את "התחלה" — המנה נשארה פתוחה לנצח');
        t.eq(Object.keys(srv.nobleMachineLoad(db)).length, 0,
          '⛔⛔ המכונה נראית תפוסה למרות שהמנה נסגרה');
      });
    },

    '⛔ ממצא B69: עומס המכונה אינו מתפצל לשני מפתחות': (t, { srv }) => {
      const db = B75.washDb(srv);
      db.laundryEvents = [
        { id: 'E1', ts: '2026-08-17 08:00', intake_id: 'IK1', cart_id: 'CA1', machine_id: 'M1',
          stage: 'בכביסה', event_type: 'התחלה', portion_kg: 10 },
        { id: 'E2', ts: '2026-08-17 08:05', intake_id: 'IK1', cart_id: 'CA1', machine_id: 'M1\u00A0',
          stage: 'בייבוש', event_type: 'התחלה', portion_kg: 4 }
      ];
      const load = srv.nobleMachineLoad(db);
      t.eq(Object.keys(load).length, 1, '⛔⛔ עומס המכונה התפצל לשני מפתחות');
      t.eq((load['M1'] || []).length, 2, '⛔ שתי המנות אינן נספרות תחת M1');
      t.eq(srv.w15MachKey('M1\u00A0'), 'M1', 'w15MachKey אינו מנרמל');
      t.eq(srv.w15MachKey(''), '', 'w15MachKey על ריק אינו ריק');
    },

    /* ================= WASH-05 — מכונה אחת, משימה אחת ================= */

    '⭐⭐ WASH-05: מכונה תפוסה חוסמת משימה שנייה': (t, { srv }) => {
      const db = B75.washDb(srv, { pin: '9999' });
      db.laundryTasks.push({ id: 'W2', order_id: 'OR1', item_id: 'IT1', qty: 5, stage: 'בכביסה',
        cart_id: 'CA2', machine_id: 'M1', worker: '', in_date: '2026-08-17', done_date: '',
        warehouse_id: '', target_date: '', parent_task_id: '', intake_id: '' });
      const r = srv.advanceLaundry(db, 'W1', '2026-08-17',
        { cart_id: 'CA1', machine_id: 'M1', to_stage: 'בכביסה' }, p => p + '-1', 'מנהל');
      t.no(r.ok, '⛔⛔ שתי משימות שויכו לאותה מכונה — זה WASH-05 עצמו');
      t.ok(r.machine_busy, '⛔ השרת לא החזיר machine_busy — הממשק לא יוכל להציע דילוג');
      t.eq(r.machine_busy.task_id, 'W2', 'מזהה המשימה התופסת שגוי');
      t.has(r.error, 'תפוסה', 'הודעת השגיאה אינה מסבירה שהמכונה תפוסה');
      t.eq(srv.sVal(db.laundryTasks[0].stage), 'התקבל', '⛔ השלב התקדם למרות החסימה');
    },

    '⛔ WASH-05: מכונה פנויה — לא נחסם כלום (רגרסיה)': (t, { srv }) => {
      const db = B75.washDb(srv);
      const r = srv.advanceLaundry(db, 'W1', '2026-08-17',
        { cart_id: 'CA1', machine_id: 'M2', to_stage: 'בכביסה' }, p => p + '-1', 'מנהל');
      t.ok(r.ok, '⛔⛔ WASH-05 חסם קידום למכונה פנויה: ' + (r.error || ''));
      t.eq(r.machine_override, '', 'סומן דילוג כשלא היה');
      t.eq(srv.sVal(db.laundryTasks[0].stage), 'בכביסה', 'השלב לא התקדם');
    },

    '⛔ WASH-05: משימה שהסתיימה אינה תופסת את המכונה': (t, { srv }) => {
      const db = B75.washDb(srv);
      db.laundryTasks.push({ id: 'W2', order_id: 'OR1', item_id: 'IT1', qty: 5, stage: 'מוכן',
        cart_id: '', machine_id: 'M1', done_date: '2026-08-16', intake_id: '' });
      t.eq(srv.w05Occupant(db, 'M1', 'W1'), null,
        '⛔ משימה בשלב "מוכן" נחשבת תופסת — כל המכונות ייחסמו לנצח');
      const r = srv.advanceLaundry(db, 'W1', '2026-08-17',
        { cart_id: 'CA1', machine_id: 'M1', to_stage: 'בכביסה' }, p => p + '-1', 'מנהל');
      t.ok(r.ok, '⛔⛔ משימה שהסתיימה חסמה את המכונה: ' + (r.error || ''));
    },

    '⭐ WASH-05: דילוג בקוד מנהל — פירוט חובה, ונרשם ביומן': (t, { srv }) => {
      const mk = () => {
        const db = B75.washDb(srv, { pin: '9999' });
        db.laundryTasks.push({ id: 'W2', order_id: 'OR1', item_id: 'IT1', qty: 5, stage: 'בכביסה',
          cart_id: 'CA2', machine_id: 'M1', done_date: '', intake_id: '' });
        return db;
      };
      /* בלי פירוט — נחסם גם עם קוד נכון */
      const noReason = srv.advanceLaundry(mk(), 'W1', '2026-08-17',
        { cart_id: 'CA1', machine_id: 'M1', to_stage: 'בכביסה', mgr_pin: '9999' }, p => p + '-1', 'מנהל');
      t.no(noReason.ok, '⛔⛔ דילוג בלי פירוט עבר');
      t.has(noReason.error, 'פירוט', 'הודעת הפירוט החסר השתנתה');
      /* קוד שגוי — נחסם */
      const badPin = srv.advanceLaundry(mk(), 'W1', '2026-08-17',
        { cart_id: 'CA1', machine_id: 'M1', to_stage: 'בכביסה', mgr_pin: '1111', w05_reason: 'סיבה טובה' },
        p => p + '-1', 'מנהל');
      t.no(badPin.ok, '⛔⛔ דילוג עם קוד מנהל שגוי עבר');
      /* קוד נכון + פירוט — עובר, ונרשם */
      const db = mk();
      const ok = srv.advanceLaundry(db, 'W1', '2026-08-17',
        { cart_id: 'CA1', machine_id: 'M1', to_stage: 'בכביסה', mgr_pin: '9999', w05_reason: 'המשימה הקודמת הסתיימה פיזית' },
        p => p + '-1', 'מנהל');
      t.ok(ok.ok, 'דילוג תקין נכשל: ' + (ok.error || ''));
      t.eq(ok.machine_override, 'כן', 'הדילוג אינו מסומן בתשובה');
      const notes = (db.laundryTaskEvents || []).map(e => e.note || '').join(' | ');
      t.has(notes, 'WASH-05', '⛔⛔ הדילוג לא נרשם ביומן המשימה — אין למי לחזור');
      t.has(notes, 'המשימה הקודמת הסתיימה פיזית', '⛔ הפירוט של המנהל לא נשמר ביומן');
    },

    '⛔ WASH-05: אותו שער בפיצול משימה — בלי דפוס שני (R8)': (t, { srv }) => {
      const db = B75.washDb(srv, { pin: '9999' });
      db.laundryTasks.push({ id: 'W2', order_id: 'OR1', item_id: 'IT1', qty: 5, stage: 'בכביסה',
        cart_id: 'CA2', machine_id: 'M1', done_date: '', intake_id: '' });
      const r = srv.b40SplitLaundry(db, { task_id: 'W1', qty: 5, machine_id: 'M1' },
        '2026-08-17', p => p + '-1', 'מנהל');
      t.no(r.ok, '⛔⛔ הפיצול שייך משימה למכונה תפוסה');
      t.ok(r.machine_busy, '⛔ הפיצול אינו מחזיר machine_busy');
      t.eq(db.laundryTasks.filter(x => x.id !== 'W1' && x.id !== 'W2').length, 0,
        '⛔⛔ גלגול לאחור נשבר — נשארה משימה חדשה בזיכרון');
      t.eq(Number(db.laundryTasks[0].qty), 20, '⛔ הכמות במשימת המקור ירדה למרות הכישלון');
    },

    /* ================= WASH-08 — מכונה שנשלחה לתיקון ================= */

    '⭐⭐ WASH-08: דיווח תקלה על מכונה מנתק את משימות הכביסה שלה': (t, { srv }) => {
      const db = B75.washDb(srv);
      db.laundryTasks[0].machine_id = 'M1';
      db.laundryTasks[0].stage = 'בכביסה';
      db.laundryTasks.push({ id: 'W2', order_id: 'OR1', item_id: 'IT1', qty: 5, stage: 'מוכן',
        cart_id: '', machine_id: 'M1', done_date: '2026-08-16', intake_id: '' });
      const det = srv.w08DetachMachine(db, 'M1', 'מנהל', 'FLT-1', p => p + '-1');
      t.eq(det.length, 1, '⛔⛔ המשימה הפתוחה לא נותקה מהמכונה — זה WASH-08 עצמו');
      t.eq(det[0], 'W1', 'נותקה המשימה הלא נכונה');
      t.eq(db.laundryTasks[0].machine_id, '', '⛔ השיוך נשאר על המשימה');
      t.eq(db.laundryTasks[1].machine_id, 'M1',
        '⛔ משימה שהסתיימה נותקה — זה מוחק היסטוריה');
      const notes = (db.laundryTaskEvents || []).map(e => e.note || '').join(' | ');
      t.has(notes, 'WASH-08', '⛔⛔ הניתוק לא נרשם ביומן המשימה');
      t.has(notes, 'FLT-1', 'מזהה התקלה אינו ביומן');
    },

    '⛔ WASH-08: מזהה מכונה מלוכלך על המשימה — הניתוק עובד בכל זאת': (t, { srv }) => {
      const db = B75.washDb(srv);
      db.laundryTasks[0].machine_id = 'M1\u00A0';
      db.laundryTasks[0].stage = 'בכביסה';
      t.eq(srv.w08DetachMachine(db, 'M1', 'מנהל', 'FLT-1', p => p + '-1').length, 1,
        '⛔⛔ משימה עם מזהה מכונה מלוכלך לא נותקה — כשל שקט של B64a');
    },

    '⛔ WASH-08: רשת בטיחות — קידום במכונה שאינה פעילה נחסם': (t, { srv }) => {
      const db = B75.washDb(srv);
      db.laundryTasks[0].machine_id = 'M1';
      db.machines[0].status = 'בתיקון';
      const r = srv.advanceLaundry(db, 'W1', '2026-08-17', { to_stage: 'בכביסה' }, p => p + '-1', 'מנהל');
      t.no(r.ok, '⛔⛔ משימה התקדמה במכונה שבתיקון — זה WASH-08 בנתוני עבר');
      t.has(r.error, 'בתיקון', 'ההודעה אינה מציינת את סטטוס המכונה');
      t.eq(srv.sVal(db.laundryTasks[0].stage), 'התקבל', '⛔ השלב התקדם למרות החסימה');
    },

    /* ================= WASH-13 — order_id במשלוח המכבסה ================= */

    '⭐⭐ WASH-13: משלוח המכבסה נושא את order_id של הקליטה': (t, { srv }) => {
      const db = B75.washDb(srv);
      db.orders.push({ id: 'OW', order_number: '3001', customer_id: 'C1', type: 'כביסה',
        status: 'מאושרת', start_date: '2026-08-15', end_date: '2026-08-18', delivery_fee: 0 });
      db.laundryIntakes[0] = { id: 'IK1', customer_id: 'C1', internal: '', status: 'מוכן',
        intake_ts: '2026-08-17 08:00', order_id: 'OW', net_weight_kg: 10, total_charge: 50 };
      const r = srv.nobleDriverScan(db, { cart_barcode: 'CA1', worker_pin: '' }, 'מנהל');
      t.ok(r.ok, 'ההעמסה נכשלה: ' + (r.error || ''));
      t.eq(r.delivery.order_id, 'OW',
        '⛔⛔ המשלוח נוצר עם order_id ריק — זה WASH-13 עצמו');
      t.eq(r.delivery.kind, 'משלוח מכבסה',
        '⛔⛔ ה-kind השתנה — הוא מה שמונע התנגשות עם רגלי ההלוך/חזור');
    },

    '⛔ WASH-13: קליטה פנימית של MAPA נשארת בלי order_id': (t, { srv }) => {
      const db = B75.washDb(srv);
      db.laundryIntakes[0].status = 'מוכן';
      const r = srv.nobleDriverScan(db, { cart_barcode: 'CA1', worker_pin: '' }, 'מנהל');
      t.ok(r.ok, 'ההעמסה נכשלה: ' + (r.error || ''));
      t.eq(r.delivery.order_id, '', '⛔ קליטה פנימית קיבלה order_id שאינה שלה');
    },

    /* ================= WASH-16 — חסימה במקור ================= */

    '⭐⭐ WASH-16: אין לפתוח קליטה להזמנה שנסגרה': (t, { srv }) => {
      const mk = st => {
        const db = B75.washDb(srv);
        db.orders = [{ id: 'OW', order_number: '3001', customer_id: 'C1', type: 'כביסה',
          status: st, start_date: '2026-08-15', end_date: '2026-08-18', delivery_fee: 0 }];
        db.laundryIntakes = []; db.intakeCarts = []; db.laundryTasks = [];
        return db;
      };
      ['הושלמה', 'בוטלה', 'טיוטה', 'הצעת מחיר'].forEach(st => {
        const r = srv.b49dResolveOrder(mk(st), 'OW');
        t.no(r.ok, '⛔⛔ נפתחה קליטה להזמנה בסטטוס ' + st + ' — זה WASH-16 עצמו');
      });
      ['מאושרת', 'סופקה'].forEach(st => {
        t.ok(srv.b49dResolveOrder(mk(st), 'OW').ok, '⛔ הזמנה פתוחה (' + st + ') נחסמה בטעות');
      });
      /* B64a: סטטוס מלוכלך של הזמנה פתוחה — לא נחסם */
      ['מאושרת\u00A0', ' סופקה'].forEach(st => {
        t.ok(srv.b49dResolveOrder(mk(st), 'OW').ok,
          '⛔ סטטוס מלוכלך (' + JSON.stringify(st) + ') חסם הזמנה תקינה — כשל שקט של B64a');
      });
    },

    '⭐⭐ WASH-16: הזמנה שהופקה לה חשבונית אינה מקבלת קליטה, עגלות או שקילה': (t, { srv }) => {
      const mk = () => {
        const db = B75.washDb(srv);
        db.orders = [{ id: 'OW', order_number: '3001', customer_id: 'C1', type: 'כביסה',
          status: 'מאושרת', start_date: '2026-08-15', end_date: '2026-08-18', delivery_fee: 0 }];
        db.invoices = [{ id: 'INV1', number: '5001', order_id: 'OW', customer_id: 'C1',
          subtotal: 100, vat: 18, total: 118, status: 'פתוחה' }];
        db.laundryIntakes = [{ id: 'IK1', customer_id: 'C1', internal: '', status: 'התקבל',
          intake_ts: '2026-08-17 08:00', order_id: 'OW', net_weight_kg: '', total_charge: '' }];
        db.intakeCarts = [{ id: 'IC1', intake_id: 'IK1', cart_id: 'CA1', active: 'כן' }];
        db.laundryTasks = [];
        return db;
      };
      /* 1 — פתיחת קליטה */
      const db1 = mk(); db1.laundryIntakes = []; db1.intakeCarts = [];
      const r1 = srv.b49dResolveOrder(db1, 'OW');
      t.no(r1.ok, '⛔⛔ נפתחה קליטה להזמנה שכבר הופקה לה חשבונית (DEC-03)');
      t.has(r1.error, '5001', 'מספר החשבונית אינו בהודעה — אבי לא יידע במה מדובר');
      /* 2 — הוספת עגלות */
      const db2 = mk();
      db2.carts[1].status = 'פנויה';
      const r2 = srv.b49dAddCarts(db2, { intake_id: 'IK1', cart_barcodes: ['CA2'] }, 'מנהל');
      t.no(r2.ok, '⛔⛔ נוספו עגלות לקליטה של הזמנה שהופקה לה חשבונית');
      /* 3 — שקילה */
      const db3 = mk();
      const r3 = srv.nobleWeigh(db3, { cart_barcode: 'CA1', gross_kg: 20 }, 'מנהל');
      t.no(r3.ok, '⛔⛔ נוצר חיוב שקילה על הזמנה שהופקה לה חשבונית');
      /* חשבונית מבוטלת אינה חוסמת */
      const db4 = mk(); db4.invoices[0].status = 'בוטלה';
      t.ok(srv.b49dResolveOrder(Object.assign(db4, { laundryIntakes: [], intakeCarts: [] }), 'OW').ok,
        '⛔ חשבונית מבוטלת חסמה קליטה — היא אינה חיוב');
    },

    '⛔ WASH-16: קליטה פנימית של MAPA אינה מושפעת בכלל': (t, { srv }) => {
      t.ok(srv.w16OrderGate(B75.washDb(srv), '').ok, '⛔ קליטה בלי הזמנה נחסמה');
      t.ok(srv.w16OrderGate(B75.washDb(srv), null).ok, '⛔ order_id null נחסם');
      const db = B75.washDb(srv);
      const r = srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 20 }, 'מנהל');
      t.ok(r.ok, '⛔⛔ WASH-16 חסם שקילה של כביסה פנימית: ' + (r.error || ''));
    },

    '⛔ WASH-16: שקילה על הזמנה פתוחה בלי חשבונית — עובדת כרגיל (רגרסיה)': (t, { srv }) => {
      const db = B75.washDb(srv);
      db.orders = [{ id: 'OW', order_number: '3001', customer_id: 'C1', type: 'כביסה',
        status: 'מאושרת', start_date: '2026-08-15', end_date: '2026-08-18', delivery_fee: 0 }];
      db.laundryIntakes = [{ id: 'IK1', customer_id: 'C1', internal: '', status: 'התקבל',
        intake_ts: '2026-08-17 08:00', order_id: 'OW', net_weight_kg: '', total_charge: '' }];
      const r = srv.nobleWeigh(db, { cart_barcode: 'CA1', gross_kg: 20 }, 'מנהל');
      t.ok(r.ok, '⛔⛔ שקילה תקינה נחסמה: ' + (r.error || ''));
      t.eq(r.net_kg, 18, 'הנטו שגוי — 20 ברוטו פחות 2 משקל עצמי');
    },

    /* ================= שומרי קוד מקור ================= */

    '⛔⛔ ההשוואה הגולמית לא חוזרת לארבעת אתרי המלאי': (t, { H }) => {
      /* ⚠ לקח B75: H.stripComments אינו מסיר את ההערות באזור הזה של קוד
         השרת (הסורק שלו נתקע במצב מחרוזת בשלב מוקדם יותר בקובץ), ולכן
         השומר הזה חתך את ההערות **בתוך הגוף שחולץ** ולא על הקובץ כולו.
         ⛔ בלי זה השומר נכשל על טקסט שמופיע בהערה בלבד — כשל שווא. */
      const src = H.serverSrc();
      const noCmt = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
      const body = name => {
        const i = src.indexOf('function ' + name + '(');
        if (i === -1) return null;
        let d = 0, started = false;
        for (let j = i; j < src.length; j++) {
          if (src[j] === '{') { d++; started = true; }
          else if (src[j] === '}') { d--; if (started && d === 0) return src.slice(i, j + 1); }
        }
        return null;
      };
      ['reservedQty', 'b48CommittedQty', 'b49eLegKind', 'b49eShipMode'].forEach(fn => {
        const raw = body(fn);
        t.ok(raw, 'הפונקציה ' + fn + ' נעלמה מקוד השרת');
        const b = noCmt(raw || '');
        t.hasNot(b, "o.type !== 'השכרה'", '⛔⛔ ההשוואה הגולמית חזרה ל-' + fn);
        t.hasNot(b, "String(o.type)", '⛔⛔ השוואת סוג גולמית חזרה ל-' + fn);
        t.has(b, 'w21IsRental', '⛔⛔ ' + fn + ' אינו עובר דרך w21IsRental');
      });
    },

    '⛔⛔ w21IsRental זהה תו-בתו בין השרת לממשק': (t, { H }) => {
      const rx = /function\s+w21IsRental\s*\(o\)\s*\{[^}]*\}/;
      const a = (H.serverSrc().match(rx) || [])[0];
      const b = (H.uiScript().match(rx) || [])[0];
      t.ok(a, 'w21IsRental אינו קיים בקוד השרת');
      t.ok(b, 'w21IsRental אינו קיים ב-index.html');
      t.eq(a, b, '⛔⛔ שני הגופים התפצלו — הממשק והשרת יסווגו סוג אחרת');
    },

    '⛔ w17IsWash ו-toAg לא נגעו (R4/B74)': (t, { H }) => {
      const src = H.serverSrc();
      t.has(src, "function w17IsWash(o){ return !!o && sVal(o.type)==='כביסה'; }",
        '⛔⛔ w17IsWash שונה — B74 נשבר');
      t.has(src, 'function toAg(', '⛔⛔ toAg נעלם');
      const ui = H.uiScript();
      t.has(ui, "function w17IsWash(o){ return !!o && sVal(o.type)==='כביסה'; }",
        '⛔⛔ w17IsWash בממשק שונה');
    },

    '⛔ אין שינוי סכימה — laundry_events ו-items לא זזו': (t, { srv }) => {
      t.has(srv.TABLES.laundry_events.join(','), 'portion_kg',
        '⛔ portion_kg נעלם מ-laundry_events');
      t.has(srv.TABLES.items.join(','), 'weight_kg', '⛔ weight_kg נעלם מ-items');
      t.eq(srv.TABLES.laundry_events.length, 18, '⛔⛔ נוספה או הוסרה עמודה ב-laundry_events');
      t.eq(srv.TABLES.items.length, 20, '⛔⛔ נוספה או הוסרה עמודה ב-items');
    }
  }
});

SPECS.push({
  file: 't21-b75-ui',
  title: 'B75 — הממשק: המלאי על סוג מלוכלך · טופס הדילוג · כרטיס הניצולת',
  needs: 'ui',
  requires: ['w21IsRental', 'w17IsWash', 'b40ItemBreakdown', 'b49eLegKind', 'b49eLegLabel',
             'b49eShipMode', 'b49dPendingOrders', 'b49dOrderIntakeHtml', 'b49dPendingHtml', 'calEvents',
             'w05BusyForm', 'w05BusyGo', 'w15AuditHtml', 'w15RunAudit', 'b46FixPanelHtml',
             'b61Tests', 'sVal', 'openModal', 'closeModal', 'el', 'go'],

  tests: {

    /* ================= WASH-21 — המלאי בממשק ================= */

    '⭐⭐ WASH-21: השכרה עם סוג מלוכלך כן משריינת מלאי בכרטיס הפריט': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const setup = ty => {
        w.DB.items = [{ id: 'IT1', name: 'מגבת', active: 'כן', min_stock: '' }];
        w.DB.stockMoves = [{ id: 'SM1', item_id: 'IT1', qty: 100, warehouse_id: '' }];
        w.DB.customers = [{ id: 'C1', name: 'מלון הים', active: 'כן' }];
        w.DB.orders = [{ id: 'O1', order_number: '1001', customer_id: 'C1', type: ty,
          status: 'מאושרת', start_date: '2026-09-01', end_date: '2026-09-05', warehouse_id: '' }];
        w.DB.orderLines = [{ id: 'OL1', order_id: 'O1', item_id: 'IT1', qty: 10, unit_price: 25 }];
        w.DB.laundryTasks = [];
        w.DB.settings = [];
        return w.b40ItemBreakdown('IT1');
      };
      const clean = setup('השכרה');
      t.eq(clean.resQ, 10, 'קו הבסיס נשבר — השכרה נקייה אינה משוריינת');
      t.eq(clean.availQ, 90, 'קו הבסיס נשבר — 100 פחות 10 משוריינות');
      ['השכרה\u00A0', ' השכרה', 'השכרה ', '\u200Eהשכרה'].forEach(ty => {
        const g = setup(ty);
        t.eq(g.resQ, 10,
          '⛔⛔ סוג ' + JSON.stringify(ty) + ' לא שריין — הפריט נראה זמין למרות שהתחייבנו עליו');
        t.eq(g.availQ, clean.availQ,
          '⛔⛔ הזמין נבדל בין נקי (' + clean.availQ + ') למלוכלך (' + g.availQ + ')');
      });
    },

    '⛔ WASH-21: הזמנת כביסה אינה משריינת את מלאי MAPA (רגרסיה B72)': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.items = [{ id: 'IT1', name: 'מגבת', active: 'כן', min_stock: '' }];
      w.DB.stockMoves = [{ id: 'SM1', item_id: 'IT1', qty: 100, warehouse_id: '' }];
      w.DB.customers = [{ id: 'C1', name: 'מלון הים', active: 'כן' }];
      w.DB.laundryTasks = []; w.DB.settings = [];
      ['כביסה', 'כביסה\u00A0'].forEach(ty => {
        w.DB.orders = [{ id: 'O1', customer_id: 'C1', type: ty, status: 'מאושרת',
          start_date: '2026-09-01', end_date: '2026-09-05', warehouse_id: '' }];
        w.DB.orderLines = [{ id: 'OL1', order_id: 'O1', item_id: 'IT1', qty: 10, unit_price: 25 }];
        const g = w.b40ItemBreakdown('IT1');
        t.eq(g.resQ, 0, '⛔⛔ הזמנת כביסה (' + JSON.stringify(ty) + ') שריינה מלאי');
        t.eq(g.availQ, 100, '⛔ הזמין הושפע מהזמנת כביסה');
      });
    },

    '⛔ WASH-21: הממשק והשרת מסכימים על מי משריין': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      ['השכרה', 'השכרה\u00A0', 'כביסה', 'כביסה\u00A0', 'שירות', ''].forEach(ty => {
        const o = { id: 'O1', type: ty };
        t.eq(w.w21IsRental(o), srv.w21IsRental(o),
          '⛔⛔ הממשק והשרת נבדלו על סוג ' + JSON.stringify(ty));
        t.eq(w.w17IsWash(o), srv.w17IsWash(o),
          '⛔⛔ w17IsWash נבדל בין הקבצים על סוג ' + JSON.stringify(ty));
      });
    },

    '⛔ WASH-21: רגלי ההלוך/חזור והתוויות ביומן נכונות על סוג מלוכלך': (t, { w }) => {
      const mk = ty => ({ id: 'O1', type: ty, ship_out: '', ship_back: '', delivery_fee: 0 });
      t.eq(w.b49eLegKind(mk('השכרה\u00A0'), 'הלוך'), 'אספקה',
        '⛔⛔ השכרה מלוכלכת קיבלה רגל של כביסה');
      t.eq(w.b49eLegKind(mk(' כביסה '), 'הלוך'), 'איסוף', '⛔⛔ כביסה מלוכלכת קיבלה רגל של השכרה');
      t.has(w.b49eLegLabel(mk('השכרה\u00A0'), 'הלוך'), 'אספקה ללקוח', '⛔ התווית שגויה על השכרה מלוכלכת');
      t.has(w.b49eLegLabel(mk('כביסה\u00A0'), 'הלוך'), 'איסוף הכביסה', '⛔ התווית שגויה על כביסה מלוכלכת');
      t.eq(w.b49eShipMode(mk('כביסה\u00A0'), 'הלוך'), 'איסוף עצמי', '⛔ אופן המסירה שגוי');
    },

    '⛔ WASH-21: הזמנת כביסה מלוכלכת אינה נעלמת מרצפת הייצור': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'מלון הים', active: 'כן' }];
      w.DB.laundryIntakes = []; w.DB.deliveries = [];
      w.DB.orders = [{ id: 'OW', order_number: '3001', customer_id: 'C1', type: 'כביסה\u00A0',
        status: 'מאושרת', start_date: '2026-08-15', end_date: '2026-08-18', delivery_fee: 0 }];
      t.eq(w.b49dPendingOrders().length, 1,
        '⛔⛔ הזמנת כביסה עם סוג מלוכלך נעלמה מרשימת ההזמנות לקליטה');
      t.has(w.b49dOrderIntakeHtml(w.DB.orders[0]), 'קליטה במכבסה',
        '⛔ מקטע הקליטה בכרטיס ההזמנה נעלם על סוג מלוכלך');
      t.has(w.b49dPendingHtml(1), '3001',
        '⛔ ההזמנה המלוכלכת אינה מופיעה בבלוק "ממתין לקליטה"');
      t.eq(w.b49dOrderIntakeHtml({ id: 'OR', type: 'השכרה' }), '',
        '⛔ מקטע הקליטה נחשף בהזמנת השכרה');
    },

    '⛔ WASH-21: תוויות היומן — כביסה מלוכלכת אינה מסומנת כאספקה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.customers = [{ id: 'C1', name: 'מלון הים', active: 'כן' }];
      w.DB.orders = [{ id: 'OW', customer_id: 'C1', type: 'כביסה\u00A0', status: 'מאושרת',
        start_date: '2026-08-15', end_date: '2026-08-18', delivery_fee: 0 }];
      w.DB.deliveries = []; w.DB.tasks = []; w.DB.meetings = []; w.DB.futureExpenses = [];
      w.DB.laundryIntakes = []; w.DB.invoices = []; w.DB.payments = []; w.DB.charges = [];
      const labels = w.calEvents().map(x => String(x.title || x.label || '')).join(' | ');
      t.has(labels, 'כביסה', '⛔⛔ היומן לא סימן את ההזמנה כמסלול כביסה');
    },

    /* ================= WASH-05 — טופס הדילוג ================= */

    '⭐⭐ WASH-05: טופס הדילוג מציג את המשימה התופסת ודורש פירוט וקוד': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.w05BusyForm({ task_id: 'W1', cart_id: 'CA1', machine_id: 'M1', to_stage: 'בכביסה' },
        { machine_busy: { machine_id: 'M1', task_id: 'W2', stage: 'בכביסה', order_id: 'OR1' } });
      const h = w.el('modal').innerHTML;
      t.has(h, 'M1', 'מזהה המכונה אינו מוצג');
      t.has(h, 'W2', '⛔ מזהה המשימה התופסת אינו מוצג — אבי לא ידע מה חוסם');
      t.has(h, 'f_w05reason', '⛔ שדה הפירוט חסר');
      t.has(h, 'f_w05pin', '⛔ שדה קוד המנהל חסר');
      t.has(h, 'לבחור מכונה אחרת', '⛔ הטופס אינו מציע קודם את הדרך הנכונה');
    },

    '⛔ WASH-05: דילוג בלי פירוט או בלי קוד אינו נשלח לשרת': async (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.w05BusyForm({ task_id: 'W1' }, { machine_busy: { machine_id: 'M1', task_id: 'W2' } });
      w.__fetches.length = 0;
      w.el('f_w05reason').value = '';
      w.el('f_w05pin').value = '9999';
      await w.w05BusyGo();
      t.eq(w.__fetches.length, 0, '⛔⛔ דילוג בלי פירוט נשלח לשרת');
      w.el('f_w05reason').value = 'סיבה טובה';
      w.el('f_w05pin').value = '';
      await w.w05BusyGo();
      t.eq(w.__fetches.length, 0, '⛔⛔ דילוג בלי קוד מנהל נשלח לשרת');
    },

    '⛔ WASH-05: לחיצה על ביטול מנקה את המצב ואינה משאירה דילוג תלוי': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.w05BusyForm({ task_id: 'W1' }, { machine_busy: { machine_id: 'M1', task_id: 'W2' } });
      const btns = w.el('modal').querySelectorAll('button');
      const cancel = Array.prototype.filter.call(btns, b => b.textContent.indexOf('ביטול') > -1)[0];
      t.ok(cancel, 'כפתור הביטול חסר');
      H.click(w, cancel);
      t.eq(w.W05_PL, null, '⛔⛔ המצב נשאר תלוי — הדילוג עלול להישלח על משימה אחרת');
    },

    /* ================= WASH-15 — כרטיס האבחון ================= */

    '⭐ WASH-15: הכרטיס בהגדרות קיים ומחובר לפעולה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const h = w.b46FixPanelHtml();
      t.has(h, 'w15AuditBtn', '⛔ כפתור בדיקת המשקלים אינו בכרטיס התחזוקה');
      t.has(h, 'w15RunAudit()', '⛔ הכפתור אינו מחובר לפעולה');
      t.has(h, 'w15AuditOut', '⛔ אין מקום להצגת התוצאה');
      t.has(h, 'b54AuditBtn', '⛔⛔ כפתור בדיקת נתוני החיובים (B74) נעלם');
    },

    '⛔ WASH-15: הכרטיס מוצג למנהל בלבד': (t, { w, srv, H }) => {
      H.login(w, 'מכבסה', srv);
      t.eq(w.b46FixPanelHtml(), '', '⛔ פאנל התחזוקה נחשף לתפקיד שאינו מנהל');
    },

    '⭐ WASH-15: תשובת האבחון מוצגת — הפריטים החסרים והמונה לכל מכונה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const h = w.w15AuditHtml({
        ok: 1, tasks_open: 3, tasks_with_kg: 1, tasks_no_kg: 2, kg_total: 10,
        items_total: 12, items_no_weight: 4,
        missing: [{ item_id: 'IT9', name: 'סדין', tasks: 2, qty: 40 }], missing_more: 3,
        machines: [{ id: 'M1', type: 'מכונת כביסה', stage: 'בכביסה', status: 'פעילה',
          capacity: 35, load_kg: 10, load_count: 1, pct: 29 }]
      });
      t.has(h, 'סדין', '⛔ הפריט חסר המשקל אינו מוצג');
      t.has(h, '40', 'הכמות אינה מוצגת');
      t.has(h, 'ועוד 3', '⛔ מספר הפריטים הנוספים אינו מוצג');
      t.has(h, 'M1', 'המכונה אינה מוצגת');
      t.has(h, '29%', '⛔⛔ אחוז הניצולת אינו מוצג — זה כל מה שאבי צריך לראות');
      t.ok(h.indexOf('undefined') === -1, '⛔ מופיע undefined על המסך');
    },

    '⛔ WASH-15: הכרטיס שקט כשאין ממצא, ואינו נשבר על תשובה חסרה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const clean = w.w15AuditHtml({ ok: 1, tasks_open: 2, tasks_with_kg: 2, tasks_no_kg: 0,
        kg_total: 25, items_total: 12, items_no_weight: 0, missing: [], missing_more: 0,
        machines: [{ id: 'M1', type: 'מכונה', stage: 'בכביסה', status: 'פעילה',
          capacity: 0, load_kg: 25, load_count: 2, pct: '' }] });
      t.has(clean, 'בלי משקל 0', '⛔ מצב נקי אינו מוצג');
      t.has(clean, 'לא הוגדרה קיבולת', '⛔ מכונה בלי קיבולת אינה מסומנת');
      t.ok(clean.indexOf('undefined') === -1, '⛔ מופיע undefined על המסך');
      const bare = w.w15AuditHtml({ ok: 1 });
      t.ok(bare.indexOf('undefined') === -1,
        '⛔ תשובת שרת חסרה מייצרת undefined — הכרטיס חייב לעמוד בזה');
      t.has(bare, 'אין מכונות', '⛔ מצב "אין מכונות" אינו מטופל');
    },

    '⛔ WASH-15: האבחון אינו שולח שום בקשה עד שלוחצים': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.__fetches.length = 0;
      w.b46FixPanelHtml();
      w.w15AuditHtml({ ok: 1 });
      t.eq(w.__fetches.length, 0, '⛔ הרינדור לבדו שולח בקשה לשרת (R10)');
    },

    /* ================= שומרי מקור בממשק ================= */

    '⛔⛔ ההשוואה הגולמית לא חוזרת ל-b40ItemBreakdown ולדוח הניצולת': (t, { H }) => {
      const src = H.uiScript();
      const noCmt = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
      const body = name => {
        const i = src.indexOf('function ' + name + '(');
        if (i === -1) return null;
        let d = 0, started = false;
        for (let j = i; j < src.length; j++) {
          if (src[j] === '{') { d++; started = true; }
          else if (src[j] === '}') { d--; if (started && d === 0) return src.slice(i, j + 1); }
        }
        return null;
      };
      ['b40ItemBreakdown', 'b49eLegKind', 'b49eLegLabel'].forEach(fn => {
        const raw = body(fn);
        t.ok(raw, 'הפונקציה ' + fn + ' נעלמה מהממשק');
        const b = noCmt(raw || '');
        t.hasNot(b, "String(o.type)", '⛔⛔ השוואת סוג גולמית חזרה ל-' + fn);
        t.has(b, 'w21IsRental', '⛔⛔ ' + fn + ' אינו עובר דרך w21IsRental');
      });
      /* דוח הניצולת אינו פונקציה בשם קבוע — נסרק לפי העוגן שלו */
      const util = noCmt(src);
      t.hasNot(util, "if(String(o.type)!=='השכרה') return;",
        '⛔⛔ ההשוואה הגולמית חזרה לאחד מאתרי הסוג — כולל דוח הניצולת');
    },

    '⛔ שכבה 2 לא נגעה — אף פריט ב-B75 אינו יכולת דפדפן': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const names = w.b61Tests().map(x => x.n).join(' | ');
      ['WASH-15', 'WASH-05', 'WASH-08', 'WASH-13', 'WASH-16', 'WASH-21'].forEach(k => {
        t.ok(names.indexOf(k) === -1, '⛔ נוספה טענה לשכבה 2 עבור ' + k + ' — הוא נבדק בשכבה 1');
      });
    },

    '⛔ canary v4.80-B80 בשני המקומות בממשק': (t, { H }) => {
      const s = H.indexSrc();
      t.has(s, 'v4.80-B80', '⛔ ה-canary לא עודכן');
      t.eq((s.match(/v4\.80-B80/g) || []).length, 2,
        '⛔ ה-canary אינו מופיע בדיוק פעמיים (מסך כניסה + B61_CANARY)');
    }
  }
});

/* ============================================================
   B76 / WASH-22 — ציר הסטטוס של ההזמנה
   ------------------------------------------------------------
   ⚠ WASH-22 נוגע במלאי ולא בכסף — ולכן יש כאן בדיקת מלאי מלאה
   (availableQty · reservedQty · b48CommittedQty · inLaundryQty ·
   b48FreeOnShelf) לפני ואחרי, על סטטוס נקי ועל סטטוס מלוכלך, בשרת
   וגם בממשק, וכן בדיקת R6 בשלושת המקורות.
   ⚠ הכרעת אבי 17.08.2026: סטטוס לא מוכר וסטטוס ריק **משריינים מלאי**
   (במלאי בלבד — בשאר האתרים אין ריכוך).
   ⚠ תיקון נלווה מכוון: 'טיוטה' מלוכלכת הייתה **נספרת כחוב** לפני B76,
   כי ההשוואה מול B54_SKIP_ORDER נכשלה בשקט. עכשיו היא מדולגת כמו
   טיוטה נקייה — ושלושת מקורות הכסף מסכימים על כך (R6).
   ============================================================ */

const B76 = {
  DIRTY: ['מאושרת\u00A0', ' מאושרת', 'מאושרת ', '\u200Eמאושרת'],
  DIRTY_DRAFT: ['טיוטה\u00A0', ' טיוטה', '\u200Fטיוטה'],
  DIRTY_QUOTE: ['הצעת מחיר\u00A0', 'הצעת  מחיר', ' הצעת מחיר'],

  /* מלאי: פריט אחד, 100 יחידות במחסן, הזמנת השכרה על 10 */
  invDb(srv, status) {
    const db = H.emptyDb(srv);
    db.settings = [];
    db.customers = [{ id: 'C1', name: 'מלון הים', active: 'כן', price_per_kg: 5, credit_limit: 100000 }];
    db.items = [{ id: 'IT1', name: 'מגבת', active: 'כן', rent_price: 25, wash_price: 3, weight_kg: 0.5, min_stock: '' }];
    db.stockMoves = [{ id: 'SM1', item_id: 'IT1', qty: 100, warehouse_id: '' }];
    db.orders = [{ id: 'O1', order_number: '1001', customer_id: 'C1', type: 'השכרה', status: status,
      start_date: '2026-09-01', end_date: '2026-09-05', warehouse_id: '', delivery_fee: 0, shortage_charge: 0 }];
    db.orderLines = [{ id: 'OL1', order_id: 'O1', item_id: 'IT1', qty: 10, unit_price: 25, returned_qty: '' }];
    return db;
  },
  inv(srv, db) {
    return {
      avail: srv.availableQty(db, 'IT1', '2026-09-02', '2026-09-03'),
      reserved: srv.reservedQty(db, 'IT1', '2026-09-02', '2026-09-03'),
      committed: srv.b48CommittedQty(db, 'IT1'),
      laundry: srv.inLaundryQty(db, 'IT1'),
      free: srv.b48FreeOnShelf(db, 'IT1')
    };
  },
  money(srv, db) {
    srv.b54Bump();
    const bal = srv.b48BalancesAg(db)['C1'] || 0;
    const used = srv.b2CreditUsedAg(db, 'C1');
    const open = srv.b54CustomerOpenAg(db)['C1'] || 0;
    srv.b54Bump();
    return { bal: bal, used: used, open: open };
  },
  /* הממשק — אותו מצאי בדיוק, ישר על DB */
  uiSet(w, status) {
    w.DB.items = [{ id: 'IT1', name: 'מגבת', active: 'כן', min_stock: '' }];
    w.DB.stockMoves = [{ id: 'SM1', item_id: 'IT1', qty: 100, warehouse_id: '' }];
    w.DB.customers = [{ id: 'C1', name: 'מלון הים', active: 'כן', credit_limit: 100000 }];
    w.DB.orders = [{ id: 'O1', order_number: '1001', customer_id: 'C1', type: 'השכרה', status: status,
      start_date: '2026-09-01', end_date: '2026-09-05', warehouse_id: '', delivery_fee: 0, shortage_charge: 0 }];
    w.DB.orderLines = [{ id: 'OL1', order_id: 'O1', item_id: 'IT1', qty: 10, unit_price: 25, returned_qty: '' }];
    w.DB.laundryTasks = []; w.DB.invoices = []; w.DB.payments = []; w.DB.settings = [];
    /* ⚠ לקח B74 — המטמון יושב על אובייקט ה-DB עצמו. בלי מחיקה, המדידה
       השנייה מודדת את התוצאה של הראשונה ו"עוברת" בלי לבדוק כלום. */
    delete w.DB._b54Ledger; delete w.DB._b48Bal;
    return w.b40ItemBreakdown('IT1');
  },
  /* חתימת גוף פונקציה מקוד המקור, בלי הערות (לקח B75: H.stripComments
     נתקע במצב מחרוזת בקוד השרת — חותכים בתוך הגוף שחולץ בלבד) */
  body(src, name) {
    const i = src.indexOf('function ' + name + '(');
    if (i === -1) return null;
    let d = 0, started = false;
    for (let j = i; j < src.length; j++) {
      if (src[j] === '{') { d++; started = true; }
      else if (src[j] === '}') { d--; if (started && d === 0) return src.slice(i, j + 1); }
    }
    return null;
  },
  noCmt(s) { return String(s || '').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' '); }
};

SPECS.push({
  file: 't22-b76-srv',
  title: 'B76 — WASH-22 — ציר הסטטוס בשרת: מלאי · כסף · שערים',
  needs: 'server',
  requires: ['w22Stat', 'w22Known', 'w22Reserving', 'w21IsRental', 'w17IsWash',
             'reservedQty', 'b48CommittedQty', 'availableQty', 'inLaundryQty', 'b48FreeOnShelf',
             'b48BalancesAg', 'b2CreditUsedAg', 'b54CustomerOpenAg', 'b54Bump', 'b54Ledger',
             'approveOrder', 'deliverOrder', 'receiveReturn', 'sVal', 'sPick',
             'ORDER_STATUSES', 'RESERVING_STATUSES', 'B54_SKIP_ORDER', 'toAg', 'fromAg'],

  tests: {

    /* ================= המלאי ================= */

    '⛔⛔ WASH-22: הזמנה מאושרת עם סטטוס מלוכלך כן משריינת מלאי': (t, { srv }) => {
      const clean = B76.inv(srv, B76.invDb(srv, 'מאושרת'));
      t.eq(clean.reserved, 10, 'קו הבסיס נשבר — מאושרת נקייה אינה משריינת 10');
      B76.DIRTY.forEach(st => {
        const got = B76.inv(srv, B76.invDb(srv, st));
        t.eq(got.reserved, 10,
          '⛔⛔ reservedQty החזיר ' + got.reserved + ' על סטטוס ' + JSON.stringify(st) + ' — זה WASH-22 עצמו');
        t.eq(got.committed, 10,
          '⛔⛔ b48CommittedQty החזיר ' + got.committed + ' על סטטוס ' + JSON.stringify(st));
        t.eq(got.avail, clean.avail,
          '⛔⛔ availableQty נבדל בין סטטוס נקי (' + clean.avail + ') למלוכלך (' + got.avail + ')');
        t.eq(got.free, clean.free, '⛔ b48FreeOnShelf נבדל בין נקי למלוכלך');
      });
    },

    '⛔ WASH-22: המלאי על סטטוס נקי לא זז — רגרסיה מלאה': (t, { srv }) => {
      ['מאושרת', 'סופקה'].forEach(st => {
        const g = B76.inv(srv, B76.invDb(srv, st));
        t.eq(g.reserved, 10, '⛔ reservedQty זז על ' + st);
        t.eq(g.committed, 10, '⛔ b48CommittedQty זז על ' + st);
        t.eq(g.laundry, 0, '⛔ inLaundryQty זז');
        t.eq(g.avail, 90, '⛔ availableQty זז — 100 פחות 10 משוריינות');
        t.eq(g.free, 90, '⛔ b48FreeOnShelf זז');
      });
      ['הוחזרה', 'הושלמה', 'בוטלה'].forEach(st => {
        const g = B76.inv(srv, B76.invDb(srv, st));
        t.eq(g.reserved, 0, '⛔ סטטוס ' + st + ' התחיל לשריין — שינוי התנהגות');
        t.eq(g.avail, 100, '⛔ הזמין הושפע מסטטוס ' + st);
      });
    },

    '⛔ WASH-22: טיוטה והצעת מחיר אינן משריינות — גם מלוכלכות': (t, { srv }) => {
      ['טיוטה', 'הצעת מחיר'].concat(B76.DIRTY_DRAFT, B76.DIRTY_QUOTE).forEach(st => {
        const g = B76.inv(srv, B76.invDb(srv, st));
        t.eq(g.reserved, 0,
          '⛔⛔ סטטוס ' + JSON.stringify(st) + ' שריין מלאי — טיוטה אינה התחייבות');
        t.eq(g.committed, 0, '⛔⛔ b48CommittedQty ספר טיוטה על ' + JSON.stringify(st));
        t.eq(g.avail, 100, '⛔ הזמין הושפע מטיוטה');
        t.eq(g.free, 100, '⛔ b48FreeOnShelf הושפע מטיוטה');
      });
    },

    '⭐ הכרעת אבי: סטטוס לא מוכר וסטטוס ריק משריינים מלאי': (t, { srv }) => {
      ['בהמתנה', 'ממתין לאישור', '', 'XYZ'].forEach(st => {
        const g = B76.inv(srv, B76.invDb(srv, st));
        t.eq(g.reserved, 10,
          '⛔ סטטוס ' + JSON.stringify(st) + ' אינו משריין — הכרעת אבי 17.08.2026 היא שכן');
        t.eq(g.committed, 10, '⛔ b48CommittedQty אינו סופר סטטוס ' + JSON.stringify(st));
        t.eq(g.avail, 90, '⛔ הזמין אינו מפחית סטטוס לא מוכר');
      });
      t.no(srv.w22Reserving(null), 'w22Reserving על null אינו false');
      t.no(srv.w22Reserving(undefined), 'w22Reserving על undefined אינו false');
    },

    '⛔ w22Stat: קנוני לסטטוס מוכר, מנורמל לסטטוס לא מוכר': (t, { srv }) => {
      t.eq(srv.w22Stat({ status: 'מאושרת\u00A0' }), 'מאושרת', '⛔ רווח קשיח לא נורמל');
      t.eq(srv.w22Stat({ status: '\u200Eסופקה ' }), 'סופקה', '⛔ תו כיווניות לא נורמל');
      t.eq(srv.w22Stat({ status: 'הצעת  מחיר' }), 'הצעת מחיר', '⛔ רווח כפול לא נורמל');
      t.eq(srv.w22Stat({ status: 'בהמתנה' }), 'בהמתנה',
        '⛔⛔ סטטוס לא מוכר הוחלף בסטטוס מוכר — ריכוך אסור');
      t.eq(srv.w22Stat({ status: '' }), '', '⛔ סטטוס ריק אינו מחזיר מחרוזת ריקה');
      t.eq(srv.w22Stat(null), '', '⛔ w22Stat על null אינו מחזיר מחרוזת ריקה');
      t.ok(srv.w22Known({ status: ' מאושרת' }), '⛔ מאושרת מלוכלכת אינה מוכרת');
      t.no(srv.w22Known({ status: 'בהמתנה' }), '⛔ סטטוס לא מוכר סומן כמוכר');
      t.no(srv.w22Known({ status: '' }), '⛔ סטטוס ריק סומן כמוכר');
    },

    /* ================= הכסף — R6 ================= */

    '⛔ R6 בשלושת המקורות: מאושרת מלוכלכת — הכסף לא זז': (t, { srv }) => {
      const base = B76.money(srv, B76.invDb(srv, 'מאושרת'));
      t.eq(base.bal, 25000, 'קו הבסיס נשבר — 10 × 25 ₪ = 250 ₪ = 25000 אגורות');
      t.eq(base.used, base.bal, '⛔ R6: b2CreditUsedAg נבדל מ-b48BalancesAg');
      t.eq(base.open, base.bal, '⛔ R6: b54CustomerOpenAg נבדל מ-b48BalancesAg');
      B76.DIRTY.forEach(st => {
        const got = B76.money(srv, B76.invDb(srv, st));
        t.eq(got.bal, base.bal, '⛔⛔ הכסף זז על סטטוס ' + JSON.stringify(st));
        t.eq(got.used, got.bal, '⛔ R6 נשבר על סטטוס ' + JSON.stringify(st));
        t.eq(got.open, got.bal, '⛔ R6 נשבר על סטטוס ' + JSON.stringify(st));
      });
    },

    '⭐ R6: טיוטה מלוכלכת אינה חוב — התיקון הנלווה, ושלושת המקורות מסכימים': (t, { srv }) => {
      const clean = B76.money(srv, B76.invDb(srv, 'טיוטה'));
      t.eq(clean.bal, 0, 'קו הבסיס נשבר — טיוטה נקייה נספרה כחוב');
      B76.DIRTY_DRAFT.concat(B76.DIRTY_QUOTE).forEach(st => {
        const got = B76.money(srv, B76.invDb(srv, st));
        t.eq(got.bal, 0,
          '⛔⛔ סטטוס ' + JSON.stringify(st) + ' עדיין נספר כחוב — B54_SKIP_ORDER לא נורמל');
        t.eq(got.used, got.bal, '⛔ R6 נשבר על ' + JSON.stringify(st));
        t.eq(got.open, got.bal, '⛔ R6 נשבר על ' + JSON.stringify(st));
      });
      /* סטטוס לא מוכר — מחויב, כמו לפני B76 (אינו ב-B54_SKIP_ORDER) */
      const unk = B76.money(srv, B76.invDb(srv, 'בהמתנה'));
      t.eq(unk.bal, 25000, '⛔ סטטוס לא מוכר הפסיק להיות מחויב — שינוי כסף בלי הכרעה');
      t.eq(unk.used, unk.bal, '⛔ R6 נשבר על סטטוס לא מוכר');
    },

    '⛔ B74 לא נשבר — הזמנת כביסה מלוכלכת אינה כסף השכרה': (t, { srv }) => {
      const db = B76.invDb(srv, 'מאושרת\u00A0');
      db.orders[0].type = 'כביסה\u00A0';
      const m = B76.money(srv, db);
      t.eq(m.bal, 0, '⛔⛔ B74 נשבר — כביסה מלוכלכת חזרה להיות כסף השכרה');
      const g = B76.inv(srv, db);
      t.eq(g.reserved, 0, '⛔⛔ B75 נשבר — הזמנת כביסה שריינה מלאי MAPA');
    },

    /* ================= השערים התפעוליים ================= */

    '⭐ WASH-22: אישור · אספקה · קליטת החזרה עובדים על סטטוס מלוכלך': (t, { srv }) => {
      const run = st => {
        const db = B76.invDb(srv, st);
        return srv.approveOrder(db, 'O1');
      };
      t.ok(run('טיוטה').ok, 'קו הבסיס נשבר — אישור טיוטה נקייה נכשל');
      B76.DIRTY_DRAFT.forEach(st => {
        const r = run(st);
        t.ok(r.ok, '⛔⛔ אישור נכשל על טיוטה ' + JSON.stringify(st) + ': ' + (r.error || ''));
      });
      B76.DIRTY.forEach(st => {
        const db = B76.invDb(srv, st);
        const r = srv.deliverOrder(db, 'O1');
        t.ok(r.ok, '⛔⛔ אספקה נכשלה על מאושרת ' + JSON.stringify(st) + ': ' + (r.error || ''));
      });
      const dbR = B76.invDb(srv, 'סופקה\u00A0');
      const rr = srv.receiveReturn(dbR, 'O1', {}, '2026-09-06', p => p + '-1', 'מנהל');
      t.ok(rr.ok, '⛔⛔ קליטת החזרה נכשלה על סופקה מלוכלכת: ' + (rr.error || ''));
      const bad = srv.approveOrder(B76.invDb(srv, 'בהמתנה'), 'O1');
      t.no(bad.ok, '⛔ אישור עבר על סטטוס לא מוכר — ריכוך מחוץ למלאי אסור');
    },

    /* ================= שומרי מקור ================= */

    '⛔⛔ ההשוואה הגולמית לא חוזרת לנקודות המלאי ולספר החיובים': (t, { H }) => {
      const src = H.serverSrc();
      ['reservedQty', 'b48CommittedQty'].forEach(fn => {
        const b = B76.noCmt(B76.body(src, fn));
        t.ok(b, 'הפונקציה ' + fn + ' נעלמה מקוד השרת');
        t.hasNot(b, 'RESERVING_STATUSES.indexOf(o.status)', '⛔⛔ ההשוואה הגולמית חזרה ל-' + fn);
        t.hasNot(b, 'String(o.status)', '⛔⛔ השוואת סטטוס גולמית חזרה ל-' + fn);
        t.has(b, 'w22Reserving', '⛔⛔ ' + fn + ' אינו עובר דרך w22Reserving');
        t.has(b, 'w21IsRental', '⛔⛔ B75 נשבר — ' + fn + ' אינו עובר דרך w21IsRental');
      });
      const led = B76.noCmt(B76.body(src, 'b54Ledger'));
      t.has(led, 'B54_SKIP_ORDER.indexOf(w22Stat(o))', '⛔⛔ ספר החיובים חזר להשוואת סטטוס גולמית');
      t.hasNot(B76.noCmt(B76.body(src, 'w17IsWash')), 'o.type !==', '⛔ w17IsWash שונה — B74 נשבר');
    },

    '⛔ אין שינוי סכימה — orders לא זזה': (t, { srv }) => {
      t.has(srv.TABLES.orders.join(','), 'status', '⛔ status נעלם מ-orders');
      t.eq(srv.ORDER_STATUSES.length, 7, '⛔⛔ נוסף או הוסר סטטוס הזמנה');
      t.eq(srv.RESERVING_STATUSES.join('|'), 'מאושרת|סופקה', '⛔⛔ RESERVING_STATUSES שונה — רשימת כסף בעקיפין');
      t.eq(srv.B54_SKIP_ORDER.join('|'), 'בוטלה|טיוטה|הצעת מחיר', '⛔⛔ B54_SKIP_ORDER שונה');
    }
  }
});

SPECS.push({
  file: 't22-b76-ui',
  title: 'B76 — WASH-22 — ציר הסטטוס בממשק: כרטיס הפריט · טאבי ההזמנות · הדונאט',
  needs: 'ui',
  requires: ['w22Stat', 'w22Known', 'w22Reserving', 'w21IsRental', 'b40ItemBreakdown',
             'b54LedgerFE', 'b48BalancesAgFE', 'custBalance', 'renderOrdersList',
             'ordersDonutSvg', 'b61Tests', 'sVal', 'sPick', 'el', 'go'],

  tests: {

    '⭐⭐ WASH-22: סטטוס מלוכלך משריין מלאי בכרטיס הפריט': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const clean = B76.uiSet(w, 'מאושרת');
      t.eq(clean.resQ, 10, 'קו הבסיס נשבר — מאושרת נקייה אינה משוריינת');
      t.eq(clean.availQ, 90, 'קו הבסיס נשבר — 100 פחות 10 משוריינות');
      B76.DIRTY.forEach(st => {
        const g = B76.uiSet(w, st);
        t.eq(g.resQ, 10,
          '⛔⛔ סטטוס ' + JSON.stringify(st) + ' לא שריין — הפריט נראה זמין למרות שהתחייבנו עליו');
        t.eq(g.availQ, clean.availQ,
          '⛔⛔ הזמין נבדל בין נקי (' + clean.availQ + ') למלוכלך (' + g.availQ + ')');
      });
    },

    '⛔ WASH-22: טיוטה והצעת מחיר אינן משריינות בממשק — גם מלוכלכות': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      ['טיוטה', 'הצעת מחיר'].concat(B76.DIRTY_DRAFT, B76.DIRTY_QUOTE).forEach(st => {
        const g = B76.uiSet(w, st);
        t.eq(g.resQ, 0, '⛔⛔ סטטוס ' + JSON.stringify(st) + ' שריין מלאי בכרטיס הפריט');
        t.eq(g.availQ, 100, '⛔ הזמין הושפע מטיוטה');
      });
    },

    '⛔⛔ WASH-22: הממשק והשרת מסכימים על המלאי בכל סטטוס': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      ['מאושרת', 'מאושרת\u00A0', 'סופקה', ' סופקה', 'טיוטה', 'טיוטה\u00A0',
       'הצעת מחיר', 'הוחזרה', 'הושלמה', 'בוטלה', 'בהמתנה', ''].forEach(st => {
        const ui = B76.uiSet(w, st);
        const sv = B76.inv(srv, B76.invDb(srv, st));
        /* בממשק 'סופקה' יושבת ב-outQ ו'מאושרת' ב-resQ — שתיהן תופסות מלאי
           (RESERVING_STATUSES בשרת), ולכן ההשוואה היא על הסכום. */
        t.eq(ui.outQ + ui.resQ, sv.committed,
          '⛔⛔ הממשק (' + (ui.outQ + ui.resQ) + ') והשרת (' + sv.committed + ') נבדלו על סטטוס ' + JSON.stringify(st));
        t.eq(ui.availQ, sv.free,
          '⛔⛔ "פנוי" בממשק (' + ui.availQ + ') נבדל מ-b48FreeOnShelf (' + sv.free + ') על ' + JSON.stringify(st));
        t.eq(w.w22Stat({ status: st }), srv.w22Stat({ status: st }),
          '⛔⛔ w22Stat נבדל בין הקבצים על ' + JSON.stringify(st));
        t.eq(w.w22Reserving({ status: st }), srv.w22Reserving({ status: st }),
          '⛔⛔ w22Reserving נבדל בין הקבצים על ' + JSON.stringify(st));
      });
    },

    '⛔ R6 בממשק: custBalance מסכים עם השרת גם על סטטוס מלוכלך': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      ['מאושרת', 'מאושרת\u00A0', ' מאושרת', 'טיוטה', 'טיוטה\u00A0', 'בהמתנה'].forEach(st => {
        B76.uiSet(w, st);
        const feAg = w.b48BalancesAgFE()['C1'] || 0;
        const svAg = B76.money(srv, B76.invDb(srv, st)).bal;
        t.eq(feAg, svAg,
          '⛔⛔ R6 נשבר: הממשק ' + feAg + ' מול השרת ' + svAg + ' על סטטוס ' + JSON.stringify(st));
      });
    },

    '⛔ טאבי ההזמנות: סטטוס סגור מלוכלך אינו יושב בטאב "פתוחות"': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      B76.uiSet(w, 'הושלמה\u00A0');
      w.go('orders');
      w.ORD_TAB = 'open'; w.renderOrdersList();
      const openHtml = w.el('ordList') ? w.el('ordList').innerHTML : '';
      t.hasNot(openHtml, '1001', '⛔⛔ הזמנה שהושלמה (סטטוס מלוכלך) הופיעה בטאב "פתוחות"');
      w.ORD_TAB = 'closed'; w.renderOrdersList();
      const closedHtml = w.el('ordList') ? w.el('ordList').innerHTML : '';
      t.has(closedHtml, '1001', '⛔⛔ הזמנה שהושלמה (סטטוס מלוכלך) נעלמה גם מטאב "סגורות"');
      w.ORD_TAB = 'open';
    },

    '⛔ דונאט ההזמנות: סטטוס מלוכלך אינו פותח פרוסה נפרדת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      B76.uiSet(w, 'מאושרת');
      w.DB.orders.push({ id: 'O2', order_number: '1002', customer_id: 'C1', type: 'השכרה',
        status: 'מאושרת\u00A0', start_date: '2026-09-01', end_date: '2026-09-05', warehouse_id: '' });
      const svg = w.ordersDonutSvg();
      t.has(svg, 'מאושרת', 'המקרא אינו מציג את הסטטוס');
      t.eq((svg.match(/ordersStatusDetail\(/g) || []).length, 1,
        '⛔⛔ הסטטוס המלוכלך פתח פרוסה שנייה בדונאט — אותו סטטוס נראה כשניים');
      t.has(svg, '<b>2</b>', '⛔⛔ שתי ההזמנות לא נספרו יחד באותה פרוסה');
    },

    '⛔⛔ ההשוואה הגולמית לא חוזרת ל-b40ItemBreakdown': (t, { H }) => {
      const src = H.uiScript();
      const b = B76.noCmt(B76.body(src, 'b40ItemBreakdown'));
      t.ok(b, 'b40ItemBreakdown נעלם מהממשק');
      t.hasNot(b, 'String(o.status)', '⛔⛔ השוואת סטטוס גולמית חזרה ל-b40ItemBreakdown');
      t.has(b, 'w22Stat', '⛔⛔ b40ItemBreakdown אינו עובר דרך w22Stat');
      t.has(b, 'w22Known', '⛔⛔ סטטוס לא מוכר הפסיק לשריין בממשק (הכרעת אבי)');
      t.has(b, 'w21IsRental', '⛔ B75 נשבר — b40ItemBreakdown אינו עובר דרך w21IsRental');
      const led = B76.noCmt(B76.body(src, 'b54LedgerFE'));
      t.has(led, 'B54_SKIP_ORDER.indexOf(w22Stat(o))', '⛔⛔ ספר החיובים בממשק חזר להשוואה גולמית');
    },

    '⛔⛔ w22Stat ושתי רשימות הסטטוס זהות תו-בתו בין השרת לממשק': (t, { H }) => {
      const rxS = /function\s+w22Stat\s*\(o\)\s*\{[^}]*\}/;
      const rxK = /function\s+w22Known\s*\(o\)\s*\{[^}]*\}/;
      const rxR = /function\s+w22Reserving\s*\(o\)\s*\{[^}]*\}/;
      const sv = H.serverSrc(), ui = H.uiScript();
      [['w22Stat', rxS], ['w22Known', rxK], ['w22Reserving', rxR]].forEach(pair => {
        const a = (sv.match(pair[1]) || [])[0], b = (ui.match(pair[1]) || [])[0];
        t.ok(a, pair[0] + ' אינו קיים בקוד השרת');
        t.ok(b, pair[0] + ' אינו קיים ב-index.html');
        t.eq(a, b, '⛔⛔ ' + pair[0] + ' התפצל בין הקבצים — הממשק והשרת יסווגו סטטוס אחרת');
      });
      const rxList = n => new RegExp('var\\s+' + n + '\\s*=\\s*\\[[^\\]]*\\]');
      ['ORDER_STATUSES', 'RESERVING_STATUSES'].forEach(n => {
        const a = (sv.match(rxList(n)) || [])[0], b = (ui.match(rxList(n)) || [])[0];
        t.ok(a, n + ' אינו קיים בקוד השרת');
        t.ok(b, n + ' אינו קיים ב-index.html');
        t.eq(a.replace(/\s+/g, ' '), b.replace(/\s+/g, ' '),
          '⛔⛔ ' + n + ' התפצל בין הקבצים');
      });
    },

    '⛔ שכבה 2 לא נגעה — WASH-22 אינו יכולת דפדפן': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const names = w.b61Tests().map(x => x.n).join(' | ');
      t.ok(names.indexOf('WASH-22') === -1, '⛔ נוספה טענה לשכבה 2 עבור WASH-22 — הוא נבדק בשכבה 1');
    },

    '⛔ canary v4.80-B80 בשני המקומות בממשק': (t, { H }) => {
      const s = H.indexSrc();
      t.eq((s.match(/v4\.80-B80/g) || []).length, 2,
        '⛔ ה-canary אינו מופיע בדיוק פעמיים (מסך כניסה + B61_CANARY)');
    }
  }
});

/* ============================================================
   B77 / WASH-23 — ציר הסטטוס של החשבונית
   ------------------------------------------------------------
   ⛔⛔ WASH-23 נוגע ב**כסף ישיר**, ולא במלאי כמו WASH-22. חשבונית
   שסטטוסה בגיליון מלוכלך ('בוטלה' + רווח קשיח) נחשבה **פעילה**:
   הלקוח הוצג כחייב על מסמך שבוטל, והמסמך חסם הפקת חשבונית שנייה.
   ⚠ הכרעת אבי 18.08.2026 (1א): סטטוס חשבונית **לא מוכר** ו**ריק**
   נחשבים פעילים — הצד הזהיר, וזו גם ההתנהגות שהייתה.
   ⚠ הכרעת אבי 18.08.2026 (2א): עוזר אחד — w23InvStat + w23InvActive,
   זהים תו-בתו בשני הקבצים, בדיוק כמו w22Stat.
   ⛔ בדיקת R6 בשלושת המקורות היא לב האצווה: b48BalancesAg (שרת) ·
   b48BalancesAgFE/custBalance (ממשק) · b2CreditUsedAg (מנוע האשראי).
   ⭐ נלווה: דליפת WASH-22 שנמצאה כאן — B44_PICK_STATUSES השווה
   o.status גולמי בארבעה אתרים בממשק ולכן חסם ליקוט של הזמנה תקינה.
   ============================================================ */

const B77 = {
  DIRTY_CANCEL: ['בוטלה\u00A0', ' בוטלה', 'בוטלה ', '\u200Eבוטלה'],
  DIRTY_OPEN: ['פתוחה\u00A0', ' פתוחה', '\u200Fפתוחה'],
  UNKNOWN: ['מבוטל', 'ממתינה', ''],

  /* חשבונית חופשית (בלי order_id) על 1,000 ₪ נטו — נכנסת לספר
     כשורה סינתטית, ולכן היא מדידה ישירה של "כמה הלקוח חייב". */
  invDb(srv, status) {
    const db = H.emptyDb(srv);
    db.settings = [];
    db.customers = [{ id: 'C1', name: 'מלון הים', active: 'כן', credit_limit: 1000000 }];
    db.invoices = [{ id: 'IV1', number: '5001', order_id: '', customer_id: 'C1',
      date: '2026-08-01', subtotal: 1000, vat_rate: 18, vat: 180, total: 1180,
      status: status, type: 'חשבונית' }];
    return db;
  },
  money(srv, db) {
    srv.b54Bump();
    const bal = srv.b48BalancesAg(db)['C1'] || 0;
    const used = srv.b2CreditUsedAg(db, 'C1');
    const open = srv.b54CustomerOpenAg(db)['C1'] || 0;
    srv.b54Bump();
    return { bal: bal, used: used, open: open };
  },
  /* הממשק — אותה חשבונית בדיוק, ישר על DB.
     ⚠ לקח B74: המטמון יושב על אובייקט ה-DB עצמו. בלי מחיקה, המדידה
     השנייה מודדת את התוצאה של הראשונה ו"עוברת" בלי לבדוק כלום. */
  uiSet(w, status) {
    w.DB.customers = [{ id: 'C1', name: 'מלון הים', active: 'כן', credit_limit: 1000000 }];
    w.DB.orders = []; w.DB.orderLines = []; w.DB.payments = [];
    w.DB.laundryTasks = []; w.DB.laundryIntakes = []; w.DB.charges = []; w.DB.settings = [];
    w.DB.invoices = [{ id: 'IV1', number: '5001', order_id: '', customer_id: 'C1',
      date: '2026-08-01', subtotal: 1000, vat_rate: 18, vat: 180, total: 1180,
      status: status, type: 'חשבונית' }];
    delete w.DB._b54Ledger; delete w.DB._b48Bal;
    return w.b48BalancesAgFE()['C1'] || 0;
  },
  /* הזמנה מאושרת + חשבונית — לבדיקת שער ההפקה ושער העדכון */
  orderDb(srv, invStatus) {
    const db = H.emptyDb(srv);
    db.settings = [];
    db.customers = [{ id: 'C1', name: 'מלון הים', active: 'כן', credit_limit: 1000000 }];
    db.items = [{ id: 'IT1', name: 'מגבת', active: 'כן', rent_price: 25, weight_kg: 0.5 }];
    db.stockMoves = [{ id: 'SM1', item_id: 'IT1', qty: 100, warehouse_id: '' }];
    db.orders = [{ id: 'O1', order_number: '1001', customer_id: 'C1', type: 'השכרה',
      status: 'מאושרת', start_date: '2026-09-01', end_date: '2026-09-05',
      warehouse_id: '', delivery_fee: 0, shortage_charge: 0 }];
    db.orderLines = [{ id: 'OL1', order_id: 'O1', item_id: 'IT1', qty: 10, unit_price: 25, returned_qty: '' }];
    db.invoices = [{ id: 'IV1', number: '5001', order_id: 'O1', customer_id: 'C1',
      date: '2026-08-01', subtotal: 250, vat_rate: 18, vat: 45, total: 295,
      status: invStatus, type: 'חשבונית' }];
    return db;
  },
  /* חתימת גוף פונקציה מקוד המקור, בלי הערות.
     ⚠ לקח B75: H.stripComments נתקע במצב מחרוזת בקוד השרת — חותכים
     בתוך הגוף שחולץ בלבד, לא על הקובץ כולו. */
  body(src, name) {
    const i = src.indexOf('function ' + name + '(');
    if (i === -1) return null;
    let d = 0, started = false;
    for (let j = i; j < src.length; j++) {
      if (src[j] === '{') { d++; started = true; }
      else if (src[j] === '}') { d--; if (started && d === 0) return src.slice(i, j + 1); }
    }
    return null;
  },
  noCmt(s) { return String(s || '').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' '); }
};

SPECS.push({
  file: 't23-b77-srv',
  title: 'B77 — WASH-23 — ציר הסטטוס של החשבונית בשרת: כסף · שערים · R6',
  needs: 'server',
  requires: ['w23InvStat', 'w23InvActive', 'INVOICE_STATUSES', 'w22Stat', 'w16ActiveInvoiceOf',
             'b54Ledger', 'b54CustomerOpenAg', 'b48BalancesAg', 'b2CreditUsedAg', 'b54Bump',
             'b1CreateInvoice', 'sVal', 'sPick', 'toAg', 'fromAg'],

  tests: {

    /* ================= העוזר עצמו ================= */

    '⛔⛔ WASH-23: סטטוס חשבונית מלוכלך מזוהה כמבוטל': (t, { srv }) => {
      t.eq(srv.w23InvActive({ status: 'בוטלה' }), false, 'קו הבסיס נשבר — בוטלה נקייה נחשבת פעילה');
      B77.DIRTY_CANCEL.forEach(st => {
        t.eq(srv.w23InvActive({ status: st }), false,
          '⛔⛔ סטטוס ' + JSON.stringify(st) + ' נחשב פעיל — זה WASH-23 עצמו');
        t.eq(srv.w23InvStat({ status: st }), 'בוטלה',
          '⛔ w23InvStat לא נרמל את ' + JSON.stringify(st));
      });
      B77.DIRTY_OPEN.forEach(st => {
        t.eq(srv.w23InvStat({ status: st }), 'פתוחה', '⛔ w23InvStat לא נרמל את ' + JSON.stringify(st));
        t.eq(srv.w23InvActive({ status: st }), true, '⛔ חשבונית פתוחה מלוכלכת הפסיקה להיות פעילה');
      });
    },

    '⭐ הכרעת אבי 1א: סטטוס לא מוכר וסטטוס ריק — חשבונית פעילה': (t, { srv }) => {
      B77.UNKNOWN.forEach(st => {
        t.eq(srv.w23InvActive({ status: st }), true,
          '⛔⛔ סטטוס ' + JSON.stringify(st) + ' הפך למבוטל — הכרעת אבי הייתה "פעילה"');
      });
      t.eq(srv.w23InvActive(null), false, 'חשבונית שאינה קיימת אינה פעילה');
      t.eq(srv.w23InvActive(undefined), false, 'חשבונית שאינה קיימת אינה פעילה');
    },

    '⛔ w23InvStat מחזירה את הערך המנורמל עצמו כשאין התאמה': (t, { srv }) => {
      t.eq(srv.w23InvStat({ status: ' מבוטל\u00A0' }), 'מבוטל',
        '⛔⛔ סטטוס לא מוכר מופה לסטטוס אחר או רוקן — אסור');
      t.eq(srv.w23InvStat({ status: '' }), '', 'סטטוס ריק חייב להישאר ריק');
      t.eq(srv.w23InvStat(null), '', 'חשבונית חסרה מחזירה מחרוזת ריקה');
    },

    /* ================= הכסף ================= */

    '⛔⛔ WASH-23 — הכסף: חשבונית מבוטלת מלוכלכת אינה מחייבת את הלקוח': (t, { srv }) => {
      const cancelled = B77.money(srv, B77.invDb(srv, 'בוטלה'));
      t.eq(cancelled.bal, 0, 'קו הבסיס נשבר — בוטלה נקייה כן חייבה את הלקוח');
      B77.DIRTY_CANCEL.forEach(st => {
        const got = B77.money(srv, B77.invDb(srv, st));
        t.eq(got.bal, 0,
          '⛔⛔ הלקוח חויב ב-' + got.bal + ' אגורות על חשבונית מבוטלת עם סטטוס ' +
          JSON.stringify(st) + ' — זה הכסף של WASH-23');
        t.eq(got.used, 0, '⛔⛔ מנוע האשראי ספר חוב על חשבונית מבוטלת מלוכלכת');
        t.eq(got.open, 0, '⛔⛔ ספר החיובים ספר חשבונית מבוטלת מלוכלכת');
      });
    },

    '⛔ WASH-23 — הכסף על סטטוס נקי לא זז (רגרסיה מלאה)': (t, { srv }) => {
      ['פתוחה', 'שולמה'].forEach(st => {
        const g = B77.money(srv, B77.invDb(srv, st));
        t.eq(g.bal, 118000, '⛔ היתרה זזה על סטטוס נקי ' + st + ' — התקבל ' + g.bal);
        t.eq(g.used, 118000, '⛔ מנוע האשראי זז על סטטוס נקי ' + st);
        t.eq(g.open, 118000, '⛔ ספר החיובים זז על סטטוס נקי ' + st);
      });
      const dirtyOpen = B77.money(srv, B77.invDb(srv, 'פתוחה\u00A0'));
      t.eq(dirtyOpen.bal, 118000, '⛔ חשבונית פתוחה מלוכלכת הפסיקה לחייב');
    },

    '⭐ סטטוס לא מוכר: הלקוח חייב — ולא נעלם בשקט': (t, { srv }) => {
      B77.UNKNOWN.forEach(st => {
        const g = B77.money(srv, B77.invDb(srv, st));
        t.eq(g.bal, 118000,
          '⛔⛔ חוב של 1,180 ₪ נעלם על סטטוס ' + JSON.stringify(st) + ' — הכרעת אבי הייתה "פעילה"');
      });
    },

    '⛔⛔ R6 — שלושת מקורות הכסף מסכימים, נקי ומלוכלך': (t, { srv }) => {
      ['פתוחה', 'פתוחה\u00A0', ' פתוחה', 'שולמה', 'בוטלה', 'בוטלה\u00A0',
       ' בוטלה', '\u200Eבוטלה', 'מבוטל', ''].forEach(st => {
        const g = B77.money(srv, B77.invDb(srv, st));
        t.eq(g.bal, g.used,
          '⛔⛔ R6 נשבר: b48BalancesAg=' + g.bal + ' מול b2CreditUsedAg=' + g.used +
          ' על סטטוס ' + JSON.stringify(st));
        t.eq(g.bal, g.open,
          '⛔⛔ R6 נשבר: b48BalancesAg=' + g.bal + ' מול b54CustomerOpenAg=' + g.open +
          ' על סטטוס ' + JSON.stringify(st));
      });
    },

    /* ================= השערים ================= */

    '⛔⛔ חשבונית מבוטלת מלוכלכת אינה חוסמת הפקה חדשה (WASH-16 לא נשבר)': (t, { srv }) => {
      B77.DIRTY_CANCEL.concat(['בוטלה']).forEach(st => {
        const db = B77.orderDb(srv, st);
        const r = srv.b1CreateInvoice(db, { order_id: 'O1' }, 'מנהל');
        t.eq(r.ok, true,
          '⛔⛔ הפקת חשבונית נחסמה בגלל חשבונית מבוטלת עם סטטוס ' +
          JSON.stringify(st) + ' — ' + (r && r.error));
      });
    },

    '⛔ חשבונית פעילה כן חוסמת הפקה שנייה — גם כשהסטטוס מלוכלך': (t, { srv }) => {
      ['פתוחה', 'פתוחה\u00A0', ' שולמה', 'מבוטל', ''].forEach(st => {
        const db = B77.orderDb(srv, st);
        const r = srv.b1CreateInvoice(db, { order_id: 'O1' }, 'מנהל');
        t.eq(r.ok, false,
          '⛔⛔ הופקה חשבונית שנייה להזמנה שכבר יש לה חשבונית פעילה (סטטוס ' +
          JSON.stringify(st) + ') — כפל חיוב');
      });
    },

    '⛔ w16ActiveInvoiceOf ממשיך למצוא חשבונית פעילה ומדלג על מבוטלת מלוכלכת': (t, { srv }) => {
      t.ok(srv.w16ActiveInvoiceOf(B77.orderDb(srv, 'פתוחה\u00A0'), 'O1'),
        '⛔ חשבונית פתוחה מלוכלכת לא נמצאה');
      t.eq(srv.w16ActiveInvoiceOf(B77.orderDb(srv, ' בוטלה'), 'O1'), null,
        '⛔ חשבונית מבוטלת מלוכלכת נחשבה פעילה בשער B75');
    },

    /* ================= שומרי מקור ================= */

    '⛔⛔ ההשוואה הגולמית לא חוזרת לספר החיובים ולא לשערי החשבונית': (t, { H }) => {
      const sv = H.serverSrc();
      const led = B77.noCmt(B77.body(sv, 'b54Ledger'));
      t.ok(led, 'b54Ledger נעלם מקוד השרת');
      t.has(led, 'w23InvActive', '⛔⛔ ספר החיובים אינו עובר דרך w23InvActive');
      t.hasNot(led, "v.status !== 'בוטלה'", '⛔⛔ השוואת סטטוס חשבונית גולמית חזרה ל-b54Ledger');
      t.has(led, 'B54_SKIP_ORDER.indexOf(w22Stat(o))', '⛔ B76 נשבר — ספר החיובים חזר להשוואה גולמית של סטטוס הזמנה');
      const cr = B77.noCmt(B77.body(sv, 'b1CreateInvoice'));
      t.ok(cr, 'b1CreateInvoice נעלם מקוד השרת');
      t.has(cr, 'w23InvActive', '⛔⛔ שער הפקת החשבונית אינו עובר דרך w23InvActive');
      t.has(cr, 'w22Stat', '⛔ B76 נשבר — שער ההפקה חזר להשוואה גולמית של סטטוס הזמנה');
      const ac = B77.noCmt(B77.body(sv, 'w16ActiveInvoiceOf'));
      t.has(ac, 'w23InvActive', '⛔ w16ActiveInvoiceOf אינו עובר דרך w23InvActive');
    },

    '⛔⛔ אין יותר השוואת סטטוס חשבונית גולמית בקוד השרת': (t, { H }) => {
      const sv = H.stripComments(H.serverSrc());
      const bad = (sv.match(/\b(?:v|x|iv|ivL|iv2|inv|inv2|invO|oInv|cv|rec43)\.status\s*(?:===|!==)\s*'בוטלה'/g) || []);
      t.eq(bad.length, 0,
        '⛔⛔ נותרו ' + bad.length + ' השוואות סטטוס חשבונית גולמיות בשרת: ' + bad.join(' · '));
    }
  }
});

SPECS.push({
  file: 't23-b77-ui',
  title: 'B77 — WASH-23 — ציר הסטטוס של החשבונית בממשק: R6 · זהות תו-בתו · שער הליקוט',
  needs: 'ui',
  requires: ['w23InvStat', 'w23InvActive', 'INVOICE_STATUSES', 'w22Stat',
             'b54LedgerFE', 'b48BalancesAgFE', 'custBalance', 'b61Tests',
             'B44_PICK_STATUSES', 'sVal', 'sPick'],

  tests: {

    '⛔⛔ WASH-23 בממשק: חשבונית מבוטלת מלוכלכת אינה מחייבת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      t.eq(B77.uiSet(w, 'בוטלה'), 0, 'קו הבסיס נשבר — בוטלה נקייה חייבה את הלקוח בממשק');
      B77.DIRTY_CANCEL.forEach(st => {
        const ag = B77.uiSet(w, st);
        t.eq(ag, 0,
          '⛔⛔ הממשק הציג חוב של ' + ag + ' אגורות על חשבונית מבוטלת עם סטטוס ' + JSON.stringify(st));
      });
      t.eq(B77.uiSet(w, 'פתוחה\u00A0'), 118000, '⛔ חשבונית פתוחה מלוכלכת הפסיקה לחייב בממשק');
    },

    '⛔⛔ R6 בממשק: custBalance מסכים עם השרת על כל סטטוס חשבונית': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      ['פתוחה', 'פתוחה\u00A0', ' פתוחה', 'שולמה', 'בוטלה', 'בוטלה\u00A0',
       ' בוטלה', '\u200Eבוטלה', 'מבוטל', ''].forEach(st => {
        const feAg = B77.uiSet(w, st);
        const svAg = B77.money(srv, B77.invDb(srv, st)).bal;
        t.eq(feAg, svAg,
          '⛔⛔ R6 נשבר: הממשק ' + feAg + ' מול השרת ' + svAg +
          ' על סטטוס ' + JSON.stringify(st));
        t.eq(w.custBalance('C1'), svAg / 100,
          '⛔⛔ custBalance נבדל מהשרת על סטטוס ' + JSON.stringify(st));
        t.eq(w.w23InvStat({ status: st }), srv.w23InvStat({ status: st }),
          '⛔⛔ w23InvStat נבדל בין הקבצים על ' + JSON.stringify(st));
        t.eq(w.w23InvActive({ status: st }), srv.w23InvActive({ status: st }),
          '⛔⛔ w23InvActive נבדל בין הקבצים על ' + JSON.stringify(st));
      });
    },

    '⛔⛔ w23InvStat · w23InvActive · INVOICE_STATUSES זהים תו-בתו': (t, { H }) => {
      const sv = H.serverSrc(), ui = H.uiScript();
      const rxS = /function\s+w23InvStat\s*\(v\)\s*\{[^}]*\}/;
      const rxA = /function\s+w23InvActive\s*\(v\)\s*\{[^}]*\}/;
      [['w23InvStat', rxS], ['w23InvActive', rxA]].forEach(pair => {
        const a = (sv.match(pair[1]) || [])[0], b = (ui.match(pair[1]) || [])[0];
        t.ok(a, pair[0] + ' אינו קיים בקוד השרת');
        t.ok(b, pair[0] + ' אינו קיים ב-index.html');
        t.eq(a, b, '⛔⛔ ' + pair[0] + ' התפצל בין הקבצים — הממשק והשרת יסווגו חשבונית אחרת');
      });
      const rxL = /var\s+INVOICE_STATUSES\s*=\s*\[[^\]]*\]/;
      const a = (sv.match(rxL) || [])[0], b = (ui.match(rxL) || [])[0];
      t.ok(a, 'INVOICE_STATUSES אינו קיים בקוד השרת');
      t.ok(b, 'INVOICE_STATUSES אינו קיים ב-index.html');
      t.eq(a.replace(/\s+/g, ' '), b.replace(/\s+/g, ' '), '⛔⛔ INVOICE_STATUSES התפצל בין הקבצים');
    },

    '⛔⛔ ספר החיובים בממשק אינו חוזר להשוואה גולמית': (t, { H }) => {
      const ui = H.uiScript();
      const led = B77.noCmt(B77.body(ui, 'b54LedgerFE'));
      t.ok(led, 'b54LedgerFE נעלם מהממשק');
      t.has(led, 'w23InvActive', '⛔⛔ ספר החיובים בממשק אינו עובר דרך w23InvActive');
      t.hasNot(led, "v.status!=='בוטלה'", '⛔⛔ השוואת סטטוס חשבונית גולמית חזרה ל-b54LedgerFE');
      t.has(led, 'B54_SKIP_ORDER.indexOf(w22Stat(o))', '⛔ B76 נשבר בממשק');
      const code = H.stripComments(ui);
      /* ⭐ B78: החריגה של x הוסרה — deliveryTrips עברו ל-w24Stat, אין יותר חור */
      const bad = (code.match(/\b(?:v|iv|cv|inv|x)\.status\s*(?:===|!==)\s*'בוטלה'/g) || []);
      t.eq(bad.length, 0,
        '⛔⛔ נותרו ' + bad.length + ' השוואות סטטוס חשבונית גולמיות בממשק: ' + bad.join(' · '));
    },

    /* ⭐ דליפת WASH-22 שנמצאה באצווה הזו */
    '⭐ דליפת WASH-22: שער הליקוט עובר דרך w22Stat': (t, { H }) => {
      const code = H.stripComments(H.uiScript());
      const bad = (code.match(/B44_PICK_STATUSES\.(?:indexOf|includes)\(\s*\w+\.status\s*\)/g) || []);
      t.eq(bad.length, 0,
        '⛔⛔ שער הליקוט עדיין משווה o.status גולמי ב-' + bad.length + ' אתרים — הזמנה תקינה לא תלוקט');
      t.eq((code.match(/B44_PICK_STATUSES\.(?:indexOf|includes)\(w22Stat\(/g) || []).length, 4,
        '⛔ ארבעת אתרי שער הליקוט אינם עוברים דרך w22Stat');
    },

    '⭐ ליקוט אפשרי בהזמנה מאושרת עם סטטוס מלוכלך': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      ['מאושרת', 'מאושרת\u00A0', ' מאושרת', 'סופקה', 'סופקה '].forEach(st => {
        t.ok(w.B44_PICK_STATUSES.indexOf(w.w22Stat({ status: st })) > -1,
          '⛔⛔ שער הליקוט דחה סטטוס ' + JSON.stringify(st));
      });
      ['טיוטה', 'הצעת מחיר', 'בוטלה', 'הושלמה', 'סטטוס לא מוכר', ''].forEach(st => {
        t.eq(w.B44_PICK_STATUSES.indexOf(w.w22Stat({ status: st })) > -1, false,
          '⛔⛔ שער הליקוט רוכך וקיבל סטטוס ' + JSON.stringify(st));
      });
    },

    '⛔ שכבה 2 לא נגעה — WASH-23 אינו יכולת דפדפן': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const names = w.b61Tests().map(x => x.n).join(' | ');
      t.ok(names.indexOf('WASH-23') === -1, '⛔ נוספה טענה לשכבה 2 עבור WASH-23 — הוא נבדק בשכבה 1');
    },

    '⛔ canary v4.80-B80 בשני המקומות בממשק': (t, { H }) => {
      const s = H.indexSrc();
      t.eq((s.match(/v4\.80-B80/g) || []).length, 2,
        '⛔ ה-canary אינו מופיע בדיוק פעמיים (מסך כניסה + B61_CANARY)');
    }
  }
});


/* ============================================================
   B78 — WASH-23ב — ציר הסטטוס בארבע הטבלאות שנותרו
   payroll · tasks · purchases · delivery_trips
   ============================================================ */

const B78 = {
  /* ארבעה סוגי לכלוך שנצפו בגיליון: רווח קשיח, רווח מוביל,
     רווח נגרר, ותו כיווניות בלתי נראה. */
  dirty(v) { return [v + '\u00A0', ' ' + v, v + ' ', '\u200E' + v]; },
  UNKNOWN: ['', 'אושרה', 'טיוטא', 'שולם'],

  payDb(srv, status) {
    const db = H.emptyDb(srv);
    db.settings = [];
    db.employees = [{ id: 'E1', name: 'אברהם', active: 'כן', role: 'מכבסה', hourly_rate: 50 }];
    db.payroll = [{ id: 'PR1', employee_id: 'E1', month: '2026-07', hours: 100,
      hourly_rate: 50, base_pay: 5000, bonus: 0, bonus_note: '', total: 5000,
      status: status, pay_type: 'שעתי' }];
    db.payrollPayments = [];
    db.futureExpenses = [];
    return db;
  },
  taskDb(srv, status) {
    const db = H.emptyDb(srv);
    db.settings = [];
    db.employees = [{ id: 'E1', name: 'אברהם', active: 'כן', role: 'משרד' }];
    db.tasks = [{ id: 'TK1', title: 'לבדוק מלאי', assignee_id: 'E1',
      due_date: '2026-07-01', priority: 'רגילה', status: status,
      created_by: 'מנהל', created_at: '2026-07-01 08:00' }];
    db.taskComments = [];
    return db;
  },
  purDb(srv, status) {
    const db = H.emptyDb(srv);
    db.settings = [];
    db.suppliers = [{ id: 'SUP1', name: 'ספק א', active: 'כן' }];
    db.items = [{ id: 'IT1', name: 'מגבת', active: 'כן' }];
    db.purchases = [{ id: 'PU1', supplier_id: 'SUP1', date: '2026-08-01',
      status: status, notes: '', invoice_number: '', receipt_number: '',
      details: '', payment_mode: '', fexp_id: '' }];
    db.purchaseLines = [{ id: 'PL1', purchase_id: 'PU1', item_id: 'IT1', qty: 5, unit_cost: 10 }];
    db.stockMoves = [];
    return db;
  },
  tripDb(srv, status) {
    const db = H.emptyDb(srv);
    db.settings = [];
    db.employees = [{ id: 'DR1', name: 'נהג א', active: 'כן', role: 'נהג' },
                    { id: 'MG1', name: 'מנהל', active: 'כן', role: 'מנהל' }];
    db.deliveryTrips = [{ id: 'TRIP1', date: '2026-08-20', driver_id: 'DR1',
      vehicle_id: '', seq: 1, planned_time: '08:00', status: status,
      notes: '', created_at: '2026-08-19 10:00' }];
    db.deliveries = [];
    return db;
  },

  /* חתימת גוף פונקציה מקוד המקור, בלי הערות.
     ⚠ לקח B75/B76/B77: H.stripComments נתקע במצב מחרוזת בקוד השרת —
     חותכים בתוך הגוף שחולץ בלבד, לא על הקובץ כולו. */
  body(src, name) {
    const i = src.indexOf('function ' + name + '(');
    if (i === -1) return null;
    let d = 0, started = false;
    for (let j = i; j < src.length; j++) {
      if (src[j] === '{') { d++; started = true; }
      else if (src[j] === '}') { d--; if (started && d === 0) return src.slice(i, j + 1); }
    }
    return null;
  },
  noCmt(s) { return s ? s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '') : s; }
};

SPECS.push({
  file: 't24-b78-srv',
  title: 'B78 — WASH-23ב — ציר הסטטוס בשכר · משימות · רכש · נסיעות (שרת)',
  needs: 'server',
  requires: ['w24Stat', 'PAYROLL_STATUSES', 'TASK_STATUSES', 'PURCHASE_STATUSES',
             'TRIP_STATUSES', 'sVal', 'sPick', 'b67PayOneRow', 'b68PayrollFor',
             'syncFutureExpenseForPayroll', 'w22Stat', 'w23InvActive', 'handle'],

  tests: {

    /* ================= העוזר עצמו ================= */

    '⛔ w24Stat מנרמל ומחזיר את הערך הקנוני מהרשימה': (t, { srv }) => {
      B78.dirty('טיוטה').concat(['טיוטה']).forEach(st => {
        t.eq(srv.w24Stat({ status: st }, srv.PAYROLL_STATUSES, 'טיוטה'), 'טיוטה',
          '⛔ w24Stat לא ניקה את ' + JSON.stringify(st));
      });
      B78.dirty('הושלמה').forEach(st => {
        t.eq(srv.w24Stat({ status: st }, srv.TASK_STATUSES), 'הושלמה',
          '⛔ w24Stat לא ניקה משימה ' + JSON.stringify(st));
      });
      B78.dirty('בוטלה').forEach(st => {
        t.eq(srv.w24Stat({ status: st }, srv.TRIP_STATUSES), 'בוטלה',
          '⛔ w24Stat לא ניקה נסיעה ' + JSON.stringify(st));
      });
    },

    '⛔⛔ הכרעת אבי 2א: סטטוס שכר לא מוכר או ריק = טיוטה': (t, { srv }) => {
      B78.UNKNOWN.forEach(st => {
        t.eq(srv.w24Stat({ status: st }, srv.PAYROLL_STATUSES, 'טיוטה'), 'טיוטה',
          '⛔⛔ סטטוס שכר לא מוכר ' + JSON.stringify(st) + ' לא נחשב טיוטה — כסף עלול לצאת');
      });
      t.eq(srv.w24Stat(null, srv.PAYROLL_STATUSES, 'טיוטה'), 'טיוטה',
        '⛔ רשומת שכר חסרה לא נחשבה טיוטה');
    },

    '⛔ לשלוש הטבלאות האחרות אין dflt — הערך המנורמל חוזר כמות שהוא': (t, { srv }) => {
      [['TASK_STATUSES', 'משהו אחר'], ['PURCHASE_STATUSES', 'בוטל'], ['TRIP_STATUSES', 'נדחתה']]
        .forEach(([list, st]) => {
          t.eq(srv.w24Stat({ status: st + '\u00A0' }, srv[list]), st,
            '⛔ w24Stat מיפתה סטטוס לא מוכר לסטטוס מוכר ב-' + list);
        });
    },

    /* ================= ⛔⛔ הכסף: שער התשלום ================= */

    '⛔⛔ שכר בסטטוס טיוטה מלוכלך נשאר חסום לתשלום': (t, { srv }) => {
      B78.dirty('טיוטה').concat(['טיוטה']).forEach(st => {
        const db = B78.payDb(srv, st);
        const r = srv.b67PayOneRow(db, db.payroll[0], 1000, 'העברה', '', '2026-08-18', 'מנהל');
        t.eq(r.ok, false,
          '⛔⛔ יצא כסף על שכר בסטטוס טיוטה ' + JSON.stringify(st) + ' שלא אושר');
        t.eq(db.payrollPayments.length, 0, '⛔⛔ נרשמה שורת תשלום למרות שהשער נדחה');
      });
    },

    '⛔⛔ שכר בסטטוס לא מוכר חסום לתשלום (הכרעה 2א)': (t, { srv }) => {
      B78.UNKNOWN.forEach(st => {
        const db = B78.payDb(srv, st);
        const r = srv.b67PayOneRow(db, db.payroll[0], 1000, 'העברה', '', '2026-08-18', 'מנהל');
        t.eq(r.ok, false,
          '⛔⛔ יצא כסף על שכר בסטטוס לא מוכר ' + JSON.stringify(st));
      });
    },

    '⭐ שכר מאושר מלוכלך כן ניתן לתשלום — לא רככנו את השער לצד השני': (t, { srv }) => {
      B78.dirty('אושר').concat(['אושר']).forEach(st => {
        const db = B78.payDb(srv, st);
        const r = srv.b67PayOneRow(db, db.payroll[0], 1000, 'העברה', '', '2026-08-18', 'מנהל');
        t.eq(r.ok, true,
          '⛔ שכר מאושר עם סטטוס ' + JSON.stringify(st) + ' נחסם לתשלום — ' + (r && r.error));
      });
    },

    '⛔ שולם במלואו מלוכלך — אי אפשר להוסיף תוספת/ניכוי': (t, { srv }) => {
      B78.dirty('שולם במלואו').concat(['שולם במלואו']).forEach(st => {
        const db = B78.payDb(srv, st);
        const r = srv.handle('addPayrollAdjustment',
          { payroll_id: 'PR1', type: 'תוספת', amount: 100, category: 'בונוס' }, db, 'מנהל');
        t.eq(r.ok, false,
          '⛔ שונה שכר ששולם במלואו, סטטוס ' + JSON.stringify(st));
      });
    },

    '⛔ אישור שכר: טיוטה מלוכלכת עוברת, מאושר מלוכלך נדחה': (t, { srv }) => {
      B78.dirty('טיוטה').forEach(st => {
        const db = B78.payDb(srv, st);
        const r = srv.handle('approvePayroll', { payroll_id: 'PR1' }, db, 'מנהל');
        t.eq(r.ok, true, '⛔ טיוטה מלוכלכת ' + JSON.stringify(st) + ' לא ניתנה לאישור — ' + (r && r.error));
        t.eq(db.payroll[0].status, 'אושר', '⛔ הסטטוס לא נכתב כ־אושר');
      });
      B78.dirty('אושר').forEach(st => {
        const db = B78.payDb(srv, st);
        t.eq(srv.handle('approvePayroll', { payroll_id: 'PR1' }, db, 'מנהל').ok, false,
          '⛔ שכר שכבר אושר (' + JSON.stringify(st) + ') אושר פעמיים');
      });
    },

    /* ================= ⛔⛔ R6 — התזרים לא זז ================= */

    '⛔⛔ R6: יתרות הלקוחות זהות לפני ואחרי, על כל סטטוס שכר': (t, { srv }) => {
      const mk = (st) => {
        const db = B78.payDb(srv, st);
        db.customers = [{ id: 'C1', name: 'מלון הים', active: 'כן', credit_limit: 1000000 }];
        db.invoices = [{ id: 'IV1', number: '5001', order_id: '', customer_id: 'C1',
          date: '2026-08-01', subtotal: 1000, vat_rate: 18, vat: 180, total: 1180,
          status: 'פתוחה', type: 'חשבונית' }];
        return db;
      };
      ['אושר'].concat(B78.dirty('טיוטה')).concat(B78.UNKNOWN).forEach(st => {
        const db = mk(st);
        srv.b54Bump();
        const bal = srv.b48BalancesAg(db)['C1'] || 0;
        const used = srv.b2CreditUsedAg(db, 'C1');
        const open = srv.b54CustomerOpenAg(db)['C1'] || 0;
        srv.b54Bump();
        t.eq(bal, 118000, '⛔⛔ היתרה זזה בגלל סטטוס שכר ' + JSON.stringify(st));
        t.eq(bal, used, '⛔⛔ R6 נשבר: b48BalancesAg מול b2CreditUsedAg על ' + JSON.stringify(st));
        t.eq(bal, open, '⛔⛔ R6 נשבר: b48BalancesAg מול b54CustomerOpenAg על ' + JSON.stringify(st));
      });
    },

    '⛔⛔ מלכודת 4: הוצאה עתידית נוצרת רק לשכר שאינו טיוטה': (t, { srv }) => {
      /* ⛔ syncFutureExpenseForPayroll כותב להוצאות עתידיות והן בתזרים (B43).
         טיוטה — נקייה או מלוכלכת או לא מוכרת — אינה התחייבות (B67). */
      B78.dirty('טיוטה').concat(['טיוטה']).concat(B78.UNKNOWN).forEach(st => {
        const db = B78.payDb(srv, st);
        srv.handle('addPayrollAdjustment',
          { payroll_id: 'PR1', type: 'תוספת', amount: 100, category: 'בונוס' }, db, 'מנהל');
        t.eq((db.futureExpenses || []).length, 0,
          '⛔⛔ נוצרה הוצאה עתידית לטיוטה בסטטוס ' + JSON.stringify(st) + ' — התזרים זז');
      });
      B78.dirty('אושר').forEach(st => {
        const db = B78.payDb(srv, st);
        srv.handle('addPayrollAdjustment',
          { payroll_id: 'PR1', type: 'תוספת', amount: 100, category: 'בונוס' }, db, 'מנהל');
        t.eq((db.futureExpenses || []).length, 1,
          '⛔⛔ שכר מאושר מלוכלך ' + JSON.stringify(st) + ' לא נכנס לתזרים — התחייבות נעלמה');
      });
    },

    '⛔ b67EmployeeDebt: טיוטה מלוכלכת אינה חוב': (t, { srv }) => {
      B78.dirty('טיוטה').concat(B78.UNKNOWN).forEach(st => {
        t.eq(srv.b67EmployeeDebt(B78.payDb(srv, st), 'E1'), 0,
          '⛔ טיוטה בסטטוס ' + JSON.stringify(st) + ' נספרה כחוב לעובד');
      });
      t.eq(srv.b67EmployeeDebt(B78.payDb(srv, 'אושר\u00A0'), 'E1'), 5000,
        '⛔ שכר מאושר מלוכלך לא נספר כחוב');
    },

    /* ================= משימות ================= */

    '⛔ משימה הושלמה מלוכלכת אינה נחשבת פתוחה — סגירת תקלה': (t, { srv }) => {
      B78.dirty('הושלמה').concat(['הושלמה']).forEach(st => {
        const db = B78.taskDb(srv, st);
        db.assetFaults = [{ id: 'F1', asset_type: 'מכונה', asset_id: 'MACH-001',
          status: 'פתוחה', task_id: 'TK1', next_step: 'בדיקה', description: '' }];
        db.assets = []; db.machines = [{ id: 'MACH-001', status: 'פעילה', type: 'מכונה' }];
        db.assetFaultEvents = [];
        const before = db.tasks[0].status;
        srv.handle('b42CloseFault',
          { fault_id: 'F1', outcome: 'תוקן', note: 'הוחלף חלק' }, db, 'מנהל');
        t.eq(db.tasks[0].status, before,
          '⛔ משימה שכבר הושלמה (' + JSON.stringify(st) + ') נדרסה שוב');
      });
    },

    '⛔ moveTask מקבל סטטוס מלוכלך וכותב את הערך הקנוני': (t, { srv }) => {
      B78.dirty('הושלמה').forEach(st => {
        const db = B78.taskDb(srv, 'פתוחה');
        const r = srv.handle('moveTask', { task_id: 'TK1', status: st }, db, 'מנהל');
        t.eq(r.ok, true, '⛔ סטטוס משימה מלוכלך ' + JSON.stringify(st) + ' נדחה כלא חוקי');
        t.eq(db.tasks[0].status, 'הושלמה',
          '⛔⛔ נכתב לגיליון סטטוס מלוכלך חדש: ' + JSON.stringify(db.tasks[0].status));
      });
      t.eq(srv.handle('moveTask', { task_id: 'TK1', status: 'לא קיים' },
        B78.taskDb(srv, 'פתוחה'), 'מנהל').ok, false, '⛔ סטטוס משימה לא חוקי התקבל');
    },

    /* ================= רכש ================= */

    '⛔ רכש טיוטה מלוכלך עדיין מקבל שורות ועדיין ניתן לקליטה': (t, { srv }) => {
      B78.dirty('טיוטה').concat(['טיוטה']).forEach(st => {
        const db = B78.purDb(srv, st);
        const r = srv.handle('create',
          { table: 'purchase_lines', row: { purchase_id: 'PU1', item_id: 'IT1', qty: 3, unit_cost: 10 } },
          db, 'מנהל');
        t.eq(r.ok, true,
          '⛔ לא ניתן היה להוסיף שורה לרכש טיוטה בסטטוס ' + JSON.stringify(st) + ' — ' + (r && r.error));
      });
      B78.dirty('התקבלה').forEach(st => {
        const db = B78.purDb(srv, st);
        t.eq(srv.handle('create',
          { table: 'purchase_lines', row: { purchase_id: 'PU1', item_id: 'IT1', qty: 3, unit_cost: 10 } },
          db, 'מנהל').ok, false,
          '⛔⛔ נוספה שורה לרכש שכבר התקבל (' + JSON.stringify(st) + ') — המלאי ייקלט פעמיים');
      });
    },

    '⛔⛔ רכש שכבר התקבל מלוכלך אינו נקלט שוב למלאי': (t, { srv }) => {
      B78.dirty('התקבלה').forEach(st => {
        const db = B78.purDb(srv, st);
        const r = srv.handle('receivePurchase',
          { purchase_id: 'PU1', due_date: '2026-09-01', payment_mode: 'לתשלום בהמשך' }, db, 'מנהל');
        t.eq(r.ok, false,
          '⛔⛔ רכש בסטטוס ' + JSON.stringify(st) + ' נקלט פעמיים — מלאי כפול וחוב כפול לספק');
        t.eq((db.stockMoves || []).length, 0, '⛔⛔ נרשמה תנועת מלאי כפולה');
      });
    },

    /* ================= נסיעות ================= */

    '⛔ נסיעה בוטלה מלוכלכת אינה נספרת במספור הנסיעות': (t, { srv }) => {
      B78.dirty('בוטלה').concat(['בוטלה']).forEach(st => {
        const db = B78.tripDb(srv, st);
        const r = srv.b34TripCreate(db,
          { date: '2026-08-20', driver_id: 'DR1', planned_time: '10:00' }, 'מנהל');
        t.eq(r.ok, true, '⛔ יצירת נסיעה נכשלה — ' + (r && r.error));
        t.eq(r.trip.seq, 1,
          '⛔ נסיעה מבוטלת בסטטוס ' + JSON.stringify(st) + ' נספרה במספור — הנהג יראה נסיעה 2 בלי נסיעה 1');
      });
      const db2 = B78.tripDb(srv, 'מתוכננת');
      t.eq(srv.b34TripCreate(db2, { date: '2026-08-20', driver_id: 'DR1' }, 'מנהל').trip.seq, 2,
        '⛔ נסיעה פעילה לא נספרה במספור');
    },

    '⛔ b34TripSetStatus מקבל סטטוס מלוכלך וכותב את הערך הקנוני': (t, { srv }) => {
      B78.dirty('יצאה').forEach(st => {
        const db = B78.tripDb(srv, 'מתוכננת');
        const r = srv.b34TripSetStatus(db, { trip_id: 'TRIP1', status: st }, 'מנהל');
        t.eq(r.ok, true, '⛔ סטטוס נסיעה מלוכלך ' + JSON.stringify(st) + ' נדחה');
        t.eq(db.deliveryTrips[0].status, 'יצאה',
          '⛔⛔ נכתב לגיליון סטטוס נסיעה מלוכלך: ' + JSON.stringify(db.deliveryTrips[0].status));
      });
      t.eq(srv.b34TripSetStatus(B78.tripDb(srv, 'מתוכננת'),
        { trip_id: 'TRIP1', status: 'נדחתה' }, 'מנהל').ok, false,
        '⛔ סטטוס נסיעה לא חוקי התקבל');
    },

    /* ================= ⭐ דליפת WASH-22 שנמצאה באצווה הזו ================= */

    '⭐⭐ דליפת WASH-22: הזמנת טיוטה מלוכלכת כן מקבלת שורות פריטים': (t, { srv }) => {
      ['טיוטה', 'טיוטה\u00A0', ' טיוטה', 'הצעת מחיר\u00A0'].forEach(st => {
        const db = H.emptyDb(srv);
        db.settings = [];
        db.customers = [{ id: 'C1', name: 'מלון הים', active: 'כן', credit_limit: 1000000 }];
        db.items = [{ id: 'IT1', name: 'מגבת', active: 'כן', rent_price: 25 }];
        db.orders = [{ id: 'O1', order_number: '1001', customer_id: 'C1', type: 'השכרה',
          status: st, start_date: '2026-09-01', end_date: '2026-09-05', warehouse_id: '' }];
        db.orderLines = [];
        const r = srv.handle('create',
          { table: 'order_lines', row: { order_id: 'O1', item_id: 'IT1', qty: 5, unit_price: 25 } },
          db, 'מנהל');
        t.eq(r.ok, true,
          '⛔⛔ לא ניתן היה להוסיף שורת פריט להזמנה בסטטוס ' + JSON.stringify(st) + ' — ' + (r && r.error));
      });
    },

    /* ================= שומרי מקור ================= */

    '⛔⛔ אין יותר השוואת סטטוס גולמית בארבע הטבלאות (שרת)': (t, { H }) => {
      const sv = B78.noCmt(H.serverSrc());
      const bad = (sv.match(/\b(?:pr|pr2|prA|prV|prRow|keep|ex|tk|tkE|tC|pp|pu|po|tr|t)\.status\s*(?:===|!==)\s*'(?:טיוטה|אושר|שולם חלקית|שולם במלואו|פתוחה|בתהליך|הושלמה|התקבלה|מתוכננת|יצאה|הסתיימה|בוטלה)'/g) || []);
      t.eq(bad.length, 0,
        '⛔⛔ נותרו ' + bad.length + ' השוואות סטטוס גולמיות בשרת: ' + bad.join(' · '));
    },

    '⛔⛔ שערי השכר עוברים דרך w24Stat ולא דרך sVal חשוף': (t, { H }) => {
      const sv = H.serverSrc();
      const one = B78.noCmt(B78.body(sv, 'b67PayOneRow'));
      t.ok(one, 'b67PayOneRow נעלם מקוד השרת');
      t.has(one, "w24Stat(prRow, PAYROLL_STATUSES, 'טיוטה')",
        '⛔⛔ שער התשלום אינו עובר דרך w24Stat');
      t.hasNot(one, "sVal(prRow.status)",
        '⛔⛔ שער התשלום חזר להשוואת sVal חשופה');
      const dbt = B78.noCmt(B78.body(sv, 'b67EmployeeOpenRows'));
      t.ok(dbt, 'b67EmployeeOpenRows נעלם מקוד השרת');
      t.has(dbt, "w24Stat(pr, PAYROLL_STATUSES, 'טיוטה')",
        '⛔ חישוב החוב הפתוח של העובד אינו עובר דרך w24Stat');
      const sync = B78.noCmt(B78.body(sv, 'syncFutureExpenseForPayroll'));
      t.ok(sync, 'syncFutureExpenseForPayroll נעלם');
    },

    '⛔⛔ b67PayOneRow נשאר מסלול הכתיבה היחיד (B67 לא נשבר)': (t, { H }) => {
      const sv = H.serverSrc();
      t.eq((sv.match(/db\.payrollPayments\.push\(/g) || []).length, 1,
        '⛔⛔ נוצרה לוגיקת תשלום שכר שנייה');
      t.has(sv, 'B67_WRITE_DEFER', '⛔ B67_WRITE_DEFER נעלם');
    },

    '⛔ B76 · B77 לא נשברו — נקודות האמת הקודמות במקומן': (t, { srv, H }) => {
      const sv = H.serverSrc();
      t.has(sv, 'function w22Stat', '⛔ w22Stat נעלם');
      t.has(sv, 'function w23InvActive', '⛔ w23InvActive נעלם');
      t.eq(srv.w22Stat({ status: 'מאושרת\u00A0' }), 'מאושרת', '⛔ w22Stat נשבר');
      t.eq(srv.w23InvActive({ status: ' בוטלה' }), false, '⛔ w23InvActive נשבר');
      t.eq(srv.w21IsRental({ type: '' }), true, '⛔ w21IsRental נשבר');
    }
  }
});

SPECS.push({
  file: 't24-b78-ui',
  title: 'B78 — WASH-23ב — ציר הסטטוס בארבע הטבלאות בממשק: זהות תו-בתו · הסורק המורחב',
  needs: 'ui',
  requires: ['w24Stat', 'PAYROLL_STATUSES', 'TASK_STATUSES', 'PURCHASE_STATUSES',
             'TRIP_STATUSES', 'sVal', 'sPick', 'b67DraftRows', 'w22Stat', 'w23InvActive'],

  tests: {

    '⛔⛔ w24Stat וארבע הרשימות זהים תו-בתו בין הקבצים': (t, { H }) => {
      const sv = H.serverSrc(), ui = H.uiScript();
      const a = B78.body(sv, 'w24Stat'), b = B78.body(ui, 'w24Stat');
      t.ok(a && b, '⛔⛔ w24Stat חסר באחד הקבצים');
      t.eq(a.replace(/\s+/g, ' '), b.replace(/\s+/g, ' '),
        '⛔⛔ w24Stat התפצל בין הקבצים — שני צדדים יכריעו אחרת על אותה רשומה');
      ['PAYROLL_STATUSES', 'TASK_STATUSES', 'PURCHASE_STATUSES', 'TRIP_STATUSES'].forEach(v => {
        const re = new RegExp('var ' + v + '\\s*=[^;]*;');
        const x = (sv.match(re) || [])[0], y = (ui.match(re) || [])[0];
        t.ok(x && y, '⛔⛔ ' + v + ' חסר באחד הקבצים');
        t.eq(x.replace(/\s+/g, ' '), y.replace(/\s+/g, ' '), '⛔⛔ ' + v + ' התפצל בין הקבצים');
      });
    },

    '⛔⛔ הממשק מסכים עם השרת: טיוטה מלוכלכת אינה חוב': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      ['טיוטה', 'טיוטה\u00A0', ' טיוטה', '', 'אושרה'].forEach(st => {
        w.DB.employees = [{ id: 'E1', name: 'אברהם', active: 'כן', role: 'מכבסה' }];
        w.DB.payroll = [{ id: 'PR1', employee_id: 'E1', month: '2026-07', hours: 100,
          hourly_rate: 50, base_pay: 5000, total: 5000, status: st, pay_type: 'שעתי' }];
        w.DB.payrollPayments = [];
        t.eq(w.b67EmpDebt('E1'), 0,
          '⛔⛔ הממשק ספר טיוטה בסטטוס ' + JSON.stringify(st) + ' כחוב — סתירה מול השרת');
        t.eq(w.b67DraftRows().length, 1,
          '⛔ שורת הטיוטה ' + JSON.stringify(st) + ' לא הופיעה בסיכום הטיוטות');
      });
    },

    '⛔ הממשק: שכר מאושר מלוכלך כן נספר כחוב': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      w.DB.employees = [{ id: 'E1', name: 'אברהם', active: 'כן', role: 'מכבסה' }];
      w.DB.payroll = [{ id: 'PR1', employee_id: 'E1', month: '2026-07', hours: 100,
        hourly_rate: 50, base_pay: 5000, total: 5000, status: 'אושר\u00A0', pay_type: 'שעתי' }];
      w.DB.payrollPayments = [];
      t.eq(w.b67EmpDebt('E1'), 5000, '⛔ שכר מאושר מלוכלך לא נספר כחוב בממשק');
      t.eq(w.b67DraftRows().length, 0, '⛔ שכר מאושר הופיע כטיוטה');
    },

    '⛔ לוח המשימות: משימה הושלמה מלוכלכת יושבת בעמודה הנכונה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      ['הושלמה', 'הושלמה\u00A0', ' הושלמה', '\u200Eהושלמה'].forEach(st => {
        w.DB.tasks = [{ id: 'TK1', title: 'לבדוק מלאי', assignee_id: '',
          due_date: '2026-01-01', priority: 'רגילה', status: st }];
        w.DB.taskComments = [];
        w.go('tasks');
        const html = w.document.getElementById('app').innerHTML;
        t.hasNot(html, 'באיחור!',
          '⛔ משימה שהושלמה (' + JSON.stringify(st) + ') סומנה באיחור בלוח');
      });
    },

    '⛔ נסיעה בוטלה מלוכלכת אינה מוצגת בטבלת הנסיעות': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      ['בוטלה', 'בוטלה\u00A0', ' בוטלה', 'בוטלה '].forEach(st => {
        w.DB.deliveryTrips = [{ id: 'TRIP1', date: '2099-01-01', driver_id: 'DR1',
          seq: 1, planned_time: '08:00', status: st }];
        w.DB.employees = [{ id: 'DR1', name: 'נהג א', active: 'כן', role: 'נהג' }];
        w.DB.deliveries = [];
        t.eq(w.b34TripsTodayHtml(), '',
          '⛔ נסיעה מבוטלת בסטטוס ' + JSON.stringify(st) + ' הוצגה בטבלת הנסיעות');
      });
      w.DB.deliveryTrips = [{ id: 'TRIP1', date: '2099-01-01', driver_id: 'DR1',
        seq: 1, planned_time: '08:00', status: 'מתוכננת\u00A0' }];
      const h = w.b34TripsTodayHtml();
      t.ok(h.indexOf('TRIP1') > -1, '⛔ נסיעה מתוכננת מלוכלכת נעלמה מהטבלה');
      t.ok(h.indexOf("b34DoTripStatus('TRIP1','יצאה')") > -1,
        '⛔⛔ כפתור "יצאה" לא הופיע לנסיעה מתוכננת מלוכלכת — הנהג תקוע');
    },

    '⛔ רכש טיוטה מלוכלך: כפתורי השורה והקליטה מופיעים': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      ['טיוטה', 'טיוטה\u00A0', ' טיוטה'].forEach(st => {
        w.DB.suppliers = [{ id: 'SUP1', name: 'ספק א', active: 'כן' }];
        w.DB.purchases = [{ id: 'PU1', supplier_id: 'SUP1', date: '2026-08-01', status: st }];
        w.DB.purchaseLines = []; w.DB.items = [];
        w.go('purchasing');
        const html = w.document.getElementById('app').innerHTML;
        t.ok(html.indexOf("purLineForm('PU1')") > -1,
          '⛔ כפתור "+ שורה" נעלם ברכש טיוטה בסטטוס ' + JSON.stringify(st));
        t.ok(html.indexOf("doReceivePur('PU1')") > -1,
          '⛔⛔ כפתור "קבל למלאי" נעלם ברכש טיוטה בסטטוס ' + JSON.stringify(st));
      });
    },

    '⛔⛔ אין יותר השוואת סטטוס גולמית בארבע הטבלאות (ממשק)': (t, { H }) => {
      const ui = B78.noCmt(H.uiScript());
      /* ⚠ x מופיע גם על הצהרות תשלום בפורטל (x.status==='אושר') — שם
         מדובר ב-paymentDeclarations, טבלה שאינה בהיקף WASH-23ב. */
      const bad = (ui.match(/\b(?:p|t|tr|pu)\.status\s*(?:===|!==)\s*'(?:טיוטה|אושר|שולם חלקית|שולם במלואו|פתוחה|בתהליך|הושלמה|התקבלה|מתוכננת|יצאה|הסתיימה|בוטלה)'/g) || [])
        .concat(ui.match(/\bx\.status\s*(?:===|!==)\s*'(?:טיוטה|שולם במלואו|בתהליך|הושלמה|התקבלה|מתוכננת|יצאה|הסתיימה|בוטלה)'/g) || []);
      t.eq(bad.length, 0,
        '⛔⛔ נותרו ' + bad.length + ' השוואות סטטוס גולמיות בממשק: ' + bad.join(' · '));
    },

    '⛔ שכבה 2 לא נגעה — WASH-23ב אינו יכולת דפדפן': (t, { H }) => {
      const ui = H.uiScript();
      t.has(ui, 'function b61Tests', '⛔ כרטיס הבדיקה העצמית נעלם');
      const b61 = B78.noCmt(B78.body(ui, 'b61Tests'));
      t.ok(b61, 'b61Tests נעלם מהממשק');
      t.hasNot(b61, 'w24Stat',
        '⛔ נוספה טענת דפדפן ל-b61Tests — WASH-23ב הוא לוגיקת שרת/ממשק, לא יכולת דפדפן');
    },

    '⛔ canary v4.80-B80 בשני המקומות בממשק': (t, { H }) => {
      const s = H.indexSrc();
      t.eq((s.match(/v4\.80-B80/g) || []).length, 2,
        '⛔ ה-canary אינו מופיע בדיוק פעמיים (מסך כניסה + B61_CANARY)');
    }
  }
});


/* ============================================================================
   חלק t25 — B79 · WASH-23ג · ציר הסטטוס של המשלוחים
   ============================================================================
   B76 סגר את orders · B77 את invoices · B78 את payroll/tasks/purchases/
   deliveryTrips. כאן נסגרת הטבלה הכבדה שנותרה: deliveries.

   ⚠ R9 — הפריט נרשם ב-HANDOFF כ-32 אתרים; הקוד החי נתן ~60
   (19 בשרת · 41 בממשק). הסיבה: לא שלוש צורות השוואה אלא **חמש** —
   B5_OPEN_STATUSES · B38_OPEN_DELIV · B49E_LIVE_DELIV · ליטרל
   ['מתוכנן','בדרך'] · ומשתני OPEN/OPEN_ST מקומיים.

   ⛔⛔ הכרעת אבי 2ב (18.08.2026): סטטוס משלוח לא מוכר או ריק = 'מתוכנן',
   כלומר **פתוח**. זה ההפך מהמצב הקודם (לא-מוכר נחשב סגור), ולכן
   הבדיקות כאן מודדות שינוי התנהגות אמיתי ולא טאוטולוגיה.
   ============================================================================ */

const B79 = {
  dirty(v) { return [v + '\u00A0', ' ' + v, v + ' ', '\u200E' + v]; },
  /* ⛔ ערכים שאינם ברשימה כלל — עליהם חלה הכרעת 2ב.
     ⚠ 'התקבלה' אינו כאן בכוונה: הוא כן ברשימה, כסטטוס סגור. */
  UNKNOWN: ['', 'נמסר', 'מתוכננת', 'בוצעה', 'סגור'],

  dlvDb(srv, status, over) {
    const db = H.emptyDb(srv);
    db.settings = [];
    db.employees = [{ id: 'DR1', name: 'נהג א', active: 'כן', role: 'נהג' },
                    { id: 'MG1', name: 'מנהל', active: 'כן', role: 'מנהל' }];
    db.customers = [{ id: 'C1', name: 'לקוח א', active: 'כן' }];
    db.orders = [{ id: 'O1', customer_id: 'C1', status: 'מאושרת', type: 'השכרה',
      start_date: '2026-08-01', end_date: '2026-08-30', total: 1000 }];
    db.orderLines = [];
    db.deliveries = [Object.assign({ id: 'D1', order_id: 'O1', kind: 'אספקה',
      date: '2026-08-18', driver: 'נהג א', status: status, note: '',
      note_number: '', vehicle_id: '', photo_url: '', route_order: 1,
      eta_text: '', signature_url: '', trip_id: '', scan_status: '' }, over || {})];
    return db;
  },

  body(src, name) {
    const i = src.indexOf('function ' + name + '(');
    if (i === -1) return null;
    let d = 0, started = false;
    for (let j = i; j < src.length; j++) {
      if (src[j] === '{') { d++; started = true; }
      else if (src[j] === '}') { d--; if (started && d === 0) return src.slice(i, j + 1); }
    }
    return null;
  },
  noCmt(s) { return s ? s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '') : s; }
};

SPECS.push({
  file: 't25-b79-srv',
  title: 'B79 — WASH-23ג — ציר הסטטוס של המשלוחים (שרת)',
  needs: 'server',
  requires: ['w24Stat', 'DELIVERY_STATUSES', 'DELIVERY_DFLT', 'B5_OPEN_STATUSES',
             'B38_OPEN_DELIV', 'B49E_LIVE_DELIV', 'b5MarkInTransit', 'b5RemoveFromRoute',
             'b5DriverOpenDeliveries', 'b49eLiveDeliv', 'sVal', 'sPick',
             'w22Stat', 'w23InvActive', 'handle'],

  tests: {

    /* ================= העוזר והרשימה ================= */

    '⛔ w24Stat מנרמל את חמשת סטטוסי המשלוח לערך הקנוני': (t, { srv }) => {
      ['מתוכנן', 'בדרך', 'בוצע', 'בוטל', 'הוסר ממסלול'].forEach(st => {
        B79.dirty(st).concat([st]).forEach(v => {
          t.eq(srv.w24Stat({ status: v }, srv.DELIVERY_STATUSES, srv.DELIVERY_DFLT), st,
            '⛔ w24Stat לא ניקה סטטוס משלוח ' + JSON.stringify(v));
        });
      });
    },

    '⛔⛔ הכרעת אבי 2ב: סטטוס משלוח לא מוכר או ריק = מתוכנן (פתוח)': (t, { srv }) => {
      B79.UNKNOWN.forEach(st => {
        t.eq(srv.w24Stat({ status: st }, srv.DELIVERY_STATUSES, srv.DELIVERY_DFLT), 'מתוכנן',
          '⛔⛔ סטטוס משלוח לא מוכר ' + JSON.stringify(st) + ' לא נחשב פתוח — סחורה עלולה להיעלם בשקט');
        t.ok(srv.B5_OPEN_STATUSES.indexOf(
          srv.w24Stat({ status: st }, srv.DELIVERY_STATUSES, srv.DELIVERY_DFLT)) > -1,
          '⛔⛔ משלוח בסטטוס ' + JSON.stringify(st) + ' אינו נספר כפתוח');
      });
      t.eq(srv.w24Stat(null, srv.DELIVERY_STATUSES, srv.DELIVERY_DFLT), 'מתוכנן',
        '⛔ רשומת משלוח חסרה לא נחשבה פתוחה');
    },

    '⛔⛔ התקבלה נשאר סטטוס מוכר וסגור — אין רגרסיה על נתונים ותיקים': (t, { srv }) => {
      B79.dirty('התקבלה').concat(['התקבלה']).forEach(st => {
        t.eq(srv.w24Stat({ status: st }, srv.DELIVERY_STATUSES, srv.DELIVERY_DFLT), 'התקבלה',
          '⛔⛔ התקבלה נפל ל-dflt ונפתח מחדש — סטטוס ' + JSON.stringify(st));
        t.eq(srv.B5_OPEN_STATUSES.indexOf(
          srv.w24Stat({ status: st }, srv.DELIVERY_STATUSES, srv.DELIVERY_DFLT)), -1,
          '⛔⛔ משלוח בסטטוס התקבלה נחשב פתוח — משלוחים ישנים חזרו למסלול');
      });
    },

    '⛔ שלוש רשימות הסטטוס לא שינו ערך': (t, { srv }) => {
      t.eq(srv.B5_OPEN_STATUSES.join('|'), 'מתוכנן|בדרך', '⛔ B5_OPEN_STATUSES שונתה');
      t.eq(srv.B38_OPEN_DELIV.join('|'), 'מתוכנן|בדרך', '⛔ B38_OPEN_DELIV שונתה');
      t.eq(srv.B49E_LIVE_DELIV.join('|'), 'מתוכנן|בדרך|בוצע', '⛔ B49E_LIVE_DELIV שונתה');
      t.eq(srv.DELIVERY_DFLT, 'מתוכנן', '⛔⛔ ברירת המחדל שונתה — הכרעת אבי 2ב נשברה');
    },

    /* ================= ⛔⛔ מסלול הנהג ================= */

    '⛔⛔ משלוח בסטטוס מלוכלך נשאר במסלול הנהג': (t, { srv }) => {
      B79.dirty('מתוכנן').concat(B79.dirty('בדרך')).forEach(st => {
        const db = B79.dlvDb(srv, st);
        t.eq(srv.b5DriverOpenDeliveries(db, 'נהג א').length, 1,
          '⛔⛔ משלוח בסטטוס ' + JSON.stringify(st) + ' נעלם ממסלול הנהג');
      });
    },

    '⛔⛔ משלוח בסטטוס לא מוכר נכנס למסלול הנהג (הכרעה 2ב)': (t, { srv }) => {
      B79.UNKNOWN.forEach(st => {
        const db = B79.dlvDb(srv, st);
        t.eq(srv.b5DriverOpenDeliveries(db, 'נהג א').length, 1,
          '⛔⛔ משלוח בסטטוס ' + JSON.stringify(st) + ' לא הוצג לנהג — סחורה שלא הגיעה ואיש אינו יודע');
      });
    },

    '⛔ משלוח סגור מלוכלך אינו במסלול — לא רככנו לצד השני': (t, { srv }) => {
      B79.dirty('בוצע').concat(B79.dirty('בוטל'), B79.dirty('התקבלה'),
        ['בוצע', 'בוטל', 'הוסר ממסלול']).forEach(st => {
        const db = B79.dlvDb(srv, st);
        t.eq(srv.b5DriverOpenDeliveries(db, 'נהג א').length, 0,
          '⛔ משלוח סגור בסטטוס ' + JSON.stringify(st) + ' חזר למסלול הנהג');
      });
    },

    '⛔⛔ יצאתי לדרך עובד על סטטוס מלוכלך ועל סטטוס לא מוכר': (t, { srv }) => {
      B79.dirty('מתוכנן').concat(B79.UNKNOWN).forEach(st => {
        const db = B79.dlvDb(srv, st);
        const r = srv.b5MarkInTransit(db, { delivery_id: 'D1' }, 'נהג א');
        t.eq(r.ok, true,
          '⛔⛔ הנהג לא יכול לצאת לדרך על סטטוס ' + JSON.stringify(st) + ' — ' + (r && r.error));
        t.eq(db.deliveries[0].status, 'בדרך', '⛔ הסטטוס לא נכתב כ־בדרך');
      });
    },

    '⛔ יצאתי לדרך נדחה על משלוח סגור — השער לא רוכך': (t, { srv }) => {
      B79.dirty('בוצע').concat(['בוצע', 'בוטל', 'התקבלה']).forEach(st => {
        const db = B79.dlvDb(srv, st);
        t.eq(srv.b5MarkInTransit(db, { delivery_id: 'D1' }, 'נהג א').ok, false,
          '⛔ משלוח סגור (' + JSON.stringify(st) + ') סומן בדרך');
      });
    },

    '⛔ הסרה ממסלול עובדת על סטטוס מלוכלך': (t, { srv }) => {
      B79.dirty('מתוכנן').forEach(st => {
        const db = B79.dlvDb(srv, st);
        const r = srv.b5RemoveFromRoute(db, { delivery_id: 'D1', reason: 'הלקוח סגור' }, 'נהג א');
        t.eq(r.ok, true, '⛔ הסרה ממסלול נכשלה על ' + JSON.stringify(st) + ' — ' + (r && r.error));
        t.eq(db.deliveries[0].status, 'הוסר ממסלול', '⛔ הסטטוס לא נכתב');
      });
    },

    '⛔ הוסר ממסלול מלוכלך מזוהה באישור ההנהלה': (t, { srv }) => {
      B79.dirty('הוסר ממסלול').concat(['הוסר ממסלול']).forEach(st => {
        const db = B79.dlvDb(srv, st, { removal_ack: '' });
        const r = srv.handle('b5AckRemoval', { delivery_id: 'D1' }, db, 'מנהל');
        t.ne(r.error, 'המשלוח אינו במצב "הוסר ממסלול"',
          '⛔ אישור ההסרה נדחה על סטטוס מלוכלך ' + JSON.stringify(st));
      });
    },

    /* ================= ⛔⛔ שער המסירה — כאן נמצא המחיר ================= */

    '⛔⛔ משלוח פתוח מלוכלך בלי חתימה חוסם סימון כסופקה': (t, { srv }) => {
      B79.dirty('מתוכנן').concat(B79.UNKNOWN).forEach(st => {
        const db = B79.dlvDb(srv, st, { signature_url: '', photo_url: '' });
        const r = srv.handle('deliverOrder',
          { order_id: 'O1', _verified_role: 'מנהל' }, db, 'מנהל');
        t.eq(r.ok, false,
          '⛔⛔ הזמנה סומנה כסופקה למרות משלוח פתוח (' + JSON.stringify(st) + ') בלי הוכחת מסירה');
      });
    },

    '⭐ אותו משלוח עם חתימה — נסגר ומקבל מספר תעודה': (t, { srv }) => {
      B79.dirty('מתוכנן').concat(B79.UNKNOWN).forEach(st => {
        const db = B79.dlvDb(srv, st, { signature_url: 'sig' });
        const r = srv.handle('deliverOrder',
          { order_id: 'O1', _verified_role: 'מנהל' }, db, 'מנהל');
        t.eq(r.ok, true, '⛔ מסירה נכשלה על ' + JSON.stringify(st) + ' — ' + (r && r.error));
        t.eq(db.deliveries[0].status, 'בוצע',
          '⛔⛔ המשלוח בסטטוס ' + JSON.stringify(st) + ' לא נסגר — יישאר פתוח לנצח');
        t.ok(db.deliveries[0].note_number, '⛔ לא הופק מספר תעודת משלוח');
      });
    },

    '⛔ פיצול משלוח מותר על מתוכנן מלוכלך ונדחה על בדרך': (t, { srv }) => {
      B79.dirty('מתוכנן').forEach(st => {
        const db = B79.dlvDb(srv, st);
        const r = srv.handle('splitDelivery',
          { delivery_id: 'D1', driver: 'נהג א' }, db, 'מנהל');
        t.ne(r.error, 'ניתן לפצל רק משלוח בסטטוס מתוכנן',
          '⛔ פיצול נדחה על מתוכנן מלוכלך ' + JSON.stringify(st));
      });
      const db2 = B79.dlvDb(srv, 'בדרך\u00A0');
      t.eq(srv.handle('splitDelivery', { delivery_id: 'D1', driver: 'נהג א' }, db2, 'מנהל').error,
        'ניתן לפצל רק משלוח בסטטוס מתוכנן',
        '⛔ פוצל משלוח שכבר בדרך — השער רוכך');
    },

    '⛔ b49eLiveDeliv מזהה משלוח חי מלוכלך': (t, { srv }) => {
      B79.dirty('בוצע').concat(B79.dirty('מתוכנן'), B79.UNKNOWN).forEach(st => {
        t.eq(srv.b49eLiveDeliv({ status: st }), true,
          '⛔ משלוח חי בסטטוס ' + JSON.stringify(st) + ' נחשב מת — b49e יבנה רגל כפולה');
      });
      t.eq(srv.b49eLiveDeliv({ status: 'בוטל\u00A0' }), false,
        '⛔ משלוח מבוטל מלוכלך נחשב חי');
    },

    /* ================= ⛔⛔ R6 — הכסף לא זז ================= */

    '⛔⛔ R6: שלושת מקורות הכסף מחזירים אותו מספר בכל סטטוס משלוח': (t, { srv }) => {
      const bal = st => {
        const db = B79.dlvDb(srv, st, { signature_url: 'sig' });
        db.invoices = [{ id: 'IV1', order_id: 'O1', customer_id: 'C1',
          date: '2026-08-01', subtotal: 1000, vat: 180, total: 1180, status: 'פתוחה' }];
        db.payments = [];
        return { a: srv.b48BalancesAg(db)['C1'] || 0, b: srv.b2CreditUsedAg(db, 'C1') };
      };
      const base = bal('מתוכנן');
      t.eq(base.a, base.b, '⛔⛔ R6 נשבר על סטטוס נקי');
      t.eq(base.a, 118000, '⛔ קו הבסיס השתנה — היתרה אינה ברוטו 118000');
      B79.dirty('מתוכנן').concat(B79.dirty('בוצע'), B79.UNKNOWN, ['התקבלה']).forEach(st => {
        const r = bal(st);
        t.eq(r.a, r.b, '⛔⛔ R6 נשבר על סטטוס משלוח ' + JSON.stringify(st));
        t.eq(r.a, base.a,
          '⛔⛔ היתרה זזה בגלל סטטוס משלוח ' + JSON.stringify(st) + ' — משלוח אינו מקור כסף');
      });
    },

    /* ================= סורק המקור ================= */

    '⛔⛔ אין יותר השוואת סטטוס משלוח גולמית בקוד השרת': (t, { H }) => {
      const sv = B79.noCmt(H.serverSrc());
      const bad = (sv.match(
        /\b(?:d|dlv|dvSpec|spDv|oPick|dlvChk|d49f)\.status\s*(?:===|!==)\s*'(?:מתוכנן|בדרך|בוצע|בוטל|הוסר ממסלול|התקבלה)'/g) || [])
        .concat(sv.match(
          /(?:B5_OPEN_STATUSES|B38_OPEN_DELIV|B49E_LIVE_DELIV)\.indexOf\(\s*(?:String\()?\s*\w+\.status/g) || []);
      t.eq(bad.length, 0,
        '⛔⛔ נותרו ' + bad.length + ' השוואות סטטוס משלוח גולמיות בשרת: ' + bad.join(' · '));
    },

    '⛔ כל קריאה עם DELIVERY_STATUSES מעבירה גם את ברירת המחדל': (t, { H }) => {
      [['השרת', H.serverSrc()], ['הממשק', H.uiScript()]].forEach(([who, src]) => {
        const calls = src.match(/w24Stat\([^)]*DELIVERY_STATUSES[^)]*\)/g) || [];
        t.ok(calls.length > 15, '⛔ ' + who + ': נמצאו רק ' + calls.length + ' קריאות — הסורק אינו מודד');
        const bad = calls.filter(c => c.indexOf('DELIVERY_DFLT') === -1);
        t.eq(bad.length, 0,
          '⛔⛔ ' + who + ': ' + bad.length + ' קריאות בלי DELIVERY_DFLT — הכרעת 2ב לא תחול שם: ' + bad.join(' · '));
      });
    }
  }
});

SPECS.push({
  file: 't25-b79-ui',
  title: 'B79 — WASH-23ג — ציר הסטטוס של המשלוחים (ממשק): זהות תו-בתו · איחוד הרשימות',
  needs: 'ui',
  requires: ['w24Stat', 'DELIVERY_STATUSES', 'DELIVERY_DFLT', 'B5_OPEN_STATUSES',
             'b5MyRoute', 'b5DoneToday', 'openDelivery', 'rDeliveries', 'w22Stat'],

  tests: {

    '⛔⛔ DELIVERY_STATUSES ו-DELIVERY_DFLT זהים תו-בתו בין הקבצים': (t, { H }) => {
      const sv = H.serverSrc(), ui = H.uiScript();
      ['DELIVERY_STATUSES', 'DELIVERY_DFLT'].forEach(v => {
        const re = new RegExp('var\\s+' + v + '\\s*=[^;]*;');
        const a = (sv.match(re) || [])[0], b = (ui.match(re) || [])[0];
        t.ok(a, '⛔⛔ ' + v + ' חסר בקוד השרת');
        t.ok(b, '⛔⛔ ' + v + ' חסר ב-index.html');
        t.eq(a.replace(/\s+/g, ' '), b.replace(/\s+/g, ' '),
          '⛔⛔ ' + v + ' התפצל בין הקבצים — הממשק והשרת יסווגו משלוח אחרת');
      });
    },

    '⛔⛔ הממשק מסכים עם השרת על כל סטטוס משלוח': (t, { w, srv }) => {
      ['מתוכנן', 'בדרך', 'בוצע', 'בוטל', 'הוסר ממסלול', 'התקבלה']
        .reduce((acc, st) => acc.concat(B79.dirty(st), [st]), [])
        .concat(B79.UNKNOWN).forEach(st => {
          t.eq(w.w24Stat({ status: st }, w.DELIVERY_STATUSES, w.DELIVERY_DFLT),
               srv.w24Stat({ status: st }, srv.DELIVERY_STATUSES, srv.DELIVERY_DFLT),
            '⛔⛔ הממשק והשרת נחלקו על סטטוס משלוח ' + JSON.stringify(st));
        });
    },

    '⛔⛔ מסלול הנהג בממשק: מלוכלך ולא-מוכר נשארים, סגור יורד': (t, { w, srv, H }) => {
      H.login(w, 'נהג', srv, { user: 'נהג א' });
      const set = st => {
        w.DB.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'אספקה',
          date: w.todayYMD(), driver: 'נהג א', status: st, route_order: 1 }];
        w.DB.orders = [{ id: 'O1', customer_id: 'C1', status: 'מאושרת', type: 'השכרה' }];
        w.DB.customers = [{ id: 'C1', name: 'לקוח א' }];
      };
      B79.dirty('מתוכנן').concat(B79.dirty('בדרך'), B79.UNKNOWN).forEach(st => {
        set(st);
        t.eq(w.b5MyRoute().length, 1,
          '⛔⛔ משלוח בסטטוס ' + JSON.stringify(st) + ' נעלם ממסלול הנהג בממשק');
        t.eq(w.b5DoneToday().length, 0,
          '⛔ משלוח פתוח בסטטוס ' + JSON.stringify(st) + ' הופיע כ"בוצע היום"');
      });
      B79.dirty('בוצע').concat(['בוצע', 'התקבלה', 'בוטל']).forEach(st => {
        set(st);
        t.eq(w.b5MyRoute().length, 0,
          '⛔ משלוח סגור בסטטוס ' + JSON.stringify(st) + ' נשאר במסלול');
        t.eq(w.b5DoneToday().length, 1,
          '⛔⛔ משלוח סגור בסטטוס ' + JSON.stringify(st) + ' לא הופיע ב"בוצעו היום" — קדימות אופרטורים');
      });
    },

    '⛔ מסך המשלוחים: מלוכלך בפתוחות, סגור בהיסטוריה': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const render = st => {
        w.DB.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'אספקה',
          date: '2026-08-18', driver: 'נהג א', status: st }];
        w.DB.orders = [{ id: 'O1', customer_id: 'C1', status: 'מאושרת', type: 'השכרה' }];
        w.DB.customers = [{ id: 'C1', name: 'לקוח א' }];
        w.DELIV_TAB = 'open';
        w.go('deliveries');
        return w.document.getElementById('app').innerHTML;
      };
      B79.dirty('מתוכנן').concat(B79.UNKNOWN).forEach(st => {
        t.has(render(st), 'אספקות פתוחות</h3><span class="muted">1',
          '⛔ משלוח בסטטוס ' + JSON.stringify(st) + ' לא נספר כאספקה פתוחה');
      });
      B79.dirty('בוצע').concat(['התקבלה']).forEach(st => {
        t.has(render(st), 'אספקות פתוחות</h3><span class="muted">0',
          '⛔ משלוח סגור בסטטוס ' + JSON.stringify(st) + ' נספר כפתוח');
      });
    },

    '⛔ כרטיס המשלוח: כפתורי מתוכנן מופיעים על סטטוס מלוכלך': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      B79.dirty('מתוכנן').concat(B79.UNKNOWN).forEach(st => {
        w.DB.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'אספקה',
          date: '2026-08-18', driver: '', status: st, note_number: 'NT1' }];
        w.DB.orders = [{ id: 'O1', customer_id: 'C1', status: 'מאושרת', type: 'השכרה' }];
        w.DB.customers = [{ id: 'C1', name: 'לקוח א' }];
        w.DB.orderLines = [];
        w.openDelivery('D1');
        const html = w.document.getElementById('modal').innerHTML;
        t.has(html, 'שבץ נהג ורכב',
          '⛔ הפעולה הראשית של משלוח מתוכנן נעלמה על סטטוס ' + JSON.stringify(st));
        t.has(html, 'פצל משלוח בין נהגים',
          '⛔ פיצול המשלוח נעלם על סטטוס ' + JSON.stringify(st));
        t.hasNot(html, 'שנה נהג ורכב',
          '⛔ המשלוח בסטטוס ' + JSON.stringify(st) + ' נחשב לא-מתוכנן');
      });
    },

    '⛔ הפורטל: משלוח בדרך מלוכלך מציג את שורת הנהג': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      B79.dirty('בדרך').concat(['בדרך']).forEach(st => {
        const html = w.portalOrderRow({ id: 'O1', status: 'מאושרת', type: 'השכרה',
          start_date: '2026-08-01', end_date: '2026-08-30', total: 1000,
          delivery: { status: st, eta_text: 'עצירה 2 מתוך 4',
            driver_name: 'נהג א', driver_phone: '0500000000' } });
        t.has(html, 'צור קשר עם הנהג',
          '⛔ הפורטל לא הציג את הנהג על סטטוס ' + JSON.stringify(st));
      });
    },

    '⛔⛔ אין יותר השוואת סטטוס משלוח גולמית בממשק': (t, { H }) => {
      const ui = B79.noCmt(H.uiScript());
      const bad = (ui.match(
        /\b(?:d|dSt2|dlv|o\.delivery)\.status\s*(?:===|!==)\s*'(?:מתוכנן|בדרך|בוצע|בוטל|הוסר ממסלול|התקבלה)'/g) || [])
        .concat(ui.match(/B5_OPEN_STATUSES\.(?:includes|indexOf)\(\s*(?:String\(|sVal\()?\s*\w+\.status/g) || [])
        .concat(ui.match(/(?<!=\s)\[\s*'מתוכנן'\s*,\s*'בדרך'\s*\]/g) || []);
      t.eq(bad.length, 0,
        '⛔⛔ נותרו ' + bad.length + ' אתרים גולמיים בממשק: ' + bad.join(' · '));
    },

    '⛔ שלוש הרשימות הכפולות אוחדו — אין רשימת סטטוס משלוח רביעית': (t, { w, H }) => {
      const ui = B79.noCmt(H.uiScript());
      t.eq((ui.match(/=\s*\[\s*'מתוכנן'\s*,\s*'בדרך'\s*\]/g) || []).length, 1,
        '⛔ יש יותר מהגדרה אחת של רשימת המשלוחים הפתוחים — הכפילות חזרה');
      t.eq(w.B5_OPEN_STATUSES.join('|'), 'מתוכנן|בדרך', '⛔ B5_OPEN_STATUSES בממשק שונתה');
      t.eq(w.DELIVERY_DFLT, 'מתוכנן', '⛔⛔ ברירת המחדל בממשק שונתה — הכרעת 2ב נשברה');
    },

    '⛔ שכבה 2 לא נגעה — WASH-23ג אינו יכולת דפדפן': (t, { H }) => {
      const b61 = B79.noCmt(B79.body(H.uiScript(), 'b61Tests'));
      t.ok(b61, 'b61Tests נעלם מהממשק');
      t.hasNot(b61, 'DELIVERY_STATUSES',
        '⛔ נוספה טענת דפדפן ל-b61Tests — WASH-23ג הוא לוגיקת שרת/ממשק');
    }
  }
});

/* ==================================================================
   B80 — WASH-23ג חלק ב' — ציר הסטטוס בטבלאות הכסף ובשערי הציוד
   charges · payments · paymentDeclarations · futureExpenses ·
   creditProfiles · vehicles · machines  (+ דליפה אחת מ-B79)
   ⛔⛔ שתי הטבלאות הראשונות הן ספר החיובים עצמו — R6 מלא.
   ⛔ מלכודת 4 (קדימות אופרטורים): לכל תנאי שהופך יש בדיקה על **שני**
   הצדדים — גם שהמלוכלך נכנס, וגם שהסגור/החסום לא רוכך.
   ================================================================== */
const B80 = {
  dirty(v) { return [v + '\u00A0', ' ' + v, v + ' ', '\u200E' + v]; },
  /* ערכים שאינם באף רשימה — עליהם חלות הכרעות 2א/3א */
  UNKNOWN: ['שולמה', 'פעילה מאוד', 'לא ידוע', 'closed'],

  /* לקוח אחד, הזמנה אחת, חיוב אחד — בסיס למדידות R6 */
  moneyDb(srv, over) {
    over = over || {};
    const db = H.emptyDb(srv);
    db.settings = [];
    db.employees = [{ id: 'MG1', name: 'מנהל', active: 'כן', role: 'מנהל' }];
    db.customers = [{ id: 'C1', name: 'לקוח א', active: 'כן' }];
    db.orders = [];
    db.orderLines = [];
    db.invoices = [];
    db.charges = [Object.assign({
      id: 'CH1', customer_id: 'C1', source: 'כללי', date: '2026-08-01',
      amount: 1000, description: 'חיוב בדיקה', order_id: '', intake_id: '',
      invoice_id: '', status: 'פתוח'
    }, over.charge || {})];
    db.payments = (over.payments || []);
    return db;
  },

  /* שלושת מקורות הכסף (R6) — השרת בלבד; הממשק נמדד בחלק ה-ui */
  bal(srv, db) {
    srv.b54Bump();
    const a = srv.b48BalancesAg(db)['C1'] || 0;
    srv.b54Bump();
    const b = srv.b2CreditUsedAg(db, 'C1');
    return { a: a, b: b };
  },

  /* תשלום נזקף רק למכולה (הזמנה/חשבונית) — חיוב חופשי לעולם אינו מקבל
     תשלום. לכן מדידת ציר התשלומים חייבת חשבונית פעילה. */
  payDb(srv, payStatus) {
    const db = B80.moneyDb(srv, { charge: { invoice_id: 'IV1' } });
    db.invoices = [{ id: 'IV1', number: '1001', order_id: '', customer_id: 'C1',
      date: '2026-08-01', subtotal: 1000, vat: 0, total: 1000, status: 'פתוחה' }];
    db.payments = payStatus === null ? [] : [{
      id: 'PY1', order_id: '', invoice_id: 'IV1', receipt_number: 'R1',
      date: '2026-08-05', amount: 400, method: 'מזומן', note: '',
      customer_id: 'C1', type: 'תשלום חשבונית', status: payStatus, txn_id: 'T1'
    }];
    return db;
  },

  fexpDb(srv, status) {
    const db = H.emptyDb(srv);
    db.settings = [];
    db.employees = [{ id: 'MG1', name: 'מנהל', active: 'כן', role: 'מנהל' }];
    db.suppliers = [];
    db.futureExpenses = [{
      id: 'FE1', source: 'ידני', ref_id: '', employee_id: '', category: 'כללי',
      description: 'הוצאה', amount: 500, due_date: '2026-09-01', urgency: 'רגיל',
      status: status, created_at: '2026-08-01 10:00', supplier_id: '',
      vat_amount: 0, deleted: ''
    }];
    return db;
  },

  declDb(srv, status) {
    const db = H.emptyDb(srv);
    db.settings = [];
    db.employees = [{ id: 'MG1', name: 'מנהל', active: 'כן', role: 'מנהל' }];
    db.customers = [{ id: 'C1', name: 'לקוח א', active: 'כן' }];
    db.paymentDeclarations = [{
      id: 'PD1', customer_id: 'C1', source: 'פורטל', method_intent: 'העברה בנקאית',
      declared_amount: 300, confirmed_amount: '', asmachta_url: '', note: '',
      status: status, txn_id: 'PTXN1', receipt_number: '', reason: '',
      check_number: '', check_bank: '', check_due: '',
      created_by: 'פורטל: לקוח א', created_at: '2026-08-10 09:00',
      decided_by: '', decided_at: ''
    }];
    return db;
  },

  vehDb(srv, status) {
    const db = H.emptyDb(srv);
    db.settings = [];
    db.employees = [{ id: 'DR1', name: 'נהג א', active: 'כן', role: 'נהג' },
                    { id: 'MG1', name: 'מנהל', active: 'כן', role: 'מנהל' }];
    db.vehicles = [{ id: 'V1', plate: '11-111-11', status: status, active: 'כן' }];
    db.deliveryTrips = [];
    return db;
  },

  body(src, name) {
    const i = src.indexOf('function ' + name + '(');
    if (i === -1) return null;
    let d = 0, started = false;
    for (let j = i; j < src.length; j++) {
      if (src[j] === '{') { d++; started = true; }
      else if (src[j] === '}') { d--; if (started && d === 0) return src.slice(i, j + 1); }
    }
    return null;
  },
  noCmt(s) { return s ? s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '') : s; }
};

SPECS.push({
  file: 't26-b80-srv',
  title: 'B80 — WASH-23ג חלק ב\' — ציר הסטטוס בטבלאות הכסף ובשערי הציוד (שרת)',
  needs: 'server',
  requires: ['w24Stat', 'w25Usable', 'sVal', 'sPick',
             'CHARGE_STATUSES', 'CHARGE_DFLT', 'PAYMENT_STATUSES',
             'DECL_STATUSES', 'DECL_DFLT', 'FEXP_STATUSES', 'FEXP_DFLT',
             'CREDIT_STATUSES', 'VEHICLE_STATUSES', 'MACHINE_STATUSES',
             'b48BalancesAg', 'b2CreditUsedAg', 'b54Ledger', 'b54Bump',
             'b54PayCounts', 'b55OpenDeclAg', 'b55PendingForInbox',
             'b3DepositObj', 'handle'],

  tests: {

    /* ================= העוזרים והרשימות ================= */

    '⛔ w24Stat מנרמל כל ערך מוכר בשבע הרשימות': (t, { srv }) => {
      [['CHARGE_STATUSES', srv.CHARGE_STATUSES, srv.CHARGE_DFLT],
       ['PAYMENT_STATUSES', srv.PAYMENT_STATUSES, ''],
       ['DECL_STATUSES', srv.DECL_STATUSES, srv.DECL_DFLT],
       ['FEXP_STATUSES', srv.FEXP_STATUSES, srv.FEXP_DFLT],
       ['CREDIT_STATUSES', srv.CREDIT_STATUSES, ''],
       ['VEHICLE_STATUSES', srv.VEHICLE_STATUSES, ''],
       ['MACHINE_STATUSES', srv.MACHINE_STATUSES, '']].forEach(([name, list, dflt]) => {
        t.ok(list && list.length, '⛔ ' + name + ' חסרה או ריקה');
        list.forEach(st => {
          B80.dirty(st).concat([st]).forEach(v => {
            t.eq(srv.w24Stat({ status: v }, list, dflt || undefined), st,
              '⛔ ' + name + ': w24Stat לא ניקה ' + JSON.stringify(v));
          });
        });
      });
    },

    '⛔⛔ הכרעת אבי 3א: ברירות המחדל של ציר הכסף': (t, { srv }) => {
      t.eq(srv.CHARGE_DFLT, 'פתוח', '⛔⛔ חיוב לא מוכר חדל להיספר — חוב נעלם');
      t.eq(srv.DECL_DFLT, 'ממתין לאישור', '⛔⛔ הצהרת תשלום לא מוכרת חדלה להיות ממתינה');
      t.eq(srv.FEXP_DFLT, 'ממתין', '⛔⛔ הוצאה לא מוכרת נחשבת משולמת — יצאה מהתזרים');
      B80.UNKNOWN.concat(['']).forEach(st => {
        t.eq(srv.w24Stat({ status: st }, srv.CHARGE_STATUSES, srv.CHARGE_DFLT), 'פתוח',
          '⛔⛔ חיוב בסטטוס ' + JSON.stringify(st) + ' לא נספר');
        t.eq(srv.w24Stat({ status: st }, srv.FEXP_STATUSES, srv.FEXP_DFLT), 'ממתין',
          '⛔⛔ הוצאה בסטטוס ' + JSON.stringify(st) + ' יצאה מהתזרים');
        t.eq(srv.w24Stat({ status: st }, srv.DECL_STATUSES, srv.DECL_DFLT), 'ממתין לאישור',
          '⛔ הצהרה בסטטוס ' + JSON.stringify(st) + ' אינה ממתינה לאישור');
      });
      B80.UNKNOWN.forEach(st => {
        t.ne(srv.w24Stat({ status: st }, srv.CREDIT_STATUSES), 'מאומת',
          '⛔ פרופיל אשראי בסטטוס ' + JSON.stringify(st) + ' נחשב מאומת');
        t.ne(srv.w24Stat({ status: st }, srv.CREDIT_STATUSES), 'מאושר',
          '⛔ פרופיל אשראי בסטטוס ' + JSON.stringify(st) + ' נחשב מאושר');
      });
      t.eq(srv.w24Stat({ status: '' }, srv.CREDIT_STATUSES), '',
        '⛔ לפרופיל אשראי אין dflt במכוון — ריק חייב להישאר ריק');
    },

    '⛔⛔ הכרעת אבי 2א: ריק = פעיל · לא מוכר = חסום (רכב ומכונה)': (t, { srv }) => {
      [[srv.VEHICLE_STATUSES, 'פעיל'], [srv.MACHINE_STATUSES, 'פעילה']].forEach(([list, ok]) => {
        t.eq(srv.w25Usable({ status: '' }, list, ok), true,
          '⛔⛔ סטטוס ריק נחסם — כל רכב/מכונה בלי סטטוס הושבתו בבת אחת');
        t.eq(srv.w25Usable(null, list, ok), true, '⛔ רשומה חסרה נחסמה');
        B80.dirty(ok).concat([ok]).forEach(st => {
          t.eq(srv.w25Usable({ status: st }, list, ok), true,
            '⛔⛔ סטטוס תקין מלוכלך ' + JSON.stringify(st) + ' נחסם');
        });
        list.filter(x => x !== ok).concat(B80.UNKNOWN).forEach(st => {
          t.eq(srv.w25Usable({ status: st }, list, ok), false,
            '⛔ סטטוס ' + JSON.stringify(st) + ' עבר את השער — לא רוכך לצד הלא נכון');
        });
      });
    },

    '⛔ w25Usable אינה מנרמלת בעצמה — היא עוטפת את w24Stat (R8)': (t, { H }) => {
      const b = B80.noCmt(B80.body(H.serverSrc(), 'w25Usable'));
      t.ok(b, '⛔ w25Usable נעלמה מקוד השרת');
      t.has(b, 'w24Stat(', '⛔ w25Usable אינה עוברת דרך w24Stat — נבנה מנרמל שני (R8)');
      t.hasNot(b, 'sPick(', '⛔ w25Usable קוראת ל-sPick ישירות — זה מנרמל שני');
    },

    /* ============ ⛔⛔ charges — ספר החיובים · R6 ============ */

    '⛔⛔ חיוב מבוטל מלוכלך יורד מהיתרה — שלושת המקורות מסכימים': (t, { srv }) => {
      const clean = B80.bal(srv, B80.moneyDb(srv, { charge: { status: 'בוטל' } }));
      t.eq(clean.a, clean.b, '⛔⛔ R6 נשבר על חיוב מבוטל נקי');
      t.eq(clean.a, 0, '⛔ קו הבסיס: חיוב מבוטל נקי אינו אפס');
      B80.dirty('בוטל').forEach(st => {
        const r = B80.bal(srv, B80.moneyDb(srv, { charge: { status: st } }));
        t.eq(r.a, r.b, '⛔⛔ R6 נשבר על חיוב בסטטוס ' + JSON.stringify(st));
        t.eq(r.a, clean.a,
          '⛔⛔ חיוב מבוטל בסטטוס ' + JSON.stringify(st) + ' עדיין נספר כחוב — הלקוח חויב פעמיים');
      });
    },

    '⛔⛔ חיוב פתוח לא נעלם — הצד השני של אותו תנאי (מלכודת 4)': (t, { srv }) => {
      const base = B80.bal(srv, B80.moneyDb(srv));
      t.eq(base.a, 100000, '⛔ קו הבסיס: חיוב 1000 ₪ אינו 100000 אגורות');
      B80.dirty('פתוח').concat(B80.UNKNOWN, ['']).forEach(st => {
        const r = B80.bal(srv, B80.moneyDb(srv, { charge: { status: st } }));
        t.eq(r.a, r.b, '⛔⛔ R6 נשבר על חיוב בסטטוס ' + JSON.stringify(st));
        t.eq(r.a, base.a,
          '⛔⛔ חיוב פתוח בסטטוס ' + JSON.stringify(st) + ' נעלם מהיתרה — כסף שלא ייגבה');
      });
    },

    '⛔ ביטול חיוב שכבר בוטל מלוכלך נדחה — אין ביטול כפול': (t, { srv }) => {
      B80.dirty('בוטל').concat(['בוטל']).forEach(st => {
        const db = B80.moneyDb(srv, { charge: { status: st } });
        const r = srv.handle('b54ChargeCancel',
          { charge_id: 'CH1', reason: 'טעות', _verified_role: 'מנהל' }, db, 'מנהל');
        t.eq(r.error, 'החיוב כבר בוטל',
          '⛔ חיוב שכבר מבוטל (' + JSON.stringify(st) + ') לא נדחה מהסיבה הנכונה — ' + (r && r.error));
      });
    },

    /* ============ ⛔⛔ payments ============ */

    '⛔⛔ תשלום מלוכלך נספר — הלקוח אינו חייב כסף ששילם': (t, { srv }) => {
      const clean = B80.bal(srv, B80.payDb(srv, 'שולם'));
      t.eq(clean.a, clean.b, '⛔⛔ R6 נשבר על תשלום נקי');
      t.eq(clean.a, 60000, '⛔ קו הבסיס: 1000 פחות 400 אינו 60000 אגורות');
      t.eq(B80.bal(srv, B80.payDb(srv, null)).a, 100000,
        '⛔ קו הבסיס: בלי תשלום היתרה אינה 100000 אגורות');
      B80.dirty('שולם').concat(['']).forEach(st => {
        const r = B80.bal(srv, B80.payDb(srv, st));
        t.eq(r.a, r.b, '⛔⛔ R6 נשבר על תשלום בסטטוס ' + JSON.stringify(st));
        t.eq(r.a, clean.a,
          '⛔⛔ תשלום בסטטוס ' + JSON.stringify(st) + ' לא נספר — הלקוח נראה חייב כסף ששילם');
      });
      t.eq(srv.b54PayCounts({ status: 'שולם\u00A0' }), true, '⛔⛔ b54PayCounts דחה תשלום מלוכלך');
      t.eq(srv.b54PayCounts({ status: '' }), true, '⛔ ריק = נגבה (תאימות היסטורית) נשבר');
      B80.UNKNOWN.concat(['בוטל']).forEach(st => {
        t.eq(srv.b54PayCounts({ status: st }), false,
          '⛔ תשלום בסטטוס ' + JSON.stringify(st) + ' נספר כנגבה — הצד השני של התנאי רוכך');
      });
    },

    /* ============ ⛔⛔ futureExpenses — תזרים B43 ============ */

    '⛔⛔ הוצאה עתידית ששולמה מלוכלך אינה חוזרת לתזרים': (t, { srv }) => {
      B80.dirty('שולם').concat(['שולם']).forEach(st => {
        const db = B80.fexpDb(srv, st);
        const r = srv.handle('markFutureExpensePaid',
          { id: 'FE1', _verified_role: 'מנהל' }, db, 'מנהל');
        t.eq(r.error, 'כבר שולם',
          '⛔⛔ הוצאה ששולמה (' + JSON.stringify(st) + ') לא נחסמה מהסיבה הנכונה — ' + (r && r.error));
      });
    },

    '⛔ הוצאה פתוחה עדיין ניתנת לתשלום — הצד השני (מלכודת 4)': (t, { srv }) => {
      B80.dirty('ממתין').concat(B80.UNKNOWN, ['', 'ממתין', 'שולם חלקית']).forEach(st => {
        const db = B80.fexpDb(srv, st);
        const r = srv.handle('markFutureExpensePaid',
          { id: 'FE1', _verified_role: 'מנהל' }, db, 'מנהל');
        t.ne(r.error, 'כבר שולם',
          '⛔ הוצאה פתוחה בסטטוס ' + JSON.stringify(st) + ' נחסמה לתשלום');
      });
    },

    '⛔ שינוי מועד תשלום נחסם על הוצאה ששולמה מלוכלך': (t, { srv }) => {
      B80.dirty('שולם').concat(['שולם']).forEach(st => {
        const db = B80.fexpDb(srv, st);
        const r = srv.handle('b43SetDueDate',
          { entity_type: 'future_expense', id: 'FE1', due_date: '2026-10-01',
            reason: 'דחייה', _verified_role: 'מנהל' }, db, 'מנהל');
        t.eq(r.error, 'ההוצאה כבר שולמה — אי אפשר לשנות מועד',
          '⛔ מועד תשלום על הוצאה ששולמה (' + JSON.stringify(st) + ') לא נחסם נכון — ' + (r && r.error));
      });
    },

    /* ============ ⛔⛔ paymentDeclarations — כסף שנכנס ============ */

    '⛔⛔ הצהרת תשלום ממתינה מלוכלך נשארת פתוחה ובתיבת המשרד': (t, { srv }) => {
      B80.dirty('ממתין לאישור').concat(['', 'ממתין לאישור'], B80.UNKNOWN).forEach(st => {
        const db = B80.declDb(srv, st);
        t.eq(srv.b55OpenDeclAg(db, 'C1'), 30000,
          '⛔⛔ הצהרה בסטטוס ' + JSON.stringify(st) + ' לא נספרה כפתוחה');
        t.eq(srv.b55PendingForInbox(db).declarations.length, 1,
          '⛔⛔ הצהרה בסטטוס ' + JSON.stringify(st) + ' נעלמה מתיבת המשרד — כסף שנכנס ואיש אינו יודע');
      });
    },

    '⛔ הצהרה שכבר הוכרעה מלוכלך אינה מאושרת שוב (מלכודת 4)': (t, { srv }) => {
      B80.dirty('אושר').concat(B80.dirty('נדחה'), ['אושר', 'נדחה']).forEach(st => {
        const db = B80.declDb(srv, st);
        t.eq(srv.b55OpenDeclAg(db, 'C1'), 0,
          '⛔ הצהרה שהוכרעה (' + JSON.stringify(st) + ') נספרה כפתוחה');
        t.eq(srv.b55PendingForInbox(db).declarations.length, 0,
          '⛔ הצהרה שהוכרעה (' + JSON.stringify(st) + ') חזרה לתיבת המשרד');
        const r = srv.handle('b55ConfirmDeclaration',
          { declaration_id: 'PD1', amount: 300, _verified_role: 'מנהל' }, db, 'מנהל');
        t.eq(r.ok, false,
          '⛔⛔ הצהרה שהוכרעה (' + JSON.stringify(st) + ') אושרה שוב — כסף נזקף פעמיים');
      });
    },

    /* ============ שער הרכב ============ */

    '⛔ רכב פעיל מלוכלך עדיין ניתן לשיבוץ לנסיעה': (t, { srv }) => {
      B80.dirty('פעיל').concat(['פעיל', '']).forEach(st => {
        const db = B80.vehDb(srv, st);
        const r = srv.handle('tripCreate',
          { date: '2026-08-18', driver_id: 'DR1', vehicle_id: 'V1' }, db, 'מנהל');
        t.eq(String(r && r.error || '').indexOf('אינו פעיל'), -1,
          '⛔ רכב תקין בסטטוס ' + JSON.stringify(st) + ' נחסם לשיבוץ — ' + (r && r.error));
      });
    },

    '⛔ רכב מושבת או לא מוכר נשאר חסום (מלכודת 4)': (t, { srv }) => {
      ['מושבת', 'בטיפול'].concat(B80.dirty('מושבת'), B80.UNKNOWN).forEach(st => {
        const db = B80.vehDb(srv, st);
        const r = srv.handle('tripCreate',
          { date: '2026-08-18', driver_id: 'DR1', vehicle_id: 'V1' }, db, 'מנהל');
        t.ok(String(r && r.error || '').indexOf('אינו פעיל') > -1,
          '⛔ רכב שאינו פעיל (' + JSON.stringify(st) + ') שובץ לנסיעה — ' + (r && r.error));
      });
    },

    /* ============ פרופיל אשראי ============ */

    '⛔ פרופיל אשראי מאומת מלוכלך עדיין מאומת': (t, { srv }) => {
      B80.dirty('מאומת').concat(['מאומת']).forEach(st => {
        const db = H.emptyDb(srv);
        db.customers = [{ id: 'C1', name: 'לקוח א', active: 'כן' }];
        db.creditProfiles = [{ customer_id: 'C1', status: st, gateway_token: 'TOK1' }];
        t.eq(srv.b3DepositObj(db, 'C1').verified, true,
          '⛔ פרופיל מאומת בסטטוס ' + JSON.stringify(st) + ' נחשב לא מאומת');
      });
      B80.UNKNOWN.concat(['', 'נדחה']).forEach(st => {
        const db = H.emptyDb(srv);
        db.customers = [{ id: 'C1', name: 'לקוח א', active: 'כן' }];
        db.creditProfiles = [{ customer_id: 'C1', status: st, gateway_token: 'TOK1' }];
        t.eq(srv.b3DepositObj(db, 'C1').verified, false,
          '⛔ פרופיל בסטטוס ' + JSON.stringify(st) + ' נחשב מאומת');
      });
    },

    /* ============ סורק המקור ============ */

    '⛔⛔ אין יותר השוואת סטטוס גולמית בשבע הטבלאות (שרת)': (t, { H }) => {
      const sv = B80.noCmt(H.serverSrc());
      const bad = []
        .concat(sv.match(/\.status\s*(?:===|!==)\s*'(?:פתוח|בוטל|שולם|ממתין לאישור|אושר|נדחה|מאומת|מאושר|פעיל|פעילה)'/g) || [])
        .concat(sv.match(/String\(\s*\w+\.status\s*(?:\|\|[^)]*)?\)\s*(?:===|!==)\s*(?:'(?:פתוח|בוטל|שולם)'|B55_DECL_)/g) || []);
      t.eq(bad.length, 0,
        '⛔⛔ נותרו ' + bad.length + ' השוואות גולמיות בשרת: ' + bad.join(' · '));
    },

    '⛔ כל קריאה עם רשימת dflt מעבירה גם את ברירת המחדל': (t, { H }) => {
      [['השרת', H.serverSrc()], ['הממשק', H.uiScript()]].forEach(([who, src]) => {
        [['CHARGE_STATUSES', 'CHARGE_DFLT'],
         ['DECL_STATUSES', 'DECL_DFLT'],
         ['FEXP_STATUSES', 'FEXP_DFLT']].forEach(([list, dflt]) => {
          const calls = (src.match(new RegExp('w24Stat\\([^)]*' + list + '[^)]*\\)', 'g')) || []);
          t.ok(calls.length > 0, '⛔ ' + who + ': אין אף קריאה עם ' + list + ' — הסורק אינו מודד');
          const bad = calls.filter(c => c.indexOf(dflt) === -1);
          t.eq(bad.length, 0,
            '⛔⛔ ' + who + ': ' + bad.length + ' קריאות בלי ' + dflt + ': ' + bad.join(' · '));
        });
      });
    }
  }
});

SPECS.push({
  file: 't26-b80-ui',
  title: 'B80 — WASH-23ג חלק ב\' (ממשק): זהות תו-בתו · custBalance · תזרים · פורטל',
  needs: 'ui',
  requires: ['w24Stat', 'w25Usable', 'CHARGE_STATUSES', 'CHARGE_DFLT',
             'PAYMENT_STATUSES', 'DECL_STATUSES', 'DECL_DFLT',
             'FEXP_STATUSES', 'FEXP_DFLT', 'CREDIT_STATUSES',
             'VEHICLE_STATUSES', 'MACHINE_STATUSES',
             'custBalance', 'b48BalancesAgFE', 'fexpOpen', 'fexpAll',
             'b54PayCounts', 'portalDepositHtml', 'b46VehStatusColor',
             'b49fAutoCancelled', 'vehForm', 'machForm', 'b42Meta', 'b42ScopeTypes', 'transferForm'],

  tests: {

    '⛔⛔ כל רשימות B80 ו-w25Usable זהים תו-בתו בין הקבצים': (t, { H }) => {
      const sv = H.serverSrc(), ui = H.uiScript();
      ['CHARGE_STATUSES', 'CHARGE_DFLT', 'PAYMENT_STATUSES', 'DECL_STATUSES',
       'DECL_DFLT', 'FEXP_STATUSES', 'FEXP_DFLT', 'CREDIT_STATUSES',
       'VEHICLE_STATUSES', 'MACHINE_STATUSES'].forEach(v => {
        const re = new RegExp('var\\s+' + v + '\\s*=[^;]*;');
        const a = (sv.match(re) || [])[0], b = (ui.match(re) || [])[0];
        t.ok(a, '⛔⛔ ' + v + ' חסר בקוד השרת');
        t.ok(b, '⛔⛔ ' + v + ' חסר ב-index.html');
        t.eq(String(a).replace(/\s+/g, ' '), String(b).replace(/\s+/g, ' '),
          '⛔⛔ ' + v + ' התפצל בין הקבצים');
      });
      const wa = B80.noCmt(B80.body(sv, 'w25Usable'));
      const wb = B80.noCmt(B80.body(ui, 'w25Usable'));
      t.ok(wa && wb, '⛔⛔ w25Usable חסרה באחד הקבצים');
      t.eq(String(wa).replace(/\s+/g, ' '), String(wb).replace(/\s+/g, ' '),
        '⛔⛔ w25Usable התפצלה בין הקבצים — השרת והממשק יחליטו אחרת על אותו רכב');
    },

    '⛔⛔ הממשק מסכים עם השרת על כל סטטוס בשבע הרשימות': (t, { w, srv }) => {
      [['CHARGE_STATUSES', 'CHARGE_DFLT'], ['PAYMENT_STATUSES', null],
       ['DECL_STATUSES', 'DECL_DFLT'], ['FEXP_STATUSES', 'FEXP_DFLT'],
       ['CREDIT_STATUSES', null], ['VEHICLE_STATUSES', null],
       ['MACHINE_STATUSES', null]].forEach(([list, dflt]) => {
        srv[list].reduce((acc, st) => acc.concat(B80.dirty(st), [st]), [])
          .concat(B80.UNKNOWN, ['']).forEach(st => {
            t.eq(w.w24Stat({ status: st }, w[list], dflt ? w[dflt] : undefined),
                 srv.w24Stat({ status: st }, srv[list], dflt ? srv[dflt] : undefined),
              '⛔⛔ הממשק והשרת נחלקו על ' + list + ' · ' + JSON.stringify(st));
          });
      });
    },

    '⛔⛔ R6: custBalance מסכים עם b48BalancesAg על חיוב ותשלום מלוכלכים': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const measure = (chSt, paySt) => {
        const db = B80.moneyDb(srv, {
          charge: { status: chSt },
          payments: paySt === null ? [] : [{
            id: 'PY1', order_id: '', invoice_id: '', receipt_number: 'R1',
            date: '2026-08-05', amount: 400, method: 'מזומן', note: '',
            customer_id: 'C1', type: 'תשלום כללי', status: paySt, txn_id: 'T1'
          }]
        });
        w.DB = db;
        delete w.DB._b54Ledger; delete w.DB._b48Bal;
        const fe = Math.round(w.custBalance('C1') * 100);
        srv.b54Bump();
        const sv = srv.b48BalancesAg(db)['C1'] || 0;
        srv.b54Bump();
        const cr = srv.b2CreditUsedAg(db, 'C1');
        return { fe: fe, sv: sv, cr: cr };
      };
      [['פתוח', null], ['בוטל', null], ['פתוח', 'שולם']].forEach(([c, p]) => {
        const base = measure(c, p);
        t.eq(base.fe, base.sv, '⛔⛔ R6 נשבר על נקי ' + c + '/' + p);
        t.eq(base.sv, base.cr, '⛔⛔ R6 נשבר על נקי ' + c + '/' + p);
        B80.dirty(c).forEach(dc => {
          const r = measure(dc, p === null ? null : 'שולם\u00A0');
          t.eq(r.fe, r.sv, '⛔⛔ R6: הממשק והשרת נחלקו על ' + JSON.stringify(dc));
          t.eq(r.sv, r.cr, '⛔⛔ R6: מנוע האשראי נחלק על ' + JSON.stringify(dc));
          t.eq(r.fe, base.fe,
            '⛔⛔ היתרה זזה בגלל לכלוך בסטטוס ' + JSON.stringify(dc));
        });
      });
    },

    '⛔⛔ תזרים: הוצאה ששולמה מלוכלך אינה חוזרת לרשימת הפתוחות': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const set = st => {
        w.DB.futureExpenses = [{ id: 'FE1', source: 'ידני', category: 'כללי',
          description: 'הוצאה', amount: 500, due_date: '2026-09-01',
          urgency: 'רגיל', status: st, deleted: '' }];
      };
      B80.dirty('שולם').concat(['שולם']).forEach(st => {
        set(st);
        t.eq(w.fexpOpen().length, 0,
          '⛔⛔ הוצאה ששולמה (' + JSON.stringify(st) + ') חזרה לתזרים');
      });
      B80.dirty('ממתין').concat(B80.UNKNOWN, ['', 'ממתין', 'שולם חלקית']).forEach(st => {
        set(st);
        t.eq(w.fexpOpen().length, 1,
          '⛔ הוצאה פתוחה (' + JSON.stringify(st) + ') נעלמה מהתזרים — הצד השני של התנאי');
      });
    },

    '⛔ בורר הרכבים: מלוכלך וריק נכנסים · מושבת ולא מוכר יוצאים': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const opts = st => {
        w.DB.vehicles = [{ id: 'V1', plate: '11-111-11', status: st, active: 'כן' }];
        w.DB.employees = [{ id: 'DR1', name: 'נהג א', active: 'כן', role: 'נהג' }];
        w.DB.warehouses = []; w.DB.items = [];
        w.transferForm();
        const sel = w.document.getElementById('f_tveh');
        t.ok(sel, '⛔ בורר הרכב לא נוצר במסך העברת המלאי');
        return sel ? sel.querySelectorAll('option[value="V1"]').length : -1;
      };
      B80.dirty('פעיל').concat(['פעיל', '']).forEach(st => {
        t.eq(opts(st), 1, '⛔ רכב תקין בסטטוס ' + JSON.stringify(st) + ' נעלם מהבורר');
      });
      ['מושבת', 'בטיפול'].concat(B80.UNKNOWN).forEach(st => {
        t.eq(opts(st), 0, '⛔ רכב שאינו פעיל (' + JSON.stringify(st) + ') הוצע לשיבוץ');
      });
    },

    '⛔ טופס הרכב בוחר את הסטטוס הנכון גם על ערך מלוכלך': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      B80.dirty('בטיפול').concat(['בטיפול']).forEach(st => {
        w.vehForm({ id: 'V1', plate: '11-111-11', status: st });
        const sel = w.document.getElementById('fv_status');
        t.ok(sel, '⛔ בורר הסטטוס לא נוצר בטופס הרכב');
        t.eq(sel.value, 'בטיפול',
          '⛔ טופס הרכב איבד את הסטטוס על ערך ' + JSON.stringify(st) + ' — שמירה הייתה דורסת אותו');
      });
    },

    '⛔ טופס המכונה בוחר את הסטטוס הנכון גם על ערך מלוכלך': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      B80.dirty('בתיקון').concat(['בתיקון']).forEach(st => {
        w.machForm({ id: 'M1', type: 'מכונה', status: st });
        const sel = w.document.getElementById('f_mstat');
        t.ok(sel, '⛔ בורר הסטטוס לא נוצר בטופס המכונה');
        t.eq(sel.value, 'בתיקון',
          '⛔ טופס המכונה איבד את הסטטוס על ערך ' + JSON.stringify(st));
      });
    },

    '⛔ הפורטל: פקדון מאומת מלוכלך מוצג כמאומת': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      B80.dirty('מאושר').concat(['מאושר']).forEach(st => {
        t.has(w.portalDepositHtml({ exists: true, status: st, verified: false,
          guarantee_type: 'ערבות בנקאית', approval_pending: false }),
          'ערבות חלופית מאושרת',
          '⛔ הפורטל לא זיהה ערבות מאושרת בסטטוס ' + JSON.stringify(st));
      });
      B80.dirty('ממתין לאימות').concat(['ממתין לאימות']).forEach(st => {
        t.has(w.portalDepositHtml({ exists: true, status: st, verified: false,
          guarantee_type: '', approval_pending: false }),
          'אימות הכרטיס טרם הושלם',
          '⛔ הפורטל לא זיהה אימות שלא הושלם בסטטוס ' + JSON.stringify(st));
      });
      t.hasNot(w.portalDepositHtml({ exists: false, status: '', verified: false,
        guarantee_type: '', approval_pending: false }),
        'אימות הכרטיס טרם הושלם',
        '⛔ לקוח בלי פרופיל קיבל נוסח של אימות שנתקע — לפרופיל אשראי אין dflt במכוון');
    },

    '⛔ דליפת B79: ביטול אוטומטי מלוכלך מזוהה לשחזור': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const today = w.todayYMD();
      B80.dirty('בוטל').concat(['בוטל']).forEach(st => {
        w.DB.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'אספקה', date: today,
          status: st, trip_auto_cancel: 'TRIP1' }];
        t.eq(w.b49fAutoCancelled().length, 1,
          '⛔ משלוח שבוטל אוטומטית בסטטוס ' + JSON.stringify(st) + ' לא הוצע לשחזור');
      });
      w.DB.deliveries = [{ id: 'D1', order_id: 'O1', kind: 'אספקה', date: today,
        status: 'מתוכנן', trip_auto_cancel: 'TRIP1' }];
      t.eq(w.b49fAutoCancelled().length, 0,
        '⛔ משלוח פעיל הוצע לשחזור — הצד השני של התנאי');
    },

    '⛔⛔ אין יותר השוואת סטטוס גולמית בשבע הטבלאות (ממשק)': (t, { H }) => {
      const ui = B80.noCmt(H.uiScript());
      const bad = []
        .concat(ui.match(/\b(?:ch|x|v|m|mSc|pr|dep|fe)\.status\s*(?:===|!==)\s*'(?:פתוח|בוטל|שולם|ממתין לאישור|ממתין לאימות|אושר|נדחה|מאומת|מאושר|פעיל|פעילה|בטיפול|בתיקון)'/g) || [])
        .concat(ui.match(/String\(\s*\w+\.status\s*\|\|\s*'(?:פתוח|שולם)'\s*\)/g) || [])
        .concat(ui.match(/(?<!=\s)\[\s*'פעיל'\s*,\s*'בטיפול'\s*,\s*'מושבת'\s*\]/g) || [])
        .concat(ui.match(/(?<!=\s)\[\s*'פעילה'\s*,\s*'בתיקון'\s*,\s*'מושבתת'\s*\]/g) || []);
      t.eq(bad.length, 0,
        '⛔⛔ נותרו ' + bad.length + ' אתרים גולמיים בממשק: ' + bad.join(' · '));
      t.eq((ui.match(/\[\s*'פעיל'\s*,\s*'בטיפול'\s*,\s*'מושבת'\s*\]/g) || []).length, 1,
        '⛔ יש יותר מהגדרה אחת של רשימת סטטוסי הרכב — הכפילות חזרה');
      t.eq((ui.match(/\[\s*'פעילה'\s*,\s*'בתיקון'\s*,\s*'מושבתת'\s*\]/g) || []).length, 1,
        '⛔ יש יותר מהגדרה אחת של רשימת סטטוסי המכונה — הכפילות חזרה');
    },

    '⛔ R5 לא נשבר · b42Meta צורך את אותה רשימה ולא מילון שני': (t, { w }) => {
      t.eq(w.b42ScopeTypes('assets').join('|'), 'מכונה|עגלה', '⛔ R5: היקף מסך הנכסים השתנה');
      t.eq(w.b42ScopeTypes('fleet').join('|'), 'רכב', '⛔ R5: היקף מסך הצי השתנה');
      t.eq(w.b42Meta('רכב').states.join('|'), w.VEHICLE_STATUSES.join('|'),
        '⛔ b42Meta מחזיק מילון שני לסטטוס רכב');
      t.eq(w.b42Meta('מכונה').states.join('|'), w.MACHINE_STATUSES.join('|'),
        '⛔ b42Meta מחזיק מילון שני לסטטוס מכונה');
      t.eq(w.b42Meta('עגלה').field, 'condition',
        '⛔⛔ שדה המצב של עגלה הוא condition ולא status — R5/B56 נשבר');
    },

    '⛔ שכבה 2 לא נגעה — WASH-23ג חלק ב\' אינו יכולת דפדפן': (t, { H }) => {
      const b61 = B80.noCmt(B80.body(H.uiScript(), 'b61Tests'));
      t.ok(b61, 'b61Tests נעלם מהממשק');
      ['CHARGE_STATUSES', 'VEHICLE_STATUSES', 'w25Usable'].forEach(n => {
        t.hasNot(b61, n, '⛔ נוספה טענת דפדפן ל-b61Tests — B80 הוא לוגיקת שרת/ממשק');
      });
    }
  }
});

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
