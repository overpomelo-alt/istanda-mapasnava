/* ============================================================
   Istanda Mapasnava · post-likes.js
   貼文互動共用模組(規則 2):首頁(script.js)與個人頁(member.html)共用。
   - 按讚:togglePostLike(唯一寫入端)+ wireLikeButton
   - 留言:addPostComment(唯一寫入端)+ wireCommentButton + 模組自管的留言 sheet
   兩頁卡片渲染各自一份(情境不同),但按讚/留言「寫入 + sheet」邏輯只在這一處。
   身分(我是誰)由各頁透過 callback 提供(getIdentity / ensureIdentity)、本模組不綁特定頁。
   ============================================================ */
import {
  doc, getDoc, updateDoc, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// 裝置識別:跟 member.html Task 3 同一個 localStorage key、確保同一台手機跨頁按讚一致
const DEVICE_ID_KEY = "istanda_device_id";
export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID())
      || ("dev-" + Date.now() + "-" + Math.random().toString(16).slice(2));
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/* 寫入端(唯一一處):currentlyLiked=true → arrayRemove(取消讚);false → arrayUnion(按讚)。
   arrayUnion/arrayRemove 依「值」加減、天然冪等、不需傳整個陣列。 */
export async function togglePostLike(db, postId, deviceId, currentlyLiked) {
  await updateDoc(doc(db, "posts", postId), {
    likes: currentlyLiked ? arrayRemove(deviceId) : arrayUnion(deviceId)
  });
}

/* 把一顆 ❤️ 按鈕接上:初始狀態渲染 + 點擊樂觀更新 + 寫失敗還原(規則 4)。
   這輪不接 onSnapshot、count 只反映 post.likes.length + 自己這次 ±1。
   opts = { btn, countEl, db, postId, likes, deviceId, onError } */
export function wireLikeButton(opts) {
  const { btn, countEl, db, postId, likes, deviceId, onError } = opts;
  if (!btn) return;
  let liked = Array.isArray(likes) && likes.includes(deviceId);
  let count = Array.isArray(likes) ? likes.length : 0;
  let busy = false;

  function render() {
    btn.textContent = liked ? "❤️" : "🤍";
    btn.setAttribute("aria-pressed", liked ? "true" : "false");
    if (countEl) countEl.textContent = String(count);
  }
  render();

  btn.addEventListener("click", async () => {
    if (busy || !postId) return;
    busy = true;
    const prevLiked = liked, prevCount = count;
    liked = !prevLiked;                                  // 樂觀更新:先變色 + 數字 ±1
    count = Math.max(0, prevCount + (liked ? 1 : -1));
    render();
    try {
      await togglePostLike(db, postId, deviceId, prevLiked);
    } catch (err) {
      liked = prevLiked; count = prevCount;              // 還原(規則 4)
      render();
      console.warn("[like] 寫入失敗、已還原:", err && err.message ? err.message : err);
      if (typeof onError === "function") onError(err);
    } finally {
      busy = false;
    }
  });
}

/* ============================================================
   留言(唯一寫入端 + 模組自管 sheet)
   ⚠️ createdAt 用 new Date()(client 時間)、不可用 serverTimestamp:
      Firestore 不允許在「陣列元素裡」用 serverTimestamp、arrayUnion 會丟錯。
      (member.html Task 3 錄音留言也是這樣寫。)
   ============================================================ */
export async function addPostComment(db, postId, comment) {
  await updateDoc(doc(db, "posts", postId), { comments: arrayUnion(comment) });
}

// 模組自管的單例留言 sheet(首頁/個人頁共用、第一次用才建、樣式在 style.css 的 .pcs-*)
let _sheet = null;
let _state = null;   // 當前開啟的 { db, post, getIdentity, ensureIdentity, onAdded, showToast, comments }

