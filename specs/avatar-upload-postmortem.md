# 頭貼上傳 Postmortem（6-4 Block 4a）

## 症狀
- 頭貼上傳在真機一直「上傳失敗」，但 jsdom 全綠。
- 換照片解碼方式後變成「同一張時好時壞、重傳又失敗」的間歇性失敗。

## 根本原因（兩層，依排查順序）

### 第一層：解碼
- `compressAvatar` 一開始只用 `createImageBitmap`，遇到某些圖丟 `The source image could not be decoded`。
- 關鍵：這台裝置把 `blob:` objectURL 餵給 `<img>` 解碼會失敗，只有 `FileReader` → `data:` URL 那條能解。
- 修：改用 member.html 發照片那套「四層解碼鏈」，任一層成功即可：
  1. `img.decode()`（objectURL）
  2. `createImageBitmap`
  3. DOM `<img>` + objectURL
  4. `FileReader.readAsDataURL` → `data:` URL → `<img>`（相容性最高，本機唯一能解的路）

### 第二層（真正的最終 boss）：Android Photo Picker NotReadableError
- 相簿選圖的 `content://media/picker/…` URI 對「完整讀取 bytes」會**間歇**丟 `NotReadableError`（Chromium Won't Fix）。
- 症狀特徵：**同圖時好時壞、重傳又失敗 = 間歇性**。
- 為什麼會中：守門 `file.arrayBuffer()` 讀過一次就丟掉，`compressAvatar` 又拿**原始 picker File** 重讀（objectURL / FileReader），每次重讀都可能獨立間歇失敗。
- 根治：**讀一次 bytes → 建 in-memory Blob 副本 → 之後解碼/壓縮全吃副本，不再碰 `content://`**。

## 不是什麼（排除過、別再往這查）
- 不是 CSP（整個專案沒有 CSP meta，blob: 沒被任何政策擋）。
- 不是 filename 沒帶 memberId（`${myId}.jpg`，有帶）。
- 不是 Apps Script 沒實作無 folderId 保底路徑（有實作，會建 `member_<id8>` 夾）。
- 不是上傳時序 race / CLAIM_FAILED（早期猜測，已排除）。
- 不是 HEIC / 格式問題（連 PNG 截圖都爆 → 全面性，非單一格式）。

## 最終做法（現行，務必保留）
- `handleAvatarFile` 守門：`const buf = await file.arrayBuffer()` → `const stableBlob = new Blob([buf], { type: file.type || "image/jpeg" })`。
- `compressAvatar(stableBlob)`：四層解碼鏈 → 長邊 400 canvas（保比例）→ `toBlob` jpeg 0.85 → canvas 歸零 → cleanup（移除暫存 img + revokeObjectURL）。
- 上傳：`uploadBlobToDrive`（post-likes.js，D-approach，無 folderId 保底 → `member_<id8>` 夾）。
- 守門本身若還讀失敗（殘留 preflight 間歇）：維持友善訊息「這張讀不到，換一張或用相機拍」、不續傳。

## 未來別再踩（規則）
1. 任何「從 Android Photo Picker 拿到的 File」**不可重複讀原始 File** —— 讀一次 bytes 轉 in-memory Blob，之後一律用副本。
2. 圖片解碼一律走四層鏈，不可只用 `createImageBitmap` 一條。
3. 這類 bug jsdom 驗不到（上傳/解碼被 mock）—— 改動頭貼/照片上傳後**一定真機壓測：同圖連續重傳多次**才測得出間歇。
4. 發照片（member.html `buildPhotoEntry`）有**同樣的潛在「重讀 picker File」問題**，只是四層鏈遮住。Backlog：把「留 bytes」修法套回發照片，讓發照片也更穩。

## 版本軌跡
- v18 4a 上線（createImageBitmap）
- v19 診斷碼（catch toast 顯示真錯誤）
- v20 四層鏈解碼（移除 createImageBitmap）
- v21 補 FileReader → dataURL 層
- v22 改吃 in-memory Blob 副本（根治間歇 NotReadableError）

## 相關
- 參見 `android-photo-picker-postmortem.md`（同一個 NotReadableError 根源）。
- 待辦：v22 仍保留診斷碼 + 暫時錯誤 toast，4a 收尾尚差一版「移除診斷碼 + 還原友善文案」。
