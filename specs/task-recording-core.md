# Task: 個人頁面 member.html（錄音核心）

> 給 Claude Code 的標準工作指令。
> 開頭請讀：specs/coding_principles.md、specs/current-status.md、specs/north-star.md
> 遵守規則 10：先 Recon、後動工，每個 Step 之間等使用者回「ok」。

---

## 🎯 任務目標

建立 `member.html`，讓任何家族成員（從首頁卡片點進來）能在自己的頁面：
1. 看到自己的族名、暱稱、頭像、錄音總數
2. 點大金色麥克風按鈕錄音（點擊切換、不是按住）
3. 錄完先試聽，可以重錄或上傳
4. 上傳成功 → 寫進 Drive、寫進 Firestore `recordings`、更新成員的 recordCount
5. 看到自己所有過去的錄音清單，可逐筆播放

---

## 📦 環境資訊（不要動）

### 後端
- Apps Script URL：
  ```
  https://script.google.com/macros/s/AKfycbxAglNgdZo-KCyRaOYWRjrNhIQvjRC8exQn_ATqX7ozvTCKRsCTqLsWwAJDVEcKZQYnoQ/exec
  ```
- 支援端點：POST 上傳、GET ?id= 讀單檔、GET ?action=list 列清單
- 已驗證能跑（無痕視窗回傳 `{}`）

### Firebase
- 設定請從 `index.html` 複製
- 集合：
  - `members`（已有，2 筆 seed：Cina Umav `2l95ZhadEN8Xv8hijWty`、Tama Iman `pFPQxryRyP8cncnvP7h4`）
  - `recordings`（**這個任務要建立**）

### 視覺
- 風格延續 `index.html`：白底 + 深色 hero + 金色 #c8a96e
- 字型：-apple-system, BlinkMacSystemFont, 'Noto Sans TC'

---

## 📋 規格細節（已拍板，不要再問）

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
- 「N 則錄音」11px 灰白色

### 3. 錄音區
- 標題「🎙 錄一段話」
- 大圓形麥克風按鈕：100×100、金色 #c8a96e、白色麥克風 emoji
- 點擊邏輯：
  - 第 1 次點 → 開始錄音、按鈕變紅 #d04848 + pulse 動畫、文字變「⏹」
  - 第 2 次點 → 停止錄音、跳出試聽區
- 錄音中顯示：「錄音中...再點一次停止」+ 紅色倒數計時 MM:SS

### 4. 試聽區（錄完才出現）
- 三顆按鈕橫排：
  - **▶ 試聽**（白底黑字）→ 點了播放、播放中顯示「⏸ 暫停」
  - **↻ 重錄**（灰）→ 清掉預覽、回到初始狀態
  - **☁ 上傳**（金色）→ 上傳中顯示「☁ 上傳中...」、按鈕 disabled
- 上傳成功 → 試聽區消失、重新撈清單、上面成員的 recordCount +1

### 5. 上傳邏輯
- 檔名格式：`{memberId}.webm`（Apps Script 會自動加時間戳變成 `{memberId}_MMDDHHMM.webm`）
- 上傳成功後寫進 Firestore `recordings` 集合：
  ```js
  {
    memberId: "xxx",
    fileId: "xxx",           // Apps Script 回傳的 Drive file ID（需要修改 Apps Script 回傳值，見 Risk 1）
    filename: "xxx",
    createdAt: serverTimestamp(),
    likes: 0,
    comments: []
  }
  ```
- 同時 `updateDoc(members/{id}, { recordCount: increment(1) })`

### 6. 過去錄音清單
- 撈 `GET ?action=list`，從回傳的 map 取 `map[memberId]`
- 依檔名倒序排（最新在最上面）
- 每筆顯示：
  - 🎵 圖示
  - 日期 MM/DD HH:MM（從檔名 `_MMDDHHMM` 解析）
  - 「第 N 段錄音」
  - 播放按鈕（黑色圓形）
- 點播放：用 `GET ?id={fileId}` 拿 base64、解碼後播放、播放中按鈕變金色
- 點播放中的按鈕 → 暫停

### 7. 底部 nav
- 沿用 `index.html` 的四個 tab：首頁 / 族語本 / 成員 / 錄音
- 當前頁面 active 哪個 tab：「錄音」

---

## 🚨 Recon 階段（動工前先做）

**Claude Code 你先做這幾件事、報告完再等使用者「ok」才繼續：**

### Recon 1：讀現有 index.html
- grep `firebaseConfig`，確認 Firebase 設定怎麼寫
- grep `getDocs(collection(db, 'members'))`，看現有的讀法
- **回報**：firebaseConfig 整段貼出來，確認跟 current-status.md 一致

