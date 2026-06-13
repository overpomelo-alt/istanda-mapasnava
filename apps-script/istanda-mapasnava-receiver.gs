/* ============================================================
   Istanda Mapasnava · Apps Script receiver
   Task 5 Step 1 + a7 十輪 FormData 診斷版(2026-05-28)

   ⚠️ 這份是「記錄用」副本、Apps Script 不在 GitHub 部署鏈內。
   聖瑱師請把這份整段貼到 Apps Script 編輯器、然後:
   管理部署作業 → 編輯 → 版本選「新版本」→ 部署。
   舊端點 URL(macros/s/AKfycb...)不變。

   改動摘要:
   - Step 1:每人子資料夾、jpg/png 白名單、?action=list 雙模式(folderId 主路徑 / 保底遞迴)
   - a7 十輪:doPost 加 multipart/form-data 偵測分支(handleFormDataTest)、
     不寫 Drive、只把 e.postData.length / type / debug 存進 PropertiesService;
     doGet 加 ?action=lastFormDataSize、讓前端撈出後端收到的 byte 數
   - Task 6-2(2026-06-12):doGet 加 ?action=delete&fileId= → setTrashed(true) 進垃圾桶
     (刪除鏈 Stage 1;list / 讀檔 / upload 分支一字未動)
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

  // a7 十輪:讓前端撈出上一次 FormData POST 收到的 byte 數 + e debug
  if (action === 'lastFormDataSize') {
    const props = PropertiesService.getScriptProperties();
    return jsonOut({
      ok: true,
      size:  props.getProperty('lastFormDataSize') || '0',
      type:  props.getProperty('lastFormDataType') || '',
      ts:    props.getProperty('lastFormDataTs')   || '0',
      debug: props.getProperty('lastFormDataDebug') || ''
    });
  }

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

  // Task 6-2:刪檔(?action=delete&fileId=…)→ setTrashed 移到擁有者 Drive 垃圾桶
  //   可救回 30 天、不需新 scope(DriveApp 已在用)。權限把關在前端(後端對誰都照刪)。
  //   防呆(規則4):fileId 空 → no fileId;getFileById 找不到/丟例外 → try/catch 回錯、不讓整支爆。
  //   ⚠️ 用獨立的 fileId 參數、不跟下方 ?id= 讀檔分支共用、避免誤刪正在讀的檔。
  if (action === 'delete') {
    const delId = e.parameter.fileId;
    if (!delId) return jsonOut({ ok: false, error: 'no fileId' });
    try {
      DriveApp.getFileById(delId).setTrashed(true);
      return jsonOut({ ok: true, fileId: delId });
    } catch (err) {
      return jsonOut({ ok: false, fileId: delId, error: err.toString() });
    }
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
    // a7 十輪:multipart/form-data 測試分支(FormData 直傳)— 不寫 Drive、只記 size
    if (e && e.postData && e.postData.type &&
        e.postData.type.indexOf('multipart/form-data') === 0) {
      return handleFormDataTest(e);
    }
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

/* a7 十輪:FormData multipart 測試處理(不寫 Drive、只驗 file 是否完整到後端)
   為何不抽 photo part:Apps Script e.postData.contents 是 JS 字串(UTF-16 code unit),
   binary 文件位元組透過 string 表示 byte 長度會失真;e.postData.length 才是真實
   request body byte count(= file.size + multipart boundary 開銷、通常 ~200-500 bytes)。
   診斷目的是「file 到底有沒有過來」、看 bodyLen ≈ file.size 即可。 */
function handleFormDataTest(e) {
  const props = PropertiesService.getScriptProperties();
  const bodyLen = (e.postData && e.postData.length) ? e.postData.length : 0;
  const type    = (e.postData && e.postData.type)   ? e.postData.type   : '';
  const debug = {
    parameterKeys:  e.parameter  ? Object.keys(e.parameter)  : null,
    parametersKeys: e.parameters ? Object.keys(e.parameters) : null,
    postDataType:   type,
    postDataLength: bodyLen,
    hasContents:    !!(e.postData && e.postData.contents),
    contentsStrLen: (e.postData && e.postData.contents) ? e.postData.contents.length : 0
  };
  props.setProperty('lastFormDataSize',  String(bodyLen));
  props.setProperty('lastFormDataType',  type);
  props.setProperty('lastFormDataTs',    String(Date.now()));
  props.setProperty('lastFormDataDebug', JSON.stringify(debug));
  return jsonOut({
    ok: true,
    mode: 'formdata-test',
    receivedBytes: bodyLen,
    type: type
  });
}
