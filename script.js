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
  getFirestore, collection, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { getDeviceId, wireLikeButton, wireCommentButton, wireShareButton, getDeepLinkPostId, clearDeepLinkPostId, initPhotoLightbox, wirePostDeleteMenu, selectIdentity, uploadBlobToDrive, deleteDriveFile } from "./post-likes.js?v=18";   // 貼文互動共用(規則 2)

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
  if (!navAvatar) return;
  if (me && me.avatarFileId) {
    // 6-4:有頭貼 → 放 <img>(經 loadCardPhoto 抓圖、CSS object-fit:cover 圓裁)
    navAvatar.innerHTML = `<img class="nav-avatar__img" data-photo-fileid="${me.avatarFileId}" alt="" />`;
    loadCardPhoto(navAvatar.querySelector("img"));
  } else if (me) {
    navAvatar.textContent = me.initials || initialsOf(me.name);
  } else {
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
  const myDeviceId = getDeviceId();
  allMembers.forEach(m => {
    const claimedByOther = m.claimedByDeviceId && m.claimedByDeviceId !== myDeviceId;
    const row = document.createElement("button");
    row.className = "identity-row" + (claimedByOther ? " identity-row--claimed" : "");
    row.innerHTML = `
      <div class="identity-row__avatar">${m.initials || initialsOf(m.name)}</div>
      <div class="identity-row__text">
        <div class="identity-row__name">${m.name || "(未命名)"}</div>
        ${m.nickname ? `<div class="identity-row__nick">${m.nickname}</div>` : ""}
      </div>
      ${claimedByOther ? `<span class="identity-row__badge">已認領</span>` : ""}
    `;
    row.addEventListener("click", async () => {
      // 6-3:認領(被別人認領則走救回);成功才套用身分(規則4:失敗不改 localStorage)
      const r = await selectIdentity({ db, member: m, deviceId: myDeviceId, oldMemberId: getMyId(), showToast });
      if (!r || !r.ok) return;
      // 本地 cache 同步:釋放我原本認領的、標記新認領(下次開 modal 灰標才對)
      const old = getMyId();
      if (old && old !== m.id) {
        const oldM = allMembers.find(x => x.id === old);
        if (oldM && oldM.claimedByDeviceId === myDeviceId) oldM.claimedByDeviceId = null;
      }
      m.claimedByDeviceId = myDeviceId;
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
    card.querySelectorAll("img[data-photo-fileid]").forEach(ph => photoObserver.observe(ph));
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

  // 照片區:橫向 scroll-snap 輪播、每張一個 slide(lazy:每個 img 等 observer 觸發才載)。
  // 多張時角落標「目前/總數」、隨捲動更新;單張時行為跟以前一樣(就一個 slide、無角標)。
  const mediaHtml = photos.length > 0
    ? `<div class="post__carousel">
         ${photos.map(p => `<div class="post__slide"><img data-photo-fileid="${escapeHtml(p.fileId)}" alt="${escapeHtml(authorName)} 的照片" /></div>`).join("")}
       </div>
       ${photos.length > 1
         ? `<span class="post__photo-count" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;font-size:12px;padding:2px 9px;border-radius:11px;">1/${photos.length}</span>`
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

  // 照片輪播:橫滑時更新「目前/總數」角標(多張才有)
  if (photos.length > 1) {
    const carousel = article.querySelector(".post__carousel");
    const countEl = article.querySelector(".post__photo-count");
    if (carousel && countEl) {
      carousel.addEventListener("scroll", () => {
        const idx = Math.round(carousel.scrollLeft / carousel.clientWidth);
        countEl.textContent = `${Math.min(photos.length, idx + 1)}/${photos.length}`;
      }, { passive: true });
    }
  }

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

  // ⋯ 刪除選單(6-2:只在自己貼文 memberId===getMyId() 時掛、首頁/個人頁共用一支)
  wirePostDeleteMenu({ article, post, db, getMyId, appsScriptUrl: APPS_SCRIPT_URL, showToast });

  return article;
}

/* ============================================================
   VC-4:首頁 feed 即時化(onSnapshot + docChanges 精準更新)
   - added:插新卡(只有這時抓那張照片);第一次 snapshot 全當 added → build 初始 feed
   - modified:就地只更新 讚數/留言數/愛心,用 snapshot 絕對值(冪等、跟樂觀更新共存)
   - removed:移除那張卡
   絕不整頁重畫、modified 絕不重抓照片(照片代理很貴)。
   ============================================================ */
const FEED_EMPTY_HTML = `
  <div class="feed-loading">
    還沒有家族貼文 🌿<br/>
    <span style="font-size:12px; color:var(--text-muted); margin-top:8px; display:inline-block;">
      進到自己的頁面、按「📷 發貼文」、分享第一篇給家人
    </span>
  </div>`;

let _feedUnsub = null;

function setupFeedListener(membersMap) {
  const section = document.getElementById("feedSection");
  const deviceId = getDeviceId();
  // 照片 lazy-load:整個 feed 共用一個 observer(只有 added 的卡才 observe → 才會抓照片)
  const photoObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      obs.unobserve(en.target);
      loadCardPhoto(en.target);
    });
  }, { rootMargin: "300px" });

  let first = true;
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  if (_feedUnsub) { _feedUnsub(); _feedUnsub = null; }

  _feedUnsub = onSnapshot(q, (snap) => {
    // 清掉「載入家族記事中…」或上一輪的空狀態佔位(都是 .feed-loading)
    const placeholder = section.querySelector(".feed-loading");
    if (placeholder) placeholder.remove();

    snap.docChanges().forEach(change => {
      const post = { id: change.doc.id, ...change.doc.data() };
      if (change.type === "added") {
        const card = createPostCard(post, membersMap, deviceId);
        const cards = section.querySelectorAll(".post");
        if (change.newIndex >= cards.length) section.appendChild(card);
        else section.insertBefore(card, cards[change.newIndex]);
        card.querySelectorAll("img[data-photo-fileid]").forEach(ph => photoObserver.observe(ph));   // 只有新卡才抓照片(每張 slide）
      } else if (change.type === "modified") {
        const card = section.querySelector(`.post[data-post-id="${post.id}"]`);
        if (card) updatePostCardStats(card, post, deviceId);   // 就地、不重建、不碰照片
      } else if (change.type === "removed") {
        const card = section.querySelector(`.post[data-post-id="${post.id}"]`);
        if (card) card.remove();
      }
    });

    // 0 筆 → 空狀態;有貼文則上面已清掉佔位
    if (section.querySelectorAll(".post").length === 0) {
      section.innerHTML = FEED_EMPTY_HTML;
    }

    if (first) {
      first = false;
      handlePostDeepLink(membersMap);   // 初始 build 完才處理 ?post= 深連結
    }
  }, (err) => {
    console.warn("[feed] onSnapshot 失敗:", err && err.message ? err.message : err);
    if (section.querySelectorAll(".post").length === 0) section.innerHTML = FEED_EMPTY_HTML;
    showToast("動態載入失敗、請檢查網路");
  });
}

