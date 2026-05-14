import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection, query, where, getDocs,
  onSnapshot, doc, updateDoc, deleteDoc,
  arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ─────────────────────────────────────────────
// Firebase — reuse existing app if available
// ─────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyBpGOdMpx_Mws2EcCq6rbOWfZ-FFuhhfo0",
  authDomain: "tup-connect-b162d.firebaseapp.com",
  projectId: "tup-connect-b162d",
  storageBucket: "tup-connect-b162d.firebasestorage.app",
  messagingSenderId: "193141013544",
  appId: "1:193141013544:web:72b403e84aa4d3313f091d"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function timeAgo(ts) {
  if (!ts) return '';
  let date;
  if (ts.toDate) {
    date = ts.toDate();
  } else if (ts.seconds) {
    // Handle Firestore objects from JSON cache
    date = new Date(ts.seconds * 1000);
  } else {
    date = new Date(ts);
  }

  if (isNaN(date.getTime())) return 'Just now';
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'JUST NOW';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`.toUpperCase();
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`.toUpperCase();
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`.toUpperCase();
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }).toUpperCase();
}

function fmt(n) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
}

// ─────────────────────────────────────────────
// POPULATE HOMEPAGE PINNED CARD
// ─────────────────────────────────────────────

function populatePinnedCard(post) {
  // Title
  const titleEl = document.getElementById('post-title');
  if (titleEl) titleEl.textContent = post.title || '';

  // Body
  const bodyEl = document.getElementById('post-body');
  if (bodyEl) {
    bodyEl.innerHTML = (post.body || '').replace(/\n/g, '<br>');
    bodyEl.classList.add('is-clamped');
  }

  // Timestamp
  const tsEl = document.getElementById('post-timestamp');
  if (tsEl) tsEl.textContent = timeAgo(post.createdAt);

  // Reaction counts
  const likes = (post.likes || []).length;
  const comments = (post.comments || []).length;
  const reposts = (post.reposts || []).length;

  const lEl = document.getElementById('count-likes');
  const cEl = document.getElementById('count-comments');
  const rEl = document.getElementById('count-reposts');

  const likesArr = post.likes || [];
  const iLiked = auth.currentUser && likesArr.includes(auth.currentUser.uid);

  if (lEl) {
    lEl.textContent = fmt(likesArr.length);
    const likeBtn = document.getElementById('btn-likes');
    if (likeBtn) likeBtn.classList.toggle('reacted', iLiked);
  }

  const repostsArr = post.reposts || [];
  const iReposted = auth.currentUser && repostsArr.includes(auth.currentUser.uid);

  if (cEl) cEl.textContent = fmt(comments);
  if (rEl) {
    rEl.textContent = fmt(repostsArr.length);
    const repostBtn = document.getElementById('btn-reposts');
    if (repostBtn) repostBtn.classList.toggle('reacted', iReposted);
  }

  // Poster card fields
  const posterOrg = document.getElementById('poster-org');
  const posterHeadline = document.getElementById('poster-headline');
  const posterSubtext = document.getElementById('poster-subtext');
  const posterHandle = document.getElementById('poster-handle');

  if (posterOrg) posterOrg.textContent = post.author || 'TUP USG MANILA';
  if (posterHeadline) posterHeadline.textContent = post.title || '';
  if (posterSubtext) posterSubtext.textContent = 'OFFICIAL ANNOUNCEMENT';
  if (posterHandle) posterHandle.textContent = '@TUPKonek ✉';

  // ── IMAGE COLLAGE — mirrors campus_news.js collage system exactly ──
  // ── IMAGE COLLAGE (ABSOLUTE POSITIONING FIX) ──
  const mediaGrid = document.getElementById('media-grid');
  const posterInner = document.getElementById('poster-card-inner');
  const imgs = post.imageURLs || [];

  if (mediaGrid) mediaGrid.innerHTML = '';

  if (imgs.length > 0 && mediaGrid) {
    if (posterInner) posterInner.style.display = 'none';

    const count = imgs.length;
    const clampedCount = Math.min(count, 5);
    const extra = count > 5 ? count - 5 : 0;

    // 1. Build the grid container with inline styles
    let gridHtml = `<div class="pinned-photo-grid collage-${clampedCount}" style="display: grid !important; height: 250px !important; gap: 4px !important; width: 100% !important;`;

    if (clampedCount === 1) gridHtml += ` grid-template-columns: 1fr !important; grid-template-rows: 1fr !important;">`;
    else if (clampedCount === 2) gridHtml += ` grid-template-columns: 1fr 1fr !important; grid-template-rows: 1fr !important;">`;
    else if (clampedCount === 3 || clampedCount === 4) gridHtml += ` grid-template-columns: 1fr 1fr !important; grid-template-rows: 1fr 1fr !important;">`;
    else gridHtml += ` grid-template-columns: 2fr 1fr 1fr !important; grid-template-rows: 1fr 1fr !important;">`;

    // 2. Build the cells
    const cellsHtml = imgs.slice(0, 5).map((src, i) => {
      // min-height: 0 stops the grid from expanding past its bounds
      let cellStyle = "position: relative !important; overflow: hidden !important; min-width: 0 !important; min-height: 0 !important; width: 100% !important; height: 100% !important;";

      // Span the first column for 5-layout
      if (clampedCount >= 5 && i === 0) {
        cellStyle += " grid-column: 1 / 2 !important; grid-row: 1 / 3 !important;";
      } else if (clampedCount === 3 && i === 0) {
        cellStyle += " grid-row: 1 / 3 !important;";
      }

      const isLastVisible = i === 4 && extra > 0;
      const overlayHtml = isLastVisible
        ? `<div class="photo-more-overlay" style="position: absolute !important; inset: 0 !important; background: rgba(0,0,0,0.6) !important; display: flex !important; align-items: center !important; justify-content: center !important; color: #fff !important; font-size: 17px !important; font-weight: 600 !important; z-index: 2 !important; pointer-events: none !important;">+${extra}</div>`
        : '';

      // CRITICAL: The img uses absolute positioning so it perfectly covers the cell without dictating its height
      return `
        <div class="collage-cell demo-lb-trigger" data-src="${src}" style="${cellStyle}">
          <img src="${src}" alt="post image" style="position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important;" />
          ${overlayHtml}
        </div>`;
    }).join('');

    mediaGrid.innerHTML = gridHtml + cellsHtml + `</div>`;

    // 3. Lightbox wiring
    mediaGrid.querySelectorAll('.demo-lb-trigger').forEach(cell => {
      cell.addEventListener('click', () => {
        if (window.openGallery) window.openGallery(imgs, cell.dataset.src);
      });
    });

  } else {
    if (posterInner) posterInner.style.display = '';
  }

  // "View more" toggle
  if (bodyEl) {
    requestAnimationFrame(() => {
      const viewMoreBtn = document.getElementById('view-more-btn');
      if (viewMoreBtn && bodyEl.scrollHeight > bodyEl.clientHeight + 4) {
        viewMoreBtn.classList.add('visible');
        let expanded = false;
        // Replace to avoid double-binding on re-renders
        const fresh = viewMoreBtn.cloneNode(true);
        viewMoreBtn.replaceWith(fresh);
        fresh.classList.add('visible');
        fresh.addEventListener('click', () => {
          expanded = !expanded;
          bodyEl.classList.toggle('is-clamped', !expanded);
          fresh.textContent = expanded ? 'View less ▴' : 'View more ▾';
        });
      }
    });
  }
}

