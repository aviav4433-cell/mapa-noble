/* MAPA-NOBLE — Service Worker
   B18: שלד PWA, קריאה בלבד במצב אופליין.
   B28 (תיקון): המטמון היה cache-first, ולכן אחרי כל העלאה לריפו הפתיחה
   הראשונה בטלפון הציגה את הגרסה הישנה והחדשה נטענה רק בפתיחה הבאה.
   מעתה index.html והדף הראשי ו-manifest.json עוברים ב-network-first:
   קודם מנסים רשת, ורק אם אין רשת נופלים למטמון. האייקונים נשארים
   cache-first (הם לא משתנים ואין טעם לשלם עליהם קריאת רשת).
   בקשות ה-API של Apps Script (POST) לא עוברות דרך כאן כלל. */

var CACHE_NAME = 'mn-shell-v2';   // B28: העלאת גרסה מנקה את המטמון הישן
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

// האם זה קובץ שחייב להיות תמיד מעודכן (הממשק עצמו)?
function isFreshFirst(url){
  var path = url.pathname;
  if(url.search) return true;                       // ?portal=1 / ?shop=1 וכו'
  if(/\/$/.test(path)) return true;                 // הדף הראשי
  if(/index\.html$/.test(path)) return true;
  if(/manifest\.json$/.test(path)) return true;
  return false;
}

self.addEventListener('fetch', function(event){
  var req = event.request;

  // בקשות כתיבה/API (תמיד POST אל Apps Script) — ישירות לרשת, בלי מטמון.
  if (req.method !== 'GET'){
    return; // לא מתערבים כלל — הדפדפן מטפל כרגיל
  }

  var url = new URL(req.url);
  if (url.origin !== self.location.origin){
    // משאבים חיצוניים (למשל גופנים) — רשת, בלי הפרעה
    return;
  }

  if (isFreshFirst(url)){
    // B28: network-first — תמיד הגרסה החדשה כשיש רשת, מטמון רק כגיבוי אופליין
    event.respondWith(
      fetch(req).then(function(res){
        if (res && res.ok){
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
        }
        return res;
      }).catch(function(){
        return caches.match(req).then(function(cached){
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // שאר משאבי השלד (אייקונים) — cache-first עם רענון ברקע
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