/* modified 就地更新:讚數/留言數一律用 snapshot 的「絕對值」(likes.length / comments.length),
   不累加 → 不管樂觀更新做了什麼、或重複收到 snapshot 都會校正成正確值、不會變兩倍也不會閃。
   愛心:依 likes 陣列有沒有「我的 deviceId」重算實心/空心(與 wireLikeButton 同口徑)。 */
function updatePostCardStats(card, post, deviceId) {
  const likes = Array.isArray(post.likes) ? post.likes : [];
  const comments = Array.isArray(post.comments) ? post.comments : [];
  const likeCount = card.querySelector(".post-like-count");
  const commentCount = card.querySelector(".post-comment-count");
  const likeBtn = card.querySelector(".post-like-btn");
  if (likeCount) likeCount.textContent = String(likes.length);
  if (commentCount) commentCount.textContent = String(comments.length);
  if (likeBtn) {
    const liked = likes.includes(deviceId);
    likeBtn.textContent = liked ? "❤️" : "🤍";
    likeBtn.setAttribute("aria-pressed", liked ? "true" : "false");
  }
}

/* 深連結:#post={postId}(相容舊 ?post=)→ 開那篇。在初次 feed 裡 → scroll + 高亮;
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
      // 單獨抓的卡片沒掛 observer、直接載(多張 slide 全載、單一卡片可接受)
      card.querySelectorAll("img[data-photo-fileid]").forEach(ph => loadCardPhoto(ph));
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
   6-4 Block 1:設定頁殼(全螢幕 sheet、沿用 identity-modal overlay 樣式)+ 改名
   殼之後 6-4 其他塊(放大/意見/頭貼/切換)都掛進 #settingsBody。
   ============================================================ */
