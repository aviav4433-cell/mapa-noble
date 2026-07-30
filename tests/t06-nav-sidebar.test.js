/* t06 — סרגל הצד, קיצורי הדרך וסרגלי הפעולות.   B62 · T2 · BLD-04
   ============================================================
   הכלל של B62 בשורה אחת: **קטגוריה בסרגל הצד פתוחה אם היא נעוצה או אם
   המסך הנוכחי בתוכה.** אין מצב שני ואין אקורדיון — האקורדיון (NAV_OPEN /
   toggleNavPanel) נשאר של המובייל בלבד ונבדק ב-t02.

   ⚠ מה שאי אפשר לבדוק כאן: שהסרגל **באמת נכנס** לגובה המסך. ל-jsdom אין
   מנוע פריסה ולכן scrollHeight הוא אפס. המדידה האמיתית יושבת בשכבה 2,
   בכרטיס "בדיקה עצמית", בטענה "סרגל הצד נכנס לגובה החלון בלי גלילה". */

const H = require('./harness');

module.exports = {
  title: 'סרגל הצד, קיצורי דרך וסרגלי פעולות — B62',
  needs: 'ui',
  requires: ['renderNav', 'navMode', 'navIsSide', 'navGroupOf', 'navQuickKeys',
             'allowedViews', 'NAV_GROUPS', 'NAV_QUICK_MAX', 'NAV_QUICK_LABEL_MAX',
             'b62NavPins', 'b62NavPinsSave', 'b62NavPinned', 'b62NavPin', 'B62_PINS_KEY',
             'b62QuickOrderHtml', 'b62QMove', 'b62QDown', 'b62QCommit',
             'b53QuickToggle', 'b53QuickNavPanelHtml',
             'moreMenu', 'toggleMore', 'closeMore', 'b62OrderActions',
             'renderTopbar', 'go'],

  tests: {

    /* ===== סרגל הצד — קיפול ונעיצה ===== */

    'ב-1422px הסרגל במצב side ומציג את כל הקטגוריות': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv, { is_super_admin: true });
      t.eq(w.navMode(), 'side', 'מצב הניווט אינו סרגל צד ברוחב של אבי');
      const html = w.document.getElementById('nav').innerHTML;
      t.has(html, 'ngrp side', 'לא נמצאה אף קטגוריה בסרגל הצד');
      t.has(html, 'gbody', 'גוף הקטגוריה חסר — הקיפול לא נבנה');
    },

    '⛔ כל המסכים המותרים קיימים ב-DOM גם כשהקטגוריה מכווצת': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv, { is_super_admin: true });
      w.b62NavPinsSave([]);            // שום קטגוריה אינה נעוצה
      w.render();
      const html = w.document.getElementById('nav').innerHTML;
      const views = w.allowedViews();
      views.forEach(v => {
        t.has(html, "go('" + v[0] + "')",
          'המסך "' + v[1] + '" נעלם מהסרגל כשהקטגוריה מכווצת — כפתור לא נעלם לעולם (T2)');
      });
      t.ok(views.length >= 28, 'מספר המסכים למנהל ראשי ירד — allowedViews השתנתה');
    },

    'הקטגוריה של המסך הנוכחי פתוחה אוטומטית': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.b62NavPinsSave([]);
      w.go('payroll');                 // קטגוריית "כוח אדם"
      const g = w.document.querySelector('#nav .ngrp.side[data-g="כוח אדם"]');
      t.ok(!!g, 'קטגוריית כוח אדם לא נמצאה');
      t.ok(g.classList.contains('open'), 'הקטגוריה של המסך הנוכחי אינה פתוחה — תנאי א\' של N3א');
      t.ok(g.classList.contains('cur'), 'הקטגוריה הנוכחית אינה מסומנת');
    },

    'קטגוריה שאינה נעוצה ואינה נוכחית — מכווצת': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.b62NavPinsSave([]);
      w.go('payroll');
      const g = w.document.querySelector('#nav .ngrp.side[data-g="מלאי ומחסן"]');
      t.ok(!!g, 'קטגוריית מלאי ומחסן לא נמצאה');
      t.no(g.classList.contains('open'), 'קטגוריה רחוקה נשארה פתוחה — הסרגל לא יתכווץ ולא ייכנס ב-650px');
    },

    'קטגוריה נעוצה פתוחה גם כשהמסך הנוכחי במקום אחר': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.b62NavPinsSave(['מלאי ומחסן']);
      w.go('payroll');
      const g = w.document.querySelector('#nav .ngrp.side[data-g="מלאי ומחסן"]');
      t.ok(g.classList.contains('open'), 'קטגוריה נעוצה נסגרה — הנעיצה לא עובדת');
      t.ok(g.classList.contains('pin'), 'סימון הנעיצה חסר');
    },

    'לחיצה על שורת הכותרת נועצת (R7 — אירוע DOM אמיתי)': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.b62NavPinsSave([]);
      w.go('dash');
      const g = w.document.querySelector('#nav .ngrp.side[data-g="מלאי ומחסן"]');
      const cap = g.querySelector('.gcap');
      t.no(g.classList.contains('open'), 'הקטגוריה כבר פתוחה — הבדיקה לא בודקת כלום');
      H.click(w, cap);
      t.ok(g.classList.contains('open'), 'לחיצה על הכותרת לא פתחה את הקטגוריה');
      t.ok(g.classList.contains('pin'), 'הלחיצה לא נעצה');
      t.ok(w.b62NavPinned('מלאי ומחסן'), 'הנעיצה לא נשמרה במצב');
    },

    'לחיצה שנייה משחררת ומכווצת': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.b62NavPinsSave(['מלאי ומחסן']);
      w.go('dash');
      const g = w.document.querySelector('#nav .ngrp.side[data-g="מלאי ומחסן"]');
      H.click(w, g.querySelector('.gcap'));
      t.no(g.classList.contains('pin'), 'הלחיצה השנייה לא שחררה');
      t.no(g.classList.contains('open'), 'הקטגוריה נשארה פתוחה אחרי שחרור');
      t.no(w.b62NavPinned('מלאי ומחסן'), 'השחרור לא נשמר');
    },

    '⛔ הקטגוריה הנוכחית נשארת פתוחה גם כשמשחררים את הסיכה': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.b62NavPinsSave(['כוח אדם']);
      w.go('payroll');
      const g = w.document.querySelector('#nav .ngrp.side[data-g="כוח אדם"]');
      H.click(w, g.querySelector('.gcap'));
      t.no(g.classList.contains('pin'), 'הסיכה לא שוחררה');
      t.ok(g.classList.contains('open'), 'המסך שאתה נמצא בו נעלם מהתפריט — אסור');
    },

    'הנעיצה נשמרת ב-localStorage ושורדת רינדור מחדש': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.b62NavPinsSave(['ארגון', 'רכש וכספים']);
      w.B62_PINS = null;                                  // מאלץ קריאה מהאחסון
      const raw = w.localStorage.getItem(w.B62_PINS_KEY);
      t.ok(!!raw, 'שום דבר לא נכתב ל-localStorage — הנעיצה לא תשרוד רענון');
      t.eq(w.b62NavPins().join(','), 'ארגון,רכש וכספים', 'המצב לא נקרא חזרה נכון');
      w.go('dash');
      const g = w.document.querySelector('#nav .ngrp.side[data-g="ארגון"]');
      t.ok(g.classList.contains('open'), 'הנעיצה לא הוחלה אחרי ניווט למסך אחר');
    },

    'localStorage פגום אינו מפיל את הסרגל': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.localStorage.setItem(w.B62_PINS_KEY, '{{לא JSON');
      w.B62_PINS = null;
      t.eq(w.b62NavPins().length, 0, 'ערך פגום לא טופל — הסרגל ייפול');
      w.render();
      t.has(w.document.getElementById('nav').innerHTML, 'ngrp side', 'הסרגל לא נבנה אחרי ערך פגום');
      w.localStorage.removeItem(w.B62_PINS_KEY);
      w.B62_PINS = null;
    },

    'לחיצה על מסך בקטגוריה מנווטת (R7)': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.b62NavPinsSave(['כוח אדם']);
      w.go('dash');
      const g = w.document.querySelector('#nav .ngrp.side[data-g="כוח אדם"]');
      const btns = g.querySelectorAll('.gbody .nitem');
      t.ok(btns.length >= 3, 'פריטי הקטגוריה חסרים');
      H.click(w, btns[0]);
      t.eq(w.VIEW, 'staff', 'לחיצה על מסך בקטגוריה נעוצה לא ניווטה');
    },

    'מונה המסכים מוצג בכל קטגוריה — שום מידע לא נעלם': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.b62NavPinsSave([]);
      w.go('dash');
      const g = w.document.querySelector('#nav .ngrp.side[data-g="מכירות ומשלוחים"]');
      const cnt = g.querySelector('.gcnt');
      t.ok(!!cnt, 'מונה המסכים חסר — קטגוריה מכווצת נראית ריקה');
      t.eq(cnt.textContent, '5', 'המונה אינו תואם למספר המסכים בקטגוריה');
    },

    'תפקיד מצומצם — רק הקטגוריות שיש בהן מסך מותר': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מכבסה', srv);
      const html = w.document.getElementById('nav').innerHTML;
      t.hasNot(html, "go('payroll')", 'מסך שכר דלף לתפקיד מכבסה');
      t.hasNot(html, "go('audit')", 'יומן פעולות דלף לתפקיד שאינו מנהל');
      /* ⚠ "כוח אדם" כן מוצגת למכבסה — נוכחות מותרת לה. הקטגוריה שכל מסכיה
         אסורים לה היא "רכש וכספים". זה אומת מול allowedViews בקוד החי. */
      t.hasNot(html, 'data-g="רכש וכספים"', 'קטגוריה שכל מסכיה אסורים עדיין מוצגת');
      t.hasNot(html, 'data-g="מערכת"', 'קטגוריית המערכת דלפה לתפקיד מכבסה');
      t.has(html, 'data-g="כוח אדם"', 'נוכחות מותרת למכבסה והקטגוריה שלה נעלמה');
    },

    'B62 אינו נכנס למצבי הניווט האחרים (R4)': (t, { w, srv, H }) => {
      H.setWidth(w, 1000);
      H.login(w, 'מנהל', srv);
      w.render();
      const html = w.document.getElementById('nav').innerHTML;
      t.hasNot(html, 'gbody', 'הקיפול של B62 דלף לתפריט 900–1099 — R4');
      t.has(html, 'gmenu', 'החלונית של תפריט B47 נעלמה');
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

    /* ===== canary ===== */

    'canary עודכן ל-B62 בשני המקומות': (t, { H }) => {
      const s = H.indexSrc();
      const inHtml = (s.match(/גרסה\s+(v[\d.]+-B\d+[a-z]?)/) || [])[1];
      const inJs = (s.match(/B61_CANARY\s*=\s*'([^']+)'/) || [])[1];
      t.eq(inHtml, inJs, 'שני ה-canary אינם תואמים');
      t.eq(inJs, 'v4.61-B62', 'ה-canary לא עודכן ל-B62');
    },

    'שכבה 2 קיבלה את הטענות של B62': (t, { w, srv, H }) => {
      H.login(w, 'מנהל', srv);
      const names = w.b61Tests().map(x => x.n).join(' | ');
      ['סרגל הצד נכנס לגובה החלון בלי גלילה',
       'נעיצת קטגוריות נשמרת ונקראת חזרה',
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

    'הבדיקה העצמית אינה משאירה זבל ב-localStorage': (t, { w, srv, H }) => {
      H.setWidth(w, 1422);
      H.login(w, 'מנהל', srv);
      w.b62NavPinsSave(['ארגון']);
      w.b61Run();
      w.B62_PINS = null;
      t.eq(w.b62NavPins().join(','), 'ארגון',
        'הבדיקה העצמית דרסה את הנעיצות של המשתמש במקום להחזיר אותן');
    }

  }
};