function ensureSheet() {
  if (_sheet) return _sheet;
  const el = document.createElement("div");
  el.className = "pcs";
  el.hidden = true;
  el.innerHTML = `
    <div class="pcs__backdrop" data-pcs-close></div>
    <div class="pcs__panel">
      <div class="pcs__header">
        <div class="pcs__title">留言</div>
        <button class="pcs__close" data-pcs-close type="button" aria-label="關閉">✕</button>
      </div>
      <div class="pcs__list" id="pcsList"></div>
      <div class="pcs__modetabs">
        <button class="pcs__modetab pcs__modetab--on" id="pcsModeText" type="button">打字</button>
        <button class="pcs__modetab" id="pcsModeAudio" type="button">錄音</button>
      </div>
      <div class="pcs__inputrow" id="pcsTextRow">
        <textarea class="pcs__input" id="pcsInput" rows="1" placeholder="說點什麼…"></textarea>
        <button class="pcs__submit" id="pcsSubmit" type="button">送出</button>
      </div>
      <div class="pcs__inputrow pcs__audiorow" id="pcsAudioRow" hidden>
        <div class="pcs__rec" id="pcsRec">
          <button class="pcs__recbtn" id="pcsRecBtn" type="button">🎤 點一下開始錄</button>
          <button class="pcs__recplay" id="pcsRecPlay" type="button" hidden>▶ 試聽</button>
          <button class="pcs__recreset" id="pcsRecReset" type="button" hidden>↻ 重錄</button>
        </div>
        <button class="pcs__submit" id="pcsAudioSubmit" type="button" disabled>送出</button>
        <audio id="pcsRecAudio" hidden></audio>
      </div>
    </div>`;
  document.body.appendChild(el);
  el.querySelectorAll("[data-pcs-close]").forEach(b => b.addEventListener("click", onCloseClick));
  el.querySelector("#pcsSubmit").addEventListener("click", onSubmit);
  el.querySelector("#pcsModeText").addEventListener("click", onModeTextClick);
  el.querySelector("#pcsModeAudio").addEventListener("click", () => setMode("audio"));
  el.querySelector("#pcsRecBtn").addEventListener("click", onRecBtn);
  el.querySelector("#pcsRecPlay").addEventListener("click", onRecPlay);
  el.querySelector("#pcsRecReset").addEventListener("click", vcReset);
  el.querySelector("#pcsAudioSubmit").addEventListener("click", onAudioSubmit);
  // VC-3b:留言列表的 ▶ 語音 用事件委派(列表會重畫、按鈕每次重建)
  el.querySelector("#pcsList").addEventListener("click", (e) => {
    const vb = e.target.closest(".pcs__voice");
    if (vb) onVoiceClick(vb);
  });
  _sheet = el;
  return el;
}

/* ============================================================
   VC-2:留言區獨立小錄音(狀態完全獨立於 Task1、不共用任何全域)
   ============================================================ */
let _vcRecorder = null;   // MediaRecorder
let _vcStream   = null;   // 麥克風 stream(release 用)
let _vcChunks   = [];
let _vcBlob     = null;
let _vcExt      = "webm";
let _vcTimer    = null;   // 計時 interval
let _vcAutoStop = null;   // 60 秒上限 timeout
let _vcSec      = 0;
let _vcDuration = 0;      // VC-3 要用的 durationSec
let _vcPlayUrl  = null;
const VC_LIMIT_SEC = 60;

// 複製 Task1 的 pickMimeType(複製、不共用、規則 11）
function vcPickMime() {
  if (typeof MediaRecorder === "undefined") return null;
  if (MediaRecorder.isTypeSupported("audio/webm")) return { mime: "audio/webm", ext: "webm" };
  if (MediaRecorder.isTypeSupported("audio/mp4"))  return { mime: "audio/mp4", ext: "mp4" };
  return null;
}

// 有「錄好但還沒送出」的語音?(錄音進行中 _vcBlob 還沒生成 → false、不算)
function vcHasUnsent() {
  return !!_vcBlob && !(_vcRecorder && _vcRecorder.state === "recording");
}
const VC_DISCARD_MSG = "錄好的語音還沒送出,切到打字會清掉,確定嗎?";

// 使用者主動關視窗(X / 背景):有未送出語音先確認(內部 closeSheet 不經這層、不誤觸)
function onCloseClick() {
  if (vcHasUnsent() && !confirm(VC_DISCARD_MSG)) return;
  closeSheet();
}

