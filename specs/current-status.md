# Istanda Mapasnava — 目前進度

> 最後更新：2026-05-29（Task 5 Step 2a 完成、A/B 探針對照釘死 NotReadableError root cause）
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
- **今天**：2026-05-28（剩 18 天）
- **理論進度**：第 4 週「族語本」→ **實際:Task 1-4 全部完成、互動引擎超前、領先時程約 2 週**
- **補救決策**：砍掉族語本，補回錄音核心 + 互動引擎（詳見「決策記錄」）→ 已生效、剩 Task 5 Feed 一項 6/15 必做

---

## ✅ 已完成

### Task 6 PWA：已實作 + push（commit 601e740）— 🟡 待驗收（尚未標完成）
- **已完成**：`manifest.json`、`sw.js`（cache 前綴 `istanda-cache-istanda-v8`、Apps Script / Firestore network-only skip）、6 圖示（由 `icons/source.png` 1024² 縮出：192/512/maskable-512/apple-touch-180/favicon-32 + 根 favicon.ico）、`index.html` / `member.html` 兩頁 head 標籤 + SW 註冊與 controllerchange 自動更新、`install.html`（iOS/Android 安裝引導）、首頁「📲 安裝到桌面」入口
- **待驗收（四項驗過才改標「完成」）**：
  1. 桌機 DevTools：SW activated / manifest valid / cache 出現
  2. iOS standalone 真機錄音：錄 → 上傳 → 播放
  3. Android 安裝
  4. `install.html` 截圖 `guide/ios-1.jpg`、`guide/android-1.jpg` 待補

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

### v2 視覺翻盤（2026-05-24 完成）
- [x] HEAD `85f7303`、5 個 commits 全部跑完（`8f4612b` → `85f7303`）
- [x] 4 個畫面線上實機驗證通過：首頁 / 個人頁（Cina Umav）/ 錯誤畫面 / 我是誰 modal
- [x] 兩個翻盤決定：header/nav 補拍板純白霧（spec 未明確）+ Hero 從沉黑織片翻成純白（spec 拍板沉黑、落地後翻盤）
- [x] 落地補丁完整歸檔在 `specs/visual-direction-v2.md` 末尾「## 落地補丁」章節

### Task 2：首頁卡片可點擊跳轉到 member.html（2026-05-24 確認、實作在 c431e54、smoke test PASS）
- [x] 實作其實已在 v0 commit `c431e54` 完成（`script.js:163-166` `renderStories` 內 click listener）
- [x] 第一顆「我的記事」走 `handleRecordPressed()`（`script.js:205-214`）：沒選過「我」開 modal、選過了直跳
- [x] 線上 smoke test 三顆全部 PASS：CU / TI 跳對成員 `member.html?id=...`、「我的記事」開「我是誰」modal
- [x] Task 2 不需要寫新 code、Recon 直接歸檔

### Task 1 Step 3 錄音核心完成（2026-05-25、5 個 commits / 5 個子步）
- [x] 子步 3a `03d7e27` 錄音狀態機 + 60 秒自動停 + 權限 UX(toast 提示 + 失敗友善 fallback)
- [x] 子步 3b `f533d8e` 試聽 / 重錄 / 上傳按鈕骨架(三鈕橫排、上傳鈕暫 disabled)
- [x] 子步 3c `fd30203` 上傳 Apps Script + Firestore 雙寫初版(撞 Apps Script POST 跨域 redirect 坑、Firestore 空白、Drive 累積試錯檔)
- [x] 子步 3c.2 `ccb8a2b` 修補:POST blind + GET `?action=list` 撈 fileId 回填(走 D 方案、繞跨域 redirect)
- [x] 子步 3c.3 `2eb7aed` 上傳進度橫條 UX(四段視覺回饋:編碼 15% → 上傳 55% → 確認 85% → 寫入 95% → 100% 淡出、失敗變紅)
- [x] 線上實機驗證:錄→試聽→重錄→上傳→Drive + Firestore + recordCount 雙寫 + Hero N 本地 +1 + 進度橫條動畫
- [x] 下一步:Step 4 過去錄音清單 + Hero N 改用清單長度

