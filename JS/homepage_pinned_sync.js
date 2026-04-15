/**
 * homepage_pinned_sync.js — TUP Konek
 *
 * Reads the pinned announcement from Firestore
 * and populates the existing homepage pinned card.
 *
 * HOW TO USE:
 *   Add ONE line at the bottom of homepage.html,
 *   after all other <script> tags:
 *
 *     <script type="module" src="../JS/homepage_pinned_sync.js"></script>
 *
 * That's it. No changes needed to homepage.html,
 * homepage.js, or any other existing file.
 */

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

  // If post has images, replace the poster card with the first image
  const mediaGrid   = document.getElementById('media-grid');
  const posterInner = document.getElementById('poster-card-inner');
  if (post.imageURLs?.length > 0 && mediaGrid && posterInner) {
    posterInner.style.display = 'none';
    // Remove any previously injected image
    mediaGrid.querySelectorAll('.hp-pinned-img').forEach(i => i.remove());
    const img = document.createElement('img');
    img.src       = post.imageURLs[0];
    img.className = 'hp-pinned-img';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:10px;';
    mediaGrid.appendChild(img);
  } else if (posterInner) {
    posterInner.style.display = '';
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
    // Take the first (should only ever be one pinned)
    const d    = snapshot.docs[0];
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