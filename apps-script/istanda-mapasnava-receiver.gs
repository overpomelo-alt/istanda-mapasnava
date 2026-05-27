/* ============================================================
   Istanda Mapasnava · Apps Script receiver
   Task 5 Step 1 改造版(2026-05-27)

   ⚠️ 這份是「記錄用」副本、Apps Script 不在 GitHub 部署鏈內。
   聖瑱師請把這份整段貼到 Apps Script 編輯器、然後:
   管理部署作業 → 編輯 → 版本選「新版本」→ 部署。
   舊端點 URL(macros/s/AKfycb...)不變。

   改動摘要(對齊 specs/task-feed.md Step 1 + D2 拍板):
   - 新增 ROOT_FOLDER_ID(每人子資料夾的母資料夾)
   - UPLOAD_FOLDER_ID 保留(?id= 讀舊檔、保底 list 過渡相容)
   - doPost 寫進該成員專屬子資料夾(getMemberFolder)、回 folderId
   - 白名單擴增 jpg/png、audio/mp4 副檔名改 .m4a(對齊 spec)
   - doGet ?action=list 雙模式:folderId 主路徑 / 無 folderId 保底遞迴
   ============================================================ */

const UPLOAD_FOLDER_ID = '1V_yWWyOUU4KIMOwThU1HByYTqlB7AE8d'; // 舊單一資料夾、?id= 讀舊檔 + 保底 list 過渡相容用
const ROOT_FOLDER_ID   = '1s2-fW3v961UP_RztdPFbvfIRKaElqzag'; // Task 5:每人子資料夾的母資料夾(istanda-mapasnava-members)

// 白名單:mimeType → 副檔名(含點)
const SUPPORTED_TYPES = {
  'audio/webm': '.webm',
  'audio/mp4':  '.m4a',  // spec line 145 對齊(現行是 .mp4、改成 .m4a)
  'audio/mp3':  '.mp3',
  'image/jpeg': '.jpg',
  'image/png':  '.png',
};

// 副檔名後綴 → mimeType(doPost 從 filename 後綴推導、白名單外 fallback audio/webm)
const EXT_TO_MIME = {
  'webm': 'audio/webm',
  'mp4':  'audio/mp4',
  'm4a':  'audio/mp4',
  'mp3':  'audio/mp3',
  'jpg':  'image/jpeg',
  'jpeg': 'image/jpeg',
  'png':  'image/png',
};

function doGet(e) {
  if (!e) e = { parameter: {} };
  const action = e.parameter.action;

  if (action === 'list') {
    const folderId = e.parameter.folderId;

    // 主路徑:指定子資料夾、只掃該夾(快、6/15 後正常路徑)
    if (folderId) {
      const folder = DriveApp.getFolderById(folderId);
      const it = folder.getFiles();
      const files = [];
      while (it.hasNext()) {
        const f = it.next();
        files.push({ fileId: f.getId(), filename: f.getName() });
      }
      return jsonOut({ ok: true, folderId: folderId, files: files });
    }

    // 保底路徑:無 folderId(首次上傳 / 舊 code 相容)
    // 掃「舊 UPLOAD_FOLDER_ID 扁平資料夾」+「ROOT 下一層所有子資料夾」、每筆帶 parentFolderId
    // ⚠️ 只下一層、不無限遞迴(避免效能爆炸)
    const result = {};
    collectFolderFiles(DriveApp.getFolderById(UPLOAD_FOLDER_ID), result); // 舊扁平(過渡期、清完自然空)
    const subs = DriveApp.getFolderById(ROOT_FOLDER_ID).getFolders();
    while (subs.hasNext()) {
      collectFolderFiles(subs.next(), result);
    }
    return jsonOut({ ok: true, mode: 'fallback', result: result });
  }

  // ?id=fileId 讀單檔(維持不動、跟資料夾無關、舊錄音照讀)
  const fileId = e.parameter.id;
  if (!fileId) return ContentService.createTextOutput('missing id');
  const file = DriveApp.getFileById(fileId);
  const blob = file.getBlob();
  return ContentService.createTextOutput(
    Utilities.base64Encode(blob.getBytes())
  ).setMimeType(ContentService.MimeType.TEXT);
}

// 把一個資料夾的檔案、依檔名前綴(memberId)分組塞進 result、每筆帶 parentFolderId
function collectFolderFiles(folder, result) {
  const parentFolderId = folder.getId();
  const it = folder.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    const name = f.getName();
    const memberId = name.split('_')[0];
    if (!result[memberId]) result[memberId] = [];
    result[memberId].push({ fileId: f.getId(), filename: name, parentFolderId: parentFolderId });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const now = new Date();
    const ts = Utilities.formatDate(now, 'Asia/Taipei', 'MMddHHmm');

    // 從 filename 後綴推導 mimeType + 正規化副檔名(白名單外 fallback audio/webm)
    const rawName = data.filename || 'unknown.webm';
    const dotIdx = rawName.lastIndexOf('.');
    const baseName = dotIdx > 0 ? rawName.substring(0, dotIdx) : rawName;
    const rawExt = dotIdx > 0 ? rawName.substring(dotIdx + 1).toLowerCase() : 'webm';
    const mimeType = EXT_TO_MIME[rawExt] || 'audio/webm';
    const ext = SUPPORTED_TYPES[mimeType]; // 形如 '.m4a'(含點)

    const filename = baseName + '_' + ts + ext;
    const blob = Utilities.newBlob(
      Utilities.base64Decode(data.audio),
      mimeType,
      filename
    );

    // Task 5:寫進該成員專屬子資料夾(folderId 有就用、沒有就在 ROOT 下查/建)
    const folder = getMemberFolder(data.folderId, data.memberName, data.memberId);
    const file = folder.createFile(blob);

    return jsonOut({
      ok: true,
      fileId: file.getId(),
      filename: filename,
      folderId: folder.getId(),  // 首次上傳:前端拿這個回填 Firestore members.driveFolderId
      mimeType: mimeType
    });
  } catch (err) {
    return jsonOut({ ok: false, error: err.toString() });
  }
}

// folderId 有值 → 直接用;沒有 → 在 ROOT 下查既有同名夾(防呆、不重複建)、沒有才 createFolder
function getMemberFolder(folderId, memberName, memberId) {
  if (folderId) {
    return DriveApp.getFolderById(folderId);
  }
  const safeName = (memberName || 'member') + '_' + (memberId || '').substring(0, 8);
  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const existing = root.getFoldersByName(safeName);
  if (existing.hasNext()) return existing.next(); // 防呆:回填失敗過、夾已存在就用、不重複建
  return root.createFolder(safeName);
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
