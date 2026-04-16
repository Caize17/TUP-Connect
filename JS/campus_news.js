/**
 * campus_news.js — TUP Konek
 * Student-only view of the Bulletin Board.
 *
 * Changes from previous version:
 *  - Removed all USG/Admin compose & admin control UI
 *  - Added Filter Posts by date (today / week / month / custom range)
 *  - Search works live across title, body, author
 *  - Reactions use homepage style: ❤ Heart, 💬 Comment, 🔁 Repost
 *  - Comment modal wired to each card
 *  - Pinned post synced to/from "announcements" collection (pinned: true)
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection, doc, getDoc,
  addDoc, updateDoc,
  onSnapshot, query, orderBy,
  serverTimestamp, arrayUnion, arrayRemove,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ─────────────────────────────────────────────
// FIREBASE
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
// STATE
// ─────────────────────────────────────────────

let currentUser = null;
let currentUserRole = 'Student';
let currentUserName = null;
let allPosts = [];
let activeFilter = 'all';   // 'all' | 'today' | 'week' | 'month' | 'custom'
let customFrom = null;
let customTo = null;
let activePostId = null;    // for comment modal

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function timeAgo(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function fmt(n) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n || 0);
}

function showToast(msg, dur = 2800) {
  const t = document.getElementById('cn-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), dur);
}

// ─────────────────────────────────────────────
// DATE FILTER
// ─────────────────────────────────────────────

function postDate(post) {
  if (!post.createdAt) return new Date(0);
  return post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
}

function applyDateFilter(posts) {
  if (activeFilter === 'all') return posts;
  const now = new Date();
  const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // start of day

  return posts.filter(p => {
    const d = postDate(p);
    if (activeFilter === 'today') {
      return d >= sod;
    }
    if (activeFilter === 'week') {
      const weekAgo = new Date(sod); weekAgo.setDate(weekAgo.getDate() - 6);
      return d >= weekAgo;
    }
    if (activeFilter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return d >= monthStart;
    }
    if (activeFilter === 'custom' && dpState.fromDate && dpState.toDate) {
      const from = new Date(dpState.fromDate); from.setHours(0, 0, 0, 0);
      const to = new Date(dpState.toDate); to.setHours(23, 59, 59, 999);
      return d >= from && d <= to;
    }
    return true;
  });
}

// ─────────────────────────────────────────────
// SEARCH FILTER
// ─────────────────────────────────────────────

function applySearchFilter(posts, q) {
  if (!q) return posts;
  const lq = q.toLowerCase();
  return posts.filter(p =>
    (p.title || '').toLowerCase().includes(lq) ||
    (p.body || '').toLowerCase().includes(lq) ||
    (p.author || '').toLowerCase().includes(lq)
  );
}

// ─────────────────────────────────────────────
// GET FILTERED POSTS (search + date)
// ─────────────────────────────────────────────

function getFilteredPosts() {
  const q = (document.getElementById('cn-search-input')?.value || '').trim();
  return applySearchFilter(applyDateFilter(allPosts), q);
}

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────

function renderBulletinPage(posts) {
  const uid = currentUser?.uid ?? null;
  const pinnedPost = posts.find(p => p.pinned) ?? null;
  const otherPosts = posts.filter(p => !p.pinned);

  // Pinned slot
  const pinnedSlot = document.getElementById('pinned-post-slot');
  const pinnedLabel = document.getElementById('pinned-label');

  if (pinnedPost && pinnedSlot) {
    if (pinnedLabel) pinnedLabel.style.display = 'flex';
    pinnedSlot.innerHTML = renderPinnedCard(pinnedPost, uid);
    wireViewMore(`pb-body-${pinnedPost.id}`, `pb-viewmore-${pinnedPost.id}`);
  } else {
    if (pinnedLabel) pinnedLabel.style.display = 'none';
    if (pinnedSlot) pinnedSlot.innerHTML = '';
  }

  // Feed
  const feed = document.getElementById('bulletin-feed');
  const emptyState = document.getElementById('bulletin-empty');
  if (!feed) return;

  [...feed.querySelectorAll('.bulletin-card, .cn-no-results')].forEach(c => c.remove());

  if (otherPosts.length === 0 && !pinnedPost) {
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  if (otherPosts.length === 0) {
    feed.insertAdjacentHTML('beforeend',
      `<div class="cn-no-results">No announcements match your search or filter.</div>`);
    return;
  }

  otherPosts.forEach(post => {
    feed.insertAdjacentHTML('beforeend', renderBulletinCard(post, uid));
    wireViewMore(`bc-body-${post.id}`, `bc-viewmore-${post.id}`);
  });

  wireReactionButtons();
  wireCommentButtons();
  wireLightboxTriggers();
}

// ─────────────────────────────────────────────
// HTML BUILDERS
// ─────────────────────────────────────────────

function renderPinnedCard(post, uid) {
  const likeCount = (post.likes || []).length;
  const repostCount = (post.reposts || []).length;
  const commentCount = (post.comments || []).length;
  const iLiked = uid && (post.likes || []).includes(uid);
  const iReposted = uid && (post.reposts || []).includes(uid);
  const bodyHTML = (post.body || '').replace(/\n/g, '<br>');
  const imgs = post.imageURLs || [];
  const hasImages = imgs.length > 0;

  // Shared Collage System
  // Collage Logic: Only show up to 5, then +N overlay
  let photoGrid = '';
  if (hasImages) {
    const count = imgs.length;
    const collageClass = `collage-${Math.min(count, 5)}`;

    // We only show the "See More" overlay if the total count is GREATER than 5
    const extra = count > 5 ? count - 5 : 0;

    photoGrid = `
      <div class="pinned-media-col">
        <div class="pinned-photo-grid ${collageClass}">
          ${imgs.slice(0, 5).map((src, i) => {
      // Check if this is the 5th photo (index 4) AND there are extra photos
      const isLastVisible = i === 4 && extra > 0;

      return `
              <div class="collage-cell lightbox-trigger" data-src="${src}">
                <img src="${src}" />
                ${isLastVisible ? `<div class="photo-more-overlay">+${extra}</div>` : ''}
              </div>`;
    }).join('')}
        </div>
      </div>`;
  }

  return `
    <div class="pinned-post-card" data-id="${post.id}">
      <div class="pushpin"><div class="pin-head"></div><div class="pin-shaft"></div></div>

      <div class="social-bar-wrap">
        <div class="social-bar-outer">
          <div class="social-bar">
            <div class="social-item reaction-item ${iLiked ? 'reacted' : ''}" data-type="likes" data-id="${post.id}">
               <span class="likes-count">${fmt(likeCount)}</span>
               <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <div class="social-item comment-trigger-pinned" data-id="${post.id}">
               <span class="comments-count">${fmt(commentCount)}</span>
               <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div class="social-item reaction-item ${iReposted ? 'reacted' : ''}" data-type="reposts" data-id="${post.id}">
               <span class="reposts-count">${fmt(repostCount)}</span>
               <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div class="pinned-content ${hasImages ? '' : 'no-images'}">
        <div class="pinned-timestamp-top">${timeAgo(post.createdAt)}</div>
        
        <div class="pinned-columns-wrap">
            <div class="pinned-caption-col">
              <div class="pinned-title">${post.title || ''}</div>
              <div class="pinned-body clamped" id="pb-body-${post.id}">${bodyHTML}</div>
              <button class="view-more-btn" id="pb-viewmore-${post.id}">View more ▾</button>
            </div>
            ${photoGrid}
        </div>
      </div>
    </div>`;
}

function renderBulletinCard(post, uid) {
  const likeCount = (post.likes || []).length;
  const repostCount = (post.reposts || []).length;
  const commentCount = (post.comments || []).length;
  const iLiked = uid && (post.likes || []).includes(uid);
  const iReposted = uid && (post.reposts || []).includes(uid);

  const bodyHTML = (post.body || '').replace(/\n/g, '<br>');
  const imgs = post.imageURLs || [];
  const hasImages = imgs.length > 0;

  let photoGrid = '';
  if (hasImages) {
    const count = imgs.length;
    // Always use collage-5 layout for 5+ photos; clamp display to 5 cells
    const collageClass = `collage-${Math.min(count, 5)}`;
    // extra = how many photos are hidden behind the +N overlay on the 5th cell
    // For 6 photos: show 5, overlay says +1. For 7: show 5, overlay says +2. etc.
    const extra = count > 5 ? count - 5 : 0;

    // Always force the 5-column grid via inline style when count >= 5
    // (guards against any CSS cascade issues specific to bulletin-card context)
    const inlineStyle = (count >= 5)
      ? `style="display:grid !important; grid-template-columns:2fr 1fr 1fr !important; grid-template-rows:1fr 1fr !important; gap:4px !important; height:250px !important;"`
      : '';

    photoGrid = `
      <div class="bulletin-media-col">
        <div class="bulletin-photo-grid ${collageClass}" ${inlineStyle}>
          ${imgs.slice(0, 5).map((src, i) => {
      // The +N overlay only goes on the LAST visible cell (index 4) when extras exist
      const isLastVisible = i === 4 && extra > 0;
      // Cell 0 must span both grid rows in a 5-cell collage layout
      const cellStyle = (count >= 5 && i === 0)
        ? `style="grid-column:1/2 !important; grid-row:1/3 !important;"`
        : '';

      return `
              <div class="collage-cell lightbox-trigger" data-src="${src}" ${cellStyle}>
                <img src="${src}" alt="" />
                ${isLastVisible ? `<div class="photo-more-overlay">+${extra}</div>` : ''}
              </div>`;
    }).join('')}
        </div>
      </div>`;
  }

  return `
    <div class="bulletin-card" data-id="${post.id}">
      <div class="bulletin-card-header">
        <div class="bulletin-card-avatar">
          <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div class="bulletin-card-meta-wrap">
          <div class="bulletin-card-author">${post.author || 'Admin'}</div>
          <div class="bulletin-card-time">${timeAgo(post.createdAt)}</div>
        </div>
      </div>

      <div class="bulletin-card-body ${hasImages ? '' : 'no-images'}">
        <div class="bulletin-columns-wrap">
            <div class="bulletin-caption-col">
              <div class="bulletin-card-title">${post.title || ''}</div>
              <div class="bulletin-card-text clamped" id="bc-body-${post.id}">${bodyHTML}</div>
              <button class="view-more-btn" id="bc-viewmore-${post.id}">View more ▾</button>
            </div>
            ${photoGrid}
        </div>
      </div>

      <div class="feed-reactions bulletin-card-reactions">
        <button class="feed-reaction-btn ${iLiked ? 'heart-active' : ''}" data-type="likes" data-id="${post.id}">
          <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span class="likes-count">${fmt(likeCount)}</span> Heart
        </button>
        <button class="feed-reaction-btn cn-comment-trigger" data-id="${post.id}">
          <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span class="comments-count">${fmt(commentCount)}</span> Comments
        </button>
        <button class="feed-reaction-btn ${iReposted ? 'repost-active' : ''}" data-type="reposts" data-id="${post.id}">
          <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          <span class="reposts-count">${fmt(repostCount)}</span> Repost
        </button>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────
// VIEW MORE
// ─────────────────────────────────────────────

function wireViewMore(bodyId, btnId) {
  const body = document.getElementById(bodyId);
  const btn = document.getElementById(btnId);
  if (!body || !btn) return;
  requestAnimationFrame(() => {
    if (body.scrollHeight > body.clientHeight + 4) btn.classList.add('visible');
  });
  let expanded = false;
  btn.addEventListener('click', () => {
    expanded = !expanded;
    body.classList.toggle('clamped', !expanded);
    btn.textContent = expanded ? 'Show less ▴' : 'View more ▾';
  });
}

// ─────────────────────────────────────────────
// REACTION BUTTONS — homepage style with pop messages
// ─────────────────────────────────────────────

const REACTION_MESSAGES = {
  likes: {
    on: ['❤️ Loved it!', '💕 Hearted!', '❤️ You loved this!'],
    off: ['💔 Removed heart', 'Unliked'],
  },
  reposts: {
    on: ['🔁 Reposted!', '🔁 Shared to your feed!', '✅ Reposted successfully!'],
    off: ['↩️ Repost removed', '🔁 Un-reposted', 'Removed from your reposts'],
  },
};

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

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

function wireReactionButtons() {
  // Clone to remove old listeners — pick up both pinned social-item and feed-reaction-btn styles
  document.querySelectorAll('.reaction-item, .feed-reaction-btn:not(.cn-comment-trigger)').forEach(el => {
    const fresh = el.cloneNode(true);
    el.replaceWith(fresh);
    fresh.addEventListener('click', () => handleReaction(fresh));
  });
}

async function handleReaction(el) {
  if (!currentUser) { showToast('Sign in to react.'); return; }
  const postId = el.dataset.id;
  const type = el.dataset.type;
  if (type === 'comments') return; // handled by comment modal

  // Determine active state based on which class system is in use
  const isPinnedBar = el.classList.contains('reaction-item'); // social-bar style
  const already = isPinnedBar ? el.classList.contains('reacted')
    : (type === 'likes' ? el.classList.contains('heart-active')
      : el.classList.contains('repost-active'));

  // Optimistic UI
  if (isPinnedBar) {
    el.classList.toggle('reacted', !already);
  } else if (type === 'likes') {
    el.classList.toggle('heart-active', !already);
    // Trigger heartPop animation by re-cloning svg
    const svg = el.querySelector('svg');
    if (svg && !already) {
      svg.style.animation = 'none';
      void svg.offsetWidth;
      svg.style.animation = '';
    }
  } else {
    el.classList.toggle('repost-active', !already);
    const svg = el.querySelector('svg');
    if (svg && !already) {
      svg.style.animation = 'none';
      void svg.offsetWidth;
      svg.style.animation = '';
    }
  }

  // Optimistic UI Class update
  el.classList.toggle(type + '-active', !already);

  // Only show pop on "on" (hearting/reposting), not on removing
  if (!already) {
    const msgs = REACTION_MESSAGES[type];
    if (msgs) showReactionPop(msgs.on[Math.floor(Math.random() * msgs.on.length)]);
  }

  // Firebase
  try {
    const postRef = doc(db, 'announcements', postId);
    await updateDoc(postRef, {
      [type]: already ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
    });
  } catch (err) {
    console.error('Reaction error:', err);
    showToast('Could not react right now.');
  }
}

// ─────────────────────────────────────────────
// COMMENT MODAL
// ─────────────────────────────────────────────

function wireCommentButtons() {
  document.querySelectorAll('.cn-comment-trigger, .comment-trigger-pinned, .cn-view-comments, .feed-view-comments').forEach(el => {
    const fresh = el.cloneNode(true);
    el.replaceWith(fresh);
    fresh.addEventListener('click', () => {
      const pid = fresh.dataset.id || fresh.dataset.post;
      if (pid) openCommentModal(pid);
    });
  });
}

function openCommentModal(postId) {
  activePostId = postId;
  const overlay = document.getElementById('cn-comment-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  overlay.classList.add('open');
  renderCommentList(postId);
  setTimeout(() => document.getElementById('cn-comment-input-field')?.focus(), 150);
}

function closeCommentModal() {
  const overlay = document.getElementById('cn-comment-modal-overlay');
  overlay?.classList.remove('open');
  overlay?.classList.add('hidden');
  const f = document.getElementById('cn-comment-input-field');
  if (f) f.value = '';
  activePostId = null;
}

function renderCommentList(postId) {
  const post = allPosts.find(p => p.id === postId);
  const list = document.getElementById('cn-comment-list');
  if (!list || !post) return;

  const comments = post.comments || [];
  if (comments.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:40px 20px;font-size:14px;font-weight:600;color:var(--muted);">No comments yet. Be the first!</div>`;
    return;
  }

  // 1. GENERATE HTML
  list.innerHTML = comments.map((c, i) => {
    // Determine if user owns the comment
    const isOwn = c.isOwn || (currentUserName && c.author === currentUserName);

    const avatarHTML = window.getAvatar
      ? window.getAvatar(c.photoURL, c.author)
      : (c.photoURL
        ? `<img src="${c.photoURL}" alt="${c.author}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`);

    // Actions only appear for the owner, matching your screenshot layout
    const actionsHTML = isOwn ? `
      <div class="comment-item-actions">
        <button class="comment-action-btn edit-btn cn-edit-comment-btn" data-idx="${i}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
        <button class="comment-action-btn delete-btn cn-delete-comment-btn" data-idx="${i}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Delete
        </button>
      </div>` : '';

    return `
      <div class="comment-item" id="cn-ci-${i}">
        <div class="comment-item-avatar">
          <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div class="comment-item-content">
          <div class="comment-item-bubble">
            <div class="comment-item-name">${c.author}</div>
            <div class="comment-item-text" id="cn-ct-${i}">${c.text}</div>
          </div>
          <div class="comment-footer">
            <span class="comment-item-time">${c.time || 'Just now'}</span>
            ${actionsHTML}
          </div>
        </div>
      </div>`;
  }).join('');

  // 2. WIRE EDIT BUTTONS
  list.querySelectorAll('.cn-edit-comment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      const c = comments[idx];
      const bubble = document.querySelector(`#cn-ci-${idx} .comment-item-bubble`);
      const footer = document.querySelector(`#cn-ci-${idx} .comment-footer`);

      if (!bubble) return;

      // Transform bubble into edit mode
      bubble.innerHTML = `
        <div class="comment-item-name">${c.author}</div>
        <div class="comment-edit-wrap">
          <input class="comment-edit-input" id="cn-edit-input-${idx}" value="${(c.text || '').replace(/"/g, '&quot;')}" maxlength="500"/>
          <div class="comment-edit-buttons">
            <button class="comment-edit-save" data-idx="${idx}">Save</button>
            <button class="comment-edit-cancel" data-idx="${idx}">Cancel</button>
          </div>
        </div>`;

      if (footer) footer.style.display = 'none'; // Hide time/actions while editing

      const input = document.getElementById(`cn-edit-input-${idx}`);
      input?.focus();

      // Handle Save
      bubble.querySelector('.comment-edit-save')?.addEventListener('click', async () => {
        const newText = input?.value.trim();
        if (!newText) return;

        comments[idx].text = newText;

        // Firebase update
        if (currentUser && c.id) {
          try {
            const { doc: fDoc, updateDoc: fUpdate } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
            const commentRef = fDoc(db, `announcements/${postId}/comments`, c.id);
            await fUpdate(commentRef, { text: newText });
          } catch (err) {
            console.error('Edit error:', err);
          }
        }

        renderCommentList(postId);
        showToast('✏️ Comment updated!');
      });

      // Handle Cancel
      bubble.querySelector('.comment-edit-cancel')?.addEventListener('click', () => {
        renderCommentList(postId);
      });
    });
  });

  // 3. WIRE DELETE BUTTONS
  list.querySelectorAll('.cn-delete-comment-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.dataset.idx);
      const c = comments[idx];

      if (!confirm('Are you sure you want to delete this comment?')) return;

      // Firebase delete
      if (currentUser && c.id) {
        try {
          const { doc: fDoc, deleteDoc: fDelete } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
          await fDelete(fDoc(db, `announcements/${postId}/comments`, c.id));
        } catch (err) {
          console.error('Delete error:', err);
        }
      }

      // Remove locally and refresh
      comments.splice(idx, 1);
      renderCommentList(postId);
      showToast('🗑️ Comment deleted!');
    });
  });
}

function initCommentModal() {
  document.getElementById('cn-comment-modal-close')?.addEventListener('click', closeCommentModal);
  document.getElementById('cn-comment-modal-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('cn-comment-modal-overlay')) closeCommentModal();
  });

  const sendBtn = document.getElementById('cn-comment-send-btn');
  const inputField = document.getElementById('cn-comment-input-field');

  sendBtn?.addEventListener('click', () => submitComment());
  inputField?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); }
  });
}

async function submitComment() {
  if (!currentUser) { showToast('Sign in to comment.'); return; }
  const inputField = document.getElementById('cn-comment-input-field');
  const text = inputField?.value.trim();
  if (!text) return;

  const post = allPosts.find(p => p.id === activePostId);
  if (!post) return;

  // Grab your face from the cache created by comments.js
  const userPhoto = window.cachedPhoto || null;

  const newComment = {
    id: 'c-' + Date.now(),
    author: currentUserName || 'TUPian',
    photoURL: userPhoto, // Show your photo immediately in the UI
    text,
    time: 'just now',
    isOwn: true,
  };

  // Update UI locally
  if (!post.comments) post.comments = [];
  post.comments.push(newComment);
  if (inputField) inputField.value = '';
  renderCommentList(activePostId);
  showToast('💬 Comment posted!');

  // Save to Firebase (skip for demo posts)
  if (!activePostId.startsWith('demo-')) {
    try {
      await addDoc(collection(db, `announcements/${activePostId}/comments`), {
        author: currentUserName,
        authorId: currentUser.uid,
        photoURL: userPhoto, // Save your profile pic URL to the database
        text,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Comment error:', err);
    }
  }
}

// ─────────────────────────────────────────────
// LIGHTBOX
// ─────────────────────────────────────────────

// --- ADD TO YOUR STATE SECTION (Line 50ish) ---
let currentGallery = [];
let currentIndex = 0;

// --- REPLACE THESE FUNCTIONS IN YOUR JS ---

function wireLightboxTriggers() {
  document.querySelectorAll('.lightbox-trigger').forEach(el => {
    // Clone to prevent multiple listeners if re-rendered
    const fresh = el.cloneNode(true);
    el.replaceWith(fresh);

    fresh.addEventListener('click', () => {
      // Find the parent card to get the post ID
      const card = fresh.closest('[data-id]');
      if (!card) return;

      const postId = card.dataset.id;
      const post = allPosts.find(p => p.id === postId);

      if (post && post.imageURLs && post.imageURLs.length > 0) {
        currentGallery = post.imageURLs;
        const clickedSrc = fresh.dataset.src;
        currentIndex = currentGallery.indexOf(clickedSrc);
        if (currentIndex === -1) currentIndex = 0;

        openLightbox();
      }
    });
  });
}

function openLightbox() {
  const lb = document.getElementById('cn-lightbox');
  const lbImg = document.getElementById('cn-lightbox-img');
  const lbCounter = document.getElementById('lb-counter');

  if (lb && lbImg) {
    lbImg.src = currentGallery[currentIndex];
    lb.classList.add('open');
    if (lbCounter) {
      lbCounter.textContent = `${currentIndex + 1} / ${currentGallery.length}`;
    }
  }
}

function initLightbox() {
  // Check if it already exists to avoid duplicates
  if (!document.getElementById('cn-lightbox')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="cn-lightbox">
        <span id="cn-lightbox-close">✕</span>
        <button id="lb-prev" class="lb-nav">❮</button>
        <img id="cn-lightbox-img" src="" alt="Full view"/>
        <button id="lb-next" class="lb-nav">❯</button>
        <div id="lb-counter"></div>
      </div>`);
  }

  const lb = document.getElementById('cn-lightbox');

  // Close triggers
  document.getElementById('cn-lightbox-close')?.addEventListener('click', () => lb.classList.remove('open'));
  lb?.addEventListener('click', e => { if (e.target === lb) lb.classList.remove('open'); });

  // Navigation Logic
  document.getElementById('lb-prev')?.addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex > 0) ? currentIndex - 1 : currentGallery.length - 1;
    openLightbox();
  });

  document.getElementById('lb-next')?.addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex < currentGallery.length - 1) ? currentIndex + 1 : 0;
    openLightbox();
  });
}

// ─────────────────────────────────────────────
// CUSTOM DATE PICKER
// ─────────────────────────────────────────────

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

let dpState = {
  target: 'from',
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),
  fromDate: null,
  toDate: null,
};

function dpFmt(d) {
  if (!d) return '';
  return MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate() + ', ' + d.getFullYear();
}

function dpISOVal(d) {
  if (!d) return '';
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function buildCalendarHTML() {
  const { viewYear, viewMonth, fromDate, toDate } = dpState;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const hdrHTML = DAYS_SHORT.map(d => '<div class="dp-day-hdr">' + d + '</div>').join('');
  let cells = '';
  for (let i = 0; i < firstDay; i++) cells += '<div class="dp-cell dp-cell-empty"></div>';
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(viewYear, viewMonth, day); d.setHours(0, 0, 0, 0);
    const isToday = d.getTime() === today.getTime();
    const isFrom = fromDate && d.getTime() === fromDate.getTime();
    const isTo = toDate && d.getTime() === toDate.getTime();
    const inRange = fromDate && toDate && d > fromDate && d < toDate;
    const cls = ['dp-cell',
      isFrom ? 'dp-cell-from' : '',
      isTo ? 'dp-cell-to' : '',
      inRange ? 'dp-cell-in-range' : '',
      isToday ? 'dp-cell-today' : '',
    ].filter(Boolean).join(' ');
    cells += '<div class="' + cls + '" data-day="' + day + '">' + day + '</div>';
  }

  return '<div class="dp-header">' +
    '<button class="dp-nav" id="dp-prev">&#8249;</button>' +
    '<span class="dp-month-label">' + MONTHS[viewMonth] + ' ' + viewYear + '</span>' +
    '<button class="dp-nav" id="dp-next">&#8250;</button>' +
    '</div>' +
    '<div class="dp-grid-hdr">' + hdrHTML + '</div>' +
    '<div class="dp-grid">' + cells + '</div>';
}

function renderCalendar() {
  const el = document.getElementById('cn-dp-calendar');
  if (el) el.innerHTML = buildCalendarHTML();

  const fromDisp = document.getElementById('cn-dp-from-display');
  const toDisp = document.getElementById('cn-dp-to-display');
  if (fromDisp) fromDisp.textContent = dpFmt(dpState.fromDate) || 'Select date';
  if (toDisp) toDisp.textContent = dpFmt(dpState.toDate) || 'Select date';

  document.getElementById('cn-dp-from-box')?.classList.toggle('dp-box-active', dpState.target === 'from');
  document.getElementById('cn-dp-to-box')?.classList.toggle('dp-box-active', dpState.target === 'to');

  document.getElementById('dp-prev')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dpState.viewMonth--;
    if (dpState.viewMonth < 0) { dpState.viewMonth = 11; dpState.viewYear--; }
    renderCalendar();
  });
  document.getElementById('dp-next')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dpState.viewMonth++;
    if (dpState.viewMonth > 11) { dpState.viewMonth = 0; dpState.viewYear++; }
    renderCalendar();
  });

  document.querySelectorAll('.dp-cell[data-day]').forEach(cell => {
    cell.addEventListener('click', (e) => {
      e.stopPropagation();
      const day = parseInt(cell.dataset.day);
      const chosen = new Date(dpState.viewYear, dpState.viewMonth, day);
      chosen.setHours(0, 0, 0, 0);
      if (dpState.target === 'from') {
        dpState.fromDate = chosen;
        if (dpState.toDate && chosen > dpState.toDate) dpState.toDate = null;
        dpState.target = 'to';
      } else {
        if (dpState.fromDate && chosen < dpState.fromDate) {
          dpState.toDate = dpState.fromDate; dpState.fromDate = chosen;
        } else {
          dpState.toDate = chosen;
        }
        dpState.target = 'from';
      }
      renderCalendar();
    });
  });
}

function injectDatePickerUI() {
  const customDiv = document.getElementById('cn-filter-custom');
  if (!customDiv) return;
  // Always re-render so date picker is fresh every time custom is opened
  customDiv.innerHTML =
    '<div class="dp-inputs-row">' +
    '<div class="dp-box" id="cn-dp-from-box">' +
    '<span class="dp-box-label">FROM</span>' +
    '<span class="dp-box-date" id="cn-dp-from-display">Select date</span>' +
    '</div>' +
    '<div class="dp-arrow">→</div>' +
    '<div class="dp-box" id="cn-dp-to-box">' +
    '<span class="dp-box-label">TO</span>' +
    '<span class="dp-box-date" id="cn-dp-to-display">Select date</span>' +
    '</div>' +
    '</div>' +
    '<div class="dp-calendar-wrap" id="cn-dp-calendar"></div>' +
    '<button class="cn-filter-apply" id="cn-filter-apply">Apply Range</button>';

  document.getElementById('cn-dp-from-box')?.addEventListener('click', (e) => {
    e.stopPropagation(); dpState.target = 'from'; renderCalendar();
  });
  document.getElementById('cn-dp-to-box')?.addEventListener('click', (e) => {
    e.stopPropagation(); dpState.target = 'to'; renderCalendar();
  });
  renderCalendar();

  document.getElementById('cn-filter-apply')?.addEventListener('click', () => {
    if (!dpState.fromDate || !dpState.toDate) { showToast('Please select both a From and To date.'); return; }
    customFrom = dpISOVal(dpState.fromDate);
    customTo = dpISOVal(dpState.toDate);

    // Update the filter button label to show selected range
    const labelEl = document.getElementById('cn-filter-btn')?.querySelector('.cn-filter-label');
    if (labelEl) {
      labelEl.textContent = dpFmt(dpState.fromDate) + ' – ' + dpFmt(dpState.toDate) + ' ✕';
    }

    renderBulletinPage(getFilteredPosts());
    document.getElementById('cn-filter-portal')?.classList.remove('open');
    document.getElementById('cn-filter-btn')?.classList.remove('active');
  });
}

// ─────────────────────────────────────────────
// FILTER UI  — portal-based dropdown
// The portal is appended to <body> so no parent overflow/stacking
// context can ever trap it above the pinned post card.
// ─────────────────────────────────────────────

function buildFilterPortal() {
  if (document.getElementById('cn-filter-portal')) return;

  const portal = document.createElement('div');
  portal.id = 'cn-filter-portal';
  portal.innerHTML = `
    <div class="cn-filter-title">Filter by date</div>
    <div class="cn-filter-options">
      <button class="cn-filter-opt active" data-filter="all">All</button>
      <button class="cn-filter-opt" data-filter="today">Today</button>
      <button class="cn-filter-opt" data-filter="week">This Week</button>
      <button class="cn-filter-opt" data-filter="month">This Month</button>
      <button class="cn-filter-opt" data-filter="custom">Custom Range</button>
    </div>
    <div class="cn-filter-custom hidden" id="cn-filter-custom"></div>
  `;
  document.body.appendChild(portal);
}

function positionPortal(btn) {
  const portal = document.getElementById('cn-filter-portal');
  if (!portal || !btn) return;
  const rect = btn.getBoundingClientRect();
  const portalW = portal.offsetWidth || 320;
  const portalH = portal.offsetHeight || 100;

  // Align right edge of portal with right edge of button
  let left = rect.right - portalW;
  if (left < 8) left = 8;
  if (left + portalW > window.innerWidth - 8) left = window.innerWidth - portalW - 8;

  // Default: drop below button
  let top = rect.bottom + 8;
  // If it would go off the bottom, flip above
  if (top + portalH > window.innerHeight - 8) {
    top = rect.top - portalH - 8;
    if (top < 8) top = 8; // last resort: clamp to top
  }

  portal.style.top = top + 'px';
  portal.style.left = left + 'px';
}

function initFilterUI() {
  buildFilterPortal();

  const filterBtn = document.getElementById('cn-filter-btn');
  const portal = document.getElementById('cn-filter-portal');

  const LABELS = { all: 'Filter Posts', today: 'Today', week: 'This Week', month: 'This Month', custom: 'Custom Range' };

  function openPortal() {
    portal.classList.add('open');
    filterBtn?.classList.add('active');
    // position after display:block so offsetWidth is correct
    requestAnimationFrame(() => positionPortal(filterBtn));
  }

  function closePortal() {
    portal.classList.remove('open');
    filterBtn?.classList.remove('active');
  }

  // Toggle on button click
  filterBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    portal.classList.contains('open') ? closePortal() : openPortal();
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!portal.contains(e.target) && e.target !== filterBtn && !filterBtn?.contains(e.target)) {
      closePortal();
    }
  });

  // Reposition on scroll/resize so it stays glued to the button
  window.addEventListener('resize', () => { if (portal.classList.contains('open')) positionPortal(filterBtn); });
  document.querySelector('.content')?.addEventListener('scroll', () => { if (portal.classList.contains('open')) positionPortal(filterBtn); });

  // Filter option clicks (delegated — portal lives on body)
  portal.addEventListener('click', (e) => {
    const opt = e.target.closest('.cn-filter-opt');
    if (!opt) return;
    e.stopPropagation();

    portal.querySelectorAll('.cn-filter-opt').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    activeFilter = opt.dataset.filter;

    const labelEl = filterBtn?.querySelector('.cn-filter-label');
    if (labelEl) {
      if (activeFilter === 'all') labelEl.textContent = 'Filter Posts';
      else if (activeFilter === 'custom') labelEl.textContent = 'Custom Range…';
      else labelEl.textContent = LABELS[activeFilter] + ' ✕';
    }

    if (activeFilter === 'custom') {
      document.getElementById('cn-filter-custom')?.classList.remove('hidden');
      dpState.fromDate = null;
      dpState.toDate = null;
      dpState.target = 'from';
      dpState.viewYear = new Date().getFullYear();
      dpState.viewMonth = new Date().getMonth();
      injectDatePickerUI();
      // Reposition after calendar expands the portal width/height
      requestAnimationFrame(() => positionPortal(filterBtn));
    } else {
      document.getElementById('cn-filter-custom')?.classList.add('hidden');
      customFrom = null; customTo = null;
      dpState.fromDate = null; dpState.toDate = null;
      renderBulletinPage(getFilteredPosts());
      closePortal();
    }
  });
}

// ─────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────

function initSearch() {
  const input = document.getElementById('cn-search-input');
  if (!input) return;
  input.addEventListener('input', () => renderBulletinPage(getFilteredPosts()));
}

// ─────────────────────────────────────────────
// SIDE TABS
// ─────────────────────────────────────────────

function initSideTabs() {
  const tabs = document.querySelectorAll('.side-tab');
  const sections = {
    org: document.getElementById('section-org'),
    bulletin: document.getElementById('section-bulletin'),
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.section;
      Object.entries(sections).forEach(([key, el]) => {
        if (el) el.classList.toggle('hidden', key !== target);
      });
    });
  });

  sections.bulletin?.classList.remove('hidden');
  sections.org?.classList.add('hidden');
  document.getElementById('tab-bulletin')?.classList.add('active');
  document.getElementById('tab-org')?.classList.remove('active');
}

function initOrgTabs() {
  document.querySelectorAll('.org-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.org-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

// ─────────────────────────────────────────────
// RIGHT PANEL
// ─────────────────────────────────────────────

function initRightPanel() {
  document.getElementById('cn-btn-settings')?.addEventListener('click', () => {
    window.location.href = '../pages/settings.html';
  });
  document.getElementById('cn-btn-logout')?.addEventListener('click', async () => {
    try { await auth.signOut(); window.location.href = '../pages/login.html'; }
    catch (err) { console.error('Logout error:', err); }
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists()) return;
      const data = snap.data();
      const nameEl = document.getElementById('cn-profile-name');
      const emailEl = document.getElementById('cn-profile-email');
      const idEl = document.getElementById('cn-profile-id');
      const photoWrap = document.getElementById('cn-profile-photo-wrap');
      if (nameEl) nameEl.textContent = data.fullName || user.displayName || '';
      if (emailEl) emailEl.textContent = data.email || user.email || '';
      const tupId = data.studentID || data.studentId || data.tupId || data.idNumber || '';
      if (idEl) idEl.textContent = tupId || '—';
      if (photoWrap && data.photoURL) {
        photoWrap.innerHTML = `<img src="${data.photoURL}" alt="Profile photo" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`;
      }
    } catch (err) { console.error('Right panel profile error:', err); }
  });
}

// ─────────────────────────────────────────────
// AUTH + FIREBASE LISTENER
// ─────────────────────────────────────────────

function initAuth() {
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          currentUserRole = data.role || 'Student';
          currentUserName = data.fullName || user.displayName || 'TUPian';

          // CRITICAL: Push the photo into the global cache and update the UI
          window.cachedPhoto = data.photoURL || data.photoSrc || null;
          if (window.updateModalInputAvatar) {
            window.updateModalInputAvatar();
          }
        }
      } catch (err) {
        console.error("Auth sync error:", err);
      }
    }
  });
}

function listenToAnnouncements() {
  const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
  onSnapshot(q, (snapshot) => {
    const changes = snapshot.docChanges();
    const feed = document.getElementById('feed');
    const isFirstLoad = !feed || !feed.querySelector('.bulletin-card');

    // Optimization: If NOT the first load and only modifications happened (likes/reposts/comments)
    // we update the UI elements in-place to prevent the "flicker".
    if (!isFirstLoad && changes.length > 0 && changes.every(c => c.type === 'modified')) {
      changes.forEach(change => {
        updateAnnouncementUI(change.doc.id, change.doc.data());
      });
      // Also update the global state
      allPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      return;
    }

    // Otherwise, do a full render for added/removed/initial
    allPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderBulletinPage(getFilteredPosts());
  }, (err) => {
    console.warn('campus_news: Firestore not available.', err);
    allPosts = [];
    renderBulletinPage(getFilteredPosts());
  });
}

/**
 * Updates an announcement card's counts and active states in-place.
 */
