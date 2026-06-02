# task-pwa.md — PHASE 6 / Task 6:PWA + 家族試用

## 目標
讓 Istanda 能「加到主畫面」像 App、重複載入更快、離線時顯示殼而非瀏覽器當機頁、順手解掉 favicon 404。
**不追求**離線瀏覽 feed(Firestore 即時資料本來就需要網路)。
核心驗收:長輩能照引導裝到主畫面;裝完後仍能正常錄音 / 上傳 / 看 feed。

## 鐵則(沿用別專案已驗教訓 + 本專案架構)
1. **路徑全用相對 `./`**:本站是 project page `/istanda-mapasnava/`,絕不可用根路徑 `/` 開頭(否則裝完開 App 落到 404)。
2. **JS/CSS 不預快取**:install 只快取殼與圖示;JS/CSS 走 fetch hook 動態(避免 install 時抓到 CDN 邊緣舊版永久卡死 = 別專案 v4 慘案的根因)。
3. **動態資料一律 network-only,SW 完全不碰**(見 skip 清單)。
4. **cache 前綴 `istanda-cache-`**,activate 只刪自己前綴 → 與任何別專案零碰撞,同不同帳號都安全(此題不必再查)。

## 現況(CC 已查,2026-06-01)
- 無 sw.js、無 manifest.json、無任何 SW 註冊 / controllerchange。乾淨起點。
- App shell 實檔 **5 個**:`index.html`、`member.html`、`style.css`、`script.js`、`post-likes.js`。
- **無 `icons/`、無 `favicon.ico`、無任何圖示** → 要先生出(見 Step 0)。
- 媒體經 Apps Script 代理回 base64 → `data:` URL,不發網路請求、SW 不攔。
- `?v=` 現行 **v=8**,5 個引用點(index:9/141、member:13/1144、script.js:16 import)。
- 動態端點:Apps Script = `script.google.com`(GET `?id=` + POST,POST 會 302 到 `script.googleusercontent.com`);Firestore = `firestore.googleapis.com`。

---

## 執行順序
Step 0(圖示)是前置。若 `icons/source.png` 不存在 → **先停下回報,向 Tien 要手繪 logo 來源圖**,不要自行生圖。其餘 Step 1–5 可先做。

---

## Step 0 — 圖示(前置,卡關項)
**來源由 Tien 提供**:正方形、≥512px 的 `icons/source.png`(或 SVG)。CC 只做縮放/補底,**不可自行設計或生成圖案**。

需產出(放 `icons/`,`favicon.ico` 放 repo 根):
- `icon-192.png` 192×192
- `icon-512.png` 512×512
- `icon-maskable-512.png` 512×512(logo 縮到約 80% 置中 + 安全區留邊,避免被 Android 圓角裁切)
- `apple-touch-icon-180.png` 180×180(iOS 不吃透明,要鋪不透明底)
- `favicon-32.png` 32×32
- `favicon.ico`(repo 根,解 404)

**底色一律非紅**(紅色不作大面積結構色);預設白底,Tien 可改其他非紅色。

ImageMagick 範例(CC 先確認 `magick` 是否在 Windows 環境;沒有就改用 node sharp 或其他工具,輸出規格相同即可):
```
magick icons/source.png -resize 192x192 icons/icon-192.png
magick icons/source.png -resize 512x512 icons/icon-512.png
magick icons/source.png -resize 32x32  icons/favicon-32.png
magick icons/source.png -resize 180x180 -background white -flatten icons/apple-touch-icon-180.png
magick icons/source.png -resize 410x410 -background white -gravity center -extent 512x512 icons/icon-maskable-512.png
magick icons/source.png -define icon:auto-resize=16,32,48 favicon.ico
```

---

## Step 1 — `manifest.json`(repo 根)
```json
{
  "name": "Istanda Takiscipanan",
  "short_name": "Istanda",
  "lang": "zh-Hant",
  "start_url": ".",
  "scope": ".",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#FFFFFF",
  "theme_color": "#FFFFFF",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```
`start_url`/`scope` 用 `"."`(相對),勿用 `"/"`。`theme_color` 可由 Tien 改(勿大面積紅)。

---

## Step 2 — `sw.js`(repo 根)
```javascript
/* sw.js — Istanda Takiscipanan PWA Service Worker
   原則:相對路徑 / JS-CSS 不預快取 / 動態資料 network-only / cache 前綴 istanda-cache-
   bump 規則:改前端 ?v= 時,CACHE_VERSION 同步 +1
*/
const CACHE_VERSION = 'istanda-v8';
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
```

---

## Step 3 — 註冊 + 自動更新(`index.html` 與 `member.html` 各加一份)
放在 `</body>` 前(**非 module 的 inline `<script>`**,兩頁都要):
```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then(reg => {
        reg.update();
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update();
        });
      }).catch(e => console.error('[SW] 註冊失敗', e));
    });
    // 新版 SW 接管 → 自動 reload(解「要清資料才看到新版」)
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      location.reload();
    });
  }
</script>
```
> 注意:首次安裝 SW 時 `controllerchange` 會觸發一次、頁面會自動重整一下,屬正常。

---

## Step 4 — head 標籤(`index.html` 與 `member.html` 各加)
```html
<link rel="manifest" href="./manifest.json">
<meta name="theme-color" content="#FFFFFF">
<link rel="icon" href="./favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="./icons/favicon-32.png">
<link rel="apple-touch-icon" href="./icons/apple-touch-icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Istanda">
```

