# Task 4: LINE 一鍵分享

> 給 Claude Code 的標準工作指令。
> 開頭請讀:specs/coding_principles.md、specs/current-status.md、specs/north-star.md、specs/task-recording-core.md(對齊格式)
> 遵守規則 10:先 Recon、後動工、每個 Step 之間等使用者回「ok」。
>
> **狀態:第一層 Recon 已完成、五題已拍板、Claude Code 動 Step 1 前需先跑 Step 0 第二層 Recon**

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
小朋友 A:「誰幫我錄一句『我好餓』的布農族語」
堂姊:「⬆️ 我剛在 App 錄了」← 這個 ⬆️ 就是 Task 4 產出的訊息
3 個人按愛心、4 則留言。

設計判準:
- ✅ 分享要快(2 tap 內完成、不打斷對話節奏)
- ✅ 訊息要有溫度(不是純 URL、要有名字 + 描述)
- ✅ 不要把家人趕出 App(分享後堂哥點回來、要落在「就是這筆」、不是首頁)

---

## 📦 環境資訊(不要動)

### 不動的東西

- ❌ **不動 Apps Script**:純前端、不寫後端
- ❌ **不動 Firestore schema**:`recordings` / `members` 欄位完全不新增
- ❌ **不動 `members` / `recordings` 既有資料**:讀現有的 name / nickname / fileId / docId 組訊息即可
- ❌ **不動首頁 `index.html`**:Task 4 只動 `member.html` + `style.css`(MESSAGES 結構寫在 member.html 內部)

### 視覺(沿用 v2、白底 + 五色)

- 全部用 CSS 變數、不寫死色碼
- ↗️ 鈕配色:`var(--text)` 沉黑、hover `var(--bg-soft)` 米色(對齊現有 ❤️ 💬 鈕)
- 高亮動畫:用 `var(--accent)` 薑黃 `#d4a017` 邊框閃 2 秒、淡入淡出
- toast:複用既有 `.global-toast` / `.global-toast--show`
- Popover:複用 Task 3 Bottom Sheet 動畫風格(slide-up + backdrop)、高度 280px

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

## ✅ 第一層 Recon 拍板結果(2026-05-25 規劃對話框)

| # | 問題 | 拍板 |
|---|---|---|
| Q1 | Deep link 落點(跳哪)? | **B**:跳 `member.html?id=X#rec=Y`、自動 scroll + 2 秒金邊高亮、**不自動播放**(iOS 擋) |
| Q2 | 訊息模板雙語規劃? | **A**:6/15 前純中文、但寫成 i18n-ready 結構(`MESSAGES.share.title` 這種) |
| Q3 | 分享 UI 放哪? | **A**:每筆 row 加 ↗️、變成 ❤️ 💬 ↗️ 三鍵橫排 |
| Q4 | Web Share API 失敗 fallback? | **C**:跳 popover、同時提供「開 LINE」+「複製訊息」雙鈕 |
| Q5 | 動不動 Apps Script / Firestore? | **不動**:純前端、純讀現有資料 |
| 補 A | iOS 13 舊版相容? | **乙**:text 欄位同時包 URL、雙保險 |
| 補 B | F5 同頁要不要重跳高亮? | **B**:不重跳、handleDeepLink 第一次跑完清掉 hash、F5 後 hash 沒了不再觸發 |

---

## 📋 規格細節

### 1. 訊息模板(i18n-ready 結構)

寫在 `member.html` 內 inline(Step 0 第二層 Recon 時 Claude Code 可建議要不要抽 `i18n.js`、依現有檔案結構判斷):

