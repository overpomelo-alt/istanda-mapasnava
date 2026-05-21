# Istanda Mapasnava — 目前進度

> 最後更新：2026-05-19（v2：對齊新願景）
> 每完成一個段落就更新這份檔案，讓下一個 Claude / Claude Code 一打開就知道現況。

---

## 🎯 專案北極星

**87 人家族的私密 Instagram。**

成功不是「6/15 那天有人哭」，是「6/22 早上媽媽不用人提醒就自己打開」。
詳見 `specs/north-star.md`。

---

## 📅 時間線

- **死線**：2026-06-15（給 87 人家族實際使用）
- **真正的死線**：2026-06-22（一週後還有人打開）
- **今天**：2026-05-19（剩 27 天）
- **理論進度**：第 4 週「族語本」→ **實際進度落後 2 週**
- **補救決策**：砍掉族語本，補回錄音核心 + 互動引擎（詳見「決策記錄」）

---

## ✅ 已完成

### 基礎建設
- [x] Firebase 專案建立（istanda-mapasnava，asia-east1）
- [x] Firestore 資料庫（test mode）
- [x] GitHub repo：`overpomelo-alt/istanda-mapasnava`
- [x] 首頁上線：https://overpomelo-alt.github.io/istanda-mapasnava

### 後端
- [x] **Google Apps Script 後端建立並部署**（istanda-mapasnava-receiver）
- [x] 後端支援三個端點：上傳（POST）、讀單檔（GET ?id=）、列清單（GET ?action=list）
- [x] 無痕視窗驗證後端對任何訪客開放（拿到 `{}`）

### 資料
- [x] Firestore `members` 集合，2 筆 seed 資料：
  - Cina Umav（ID: `2l95ZhadEN8Xv8hijWty`）
  - Tama Iman（ID: `pFPQxryRyP8cncnvP7h4`）
- [x] 首頁能從 Firestore 即時讀取並渲染成員卡片

### 設計決策（已拍板）
- [x] 視覺風格：白底 + 深色 hero + 金色 #c8a96e + 山脈布農圖騰
- [x] 錄音儲存方案：Google Drive（路線 A，Apps Script 代理）
- [x] 砍掉族語本，6/15 後再做
- [x] 錄音 UX：點擊切換 + 試聽後上傳 + 不加標題
- [x] **願景對齊**：87 人家族 Instagram、6/22 持續使用為成功標準
- [x] **必做擴充**：按讚 / 留言 / LINE 分享 / PWA / Feed 即時更新 全部納入 6/15 必做

### Recon 拍板（task-recording-core 動工前）
- [x] **Q1 Risk 1**：走方案 A，改 Apps Script doPost 回傳 `{ok, fileId, filename}`
- [x] **Q2 Risk 2**：iOS Safari mimeType 動態偵測（webm / mp4 fallback）+ 副檔名跟著走
- [x] **Q3 Risk 2 衍生**：Step 1 部署完用無痕視窗測 `?action=list` 是否同時列出 mp4 和 webm
- [x] **Q4 Risk 3**：按麥克風前先 toast 提示「等等手機會問要不要用麥克風」、失敗給友善訊息
- [x] **Q5 Risk 6**：recordCount 雙寫（Firestore + 清單長度），首頁讀 recordCount、個人頁顯示用清單長度為真
- [x] **Q6 Risk 7**：錄音上限 60 秒、自動停止
- [x] **Risk 4 / 5**：直接 push 到 main 線上實測（沒家人在用、安全）；list 全撈標 TODO、6/15 後再優化

---

## 🔄 進行中

- [ ] **Task 1：個人頁面 member.html**（規格見 `specs/task-recording-core.md`、Recon 已完成、等動工）

---

## ⏳ 6/15 前必做（依執行順序）

**本週 5/19-5/25**
1. Task 1：member.html（個人頁面 + 錄音核心 + Apps Script 改回傳 fileId + iOS mimeType）
2. Task 2：首頁卡片可點擊跳轉到 member.html

**下週 5/26-6/1**
3. Task 3：按讚 ❤️ + 留言 💬（Firestore 即時、樂觀更新）
4. Task 4：LINE 一鍵分享（單則錄音、Web Share API）

**第三週 6/2-6/8**
5. Task 5：首頁動態 Feed 改成從 Firestore 即時讀
6. Task 6：PWA 化（manifest.json + sw.js + 圖示）

**緩衝週 6/9-6/15**
- 拍家人頭像照片（盡量收）
- 給 1-2 個家人試用、收回饋
- 修最後 bug
- 6/15 上線 🎉

**第二死線 6/16-6/22**
- 觀察打開率（目標：6/22 ≥ 6/15）
- 7 天內錄第二段以上的人數

## 🗓 6/15 後再做（已從 6/15 衝刺砍掉）

- 族語本（30 句基礎詞彙）
- 影片上傳（Google Drive 嵌入）
- 跟著學功能（年輕人跟著錄回傳）
- 管理員頁面（新增成員）
- 留言通知

---

## 🔑 重要資產 / 連結

### 線上資源
| 項目 | URL / ID |
|---|---|
| 線上首頁 | https://overpomelo-alt.github.io/istanda-mapasnava |
| GitHub repo | https://github.com/overpomelo-alt/istanda-mapasnava |
| Firebase Console | https://console.firebase.google.com/project/istanda-mapasnava |
| Apps Script 編輯器 | https://script.google.com（找 `istanda-mapasnava-receiver`） |

### 後端端點
```
https://script.google.com/macros/s/AKfycbxAglNgdZo-KCyRaOYWRjrNhIQvjRC8exQn_ATqX7ozvTCKRsCTqLsWwAJDVEcKZQYnoQ/exec
```