function showEmptyPinnedCard() {
  const annCard = document.getElementById('ann-card');
  if (annCard) {
    annCard.innerHTML = `
      <div class="pinned-empty" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:40px 20px;color:#9b7070;">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <div style="font-size:13px;font-weight:600;">No pinned announcement yet</div>
      </div>`;
  }
}

// ─────────────────────────────────────────────
// REACTION SYNC — homepage buttons → Firestore
// ─────────────────────────────────────────────

let currentPinnedPost = null;

function initHomepageReactions() {
  const annCard = document.getElementById('ann-card');
  if (!annCard) return;

  annCard.addEventListener('click', async (e) => {
    if (!currentPinnedPost?.id) return;
    const user = auth.currentUser;

    // 1. Heart (Like) Reaction
    const likeBtn = e.target.closest('#btn-likes');
    if (likeBtn) {
      if (!user) { window.showToast('Sign in to react.', 'warning'); return; }
      const postId = currentPinnedPost.id;
      const likes = currentPinnedPost.likes || [];
      const already = likes.includes(user.uid);
      const postRef = doc(db, 'announcements', postId);

      try {
        await updateDoc(postRef, {
          likes: already ? arrayRemove(user.uid) : arrayUnion(user.uid)
        });
      } catch (err) { console.error("Heart error:", err); }
      return;
    }

    // 2. Comment Trigger
    const commentBtn = e.target.closest('#btn-comments');
    if (commentBtn) {
      if (window.openCommentModalPinned) {
        window.openCommentModalPinned(currentPinnedPost.id);
      }
      return;
    }

    // 3. Repost Trigger
    const repostBtn = e.target.closest('#btn-reposts');
    if (repostBtn) {
      if (!user) { window.showToast('Sign in to repost.', 'warning'); return; }
      
      const postId = currentPinnedPost.id;
      const repostsArr = currentPinnedPost.reposts || [];
      const already = repostsArr.includes(user.uid);

      if (!already) {
        if (window.openRepostModalHP) {
          const postToRepost = {
            ...currentPinnedPost,
            time: timeAgo(currentPinnedPost.createdAt)
          };
          window.openRepostModalHP(postToRepost, 'announcements');
        }
      } else {
        // UN-REPOST Logic
        window.showConfirm({
          title: "🗑️ Remove this repost?",
          confirmText: "Remove",
          onConfirm: async () => {
            try {
              // 1. Delete the post document
              const q = query(collection(db, 'posts'), where('repostOf', '==', postId), where('userId', '==', user.uid));
              const snap = await getDocs(q);
              const delPromises = snap.docs.map(d => deleteDoc(doc(db, 'posts', d.id)));
              await Promise.all(delPromises);

              // 2. Update the announcement reposts array (don't block on this)
              try {
                await updateDoc(doc(db, 'announcements', postId), {
                  reposts: arrayRemove(user.uid)
                });
              } catch (annErr) {
                console.warn("Could not update announcement repost count (permission restricted):", annErr);
              }

              window.showToast("Repost removed.", "success");
            } catch (err) {
              console.error("Un-repost error:", err);
              window.showToast("Failed to remove repost.", "error");
            }
          }
        });
      }
      return;
    }
  });

  // Helper for reaction feedback
  let reactionPopEl = null;
  function showReactionPop(msg) {
    if (!reactionPopEl) {
      reactionPopEl = document.createElement('div');
      reactionPopEl.className = 'reaction-pop';
      document.body.appendChild(reactionPopEl);
    }
    reactionPopEl.textContent = msg;
    reactionPopEl.classList.add('show');
    clearTimeout(reactionPopEl._tid);
    reactionPopEl._tid = setTimeout(() => reactionPopEl.classList.remove('show'), 2000);
  }
}

// ─────────────────────────────────────────────
// REAL-TIME LISTENER — watch for pinned post changes
// ─────────────────────────────────────────────

function listenForPinnedAnnouncement() {
  const q = query(
    collection(db, 'announcements'),
    where('pinned', '==', true)
  );
  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      currentPinnedPost = null;
      localStorage.removeItem('tup_pinned_cache');
      showEmptyPinnedCard();
      return;
    }
    const d = snapshot.docs[0];
    currentPinnedPost = { id: d.id, ...d.data() };

    // Cache for flicker-free load next time
    localStorage.setItem('tup_pinned_cache', JSON.stringify(currentPinnedPost));

    populatePinnedCard(currentPinnedPost);
  }, (err) => {
    console.error('homepage_pinned_sync: listener error', err);
  });
}

// ─────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────

function boot() {
  // 1. Immediate cache load to prevent flicker
  const cache = localStorage.getItem('tup_pinned_cache');
  if (cache) {
    try {
      const cachedPost = JSON.parse(cache);
      currentPinnedPost = cachedPost;
      populatePinnedCard(cachedPost);
    } catch (e) {
      console.error("Pinned cache error", e);
    }
  }

  listenForPinnedAnnouncement();
  initHomepageReactions();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}