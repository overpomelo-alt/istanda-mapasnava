/* ============================================================
   Istanda Mapasnava · script.js (v1.1)
   - Firebase SDK v12.12.0 (對齊整個專案版本)
   - firebaseConfig 已填入 istanda-mapasnava 真實值
   - posts 改成從 Firestore 讀、沒資料就 empty state (不寫死 demo)
   - 新增「我是誰」選擇 modal + localStorage 持久化
   - 限動圈圈點擊 → member.html?id={memberId}
   - 中間錄音鍵 → 直奔「我」的 member.html
   - 搜尋 / 個人頁 6/15 後做、先 toast 提示
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, getDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { getDeviceId, wireLikeButton, wireCommentButton, wireShareButton, getDeepLinkPostId, clearDeepLinkPostId } from "./post-likes.js";   // 貼文互動共用(規則 2)

/* ===== Firebase 設定 (istanda-mapasnava 專案) ===== */
const firebaseConfig = {
  apiKey: "AIzaSyB2Ek81mDL1SGBe-6S6PHEs4M8a-H6PqzA",
  authDomain: "istanda-mapasnava.firebaseapp.com",
  projectId: "istanda-mapasnava",
  storageBucket: "istanda-mapasnava.firebasestorage.app",
  messagingSenderId: "924639525790",
  appId: "1:924639525790:web:9e5b1e8e2674620c71748f",
  measurementId: "G-WSST40SJF3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* Apps Script 端點(2b-5:照片走 ?id= 代理、同錄音音檔那條;member.html 也用同一個 URL)*/
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxAglNgdZo-KCyRaOYWRjrNhIQvjRC8exQn_ATqX7ozvTCKRsCTqLsWwAJDVEcKZQYnoQ/exec";

/* ===== 全域狀態 ===== */
let allMembers = [];                  // Firestore 抓來的成員清單,給 modal 列表用
const ME_KEY = "istanda_me_id";       // localStorage key

/* ============================================================
   0. 「我是誰」— localStorage 持久化
   ============================================================ */
function getMyId() {
  return localStorage.getItem(ME_KEY);
}
function setMyId(memberId) {
  localStorage.setItem(ME_KEY, memberId);
}
function getMyMember() {
  const id = getMyId();
  if (!id) return null;
  return allMembers.find(m => m.id === id) || null;
}

/* 找出「我」之後要做的事:
   1. 更新右下角 nav 頭像為「我」的 initials
   2. 中間錄音鍵點下去直奔我的 member.html
*/
function applyMyIdentity() {
  const me = getMyMember();
  const navAvatar = document.querySelector(".nav-avatar");
  if (me && navAvatar) {
    navAvatar.textContent = me.initials || initialsOf(me.name);
  } else if (navAvatar) {
    navAvatar.textContent = "ME";
  }
}

/* ============================================================
   1. 「我是誰」選擇 modal
   ============================================================ */
function openIdentityModal(onPick) {
  // 不重複建立
  const existing = document.getElementById("identityModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "identityModal";
  modal.className = "identity-modal";
  modal.innerHTML = `
    <div class="identity-modal__backdrop"></div>
    <div class="identity-modal__panel">
      <div class="identity-modal__header">
        <div class="identity-modal__title">你是誰?</div>
        <div class="identity-modal__sub">選擇之後,這支手機就會記住你</div>
      </div>
      <div class="identity-modal__list" id="identityList"></div>
      <button class="identity-modal__cancel" id="identityCancel">取消</button>
    </div>
  `;
  document.body.appendChild(modal);

  // 建立成員列表
  const list = modal.querySelector("#identityList");
  allMembers.forEach(m => {
    const row = document.createElement("button");
    row.className = "identity-row";
    row.innerHTML = `
      <div class="identity-row__avatar">${m.initials || initialsOf(m.name)}</div>
      <div class="identity-row__text">
        <div class="identity-row__name">${m.name || "(未命名)"}</div>
        ${m.nickname ? `<div class="identity-row__nick">${m.nickname}</div>` : ""}
      </div>
    `;
    row.addEventListener("click", () => {
      setMyId(m.id);
      applyMyIdentity();
      modal.remove();
      if (typeof onPick === "function") onPick(m);
    });
    list.appendChild(row);
  });

  // 關閉
  modal.querySelector("#identityCancel").addEventListener("click", () => modal.remove());
  modal.querySelector(".identity-modal__backdrop").addEventListener("click", () => modal.remove());
}

/* ============================================================
   2. Toast (小提示)
   ============================================================ */
function showToast(msg, ms = 2200) {
  let toast = document.getElementById("globalToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "globalToast";
    toast.className = "global-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("global-toast--show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("global-toast--show"), ms);
}

/* ============================================================
   3. 渲染「家族限動」圈圈
   每個 member 都是一個圈,點下去進到 member.html?id={memberId}
   ============================================================ */
async function renderStories(members) {
  const scroll = document.getElementById("storiesScroll");
  scroll.innerHTML = "";

  // 第一個永遠是「新增我的記事」按鈕
  scroll.appendChild(createAddStory());

  members.forEach((m, idx) => {
    const story = document.createElement("button");
    story.className = "story";
    story.setAttribute("aria-label", `${m.name} 的記事`);

    // TODO: 之後接真實的「有沒有未看的限動」狀態,目前先用 hasUnviewed 或預設 true
    const isViewed = m.hasUnviewed === false;

    story.innerHTML = `
      <div class="story__ring-wrap">
        <div class="story__ring ${isViewed ? 'story__ring--viewed' : ''}">
          <div class="story__inner">
            <div class="story__avatar">${m.initials || initialsOf(m.name)}</div>
          </div>
        </div>
      </div>
      <span class="story__name ${isViewed ? 'story__name--viewed' : ''}">
        ${m.nickname || m.name}
      </span>
    `;

    story.addEventListener("click", () => {
      if (!m.id) {
        // Hotfix:Firestore 連不上時 fallback 走 demo data(id: null)、防止跳 member.html?id=null 撞錯誤畫面
        showToast("家族資料還在連線、請重新整理頁面再試");
        return;
      }
      window.location.href = `member.html?id=${m.id}`;
    });

    scroll.appendChild(story);
  });
}

function createAddStory() {
  const btn = document.createElement("button");
  btn.className = "story";
  btn.setAttribute("aria-label", "新增我的記事");
  btn.innerHTML = `
    <div class="story__ring-wrap">
      <div class="story__ring story__ring--add">
        <div class="story__inner">
          <div class="story__avatar">我</div>
        </div>
      </div>
      <div class="story__add-badge">+</div>
    </div>
    <span class="story__name">我的記事</span>
  `;
  btn.addEventListener("click", () => {
    handleRecordPressed();
  });
  return btn;
}

function initialsOf(name) {
  if (!name) return "??";
  const parts = name.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* ============================================================
   4. 中間錄音鍵 / 「+ 我的記事」共用流程
   - 沒選過「我」→ 開 modal、選完後跳 member.html?id=我
   - 選過了 → 直接跳 member.html?id=我
   ============================================================ */
function handleRecordPressed() {
  const me = getMyMember();
  if (me) {
    window.location.href = `member.html?id=${me.id}`;
    return;
  }
  openIdentityModal((picked) => {
    window.location.href = `member.html?id=${picked.id}`;
  });
}

/* ============================================================
   5. 渲染「家族動態」貼文(2b-5:對齊真實 posts schema)
   真實 post:{ memberId, photos:[{fileId,filename}], audioFileId, text, createdAt, likes:[], comments:[] }
   ============================================================ */
async function renderFeed(posts, membersMap) {
  const section = document.getElementById("feedSection");
  section.innerHTML = "";

  if (!posts || posts.length === 0) {
    section.innerHTML = `
      <div class="feed-loading">
        還沒有家族貼文 🌿<br/>
        <span style="font-size:12px; color:var(--text-muted); margin-top:8px; display:inline-block;">
          進到自己的頁面、按「📷 發貼文」、分享第一篇給家人
        </span>
      </div>`;
    return;
  }

  // 照片 lazy-load:卡片捲進可視範圍才向 Apps Script 代理抓 base64(效能:照片代理較重)
  const photoObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      obs.unobserve(en.target);
      loadCardPhoto(en.target);
    });
  }, { rootMargin: "300px" });

  const deviceId = getDeviceId();
  posts.forEach(p => {
    const card = createPostCard(p, membersMap, deviceId);
    section.appendChild(card);
    const ph = card.querySelector("img[data-photo-fileid]");
    if (ph) photoObserver.observe(ph);
  });
}

