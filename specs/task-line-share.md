收到、開始寫。下面整份就是最終版、直接用右上角複製按鈕拿走。

```markdown
# Task 4: LINE 一鍵分享

> 給 Claude Code 的標準工作指令。
> 開頭請讀:specs/coding_principles.md、specs/current-status.md、specs/north-star.md、specs/task-recording-core.md(對齊格式)
> 遵守規則 10:先 Recon、後動工、每個 Step 之間等使用者回「ok」。
>
> **狀態:第一層 Recon + Step 0 第二層 Recon 全部完成、可動工 Step 1**

---

## 🎯 任務目標

讓家族成員在個人頁面點某筆錄音的 ↗️ 分享鈕、一鍵把那筆錄音分享到 LINE 群組(或其他 App)。
分享出去的訊息含 deep link、堂哥點 link 回 App、自動 scroll 到那筆錄音 + 金邊高亮 2 秒、自己按 ▶ 聽。

不自動播放(iOS 會擋、避免嚇人錯誤)。
不寫 Firestore、不動 Apps Script、純前端。

---

## 🌟 北極星對齊(這條最重要)

來自 `north-star.md` 衡量成功的三個問題第 3 題:

> **LINE 家族群組這週有沒有出現 App 連結?**

Task 4 就是這題的引擎。

實際使用場景(north-star.md 第二層、場景 B):

```
小朋友 A:「誰幫我錄一句『我好餓』的布農族語」
堂姊:「⬆️ 我剛在 App 錄了」← 這個 ⬆️ 就是 Task 4 產出的訊息
3 個人按愛心、4 則留言。
```

設計判準:
- ✅ 分享要快(2 tap 內完成、不打斷對話節奏)
- ✅ 訊息要有溫度(不是純 URL、要有名字 + 描述)
- ✅ 不要把家人趕出 App(分享後堂哥點回來、要落在「就是這筆」、不是首頁)

---

## 📦 環境資訊(不要動)

### 不動的東西

- ❌ **不動 Apps Script**:純前端、不寫後端
- ❌ **不動 Firestore schema**:`recordings` / `members` 欄位完全不新增
- ❌ **不動 `members` / `recordings` 既有資料**:讀現有的 name / nickname / fileId 組訊息即可
- ❌ **不動首頁 `index.html`**:Task 4 只動 `member.html` + `style.css`(MESSAGES 結構寫在 member.html inline)

### 視覺(沿用 v2、白底 + 五色)

- 全部用 CSS 變數、不寫死色碼
- ↗️ 鈕配色:**對齊現有 `.recording-row__action`**:`var(--text-muted)` 灰、padding 6/10、SVG 18×18、hover `var(--bg-soft)` 米色
- 高亮動畫:用 `var(--accent)` 薑黃 `#d4a017` 邊框閃 2 秒、淡入淡出
- toast:複用既有 `.global-toast` / `.global-toast--show`、`showToast(msg, ms=2200)` 簽名
- Popover:**新開 `.share-sheet__*` namespace**(不複用 `.comment-sheet__*`、語意 + 高度都不對)、複製 slide-up + backdrop 動畫 pattern、高度 280px

### 分享技術棧

- **首選**:Web Share API(`navigator.share`)— mobile Chrome / Safari / Android Chrome 支援
- **Fallback**:Popover 小卡、含「📲 開啟 LINE」+「📋 複製訊息」雙鈕
- LINE URL Scheme:`https://line.me/R/msg/text/?{encoded message}`
  - LINE App 已裝 → 開 App 進選聊天室畫面
  - LINE App 沒裝 → 跳網頁版 LINE(line.me)
  - 兩種情境家人都能完成分享、不會卡住

### iOS 舊版本相容(細節 A 拍板:乙方案、雙保險)

iOS Safari 13 及更早**會忽略 `navigator.share` 的 `url` 欄位**、只用 `title` + `text`。
為避免家人手機卡在 iOS 12-13 時 LINE 訊息缺 URL、堂哥點不到 link、走**雙保險策略**:

- `text` 欄位裡**同時包含 URL**(不只放在 `url` 欄位)
- 新版 iOS / Android:訊息會看到一次 URL(在 text 內、url 欄位被當成 metadata 不重複顯示;實際行為依平台、但不會缺)
- 舊版 iOS 13-:url 欄位被忽略、但 text 裡仍有 URL、堂哥還是點得到

**ROI**:多寫 1 行 code、零成本、防 87 人裡長輩老 iPhone 那條尾巴。

---

## ✅ 拍板結果

### 第一層 Recon(2026-05-25 規劃對話框)

| # | 問題 | 拍板 |
|---|---|---|
| Q1 | Deep link 落點(跳哪)? | **B**:跳 `member.html?id=X#rec=Y`、自動 scroll + 2 秒金邊高亮、**不自動播放**(iOS 擋) |
| Q2 | 訊息模板雙語規劃? | **A**:6/15 前純中文、但寫成 i18n-ready 結構(`MESSAGES.share.title` 這種) |
| Q3 | 分享 UI 放哪? | **A**:每筆 row 加 ↗️、變成 ❤️ 💬 ↗️ 三鍵橫排 |
| Q4 | Web Share API 失敗 fallback? | **C**:跳 popover、同時提供「開 LINE」+「複製訊息」雙鈕 |
| Q5 | 動不動 Apps Script / Firestore? | **不動**:純前端、純讀現有資料 |
| 補 A | iOS 13 舊版相容? | **乙**:text 欄位同時包 URL、雙保險 |
| 補 B | F5 同頁要不要重跳高亮? | **B**:不重跳、handleDeepLink 第一次跑完清掉 hash、F5 後 hash 沒了不再觸發 |

### Step 0 第二層 Recon(2026-05-25 Claude Code 偵察報告、共 10 條拍板)

| # | 偵察發現 | 拍板 |
|---|---|---|
| S0-A | row attribute 是 `data-file-id`、不是 `data-doc-id` | **沿用現有 `data-file-id`、不新增 attribute** |
| S0-B | 清單身份是 `fileId`(Drive ID)、不是 Firestore docId | **Deep link 改用 `fileId`、URL 變 `#rec={fileId}`**(更乾淨、render 時就有、不必查 Firestore) |
| S0-C | 變數叫 `allRecordings`、item 結構 `{fileId, filename, likes, comments}` 沒 `.id` | **handleShare 不查 recording**(訊息模板只用 member 資料、不需要 recording 物件) |
| S0-D | `cachedMember` 不存在、main() 把 snap.data() 餵 renderHero 後沒留 | **新增 module 變數 `let memberData = null`、main 中 `memberData = snap.data()` 存起來** |
| S0-1 | handleShare 裡的 recording 變數其實沒用到 | **刪掉 `allRecordings.find` 那行、簡化** |
| S0-2 | ↗️ 鈕應對齊現有 `.recording-row__action` 灰調、不是沉黑 | **`↗️` 用 `.recording-row__action` base + `.recording-row__share` modifier、color: `var(--text-muted)`、padding 6/10、SVG 18×18** |
| S0-3 | `.comment-sheet__*` 語意是留言、高度 70vh、不該複用 | **新開 `.share-sheet__*` namespace、複製 slide-up + backdrop 動畫 pattern**(規則 11:抽小工具、舊的不動、零撞名) |
| S0-4 | 高亮被 re-render 洗掉的風險其實極低(partial DOM update) | **DoD 從「必驗」降級為「知道即可」**、不加保護邏輯 |
| S0-5 | `loadRecordings()` 在 main 是 fire-and-forget、要鏈式接 | **改 `await loadRecordings(); handleDeepLink();`**(對齊 main 既有 async 風格) |
| S0-6 | MESSAGES 放哪 | **inline 在 member.html、不抽 i18n.js**(現有常數都 inline、M_R1 已立先例、YAGNI) |
| S0-7 | nickname 可能空字串、模板會變「name()在...」醜括號 | **title 函式內判斷:nickname 空就省略括號**(防呆 1 行) |

---

## 📋 規格細節