// 使用者點「打字」分頁:有未送出語音先確認(送出後自動切回時 _vcBlob 已清、不會誤觸)
function onModeTextClick() {
  if (vcHasUnsent() && !confirm(VC_DISCARD_MSG)) return;
  setMode("text");
}

function setMode(mode) {
  if (!_sheet) return;
  const textRow  = _sheet.querySelector("#pcsTextRow");
  const audioRow = _sheet.querySelector("#pcsAudioRow");
  const tabText  = _sheet.querySelector("#pcsModeText");
  const tabAudio = _sheet.querySelector("#pcsModeAudio");
  if (mode === "audio") {
    textRow.hidden = true; audioRow.hidden = false;
    tabAudio.classList.add("pcs__modetab--on"); tabText.classList.remove("pcs__modetab--on");
  } else {
    vcReset();   // 切回打字 → 清掉錄音狀態(規則 5)
    audioRow.hidden = true; textRow.hidden = false;
    tabText.classList.add("pcs__modetab--on"); tabAudio.classList.remove("pcs__modetab--on");
  }
}

function vcSetRecUI(stage) {
  // stage: idle | recording | done
  const btn   = _sheet.querySelector("#pcsRecBtn");
  const play  = _sheet.querySelector("#pcsRecPlay");
  const reset = _sheet.querySelector("#pcsRecReset");
  const submit= _sheet.querySelector("#pcsAudioSubmit");
  if (stage === "recording") {
    btn.textContent = "⏹ 停止 0:00"; btn.hidden = false;
    play.hidden = true; reset.hidden = true; submit.disabled = true;
  } else if (stage === "done") {
    btn.hidden = true;
    play.hidden = false; reset.hidden = false; submit.disabled = false;
  } else { // idle
    btn.textContent = "🎤 點一下開始錄"; btn.hidden = false;
    play.hidden = true; reset.hidden = true; submit.disabled = true;
  }
}

async function onRecBtn() {
  if (_vcRecorder && _vcRecorder.state === "recording") { vcStopRec(); return; }
  await vcStartRec();
}

async function vcStartRec() {
  const picked = vcPickMime();
  if (!picked) {
    if (_state && _state.showToast) _state.showToast("這台裝置不支援錄音、請換瀏覽器");
    return;
  }
  try {
    _vcStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    console.warn("[vc] getUserMedia 失敗:", err && err.message ? err.message : err);
    if (_state && _state.showToast) _state.showToast("⚠ 麥克風被擋住了、到瀏覽器設定允許");
    return;
  }
  _vcChunks = []; _vcBlob = null; _vcExt = picked.ext; _vcSec = 0; _vcDuration = 0;
  _vcRecorder = new MediaRecorder(_vcStream, { mimeType: picked.mime });
  _vcRecorder.ondataavailable = e => { if (e.data.size > 0) _vcChunks.push(e.data); };
  _vcRecorder.onstop = () => {
    if (_vcStream) { _vcStream.getTracks().forEach(t => t.stop()); _vcStream = null; }
    _vcBlob = new Blob(_vcChunks, { type: picked.mime });
    _vcDuration = _vcSec;
    if (_vcTimer) { clearInterval(_vcTimer); _vcTimer = null; }
    if (_vcAutoStop) { clearTimeout(_vcAutoStop); _vcAutoStop = null; }
    vcSetRecUI("done");
  };
  _vcRecorder.start();
  vcSetRecUI("recording");
  const btn = _sheet.querySelector("#pcsRecBtn");
  _vcTimer = setInterval(() => {
    _vcSec += 1;
    const mm = Math.floor(_vcSec / 60), ss = String(_vcSec % 60).padStart(2, "0");
    btn.textContent = `⏹ 停止 ${mm}:${ss}`;
  }, 1000);
  _vcAutoStop = setTimeout(() => {
    if (_state && _state.showToast) _state.showToast("⏱ 已達 60 秒上限、自動停止");
    vcStopRec();
  }, VC_LIMIT_SEC * 1000);
}

function vcStopRec() {
  if (_vcRecorder && _vcRecorder.state === "recording") _vcRecorder.stop();
}