/* 照片代理載入(規則 9:用錄音音檔同一條 ?id= 代理、私有檔靠後端擁有者身分讀;
   絕不用 drive 直連 / iframe)。失敗 → 該張顯示佔位、不讓整張卡片爆掉(規則 4)。 */
async function loadCardPhoto(imgEl) {
  const fileId = imgEl.getAttribute("data-photo-fileid");
  if (!fileId) return;
  try {
    const resp = await fetch(`${APPS_SCRIPT_URL}?id=${encodeURIComponent(fileId)}`);
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const base64 = await resp.text();
    if (!base64 || base64.length < 50) throw new Error("empty");
    imgEl.src = `data:image/jpeg;base64,${base64}`;   // 照片一律 jpeg(壓縮端輸出 image/jpeg)
  } catch (err) {
    console.warn("[feed] 照片載入失敗 fileId=" + fileId, err && err.message ? err.message : err);
    const media = imgEl.closest(".post__media");
    if (media) media.innerHTML =
      `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:13px;">照片載入失敗</div>`;
  }
}

function createPostCard(post, membersMap, deviceId) {
  const article = document.createElement("article");
  article.className = "post";
  article.setAttribute("data-post-id", post.id || "");   // 深連結 scroll 用

  // 作者:memberId join members(renderFeed 已備好 map、不每張各查、規則 3)
  const author = (membersMap && membersMap.get(post.memberId)) || {};
  const authorName = author.name || author.nickname || "家人";
  const authorInitials = author.initials || initialsOf(author.name) || "??";

  const photos = Array.isArray(post.photos) ? post.photos : [];
  const first = photos[0];

  // 照片區:v1 先只載第一張(lazy、data-photo-fileid 等 observer 觸發);多張角落標 1/N
  const mediaHtml = first
    ? `<img data-photo-fileid="${escapeHtml(first.fileId)}" alt="${escapeHtml(authorName)} 的照片" />
       ${photos.length > 1
         ? `<span style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;font-size:12px;padding:2px 9px;border-radius:11px;">1/${photos.length}</span>`
         : ""}`
    : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:13px;">(這篇沒有照片)</div>`;

  article.innerHTML = `
    <header class="post__header">
      <div class="post__user">
        <div class="post__avatar-ring"><div class="post__avatar-inner">
          <div class="post__avatar">${escapeHtml(authorInitials)}</div>
        </div></div>
        <div class="post__meta">
          <span class="post__name">${escapeHtml(authorName)}</span>
        </div>
      </div>
    </header>

    <div class="post__media">${mediaHtml}</div>

    <div class="post__body">
      <div class="post__likes">
        <button class="post-like-btn" aria-label="按讚" style="background:none;border:none;cursor:pointer;font-size:18px;padding:0;line-height:1;vertical-align:-3px;">🤍</button>
        <span class="post-like-count">0</span> 個讚
        · <button class="post-comment-btn" aria-label="留言" style="background:none;border:none;cursor:pointer;font-size:18px;padding:0;line-height:1;vertical-align:-3px;">💬</button>
        <span class="post-comment-count">0</span> 則留言
        · <button class="post-share-btn" aria-label="分享" style="background:none;border:none;cursor:pointer;font-size:15px;padding:0;line-height:1;vertical-align:-1px;color:var(--text-soft);">↗️ 分享</button>
      </div>
      ${post.text
        ? `<p class="post__caption"><span class="post__caption-author">${escapeHtml(authorName)}</span> <span>${escapeHtml(post.text)}</span></p>`
        : ""}
      <p class="post__time">${timeAgo(post.createdAt)}</p>
    </div>
  `;

  // ❤️ 接共用 wireLikeButton(樂觀更新 + 寫失敗還原、規則 4)
  wireLikeButton({
    btn: article.querySelector(".post-like-btn"),
    countEl: article.querySelector(".post-like-count"),
    db, postId: post.id, likes: post.likes, deviceId,
    onError: () => showToast("按讚失敗、請再試")
  });

  // 💬 接共用 wireCommentButton(身分用首頁的 ME_KEY / openIdentityModal)
  wireCommentButton({
    btn: article.querySelector(".post-comment-btn"),
    countEl: article.querySelector(".post-comment-count"),
    db, post,
    appsScriptUrl: APPS_SCRIPT_URL,   // VC-3a:語音留言上傳
    getIdentity: () => {
      const id = getMyId(); if (!id) return null;
      const me = getMyMember();
      return { memberId: id, authorName: (me && (me.name || me.nickname)) || "家人" };
    },
    ensureIdentity: (cb) => openIdentityModal(() => cb()),
    showToast
  });

  // ↗️ 接共用 wireShareButton(Web Share API → LINE 退路)
  wireShareButton({ btn: article.querySelector(".post-share-btn"), post, authorName });

  return article;
}

