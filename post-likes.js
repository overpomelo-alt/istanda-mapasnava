/* ============================================================
   Istanda Mapasnava · post-likes.js
   貼文按讚共用模組(規則 2):首頁(script.js)與個人頁(member.html)的 ❤️ 都用這支,
   toggle 寫入邏輯只在這裡一處。兩頁卡片渲染各自一份(渲染情境不同),但按讚行為共用。
   ============================================================ */
import {
  doc, updateDoc, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

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
