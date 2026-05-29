markdown# Task 5: 照片貼文 + 首頁 Feed(主軸轉移)

> 給 Claude Code 的標準工作指令。
> 開頭請讀:specs/coding_principles.md、specs/current-status.md、specs/north-star.md、specs/task-recording-core.md、specs/task-line-share.md(對齊格式)
> 遵守規則 10:先 Recon、後動工、每個 Step 之間等使用者回「ok」。
>
> **狀態:第一層 Recon 完成、10 題拍板 + 4 條接手對話框補充拍板、Claude Code 動工 Step 1 前需先跑 Step 0 第二層 Recon**

---

## 🎯 任務目標

把這個 App 從「**錄音為主**」轉換成「**照片 + 可選配音**」為主。

具體變化:
- 新增 `posts` collection、每篇 post 含 1-9 張照片 + 可選配音 + caption
- Apps Script 改造:接受 jpg/png、每人專屬 Drive 子資料夾
- 首頁 Feed source 從 placeholder 切到 posts collection、IG 風卡片
- **首頁拿掉 v0 Stories 列**(主軸轉移後不再需要)、變成 Hero + Feed 兩層
- 個人頁面 `member.html` 加 tab[貼文 / 純錄音]
- LINE 分享 deep link 從 `#rec=` 擴增 `#post=`、落點首頁
- 舊 `recordings` collection 保留不動、變成「歷史純錄音」

---

## 🌟 北極星對齊

來自 `north-star.md` 第一層瞬間:

> 你按上傳。
> 3 秒後 LINE 家族群組跳通知 ——
> 小Iman(在台北唸書):「啊啊啊我哭了 ❤️」

Task 4 跑通的是「LINE 通知」+「點 link 回 App」。Task 5 要讓上面那個「**按上傳**」變成「**選照片 + 寫一行字 + 配音(可選)**」、降低門檻、讓不錄音的 87 人也願意發。

設計判準:
- ✅ **照片優先 flow**:大部分人發貼文是先有照片、配音是附加
- ✅ **2 tap 內進入發文流程**:首頁就有入口、不藏深
- ✅ **iOS 阿嬤手機跑得動**:Step 2a 必驗 iPhone 實機
- ✅ **舊功能不壞**:Task 1-4 的錄音 / 按讚 / 留言 / LINE 分享、Task 5 不能弄壞

---

## 📦 環境資訊

### 不動的東西

- ❌ **不動 Task 1-4 的核心 code**(recordings 集合、按讚 / 留言 / LINE 分享):只新增、不修改
- ❌ **不動 `recordings` collection schema**:舊資料保留、變成「歷史純錄音」
- ❌ **不動 v0 首頁 Hero 區結構**(山稜剪影、白底)

### 要動的東西

- ✅ **Apps Script**:接受 jpg/png mimeType、每人專屬資料夾邏輯、聖瑱師手動部署
- ✅ **Firestore schema**:新增 `posts` collection + `members.driveFolderId` + `members.postCount`
- ✅ **member.html**:加 tab 切換、加「📷 發貼文」入口、加照片選 / 壓縮 / 上傳
- ✅ **index.html / script.js**:**拿掉 Stories 列**、Feed source 切到 posts、卡片 UI 重做
- ✅ **style.css**:新增 `.post-card__*`、`.tab__*`、`.photo-grid__*` namespace
- ✅ **新建 Drive 母資料夾**:`istanda-mapasnava-members/`(聖瑱師親手建)

### 視覺(沿用 v2、白底 + Bunun 五色)

- 全部用 CSS 變數
- 照片網格用 CSS `grid-template-columns: repeat(3, 1fr)`、3x3 上限
- 卡片底色純白、邊框 `var(--border)` 淡灰
- ↗️ 分享鈕、❤️ 愛心、💬 留言:複用 Task 3-4 的 `.recording-row__action` namespace、保持視覺一致
  - ⚠️ **(Step 0 確認 6.4)`.recording-row__action` 的 CSS 在 member.html 的 inline `<style>`、不在 style.css**。首頁(index.html 用外部 style.css)卡片要套用、須把規則**搬進 style.css**、或新建 `.post-card__action` namespace。直接在 index.html 寫 class 名不會生效。`:root` 變數(--accent / --border 等)在 style.css、兩頁共用、沒問題。
- 配音播放鈕:複用 Task 1 的試聽鈕樣式

### 分享技術棧

- 沿用 Task 4 的 navigator.share + Popover fallback
- Deep link URL 改為 `index.html#post={postId}`(不是 member.html)
- handleDeepLink 邏輯複用 Task 4、改 selector

---

## ✅ 第一層 Recon 拍板結果

### 主拍板(2026-05-27 上午)

| # | 問題 | 拍板 |
|---|---|---|
| Q1(a) | 一篇 post 幾張照片? | **1-9 張**(3x3 grid) |
| Q1(b) | 配音欄位名? | **`audioFileId`** |
| Q1(c) | 舊 `recordings` 集合? | **保留不動**、歷史純錄音 |
| Q2 | Drive 命名? | **`name_docId`**(例:`Cina Umav_2l95Zhad`、name 是布農拼音含空格) |
| Q2 | 母資料夾? | **新建 `istanda-mapasnava-members/`** |
| Q3 | 配音入口? | **照片優先 flow**:📷 → 選照片 → 預覽 → 可選配音 → caption → 發 |
| Q4 | 首頁顯示? | **只 posts**、recordings 退個人頁 tab |
| Q5 | 個人頁? | **Hero + tab[貼文 / 純錄音]** |
| Q6(a) | Deep link 落點? | **首頁那篇** |
| Q6(b) | URL 格式? | **`index.html#post={postId}`** |
| Q7 | 照片壓縮? | **全壓縮**:canvas 1080px / 80% JPEG + EXIF + HEIC 處理 |

### 接手對話框補充拍板(2026-05-27 中午、Q-A 到 Q-E)

