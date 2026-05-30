# 2b-6 語音留言 + 貼文即時化(規格)

## 範圍
- 語音留言:貼文留言系統(post-likes.js 的 .pcs / posts 文件)。打字↔錄音 二選一並列,不取代打字。
- 貼文即時化:首頁 feed + 個人頁貼文 改 onSnapshot。
- 順手:修 .pcs 留言視窗 X 關不掉。
- 不碰:member.html 錄音留言(甲套)、Task1 主錄音內部。

## 決策(已拍板)
- 錄音架構 = ② 複製一份精簡獨立小錄音給留言用,完全不動 Task1(規則 11 copy+TODO)。
  TODO(上線後):與 Task1 一起抽成 createRecorder 工廠。

## 資料模型(混合陣列,向後相容,規則 8)
comment = { deviceId, memberId, authorName, createdAt:Date, type, ... }
- type:"text"  → text
- type:"audio" → audioFileId, audioFilename, durationSec
- 舊留言無 type → 當 text。鐵則:createdAt 用 client new Date(),不可 serverTimestamp。

## 複用(不寫新後端)
- 上傳:postBlobToAppsScript(blob, filename, …) → fileId;存貼文作者 driveFolderId。
- 播放:playRecording(fileId, filename, btn)。
- 身份:getMyId / openIdentityModalLocal。寫入:addPostComment(db, postId, comment)。

## onSnapshot(精準更新,別重抓照片)
首頁照片走 ?id= base64 很貴 → 不可整頁重畫。用 snapshot.docChanges():
modified→就地更新該卡讚數/愛心/留言數(不動照片);added→插新卡;removed→移除。
script.js 需新增 import onSnapshot。個人頁照 setupRecordingsListener 模式。

## 切細階梯
VC-0 修 X bug;VC-1 render 支援 type;VC-2 輸入區打字|錄音切換+獨立小錄音;
VC-3 送出語音留言;VC-4 首頁 onSnapshot;VC-5 個人頁 onSnapshot;VC-6 驗收。
