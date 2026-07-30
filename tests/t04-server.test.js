/* t04 — קוד השרת: סכימה, ניתוב, הרשאות וכסף.
   רץ ב-vm.createContext עם Apps Script מדומה. אין גיליון אמיתי ואין רשת —
   הבדיקות כאן הן על הצהרות ועל לוגיקה טהורה, לא על נתונים. */

module.exports = {
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
};