### 1. 訊息模板(i18n-ready 結構、inline 在 member.html)

```javascript
// 寫在 member.html 內 inline、跟 DEVICE_ID_KEY / ME_KEY / RECORD_LIMIT_SEC 同層
const MESSAGES = {
  share: {
    // 分享訊息標題(空 nickname 防呆、S0-7 拍板)
    title: (name, nickname) =>
      nickname
        ? `${name}(${nickname})在家族 App 錄了新的話`
        : `${name} 在家族 App 錄了新的話`,

    // 分享訊息內文(Web Share API 的 text 欄位、LINE URL Scheme 用、複製訊息用)
    body: (name) =>
      `來聽聽 ${name} 錄的這段:`,

    // 訊息底部 CTA(導引點 link)
    cta: `👉 打開 Istanda Mapasnava`,

    // Popover 標題(桌機 fallback)
    popoverTitle: `分享給家人`,

    // Popover 按鈕
    openLineBtn: `📲 開啟 LINE`,
    copyBtn: `📋 複製訊息`,
    cancelBtn: `取消`,

    // 複製成功 toast
    copiedToast: `✓ 已複製、可貼到任何聊天室`,

    // 高亮 deep link 找不到該筆錄音時
    notFoundToast: `這段錄音已被刪除或還在同步中`,
  }
};
```

完整訊息組合(範例、nickname 有值時):

```
Cina Umav(媽媽)在家族 App 錄了新的話

來聽聽 Cina Umav 錄的這段:
👉 打開 Istanda Mapasnava
https://overpomelo-alt.github.io/istanda-mapasnava/member.html?id=2l95ZhadEN8Xv8hijWty#rec=1XXXxxxFILE_ID_FROM_DRIVE
```

範例(nickname 空時):
```
Cina Umav 在家族 App 錄了新的話
...
```

**🟡 i18n 預留**:之後加布農語、只要把 `MESSAGES.share` 改成:
```javascript
const MESSAGES = {
  zh: { share: { ... } },  // 中文
  bnn: { share: { ... } }, // 布農語(等家人填入)
};
const currentLang = localStorage.getItem('istanda_lang') || 'zh';
// 使用時:MESSAGES[currentLang].share.title(name, nickname)
```
不用回頭改 share button 的呼叫 code、只改字典本身。Task 5 / 7 動 index.html 時再抽 i18n.js。

---

### 2. UI:每筆錄音 row 加 ↗️ 鈕(對齊現有 .recording-row__action)

Task 3 已建立的 row 結構:

```
[現有] 上行: ❤️  💬
       下行: N 個讚 · M 則留言
```

Task 4 改成:

```
[新版] 上行: ❤️  💬  ↗️
       下行: N 個讚 · M 則留言
```

#### CSS(對齊現有 .recording-row__action、S0-2 拍板)

```css
/* 沿用現有 base class、新增 modifier */
.recording-row__action.recording-row__share {
  /* base class 已給:color: var(--text-muted)、padding: 6px 10px、hover bg-soft */
  /* 這裡只加分享專屬的 tweak、目前無 */
}

.recording-row__action.recording-row__share svg {
  /* base class 已給:width: 18px、height: 18px、stroke: currentColor、stroke-width: 2 */
  /* 這裡無 override */
}
```

> **重要**:不寫 `width: 44px` / `var(--text)` 沉黑、那是錯的(spec 原版假設、Step 0 修正)。對齊現有 ❤️ 💬 才是正確視覺。

#### 寬度檢查

- `--max-w: 512px`、扣 padding 約 480px
- 三個 padding 6/10 的鈕 + 數字 + 留白約佔 200-240px、安全
- Step 1 mobile 實機驗證

#### Icon

- 不用 emoji(各平台渲染不一致、Q3 task-recording-core spec 寫死)
- 用 SVG arrow-up-right:
```svg
<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="7" y1="17" x2="17" y2="7"></line>
  <polyline points="7 7 17 7 17 17"></polyline>
</svg>
```
- `width="18" height="18"` 對齊現有 ❤️ 💬 SVG 尺寸

