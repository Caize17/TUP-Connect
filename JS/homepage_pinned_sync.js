import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection, query, where,
  onSnapshot, doc, updateDoc,
  arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ─────────────────────────────────────────────
// Firebase — reuse existing app if available
// ─────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            "AIzaSyBpGOdMpx_Mws2EcCq6rbOWfZ-FFuhhfo0",
  authDomain:        "tup-connect-b162d.firebaseapp.com",
  projectId:         "tup-connect-b162d",
  storageBucket:     "tup-connect-b162d.firebasestorage.app",
  messagingSenderId: "193141013544",
  appId:             "1:193141013544:web:72b403e84aa4d3313f091d"
};

const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function timeAgo(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60)        return 'just now';
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
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
  const likes    = (post.likes    || []).length;
  const thumbsup = (post.thumbsup || []).length;
  const reposts  = (post.reposts  || []).length;

  const countLikes    = document.getElementById('count-likes');
  const countThumbsup = document.getElementById('count-thumbsup');
  const countReposts  = document.getElementById('count-reposts');
  if (countLikes)    countLikes.textContent    = fmt(likes);
  if (countThumbsup) countThumbsup.textContent = fmt(thumbsup);
  if (countReposts)  countReposts.textContent  = fmt(reposts);

  // Poster card fields
  const posterOrg      = document.getElementById('poster-org');
  const posterHeadline = document.getElementById('poster-headline');
  const posterSubtext  = document.getElementById('poster-subtext');
  const posterHandle   = document.getElementById('poster-handle');

  if (posterOrg)      posterOrg.textContent      = post.author      || 'TUP USG MANILA';
  if (posterHeadline) posterHeadline.textContent  = post.title       || '';
  if (posterSubtext)  posterSubtext.textContent   = 'OFFICIAL ANNOUNCEMENT';
  if (posterHandle)   posterHandle.textContent    = '@TUPKonek ✉';

  // ── IMAGE COLLAGE — mirrors campus_news.js collage system exactly ──
  // ── IMAGE COLLAGE (ABSOLUTE POSITIONING FIX) ──
  const mediaGrid   = document.getElementById('media-grid');
  const posterInner = document.getElementById('poster-card-inner');
  const imgs        = post.imageURLs || [];

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
    grid.querySelectorAll('.demo-lb-trigger').forEach(cell => {
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
  if (window.__DEMO_PINNED__) return; 
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
  const handlers = {
    'btn-likes':    'likes',
    'btn-thumbsup': 'thumbsup',
    'btn-reposts':  'reposts',
  };

  Object.entries(handlers).forEach(([btnId, field]) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const user = auth.currentUser;
      if (!user)                  { alert('Sign in to react.'); return; }
      if (!currentPinnedPost?.id) return;

      const postRef = doc(db, 'announcements', currentPinnedPost.id);
      const already = (currentPinnedPost[field] || []).includes(user.uid);
      try {
        await updateDoc(postRef, {
          [field]: already ? arrayRemove(user.uid) : arrayUnion(user.uid)
        });
        // onSnapshot on campus_news side will handle the count update there;
        // the homepage listener below handles it here
      } catch (err) {
        console.error('Homepage reaction error:', err);
      }
    });
  });
}

// ─────────────────────────────────────────────
// REAL-TIME LISTENER — watch for pinned post changes
// ─────────────────────────────────────────────

function listenForPinnedAnnouncement() {
  console.log('🔍 listenForPinnedAnnouncement called, __DEMO_PINNED__:', window.__DEMO_PINNED__);
  
  // ── DEMO MODE ──────────────────────────────────────
  if (window.__DEMO_PINNED__) {
  currentPinnedPost = window.__DEMO_PINNED__;
  try {
    populatePinnedCard(currentPinnedPost);
    console.log('✅ populatePinnedCard finished');
  } catch(err) {
    console.error('❌ populatePinnedCard crashed:', err);
  }
  return;
}
  // ── LIVE MODE (unchanged below) ────────────────────
  const q = query(
    collection(db, 'announcements'),
    where('pinned', '==', true)
  );
  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      currentPinnedPost = null;
      showEmptyPinnedCard();
      return;
    }
    const d = snapshot.docs[0];
    currentPinnedPost = { id: d.id, ...d.data() };
    populatePinnedCard(currentPinnedPost);
  }, (err) => {
    console.error('homepage_pinned_sync: listener error', err);
  });
}

// ─────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  listenForPinnedAnnouncement();
  initHomepageReactions();
});