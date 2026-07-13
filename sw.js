/* MAPA-NOBLE — Service Worker
   B18: שלד PWA, קריאה בלבד במצב אופליין.
   מטמון app shell בלבד (index.html, manifest, אייקונים).
   בקשות לשרת ה-API (Apps Script) עוברות תמיד ישירות לרשת —
   אין ניסיון למטמן תשובות POST של ה-API כאן; נתוני המסלול של הנהג
   נשמרים בצד הממשק (localStorage) בכל טעינה מוצלחת של getAll,
   וזו הדרך שבה מסך הנהג ממשיך להציג נתונים במצב אופליין.
   שינוי גרסת המטמון (CACHE_NAME) מנקה מטמון ישן בכל פריסה חדשה. */

var CACHE_NAME = 'mn-shell-v1';
var SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(SHELL_FILES);
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  var req = event.request;

  // בקשות כתיבה/API (תמיד POST אל Apps Script) — ישירות לרשת, בלי מטמון.
  if (req.method !== 'GET'){
    return; // לא מתערבים כלל — הדפדפן מטפל כרגיל
  }

  var url = new URL(req.url);
  var isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin){
    // משאבים חיצוניים (למשל גופנים) — רשת, בלי הפרעה
    return;
  }

  // app shell — cache-first עם עדכון ברקע (stale-while-revalidate)
  event.respondWith(
    caches.match(req).then(function(cached){
      var network = fetch(req).then(function(res){
        if (res && res.ok){
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
        }
        return res;
      }).catch(function(){ return cached; });
      return cached || network;
    })
  );
});