### Task 1 Step 4 過去錄音清單完成（2026-05-25、2 個 commits / 2 個子步）
- [x] 子步 4a `1cf8551` 清單 fetch + render + Hero N 改用清單長度（Q5 拍板「個人頁顯示用清單長度為真」)、上傳成功後自動 reload 清單(新錄音立刻出現)
- [x] 子步 4b `1bc688d` 點播放 / 暫停 / 切換(獨立 `recordingsAudio` 跟試聽 `playbackAudio` 分開、載入「⌛」disabled + 5 秒慢網 toast、互斥邏輯同時只播一個)
- [x] F1 實測:`?id=fileId` 回**純 base64 string**(無 JSON 包裝、無 dataURL prefix)、用 `resp.text()` 拿、組 dataURL 用 `pickMimeFromFilename` 從 filename 後綴判斷 mime
- [x] 線上實機驗證:F5 看到清單、上傳新錄音立刻出現、點 ▶ → ⌛ → ⏸ 跑通、切換不同筆互斥、播完自動回 ▶
- [x] 已知限制:**L1** 暫停同筆再播從頭來(不接續位置、6/15 前可接受)、**L2** 試聽+清單可同時發聲(M1 獨立 audio 的代價、罕見、不修)
- [x] 下一步:Step 5 DoD 12 項自測

### Task 3：按讚 + 留言 + 即時同步（2026-05-25 完成）
- [x] 子步 3a `561a42f` 按讚 ❤️ + deviceId(localStorage 防按讚重複)+ onSnapshot 即時(`query where memberId == X`)+ 雙行 row UI(M_R3 IG/FB 風格)
- [x] 子步 3b `1c95527` Bottom Sheet UI 殼(下滑、70% 高、上 標題+✕ / 中 列表 / 下 輸入+送出)、無寫入
- [x] 子步 3c `0e44e9c` 留言寫入 + 「我是誰」modal 整合(M_R1 member.html 自己寫簡化版)+ 樂觀更新 + onSnapshot 接 comments
- [x] 「不是我?」入口 `86ec340` 留言時可隨時切換身份(pill「Cina Umav 留言中」+ 「不是我?」switch、整塊 tap 重開 modal)
- [x] modal z-index 修 `8a69258` Sheet 開著時 identity-modal z-index 1300 蓋過 Sheet 1200
- [x] M_R4 demo fallback hotfix `ad3a5f4` `script.js:163-166` 加 `!m.id` 防呆
- [x] 跨瀏覽器驗證 PASS:Chrome 無痕 + Edge 即時同步、留言 author 帶名字、Firestore `comments` array 正確、F5 持久

### Task 4：LINE 一鍵分享（2026-05-26 完成、ship）
- [x] Step 0 第二層 Recon 找到 4 處 spec 假設落差、共 10 條納入 spec 後才動工（詳見「決策記錄」2026-05-26）
- [x] Step 1 `06ac104` 加 ↗️ 鈕(對齊 `.recording-row__action` 灰調)+ `MESSAGES` i18n-ready 結構 + `memberData` module 變數
- [x] Step 2 `9d9d288` Web Share API(`navigator.share`)+ Popover fallback(新 `.share-sheet__*` namespace、開 LINE / 複製 / 取消)+ iOS 雙保險(text 欄位含 URL、防 iOS 13 忽略 url)
- [x] Step 3 `5535cca` Deep link `#rec={fileId}` → `scrollIntoView` + 金邊高亮 2 秒 + F5 不重跳(立刻清 hash)
- [x] spec 2 commits:`5b9e563` 初版 / `65a86b5` 對齊 Step 0 偵察
- [x] DoD 16/16 驗收 PASS:桌機 Share Sheet / popover、手機 LINE 實機分享(URL 含 `#rec={fileId}`)、deep link scroll + 高亮、F5 不重跳、不存在/空 fileId 邊界、空 nickname 防呆、console 無 error
- [x] 範圍紀律:git 證實三個 Step commit 只動 `member.html`、index.html / style.css / Apps Script 零改動
- [x] **北極星第三題達成**:2026-05-26 14:17 訊息進家族 LINE 群組
- [x] **✅ 已完成歸檔**(2026-05-27 commit `a7e89ad`「Archive Task 4: 16/16 DoD passed, LINE share live」)

