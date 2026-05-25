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

---

## 🔄 進行中

- [ ] **Task 4：LINE 一鍵分享**（單則錄音、Web Share API、依時程表第三週 6/2-6/8 動工、Task 3 完成後直接接;或視 5/26-6/1 進度可能提早)

---

## ⏳ 6/15 前必做（依執行順序、2026-05-24 重排）

> **重排原因**：Task 3 Recon 發現 Task 1 Step 3-4 沒做、recordings 集合空無資料、Task 3 必須 block 在 Task 1 之後。詳見「📝 決策記錄」2026-05-24（晚）那筆。

**本週 5/19-5/24（已過 / 部分完成）**
- ✅ Task 2：首頁卡片可點擊跳轉到 member.html（2026-05-24 確認、實作在 v0 `c431e54`、smoke test PASS）
- 🔄 Task 1 Step 1 ✅ Apps Script 部署 + Step 2 ✅ Hero 渲染、Step 3-5 待動工

**本週剩 5/24-5/25**
- Task 1 Step 3 Recon + 切細步（不動 code、Recon only）

**下週 5/26-6/1**
1. Task 1 Step 3-5 跑完（錄音核心 + 過去清單 + DoD）
2. Task 3 開頭（按讚 / 留言 Recon + 部分實作）

**第三週 6/2-6/8**
3. Task 3 收尾（按讚 + 留言 bottom sheet 完整）
4. Task 4：LINE 一鍵分享（單則錄音、Web Share API）

**第四週 6/9-6/15**
5. Task 5：首頁 Feed source 切到 recordings collection（順帶解 v0 `posts` placeholder）
- 緩衝：拍家人頭像、給 1-2 個家人試用、收回饋、修最後 bug
- **6/15 上線** 🎉

**🟡 6/15 後候選（原本 6/15 必做、現順延）**
- Task 6：PWA 化（manifest.json + sw.js + 圖示）— 6/15 上線後評估必要再做

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