---

## Step 5 — 安裝引導頁 `install.html`(iOS / Android 分流)
文字為操作說明(中文,非布農語);**截圖由 Tien 在真機拍**,放 `guide/ios-1.jpg`、`guide/android-1.jpg`(可多張)。樣式可依 `style.css` / visual-direction-v2 再調,**勿大面積紅**。在 `index.html` 加一個小入口連結(如「📲 安裝到桌面」,位置 Tien 決定)。
```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>把 Istanda 加到手機桌面</title>
<link rel="stylesheet" href="./style.css?v=8">
<style>
  .guide { max-width: 640px; margin: 0 auto; padding: 24px 18px 64px; }
  .guide h1 { font-size: 1.5rem; }
  .guide ol { font-size: 1.15rem; line-height: 1.9; padding-left: 1.4em; }
  .guide .warn { background:#FFF7E0; border-left:5px solid #E0A800; padding:12px 14px; border-radius:8px; margin:16px 0; font-size:1.05rem; }
  .guide img { width:100%; border:1px solid #ddd; border-radius:10px; margin:8px 0 20px; }
  .guide .tab { display:flex; gap:8px; margin-bottom:8px; }
  .guide .tab button { flex:1; padding:12px; font-size:1.05rem; border-radius:10px; border:1px solid #ccc; background:#fff; }
  .guide .tab button.on { background:#1F3A5F; color:#fff; } /* 深藍,非紅 */
  .panel { display:none; } .panel.on { display:block; }
</style>
</head>
<body>
<div class="guide">
  <h1>把「Istanda」加到手機桌面</h1>
  <p>加到桌面後,點圖示就能直接打開,跟一般 App 一樣。</p>

  <div class="tab">
    <button id="bi" class="on" onclick="sw('i')">iPhone</button>
    <button id="ba" onclick="sw('a')">Android</button>
  </div>

  <div id="pi" class="panel on">
    <div class="warn">⚠️ 一定要用 <b>Safari</b> 打開這個網頁(從 LINE 點進來不行)。</div>
    <ol>
      <li>用 Safari 打開網站</li>
      <li>點畫面<b>最下方</b>中間的「分享」鈕(方框 + 向上箭頭)</li>
      <li>往下滑,找到「<b>加入主畫面</b>」並點它</li>
      <li>右上角點「<b>加入</b>」</li>
      <li>回到桌面,就會看到 Istanda 圖示</li>
    </ol>
    <img src="./guide/ios-1.jpg" alt="iPhone 步驟圖(待補)">
  </div>

  <div id="pa" class="panel">
    <div class="warn">⚠️ 用 <b>Chrome</b> 打開這個網頁(從 LINE 點進來請先改用 Chrome 開)。</div>
    <ol>
      <li>用 Chrome 打開網站</li>
      <li>點右上角「<b>⋮</b>」選單</li>
      <li>選「<b>安裝應用程式</b>」或「加到主畫面」</li>
      <li>點「安裝」/「加入」</li>
      <li>回到桌面,就會看到 Istanda 圖示</li>
    </ol>
    <img src="./guide/android-1.jpg" alt="Android 步驟圖(待補)">
  </div>
</div>
<script>
  function sw(t){
    var i = t === 'i';
    document.getElementById('pi').classList.toggle('on', i);
    document.getElementById('pa').classList.toggle('on', !i);
    document.getElementById('bi').classList.toggle('on', i);
    document.getElementById('ba').classList.toggle('on', !i);
  }
</script>
</body>
</html>
```

---

## 驗收
- DevTools → Application:manifest 有效、SW 註冊成功、圖示載入、Lighthouse 顯示 installable。
- **Android Chrome**:出現安裝橫幅 / 選單可安裝 → 裝到主畫面 → 開啟為 standalone(無網址列)。
- **iOS Safari**:分享 → 加入主畫面 → 圖示正確(apple-touch-icon)→ 開啟 standalone。
- ⚠️ **iOS standalone 實機錄音測試**:裝到主畫面後開 App → 錄音 → 上傳 → 播放,全程 OK。(歷史上 standalone 模式曾有 getUserMedia 失效 bug,**務必真機驗**,別只在 Safari 分頁測。)
- **斷網重整**:不是瀏覽器錯誤頁,殼能載入(feed 空白可接受)。
- favicon 404 消失。
- **自動更新**:bump 一次 `?v=` + `CACHE_VERSION`,手機 PWA 重開能自動拿到新版(controllerchange reload),不需清資料。
- SchoolApp 不受影響。

## bump 規則(以後改前端)
5 個 `?v=` 點 + `sw.js` 的 `CACHE_VERSION` 一起 +1(例:`v=9` / `istanda-v9`)。
有網路時 JS/CSS 走 network-first 本就會更新;`CACHE_VERSION` 主要用來強制刷殼/圖示、觸發 SW 更新生命週期。

## 備註
- 裝 PWA **不改變 LINE 連結行為**(LINE 連結仍開在 LINE 內建瀏覽器)。下一步的 `#post=` 深連結要在「一般瀏覽器」能落地才是關鍵,與 PWA 無關,分開驗。
- 本任務不動 `script.js` / `post-likes.js` / `style.css`,故 `?v=` 維持 v=8、`CACHE_VERSION` 對齊 `istanda-v8`。