| # | 問題 | 拍板 |
|---|---|---|
| Q-A | EXIF 處理用 library 還是自寫? | **自寫 minimal EXIF reader**、只讀 0x0112 orientation marker、約 30-50 行 JS |
| Q-B | 首頁 Stories 列怎麼處理? | **整顆拿掉**、首頁變 Hero + Feed 兩層、members.html 列表頁延後到 6/15 後依家人回饋再評估 |
| Q-C | 9 張照片上傳策略? | **逐張 sequential**、`for await`、非 `Promise.all`、非 batch、單張獨立壓縮獨立 POST |
| Q-D | Task 1 錄音 UI 嵌入 vs 另開? | **Step 0 後決定**、Claude Code 偵察 Task 1 UI 體積後給建議再拍 |
| Q-E | 舊 recordings/ 資料夾遷移? | **不遷**、6/15 前聖瑱師手動清除試錄音、清完後路徑分裂自然消失 |

---

## 📋 規格細節

### 1. Firestore Schema

#### 新增 `posts` collection

```javascript
posts: {
  // docId 自動生成
  {postId}: {
    memberId: "2l95Zhad...",
    photos: [
      { fileId: "1ABC...", filename: "1747890123.jpg" }
    ],
    audioFileId: "1XYZ..." | null,
    text: "今天去爬山",
    createdAt: timestamp,             // ⚠️ 用 serverTimestamp、不用 client Date
    likes: ["deviceId1", "deviceId2"],
    comments: [
      { deviceId, memberId, authorName, text, createdAt }
    ]
  }
}
```

#### 修改 `members` collection(加兩個欄位)

```javascript
members: {
  {memberDocId}: {
    // 原有:name / nickname / role / initials / recordCount
    driveFolderId: "1FOLDER..." | null,
    postCount: 0
  }
}
```

#### `recordings` collection — 不動

保留原樣、變成「歷史純錄音」、個人頁 tab 第二頁顯示。

---

### 2. Apps Script 改造

#### doPost 改造

接受新 mimeType:
```javascript
const SUPPORTED_TYPES = {
  'audio/webm': '.webm',
  'audio/mp4': '.m4a',
  'audio/mp3': '.mp3',
  'image/jpeg': '.jpg',  // 新增
  'image/png': '.png',   // 新增
};
```

#### 每人專屬資料夾邏輯

```javascript
// 偽碼、Claude Code 第二層 Recon 後寫實作
function getMemberFolder(memberId, memberName) {
  // 1. 查 Firestore members.{memberId}.driveFolderId
  // 2. 有 → 直接用
  // 3. 沒有 → DriveApp.createFolder() in 母資料夾、回寫 Firestore
  // 4. 返回 folder

  // ⚠️ 母資料夾 ID:聖瑱師親手建後填進 Apps Script 常數
  // 例:const ROOT_FOLDER_ID = 'XXXX_NEW_FOLDER_ID_XXXX';
}
```

母資料夾命名:`istanda-mapasnava-members/`
子資料夾命名:`{name}_{docId 前 8 碼}`(例:`Cina Umav_2l95Zhad`)

> ⚠️ **D5 拍板(Step 0)**:`members.name` 是布農族名拼音、含空格(seed 兩筆:`Cina Umav` / `Tama Iman`),不是中文。Drive 接受含空格資料夾名,Apps Script `createFolder` 直接傳 `${name}_${docId.slice(0,8)}` 即可。spec 早期範例 `林惠卿_2l95Zhad`(虛構中文)已修正。

#### Apps Script 部署流程

**聖瑱師親手做**:
1. 開 Apps Script 編輯器(找 istanda-mapasnava-receiver)
2. 改 code(對照 Step 1 spec)
3. **管理部署作業 → 編輯 → 版本選新版本 → 部署**
4. 確認新 URL 跟舊 URL **一樣**

---

### 3. 照片壓縮(Step 2a 核心、iOS 必驗)

#### 壓縮流程(自寫 EXIF、Q-A 拍板)

```javascript
async function compressPhoto(file) {
  // 1. 讀 EXIF orientation marker 0x0112(自寫、不引 exif-js)
  const orientation = await readExifOrientation(file);
  // 自寫範圍:讀檔頭 ~30-50 bytes、找 0xFFE1 marker → IFD0 → 0x0112 tag
  // 預期 30-50 行 JS、不引第三方

  // 2. 讀進 
  const img = await fileToImage(file);

  // 3. 計算縮放尺寸(長邊縮到 1080px、保比例)
  const { width, height } = computeResizeDimensions(img, 1080);

  // 4. 建 canvas、依 EXIF 旋轉
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  applyOrientation(ctx, orientation, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  // 5. 輸出 JPEG 80%
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null')),
      'image/jpeg',
      0.8
    );
  });
}
```

#### iOS 坑處理清單(Step 2a 必驗)

| 坑 | 處理 |
|---|---|
| EXIF 旋轉(iPhone 直立照片) | 自寫讀 0x0112 marker、ctx 轉向再畫 canvas |
| HEIC 格式 | `<input accept="image/*">` iOS 13+ 自動轉 JPEG;偵測檔名 .heic 跳訊息「請選 JPG」 |
| canvas.toBlob 回傳 null | 加 reject 處理、上層 catch 跳 toast「這張照片無法處理、請換一張」 |
| iPhone 記憶體爆 | 一張一張壓(`for await`)、不要 `Promise.all` |
| 阿嬤 iPhone 7/8 老機 | 一張壓完 release canvas + img、`canvas.width = canvas.height = 0` |

---

### 4. 發貼文 UI flow(照片優先)

#### 入口

**首頁(index.html)**:Stories 列已拿掉、發貼文入口改為「首頁 floating 按鈕」**(預設浮在右下角的 📷 鈕)**、點下去開發貼文 modal。

