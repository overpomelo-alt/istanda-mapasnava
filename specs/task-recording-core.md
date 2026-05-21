# Task 1: 個人頁面 member.html（錄音核心）

> 給 Claude Code 的標準工作指令。
> 開頭請讀：specs/coding_principles.md、specs/current-status.md、specs/north-star.md
> 遵守規則 10：先 Recon、後動工、每個 Step 之間等使用者回「ok」。
>
> **狀態：Recon 已完成、六題已拍板、可動工 Step 1**

---

## 🎯 任務目標

建立 `member.html`，讓任何家族成員（從首頁卡片點進來）能在自己的頁面：
1. 看到自己的族名、暱稱、頭像、錄音總數
2. 點大金色麥克風按鈕錄音（點擊切換、不是按住、60 秒自動停）
3. 錄完先試聽、可以重錄或上傳
4. 上傳成功 → 寫進 Drive、寫進 Firestore `recordings`、更新成員的 recordCount
5. 看到自己所有過去的錄音清單、可逐筆播放

---

## 📦 環境資訊（不要動）

### 後端
- Apps Script URL：
  ```
  https://script.google.com/macros/s/AKfycbxAglNgdZo-KCyRaOYWRjrNhIQvjRC8exQn_ATqX7ozvTCKRsCTqLsWwAJDVEcKZQYnoQ/exec
  ```
- 支援端點：POST 上傳、GET ?id= 讀單檔、GET ?action=list 列清單
- 已驗證能跑（無痕視窗回傳 `{}`）
- **Step 1 會修改 doPost 讓它回傳 fileId**

### Firebase
- 設定請從 `index.html` 複製（已驗證一字不差）
- 集合：
  - `members`（已有，2 筆 seed：Cina Umav `2l95ZhadEN8Xv8hijWty`、Tama Iman `pFPQxryRyP8cncnvP7h4`）
  - `recordings`（**這個任務要建立**）

### 視覺
- 風格延續 `index.html`：白底 + 深色 hero + 金色 #c8a96e
- 字型：-apple-system, BlinkMacSystemFont, 'Noto Sans TC'

---

## ✅ Recon 拍板結果（直接照做、不要再問）

| # | 問題 | 拍板 |
|---|---|---|
| Q1 | Apps Script doPost 要不要回 fileId？ | **要**。Step 1 改 doPost 回 `{ok, fileId, filename}` |
| Q2 | iOS Safari mimeType 怎麼處理？ | **動態偵測**：`isTypeSupported('audio/webm') ? webm : mp4`，副檔名跟著走 |
| Q3 | `?action=list` 是否同時列 webm + mp4？ | **Step 1 部署完無痕視窗驗證**（多上傳一筆 mp4 看會不會出現在 list） |
| Q4 | 麥克風權限要不要友善提示？ | **要**。按麥克風前先 toast「等等手機會問要不要用麥克風，請按允許」+ 失敗時友善訊息（不是白屏） |
| Q5 | recordCount 雙寫 or 砍 increment？ | **雙寫**。Firestore 仍 increment(1)，但**個人頁面顯示用「清單長度」為真**（首頁卡片仍讀 recordCount 快速顯示） |
| Q6 | 錄音上限多少？ | **60 秒、到時自動停**（顯示「自動停止」提示、跳出試聽區） |

額外補充（Risk 4 / 5）：
- 直接 push 到 main 線上實測（沒家人在用、不會踩到）
- `?action=list` 全撈標 TODO 註解、6/15 後再加 `?memberId=xxx` 過濾

---

## 📋 規格細節

### 1. 路由
- URL 格式：`member.html?id={memberId}`
- 沒帶 id → 顯示錯誤、不繼續執行
- id 撈不到對應成員 → 顯示錯誤

### 2. Hero 區
- 背景 #1a1a1a
- 左上「← 回首頁」按鈕（點了 history.back()）
- 頭像圓圈（72×72）顯示 initials、背景 #e8dcc8、字色 #7a5c30
- 族名 22px 白色粗體
- 暱稱 13px 金色
- 「N 則錄音」11px 灰白色 ← **N 來自清單長度、不是 recordCount**

### 3. 錄音區
- 標題「🎙 錄一段話」
- 大圓形麥克風按鈕：100×100、金色 #c8a96e、白色麥克風 emoji
- **按麥克風前先顯示 toast**：「💡 等等手機會問要不要用麥克風，請按「允許」」
- 點擊邏輯：
  - 第 1 次點 → 開始錄音、按鈕變紅 #d04848 + pulse 動畫、文字變「⏹」
  - 第 2 次點 → 停止錄音、跳出試聽區
  - **60 秒自動停止**、顯示「⏱ 已達 60 秒上限」toast、跳出試聽區