function updateAnnouncementUI(id, data) {
  const card = document.querySelector(`.bulletin-card[data-id="${id}"]`);
  if (!card) return;

  const currentUid = auth.currentUser?.uid;

  // 1. Update Likes
  const likedBy = data.likedBy || [];
  const isLikedByMe = currentUid && likedBy.includes(currentUid);
  const likeBtn = card.querySelector('.feed-reaction-btn[data-type="like"]');
  if (likeBtn) {
    likeBtn.classList.toggle('heart-active', isLikedByMe);
    const countSpan = likeBtn.querySelector('.likes-count');
    if (countSpan) countSpan.textContent = fmt(likedBy.length);
  }

  // 2. Update Comments
  const commentsCount = data.commentsCount || 0;
  const commentBtn = card.querySelector('.feed-reaction-btn[data-type="comment"]');
  if (commentBtn) {
    const countSpan = commentBtn.querySelector('.comments-count');
    if (countSpan) countSpan.textContent = fmt(commentsCount);
  }

  // 3. Update Reposts
  const repostedBy = data.repostedBy || [];
  const isRepostedByMe = currentUid && repostedBy.includes(currentUid);
  const repostBtn = card.querySelector('.feed-reaction-btn[data-type="repost"]');
  if (repostBtn) {
    repostBtn.classList.toggle('repost-active', isRepostedByMe);
    const countSpan = repostBtn.querySelector('.reposts-count');
    if (countSpan) countSpan.textContent = fmt(repostedBy.length);
  }
}

// ─────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initSideTabs();
  initOrgTabs();
  initCommentModal();
  initLightbox();
  initRightPanel();
  initSearch();
  initFilterUI();
  listenToAnnouncements();
});