```javascript
const MESSAGES = {
  share: {
    // 分享訊息標題(Web Share API 的 title 欄位、桌機 popover 標題用)
    title: (name, nickname) =>
      `${name}(${nickname})在家族 App 錄了新的話`,

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

完整訊息組合(範例):
Cina Umav(媽媽)在家族 App 錄了新的話
來聽聽 Cina Umav 錄的這段:
👉 打開 Istanda Mapasnava
https://overpomelo-alt.github.io/istanda-mapasnava/member.html?id=2l95ZhadEN8Xv8hijWty#rec=abc123

**為什麼這樣設計**:
- 三行短文 + URL、複製貼上 LINE 後不會擠成一坨
- 名字 + 暱稱雙標示、堂哥看「Cina Umav(媽媽)」立刻知道是誰
- CTA 用 emoji + 中文、視覺亮點、引導點 link

**🟡 i18n 預留**:之後加布農語、只要把 `MESSAGES.share` 改成:
```javascript
const MESSAGES = {
  zh: { share: { ... } },  // 中文
  bnn: { share: { ... } }, // 布農語(等家人填入)
};
const currentLang = localStorage.getItem('istanda_lang') || 'zh';
// 使用時:MESSAGES[currentLang].share.title(name, nickname)
```
不用回頭改 share button 的呼叫 code、只改字典本身。

---

### 2. UI:每筆錄音 row 加 ↗️ 鈕

Task 3 已建立的雙行 row 結構:
[現有] 上行: ❤️  💬
下行: N 個讚 · M 則留言

Task 4 改成:
[新版] 上行: ❤️  💬  ↗️
下行: N 個讚 · M 則留言

#### CSS

- ↗️ 鈕跟 ❤️ 💬 樣式一致:44×44 觸控目標、transparent 背景、`var(--text)` 沉黑、hover `var(--bg-soft)` 米色
- 三鈕橫排間距:沿用現有 gap、不擠
- 寬度檢查:`--max-w: 512px`、扣 padding 約 480px、三個 44×44 + 數字 + 留白約佔 280-320px、安全
- **Step 0 第二層 Recon 必驗**:在實機 mobile 看是否真的擠到、Claude Code 自測

#### Icon

- 不用 emoji(各平台渲染不一致、Q3 task-recording-core spec 寫死)
- 用 SVG arrow-up-right:
```svg
<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="7" y1="17" x2="17" y2="7"></line>
  <polyline points="7 7 17 7 17 17"></polyline>
</svg>
```
- 顏色用 `currentColor`、配合 `var(--text)` 沉黑

---

### 3. 點 ↗️ 後的行為

```javascript
async function handleShare(recordingDocId, memberId) {
  // 1. 撈該筆 recording + member 資料(已在 onSnapshot 快取裡、不另發 query)
  const recording = cachedRecordings.find(r => r.id === recordingDocId);
  const member = cachedMember; // 已是當前頁面的 member

  // 2. 組訊息
  const shareUrl = `${window.location.origin}${window.location.pathname}?id=${memberId}#rec=${recordingDocId}`;
  const shareTitle = MESSAGES.share.title(member.name, member.nickname);

  // 🔑 雙保險:text 欄位裡同時包 URL、防 iOS 13 舊版忽略 url 欄位
  const shareText = `${MESSAGES.share.body(member.name)}\n${MESSAGES.share.cta}\n${shareUrl}`;

  // 3. 偵測 Web Share API
  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,  // 含 URL、舊版 iOS 仍能拿到 link
        url: shareUrl,    // 新版 iOS / Android 走 url 欄位、視平台可能不重複顯示
      });
      // 成功不吃 toast(navigator.share 系統 UI 已給回饋)
    } catch (err) {
      // 使用者取消分享、不吃 toast(err.name === 'AbortError')
      if (err.name !== 'AbortError') console.warn('Share failed:', err);
    }
    return;
  }

  // 4. 沒 Web Share、跳 popover
  showSharePopover({
    title: shareTitle,
    text: shareText,
    url: shareUrl,
  });
}
```

---

### 4. Popover(Web Share API 不支援時的 fallback)

#### UI 結構
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

- 從下方滑入(對齊 Task 3 Bottom Sheet 動畫風格、複用 CSS)
- 高度約 280px(不用 70%、內容少)
- 背景 `var(--bg-elevated)` 純白、上圓角 16px、淡 shadow
- backdrop `rgba(0,0,0,0.5)`、點擊關閉

#### 按鈕行為

**📲 開啟 LINE**:
```javascript
function openLine(message) {
  const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
  window.open(lineUrl, '_blank');
  closeSharePopover();
}
```
- 桌機有裝 LINE → 跳 LINE App 選聊天室
- 桌機沒裝 LINE → 跳網頁版 line.me、要登入
- 不吃 toast(LINE 系統 UI 已給回饋)

**📋 複製訊息**:
```javascript
async function copyMessage(message) {
  try {
    await navigator.clipboard.writeText(message);
    showToast(MESSAGES.share.copiedToast); // ✓ 已複製
    closeSharePopover();
  } catch (err) {
    // 老瀏覽器 fallback:textarea + document.execCommand('copy')
    fallbackCopy(message);
  }
}
```

**取消**:純關閉 popover、無副作用。

#### 訊息組合(LINE URL Scheme + 複製共用)

```javascript
const fullMessage = `${shareTitle}\n\n${shareText}`;
// 注意:shareText 已含 URL(雙保險策略)、不要再額外 append 一次 URL、避免重複
```

實際組出來:
Cina Umav(媽媽)在家族 App 錄了新的話
來聽聽 Cina Umav 錄的這段:
👉 打開 Istanda Mapasnava
https://overpomelo-alt.github.io/istanda-mapasnava/member.html?id=2l95ZhadEN8Xv8hijWty#rec=abc123

LINE URL Scheme 用 encodeURIComponent 包過、不會壞。

---

### 5. Deep link 落點處理(B 拍板)

#### URL 格式
https://overpomelo-alt.github.io/istanda-mapasnava/member.html?id={memberId}#rec={recordingDocId}

- `?id=` 是現有 query string、走 member.html 既有邏輯
- `#rec=` 是新增 hash、Task 4 新邏輯處理

