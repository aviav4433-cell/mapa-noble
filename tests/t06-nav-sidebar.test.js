/* t05 — הכלי שמאמת חייב להיות מאומת בעצמו.
   כרטיס "בדיקה עצמית" (B61) הוא התשובה ל-R11: הוא רץ בדפדפן האמיתי של
   אבי ובודק את מה ש-jsdom לא יכול. אבל אם הוא עצמו שבור — אבי יראה מסך
   ירוק שלא אומר כלום, וזה גרוע מלא לבנות אותו. לכן הקובץ הזה.

   ⚠ מה שאי אפשר לבדוק כאן: האם התוצאות שהכרטיס מציג נכונות בדפדפן אמיתי.
   זו בדיוק המגבלה שהכרטיס נועד לעקוף, ולכן היא נשארת פתוחה בכוונה. */

module.exports = {
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
};