### Task 5 Step 1：每人子資料夾上傳 + folderId 雙模式回填（2026-05-28 完成）
- [x] Step 1 commit `6a28aa7`「每人子資料夾上傳 + folderId 雙模式回填」
- [x] Apps Script 部署新版本:doGet 雙模式 list(主路徑 `?action=list&folderId=` 只掃指定子夾 / 保底 `?action=list` 遞迴 ROOT 下一層 + 舊資料夾、每筆帶 parentFolderId)、doPost 含 getMemberFolder(folderId 有就用、無則 ROOT 下查/建子資料夾)
- [x] 子資料夾建立完成:`Cina Umav_2l95Zhad`、`Tama Iman_pFPQxryR`
- [x] 5 項實機自測全 PASS:舊錄音 `?id=` 兼容無迴歸、首次建夾、第二次走快速主路徑、換人建新夾、無痕保底 list
- [x] 雙寫 `members.driveFolderId` 正常(首次上傳回填、本地同步、下次走快速主路徑)
- [x] Task 1 舊錄音兼容無迴歸、recordings 新增正常
- [x] 範圍紀律:只動 `member.html` + 新增 `apps-script/` 記錄檔、index.html / script.js / posts / recordCount 邏輯零改動
- [x] 連帶必要修補(已 flag):`loadRecordings` 解析吃新保底 schema(舊扁平相容)、`pickMimeFromFilename` 認 `.m4a`(audio/mp4 副檔名改 .m4a 後仍可播)、保底 list 過渡期多掃舊 `UPLOAD_FOLDER_ID`(清完試錄自然空)