支援：
- `POST` body `{audio: base64, filename: "xxx.webm"}` → 上傳，回傳 `{ok, fileId, filename}`（Step 1 改完後）
- `GET ?action=list` → 列出所有錄音、按成員 ID 分組
- `GET ?id=fileId` → 讀取單一音檔回傳 base64

### Drive 資料夾
- **布農族錄音資料夾 ID**：`1V_yWWyOUU4KIMOwThU1HByYTqlB7AE8d`
- 帳號：overpomelo@gmail.com（5TB）

### Firebase 設定
```js
const firebaseConfig = {
  apiKey: "AIzaSyB2Ek81mDL1SGBe-6S6PHEs4M8a-H6PqzA",
  authDomain: "istanda-mapasnava.firebaseapp.com",
  projectId: "istanda-mapasnava",
  storageBucket: "istanda-mapasnava.firebasestorage.app",
  messagingSenderId: "924639525790",
  appId: "1:924639525790:web:9e5b1e8e2674620c71748f",
  measurementId: "G-WSST40SJF3"
};
```

### Firestore 資料結構

**`members` 集合（已存在）：**
```
members/{自動ID}/
  name: string         // 族名，例如 "Cina Umav"
  nickname: string     // 暱稱/關係，例如 "媽媽"、"小Iman"
  role: string         // "elder" / "member"
  initials: string     // 縮寫，例如 "CU"
  recordCount: int64   // 錄音數量（雙寫：上傳 +1，個人頁顯示時以清單長度為真）
```

**`recordings` 集合（Task 1 建立）：**
```
recordings/{自動ID}/
  memberId: string     // 對應 members 的 docId
  fileId: string       // Google Drive file ID
  filename: string     // 例如 "2l95ZhadEN8Xv8hijWty_05191430.webm"
  mimeType: string     // "audio/webm" 或 "audio/mp4"
  createdAt: timestamp
  likes: number        // Task 3 用
  comments: array      // Task 3 用
```

---

## ⚠️ 已知問題 / 待決定

- **Firestore test mode 到期**：規則目前是 test mode，6/15 前要改正式規則
- **Apps Script 改 code 後容易忘記重新部署**：每次改完要去「管理部署作業 → 編輯 → 版本選新版本」，否則程式碼不會生效
- **`?action=list` 全撈無篩選**：現在 2 人 OK、6/15 後膨脹到幾百筆會浪費流量，標為 TODO、6/15 後優化（加 `?memberId=xxx` 參數過濾）
- **MediaRecorder 在 file:// 拿不到麥克風**：A 階段自測直接 push 到 main 線上測，反正沒家人在用

---

## 📝 決策記錄

### 2026-05-19：錄音儲存改用 Google Drive 路線 A
- **背景**：Firebase Storage 要付費；原本考慮 base64 存 Firestore
- **選擇**：Google Drive + Apps Script 代理（路線 A）
- **理由**：複用泰雅語 App 已驗證的架構、5TB 額度充裕、家人不用授權

### 2026-05-19：砍掉族語本、回補錄音
- **背景**：原計畫第 3-4 週做族語本、但錄音核心還沒開始、已落後 2 週
- **選擇**：砍掉 6/15 前的族語本、把工時補給錄音 + 個人頁面
- **理由**：加速指南明確標註族語本「重要但不是 6/15 關鍵」

### 2026-05-19：錄音 UX 三決定
- 點擊切換（不用按住）：適合手抖長輩
- 試聽後上傳：避免廢檔、符合「年輕人跟著錄回傳」需要重試的需求
- 不加標題：減少長輩操作摩擦、標題用日期顯示

### 2026-05-19（晚）：北極星升級
- **背景**：原 north-star 寫成「給媽媽一個人錄音」，跟交接文件的「87 人家族 Instagram」對不上
- **選擇**：北極星全面對齊 87 人家族願景、加入「6/22 持續使用為成功標準」
- **連鎖**：按讚 / 留言 / LINE / PWA / Feed 即時更新 從「6/15 後」全部升級為「6/15 必做」
- **理由**：6/15 那天熱鬧但一週後沒人開 = 失敗；社群引擎決定持續使用

### 2026-05-19（晚）：Recon 拍板六題
- **Q1 → A**：改 Apps Script 回傳 fileId（一次小成本換後續所有功能乾淨）
- **Q2 → 做**：iOS Safari mimeType 動態偵測（不做的話 iPhone 家人全部錄不了）
- **Q3 → 順便驗**：Step 1 部署完無痕視窗驗 list 兩種格式都列得到
- **Q4 → 做**：友善 toast 提示麥克風權限（北極星瞬間不能被 OS 跳窗破壞）
- **Q5 → 雙寫**：recordCount 雙寫；首頁讀 count、個人頁讀清單長度為真
- **Q6 → 60 秒自動停**：避免廢檔過大、家人講太久忘了

---

## 🛠 對話 / 工具分工

| 對話 / 工具 | 負責 |
|---|---|
| **claude.ai（本對話框）** | 主規劃、寫規格、決策、debug |
| **Claude Code** | 實際改 code、跑 git 指令、跑測試 |
| **GitHub Pages** | 線上部署（git push 自動觸發） |
| **Apps Script 後台** | 錄音後端、改 code 後手動重新部署 |
| **Firebase Console** | 看 Firestore 資料、改規則 |

---

*每完成一個任務、回來更新「已完成」「進行中」「接下來」、把對應的決策補進「決策記錄」。*