`member.html` Hero 區下方**也保留**一個「📷 發貼文」入口(因為個人頁也想發、不一定每次都回首頁):
member.html Hero 下方:
[ 🎙 錄一段話 ]  [ 📷 發貼文 ]
(Task 1 舊)    (Task 5 新)

#### 發貼文 modal(全螢幕、不是 bottom sheet)
┌─────────────────────────────────┐
│ ✕                  發貼文  →   │  ← header(發送鈕灰色直到照片有 + caption 寫東西)
├─────────────────────────────────┤
│                                 │
│  [+]  [+]  [+]                  │  ← 照片網格 3x3、點 + 選照片、點縮圖刪
│  [+]  [+]  [+]                  │
│  [+]  [+]  [+]                  │
│                                 │
│  ─────────────────────          │
│                                 │
│  💬 寫點什麼...                  │  ← caption textarea
│                                 │
│  ─────────────────────          │
│                                 │
│  🎙 加配音(可選)                 │  ← Q-D 拍板:嵌入 modal、用獨立配音器小工具
│                                 │
└─────────────────────────────────┘

#### 配音器(Q-D 拍板:嵌入發貼文 modal + 獨立小工具)

**Step 0 量測**:Task 1 錄音 capture+試聽 UI 體積 ≈ 20 行 DOM + 154 行 JS、總 < 200 行 → 嵌入發貼文 modal(不另開層)。

**但有碰撞坑**:現有錄音狀態機用 module 層級單一 `mediaRecorder` / `recordedBlob`,而 member.html 頁面上本來就有一個「🎙 錄一段話」錄音區。發貼文 modal 的配音若共用那組全域變數,會跟頁面錄音搶同一份狀態(錄到一半開 modal 配音 → 互相洗掉)。

**拍板做法(規則 11:抽小工具、舊頁面錄音器一行不動)**:

- 配音器抽成小工具 `createRecorder(elements, options)`、回傳 `{ start, stop, getBlob, reset, getState }`
- 暫時 inline 在 member.html、跟現有錄音器同檔
- 配音器用**獨立 `voiceRecorder` 變數組 + 獨立 DOM id**、**不共用**頁面那組全域 `mediaRecorder` / `recordedBlob` / `recordedExt`
- 舊頁面「🎙 錄一段話」錄音器一行不動(規則 1:運作正常的舊 code 不回頭重構)
- 6/15 死線優先;Step 3 首頁(index.html / script.js)也要發貼文 modal 用配音器時、**再評估**是否把 `createRecorder` 抽成獨立檔給兩頁共用(對齊 S0-6 YAGNI,不提前抽)

#### 上傳進度(Q-C + D1 拍板:逐張 sequential + claimed-set 差集)

> ⚠️ **D1 衝突(Step 0 flag)**:9 張照片若沿用 Task 1 單檔上傳的「POST blind → GET ?action=list → 取 myFiles[0] 最新」,會出事 —— 9 張 filename 都是 `{memberId}.jpg`、同分鐘上傳時間戳全同,`myFiles[0]` 只回一個,無法分辨第 N 張對應哪個 fileId。
> **解法:claimed-set 差集**(下面迴圈),不是「取最新」。

```javascript
// 逐張壓縮 + 上傳、序列、claimed-set 差集回填 fileId(D1 拍板)
const claimed = [];           // 前 N-1 張已拿到的 fileId
const uploadedFileIds = [];
let current = 1;

for (const photo of selectedPhotos) {
  // 1. 壓縮第 N 張(獨立 5MB 預算)
  updateProgress(`壓縮中 ${current}/${total}`);
  const compressed = await compressPhoto(photo);

  // 2. POST blind(跨域 redirect 拿不到 response body、不解析)
  updateProgress(`上傳中 ${current}/${total}`);
  await postToAppsScript(compressed);          // 單張 POST、不取回傳

  // 3.(可選)sleep 300ms 降 race、給 Drive 寫入緩衝
  await new Promise(r => setTimeout(r, 300));

  // 4-7. GET ?action=list → 找第一筆不在 claimed 裡的 fileId、retry 最多 3 次
  const fileId = await claimNewFileId(memberId, claimed);  // 見下方
  claimed.push(fileId);
  uploadedFileIds.push(fileId);
  current++;
}
// 9 張照片就跑 9 次、序列、絕對不用 Promise.all

// 差集回填:GET list、取第一筆不在 claimed 的 fileId、retry 3 次間隔 500ms
async function claimNewFileId(memberId, claimed) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const listResp = await fetch(`${APPS_SCRIPT_URL}?action=list`);
    const listData = await listResp.json();
    const myFiles = listData[memberId] || [];
    // 找第一筆「還沒被 claim」的(差集),非「取最新」
    const fresh = myFiles.find(f => f.fileId && !claimed.includes(f.fileId));
    if (fresh) return fresh.fileId;
    if (attempt < 3) await new Promise(r => setTimeout(r, 500));
  }
  // 三次 retry 仍找不到 → throw、整個 post 失敗
  throw new Error(`第 ${current} 張上傳失敗、claimed 差集找不到 fileId`);
}
```

**失敗處理(D1 拍板)**:
- 第 N 張差集找不到 → retry GET 最多 3 次、間隔 500ms
- 仍找不到 → `throw`、整個 post 失敗、**modal 不關**、提示「第 N 張上傳失敗、請再試」

之後配音上傳(若有)、寫 Firestore posts + members.postCount + members.driveFolderId、關 modal。

#### 樂觀 UI

- 發送中不要關 modal、按鈕變「上傳中... 1/9」
- 上傳完才關 modal、避免「按了沒反應」感

---

### 5. 首頁 Feed(IG 風卡片、無 Stories 列)