### Recon 2：檢查 Apps Script 端點回傳值
- 注意 spec 第 5 條提到「寫進 Firestore 需要 fileId」，但目前 Apps Script 的 doPost 只回傳 `{ok: true}`，**不回傳 fileId**
- **這是 Risk 1**：要嘛先改 Apps Script 讓 doPost 回傳 fileId、要嘛 Firestore 先不寫 fileId（之後對清單時才補）
- **請 Claude Code 在 Recon 階段直接 flag 這個風險、並給兩個方案、等使用者決定**

### Recon 3：iOS Safari 的 MediaRecorder 支援
- grep 「MediaRecorder」這個字串在現有 code 中有沒有出現
- 確認 `audio/webm` 在 iOS Safari 是否能播放
- **回報**：是否需要 fallback 到 `audio/mp4`

### Recon 4：列出 Claude Code 注意到的其他風險
- 任何 spec 沒提到、但 Claude Code 覺得應該攤開的問題、都列出來

---

## 🪜 Step 順序（Recon 完、使用者拍板後）

### Step 1：Apps Script 端調整（如 Recon 2 決定要動）
- 修改 doPost，回傳 `{ok: true, fileId: file.getId(), filename: filename}`
- 在 Apps Script 後台重新部署（版本選新版本）
- 用無痕視窗驗證 GET `?action=list` 仍能跑

### Step 2：建立 member.html 骨架
- 複製 index.html 的 firebaseConfig 區塊
- 寫 Hero + 錄音區 + 清單區 + 底部 nav 的 HTML 結構
- 寫 CSS（沿用 index.html 配色）
- 從 URL 撈 `?id=`、撈 Firestore 對應成員、渲染 Hero
- **A 階段自測**：在本機/GitHub 線上編輯器打開 `member.html?id=2l95ZhadEN8Xv8hijWty`、看 Cina Umav 是否正確渲染

### Step 3：錄音核心功能
- 寫 startRecording / stopRecording
- 寫試聽 / 重錄 / 上傳邏輯
- 寫上傳成功後寫 Firestore + 更新 recordCount
- **A 階段自測**：實際錄一段、試聽、上傳、看 Drive 是否有檔案、Firestore 是否有新文件

### Step 4：過去錄音清單
- 寫 loadRecordings + renderRecordings + playRecording
- 寫檔名解析成日期顯示
- **A 階段自測**：上傳完看到自己剛錄的出現在清單最上面、點播放能聽

### Step 5：B+C+D（無痕視窗驗證 → git push → 線上實測）
- 用無痕視窗訪問 GitHub Pages、避免快取
- `git add . && git commit -m "feat: 個人頁面 member.html" && git push`
- 等 1-2 分鐘 GitHub Pages 部署完
- 線上 Ctrl+Shift+R 強制重整、實測一輪

---

## ✅ 完成定義（DoD）

這個任務算完成的條件：

- [ ] 訪問 `member.html?id=2l95ZhadEN8Xv8hijWty` 看到 Cina Umav 的頁面
- [ ] 訪問 `member.html?id=pFPQxryRyP8cncnvP7h4` 看到 Tama Iman 的頁面
- [ ] 訪問 `member.html?id=不存在的ID` 看到友善錯誤訊息（不是白屏）
- [ ] 訪問 `member.html`（沒帶 id）看到友善錯誤訊息
- [ ] 能成功錄一段、試聽、重錄、上傳
- [ ] 上傳後 Drive 資料夾出現新檔案、Firestore `recordings` 有新文件、`members` 的 recordCount +1
- [ ] 重新整理頁面，看到剛上傳的錄音出現在清單最上面
- [ ] 點清單裡的播放按鈕能聽到音檔
- [ ] 在無痕視窗（沒登入）能正常使用
- [ ] git push 後 GitHub Pages 線上版能跑

---

## ⚠️ 不要做的事

- ❌ **不要碰首頁 index.html**（這個任務只動 member.html 和 Apps Script）
- ❌ **不要建任何 Firestore Security Rules**（test mode 還能撐到 6/10）
- ❌ **不要做按讚 / 留言功能**（已從衝刺路線砍掉、6/15 後再做）
- ❌ **不要做刪除錄音功能**（這次先不做、之後規格再說）
- ❌ **不要做 PWA**（最後一週才做）

---

## 📞 規則 6：不確定就問

如果 Claude Code 遇到 spec 沒提到的情況、**不要硬寫**。停下來問使用者。

特別容易遇到的：
- iOS Safari 的麥克風權限提示
- 上傳失敗的重試策略
- 多裝置同時錄音的衝突

---

## 📚 參考資料

- 加速指南：`教師手帳開發歷程_布農族App加速指南.docx`
- 泰雅語 App 原版錄音流程：另一個專案的 `uploadToDrive` 函式
- 教師手帳工程準則：`specs/coding_principles.md`（fork 自 v1.3）

---

*Last updated: 2026-05-19*