#### 處理流程(member.html 載入時)

```javascript
// 在 loadRecordings 完成、清單 render 好之後執行
function handleDeepLink() {
  const hash = window.location.hash; // "#rec=abc123"
  if (!hash.startsWith('#rec=')) return;

  const targetDocId = hash.slice(5); // "abc123"

  // 空 hash 防呆(`#rec=` 後面是空字串)
  if (!targetDocId) {
    showToast(MESSAGES.share.notFoundToast);
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return;
  }

  const targetRow = document.querySelector(`.recording-row[data-doc-id="${targetDocId}"]`);

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

  // 🔑 立刻清 hash、F5 後不再重跳(B 拍板)
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
| 清單還沒 load 完就觸發 handleDeepLink | 在 `loadRecordings().then(handleDeepLink)` 鏈式呼叫、保證順序 |
| **同一頁 F5(已在該 member 頁面)** | **第一次跑完已清 hash、F5 後 hash 不存在、handleDeepLink 直接 return、不再跳**(B 拍板、防連按 F5 閃眼) |
| 高亮跑到一半 onSnapshot 觸發 re-render | **Step 0 第二層 Recon 必驗**:re-render 會不會洗掉 `.recording-row--highlighted` class、若會、需在 render 時保留動畫進行中的 row |

---

### 6. 樂觀 UI / 錯誤處理

- ✅ **不需要樂觀 UI**:分享是純前端操作、沒寫資料、不會失敗造成「按了沒反應」
- ✅ **navigator.share 取消**:`err.name === 'AbortError'`、不吃 toast(系統 UI 已給回饋)
- ✅ **clipboard.writeText 失敗**:fallback 走 `textarea + execCommand('copy')`(老 Android 用得到)
- ✅ **沒 navigator 也沒 clipboard 的極端老瀏覽器**:popover 內加一個 `<textarea readonly>` 預選文字、家人自己按長按複製(終極 fallback)

---

## 🪜 Step 順序

### Step 0:第二層 Recon(Claude Code 動筆前)

**這一步 Claude Code 不寫 code、只爬 code + flag 風險**。

1. grep `member.html` 看現有 row 結構(❤️ 💬 區塊):
   - 兩個鈕的 class 命名慣例
   - row 上行的 flex / gap 設定
   - 數字行(N 個讚 · M 則留言)的位置
   - row 上是否已有 `data-doc-id` attribute、若無需新增
2. grep `script.js` / `member.html` 看 `cachedRecordings` / `cachedMember` 之類的快取結構是否存在(用來組分享訊息免重撈)、確認 spec line 168 的假設是否正確
3. 檢查現有 `.global-toast` API:呼叫方式、文字參數
4. 檢查 Task 3 Bottom Sheet 的 CSS:是否能複用(共用 backdrop + slide-up 動畫)、class 命名是否會撞
5. 檢查 `onSnapshot` 觸發 re-render 的時機:會不會把 `.recording-row--highlighted` class 洗掉(spec line 320 Edge case)
6. 檢查 `MESSAGES` 結構放哪:依現有檔案結構建議「寫在 member.html inline」or「抽 i18n.js」、考量首頁 index.html 未來 Task 5 / Task 7 雙語化時的複用性
7. **回報偵察報告**、列出:
   - 找到的 class 名稱、API 名稱(讓 spec 跟現實對齊)
   - spec 沒寫到的衝突 / 風險
   - 建議調整的 spec 段落

**等聖瑱師看完偵察報告、回 ok 才進 Step 1**。

---

### Step 1:加 ↗️ 鈕到每筆 row + i18n MESSAGES 結構

1. 依 Step 0 Recon 結論、把 `MESSAGES` 常數放在指定位置(member.html inline or i18n.js)
2. 在 row render 函式裡、❤️ 💬 後面加 ↗️ 鈕(SVG arrow-up-right、`data-doc-id` 帶 recording docId)
3. 綁 click handler 暫時只 console.log:`console.log('share clicked', docId)`、先不接 navigator.share
4. CSS:`.share-btn`、樣式對齊 `.like-btn` / `.comment-btn`(class 名依 Step 0 Recon 找到的命名慣例調整)

**A 階段自測**(線上):
- 開個人頁面、看到每筆 row 都有 ↗️ 鈕、視覺對齊 ❤️ 💬
- 點 ↗️ console 印出 docId
- mobile 實機看寬度沒爆、三鈕橫排不擠
- F5 後 onSnapshot re-render、↗️ 鈕仍在