/* 深連結:?post={postId} → 開那篇。在初次 feed 裡 → scroll + 高亮;
   不在 → getDoc 單獨抓、prepend 到最上;找不到 → toast(規則 4:不整頁壞)。 */
async function handlePostDeepLink(membersMap) {
  const pid = getDeepLinkPostId();
  if (!pid) return;
  const section = document.getElementById("feedSection");
  if (!section) return;
  let card = section.querySelector(`.post[data-post-id="${pid}"]`);
  if (!card) {
    try {
      const snap = await getDoc(doc(db, "posts", pid));
      if (!snap.exists()) { showToast("這篇貼文找不到了"); clearDeepLinkPostId(); return; }
      const post = { id: snap.id, ...snap.data() };
      card = createPostCard(post, membersMap, getDeviceId());
      const empty = section.querySelector(".feed-loading");
      if (empty) empty.remove();
      section.insertBefore(card, section.firstChild);
      const ph = card.querySelector("img[data-photo-fileid]");
      if (ph) loadCardPhoto(ph);   // 單獨抓的卡片沒掛 observer、直接載
    } catch (err) {
      console.warn("[feed] 深連結貼文載入失敗:", err && err.message ? err.message : err);
      showToast("這篇貼文找不到了");
      clearDeepLinkPostId();
      return;
    }
  }
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.classList.add("post--highlight");
  setTimeout(() => card.classList.remove("post--highlight"), 2000);
  clearDeepLinkPostId();
}