function openSettings() {
  const existing = document.getElementById("settingsSheet");
  if (existing) existing.remove();
  const modal = document.createElement("div");
  modal.id = "settingsSheet";
  modal.className = "identity-modal";   // 沿用既有 overlay(backdrop blur + slideUp panel)
  modal.innerHTML = `
    <div class="identity-modal__backdrop"></div>
    <div class="identity-modal__panel">
      <div class="identity-modal__header"><div class="identity-modal__title">設定</div></div>
      <div class="settings-body" id="settingsBody"></div>
      <button class="identity-modal__cancel" id="settingsClose">關閉</button>
    </div>`;
  document.body.appendChild(modal);
  renderSettingsBody(modal.querySelector("#settingsBody"));
  modal.querySelector("#settingsClose").addEventListener("click", () => modal.remove());
  modal.querySelector(".identity-modal__backdrop").addEventListener("click", () => modal.remove());
}

/* 介面大小:讀 / 套用(套用 = 切 :root 的 data-font-scale + 存 localStorage;倍率值在 style.css)*/
function getFontScale() {
  try { const s = localStorage.getItem("istanda_font_scale"); return (s === "large" || s === "xlarge") ? s : "standard"; }
  catch (e) { return "standard"; }
}
function applyFontScale(scale) {
  const v = (scale === "large" || scale === "xlarge") ? scale : "standard";
  if (v === "standard") document.documentElement.removeAttribute("data-font-scale");
  else document.documentElement.setAttribute("data-font-scale", v);
  try { localStorage.setItem("istanda_font_scale", v); } catch (e) {}
}

/* 6-4 頭貼:壓縮(長邊縮 400、保比例、不強制方形、jpeg;圓裁交給 CSS)*/
async function compressAvatar(file) {
  const MAX = 400;
  let bitmap;
  try { bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch (e) { bitmap = await createImageBitmap(file); }   // 舊瀏覽器無 imageOrientation 選項
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  if (bitmap.close) bitmap.close();
  return await new Promise((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error("toBlob 失敗")), "image/jpeg", 0.85));
}

/* 重繪設定頁「頭貼」區塊(預覽 + 鈕);初始與每次變更後都呼叫 */
function renderAvatarSection() {
  const sec = document.getElementById("settingsAvatarSection");
  if (!sec) return;
  const me = getMyMember();
  const fid = me ? (me.avatarFileId || null) : null;
  sec.innerHTML = `
    <div class="settings-section__title">頭貼</div>
    <div class="settings-avatar-row">
      <div class="settings-avatar-preview" id="settingsAvatarPreview"></div>
      <div class="settings-avatar-actions">
        <button class="settings-save-btn" id="settingsAvatarPick">選擇照片</button>
        ${fid ? `<button class="settings-remove-btn" id="settingsAvatarRemove">移除頭貼</button>` : ""}
      </div>
    </div>
    <input type="file" accept="image/*" id="settingsAvatarInput" class="visually-hidden" />`;
  const prev = sec.querySelector("#settingsAvatarPreview");
  if (fid) {
    prev.innerHTML = `<img class="settings-avatar-img" data-photo-fileid="${fid}" alt="" />`;
    loadCardPhoto(prev.querySelector("img"));   // 6-4 第3點:既有 fileId→影像機制
  } else {
    prev.textContent = (me && (me.initials || initialsOf(me.name))) || "?";
  }
  const input = sec.querySelector("#settingsAvatarInput");
  const pick = sec.querySelector("#settingsAvatarPick");
  pick.addEventListener("click", () => input.click());
  input.addEventListener("change", () => handleAvatarFile(input, pick));
  const rm = sec.querySelector("#settingsAvatarRemove");
  if (rm) rm.addEventListener("click", () => removeAvatar(rm));
}

