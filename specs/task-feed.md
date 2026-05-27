# Task 5: 照片貼文 + 首頁 Feed(主軸轉移)

> 給 Claude Code 的標準工作指令。
> 開頭請讀:specs/coding_principles.md、specs/current-status.md、specs/north-star.md、specs/task-recording-core.md、specs/task-line-share.md(對齊格式)
> 遵守規則 10:先 Recon、後動工、每個 Step 之間等使用者回「ok」。
>
> **狀態:第一層 Recon 完成、10 題拍板、Claude Code 動工 Step 1 前需先跑 Step 0 第二層 Recon**

---

## 🎯 任務目標

把這個 App 從「**錄音為主**」轉換成「**照片 + 可選配音**」為主。

具體變化:
- 新增 `posts` collection、每篇 post 含 1-9 張照片 + 可選配音 + caption
- Apps Script 改造:接受 jpg/png、每人專屬 Drive 子資料夾
- 首頁 Feed source 從 placeholder 切到 posts collection、IG 風卡片
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
- ✅ **照片優先 flow**:大部分人發貼文是先有照片(看到漂亮東西先拍)、配音是附加
- ✅ **2 tap 內進入發文流程**:首頁 + 入口、不藏深
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
- ✅ **index.html / script.js**:Feed source 切到 posts、卡片 UI 重做
- ✅ **style.css**:新增 `.post-card__*`、`.tab__*`、`.photo-grid__*` namespace
- ✅ **新建 Drive 母資料夾**:`istanda-mapasnava-members/`(聖瑱師親手建)

### 視覺(沿用 v2、白底 + Bunun 五色)

- 全部用 CSS 變數
- 照片網格用 CSS `grid-template-columns: repeat(3, 1fr)`、3x3 上限
- 卡片底色純白、邊框 `var(--border)` 淡灰
- ↗️ 分享鈕、❤️ 愛心、💬 留言:複用 Task 3-4 的 `.recording-row__action` namespace、保持視覺一致
- 配音播放鈕:複用 Task 1 的試聽鈕樣式

### 分享技術棧

- 沿用 Task 4 的 navigator.share + Popover fallback
- Deep link URL 改為 `index.html#post={postId}`(不是 member.html)
- handleDeepLink 邏輯複用 Task 4、改 selector

---

## ✅ 第一層 Recon 拍板結果(2026-05-27 規劃對話框)

| # | 問題 | 拍板 |
|---|---|---|
| Q1(a) | 一篇 post 幾張照片? | **1-9 張**(3x3 grid、IG 上限 10 我們 9 比較好排版) |
| Q1(b) | 配音欄位名? | **`audioFileId`**(短、跟既有 fileId 對齊) |
| Q1(c) | 舊 `recordings` 集合? | **保留不動**、6/15 前不清、變歷史純錄音 |
| Q2 | Drive 命名? | **`中文名_docId`**(例:`林惠卿_2l95Zhad`)、中英混雜接受 |
| Q2 | 母資料夾? | **新建 `istanda-mapasnava-members/`**、舊 `istanda-mapasnava-recordings/` 退役 |
| Q3 | 配音入口? | **照片優先 flow**:📷 → 選照片 → 預覽 → 可選配音 → caption → 發 |
| Q4 | 首頁顯示? | **只 posts**、recordings 退個人頁 tab |
| Q5 | 個人頁? | **Hero + tab[貼文 / 純錄音]** |
| Q6(a) | Deep link 落點? | **首頁那篇**(主軸轉移、首頁是核心) |
| Q6(b) | URL 格式? | **`index.html#post={postId}`** |
| Q7 | 照片壓縮? | **全壓縮**:canvas 1080px / 80% JPEG + EXIF + HEIC 處理 |

---

## 📋 規格細節

### 1. Firestore Schema

#### 新增 `posts` collection

```javascript
posts: {
  // docId 自動生成
  {postId}: {
    memberId: "2l95Zhad...",           // 發文者 docId
    photos: [                          // 1-9 張、依上傳順序
      { fileId: "1ABC...", filename: "1747890123.jpg" }
    ],
    audioFileId: "1XYZ..." | null,     // 可選配音、null = 沒配音
    text: "今天去爬山",                 // caption、可為空字串
    createdAt: timestamp,
    likes: ["deviceId1", "deviceId2"], // 沿用 Task 3 格式
    comments: [                        // 沿用 Task 3 格式
      { deviceId, memberId, authorName, text, createdAt }
    ]
  }
}
```