function onRecPlay() {
  if (!_vcBlob) return;
  const audio = _sheet.querySelector("#pcsRecAudio");
  if (_vcPlayUrl) URL.revokeObjectURL(_vcPlayUrl);
  _vcPlayUrl = URL.createObjectURL(_vcBlob);
  audio.src = _vcPlayUrl;
  audio.play().catch(() => {});
}

// 重置:停 recorder、釋放麥克風、清狀態、UI 回 idle(規則 5)
function vcReset() {
  if (_vcRecorder && _vcRecorder.state === "recording") {
    try { _vcRecorder.stop(); } catch (e) {}
  }
  if (_vcStream) { _vcStream.getTracks().forEach(t => t.stop()); _vcStream = null; }
  if (_vcTimer) { clearInterval(_vcTimer); _vcTimer = null; }
  if (_vcAutoStop) { clearTimeout(_vcAutoStop); _vcAutoStop = null; }
  if (_vcPlayUrl) { URL.revokeObjectURL(_vcPlayUrl); _vcPlayUrl = null; }
  _vcRecorder = null; _vcChunks = []; _vcBlob = null; _vcSec = 0; _vcDuration = 0;
  if (_sheet) {
    const audio = _sheet.querySelector("#pcsRecAudio");
    if (audio) { audio.pause(); audio.removeAttribute("src"); }
    vcSetRecUI("idle");
  }
}

/* ============================================================
   VC-3b:語音留言播放(精簡複製 member.html playRecording 的 ?id= proxy 解法）
   TODO(上線後):與 member.html 的 playRecording 合併成單一共用播放器。
   ============================================================ */
let _vcPlayAudio = null;   // 當前播放的 Audio
let _vcPlayBtn   = null;   // 當前播放對應的 ▶ 按鈕
// 播放用 objectURL 共用上面 VC-2 宣告的 _vcPlayUrl(同名變數、用法一致、不同時使用)

function vcMimeFromName(filename) {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  if (ext === "mp4" || ext === "m4a") return "audio/mp4";
  if (ext === "mp3") return "audio/mp3";
  return "audio/webm";
}

function vcStopPlayback() {
  if (_vcPlayAudio) { try { _vcPlayAudio.pause(); } catch (e) {} }
  if (_vcPlayUrl) { URL.revokeObjectURL(_vcPlayUrl); _vcPlayUrl = null; }
  if (_vcPlayBtn) { _vcPlayBtn.textContent = _vcPlayBtn.dataset.label || "▶ 語音"; _vcPlayBtn.disabled = false; }
  _vcPlayAudio = null; _vcPlayBtn = null;
}

async function onVoiceClick(btn) {
  // 同一顆正在播 → 停(toggle）
  if (_vcPlayBtn === btn && _vcPlayAudio) { vcStopPlayback(); return; }
  // 別顆在播 → 先停 A、復原 A 按鈕(一次只播一個）
  if (_vcPlayAudio) vcStopPlayback();

  const opts = _state;
  const fileId = btn.dataset.fileid;
  const filename = btn.dataset.filename || "";
  if (!fileId || !opts || !opts.appsScriptUrl) {
    if (opts && typeof opts.showToast === "function") opts.showToast("語音載入失敗");
    return;
  }
  if (!btn.dataset.label) btn.dataset.label = btn.textContent;   // 記原始「▶ 語音 0:0x」
  btn.textContent = "載入中…";
  btn.disabled = true;
  try {
    const resp = await fetch(`${opts.appsScriptUrl}?id=${encodeURIComponent(fileId)}`);
    const base64 = await resp.text();
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: vcMimeFromName(filename) });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => vcStopPlayback();
    _vcPlayAudio = audio; _vcPlayBtn = btn; _vcPlayUrl = url;
    btn.disabled = false;
    btn.textContent = "⏹ 停止";
    await audio.play();
  } catch (err) {
    console.warn("[vc] 語音播放失敗:", err && err.message ? err.message : err);
    if (typeof opts.showToast === "function") opts.showToast("語音載入失敗");
    // 復原這顆按鈕 + 清狀態
    if (_vcPlayUrl) { URL.revokeObjectURL(_vcPlayUrl); _vcPlayUrl = null; }
    _vcPlayAudio = null; _vcPlayBtn = null;
    btn.disabled = false;
    btn.textContent = btn.dataset.label || "▶ 語音";
  }
}