### Task 5 Step 2a：單張照片壓縮 + iOS/Android 照片讀取（2026-05-29 完成、最終版）
- [x] 自寫 `readExifOrientation`(讀 0x0112 marker)+ `compressPhoto`(canvas 1080px / 80% JPEG)+ 臨時測試區
- [x] **iPhone a1-a6 全 PASS**:直立/橫向照片壓縮後不橫躺(方向 α:信任瀏覽器依 EXIF 自動轉正、不手動旋轉、繞 iOS imageOrientation 雙重旋轉坑)
- [x] 主路徑 `compressFromImg`:從已顯示成功的原圖預覽 `<img>` 直接 drawImage、配 `loadRawImage` 四層 fallback(decode → createImageBitmap → DOM-attached objectURL → FileReader)當後備、邏輯實測完全正確
- [x] **Samsung S21 Ultra 照片在本機時全 PASS**:截圖、相機現拍、「我的檔案」入口、materialize 後的相簿照片皆成功
- [x] **A/B 探針對照釘死 root cause**(commit `586fe92` 探針 / `712d657` A vs B input)：
  - probe1 `file.slice(0,64KB).arrayBuffer` + probe2 `file.arrayBuffer` 比對 byteLength vs file.size
  - 失敗時 probe2 秒 reject `NotReadableError`(18ms、非 stream 中斷)→ Chrome 從第 0 毫秒就拿不到 bytes、任何 JS 讀取技巧都救不了
  - 先前九輪的 `compressFromImg「繞過 file→bytes」其實沒繞過(origImg 一樣要讀 content URI bytes 才能顯示)、所以時好時壞
  - 近乎對照實驗:同一張 2827055 bytes 照片、走 Photo Picker proxy(數字檔名 `1000076786.jpg`)必敗、走真實檔(時間戳 `20260515_194608.jpg`)5/5 成功 → **成敗取決於照片當下是不是 proxy、不是 accept 屬性、不是照片本身、不是網路**
  - input B(拿掉 accept)實測無法穩定繞過 Photo Picker → accept 不是變數;Android 13+ Photo Picker 給 proxy URI 是硬限制
- [x] 上一輪「Google 相簿釋放空間」假設**已否決**(聖瑱師從沒按過釋放空間);真因是 Android Photo Picker proxy URI lifecycle
- [x] 範圍紀律:只動 `member.html` 臨時測試區、Step 2b 會連測試 UI(含探針 + input B)一起拆
- [x] **判決:Step 2a 過關**、進 Step 2b(設計方向見 task-feed.md Step 2b + 下方決策記錄 2026-05-29)

---

## 🔄 進行中

- [ ] **Task 5 Step 2b:發貼文 modal + 多張壓縮 + 上傳**(Step 2a 已過關)。根據 Step 2a 實測定案的設計方向(詳見 task-feed.md Step 2b)：
  1. input 保留 `accept="image/*"`(家人最熟悉、UI 友善;Step 2a 證實 accept 不是失敗變數)
  2. 主路徑 `compressFromImg`(已驗證)
  3. **NotReadableError 偵測 → 友善退路文案**:「這張照片需要從雲端載入。請按 📷 重新拍一張、或在 Google 相簿打開後再回來選」
  4. 發貼文 modal **主推「📷 直接拍照」入口**(現拍 = 本機 = 必成功、繞開 proxy 風險)
  5. **HEIF 偵測 → 同樣友善退路**(format 不支援、請改拍)

---

## ⏳ 6/15 前必做（依執行順序、2026-05-24 重排）

> **重排原因**：Task 3 Recon 發現 Task 1 Step 3-4 沒做、recordings 集合空無資料、Task 3 必須 block 在 Task 1 之後。詳見「📝 決策記錄」2026-05-24（晚）那筆。

**5/19-5/26（已完成、進度超前約 2 週）**
- ✅ Task 2 首頁卡片跳轉 member.html（`c431e54`、smoke test PASS）
- ✅ Task 1 錄音核心 Step 1-5（Apps Script + Hero + 錄音狀態機 + 上傳雙寫 + 過去清單 + 播放）
- ✅ Task 3 按讚 + 留言 + onSnapshot 即時同步（6 commits）
- ✅ Task 4 LINE 一鍵分享（3 Step、2026-05-26 ship）

**下週 5/27-6/8（Task 5 提前動工）**
1. **Task 5：首頁 Feed source 切到 recordings collection**（順帶解 v0 `posts` placeholder）— 原排 6/9-6/15、Task 1-4 超前、提前到 6/2-6/8 動（5/27 起可先 Recon）

**緩衝 6/9-6/15（多出來的時間、收尾 + 6/15 前必做）**
- 🔴 **Firestore test mode 改正式規則**（6/15 前硬性必做、見「已知問題」、限家人讀寫）
- 拍家人頭像、給 1-2 個家人試用、收回饋、修最後 bug
- 視時間餘裕補 Task 6 PWA（原 6/15 後候選、超前的話可提前）
- **6/15 上線** 🎉

**🟡 6/15 後候選（原本 6/15 必做、現順延）**
- Task 6：PWA 化（manifest.json + sw.js + 圖示）— 6/15 上線後評估必要再做
- Task 6.x:**Drive 回憶錄式分類管理**:依時間建鏡像資料夾、不動 memberId 命名核心(聖瑱師 2026-05-28 提案、需求合理、Step 2a 後再評估)

**第二死線 6/16-6/22**
- 觀察打開率（目標：6/22 ≥ 6/15）
- 7 天內錄第二段以上的人數
- Task 6 PWA 補上（若 6/15 上線後評估必要）

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
- ✅ **首頁 demo fallback `id: null` 潛在 bug**（2026-05-25 已修、Task 3 並行 hotfix）：`script.js:163-166` 加 `!m.id` 防呆、改 fallback 走 toast「家族資料還在連線、請重新整理頁面再試」、不再跳 `member.html?id=null`
- **Task 1 Step 4 L1 暫停同筆從頭播**：點 ⏸ 暫停後再點 ▶ 同一筆會重新 fetch + 從頭播(不接續上次位置)。簡單實作、6/15 前可接受、之後可改進(暫存 audio.src 或 currentTime)
- **Task 1 Step 4 L2 試聽 + 清單可同時發聲**:M1 拍板獨立 `playbackAudio` + `recordingsAudio`、罕見情境(剛錄完試聽中又滑去點過去錄音)會兩聲共存。獨立的代價、不修
- 🟡 **Android Photo Picker proxy URI 偶發 NotReadableError**(Step 2a 釘死、2026-05-29):Android 13+ + Google 相簿同步下、Photo Picker(相簿入口)偶爾回 `content://media/picker` proxy URI、`file.size` 有值但 bytes 拉不到、`file.arrayBuffer()` 秒 reject NotReadableError。**這是 Android 平台硬限制、非 code bug**。Step 2b 對策:友善退路文案(改拍 / 相簿打開後再選)+ 主推「📷 直接拍照」入口。照片在本機(截圖 / 現拍 / 我的檔案 / materialize 後)時全部正常

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