#### 首頁結構(Q-B 拍板:拿掉 Stories)
┌────────────────────────────────────┐
│ Hero(山稜剪影、白底、不動)        │
├────────────────────────────────────┤
│ [📷 floating btn 右下]              │  ← 發貼文入口
│                                     │
│ Post Card 1                         │
│ Post Card 2                         │  ← Feed、無限滾動
│ Post Card 3                         │
│ ...                                 │
└────────────────────────────────────┘

**注意**:v0 留下的 Stories 列(包括「我的記事」第一顆 + 87 人頭像)、整顆 DOM 拿掉。

#### Feed source

```javascript
// script.js
onSnapshot(
  query(collection(db, 'posts'), orderBy('createdAt', 'desc')),
  snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') prependPostCard(change.doc);
      if (change.type === 'modified') updatePostCard(change.doc);
      if (change.type === 'removed') removePostCard(change.doc.id);
    });
  }
);
```

#### Post card 結構
┌───────────────────────────────────┐
│ [頭像] 林惠卿(媽媽)    · 3 小時前   │  ← header、頭像點下去跳 member.html
├───────────────────────────────────┤
│                                   │
│         [ 大照片 ]                │  ← 主照片(1-9 張時 swipe 切換)
│                                   │
│  ● ○ ○ ○                          │  ← 多張時的小點點
├───────────────────────────────────┤
│ ❤️  💬  ↗️                         │  ← 互動三鍵(沿用 Task 3-4 樣式)
│ 3 個讚 · 4 則留言                  │
├───────────────────────────────────┤
│ 林惠卿:今天去爬山                  │  ← caption(若有 audioFileId 加 🎙 按鈕)
│ 🎙 [▶ 0:34]                       │  ← 配音播放鈕(可選)
└───────────────────────────────────┘

#### 卡片 click 行為

- **點頭像 / 名字** → 跳該成員個人頁 `member.html?id={memberId}`
- **點照片** → 全螢幕看大圖(放 Step 4、若時間不夠延後)
- **點 swipe 點點** → 切照片(若 1-9 張)
- **❤️💬↗️** → 沿用 Task 3-4 邏輯(改寫 posts 不是 recordings)

---

### 6. 個人頁 tab(member.html)

#### tab UI
┌───────────────────────────────────┐
│ Hero(沿用、不動)                  │
├───────────────────────────────────┤
│ [ 🎙 錄一段話 ]  [ 📷 發貼文 ]      │  ← 兩個入口(舊 + 新)
├───────────────────────────────────┤
│ [ 📷 貼文 ]    [ 🎙 純錄音 ]       │  ← tab、預設貼文
├───────────────────────────────────┤
│                                   │
│ [貼文清單 / 純錄音清單]            │
│                                   │
└───────────────────────────────────┘

#### 切換邏輯

- 兩個 tab 都從 Firestore 撈、用 `where('memberId', '==', memberId)` filter
- 貼文 tab:`posts` collection、IG 卡片 + ❤️💬↗️
- 純錄音 tab:**沿用 Task 1 既有的 row UI 結構不動**(過去錄音清單)
- ⚠️ **tab 切換時 unsubscribe 舊 onSnapshot listener、subscribe 新的**、避免記憶體洩漏
  - **(Step 0 確認 D3)** member.html 已有現成 pattern:`recordingsListenerUnsub` module 變數、subscribe 前先 `if(unsub){unsub();unsub=null}`(member.html:1536-1538)。tab 切換照搬即可、規範可行。
- ⚠️ **(Step 0 提醒)貼文 tab 的 `where('memberId','==',X) + orderBy('createdAt','desc')` 會需要 Firestore 複合索引**、首次跑 console 會跳一條建索引連結、**聖瑱師親手點一下**建立(一次性)。

---

### 7. Deep Link(`index.html#post={postId}`)

#### URL 格式
https://overpomelo-alt.github.io/istanda-mapasnava/index.html#post={postId}

#### handleDeepLink(複用 Task 4、改 selector)

```javascript
function handleDeepLink() {
  const hash = window.location.hash;
  if (!hash.startsWith('#post=')) return;

  const targetPostId = hash.slice(6);
  if (!targetPostId) {
    showToast(MESSAGES.share.notFoundToast);
    clearHash();
    return;
  }

  const targetCard = document.querySelector(`.post-card[data-post-id="${targetPostId}"]`);
  if (!targetCard) {
    showToast(MESSAGES.share.notFoundToast);
    clearHash();
    return;
  }

  targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  targetCard.classList.add('post-card--highlighted');
  setTimeout(() => targetCard.classList.remove('post-card--highlighted'), 2000);
  clearHash();
}
```

#### MESSAGES 結構(沿用 Task 4、擴增 post 分享)

```javascript
const MESSAGES = {
  share: {
    // post 版本(Task 5 新增)
    postTitle: (name, nickname) =>
      nickname ? `${name}(${nickname})發新貼文了` : `${name} 發新貼文了`,
    postBody: (text) =>
      text ? `「${text.slice(0, 30)}」` : `來看看這篇:`,

    // recording 版本(Task 4 既有、不動)
    title: (...) => ...,
    body: (...) => ...,
    // ...
  }
};
```

---

### 8. 樂觀 UI / 錯誤處理

#### 上傳失敗時

- 壓縮失敗:單張跳「這張無法處理、移除這張繼續」、允許繼續發其他照片
- Apps Script 6MB 撞牆:**理論上單張壓縮後不會發生**(Q-C 逐張 sequential 確保 5MB 預算獨立)、加保險:單張壓縮後 > 5MB 跳 toast「照片太大、請換一張」
- 配音上傳失敗:跳「配音失敗、貼文已發但無配音」、posts 文件 `audioFileId: null`
- 整個 post 寫 Firestore 失敗:跳「貼文發送失敗、請再試」、保留 modal、不清空

#### 樂觀 UI

- 發送鈕點下去 → 立刻變「上傳中... N/M」
- onSnapshot 接到新 post → 自動 prepend 到首頁
- 不需要手動 reload Feed

---