function closeSheet() {
  if (_sheet) _sheet.hidden = true;
  vcStopPlayback();    // 關視窗 → 停掉正在播的語音(規則 5)
  vcReset();           // 關視窗 → 清錄音狀態(規則 5)
  setMode("text");     // 下次開回到打字預設
  _state = null;
}

function renderCommentList(comments) {
  const list = _sheet.querySelector("#pcsList");
  if (!comments || comments.length === 0) {
    list.innerHTML = `<div class="pcs__empty">還沒有留言、第一個說點什麼吧</div>`;
    return;
  }
  list.innerHTML = "";
  comments.forEach(c => {
    const row = document.createElement("div");
    row.className = "pcs__row";
    const author = `<div class="pcs__author">${esc(c.authorName || "家人")}</div>`;
    if (c.type === "audio") {
      // VC-1:語音留言。先只渲染按鈕、不綁 click(VC-3 才接 playRecording)
      const dur = (typeof c.durationSec === "number" && c.durationSec > 0)
        ? ` ${Math.floor(c.durationSec / 60)}:${String(Math.floor(c.durationSec % 60)).padStart(2, "0")}`
        : "";
      row.innerHTML = author +
        `<button class="pcs__voice" data-fileid="${esc(c.audioFileId || "")}" data-filename="${esc(c.audioFilename || "")}">▶ 語音${dur}</button>`;
    } else {
      // type==="text" 或舊留言無 type(規則 8 向後相容)→ 文字路徑不動
      row.innerHTML = author +
                      `<div class="pcs__text">${esc(c.text || "")}</div>`;
    }
    list.appendChild(row);
  });
}

/* 開留言 sheet。opts = { db, post, getIdentity, ensureIdentity, onAdded, showToast, prefillText? }
   getIdentity():有選過「我是誰」回 { memberId, authorName }、沒選回 null
   ensureIdentity(cb):開該頁的身分選擇器、選完呼叫 cb */
export function openPostCommentSheet(opts) {
  ensureSheet();
  _state = opts;
  _state.comments = Array.isArray(opts.post.comments) ? opts.post.comments.slice() : []; // 顯示用快照
  renderCommentList(_state.comments);
  const input = _sheet.querySelector("#pcsInput");
  input.value = opts.prefillText || "";   // 身分選完重開時帶回草稿
  _sheet.hidden = false;
  setTimeout(() => input.focus(), 50);
}

async function onSubmit() {
  const opts = _state;
  if (!opts) return;
  const input = _sheet.querySelector("#pcsInput");
  const submit = _sheet.querySelector("#pcsSubmit");
  const text = (input.value || "").trim();
  if (!text) return;                                  // 規則 4:空白不送

  // 身分:沒選過「我是誰」→ 關 sheet、選身分、選完帶草稿重開(避免和身分 modal 疊 z-index)
  const ident = opts.getIdentity();
  if (!ident) {
    const draft = text;
    const carry = opts;
    closeSheet();
    carry.ensureIdentity(() => openPostCommentSheet(Object.assign({}, carry, { prefillText: draft })));
    return;
  }

  const comment = {
    deviceId: getDeviceId(),
    memberId: ident.memberId,
    authorName: ident.authorName,
    text,
    createdAt: new Date()                             // ⚠️ 不可 serverTimestamp(陣列元素)
  };
  submit.disabled = true;
  opts.comments.push(comment);                        // 樂觀顯示
  renderCommentList(opts.comments);
  input.value = "";
  try {
    await addPostComment(opts.db, opts.post.id, comment);
    if (typeof opts.onAdded === "function") opts.onAdded(comment);   // 卡片留言數 +1 + post.comments 同步
  } catch (err) {
    opts.comments.pop();                              // 還原 + 把字還給使用者(規則 4)
    renderCommentList(opts.comments);
    input.value = text;
    console.warn("[comment] 寫入失敗、已還原:", err && err.message ? err.message : err);
    if (typeof opts.showToast === "function") opts.showToast("留言送出失敗、請再試");
  } finally {
    submit.disabled = false;
  }
}