- 錄音中顯示：「錄音中...再點一次停止」+ 紅色倒數計時 MM:SS（60 秒倒數可選擇順數或倒數，順數即可）
- 麥克風權限被拒 → 顯示 toast「⚠ 麥克風被擋住了，到瀏覽器設定允許」、不要白屏

### 4. 試聽區（錄完才出現）
- 三顆按鈕橫排：
  - **▶ 試聽**（白底黑字）→ 點了播放、播放中顯示「⏸ 暫停」
  - **↻ 重錄**（灰）→ 清掉預覽、回到初始狀態
  - **☁ 上傳**（金色）→ 上傳中顯示「☁ 上傳中...」、按鈕 disabled
- 上傳成功 → 試聽區消失、重新撈清單、上面成員的 recordCount +1

### 5. 上傳邏輯
- mimeType 動態偵測（見 Q2 拍板）
- 副檔名根據 mimeType：webm 或 mp4
- 檔名格式：`{memberId}.{ext}`（Apps Script 會自動加時間戳變成 `{memberId}_MMDDHHMM.{ext}`）
- POST 到 Apps Script，body `{audio: base64, filename: "xxx"}`
- 後端回傳 `{ok, fileId, filename}` 後，寫進 Firestore `recordings`：
  ```js
  {
    memberId: "xxx",
    fileId: "xxx",           // 從 Apps Script 回傳
    filename: "xxx",
    mimeType: "audio/webm",   // 或 audio/mp4
    createdAt: serverTimestamp(),
    likes: 0,
    comments: []
  }
  ```
- 同時 `updateDoc(members/{id}, { recordCount: increment(1) })`

### 6. 過去錄音清單
- 撈 `GET ?action=list`、從回傳的 map 取 `map[memberId]`
- **TODO：6/15 後加 `?memberId=xxx` 過濾參數**（目前全撈）
- 依檔名倒序排（最新在最上面）
- 每筆顯示：
  - 🎵 圖示
  - 日期 MM/DD HH:MM（從檔名 `_MMDDHHMM` 解析）
  - 「第 N 段錄音」
  - 播放按鈕（黑色圓形）
- 點播放：用 `GET ?id={fileId}` 拿 base64、解碼後播放、播放中按鈕變金色
- 點播放中的按鈕 → 暫停
- **清單長度即「Hero 區的 N 則錄音」**

### 7. 底部 nav
- 沿用 `index.html` 的四個 tab：首頁 / 族語本 / 成員 / 錄音
- 當前頁面 active 哪個 tab：「錄音」

---

## 🪜 Step 順序（已拍板、依序執行）

### Step 1：改 Apps Script 回傳 fileId
**動到 Apps Script 後台、不是專案檔案：**

1. 開 `istanda-mapasnava-receiver` Apps Script 編輯器
2. 修改 doPost 函式、把 `return ContentService.createTextOutput(JSON.stringify({ok: true}))` 改成：
   ```javascript
   const file = DriveApp.getFolderById(UPLOAD_FOLDER_ID).createFile(blob);
   return ContentService.createTextOutput(JSON.stringify({
     ok: true,
     fileId: file.getId(),
     filename: filename
   })).setMimeType(ContentService.MimeType.JSON);
   ```
3. 儲存
4. **「管理部署作業 → 編輯 → 版本選新版本 → 部署」**（必做、否則程式碼不會生效）
5. 用無痕視窗訪問 `URL?action=list`、確認回傳仍 `{}`（沒爆）

**A 階段自測**：因為 Apps Script 端我沒辦法直接測 doPost、Step 1 先到此、聖瑱師回 ok 才進 Step 2

### Step 2：建立 member.html 骨架 + Hero 渲染
1. 複製 `index.html` 的 firebaseConfig（已驗證一字不差、直接拿）
2. 寫 Hero + 錄音區（先 placeholder）+ 清單區（先 placeholder）+ 底部 nav 的 HTML
3. 寫 CSS（沿用 index.html 配色 #1a1a1a / #c8a96e / #e8dcc8 / #7a5c30）
4. 從 URL 撈 `?id=`、撈 Firestore 對應成員、渲染 Hero（族名、暱稱、頭像、N 則錄音先寫 0）
5. 錯誤處理：沒帶 id / 撈不到 → 友善訊息（不要白屏）