---

### 3. 點 ↗️ 後的行為(簡化版、S0-C/D/1 拍板)

```javascript
// member.html 頂部 module 變數區、新增:
let memberData = null;  // S0-D:main() 中 snap.data() 存進來、供 handleShare 等之後使用

// main() 內、原本 renderHero(snap.data()) 之前 / 之後加:
memberData = snap.data();
renderHero(memberData);

// 新函式:
async function handleShare(fileId) {
  // S0-1:刪掉「find recording」、訊息模板只需要 member + fileId
  if (!memberData) return;  // 防呆:member 還沒 load

  // 1. 組訊息
  const shareUrl = `${window.location.origin}${window.location.pathname}?id=${memberData.docId || new URLSearchParams(window.location.search).get('id')}#rec=${fileId}`;
  // 註:memberData 不一定有 docId 欄位、從 URL 抓 id 最穩

  const memberId = new URLSearchParams(window.location.search).get('id');
  const finalShareUrl = `${window.location.origin}${window.location.pathname}?id=${memberId}#rec=${fileId}`;

  const shareTitle = MESSAGES.share.title(memberData.name, memberData.nickname);

  // 🔑 雙保險:text 欄位裡同時包 URL、防 iOS 13 舊版忽略 url 欄位
  const shareText = `${MESSAGES.share.body(memberData.name)}\n${MESSAGES.share.cta}\n${finalShareUrl}`;

  // 2. 偵測 Web Share API
  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,  // 含 URL、舊版 iOS 仍能拿到 link
        url: finalShareUrl,    // 新版 iOS / Android 走 url 欄位
      });
      // 成功不吃 toast(navigator.share 系統 UI 已給回饋)
    } catch (err) {
      // 使用者取消分享、不吃 toast(err.name === 'AbortError')
      if (err.name !== 'AbortError') console.warn('Share failed:', err);
    }
    return;
  }

  // 3. 沒 Web Share、跳 popover
  showSharePopover({
    title: shareTitle,
    text: shareText,
    url: finalShareUrl,
  });
}
```

> **註**:click handler 應該綁在 ↗️ 鈕上、`onclick="handleShare('${item.fileId}')"` 或 addEventListener 取 `dataset.fileId`、看 Claude Code 對齊 Task 3 的 ❤️ 💬 綁定風格(grep `recording-row__action` 既有 handler)。

---

### 4. Popover(Web Share API 不支援時的 fallback、新 namespace .share-sheet__*)

#### UI 結構

```
┌────────────────────────────┐
│ 分享給家人          ✕      │
├────────────────────────────┤
│                            │
│  [📲 開啟 LINE]            │
│                            │
│  [📋 複製訊息]             │
│                            │
│  [取消]                    │
│                            │
└────────────────────────────┘
```

#### CSS(S0-3 拍板:新 namespace、複製 .comment-sheet__* 動畫 pattern、不複用 class)

```css
.share-sheet__backdrop {
  /* 複製 .comment-sheet__backdrop 結構、但獨立 class */
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1200;
  display: none;
}

.share-sheet__panel {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--max-w);
  height: 280px;  /* 不是 70vh、內容少 */
  background: var(--bg-elevated);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
  z-index: 1201;
  display: none;
  animation: share-sheet-slide 0.25s ease-out;  /* 新動畫、不複用 comment-sheet-slide */
}

@keyframes share-sheet-slide {
  from { transform: translate(-50%, 100%); }
  to   { transform: translate(-50%, 0); }
}

.share-sheet__header { /* 標題 + ✕ */ }
.share-sheet__body { /* 三個按鈕 */ }
.share-sheet__btn { /* 按鈕共用樣式 */ }
```

#### 按鈕行為

**📲 開啟 LINE**:
```javascript
function openLine(message) {
  const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
  window.open(lineUrl, '_blank');
  closeSharePopover();
}
```

**📋 複製訊息**:
```javascript
async function copyMessage(message) {
  try {
    await navigator.clipboard.writeText(message);
    showToast(MESSAGES.share.copiedToast);
    closeSharePopover();
  } catch (err) {
    fallbackCopy(message);
  }
}