## 🪜 Step 順序

### Step 0:第二層 Recon(Claude Code 動筆前)

**這一步 Claude Code 不寫 code、只爬 code + flag 風險**。

1. grep `script.js` 看現有 createPostCard 結構(v0 三件套留下的)、確認可複用範圍
2. grep `index.html` 看 Stories 列 DOM 結構、為 Step 3 拆除做準備
3. grep `member.html` 看 Task 1 的錄音 UI、計算 DOM 行數(供 Q-D 拍板)
4. 檢查現有 `.recording-row__action` CSS:能否複用到 post card 的 ❤️💬↗️
5. 檢查 Task 4 的 `handleDeepLink` / `clearHash` / `MESSAGES`:是否能抽成共用 module 給 Task 5 用
   - **(Step 0 結論 6.1)現況 Task 3/4 全 inline 在 member.html、script.js / index.html 一行都沒有、兩邊無共用 module。`clearHash` 是 handleDeepLink 內的 closure const、抽不出來。首頁複用 = 在 script.js 重寫一份(對齊 S0-6 YAGNI、6/15 前不強抽 module)。可無痛複用的只有 `openLine`/`copyMessage`/`fallbackCopy`/`showSharePopover`(跟資料無關那幾個)。handleShare 因依賴頁面唯一 `memberData`+URL `?id=`、首頁多作者環境必須重寫。**
6. 檢查 `members.name` 欄位實際內容(拼音 / 中文)、影響 Q2 Drive 命名邏輯
   - ✅ **(Step 0 完成)seed 兩筆 = `Cina Umav` / `Tama Iman`、布農拼音含空格、不是中文 → D5 拍板採 `name` 原樣。**
7. 檢查 `recordings.createdAt` 是否用 serverTimestamp
   - ✅ **(Step 0 完成)recordings.createdAt = `serverTimestamp()`(member.html:1253)→ posts.createdAt(doc 層)對齊用 serverTimestamp。但 posts.comments[] 內層 createdAt 仍須 client `new Date()`(arrayUnion 不接 serverTimestamp、同 Task 3 recordings.comments)。**
8. **聖瑱師親手**:在 Drive 建 `istanda-mapasnava-members/` 母資料夾、複製 folder ID
9. **回報偵察報告**、列出:
   - 找到的 class / 函式命名(spec 名 vs 真實名對照表)
   - spec 沒寫到的衝突 / 風險(逐條 + 建議拍板)
   - 建議調整的 spec 段落(行號 + 替換內容)
   - **Task 1 錄音 UI DOM 行數 + Q-D 嵌入 vs 另開層建議**
   - 確認母資料夾 ID 拿到、可寫進 Apps Script 常數

**等聖瑱師看完偵察報告 + 拍 Q-D、回 ok 才進 Step 1**。

---

### Step 1:Apps Script 改造 + 母資料夾

#### ⚠️ Step 1 動工前硬性檢查項(D2 拍板:Apps Script ?action=list 兼容性)

> **Step 0 flag**:Step 1 把上傳目標從單一 `UPLOAD_FOLDER_ID` 改成「每人專屬子資料夾」後,若 `?action=list` 仍只掃舊資料夾,會同時害到 (a) 照片 fileId 差集回填(D1)撈不到、(b) 個人頁「過去錄音清單」(member.html ?action=list)少掉新資料夾的檔。GET `?id={fileId}` 不受影響(Drive 全域 fileId、跟資料夾無關、舊錄音照播)。
> Claude Code 看不到 Apps Script 線上 code,**以下三項聖瑱師親手確認後才動工**:

1. 聖瑱師親手在 Drive 建 `istanda-mapasnava-members/` 母資料夾、抓 folder ID
2. 聖瑱師親手讀 Apps Script 現行 `?action=list` 邏輯、確認掃描範圍改法
3. 從三方案拍板 `?action=list` 改法:
   - **原案**:掃母資料夾遞迴(母 → 各子資料夾)
   - **替代 A**:`?action=list&memberId=X` 直接傳子資料夾 ID(從 Firestore `members.driveFolderId` 來)、只掃該人
   - **替代 B**:`?action=list` 全掃母資料夾單層遞迴(下一層子資料夾)

1. 聖瑱師親手在 Drive 建母資料夾、抓 folder ID
2. Claude Code 改 Apps Script doPost:
   - 接受 image/jpeg + image/png mimeType
   - `getMemberFolder` 函式:查 / 建子資料夾、回寫 members.driveFolderId
   - 上傳到該成員子資料夾、不是舊 recordings 資料夾
   - **依上方拍板同步改 `?action=list` 掃描範圍**
3. 聖瑱師親手「管理部署作業 → 編輯 → 新版本」
4. 確認舊端點 URL 不變

**A 階段自測**(線上):
- POST jpg 一張 → Drive 看到該成員子資料夾建立 + 檔案進去
- POST webm 錄音(模擬 Task 1)→ 該成員子資料夾收到、舊 recordings 資料夾不再有新檔
- 同一個成員第二次 POST → 不再 createFolder、直接用既有 ID
- **(D2 拍板)`?action=list` 改後能列到新子資料夾的檔 + 舊錄音 `?id={fileId}` 仍可讀**

**B+C+D**:聖瑱師驗 Drive 看資料夾長對沒、Firestore 看 members.driveFolderId 寫進去沒

#### Step 1 後置事項(Q-E 拍板)

- ❗ **舊 `istanda-mapasnava-recordings/` 資料夾保留不動**
- ❗ **不寫遷移腳本**、舊檔留舊資料夾、新檔走新資料夾
- ✅ 6/15 前聖瑱師親手清除 5/25 那批試錄音(`current-status.md` 已列必清項)
- ✅ 試錄清完、舊資料夾自然空了、路徑分裂問題消失
- ⚠️ Task 4 LINE 分享 + 個人頁播放走 `?id=fileId` 端點、跟資料夾無關、**功能不會壞**