### 2026-05-24：v2 視覺翻盤完成、設計思想「日常感優先於儀式感」
- **HEAD**：`85f7303`、5 個 commits 全部跑完（`8f4612b` → `85f7303`）
- **線上驗證**：首頁 / 個人頁 / 錯誤畫面 / 我是誰 modal 全部 PASS
- **翻盤 1**：header / nav spec 未明確指定 → 補拍板純白霧 `rgba(255,255,255,0.85)` + `0.5px var(--border)` 米邊（理由：對齊「家族日常使用」、小孩接受度高、LINE 分享不打架系統 UI）
- **翻盤 2**：Hero 從 spec 拍板的沉黑織片（`2dc9915`）翻成純白（`aa56e1d`）、`.member-hero__ring-inner` 改灰漸層避免融邊。理由是個人頁面進入頻率高、深色塊每次都把情緒壓住、不符 `north-star.md` 的「家族 Instagram 不是博物館」氣質
- **設計思想**：日常感優先於儀式感。布農族沉黑大面積色票留給之後的文化元素章節（6/15 後）、不在 v2 結構性大面積使用
- **歸檔**：完整落地補丁寫進 `specs/visual-direction-v2.md` 末尾「## 落地補丁」章節（不刪原文、保留決策軌跡）
- **下一步**：Task 2 首頁卡片可點擊跳轉到 `member.html`（6/15 死線必做清單第 2 項）

### 2026-05-24（晚）：Task 1 真實進度修正、6/15 衝刺路線重排
- **背景**：Task 3 動工前 Recon、讀 `member.html` 才發現 Task 1 只跑到 Step 2 骨架、Step 3-4 沒做、Firestore `recordings` collection 沒任何資料
- **發現**：Task 3 按讚 / 留言對象（個人頁錄音清單）整個東西不存在、Task 3 必須 block 在 Task 1 之後
- **Step 1 補狀態**：Apps Script doPost 已改、聖瑱師親手部署過、無痕視窗 `?action=list` 驗證 PASS（線上 Apps Script 已是新版、回傳 `{ok, fileId, filename}`）
- **選擇**：走選項 A、先補完 Task 1 Step 3+4+5、再進 Task 3
- **時程影響**：Task 3 順延一週、Task 4 也順延一週、Task 6 PWA 從「6/15 必做」改成「6/15 後候選」（6/15 上線後評估必要再做）
- **下一步**：Task 1 Step 3 Recon（本週日晚 ~ 週一）、切 3-4 子步、下週 5/26-6/1 動工