/* ============================================================
   VC-3a:語音留言上傳機制(精簡複製自 member.html 照片那套 POST blind + 差集 claim）
   TODO(上線後):與 member.html 的 postBlobToAppsScript / claimNewFileId / seedExistingFileIds
   合併成單一共用工具,目前為求不動 member.html 而複製一份(規則 11)。
   資料夾策略 ②:存留言者自己的子資料夾 —— folderId 空走後端保底、list 用 data.result[memberId]。
   ============================================================ */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result).split(",")[1] || ""); // 剝 data: 前綴回純 base64
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

async function vcUploadBlob(appsScriptUrl, blob, filename, memberId, memberName, driveFolderId) {
  // POST blind:跨域 redirect 拿不到 response、不解析;fileId 靠下面差集 list 撈。
  // 有 driveFolderId → 主路徑(回扁平 files、差集只看 fileId、跟照片同一條);
  // 無 → 保底路徑(回 result[memberId]、靠檔名前綴=memberId 分組,招式 1 保證撈得到)。
  const base64 = await blobToBase64(blob);
  const claimed = [];
  async function listFiles() {
    if (driveFolderId) {
      const resp = await fetch(`${appsScriptUrl}?action=list&folderId=${encodeURIComponent(driveFolderId)}`);
      const data = await resp.json();
      return (data && data.files) || [];
    }
    const resp = await fetch(`${appsScriptUrl}?action=list`);
    const data = await resp.json();
    return (data && data.result && data.result[memberId]) || [];
  }
  // 差集 pre-seed:先記住資料夾現有 fileId、避免誤抓舊檔
  try { (await listFiles()).forEach(f => { if (f.fileId) claimed.push(f.fileId); }); }
  catch (e) { console.warn("[vc] pre-seed list 失敗、claimed 從空開始", e && e.message ? e.message : e); }

  await fetch(appsScriptUrl, {
    method: "POST",
    body: JSON.stringify({ audio: base64, filename, memberId, memberName: memberName || "", folderId: driveFolderId || "" })
  });

  // 差集 claim:retry 3 次、找第一筆不在 claimed 的新 fileId
  for (let attempt = 1; attempt <= 3; attempt++) {
    let files = [];
    try { files = await listFiles(); }
    catch (e) { console.warn("[vc] claim GET 失敗、retry " + attempt, e && e.message ? e.message : e); }
    const fresh = files.find(f => f.fileId && !claimed.includes(f.fileId));
    if (fresh) return { fileId: fresh.fileId, filename: fresh.filename };
    if (attempt < 3) await new Promise(r => setTimeout(r, 500));
  }
  throw new Error("CLAIM_FAILED");
}

async function onAudioSubmit() {
  const opts = _state;
  if (!opts) return;
  const submit = _sheet.querySelector("#pcsAudioSubmit");

  // 防呆(雙保險):沒錄音不送
  if (!_vcBlob) {
    if (typeof opts.showToast === "function") opts.showToast("還沒錄音喔");
    return;
  }

  // 身分:沒選過「我是誰」→ 關 sheet、選身分、選完重開(語音不帶草稿、錄音狀態會清掉)
  const ident = opts.getIdentity();
  if (!ident) {
    const carry = opts;
    closeSheet();
    carry.ensureIdentity(() => openPostCommentSheet(Object.assign({}, carry)));
    return;
  }

  if (!opts.appsScriptUrl) {
    if (typeof opts.showToast === "function") opts.showToast("上傳設定缺失、請重整");
    return;
  }

  const blob = _vcBlob, ext = _vcExt, duration = _vcDuration;
  // 招式 1:檔名前綴 = memberId(保底路徑 split('_')[0] 才會歸到 result[memberId])
  const filename = `${ident.memberId}_cmt_${Date.now()}.${ext}`;
  submit.disabled = true;
  const orig = submit.textContent;
  submit.textContent = "傳送中…";
  try {
    // 招式 2:讀留言者自己的 driveFolderId、有值就走主路徑(跟照片同一條成功路徑)
    let driveFolderId = "";
    try {
      const mSnap = await getDoc(doc(opts.db, "members", ident.memberId));
      if (mSnap.exists()) driveFolderId = mSnap.data().driveFolderId || "";
    } catch (e) {
      console.warn("[vc] 讀 driveFolderId 失敗、退保底路徑", e && e.message ? e.message : e);
    }
    const up = await vcUploadBlob(opts.appsScriptUrl, blob, filename, ident.memberId, ident.authorName, driveFolderId);
    const comment = {
      deviceId: getDeviceId(),
      memberId: ident.memberId,
      authorName: ident.authorName,
      createdAt: new Date(),            // ⚠️ 不可 serverTimestamp(陣列元素)
      type: "audio",
      audioFileId: up.fileId,
      audioFilename: up.filename || filename,
      durationSec: duration
    };
    await addPostComment(opts.db, opts.post.id, comment);
    opts.comments.push(comment);        // 樂觀顯示(VC-1 的 ▶ 語音 鈕會出現)
    renderCommentList(opts.comments);
    if (typeof opts.onAdded === "function") opts.onAdded(comment);
    vcReset();
    setMode("text");                    // 送完回打字模式
  } catch (err) {
    console.warn("[vc] 語音留言送出失敗:", err && err.message ? err.message : err);
    if (typeof opts.showToast === "function") opts.showToast("語音留言送出失敗、請再試");
    // 失敗:保留錄音讓他重送(規則 4)
  } finally {
    submit.textContent = orig;
    submit.disabled = false;
  }
}