#### 修改 `members` collection(加兩個欄位)

```javascript
members: {
  {memberDocId}: {
    // 原有欄位:name / nickname / role / initials / recordCount
    driveFolderId: "1FOLDER..." | null,  // 新增:該成員 Drive 子資料夾 ID、首次上傳時建立
    postCount: 0                          // 新增:發文計數、雙寫
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
子資料夾命名:`{中文名}_{docId 前 8 碼}`(例:`林惠卿_2l95Zhad`)

#### Apps Script 部署流程

**聖瑱師親手做**(Claude Code 沒有 Apps Script 帳號權限):
1. 開 Apps Script 編輯器(找 istanda-mapasnava-receiver)
2. 改 code(對照 Step 1 spec)
3. **管理部署作業 → 編輯 → 版本選新版本 → 部署**
4. 確認新 URL 跟舊 URL **一樣**(同個 endpoint、不要換)

---

### 3. 照片壓縮(Step 2a 核心、iOS 必驗)

#### 壓縮流程

```javascript
async function compressPhoto(file) {
  // 1. 讀 EXIF 旋轉資訊(用 exif-js 或自寫)
  const orientation = await readExifOrientation(file);

  // 2. 讀進 <img>
  const img = await fileToImage(file);

  // 3. 計算縮放尺寸(長邊縮到 1080px、保比例)
  const { width, height } = computeResizeDimensions(img, 1080);

  // 4. 建 canvas、依 EXIF 旋轉(畫之前轉 ctx)
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
| EXIF 旋轉(iPhone 直立照片) | 手動讀 EXIF、ctx 轉向再畫 canvas |
| HEIC 格式 | `<input accept="image/*">` iOS 13+ 自動轉 JPEG;偵測檔名 .heic 跳訊息「請選 JPG」 |
| canvas.toBlob 回傳 null | 加 reject 處理、上層 catch 跳 toast「這張照片無法處理、請換一張」 |
| iPhone 記憶體爆 | 一張一張壓(`for await`)、不要 `Promise.all` |
| 阿嬤 iPhone 7/8 老機 | 一張壓完 release canvas + img、`canvas.width = canvas.height = 0` |

---

### 4. 發貼文 UI flow(照片優先)

#### 入口

`member.html` Hero 區下方加兩個並排入口:
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
│  🎙 加配音(可選)                 │  ← 點 → 進錄音 mini UI
│                                 │
└─────────────────────────────────┘
#### 上傳進度

1. 照片逐張壓縮 + 上傳(分階段顯示「壓縮中 1/3 → 上傳中 1/3 → ✓」)
2. 配音上傳(複用 Task 1 邏輯)
3. 寫 Firestore posts + members.postCount + members.driveFolderId(若首發)
4. 關閉 modal、首頁滾到頂、新貼文出現(onSnapshot)
5. ✓ Toast「貼文已發、家人開始看到了」

#### 樂觀 UI

- 發送中不要關 modal、按鈕變「上傳中... 1/9」
- 上傳完才關 modal、避免「按了沒反應」感

---

### 5. 首頁 Feed(IG 風卡片)

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
│ [頭像] 林惠卿(媽媽)    · 3 小時前   │  ← header
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
  clearHash();  // F5 不重跳
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
- Apps Script 6MB 撞牆:**理論上壓縮後不會發生、但加保險:單張壓縮後 > 5MB 跳 toast「照片太大、請換一張」**
- 配音上傳失敗:跳「配音失敗、貼文已發但無配音」、posts 文件 `audioFileId: null`
- 整個 post 寫 Firestore 失敗:跳「貼文發送失敗、請再試」、保留 modal、不清空

#### 樂觀 UI

- 發送鈕點下去 → 立刻變「上傳中... N/M」
- onSnapshot 接到新 post → 自動 prepend 到首頁
- 不需要手動 reload Feed

---

## 🪜 Step 順序

### Step 0:第二層 Recon(Claude Code 動筆前)

**這一步 Claude Code 不寫 code、只爬 code + 建母資料夾 + flag 風險**。

1. grep `script.js` 看現有 createPostCard 結構(v0 三件套留下的)、確認可複用範圍
2. grep `member.html` 看 Task 1 的錄音 UI、判斷「📷 發貼文」入口放哪
3. 檢查現有 `.recording-row__action` CSS:能否複用到 post card 的 ❤️💬↗️
4. 檢查 Task 4 的 `handleDeepLink` / `clearHash`:是否能抽成共用 module 給 Task 5 用
5. **聖瑱師親手**:在 Drive 建 `istanda-mapasnava-members/` 母資料夾、複製 folder ID
6. 確認 Apps Script 編輯器存取 ok、聖瑱師有部署權限
7. **回報偵察報告**、列出:
   - 找到的 class / 函式命名(讓 spec 跟現實對齊)
   - spec 沒寫到的衝突 / 風險
   - 建議調整的 spec 段落
   - 確認母資料夾 ID 拿到、可以寫進 Apps Script 常數

**等聖瑱師看完偵察報告、回 ok 才進 Step 1**。

---

### Step 1:Apps Script 改造 + 母資料夾

1. 聖瑱師親手在 Drive 建母資料夾、抓 folder ID
2. Claude Code 改 Apps Script doPost:
   - 接受 image/jpeg + image/png mimeType
   - `getMemberFolder` 函式:查 / 建子資料夾、回寫 members.driveFolderId
   - 上傳到該成員子資料夾、不是舊 recordings 資料夾
3. 聖瑱師親手「管理部署作業 → 編輯 → 新版本」
4. 確認舊端點 URL 不變

**A 階段自測**(線上):
- POST jpg 一張 → Drive 看到該成員子資料夾建立 + 檔案進去
- POST webm 錄音(模擬 Task 1)→ 該成員子資料夾收到、不再進舊 recordings 資料夾
- 同一個成員第二次 POST → 不再 createFolder、直接用既有 ID

**B+C+D**:聖瑱師驗 Drive 看資料夾長對沒、Firestore 看 members.driveFolderId 寫進去沒

---

### Step 2a:單張照片壓縮 + iOS 必驗(最小可行)

**這一步先驗最危險的事:iOS 實機照片壓縮跑得通**。

1. 寫 `compressPhoto(file)` 函式(含 EXIF 旋轉處理)
2. 寫個最簡單的測試 UI:選一張照片、按按鈕、跑壓縮、預覽結果
3. 寫在 member.html 暫時可見區、Step 2b 拆掉

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

### Step 2b:發貼文 modal + 多張壓縮 + 上傳

1. 寫發貼文 modal(照片網格 3x3、caption、可選配音)
2. 多張照片:一張一張壓縮 + 上傳(`for await`)、進度條
3. 上傳完寫 Firestore posts + members.postCount + driveFolderId
4. 樂觀 UI:modal 不關直到全部上傳完
5. 「📷 發貼文」入口加到 member.html

**A 階段自測**:
- 選 3 張照片 + 1 個配音 + caption「測試」→ 上傳 → Firestore posts 一筆、photos 陣列 3 個 fileId、audioFileId 有值
- 純照片無配音 → audioFileId 為 null
- 純配音失敗回到無配音 → 提示後仍能繼續(audioFileId 為 null)
- 上傳中關 modal 不行(防呆)
- 上傳完 modal 自動關、首頁 prepend 該 post(下一步 Step 3 驗證)

**B+C+D**:實機

---

### Step 3:首頁 Feed Source 切換 + Post card UI

1. script.js 改 onSnapshot listen posts collection
2. createPostCard 重做、IG 風(header + 大圖 + ❤️💬↗️ + caption)
3. 多張照片 swipe 切換(用 CSS scroll-snap、簡單實作、不用 swiper library)
4. 點頭像 → 跳該成員 member.html
5. ❤️💬↗️ 三鍵接到 posts(複用 Task 3-4 邏輯、改寫的 collection)

**A 階段自測**:
- 從個人頁發一篇 → 首頁立刻看到(onSnapshot)
- 點 ❤️ → posts.likes 寫入、雙裝置即時同步
- 點 💬 → comment sheet 開、留言寫入 posts.comments
- 點 ↗️ → Share Sheet 跳出、訊息含 `index.html#post=`
- 多張照片卡片 swipe 切換正常
- 點頭像跳該成員頁

**B+C+D**:雙裝置 + 雙瀏覽器

---

### Step 4:個人頁 tab + 純錄音搬家

1. member.html 加 tab UI(貼文 / 純錄音)
2. 貼文 tab:onSnapshot 撈 posts where memberId、IG 卡片
3. 純錄音 tab:**沿用 Task 1 既有清單 UI、不重寫**、只是搬到 tab 下
4. 預設顯示貼文 tab

**A 階段自測**:
- 點該成員頁、預設貼文 tab、看到他的所有 post
- 切純錄音 tab、看到 Task 1 的歷史錄音清單(原來樣子)
- 點哪個 tab、URL hash 不變(避免影響 deep link)
- 純錄音清單的 ❤️💬↗️ 仍正常(Task 4 不能壞)

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

### 發貼文 flow
- [ ] 「📷 發貼文」入口在 member.html、視覺對齊 Task 1 錄音入口
- [ ] 選 1-9 張照片、grid 顯示、可刪、可重選
- [ ] 寫 caption(可空)
- [ ] 加配音(可選、複用 Task 1 錄音 UI)
- [ ] 上傳進度條清楚、上傳中 modal 不可關
- [ ] 寫 Firestore posts + driveFolderId + postCount 全部成功

### 首頁 Feed
- [ ] Feed source = posts、onSnapshot 即時更新
- [ ] Post card:頭像 / 大圖 / swipe / ❤️💬↗️ / caption / 配音 ▶ 鈕
- [ ] 點頭像跳該成員頁
- [ ] ❤️ / 💬 / ↗️ 邏輯沿用 Task 3-4、寫入 posts 不是 recordings

### 個人頁
- [ ] tab 切換[貼文 / 純錄音]
- [ ] 貼文 tab:該成員所有 post
- [ ] 純錄音 tab:Task 1 既有清單、❤️💬↗️ 仍正常

### Deep link
- [ ] `index.html#post={postId}` → 首頁 scroll + 金邊閃 2 秒
- [ ] F5 不重跳
- [ ] 找不到 post → notFoundToast
- [ ] LINE 分享訊息含完整 URL

### 迴歸測試
- [ ] Task 1 錄音上傳:仍可用、檔案進新的成員子資料夾
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
- ❌ **不要用第三方圖片 library**(像 cropperjs、swiper)、純 CSS / 原生 canvas
- ❌ **不要做照片濾鏡 / 編輯**(這次範圍外、IG 風格不代表要做 IG 所有功能)
- ❌ **不要做「@提及」/ 「#hashtag」**(範圍外)
- ❌ **不要做「精選動態 / Stories」**(範圍外)
- ❌ **不要做大圖全螢幕看圖**(Step 4 完成後、若有時間再加、不阻塞 6/15)
- ❌ **不要動 v0 首頁 Hero 區結構**(白底山稜剪影、不重畫)
- ❌ **不要擅自加布農語**
- ❌ **不要把 recordings 集合資料搬到 posts**(保留歷史不動)
- ❌ **不要用 Firestore docId 當 Drive 資料夾名**(用中文名 + docId 前 8 碼可讀性高)

---

## 📞 規則 6:不確定就問

特別容易遇到的:
- Step 0 Recon 發現 v0 createPostCard 結構跟 spec 假設差很多
- Step 2a iOS 實機壓縮某個機型 EXIF 偵測失敗
- 多張照片 swipe 在某瀏覽器卡頓
- onSnapshot listen posts 在大量資料時延遲(87 人 × 50 篇 = 4350 篇、上線初期不會、之後可能)
- Apps Script 部署後舊 Task 1 錄音上傳失敗(代表 doPost 改壞了)
- 個人頁 tab 切換時 onSnapshot listener 沒清掉、記憶體洩漏

任何一條冒出來、**停下來問聖瑱師、不要硬寫**。

---

## 📚 參考資料

- 教師手帳工程準則:`specs/coding_principles.md`
- 北極星:`specs/north-star.md`
- Task 1 spec:`specs/task-recording-core.md`(錄音邏輯複用、tab 第二頁)
- Task 4 spec:`specs/task-line-share.md`(deep link / handleShare 邏輯複用、postId 替換 fileId)
- Canvas resize + EXIF 處理參考:
  - https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
  - https://github.com/exif-js/exif-js(若決定用、Step 0 Recon 評估)
- IG 卡片排版參考:Instagram 桌面版

---

*Created: 2026-05-27 11:30(規劃對話框第一層 Recon 完成、10 題拍板)*
*Status: 等聖瑱師存檔推 GitHub、然後新對話框讀此 spec、跑 Step 0 第二層 Recon*