**B+C+D**:push → 線上 Ctrl+Shift+R → 實測

---

### Step 2:接 Web Share API + Popover fallback

1. 寫 `handleShare(recordingDocId, memberId)` 函式(本 spec 第 3 節、含 text 欄位雙保險)
2. 寫 `showSharePopover()` / `closeSharePopover()`、複用 Task 3 Bottom Sheet CSS
3. 寫 `openLine(message)` / `copyMessage(message)` / `fallbackCopy(message)`
4. ↗️ click handler 改接 `handleShare`
5. Popover HTML 結構寫在 member.html 底部、預設 `display: none`

**A 階段自測**(線上):
- **mobile Chrome / Safari**:點 ↗️ → 跳系統 Share Sheet、選 LINE → LINE 開啟、訊息預填正確(含 URL)
- **mobile 取消分享**:跳出 Share Sheet 後按取消、不吃 toast(對)
- **舊版 iOS(若有手邊機器)**:點 ↗️ → 分享後 LINE 看到的訊息**仍含 URL**(text 雙保險生效)
- **桌機 Chrome**(沒 Web Share):點 ↗️ → 跳 popover、看到「開啟 LINE」「複製訊息」雙鈕
- **桌機點「開啟 LINE」**:跳 line.me 網頁版、訊息預填正確(URL 沒亂碼)
- **桌機點「複製訊息」**:吃 toast「✓ 已複製」、貼到 LINE 看訊息完整
- **桌機點「取消」**:popover 關閉、無副作用

**B+C+D**:push → 線上實測一輪

---

### Step 3:Deep link hash 解析 + scroll + 高亮 + F5 不重跳

1. 寫 `handleDeepLink()` 函式(本 spec 第 5 節、含立刻清 hash 邏輯)
2. 在 `loadRecordings()` 完成後呼叫 `handleDeepLink()`(鏈式、保證 row 已 render)
3. CSS:`.recording-row--highlighted` + `@keyframes highlight-pulse`
4. row render 時加 `data-doc-id` attribute(Step 1 已加、Step 3 用得到)

**A 階段自測**(線上):
- **完整流程**:Cina Umav 頁面 → 點 ↗️ 第一筆錄音 → 複製訊息 → 開 LINE → 貼上送出 → 點 link → 跳回 App、自動 scroll 到該筆 + 金邊閃 2 秒
- **F5 不重跳**(B 拍板):跳完高亮後立刻 F5、應該**不再 scroll、不再高亮**(因 hash 已清)
- **不存在的 docId**:手動改 URL `?id=2l95...#rec=NOTEXIST` → toast「這段錄音已被刪除或還在同步中」、hash 清掉
- **空 hash**:手動改 URL `?id=2l95...#rec=` → toast 同上
- **onSnapshot 觸發 re-render**:在高亮 2 秒內、另一裝置按讚同一頁、看高亮會不會被洗掉(Step 0 Recon 已 flag、若有問題此處實測會 surface)

**B+C+D**:push → 線上實測

---

### Step 4:全部整合 + DoD 驗收

完成定義:

- [ ] 每筆 row 看到 ↗️ 鈕、跟 ❤️ 💬 對齊、mobile 不爆寬
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

---

## 📞 規則 6:不確定就問

特別容易遇到的:
- Step 0 Recon 發現現有 `cachedRecordings` 結構跟 spec 假設不同(例如沒快取、每次都重撈)
- mobile Safari Share Sheet 行為跟假設不同(例如某些版本不支援 text 欄位多行)
- popover 跟 Task 3 Bottom Sheet 共用 CSS 時撞 class 名
- highlight 動畫跟 onSnapshot re-render 撞、class 被洗掉
- iOS 13 雙保險方案實機測出 url 欄位行為跟假設不同

任何一條冒出來、**停下來問聖瑱師、不要硬寫**。

---

## 📚 參考資料

- Web Share API MDN:https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API
- Web Share API iOS Safari 支援表:https://caniuse.com/web-share
- LINE URL Scheme(text):`https://line.me/R/msg/text/?{encoded}`
- 教師手帳工程準則:`specs/coding_principles.md`
- 北極星:`specs/north-star.md`(衡量成功第 3 題、第二層場景 B)
- Task 1 spec 格式範本:`specs/task-recording-core.md`
- Task 3 已建立的 row UI 結構:`script.js` / `member.html`(Step 0 Recon 時 grep)

---

*Created: 2026-05-25(規劃對話框第一層 Recon 完成、5+2 題拍板)*
*Status: 等聖瑱師存檔推 GitHub、然後切去 Claude Code 跑 Step 0 第二層 Recon*