function fallbackCopy(message) {
  // 老瀏覽器:textarea + execCommand('copy')
  const textarea = document.createElement('textarea');
  textarea.value = message;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast(MESSAGES.share.copiedToast);
  } catch (err) {
    console.warn('Copy failed:', err);
  }
  document.body.removeChild(textarea);
  closeSharePopover();
}
```

**取消**:純關閉 popover、無副作用。

#### 訊息組合(LINE URL Scheme + 複製共用)

```javascript
const fullMessage = `${shareTitle}\n\n${shareText}`;
// 註:shareText 已含 URL(雙保險策略)、不要再額外 append、避免重複
```

實際組出來:
```
Cina Umav(媽媽)在家族 App 錄了新的話

來聽聽 Cina Umav 錄的這段:
👉 打開 Istanda Mapasnava
https://overpomelo-alt.github.io/istanda-mapasnava/member.html?id=2l95ZhadEN8Xv8hijWty#rec=1XXXxxxFILE_ID
```

LINE URL Scheme 用 encodeURIComponent 包過、不會壞。

---

### 5. Deep link 落點處理(用 fileId、S0-A/B/5 拍板)

#### URL 格式

```
https://overpomelo-alt.github.io/istanda-mapasnava/member.html?id={memberId}#rec={fileId}
```

- `?id=` 是現有 query string、走 member.html 既有邏輯
- `#rec={fileId}` 是新增 hash、用 Drive fileId(不是 Firestore docId、S0-B 拍板)

#### 處理流程(member.html 載入時、await 鏈接、S0-5 拍板)

```javascript
// main() 修改:
async function main() {
  // ... 現有邏輯:load member、renderHero、memberData = snap.data() ...

  await loadRecordings();   // S0-5:從 fire-and-forget 改成 await
  handleDeepLink();          // 確保清單 render 完才 scroll
  setupRecordingsListener(); // 不影響、繼續
}

function handleDeepLink() {
  const hash = window.location.hash; // "#rec=1XXXxxxFILE_ID"
  if (!hash.startsWith('#rec=')) return;

  const targetFileId = hash.slice(5); // "1XXXxxxFILE_ID"

  // 空 hash 防呆
  if (!targetFileId) {
    showToast(MESSAGES.share.notFoundToast);
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return;
  }

  // 🔑 selector 用 data-file-id、S0-A 拍板
  const targetRow = document.querySelector(`.recording-row[data-file-id="${targetFileId}"]`);

  if (!targetRow) {
    // 該筆錄音不存在(被刪、或還在同步)
    showToast(MESSAGES.share.notFoundToast);
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return;
  }

  // scroll 到該 row、smooth + center
  targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // 加高亮 class、2 秒後移除
  targetRow.classList.add('recording-row--highlighted');
  setTimeout(() => {
    targetRow.classList.remove('recording-row--highlighted');
  }, 2000);

  // 🔑 立刻清 hash、F5 後不再重跳(補 B 拍板)
  history.replaceState(null, '', window.location.pathname + window.location.search);
}
```

#### 高亮 CSS

```css
.recording-row--highlighted {
  animation: highlight-pulse 2s ease-out;
}

@keyframes highlight-pulse {
  0%   { box-shadow: 0 0 0 2px var(--accent), 0 0 12px var(--accent); background: rgba(212, 160, 23, 0.08); }
  50%  { box-shadow: 0 0 0 2px var(--accent), 0 0 12px var(--accent); background: rgba(212, 160, 23, 0.08); }
  100% { box-shadow: 0 0 0 0px transparent, 0 0 0px transparent; background: transparent; }
}
```

#### Edge cases