### 2026-05-25：Apps Script POST 跨域 redirect 坑、走 D 方案 + UX 進度條
- **背景**：Task 1 子步 3c 上傳實作完、Drive 寫入成功但 Firestore 永遠空、`addDoc` throw `Unsupported field value: undefined (found in field fileId)`
- **診斷**：Apps Script web app POST 自動 302 redirect 到 `googleusercontent.com` 子域、瀏覽器 fetch follow redirect 後 response body 被跨域擋、`await resp.json()` 拿到空物件、`data.fileId = undefined`、後續 `addDoc` 收 undefined 就 throw
- **方案 A / B / C 評估皆否**：A(Content-Type text/plain)= 等於現狀(fetch string body 預設就是 text/plain);B(XMLHttpRequest)= 跟 fetch 同 CORS 規則;C(redirect: "manual")= 跨域 opaqueredirect 連 Location header 都讀不到
- **選 D**：POST blind 不解析 response + GET `?action=list` 撈剛上傳的 fileId 回填 Firestore。聖瑱師另一個泰雅語 App 已實測同邏輯成功、信心增強
- **edge case 防線**:同時間戳 tiebreak 用 fileId desc(A)、撈不到 memberId 走 throw → catch 重試(B)、latest 缺欄位再 throw(B')、同人兩裝置 race 列已知限制(R1、6/15 後再處理)
- **子步 3c.2** `ccb8a2b` 修補:31 insertions / 5 deletions、Firestore 雙寫終於成功
- **子步 3c.3** `2eb7aed` 加 UX 進度橫條:聖瑱師選四方案中的 2 號(IG / Twitter 熟悉感、對齊 v2 視覺定位)、四段式視覺回饋(編碼 15% → 上傳 55% → 確認 85% → 寫入 95% → 100% 淡出、失敗變紅)
- **下一步**:Step 4(過去錄音清單 + Hero N 改用清單長度)

### 2026-05-25(晚):Task 1 Step 4 過去錄音清單 + 播放完成
- **子步 4a** `1cf8551` 清單 fetch + render + Hero N 改用清單長度(Q5 拍板「個人頁顯示用清單長度為真」)、上傳成功 hook reload 清單(新錄音立刻出現)
- **子步 4b** `1bc688d` 點播放 / 暫停 / 切換(獨立 `recordingsAudio` 跟試聽 `playbackAudio` 分開避免 cross-state)、載入「⌛」disabled + 5 秒慢網 toast(M2 加分長輩友善)、互斥邏輯同時只播一個、播完自動回 ▶
- **F1 實測結果**:`?id=fileId` 回**純 base64 string**(無 JSON 包裝、無 dataURL prefix)、用 `resp.text()` 拿、組 dataURL `data:${mime};base64,${base64}`、mime 從 filename 後綴判斷(`.webm` / `.mp4`、fallback `audio/webm`)
- **拍板對應**:M1 獨立兩個 audio element(試聽 / 清單獨立)、M2 ⌛ disabled + 5 秒 toast、M3 filename 後綴判斷 mime
- **下一步**:Step 5 DoD 12 項自測(線上、聖瑱師親跑)、PASS 後 Task 1 整段完成、進 Task 3 Recon

### 2026-05-25(晚):Task 3 完成、身份識別不走 LINE 登入
- **背景**:留言需要識別「誰留的」、考慮過 LINE 登入
- **拍板**:走「選一次 + ME 重選 + 留言時可改」雙路徑、不走 LINE 登入
- **理由**:LINE 登入完成後仍需家族內身份對應(LINE 名 ≠ 布農族名)、長輩看到登入頁會放棄(`north-star.md` 寫過「登入頁 → 媽媽會在這裡放棄」)、ROI 不對
- **防誤點機制**:留言 Sheet pill「Cina Umav 留言中 · 不是我?」隨時可改、commit `86ec340`
- **技術細節**:`recordings.likes` = array of deviceId(localStorage 永久 UUID)、`recordings.comments` = array of `{deviceId, memberId, authorName, text, createdAt: Date}`(arrayUnion 不支援 serverTimestamp、用 client Date 6/15 接受)
- **onSnapshot 範圍**:M_R2 拍板 `query(collection, where("memberId", "==", X))` + onSnapshot、不 listen 整 collection、流量友善
- **6 commits**:`561a42f` / `1c95527` / `0e44e9c` / `86ec340` / `8a69258` + 並行 hotfix `ad3a5f4`
- **下一步**:Task 4(LINE 分享單則錄音、Web Share API)

### 2026-05-26:Task 4 LINE 一鍵分享完成、Step 0 第二層 Recon 救回 4 處 spec 落差
- **背景**:Task 4 第一層 Recon 在 claude.ai 規劃框拍板(5+2 題)、但 spec 的程式假設沒對過實際 code、Claude Code 動工前先跑 Step 0 第二層 Recon 爬 member.html
- **4 處 spec 假設落差**(照舊 spec 寫會生出對不上的 selector / 變數):
  1. row attribute 是 `data-file-id`、不是 spec 假設的 `data-doc-id`
  2. 清單身份是 `fileId`(Drive ID)、不是 Firestore docId(docId 從不存在 row 上、按讚/留言時才即時 query)→ **deep link 改用 fileId 更乾淨、render 時就有**
  3. 快取變數叫 `allRecordings`、不是 `cachedRecordings`、item 結構沒 `.id` 欄位
  4. `cachedMember` 根本不存在(main() 把 snap.data() 餵 renderHero 後沒留)→ 新增 `memberData` module 變數
- **6 條建議簡化**:handleShare 不查 recording(訊息只需 member 資料)/ ↗️ 鈕對齊現有 `.recording-row__action` 灰調(不是 spec 原寫的 44×44 沉黑)/ Popover 新開 `.share-sheet__*` namespace(不複用 comment-sheet、語意+高度都不對)/ 高亮被 re-render 洗掉風險降級(partial DOM update、不重繪 row、不加保護邏輯)/ `loadRecordings` 改 await 鏈式呼叫 handleDeepLink / MESSAGES inline 在 member.html(不抽 i18n.js、YAGNI、M_R1 已立先例)
- **流程**:共 10 條(4 落差 + 6 簡化)納入 spec、spec 推 2 commit(`5b9e563` 初版 / `65a86b5` 對齊 Step 0)對齊現實、再進 Step 1-3、**順利無返工**(規則 10 三段式生效)
- **3 個 Step commits**:`06ac104` Step 1(↗️ 鈕 + MESSAGES + memberData)/ `9d9d288` Step 2(Web Share + popover + iOS 雙保險)/ `5535cca` Step 3(deep link scroll + 高亮 + F5 不重跳)、**全部只動 member.html**
- **一個已知偏離**:`.share-sheet__*` CSS 放 member.html inline(跟 comment-sheet 慣例一致)、非 spec 字面的 style.css、功能無影響
- **北極星第三題達成**:2026-05-26 14:17 訊息進家族 LINE 群組(「LINE 家族群組這週有沒有出現 App 連結?」= 有)
- **下一步**:Task 5 首頁 Feed source 切到 recordings collection(Task 1-4 全超前、可提前到 6/2-6/8 動)

### 2026-05-29:Task 5 Step 2a 完成、A/B 探針對照釘死 NotReadableError root cause
- **背景**:Samsung S21 Ultra(Android 15 / Chrome 148)照片發貼文偶發失敗、iPhone 全成功;上一輪假設「Google 相簿釋放空間把照片移雲端」、但聖瑱師從沒按過釋放空間、假設存疑、從零重新診斷
- **重新診斷**:從 change 第 0 毫秒插 bytes 層探針(probe1 `file.slice(0,64KB).arrayBuffer` / probe2 `file.arrayBuffer` 比對 byteLength vs file.size)、不解碼不建 objectURL、把「拿不到 bytes」vs「拿得到但解不了」一刀切開
- **關鍵證據**:失敗時 probe2 秒 reject `NotReadableError`(18ms)→ 不是 stream 中斷、是 Chrome 連發起讀取都被擋。**先前九輪的 `compressFromImg「繞過 file→bytes」其實沒繞過**(origImg 一樣要讀 content URI bytes 才能顯示)、所以時好時壞
- **近乎對照實驗**:同一張 2827055 bytes 照片、走 Photo Picker proxy(數字檔名 `1000076786.jpg`)必敗、走真實檔(時間戳 `20260515_194608.jpg`)5/5 成功 → 成敗取決於「照片當下是不是 proxy URI」
- **input A vs B 對照**(commit `712d657`):B 拿掉 accept 仍無法穩定繞過 Photo Picker、**證實 accept 屬性不是失敗變數**;root cause = Android 13+ Photo Picker 對雲端同步照片回 proxy URI、bytes lazy 拉取在讀取當下失敗(NotReadableError)
- **否決舊假設**:「釋放空間」假設錯誤;真因是 Android Photo Picker content URI lifecycle 硬限制、非 code bug、非聖瑱師操作
- **判決**:Step 2a 過關(compressFromImg + 四層 fallback + iPhone a1-a6 + Samsung 本機照片全 PASS);proxy URI 列為已知限制
- **Step 2b 設計方向(定案、寫入 task-feed.md)**:① input 保留 accept=image/* ② 主路徑 compressFromImg ③ NotReadableError 偵測 → 友善退路文案 ④ 發貼文 modal 主推「📷 直接拍照」入口(現拍=本機=必成功)⑤ HEIF 偵測 → 友善退路
- **commits**:`586fe92`(probe)/ `712d657`(A/B input)
- **下一步**:Step 2b 動工(發貼文 modal + 多張壓縮 + 上傳)

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
