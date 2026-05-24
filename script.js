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
      // 跳轉到該成員的個人頁面 (member.html 由 Claude Code 建立中)
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
   5. 渲染「家族動態」貼文
   ============================================================ */
async function renderFeed(posts) {
  const section = document.getElementById("feedSection");
  section.innerHTML = "";

  if (!posts || posts.length === 0) {
    section.innerHTML = `
      <div class="feed-loading">
        還沒有家族記事 ☘️<br/>
        <span style="font-size:12px; color:var(--text-muted); margin-top:8px; display:inline-block;">
          按下方錄音鍵,留下第一段給家人的話
        </span>
      </div>`;
    return;
  }

  posts.forEach(p => section.appendChild(createPostCard(p)));
}

function createPostCard(post) {
  const article = document.createElement("article");
  article.className = "post";

  article.innerHTML = `
    <header class="post__header">
      <div class="post__user">
        <div class="post__avatar-ring">
          <div class="post__avatar-inner">
            <div class="post__avatar">${post.authorInitials || "??"}</div>
          </div>
        </div>
        <div class="post__meta">
          <span class="post__name">${post.authorName || ""}</span>
          ${post.location ? `<span class="post__location">${post.location}</span>` : ""}
        </div>
      </div>
      <button class="icon-btn" aria-label="更多">
        <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
      </button>
    </header>

    <div class="post__media">
      ${renderMedia(post)}
      <div class="heart-burst">
        <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4 4.5 8-2.5 4.5-9.5 9-9.5 9z"/></svg>
      </div>
    </div>

    <div class="post__actions">
      <div class="post__actions-left">
        <button class="action-btn js-like" aria-label="按讚">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
            <path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4 4.5 8-2.5 4.5-9.5 9-9.5 9z"/>
          </svg>
        </button>
        <button class="action-btn" aria-label="留言">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
        </button>
        <button class="action-btn" aria-label="分享到 LINE">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <button class="action-btn js-save" aria-label="收藏">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    </div>

    <div class="post__body">
      <div class="post__likes">${formatCount(post.likes || 0)} 個讚</div>
      <p class="post__caption">
        <span class="post__caption-author">${post.authorName || ""}</span>
        <span>${post.caption || ""}</span>
      </p>
      ${(post.comments || 0) > 0 ? `<button class="post__comments-link">查看全部 ${post.comments} 則留言</button>` : ""}
      <p class="post__time">${post.timeAgo || "剛剛"}</p>
    </div>
  `;

  /* ===== 互動邏輯 ===== */
  let likes = post.likes || 0;
  let isLiked = false;
  let isSaved = false;

  const likeBtn = article.querySelector(".js-like");
  const saveBtn = article.querySelector(".js-save");
  const mediaEl = article.querySelector(".post__media");
  const burstEl = article.querySelector(".heart-burst");
  const likesEl = article.querySelector(".post__likes");

  function toggleLike(forceTrue = false) {
    const newState = forceTrue ? true : !isLiked;
    if (newState === isLiked) return;
    isLiked = newState;
    likes += isLiked ? 1 : -1;
    likesEl.textContent = `${formatCount(likes)} 個讚`;
    likeBtn.classList.toggle("action-btn--liked", isLiked);
    // TODO: Task 3 寫入 Firestore
  }

  likeBtn.addEventListener("click", () => toggleLike());

  saveBtn.addEventListener("click", () => {
    isSaved = !isSaved;
    saveBtn.classList.toggle("action-btn--saved", isSaved);
  });

  // 雙擊愛心(行動裝置友善)
  let lastTap = 0;
  mediaEl.addEventListener("click", () => {
    const now = Date.now();
    if (now - lastTap < 350) {
      toggleLike(true);
      burstEl.classList.remove("is-burst");
      void burstEl.offsetWidth;
      burstEl.classList.add("is-burst");
    }
    lastTap = now;
  });

  return article;
}

function renderMedia(post) {
  if (post.googleDriveFileId) {
    return `<iframe
              src="https://drive.google.com/file/d/${post.googleDriveFileId}/preview"
              allow="autoplay"
              allowfullscreen></iframe>`;
  }
  if (post.image) {
    return `<img src="${post.image}" alt="${post.authorName} 的記事" loading="lazy"/>`;
  }
  // 沒有媒體 = 純語音記事 → 顯示文字卡
  return `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:24px;text-align:center;background:linear-gradient(135deg,#2a2a2a,#1a1a1a);">
      <span style="font-size:18px;line-height:1.6;color:var(--text);">${post.caption || ""}</span>
    </div>`;
}

function formatCount(n) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)} 萬`;
  if (n >= 1000)  return `${(n / 1000).toFixed(1)}K`;
  return String(n);
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

    // 抓貼文 (Firestore posts collection)
    // ⚠️ v0 placeholder:posts collection 不存在於任何 spec、是 v0 留下的假資料源。
    //   Task 5(6/2-6/8)會把 source 切到 recordings collection、屆時這段刪除。
    //   詳見 specs/task-recording-core.md「🔁 posts → recordings 遷移計畫」章節。
    try {
      const postsSnap = await getDocs(
        query(collection(db, "posts"), orderBy("createdAt", "desc"))
      );
      const posts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderFeed(posts);
    } catch (err) {
      // posts collection 還不存在 → empty state
      renderFeed([]);
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