---

### Step 2a:單張照片壓縮 + iOS 必驗(最小可行)

**這一步先驗最危險的事:iOS 實機照片壓縮跑得通**。

1. 自寫 `readExifOrientation(file)` 函式(讀 0x0112 marker、~30-50 行)
2. 寫 `compressPhoto(file)` 完整壓縮 + EXIF 處理
3. 寫個最簡單的測試 UI:選一張照片、按按鈕、跑壓縮、預覽結果
4. 寫在 member.html 暫時可見區、Step 2b 拆掉

**A 階段自測**(實機):
- **iPhone 直立照片**:選一張、壓縮後預覽方向對(不橫躺)⚠️ 關鍵
- **iPhone 橫向照片**:預覽方向對
- **Android 直立 / 橫向**:都對
- **大圖**(原圖 8MB+):壓縮後 < 1MB、不卡頓 / 不 crash
- **HEIC 檔**:iOS 選照片 input 自動轉 JPG / 跳訊息
- **連續壓 3 張**:沒記憶體爆、Safari 沒重整

**B+C+D**:push、實機跑各種照片

**⚠️ 這步沒過、Step 2b 不要動**。Step 2a 是整個 Task 5 最高風險點。

---

### Step 2b:發貼文 modal + 多張壓縮 + 上傳(Q-C 拍板:逐張 sequential)

#### ⚑ Step 2a 實測定案的設計方向(2026-05-29、A/B 探針對照釘死後)

> **Step 2a 結論**:照片失敗 root cause = Android 13+ Photo Picker 對雲端同步照片回 `content://media/picker` proxy URI、`file.arrayBuffer()` 秒 reject `NotReadableError`(非 code bug、非 accept 屬性、非網路)。照片在本機(截圖 / 現拍 / 我的檔案 / materialize 後)時全部正常。完整證據鏈見 `current-status.md` 決策記錄 2026-05-29。

1. **input 保留 `accept="image/*"`**:家人最熟悉、UI 友善;Step 2a 證實拿掉 accept(對照 input B)無法穩定繞過 Photo Picker、accept 不是失敗變數、沒必要為它犧牲熟悉度。
2. **主路徑 `compressFromImg`**(已驗證):從已顯示成功的原圖預覽 `<img>` 直接 drawImage、配 `loadRawImage` 四層 fallback 當後備。Step 2b 把它接進發貼文 modal、把臨時測試 UI(含 probe1/probe2 + 對照 input B)一起拆掉。
3. **`NotReadableError` 偵測 → 友善退路文案**:讀取 / 壓縮鏈若拋 `NotReadableError`(或四層全失敗)→ 不靜默壞掉、跳：
   > 「這張照片需要從雲端載入。請按 📷 重新拍一張、或在 Google 相簿打開後再回來選」
   (規則 4 防呆 + 規則 7 真實工作流:長輩看得懂、給得出下一步動作。)
4. **發貼文 modal 主推「📷 直接拍照」入口**:現拍 = 本機檔 = 必成功、繞開 proxy 風險。照片網格顯眼處放「📷 拍照」、「從相簿選」次之。
5. **HEIF 偵測 → 同樣友善退路**:HEIF 是格式解碼限制(Chrome on Android 解不了、跟 proxy 是兩條獨立問題)、偵測到 origImg onerror / `.heic` 副檔名 → 跳「這張是 HEIC 格式、請改用 📷 拍一張」。

> ⚠️ 這五點不取代既有 Q-C / D1 上傳邏輯(逐張 sequential + claimed-set 差集、見下)、只是把「照片來源可靠性」的對策補進 modal 設計。

1. 寫發貼文 modal(照片網格 3x3、caption、可選配音)
2. **逐張 sequential** 處理(`for await`、絕對不用 `Promise.all`、Q-C 拍板)
3. 上傳完寫 Firestore posts + members.postCount + driveFolderId
4. 樂觀 UI:modal 不關直到全部上傳完
5. 「📷 發貼文」入口加到 member.html
6. **首頁右下角浮動「📷」按鈕**(取代 Stories 列發文入口)

**A 階段自測**:
- 選 3 張照片 + 1 個配音 + caption「測試」→ 上傳 → Firestore posts 一筆、photos 陣列 3 個 fileId、audioFileId 有值
- 純照片無配音 → audioFileId 為 null
- 配音失敗 → 提示後仍能繼續(audioFileId 為 null)
- 上傳中關 modal 不行(防呆)
- 上傳完 modal 自動關、首頁 prepend 該 post

**B+C+D**:實機

---

### Step 3:首頁 Stories 拆除 + Feed Source 切換 + Post card UI

1. **index.html 拆掉 Stories 列**(「我的記事」+ 87 人頭像那一排整顆 DOM 移除)
2. script.js 改 onSnapshot listen posts collection
   - ⚠️ **(Step 0 結論 6.1)script.js 目前只 import `getDocs`/`getDoc`、沒 import `onSnapshot`** → 要新增 import。
3. createPostCard 重做、IG 風(header + 大圖 + ❤️💬↗️ + caption)
   - ⚠️ **(Step 0)v0 `createPostCard` 是 placeholder、schema 完全不同(讀 authorInitials/location/image/likes-number/timeAgo)、其 like 純本地從沒寫 Firestore** → 整個丟掉重寫、不是改。
4. 多張照片 swipe 切換(用 CSS scroll-snap、簡單實作、不用 swiper library)
5. 點頭像 → 跳該成員 member.html
6. ❤️💬↗️ 三鍵接到 posts
   - ⚠️ **(Step 0 結論 6.1)「複用 Task 3-4 邏輯」在首頁 = 在 script.js 重寫一份、不是 import**。Task 3 的 `handleLikeToggle`/`openCommentSheet`、Task 4 的 `handleShare`/`handleDeepLink`/popover、以及 `getDeviceId`/`DEVICE_ID_KEY`、`onSnapshot` import **全在 member.html、script.js 都沒有**、要在 script.js 新增。工作量比「複用」大、Step 3 排期要算進去。
