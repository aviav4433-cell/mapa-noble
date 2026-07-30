/* t03 — הרשאות, תפקידים ועוזרי ליבה.
   חמישה תפקידים × ארבעה הקשרי ריצה הם שאלה 6 ב-R2. הקובץ הזה הוא
   התשובה האוטומטית עליה, כדי שאף אצווה לא תצטרך לבדוק אותה ידנית שוב. */

module.exports = {
  title: 'הרשאות, תפקידים ועוזרי ליבה',
  needs: 'ui',
  requires: ['allowedViews', 'VIEWS', 'NAV_GROUPS', 'navGroupOf', 'DRIVER_TAB_ORDER',
             'navIsTop', 'navIsSide', 'navMode', 'esc', 'ymdLocal', 'ils', 'ilsVat',
             'VAT_RATE', 'el', 'kioskOn', 'custBalance'],

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
};
