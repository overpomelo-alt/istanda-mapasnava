# 6-2 刪除鏈 (delete chain)

## 目標
一筆刪除 = Firestore doc + Drive 檔 + 畫面,三路一起清。貼文 + 錄音。
只有作者能刪(過渡:memberId 軟權限,6-3 升級成真身分)。

## 拍板決策(定案)
1. 權限 = memberId 軟權限:刪鈕只在 doc.memberId === getMyId() 時顯示。
2. 刪法 = setTrashed(true):進 owner Drive 垃圾桶、可救回 30 天、不需新 scope。
3. 範圍/順序 = 分段,deleteFile 原語為硬檢查點:Stage 1 deleteFile → Stage 2 貼文 → Stage 3 錄音。

## 已知限制(接受;信任制 / 留給 6-3)
- 無真 auth:後端對誰都照刪,「只有作者能刪」純前端把關。
- memberId 是自我宣稱:選「我是 X」就能刪 X 的內容。87 人家族可接受。
- 沒選過「我是誰」(getMyId 空)→ 看不到刪鈕;想刪先選身分。
- 在別人頁面發的東西(memberId=對方)→ 自己身分看不到刪鈕。6-3 處理真建立者。
- Drive 刪失敗 → 留孤兒檔 + toast,不擋使用,事後手清。

## recon 事實(動工依據)
- posts:{ memberId, photos:[{fileId,filename}], audioFileId(null), text, createdAt, likes[], comments[] }。多張=多個 fileId。
- recordings:獨立 collection,{ memberId, fileId, filename, mimeType, createdAt, likes[], comments[] }。單一 fileId。
- 身分 key:istanda_device_id(getDeviceId,一定有)、istanda_me_id(getMyId,選過才有)。※ 是 _me_id 不是 _my_id。
- onSnapshot removed:首頁 feed(script.js:421)✅、個人頁貼文(member.html:3261)✅ 已 card.remove();錄音清單(member.html:1988)❌ 空、要補。
- 統計(規則13):上傳時 members.postCount / recordCount 各 increment(1) → 刪除要對應 -1。
- 入口:貼文卡片 post__header 右側(現空)加 ⋯;錄音 recording-row 動作列加 ⋯。皆無現成。
- Apps Script receiver:現有 doGet(list/讀檔/診斷)、doPost(上傳),無 delete。

## 固定刪除順序(所有刪除共用)
1. 確認框(防呆,規則4)。
2. deleteDoc(Firestore)→ removed 分支讓畫面秒消。
3. 對應 count -1(postCount / recordCount)。
4. 背景呼叫 deleteFile(每個 fileId);失敗 → toast +留孤兒檔,不擋。
(先刪 doc 體感快,Drive 背景善後。)

## Stage 1 — Apps Script deleteFile(硬檢查點)
- receiver 加 action==='delete':收 fileId → DriveApp.getFileById(fileId).setTrashed(true) → 回 {ok, fileId} / 錯誤。
- 防呆:fileId 空/找不到 → 回錯誤,不爆。
- 手動重部署(管理部署 → 新版本);不在 git 鏈。
- DoD(單獨驗):
  - 已知測試 fileId 呼叫 → 該檔進 Drive 垃圾桶。
  - 只動到那一顆,母資料夾其他檔沒被碰。
  - 亂 fileId → 回錯誤、不影響其他。
- ★ 確認「只刪對的那顆」才往 Stage 2。

## Stage 2 — 貼文刪除
- 權限:兩支 createCard(script.js / member.html)在 doc.memberId===getMyId() 時於 post__header 右側顯示 ⋯。
- ⋯ → 「刪除這篇」→ 確認框 → 固定順序:deleteDoc(posts/id) → postCount -1 → 走訪 photos 每個 fileId 呼叫 deleteFile。
- removed 分支現成 → 卡片自動消失。
- DoD:自己貼文有 ⋯、別人沒有;刪完首頁+個人頁兩邊即時消;Drive 照片(多張全)進垃圾桶;postCount -1;沒選身分的裝置看不到 ⋯。

## Stage 3 — 錄音刪除
- 同模式套 recordings;⋯ 加在 recording-row 動作列。
- 補寫 setupRecordingsListener(member.html:1988)removed 分支:從 allRecordings 移除該 fileId → renderRecordings 重排 → 更新 heroCount / localRecordCount。
- 執行:deleteDoc(recordings/id) → recordCount -1 → deleteFile(fileId)。
- DoD:自己錄音有 ⋯、別人沒有;刪完即時消失、清單重排正確、count 同步;Drive 檔進垃圾桶。

## 版本/驗收
- 改前端(Stage 2/3)→ 6 個 ?v= +1 + sw CACHE_VERSION +1,一起。
- Stage 1 只動 Apps Script → 不碰 ?v=,但要手動重部署。
- 驗(規則12):Stage 1 單獨驗(呼叫 + 看 Drive 垃圾桶);Stage 2/3 本機→無痕→push→curl 確認→手機實機(自己/別人視角各驗權限)。