| 情境 | 處理 |
|---|---|
| `#rec=` 後面是空字串 | 走 notFoundToast + 清 hash |
| 該筆錄音剛被刪除 | 同上 |
| 清單還沒 load 完就觸發 handleDeepLink | **await 鏈式保證順序(S0-5 拍板)** |
| **同一頁 F5(已在該 member 頁面)** | **第一次跑完已清 hash、F5 後 hash 不存在、handleDeepLink 直接 return、不再跳**(補 B 拍板) |
| 高亮跑到一半 onSnapshot 觸發 re-render | **S0-4 拍板:風險極低、不加保護邏輯**。理由:按讚 / 留言走 `updateRowLikes` / `updateRowComments` partial DOM update、不重繪 row。只有「同一人在高亮 2 秒內剛好上傳全新錄音」才觸發 full re-render、機率極低、實機觀察即可、不阻塞 |

---

### 6. 樂觀 UI / 錯誤處理

- ✅ **不需要樂觀 UI**:分享是純前端操作、沒寫資料、不會失敗造成「按了沒反應」
- ✅ **navigator.share 取消**:`err.name === 'AbortError'`、不吃 toast(系統 UI 已給回饋)
- ✅ **clipboard.writeText 失敗**:fallback 走 `textarea + execCommand('copy')`(老 Android 用得到)
- ✅ **沒 navigator 也沒 clipboard 的極端老瀏覽器**:`fallbackCopy` 走完仍失敗時 console.warn、不擋 UX(popover 自然關閉、家人可手動長按複製訊息)

---

## 🪜 Step 順序

### ✅ Step 0:第二層 Recon — 已完成

Claude Code 已爬完 member.html 全 1715 行 + style.css + coding_principles、回報 10 條拍板、全部納入本 spec。詳見上方「Step 0 第二層 Recon」表。

---

### Step 1:加 ↗️ 鈕到每筆 row + i18n MESSAGES 結構

1. 在 `member.html` 頂部 module 變數區、加 `MESSAGES` 常數(本 spec 第 1 節、跟 DEVICE_ID_KEY / ME_KEY 同層)
2. 在 row render 函式裡(grep 找 `data-file-id` 設定的地方)、❤️ 💬 後面加 ↗️ 鈕:
   - class:`recording-row__action recording-row__share`
   - SVG arrow-up-right、`width="18" height="18"`
   - click handler:沿用 ❤️ 💬 的綁定風格(grep 看是 inline onclick 還是 addEventListener)
3. click handler 暫時只 `console.log('share clicked', fileId)`、先不接 navigator.share
4. 同時在 main() 加 `let memberData = null` module 變數、main 中 `memberData = snap.data()` 存起來(S0-D 拍板、即使這步還沒用到、先就位)

**A 階段自測**(線上):
- 開個人頁面、看到每筆 row 都有 ↗️ 鈕、視覺對齊 ❤️ 💬(都是灰調)
- 點 ↗️ console 印出 fileId
- mobile 實機看寬度沒爆、三鈕橫排不擠
- F5 後 onSnapshot re-render、↗️ 鈕仍在
- console 沒 error

**B+C+D**:push → 線上 Ctrl+Shift+R → 實測

---

### Step 2:接 Web Share API + Popover fallback

1. 寫 `handleShare(fileId)` 函式(本 spec 第 3 節、含 text 欄位雙保險)
2. 寫 `showSharePopover() / closeSharePopover()`、用新 `.share-sheet__*` namespace、CSS 寫進 style.css
3. 寫 `openLine(message) / copyMessage(message) / fallbackCopy(message)`
4. ↗️ click handler 改接 `handleShare(fileId)`
5. Popover HTML 結構寫在 member.html 底部、預設 `display: none`

**A 階段自測**(線上):
- **mobile Chrome / Safari**:點 ↗️ → 跳系統 Share Sheet、選 LINE → LINE 開啟、訊息預填正確(含 URL)
- **mobile 取消分享**:跳出 Share Sheet 後按取消、不吃 toast(對)
- **舊版 iOS(若有手邊機器)**:點 ↗️ → 分享後 LINE 看到的訊息**仍含 URL**(text 雙保險生效)
- **桌機 Chrome**(沒 Web Share):點 ↗️ → 跳 popover、看到「開啟 LINE」「複製訊息」雙鈕
- **桌機點「開啟 LINE」**:跳 line.me 網頁版、訊息預填正確(URL 沒亂碼)
- **桌機點「複製訊息」**:吃 toast「✓ 已複製」、貼到 LINE 看訊息完整
- **桌機點「取消」**:popover 關閉、無副作用
- **桌機點 backdrop**:popover 關閉、無副作用

