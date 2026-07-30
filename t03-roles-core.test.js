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

const ROOT = path.resolve(__dirname, '..');
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

module.exports = {
  ROOT, INDEX, SERVER,
  indexSrc, serverSrc, uiScript, stripComments,
  loadServer, loadUi, emptyDb, login,
  wire, click, change, popstate
};