/* 選照片 → arrayBuffer 守門 → 壓縮 → 上傳 → 寫 avatarFileId → 重繪 nav/預覽 → 清舊孤兒檔 */
async function handleAvatarFile(fileInput, pickBtn) {
  const file = fileInput.files && fileInput.files[0];
  fileInput.value = "";                       // 重置、同一張可再選
  if (!file) return;
  try { await file.arrayBuffer(); }           // 守門:雲端 proxy 讀不到 → 友善提示、不續(規則4)
  catch (e) { showToast("這張照片讀不到,換一張或用相機拍"); return; }
  const myId = getMyId();
  if (!myId) return;
  const orig = pickBtn.textContent;
  pickBtn.disabled = true; pickBtn.textContent = "上傳中…";
  try {
    const blob = await compressAvatar(file);
    const newFileId = await uploadBlobToDrive(blob, `${myId}.jpg`);
    const me = getMyMember();
    const oldFileId = me ? (me.avatarFileId || null) : null;
    await updateDoc(doc(db, "members", myId), { avatarFileId: newFileId });
    if (me) me.avatarFileId = newFileId;      // 本地 cache
    applyMyIdentity();                         // 重繪 nav 我的頭貼
    renderAvatarSection();                      // 重繪設定預覽 + 「移除頭貼」鈕
    if (oldFileId) deleteDriveFile(APPS_SCRIPT_URL, oldFileId).catch(() => {});   // 背景清舊孤兒檔
    showToast("頭貼更新了 🌿");
  } catch (e) {
    console.warn("[avatar] 上傳失敗:", e && e.message ? e.message : e);
    showToast("上傳失敗,等一下再試");
    pickBtn.disabled = false; pickBtn.textContent = orig;   // 失敗:鈕復原、avatarFileId 不動
  }
}

/* 移除頭貼:avatarFileId→null → 清舊檔 → 回 initials */
async function removeAvatar(removeBtn) {
  const myId = getMyId();
  if (!myId) return;
  const me = getMyMember();
  const oldFileId = me ? (me.avatarFileId || null) : null;
  if (!oldFileId) return;
  removeBtn.disabled = true;
  try {
    await updateDoc(doc(db, "members", myId), { avatarFileId: null });
    if (me) me.avatarFileId = null;
    applyMyIdentity();
    renderAvatarSection();
    deleteDriveFile(APPS_SCRIPT_URL, oldFileId).catch(() => {});
    showToast("已移除頭貼");
  } catch (e) {
    console.warn("[avatar] 移除失敗:", e && e.message ? e.message : e);
    showToast("移除失敗,等一下再試");
    removeBtn.disabled = false;
  }
}

function renderSettingsBody(body) {
  const me = getMyMember();
  // 改名(需認領;沒認領→提示)
  const renameHtml = me
    ? `<div class="settings-section">
         <div class="settings-section__title">改名字</div>
         <input class="settings-input" id="settingsNameInput" type="text" maxlength="20" placeholder="輸入你的名字" />
         <button class="settings-save-btn" id="settingsSaveName">儲存</button>
       </div>`
    : `<div class="settings-section">
         <div class="settings-section__title">改名字</div>
         <p class="settings-hint">你還沒認領身分,先選一個身分才能改名字。</p>
         <button class="settings-save-btn" id="settingsPickIdentity">選擇我的身分</button>
       </div>`;
  // 介面大小(不需認領、永遠顯示)
  const scale = getFontScale();
  const sizeBtn = (val, label, fs) =>
    `<button class="settings-size-btn${scale === val ? " settings-size-btn--on" : ""}" data-scale="${val}" style="font-size:${fs}px">${label}</button>`;
  const fontHtml = `
    <div class="settings-section">
      <div class="settings-section__title">介面大小</div>
      <div class="settings-sizes">
        ${sizeBtn("standard", "標準", 15)}${sizeBtn("large", "大", 18)}${sizeBtn("xlarge", "特大", 21)}
      </div>
    </div>`;
  // 意見回饋(不需認領、永遠顯示;寫進 feedback 集合、Tien 從 console 看)
  const fbHtml = `
    <div class="settings-section">
      <div class="settings-section__title">意見回饋</div>
      <textarea class="settings-textarea" id="settingsFeedback" maxlength="500" placeholder="想說的話、遇到的問題、想要的功能…"></textarea>
      <button class="settings-save-btn" id="settingsFeedbackSend" disabled>送出</button>
    </div>`;
  // 頭貼(放改名下面、同屬身分;未認領顯示提示、不顯示上傳)
  const avatarHtml = me
    ? `<div class="settings-section" id="settingsAvatarSection"></div>`
    : `<div class="settings-section">
         <div class="settings-section__title">頭貼</div>
         <p class="settings-hint">你還沒「選擇我的身分」,先認領才能設頭貼。</p>
       </div>`;
  body.innerHTML = renameHtml + avatarHtml + fontHtml + fbHtml;
  if (me) renderAvatarSection();   // 填入頭貼預覽 + 鈕(只在已認領)

  // 改名 wiring
  if (me) {
    const input = body.querySelector("#settingsNameInput");
    input.value = me.name || "";
    body.querySelector("#settingsSaveName").addEventListener("click", () => saveMyName(input.value));
  } else {
    body.querySelector("#settingsPickIdentity").addEventListener("click", () => {
      document.getElementById("settingsSheet")?.remove();
      openIdentityModal(() => openSettings());   // 認領完自動重開設定
    });
  }
  // 介面大小 wiring:點了即時生效 + 高亮(規則5:狀態同步)
  body.querySelectorAll(".settings-size-btn").forEach(b => {
    b.addEventListener("click", () => {
      applyFontScale(b.dataset.scale);
      body.querySelectorAll(".settings-size-btn").forEach(x => x.classList.toggle("settings-size-btn--on", x === b));
    });
  });
  // 意見回饋 wiring:空白/全空格 → 送出鈕 disabled(長輩友善、不跳錯)
  const fbInput = body.querySelector("#settingsFeedback");
  const fbBtn = body.querySelector("#settingsFeedbackSend");
  const syncFbBtn = () => { fbBtn.disabled = fbInput.value.trim().length === 0; };
  fbInput.addEventListener("input", syncFbBtn);
  syncFbBtn();
  fbBtn.addEventListener("click", () => sendFeedback(fbInput, fbBtn));
}

