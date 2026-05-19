# Istanda Mapasnava — 目前進度

> 最後更新：2026-05-19
> 每完成一個段落就更新這份檔案，讓下一個 Claude / Claude Code 一打開就知道現況。

---

## 🎯 專案北極星

讓 6/15 那天，媽媽笑著錄下一段給孫子的話。  
詳見 `specs/north-star.md`。

---

## 📅 時間線

- **死線**：2026-06-15（給家人實際使用）
- **今天**：2026-05-19（剩 27 天）
- **理論進度**：第 4 週「族語本」→ **實際進度落後 2 週**
- **補救決策**：砍掉族語本，補回錄音核心 + 個人頁面（詳見「決策記錄」）

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

---

## 🔄 進行中

- [ ] **個人頁面 member.html**（下一個任務，規格見 `specs/task-recording-core.md`）

---

## ⏳ 接下來（依優先序）

1. 個人頁面 member.html（錄音核心）
2. 首頁成員卡片可點擊進入個人頁面
3. 首頁動態 Feed 改成從 Firestore 即時讀取
4. 老人友善 UI 優化（字級、按鈕大小、振動回饋）
5. PWA 化（manifest.json + sw.js）
6. 6/15 家族試用 → 修 bug

## 🗓 6/15 後再做（已從衝刺路線砍掉）

- 族語本（30 句基礎詞彙）
- 按讚 / 留言互動
- 管理員頁面（新增成員）
- LINE 一鍵分享

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
- `POST` body `{audio: base64, filename: "xxx.webm"}` → 上傳
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
  recordCount: int64   // 錄音數量（隨上傳自動 +1）
```

**`recordings` 集合（規劃中、member.html 任務會建立）：**
```
recordings/{自動ID}/
  memberId: string     // 對應 members 的 docId
  fileId: string       // Google Drive file ID
  filename: string     // 例如 "2l95ZhadEN8Xv8hijWty_05191430.webm"
  createdAt: timestamp
  likes: number        // 預留欄位
  comments: array      // 預留欄位
```

---

## ⚠️ 已知問題 / 待決定

- **Firestore test mode 到期**：規則目前是 test mode，6/15 前要改正式規則
- **Apps Script 改 code 後容易忘記重新部署**：每次改完要去「管理部署作業 → 編輯 → 版本選新版本」，否則程式碼不會生效
- **音檔格式 webm 在某些瀏覽器可能不支援**：iOS Safari 預設可能要 audio/mp4，到家人試用時要確認

---

## 📝 決策記錄

### 2026-05-19：錄音儲存改用 Google Drive 路線 A
- **背景**：Firebase Storage 要付費；原本考慮 base64 存 Firestore
- **選擇**：Google Drive + Apps Script 代理（路線 A）
- **理由**：教師複用泰雅語 App 已驗證的架構、5TB 額度充裕、家人不用授權

### 2026-05-19：砍掉族語本，回補錄音
- **背景**：原計畫第 3-4 週做族語本，但錄音核心還沒開始，已落後 2 週
- **選擇**：砍掉 6/15 前的族語本，把工時補給錄音 + 個人頁面
- **理由**：加速指南明確標註族語本「重要但不是 6/15 關鍵」；6/15 wow 時刻靠的是錄音

### 2026-05-19：錄音 UX 三決定
- 點擊切換（不用按住）：適合手抖長輩
- 試聽後上傳：避免廢檔，符合「年輕人跟著錄回傳」需要重試的需求
- 不加標題：減少長輩操作摩擦，標題用日期顯示

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
