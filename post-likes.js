/* ============================================================
   Istanda Mapasnava · post-likes.js
   貼文互動共用模組(規則 2):首頁(script.js)與個人頁(member.html)共用。
   - 按讚:togglePostLike(唯一寫入端)+ wireLikeButton
   - 留言:addPostComment(唯一寫入端)+ wireCommentButton + 模組自管的留言 sheet
   兩頁卡片渲染各自一份(情境不同),但按讚/留言「寫入 + sheet」邏輯只在這一處。
   身分(我是誰)由各頁透過 callback 提供(getIdentity / ensureIdentity)、本模組不綁特定頁。
   ============================================================ */
import {
  doc, updateDoc, arrayUnion, arrayRemove
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
      <div class="pcs__inputrow">
        <textarea class="pcs__input" id="pcsInput" rows="1" placeholder="說點什麼…"></textarea>
        <button class="pcs__submit" id="pcsSubmit" type="button">送出</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  el.querySelectorAll("[data-pcs-close]").forEach(b => b.addEventListener("click", closeSheet));
  el.querySelector("#pcsSubmit").addEventListener("click", onSubmit);
  _sheet = el;
  return el;
}

function closeSheet() {
  if (_sheet) _sheet.hidden = true;
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

/* 把一顆 💬 按鈕接上:顯示留言數 + 點擊開 sheet。
   opts = { btn, countEl, db, post, getIdentity, ensureIdentity, showToast } */
export function wireCommentButton(opts) {
  const { btn, countEl, post } = opts;
  if (!btn) return;
  if (countEl) countEl.textContent = String(Array.isArray(post.comments) ? post.comments.length : 0);
  btn.addEventListener("click", () => {
    openPostCommentSheet({
      db: opts.db, post,
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