/* 送出意見回饋 → addDoc 到 feedback 集合(未認領也可送、memberId/Name 為 null)。
   送出中鈕 disabled+「送出中…」;成功清空+toast、失敗保留文字+toast(規則4)。 */
async function sendFeedback(textarea, btn) {
  const text = textarea.value.trim();
  if (!text) return;                       // 雙保險:空白不送(鈕本就 disabled)
  const orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = "送出中…";
  const me = getMyMember();
  try {
    await addDoc(collection(db, "feedback"), {
      text,
      memberId: getMyId() || null,
      memberName: me ? (me.name || null) : null,   // 已認領附目前身分中文名、未認領 null
      deviceId: getDeviceId(),
      userAgent: navigator.userAgent,
      createdAt: serverTimestamp(),
    });
    textarea.value = "";
    btn.textContent = orig;
    btn.disabled = true;                   // 清空後本來就該 disabled
    showToast("已送出,謝謝 🌿");
  } catch (e) {
    console.warn("[feedback] 送出失敗:", e && e.message ? e.message : e);
    btn.textContent = orig;
    btn.disabled = false;                  // 文字保留 → 可再送
    showToast("送出失敗,等一下再試");
  }
}

async function saveMyName(raw) {
  const myId = getMyId();
  if (!myId) { showToast("先認領身分才能改名"); return; }      // 防呆:沒認領不給改
  const name = (raw || "").trim();
  if (!name) { showToast("名字不能空白"); return; }            // 防呆:空白擋下
  const initials = initialsOf(name);                          // 重算 initials(沿用既有)
  const btn = document.getElementById("settingsSaveName");
  if (btn) btn.disabled = true;
  try {
    await updateDoc(doc(db, "members", myId), { name, initials });
    const me = allMembers.find(m => m.id === myId);            // 本地 cache 同步
    if (me) { me.name = name; me.initials = initials; }
    applyMyIdentity();                                         // nav 頭像即時反映
    showToast("名字改好了");
    document.getElementById("settingsSheet")?.remove();
  } catch (e) {
    console.warn("[settings] 改名失敗:", e && e.message ? e.message : e);
    showToast("改名失敗、請再試");
    if (btn) btn.disabled = false;
  }
}

/* ============================================================
   7. 主流程
   ============================================================ */
async function main() {
  bindBottomNav();
  initPhotoLightbox();   // 照片放大 lightbox(委派、綁一次;首頁/個人頁共用 post-likes.js 同一支)
  document.getElementById("settingsBtn")?.addEventListener("click", openSettings);   // 6-4:齒輪開設定

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
    setupFeedListener(membersMap);   // VC-4:onSnapshot 即時化(取代一次性 getDocs)

  } catch (err) {
    console.error("Firestore 讀取失敗:", err);
    // 連 members 都讀不到 → 顯示提示 + 空 feed
    showToast("連線失敗,請檢查網路");
    renderFeed([]);
  }
}

/* ===== 啟動 ===== */
main();