**B+C+D**:push → 線上實測一輪

---

### Step 3:Deep link hash 解析 + scroll + 高亮 + F5 不重跳

1. 改 main():`loadRecordings()` 從 fire-and-forget 改成 `await loadRecordings(); handleDeepLink();`(S0-5)
2. 寫 `handleDeepLink()` 函式(本 spec 第 5 節、selector 用 `data-file-id`、含立刻清 hash)
3. CSS:`.recording-row--highlighted` + `@keyframes highlight-pulse`、寫進 style.css
4. 確認 row render 時 `data-file-id` 已設(現有就有、S0-A 確認、不用新增)

**A 階段自測**(線上):
- **完整流程**:Cina Umav 頁面 → 點 ↗️ 第一筆錄音 → 複製訊息 → 開 LINE → 貼上送出 → 點 link → 跳回 App、自動 scroll 到該筆 + 金邊閃 2 秒
- **F5 不重跳**(補 B 拍板):跳完高亮後立刻 F5、應該**不再 scroll、不再高亮**(因 hash 已清)
- **不存在的 fileId**:手動改 URL `?id=2l95...#rec=NOTEXIST` → toast「這段錄音已被刪除或還在同步中」、hash 清掉
- **空 hash**:手動改 URL `?id=2l95...#rec=` → toast 同上
- **正常頁面載入**(沒 hash):main() 應如常運作、handleDeepLink 直接 return、不影響

**B+C+D**:push → 線上實測

---

### Step 4:全部整合 + DoD 驗收

完成定義:

- [ ] 每筆 row 看到 ↗️ 鈕、跟 ❤️ 💬 對齊(灰調 + 18×18 SVG)、mobile 不爆寬
- [ ] mobile 點 ↗️ → 系統 Share Sheet 跳出
- [ ] mobile 從 Share Sheet 選 LINE → LINE 開啟、訊息預填(標題 + 內文 + URL 完整)
- [ ] 桌機點 ↗️ → popover 跳出、見「開 LINE」「複製」「取消」三鈕
- [ ] 桌機點「開 LINE」 → 跳 line.me、訊息預填
- [ ] 桌機點「複製」 → 吃 toast、貼 LINE 訊息完整
- [ ] 桌機點「取消」 / 點 backdrop → popover 關閉、無副作用
- [ ] **Deep link**:點 LINE 收到的 URL → 跳 App → 自動 scroll 到該筆 + 金邊閃 2 秒
- [ ] **F5 不重跳**:跳完後 F5、不再 scroll / 不再高亮
- [ ] Deep link 找不到該筆 → toast「已刪除或同步中」
- [ ] 訊息模板組出來在 LINE 看起來像「3 行 + URL」、不會擠
- [ ] **iOS 雙保險**:text 欄位含 URL、新舊 iOS 都能拿到 link
- [ ] **空 nickname 防呆**:故意把某成員 nickname 改空、訊息模板沒出現「name()」醜括號
- [ ] i18n MESSAGES 結構就位、之後加布農語不用回頭改 share button code
- [ ] iOS Safari 沒 console error、Android Chrome 沒 console error
- [ ] 線上版 GitHub Pages 一切正常、無痕視窗可用

---

## ⚠️ 不要做的事