**A 階段自測**：
- 開 `member.html?id=2l95ZhadEN8Xv8hijWty` → 看 Cina Umav 是否正確渲染
- 開 `member.html?id=pFPQxryRyP8cncnvP7h4` → 看 Tama Iman 是否正確渲染
- 開 `member.html?id=不存在ID` → 看是否顯示友善錯誤
- 開 `member.html`（沒帶 id）→ 看是否顯示友善錯誤

**B+C+D**：push 到 main → 線上 Ctrl+Shift+R → 線上實測一輪

### Step 3：錄音核心
1. 寫 mimeType 動態偵測 helper
2. 寫 startRecording / stopRecording、含 60 秒自動停
3. 寫按麥克風前的 toast 提示 + 權限失敗的友善訊息
4. 寫試聽 / 重錄 / 上傳邏輯
5. 寫上傳成功後寫 Firestore + 更新 recordCount（雙寫）

**A 階段自測**（線上、因為 file:// 拿不到麥克風）：
- 實際錄一段、試聽、確認能聽
- 不滿意按重錄、確認預覽清掉、回到初始
- 滿意按上傳、確認 toast「上傳成功」
- 開 Google Drive 看新檔案進來
- 開 Firestore console 看 `recordings` 集合有新文件
- 開 Firestore console 看 `members` 的 recordCount +1

**測 60 秒自動停**：故意一直講不停、看是否在 60 秒時自動跳試聽

**測 iOS**（如果有 iPhone）：
- 用 iPhone Safari 開頁面、錄一段、看副檔名是 mp4
- Drive 上的 mp4 能播放
- list 同時列 mp4 + webm（驗證 Q3）

**B+C+D**：push → 線上實測一輪

### Step 4：過去錄音清單
1. 寫 loadRecordings + renderRecordings + playRecording
2. 寫檔名解析成日期顯示（`_MMDDHHMM` → `MM/DD HH:MM`）
3. **個人頁面「N 則錄音」改用清單長度**（不要讀 recordCount）

**A 階段自測**：
- 重新整理頁面、看到剛上傳的錄音出現在清單最上面
- 點播放、聽得到
- 上傳第二段、看清單變兩筆、N 從 1 變 2

**B+C+D**：push → 線上實測

### Step 5：全部整合驗收
完成定義（DoD）：
- [ ] `member.html?id=2l95ZhadEN8Xv8hijWty` 看到 Cina Umav 的頁面
- [ ] `member.html?id=pFPQxryRyP8cncnvP7h4` 看到 Tama Iman 的頁面
- [ ] `member.html?id=不存在ID` 看到友善錯誤訊息
- [ ] `member.html`（沒帶 id）看到友善錯誤訊息
- [ ] 按麥克風前看到 toast 提示
- [ ] 能成功錄一段、試聽、重錄、上傳
- [ ] 60 秒自動停
- [ ] 上傳後 Drive 有新檔案、Firestore `recordings` 有新文件、`members` 的 recordCount +1
- [ ] 重新整理頁面看到剛上傳的錄音
- [ ] 點清單裡的播放按鈕能聽
- [ ] 在無痕視窗能正常使用
- [ ] 線上版 GitHub Pages 一切正常

---

## ⚠️ 不要做的事

- ❌ **不要碰首頁 index.html**（這個任務只動 member.html 和 Apps Script）
- ❌ **不要建任何 Firestore Security Rules**（test mode 還能撐到 6/10）
- ❌ **不要做按讚 / 留言功能**（Task 3 才做、預留欄位即可）
- ❌ **不要做 LINE 分享**（Task 4 才做）
- ❌ **不要做刪除錄音功能**（之後規格再說）
- ❌ **不要做 PWA**（Task 6 才做）

---

## 📞 規則 6：不確定就問

如果 Claude Code 遇到 spec 沒提到的情況、**不要硬寫**。停下來問使用者。

特別容易遇到的：
- iOS Safari 真的測出 mimeType 行為跟 Q2 假設不同
- Apps Script 修改完無痕視窗看到非預期回應
- 60 秒自動停的時候 UX 細節（要不要立刻跳試聽？還是讓使用者按一下確認？）

---

## 📚 參考資料

- 加速指南：`教師手帳開發歷程_布農族App加速指南.docx`
- 泰雅語 App 原版錄音流程：另一個專案的 `uploadToDrive` 函式
- 教師手帳工程準則：`specs/coding_principles.md`（fork 自 v1.3）

---

*Last updated: 2026-05-19（補上 Recon 拍板結果、Step 順序細化）*
