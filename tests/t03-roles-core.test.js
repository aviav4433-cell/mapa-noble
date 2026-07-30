/* t02 — ניווט, איפוס מצב מסך והיסטוריית דפדפן.   T3 · T4 · B60a · B62
   ============================================================
   ⚠ הקובץ הזה נכתב מחדש ב-B62. הגרסה של B61 לא הגיעה לריפו (הועלו שבעה
   קבצים בשמות מוחלפים ו-t02 נעדר לחלוטין), והתגלה בפתיחת הסשן: הספרייה
   החזירה 66 בדיקות במקום 87. הוא נכתב כאן מול הקוד החי, לא משוחזר מזיכרון.

   ⚠ מה הקובץ הזה **אינו** מוכיח: ש"הקודם" עובד בדפדפן של אבי. ל-jsdom אין
   מחסנית היסטוריה אמיתית — pushState כאן הוא רישום בזיכרון. זה בדיוק הכשל
   של B60 (60 בדיקות ירוקות, כשלון בייצור בלחיצה השנייה). האימות האמיתי
   הוא בכרטיס "בדיקה עצמית", שכן רץ בדפדפן. כאן נבדקת ההחלטה, לא הדפדפן. */

const H = require('./harness');

module.exports = {
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
};