- ❌ **不要動 Apps Script**(純前端)
- ❌ **不要動 Firestore schema**(不加任何欄位)
- ❌ **不要做「被分享 N 次」counter**(這次範圍外、之後可選加)
- ❌ **不要做「分享到特定家人」selector**(這次範圍外、走原生 Share Sheet 讓使用者選)
- ❌ **不要動首頁 index.html**(Task 5 才動)
- ❌ **不要做自動播放**(iOS 會擋、Q1 拍板)
- ❌ **不要動 Task 3 的按讚 / 留言邏輯**(只新增、不修改)
- ❌ **不要擅自加布農語**(`MESSAGES` 結構先留中文、等家人填入)
- ❌ **不要 F5 重跳 deep link 高亮**(補 B 拍板、清 hash 防閃眼)
- ❌ **不要新增 `data-doc-id` 之類的 attribute**(沿用現有 `data-file-id`、S0-A 拍板)
- ❌ **不要把 deep link 改用 Firestore docId**(用 fileId 就夠、更乾淨、S0-B 拍板)
- ❌ **不要複用 `.comment-sheet__*` class**(新開 `.share-sheet__*` namespace、S0-3 拍板)
- ❌ **不要把 ↗️ 鈕做成 44×44 沉黑**(對齊現有 `.recording-row__action` 灰調、S0-2 拍板)
- ❌ **不要抽 i18n.js**(inline 在 member.html、Task 5 / 7 再抽、S0-6 拍板)

---

## 📞 規則 6:不確定就問

特別容易遇到的:
- mobile Safari Share Sheet 行為跟假設不同(例如某些版本不支援 text 欄位多行)
- `.share-sheet__*` 跟現有 `.comment-sheet__*` 雖然 namespace 不同、但 z-index 衝突(目前用 1200/1201、第一個 Bottom Sheet 已用 1200)→ 撞到時調 z-index
- highlight 動畫跟 onSnapshot re-render 撞、class 被洗掉(S0-4 已分析機率極低、但實機真撞到再回報)
- iOS 13 雙保險方案實機測出 url 欄位行為跟假設不同
- ↗️ click handler 沿用 ❤️ 💬 風格時、發現 ❤️ 💬 風格不一致(例如混用 inline + addEventListener)

任何一條冒出來、**停下來問聖瑱師、不要硬寫**。

---

## 📚 參考資料

- Web Share API MDN:https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API
- Web Share API iOS Safari 支援表:https://caniuse.com/web-share
- LINE URL Scheme(text):`https://line.me/R/msg/text/?{encoded}`
- 教師手帳工程準則:`specs/coding_principles.md`
- 北極星:`specs/north-star.md`(衡量成功第 3 題、第二層場景 B)
- Task 1 spec 格式範本:`specs/task-recording-core.md`
- Task 3 已建立的 row UI 結構:`script.js` / `member.html`(Step 0 偵察報告已歸檔)

---

*Created: 2026-05-25(第一層 Recon 完成、5+2 題拍板)*
*Updated: 2026-05-25(Step 0 第二層 Recon 完成、補 10 條拍板、合計 5+2+10 條)*
*Status: Step 0 完成、Claude Code 可動工 Step 1*
```

---

## 📌 接下來照原本流程

1. **複製**上面整份 markdown(右上角複製按鈕)
2. **VS Code 開** `C:\Users\User\istanda-mapasnava\specs\task-line-share.md`
3. **Ctrl+A → Delete → Ctrl+V → Ctrl+S**(整份覆蓋存檔)
4. **cmd 跑**:
   ```cmd
   cd C:\Users\User\istanda-mapasnava
   git add specs/task-line-share.md
   git commit -m "Update Task 4 spec per Step 0 Recon findings"
   git push origin main
   ```
5. **GitHub 驗證**:打開 https://github.com/overpomelo-alt/istanda-mapasnava/blob/main/specs/task-line-share.md、看「拍板結果」段有沒有變成「**第一層 Recon + Step 0 第二層 Recon**」兩個表格

6. **驗證後切 Claude Code**、貼:
```
Step 0 Recon 拍板完成、spec 已更新推上 GitHub。
請重新讀 specs/task-line-share.md、確認跟 Step 0 報告對齊、
然後進 Step 1:加 ↗️ 鈕 + MESSAGES 結構 + memberData module 變數。

請同時遵守 specs/coding_principles.md 的 13 條準則。
依規則 8:每子步驗證 PASS 才進下一步、等聖瑱師回 ok 才推進。
```

---

**做完 push 回來告訴我新 commit hash、然後動 Step 1。** ✨