7. **navBtns[3] 家族成員鍵改 toast(D5/拍板 4)**:移除現有「scroll 到 `.stories-section`」(目標 DOM 已拆、會變死鍵)、改 `showToast('6/15 後上線')`、對齊 search 鍵(navBtns[1])pattern。
8. 首頁右下角加 floating 📷 按鈕(發貼文入口、補替 Stories 列)

> **(Step 0 結論 6.2)Stories 拆除清理清單** — 只清這些:
> - function:`renderStories`、`createAddStory`
> - DOM:index.html `<section class="stories-section">`
> - main() 內 empty-members demo fallback block(`id:null` 那段、只餵 renderStories)
> - 連帶 renderStories 內的 `!m.id` 防呆(隨 renderStories 一起走)
>
> **不可清(bottom nav 錄音鍵 + 我鍵仍在用)**:`handleRecordPressed`、`openIdentityModal`、`applyMyIdentity`、`initialsOf`、`getMyMember`、`getMyId`、`setMyId`。
> ⚠️ Q-B 早期說「handleRecordPressed 不再需要」**只對 createAddStory 那一個入口成立**、bottom nav navBtns[2](錄音)+ navBtns[4](我)仍呼叫它、**不可刪**。

**A 階段自測**:
- 首頁打開、沒看到 Stories 列、純 Hero + Feed
- 從個人頁發一篇 → 首頁立刻看到(onSnapshot)
- 點 ❤️ → posts.likes 寫入、雙裝置即時同步
- 點 💬 → comment sheet 開、留言寫入 posts.comments
- 點 ↗️ → Share Sheet 跳出、訊息含 `index.html#post=`
- 多張照片卡片 swipe 切換正常
- 點頭像跳該成員頁
- 右下角 📷 → 開發貼文 modal

**B+C+D**:雙裝置 + 雙瀏覽器

---

### Step 4:個人頁 tab + 純錄音搬家

1. member.html 加 tab UI(貼文 / 純錄音)
2. 貼文 tab:onSnapshot 撈 posts where memberId、IG 卡片
3. 純錄音 tab:**沿用 Task 1 既有清單 UI、不重寫**、只是搬到 tab 下
4. 預設顯示貼文 tab
5. **tab 切換時 unsubscribe 舊 listener、subscribe 新 listener**(避免記憶體洩漏)

**A 階段自測**:
- 點該成員頁、預設貼文 tab、看到他的所有 post
- 切純錄音 tab、看到 Task 1 的歷史錄音清單(原來樣子)
- 點哪個 tab、URL hash 不變(避免影響 deep link)
- 純錄音清單的 ❤️💬↗️ 仍正常(Task 4 不能壞)
- 切 tab 5 次、DevTools Memory tab 看 listener 數量沒爆

**B+C+D**:對比 Task 1-4 完整功能跑一遍、確認沒迴歸

---

### Step 5:Deep link + 整合 + DoD 驗收

1. 在 index.html 加 handleDeepLink、selector 用 `.post-card[data-post-id="..."]`
2. CSS:`.post-card--highlighted`(複用 `.recording-row--highlighted` pattern)
3. handleShare(postId) 在 post card、組 URL `index.html#post={postId}`
4. MESSAGES.share.postTitle / postBody 加進來

**完整流程實機驗收**:
- 發貼文 → 點卡片 ↗️ → 分享到 LINE → 對方點 link → 跳 index.html → 自動 scroll + 高亮 → 點 ▶ 配音 → 聽得到

**DoD 全部勾**(見下方)

---

## ✅ DoD 完成定義

### 資料層
- [ ] `posts` collection 創建、photos / audioFileId / text / likes / comments 欄位都對
- [ ] `posts.createdAt` 用 serverTimestamp
- [ ] `members` 新增 driveFolderId / postCount 兩個欄位、雙寫正常
- [ ] `recordings` collection 不動、Task 1-4 資料完整保留
- [ ] Drive `istanda-mapasnava-members/` 母資料夾建立
- [ ] 至少 2 個成員子資料夾(Cina Umav / Tama Iman)建立、含真實照片

### Apps Script
- [ ] doPost 接受 jpg/png + 既有 webm/mp4
- [ ] getMemberFolder 首次建資料夾、第二次用 cache、Firestore 雙寫
- [ ] 部署新版、舊 URL 不變、Task 1-4 錄音功能不壞

### 照片處理
- [ ] iPhone 直立照片壓縮後不橫躺 ⚠️ 核心
- [ ] HEIC 自動轉 JPG 或跳提示
- [ ] 5+ 張大圖連續壓縮、Safari 不重整
- [ ] 壓縮後檔案 < 5MB
- [ ] EXIF reader 自寫、不引第三方 library

### 發貼文 flow
- [ ] 「📷 發貼文」入口在 member.html + 首頁右下角 floating
- [ ] 選 1-9 張照片、grid 顯示、可刪、可重選
- [ ] 寫 caption(可空)
- [ ] 加配音(可選、複用 Task 1 錄音 UI)
- [ ] **逐張 sequential 上傳**(`for await`)、進度條清楚
- [ ] 上傳中 modal 不可關
- [ ] 寫 Firestore posts + driveFolderId + postCount 全部成功

### 首頁 Feed
- [ ] **Stories 列已拿掉**、首頁是 Hero + Feed 兩層
- [ ] Feed source = posts、onSnapshot 即時更新
- [ ] Post card:頭像 / 大圖 / swipe / ❤️💬↗️ / caption / 配音 ▶ 鈕
- [ ] 點頭像跳該成員頁
- [ ] ❤️ / 💬 / ↗️ 邏輯沿用 Task 3-4、寫入 posts 不是 recordings
- [ ] 右下角 floating 📷 按鈕、點 → 開發貼文 modal

