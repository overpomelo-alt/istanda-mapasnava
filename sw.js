/* sw.js — Istanda Takiscipanan PWA Service Worker
   原則:相對路徑 / JS-CSS 不預快取 / 動態資料 network-only / cache 前綴 istanda-cache-
   bump 規則:改前端 ?v= 時,CACHE_VERSION 同步 +1
*/
const CACHE_VERSION = 'istanda-v27';
const CACHE_NAME = `istanda-cache-${CACHE_VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './member.html',
  './manifest.json',
  './favicon.ico',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon-180.png',
  './icons/favicon-32.png'
];

// 安裝:只預快取殼 + 圖示(不含 JS/CSS)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        CORE_ASSETS.map(url =>
          fetch(url, { cache: 'no-cache' }).then(res => {
            if (!res.ok) throw new Error(url + ' ' + res.status);
            return cache.put(url, res);
          }).catch(err => console.warn('[SW] 跳過', url, err.message))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// 啟用:只清掉自己前綴的舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names.filter(n => n.startsWith('istanda-cache-') && n !== CACHE_NAME)
             .map(n => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

// 第三方 / 動態:SW 完全不碰
const SKIP_HOSTS = [
  'firestore.googleapis.com',
  'script.google.com',
  'script.googleusercontent.com',
  'firebaseio.com',
  'firebaseapp.com',
  'firebasestorage.app',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'gstatic.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
  'line.me'
];

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (SKIP_HOSTS.some(h => url.hostname.includes(h))) return; // network-only
  if (event.request.method !== 'GET') return;                  // 不碰 POST(上傳)
  if (url.origin !== self.location.origin) return;             // 只處理自家

  const p = url.pathname;
  const networkFirst = p.endsWith('.js') || p.endsWith('.css') ||
                       p.endsWith('.html') || event.request.mode === 'navigate';

  if (networkFirst) {
    // 網路優先:程式/頁面永遠拿最新,離線才回退快取
    event.respondWith(
      fetch(event.request).then(res => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      }).catch(() =>
        caches.match(event.request).then(hit => hit || caches.match('./index.html'))
      )
    );
    return;
  }

  // 其餘(圖示等):快取優先
  event.respondWith(
    caches.match(event.request).then(hit => hit ||
      fetch(event.request).then(res => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      }).catch(() => event.request.mode === 'navigate' ? caches.match('./index.html') : undefined)
    )
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
