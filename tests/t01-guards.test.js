/* t01 — שומרים על קוד המקור.
   בדיקות שאינן מריצות כלום: הן קוראות את הקוד החי ומוודאות שכללי הברזל
   לא הופרו. זו השכבה שתופסת "מישהו הוסיף שורה שאסור להוסיף". */

const H = require('./harness');

module.exports = {
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
};