### 個人頁
- [ ] tab 切換[貼文 / 純錄音]
- [ ] 貼文 tab:該成員所有 post
- [ ] 純錄音 tab:Task 1 既有清單、❤️💬↗️ 仍正常
- [ ] **tab 切換時 listener 正確 unsubscribe / subscribe**、無記憶體洩漏

### Deep link
- [ ] `index.html#post={postId}` → 首頁 scroll + 金邊閃 2 秒
- [ ] F5 不重跳
- [ ] 找不到 post → notFoundToast
- [ ] LINE 分享訊息含完整 URL

### 迴歸測試
- [ ] Task 1 錄音上傳:仍可用、新檔案進新的成員子資料夾
- [ ] Task 3 按讚 / 留言:在純錄音 tab 仍正常
- [ ] Task 4 LINE 分享(recordings):從純錄音 tab 分享、deep link 仍指 member.html#rec=

### 平台
- [ ] iOS Safari 無 console error
- [ ] Android Chrome 無 console error
- [ ] 桌機 Chrome 無 console error
- [ ] 線上 GitHub Pages 無痕視窗可用

---

## ⚠️ 不要做的事

- ❌ **不要動 Task 1-4 的核心邏輯**(只新增、不修改 recordings / 按讚 / 留言 / LINE 分享)
- ❌ **不要在 Step 2a 過關前進 Step 2b**(iOS 實機壓縮是最高風險、必須先過)
- ❌ **不要平行壓縮多張照片**(`Promise.all` 會爆 iPhone 記憶體、用 `for await`)
- ❌ **不要用第三方圖片 library**(像 cropperjs、swiper、**也包括 exif-js**)、純 CSS / 原生 canvas / 自寫 EXIF
- ❌ **不要做照片濾鏡 / 編輯**(這次範圍外)
- ❌ **不要做「@提及」/ 「#hashtag」**(範圍外)
- ❌ **不要做「精選動態 / Stories」**(範圍外、也對齊 Q-B 拍板:**Stories 列要拿掉、不是新做**)
- ❌ **不要保留 v0 Stories 列**(Q-B 拍板:整顆 DOM 拿掉、首頁變 Hero + Feed 兩層)
- ❌ **不要做 members.html 列表頁**(6/15 後依家人回饋再評估、Task 5 範圍外)
- ❌ **navBtns[3] 家族成員鍵 Stories 移除後不要留死鍵**(拍板 4:改 `showToast('6/15 後上線')`、對齊 search 鍵 pattern、不指向已拆除的 `.stories-section`)
- ❌ **不要做大圖全螢幕看圖**(Step 4 完成後若有時間再加、不阻塞 6/15)
- ❌ **不要動 v0 首頁 Hero 區結構**(白底山稜剪影、不重畫)
- ❌ **不要寫舊 recordings/ Drive 路徑遷移腳本**(Q-E 拍板:不遷、清試錄就好)
- ❌ **不要擅自加布農語**
- ❌ **不要把 recordings 集合資料搬到 posts**(保留歷史不動)
- ❌ **不要用 Firestore docId 當 Drive 資料夾名**(用 `name`(布農拼音、含空格)+ docId 前 8 碼、可讀性高、D5 拍板)
- ❌ **不要一次 POST 多張照片**(Q-C 拍板:逐張 sequential、單張 5MB 預算獨立)

---

## 📞 規則 6:不確定就問

特別容易遇到的:
- Step 0 Recon 發現 v0 createPostCard 結構跟 spec 假設差很多
- Step 0 發現 Task 1 錄音 UI 體積偏大 / 偏小、需要 Q-D 拍板
- Step 2a iOS 實機壓縮某個機型 EXIF 偵測失敗
- 多張照片 swipe 在某瀏覽器卡頓
- onSnapshot listen posts 在大量資料時延遲(87 人 × 50 篇 = 4350 篇、上線初期不會、之後可能)
- Apps Script 部署後舊 Task 1 錄音上傳失敗(代表 doPost 改壞了)
- 個人頁 tab 切換時 onSnapshot listener 沒清掉、記憶體洩漏
- 拿掉 Stories 列後、首頁布局某處跑版

任何一條冒出來、**停下來問聖瑱師、不要硬寫**。

---

## 📚 參考資料

- 教師手帳工程準則:`specs/coding_principles.md`
- 北極星:`specs/north-star.md`
- Task 1 spec:`specs/task-recording-core.md`(錄音邏輯複用、tab 第二頁)
- Task 4 spec:`specs/task-line-share.md`(deep link / handleShare 邏輯複用)
- EXIF orientation 自寫範例(只需這個 marker):
  - https://exiftool.org/TagNames/EXIF.html#Orientation(0x0112 規格)
  - https://developer.mozilla.org/en-US/docs/Web/API/FileReader
- Canvas resize:
  - https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- IG 卡片排版參考:Instagram 桌面版

---

*Created: 2026-05-27 11:30(規劃對話框第一層 Recon 完成、10 題拍板)*
*Updated: 2026-05-27 中午(接手對話框補充拍板 Q-A 到 Q-E、5 條落實進 spec)*
*Updated: 2026-05-27 下午(Step 0 第二層 Recon 完成、6 條拍板落實:Q-D 嵌入+獨立配音器小工具、D1 claimed-set 差集、D5 Drive 命名拼音、navBtns[3] toast、D2 Apps Script ?action=list 兼容性三方案、6.x Step 0 真相校正)*
*Updated: 2026-05-29(Step 2a 過關、A/B 探針對照釘死 NotReadableError = Android Photo Picker proxy URI 硬限制、Step 2b 補入 5 點照片來源可靠性設計方向)*
*Status: Step 1 已完成(見 current-status.md Task 5 Step 1)、Step 2a 已過關;Step 2b 設計方向定案、待動工*