/* 把一顆 💬 按鈕接上:顯示留言數 + 點擊開 sheet。
   opts = { btn, countEl, db, post, appsScriptUrl, getIdentity, ensureIdentity, showToast } */
export function wireCommentButton(opts) {
  const { btn, countEl, post } = opts;
  if (!btn) return;
  if (countEl) countEl.textContent = String(Array.isArray(post.comments) ? post.comments.length : 0);
  btn.addEventListener("click", () => {
    openPostCommentSheet({
      db: opts.db, post,
      appsScriptUrl: opts.appsScriptUrl,   // VC-3a:語音留言上傳用
      getIdentity: opts.getIdentity,
      ensureIdentity: opts.ensureIdentity,
      showToast: opts.showToast,
      onAdded: (c) => {
        if (!Array.isArray(post.comments)) post.comments = [];
        post.comments.push(c);                        // 同步 local post、count 更新
        if (countEl) countEl.textContent = String(post.comments.length);
      }
    });
  });
}

/* ============================================================
   分享 + 深連結(?post={postId})
   ============================================================ */
/* 分享一篇貼文:Web Share API 優先(系統選單含 LINE)、不支援/失敗退 LINE 網址 scheme。
   連結 = 此頁網址 + ?post={postId}(保留既有 query、如 member.html 的 ?id=)。 */
export async function sharePost(post, authorName) {
  const u = new URL(window.location.href);
  u.searchParams.set("post", post.id);
  u.hash = "";
  const url = u.toString();
  const who = authorName ? `${authorName} 的貼文` : "家族貼文";
  const text = post.text ? post.text.slice(0, 40) : "來看看這篇家族貼文";
  if (navigator.share) {
    try {
      await navigator.share({ title: who + " · Istanda Takiscipanan", text, url });
      return;
    } catch (e) {
      if (e && e.name === "AbortError") return;   // 使用者取消、不再開 LINE
      // 其他錯誤(不支援/被擋)→ 落 LINE 退路
    }
  }
  const lineUrl = "https://line.me/R/msg/text/?" + encodeURIComponent(text + "\n" + url);
  window.open(lineUrl, "_blank");
}

export function wireShareButton(opts) {
  const { btn, post, authorName } = opts;
  if (!btn) return;
  btn.addEventListener("click", () => sharePost(post, authorName));
}

// 深連結 query 讀 / 清(清掉避免 F5 重跳;保留其他 query 如 ?id= 與 hash)
export function getDeepLinkPostId() {
  return new URLSearchParams(window.location.search).get("post");
}
export function clearDeepLinkPostId() {
  const u = new URL(window.location.href);
  u.searchParams.delete("post");
  history.replaceState({}, "", u.pathname + (u.search || "") + (u.hash || ""));
}