/* createdAt(Firestore serverTimestamp)→ 相對時間。
   剛寫入未解析(pending)= null → 「剛剛」(規則 4 防呆) */
function timeAgo(ts) {
  if (!ts) return "剛剛";
  let d;
  if (typeof ts.toDate === "function") d = ts.toDate();   // Firestore Timestamp
  else if (ts.seconds != null) d = new Date(ts.seconds * 1000);
  else d = new Date(ts);
  const sec = (Date.now() - d.getTime()) / 1000;
  if (isNaN(sec) || sec < 60) return "剛剛";
  if (sec < 3600)  return Math.floor(sec / 60) + " 分鐘前";
  if (sec < 86400) return Math.floor(sec / 3600) + " 小時前";
  return Math.floor(sec / 86400) + " 天前";
}

/* 文字 / 屬性防注入(家人輸入的 text、名字可能含特殊字元;規則 4)*/
function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ============================================================
   6. 底部 nav 行為
   ============================================================ */
function bindBottomNav() {
  const navBtns = document.querySelectorAll(".bottom-nav .nav-btn");
  // 順序: [首頁, 搜尋, 錄音, 家族成員, 我]
  if (navBtns.length >= 5) {
    // 搜尋 → toast (6/15 後做)
    navBtns[1].addEventListener("click", () => {
      showToast("找人功能準備中,6/15 後上線");
    });
    // 錄音 → handleRecordPressed
    navBtns[2].addEventListener("click", () => {
      handleRecordPressed();
    });
    // 家族成員 → 滾動到限動區
    navBtns[3].addEventListener("click", () => {
      document.querySelector(".stories-section")?.scrollIntoView({ behavior: "smooth" });
    });
    // 我 → 我的 member.html / 沒選過就開 modal
    navBtns[4].addEventListener("click", () => {
      handleRecordPressed();
    });
  }
}

/* ============================================================
   7. 主流程
   ============================================================ */
async function main() {
  bindBottomNav();

  try {
    // 抓家族成員
    const membersSnap = await getDocs(collection(db, "members"));
    allMembers = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (allMembers.length === 0) {
      // Firestore 還沒資料時的最小範例 (沒有 id 就不能跳轉、視為純展示)
      const demo = [
        { id: null, name: "Cina Umav", nickname: "Cina Umav", initials: "CU" },
        { id: null, name: "Tama Iman", nickname: "Tama Iman", initials: "TI" },
      ];
      renderStories(demo);
    } else {
      renderStories(allMembers);
    }

    applyMyIdentity();

    // 抓貼文(Task 5 2b-5:posts 已是真實貼文來源、發貼文 modal 寫入)
    // 作者用 memberId join members、先把 members 做成 map、不每張卡片各查(規則 3)
    const membersMap = new Map(allMembers.map(m => [m.id, m]));
    try {
      const postsSnap = await getDocs(
        query(collection(db, "posts"), orderBy("createdAt", "desc"))
      );
      const posts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderFeed(posts, membersMap);
      handlePostDeepLink(membersMap);   // 若網址有 ?post= → scroll 到那篇 / 單獨抓
    } catch (err) {
      // posts collection 還沒資料 / 讀取失敗 → 空狀態(規則 4)
      console.warn("posts 讀取失敗或尚無資料:", err && err.message ? err.message : err);
      renderFeed([]);
      handlePostDeepLink(membersMap);   // 仍試單篇 getDoc(list 失敗但單篇可能在)
    }

  } catch (err) {
    console.error("Firestore 讀取失敗:", err);
    // 連 members 都讀不到 → 顯示提示 + 空 feed
    showToast("連線失敗,請檢查網路");
    renderFeed([]);
  }
}

/* ===== 啟動 ===== */
main();
