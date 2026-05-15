import { auth, db } from "../firebaseConfig.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection, doc, getDoc,
  addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, where,
  serverTimestamp, arrayUnion, arrayRemove,
  getDocs, increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { CONFIG } from "./config.js";

const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  systemInstruction: `You are Tupee, the AI assistant for TUP Connect. 
  Address students as 'TUPian' and use a friendly, helpful, and slightly witty Taglish tone.

  FORMATTING RULES:
  1. Use **bold text** for important names, offices, or keywords.
  2. Use bullet points (using * or -) for lists (like organizations or requirements).
  3. Use new lines/spacing to separate paragraphs.
  
  CRITICAL RULE: If a user asks for the official TUP Mission, Vision, or Core Values, provide the English text EXACTLY as written in the data below. Do not translate or summarize official university statements.
  
  UNIVERSITY KNOWLEDGE BASE:
  ${JSON.stringify([
    { "topic": "about tup", "content": "The Technological University of the Philippines (TUP) is a state university specializing in engineering, technology, and technical education." },
    { "topic": "tup manila campus", "content": "TUP Manila is the main campus of the Technological University of the Philippines located in Ermita, Manila." },
    { "topic": "location of tup", "content": "The Technological University of the Philippines – Manila is located at Ayala Blvd., corner San Marcelino St., Ermita, Manila, 1000 Metro Manila, Philippines" },
    { "topic": "tup history", "content": "The Technological University of the Philippines started in 1901 as the Manila Trade School. It later became the Philippine School of Arts and Trades and then the Philippine College of Arts and Trades before becoming TUP in 1978..." },
    { "topic": "tup type", "content": "The Technological University of the Philippines is a public state university funded by the Philippine government." },
    { "topic": "tup campuses", "content": "The Technological University of the Philippines system has campuses in Manila, Taguig, Cavite, and Visayas." },
    { "topic": "tup mission", "content": "TUP MISSION: The University shall provide higher and advanced vocational..." },
    { "topic": "tup vision", "content": "TUP VISION: A premier state university with recognized excellence in engineering and technology education..." },
    { "topic": "tup core values", "content": "CORE VALUES: Transparent, Unity, Professionalism, Integrity, Accountability, Nationalism, Shared responsibility." },
    { "topic": "college of engineering", "content": "Offers BS in Civil, Electrical, Mechanical, and Electronics Engineering." },
    { "topic": "college of science", "content": "Offers BS in Computer Science, Information Technology, Information Systems, Laboratory Technology, and Environmental Science." },
    { "topic": "college of industrial technology", "content": "Offers various Engineering Technology and Technology programs." },
    { "topic": "college of architecture and fine arts", "content": "Offers BS Architecture, Fine Arts, and Graphics Technology." },
    { "topic": "college of industrial education", "content": "Offers Technical-Vocational Teacher Education programs." },
    { "topic": "college of liberal arts", "content": "Offers Management, Entrepreneurship, and Hospitality Management." },
    { "topic": "student organizations", "content": "Includes various academic and non-academic organizations like COMPASS, GDGoC, TUP GEAR, etc." },
    { "topic": "tup enrollment", "content": "Process involves profiling, enlistment, assessment, and registration confirmation." }
  ])}`
});

// Standardized Firebase initialization moved to top

let currentUser = null;
let currentUserRole = 'Student';
let currentUserName = null;
let allPosts = [];
let allOrgPosts = [];
let activeSection = 'bulletin'; 
let activeFilter = 'all'; 
let orgFilter = 'my'; 
let currentUserCollege = null;
let currentUserPhoto = null;
let dpState = { fromDate: null, toDate: null, target: 'from', viewYear: new Date().getFullYear(), viewMonth: new Date().getMonth() };
let customFrom = null;
let customTo = null;
let activePostId = null;
let activeCollection = 'posts';

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


// Global hidden utility
const style = document.createElement('style');
style.textContent = '.hidden { display: none !important; }';
document.head.appendChild(style);

function postDate(post) {
  if (!post.createdAt) return new Date(0);
  return post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
}

function applyDateFilter(posts) {
  if (activeFilter === 'all') return posts;
  const now = new Date();
  const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return posts.filter(p => {
    const d = postDate(p);
    if (activeFilter === 'today') return d >= sod;
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

function applySearchFilter(posts, q) {
  if (!q) return posts;
  const lq = q.toLowerCase();
  return posts.filter(p =>
    (p.title || '').toLowerCase().includes(lq) ||
    (p.body || '').toLowerCase().includes(lq) ||
    (p.author || '').toLowerCase().includes(lq)
  );
}

function getFilteredPosts() {
  const q = (document.getElementById('cn-search-input')?.value || '').trim();
  return applySearchFilter(applyDateFilter(allPosts), q);
}

function renderBulletinPage(posts) {
  const uid = currentUser?.uid ?? null;
  const pinnedPost = posts.find(p => p.pinned) ?? null;
  const otherPosts = posts.filter(p => !p.pinned);

  const pinnedSlot = document.getElementById('pinned-post-slot');
  const pinnedLabel = document.getElementById('pinned-label');

  if (pinnedPost && pinnedSlot) {
    if (pinnedLabel) pinnedLabel.style.display = 'flex';
    pinnedSlot.innerHTML = renderPinnedCard(pinnedPost, uid);
    wireViewMore(`pb-body-${pinnedPost.id}`, `pb-viewmore-${pinnedPost.id}`);
    wireReactionButtons();
    wireCommentButtons();
    wireLightboxTriggers();
  } else {
    if (pinnedLabel) pinnedLabel.style.display = 'none';
    if (pinnedSlot) pinnedSlot.innerHTML = '';
  }

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
    feed.insertAdjacentHTML('beforeend', `<div class="cn-no-results">No announcements match your search or filter.</div>`);
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

function renderPinnedCard(post, uid) {
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
    const clampedCount = Math.min(count, 5);
    const extra = count > 5 ? count - 5 : 0;
    let gridStyle = "display: grid !important; height: 250px !important; gap: 4px !important; width: 100% !important;";
    if (clampedCount === 1) gridStyle += " grid-template-columns: 1fr !important;";
    else if (clampedCount === 2) gridStyle += " grid-template-columns: 1fr 1fr !important;";
    else if (clampedCount === 3 || clampedCount === 4) gridStyle += " grid-template-columns: 1fr 1fr !important; grid-template-rows: 1fr 1fr !important;";
    else gridStyle += " grid-template-columns: 2fr 1fr 1fr !important; grid-template-rows: 1fr 1fr !important;";

    const cells = imgs.slice(0, 5).map((src, i) => {
      let cellStyle = "position: relative !important; overflow: hidden !important; width: 100% !important; height: 100% !important;";
      if (clampedCount >= 5 && i === 0) cellStyle += " grid-column: 1 / 2 !important; grid-row: 1 / 3 !important;";
      else if (clampedCount === 3 && i === 0) cellStyle += " grid-row: 1 / 3 !important;";
      const isLastVisible = i === 4 && extra > 0;
      return `<div class="collage-cell lightbox-trigger" data-src="${src}" style="${cellStyle}">
                <img src="${src}" alt="post image" style="position: absolute !important; width: 100% !important; height: 100% !important; object-fit: cover !important;" />
                ${isLastVisible ? `<div class="photo-more-overlay">+${extra}</div>` : ''}
              </div>`;
    }).join('');
    photoGrid = `<div class="pinned-media-col"><div class="pinned-photo-grid" style="${gridStyle}">${cells}</div></div>`;
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
            <div class="social-divider"></div>
            <div class="social-item comment-trigger-pinned" data-id="${post.id}">
               <span class="comments-count">${fmt(commentCount)}</span>
               <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div class="social-divider"></div>
            <div class="social-item reaction-item cn-repost-trigger ${iReposted ? 'reacted' : ''}" data-type="reposts" data-id="${post.id}">
               <span class="reposts-count">${fmt(repostCount)}</span>
               <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            </div>
          </div>
        </div>
      </div>
      <div class="pinned-content ${hasImages ? '' : 'no-images'}">
        <div class="pinned-timestamp-top">${timeAgo(post.createdAt).toUpperCase()}</div>
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
    const extra = count > 5 ? count - 5 : 0;
    const inlineStyle = (count >= 5) ? `style="display:grid !important; grid-template-columns:2fr 1fr 1fr !important; grid-template-rows:1fr 1fr !important; gap:4px !important; height:250px !important;"` : '';
    photoGrid = `
      <div class="bulletin-media-col">
        <div class="bulletin-photo-grid collage-${Math.min(count, 5)}" ${inlineStyle}>
          ${imgs.slice(0, 5).map((src, i) => {
            const isLastVisible = i === 4 && extra > 0;
            const cellStyle = (count >= 5 && i === 0) ? `style="grid-column:1/2 !important; grid-row:1/3 !important;"` : '';
            return `<div class="collage-cell lightbox-trigger" data-src="${src}" ${cellStyle}>
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
          ${post.photoURL ? `<img src="${post.photoURL}" alt="" style="width:100%; height:100%; object-fit:cover; border-radius:50%; image-rendering:high-quality;" />` : `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`}
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

function wireViewMore(bodyId, btnId) {
  const body = document.getElementById(bodyId);
  const btn = document.getElementById(btnId);
  if (!body || !btn) return;
  requestAnimationFrame(() => { if (body.scrollHeight > body.clientHeight + 4) btn.classList.add('visible'); });
  let expanded = false;
  btn.addEventListener('click', () => {
    expanded = !expanded;
    body.classList.toggle('clamped', !expanded);
    btn.textContent = expanded ? 'Show less ▴' : 'View more ▾';
  });
}

const REACTION_MESSAGES = {
  likes: { on: ['❤️ Loved it!', '💕 Hearted!'], off: ['💔 Removed heart'] },
  reposts: { on: ['🔁 Reposted!'], off: ['↩️ Repost removed'] },
};

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function wireReactionButtons() {
  document.querySelectorAll('#bulletin-feed .reaction-item, #bulletin-feed .feed-reaction-btn:not(.cn-comment-trigger), #pinned-post-slot .reaction-item').forEach(el => {
    const fresh = el.cloneNode(true); el.replaceWith(fresh);
    fresh.addEventListener('click', () => handleReaction(fresh));
  });
}

async function handleReaction(el) {
  if (!currentUser) { window.showToast('Sign in to react.', 'warning'); return; }
  const postId = el.dataset.id;
  const type = el.dataset.type;
  const isPinnedBar = el.classList.contains('reaction-item');
  const already = isPinnedBar ? el.classList.contains('reacted') : (type === 'likes' ? el.classList.contains('heart-active') : el.classList.contains('repost-active'));

  const countEl = el.querySelector('.likes-count, .reposts-count, .social-count');
  if (countEl) {
    let current = parseInt(countEl.textContent.replace(/[^\d]/g, '')) || 0;
    countEl.textContent = fmt(already ? Math.max(0, current - 1) : current + 1);
  }

  if (type === 'reposts' && currentUserRole === 'Student') {
    if (!already) {
      console.log("[Bulletin] Opening repost modal for student");
      openRepostModal(postId, 'announcements');
      return;
    } else {
      console.log("[Bulletin] Removing announcement repost...");
      try {
        const q = query(collection(db, 'posts'), where('repostOf', '==', postId), where('userId', '==', currentUser.uid));
        const snap = await getDocs(q);
        const delPromises = snap.docs.map(d => deleteDoc(doc(db, 'posts', d.id)));
        await Promise.all(delPromises);
      } catch (err) { console.error('Error deleting announcement repost doc:', err); }
    }
  }

  if (isPinnedBar) el.classList.toggle('reacted', !already);
  else el.classList.toggle(type === 'likes' ? 'heart-active' : 'repost-active', !already);

  if (!already) window.showToast(pickRandom(REACTION_MESSAGES[type].on), type);
  else window.showToast(pickRandom(REACTION_MESSAGES[type].off), type === 'likes' ? 'heart' : 'repost');
  try {
    await updateDoc(doc(db, 'announcements', postId), { [type]: already ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) });
  } catch (err) { console.error('Reaction error:', err); }
}

function wireCommentButtons() {
  document.querySelectorAll('.cn-comment-trigger, .comment-trigger-pinned').forEach(el => {
    const fresh = el.cloneNode(true); el.replaceWith(fresh);
    fresh.addEventListener('click', () => { const pid = fresh.dataset.id; if (pid) openCommentModal(pid); });
  });
}

function openCommentModal(postId) {
  activePostId = postId;
  const overlay = document.getElementById('cn-comment-modal-overlay');
  if (overlay) {
    overlay.classList.add('open');
    overlay.classList.remove('hidden');
  }
  renderCommentList(postId);
  setTimeout(() => document.getElementById('cn-comment-input-field')?.focus(), 150);
}

function closeCommentModal() {
  const overlay = document.getElementById('cn-comment-modal-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.classList.add('hidden');
  }
  activePostId = null;
}

function getAvatar(photo, name) {
  const initials = name ? name.charAt(0).toUpperCase() : '?';
  if (photo) {
    return `
      <div class="avatar-container" style="width:100%; height:100%; position:relative;">
        <img src="${photo}" alt="${name}" 
             style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;" 
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="default-avatar" style="display:none; background:#8b1a1a; color:white; width:100%; height:100%; border-radius:50%; align-items:center; justify-content:center; position:absolute; top:0; left:0; font-weight:800;">${initials}</div>
      </div>`;
  }
  return `<div class="default-avatar" style="background:#8b1a1a; color:white; width:100%; height:100%; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px;">${initials}</div>`;
}

function renderCommentList(postId) {
  const isOrgPost = allOrgPosts.some(p => p.id === postId);
  const collectionName = isOrgPost ? 'posts' : 'announcements';
  const list = document.getElementById('cn-comment-list');
  if (!list) return;

  list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted);">Loading comments...</div>`;

  const q = query(collection(db, `${collectionName}/${postId}/comments`), orderBy('createdAt', 'asc'));
  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted);">No comments yet.</div>`;
      return;
    }

    const cache = JSON.parse(localStorage.getItem('tup_user_meta') || '{}');

    list.innerHTML = snapshot.docs.map(docSnap => {
      const c = docSnap.data();
      const isOwn = currentUser && (c.authorId === currentUser.uid || c.userId === currentUser.uid);
      const photo = isOwn ? (cache.photoURL || c.photoURL) : c.photoURL;
      const avatarHtml = getAvatar(photo, c.author);

      return `
        <div class="comment-modal-item">
          <div class="comment-modal-item-avatar">${avatarHtml}</div>
          <div class="comment-modal-item-content">
            <div class="comment-modal-item-bubble" id="bubble-${docSnap.id}">
              <div class="comment-modal-item-author">${escapeHTML(c.author)}</div>
              <div class="comment-modal-item-text">${escapeHTML(c.text)}</div>
            </div>
            <div class="comment-edit-wrap" id="edit-wrap-${docSnap.id}" style="display:none; gap:12px; margin-top:6px;">
              <input class="comment-edit-input" id="edit-input-${docSnap.id}" value="${escapeHTML(c.text)}" />
              <button class="comment-edit-save" onclick="saveCommentEdit('${collectionName}', '${postId}', '${docSnap.id}')">
                <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
              <button class="comment-edit-cancel" onclick="cancelCommentEdit('${docSnap.id}')">✕</button>
            </div>
            <div class="comment-footer" style="display:flex; align-items:center; gap:12px; margin-top:4px; padding-left:4px;">
              <div class="comment-modal-item-time" style="font-size:12px; color:var(--muted); font-weight:600; margin:0;">
                ${c.createdAt ? timeAgo(c.createdAt) : 'just now'}
              </div>
              ${isOwn ? `
                <div class="comment-item-actions" style="display:flex; align-items:center; gap:10px;">
                  <button class="comment-action-btn edit-btn" style="margin:0; padding:0; background:none;" onclick="editComment('${docSnap.id}')">
                    <svg viewBox="0 0 24 24" width="13" height="13" style="stroke:currentColor;fill:none;stroke-width:2.5;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit
                  </button>
                  <button class="comment-action-btn delete-btn" style="margin:0; padding:0; background:none;" onclick="deleteComment('${docSnap.id}')">
                    <svg viewBox="0 0 24 24" width="13" height="13" style="stroke:currentColor;fill:none;stroke-width:2.5;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Delete
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        </div>`;
    }).join('');
    list.scrollTop = list.scrollHeight;
  }, (error) => {
    console.error(`[CampusNews] Snapshot error for ${collectionName}/${postId}/comments:`, error);
    list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--maroon);">
      Unable to load comments. ${error.code === 'permission-denied' ? 'Access denied.' : 'Please try again later.'}
    </div>`;
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function initCommentModal() {
  document.getElementById('cn-comment-modal-close')?.addEventListener('click', closeCommentModal);
  const inputField = document.getElementById('cn-comment-input-field');
  document.getElementById('cn-comment-send-btn')?.addEventListener('click', () => submitComment());
  inputField?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } });
}

async function submitComment() {
  if (!currentUser) { window.showToast('Sign in to comment.', 'warning'); return; }
  const inputField = document.getElementById('cn-comment-input-field');
  const text = inputField?.value.trim();
  if (!text || !activePostId) return;
  const isOrgPost = allOrgPosts.some(p => p.id === activePostId);
  const collectionName = isOrgPost ? 'posts' : 'announcements';
  try {
    const cache = JSON.parse(localStorage.getItem('tup_user_meta') || '{}');
    const photoURL = cache.photoURL || null;
    await addDoc(collection(db, `${collectionName}/${activePostId}/comments`), { 
      author: currentUserName, 
      authorId: currentUser.uid, 
      userId: currentUser.uid,
      photoURL: photoURL,
      text, 
      createdAt: serverTimestamp() 
    });
    try {
      if (isOrgPost) {
        await updateDoc(doc(db, 'posts', activePostId), { comments: increment(1) });
      } else {
        await updateDoc(doc(db, 'announcements', activePostId), { comments: arrayUnion(currentUser.uid) });
      }
    } catch (e2) {
      console.warn("Could not update original post comment count. Continuing...", e2);
    }
    inputField.value = ''; window.showToast('Comment posted!', 'comments');
  } catch (err) { console.error('Comment error:', err); }
}

window.deleteComment = function(commentId) {
  // Find metadata for the popup
  const isOrgPost = allOrgPosts.some(p => p.id === activePostId);
  const collectionName = isOrgPost ? 'posts' : 'announcements';
  
  showConfirmDeleteToast(collectionName, activePostId, commentId);
};

function showConfirmDeleteToast(collectionName, postId, commentId) {
  let overlay = document.getElementById('cn-confirm-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'cn-confirm-overlay';
    overlay.className = 'confirm-toast-overlay';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="confirm-toast-pill">
      <span class="confirm-toast-text">🗑️ Delete this comment?</span>
      <div class="confirm-toast-actions">
        <button class="confirm-toast-btn delete" id="confirm-delete-go">Delete</button>
        <button class="confirm-toast-btn cancel" id="confirm-delete-cancel">Cancel</button>
      </div>
    </div>
  `;

  overlay.classList.add('show');

  document.getElementById('confirm-delete-go').onclick = async () => {
    overlay.classList.remove('show');
    await performDeleteComment(collectionName, postId, commentId);
  };

  document.getElementById('confirm-delete-cancel').onclick = () => {
    overlay.classList.remove('show');
  };
}

window.performDeleteComment = async function(collectionName, postId, commentId) {
  try {
    const commentRef = doc(db, `${collectionName}/${postId}/comments`, commentId);
    await deleteDoc(commentRef);
    if (collectionName === 'posts') {
      await updateDoc(doc(db, 'posts', postId), { comments: increment(-1) });
    } else {
      await updateDoc(doc(db, 'announcements', postId), { comments: arrayRemove(currentUser.uid) });
    }
    window.showToast('Comment deleted', 'success');
  } catch (err) {
    console.error('Delete error:', err);
    window.showToast('Error deleting comment.', 'error');
  }
};

window.editComment = function(commentId) {
  const bubble = document.getElementById(`bubble-${commentId}`);
  const editWrap = document.getElementById(`edit-wrap-${commentId}`);
  if (bubble) bubble.style.display = 'none';
  if (editWrap) editWrap.style.display = 'flex';
};

window.cancelCommentEdit = function(commentId) {
  const bubble = document.getElementById(`bubble-${commentId}`);
  const editWrap = document.getElementById(`edit-wrap-${commentId}`);
  if (bubble) bubble.style.display = 'block';
  if (editWrap) editWrap.style.display = 'none';
};

window.saveCommentEdit = async function(collectionName, postId, commentId) {
  const input = document.getElementById(`edit-input-${commentId}`);
  const newText = input?.value.trim();
  if (!newText) return;
  try {
    const commentRef = doc(db, `${collectionName}/${postId}/comments`, commentId);
    await updateDoc(commentRef, { text: newText, updatedAt: serverTimestamp() });
    window.showToast('Comment updated', 'success');
    cancelCommentEdit(commentId);
  } catch (err) {
    console.error('Edit comment error:', err);
  }
};

function wireLightboxTriggers() {
  document.querySelectorAll('.lightbox-trigger').forEach(el => {
    const fresh = el.cloneNode(true); el.replaceWith(fresh);
    fresh.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = fresh.closest('[data-id]');
      const pid = card?.dataset.id;
      const post = allPosts.find(p => p.id === pid) || allOrgPosts.find(p => p.id === pid);
      if (!post) return;

      const gallery = post.imageURLs || (post.imageURL ? [post.imageURL] : []);
      if (gallery.length > 0) {
        window.currentGallery = gallery;
        window.currentIndex = gallery.indexOf(fresh.dataset.src);
        if (window.currentIndex === -1) window.currentIndex = 0;
        openLightbox();
      }
    });
  });
}

function renderPhotoGrid(imgs) {
  const count = imgs.length;
  const clampedCount = Math.min(count, 5);
  const extra = count > 5 ? count - 5 : 0;
  const borderRadius = '18px';
  const gap = '8px';

  if (clampedCount === 1) {
    return `<div class="lightbox-trigger" data-src="${imgs[0]}" style="cursor:pointer; border-radius:${borderRadius}; overflow:hidden; display:block;">
              <img src="${imgs[0]}" style="width:100%; display:block; object-fit:cover; max-height:500px;" />
            </div>`;
  }

  let style = `display: grid !important; height: 340px !important; gap: ${gap} !important; width: 100% !important; border-radius:${borderRadius}; overflow:hidden;`;
  if (clampedCount === 2) style += ` grid-template-columns: 1fr 1fr !important; grid-template-rows: 1fr !important;`;
  else if (clampedCount === 3) style += ` grid-template-columns: 1fr 1fr !important; grid-template-rows: 1fr 1fr !important;`;
  else if (clampedCount === 4) style += ` grid-template-columns: 1fr 1fr !important; grid-template-rows: 1fr 1fr !important;`;
  else style += ` grid-template-columns: 2fr 1fr 1fr !important; grid-template-rows: 1fr 1fr !important;`;

  let gridHtml = `<div class="photo-grid collage-${clampedCount}" style="${style}">`;

  const cellsHtml = imgs.slice(0, 5).map((src, i) => {
    let cellStyle = "position: relative !important; overflow: hidden !important; min-width: 0 !important; min-height: 0 !important; width: 100% !important; height: 100% !important; cursor:pointer;";
    if (clampedCount === 3 && i === 0) cellStyle += " grid-row: 1 / 3 !important;";
    else if (clampedCount === 5 && i === 0) cellStyle += " grid-column: 1 / 2 !important; grid-row: 1 / 3 !important;";

    const overlayHtml = (i === 4 && extra > 0) 
      ? `<div class="photo-more-overlay" style="position: absolute !important; inset: 0 !important; background: rgba(0,0,0,0.5) !important; display: flex !important; align-items: center !important; justify-content: center !important; color: #fff !important; font-size: 24px !important; font-weight: 700 !important; z-index: 2 !important; pointer-events: none !important; font-family: 'Montserrat', sans-serif;">+${extra}</div>` 
      : '';

    return `
      <div class="collage-cell lightbox-trigger" data-src="${src}" style="${cellStyle}">
        <img src="${src}" style="position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important;" />
        ${overlayHtml}
      </div>`;
  }).join('');

  return gridHtml + cellsHtml + `</div>`;
}

function openLightbox() {
  const lb = document.getElementById('cn-lightbox');
  const img = document.getElementById('cn-lightbox-img');
  const counter = document.getElementById('lb-counter');
  if (lb && img) { 
    img.src = window.currentGallery[window.currentIndex]; 
    lb.classList.add('open'); 
    if (counter) counter.textContent = `${window.currentIndex + 1} / ${window.currentGallery.length}`;
    lb.dataset.count = window.currentGallery.length;
  }
}

function initLightbox() {
  if (!document.getElementById('cn-lightbox')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="cn-lightbox">
        <span id="cn-lightbox-close">✕</span>
        <img id="cn-lightbox-img" src=""/>
        <button id="lb-prev" class="lb-nav">❮</button>
        <button id="lb-next" class="lb-nav">❯</button>
        <div id="lb-counter"></div>
      </div>
    `);
  }
  const lb = document.getElementById('cn-lightbox');
  document.getElementById('cn-lightbox-close')?.addEventListener('click', () => lb.classList.remove('open'));
  lb?.addEventListener('click', e => { if (e.target === lb) lb.classList.remove('open'); });
  
  document.getElementById('lb-prev')?.addEventListener('click', (e) => { 
    e.stopPropagation();
    window.currentIndex = (window.currentIndex > 0) ? window.currentIndex - 1 : window.currentGallery.length - 1; 
    openLightbox(); 
  });
  document.getElementById('lb-next')?.addEventListener('click', (e) => { 
    e.stopPropagation();
    window.currentIndex = (window.currentIndex < window.currentGallery.length - 1) ? window.currentIndex + 1 : 0; 
    openLightbox(); 
  });
}

function initFilterUI() {
  const btn = document.getElementById('cn-filter-btn');
  const portal = document.getElementById('cn-filter-portal');
  if (!btn || !portal) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = portal.classList.contains('open');
    if (isOpen) {
      portal.classList.remove('open');
    } else {
      // Position portal below the button
      const rect = btn.getBoundingClientRect();
      portal.style.top = `${rect.bottom + 8}px`;
      portal.style.left = `${rect.right - 320}px`; // Align to right of button (min-width is 320px)
      portal.classList.add('open');
    }
  });

  // Close portal when clicking outside
  document.addEventListener('click', (e) => {
    if (!portal.contains(e.target) && !btn.contains(e.target)) {
      portal.classList.remove('open');
    }
  });

  // Handle option clicks
  const opts = portal.querySelectorAll('.cn-filter-opt');
  opts.forEach(opt => {
    opt.addEventListener('click', () => {
      opts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      activeFilter = opt.dataset.filter;
      
      // Update button label to show active filter
      const label = btn.querySelector('.cn-filter-label');
      if (label) {
        if (activeFilter === 'all') label.textContent = 'Filter Posts';
        else label.textContent = opt.textContent;
      }
      
      btn.classList.toggle('active', activeFilter !== 'all');
      
      portal.classList.remove('open');
      renderBulletinPage(getFilteredPosts());
    });
  });
}

function initSearch() {
  document.getElementById('cn-search-input')?.addEventListener('input', () => renderBulletinPage(getFilteredPosts()));
}

function initSideTabs() {
  document.querySelectorAll('.side-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.side-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active');
      activeSection = tab.dataset.section;
      document.getElementById('section-org')?.classList.toggle('hidden', activeSection !== 'org');
      document.getElementById('section-bulletin')?.classList.toggle('hidden', activeSection !== 'bulletin');
      if (activeSection === 'org') renderOrgFeed(); else renderBulletinPage(getFilteredPosts());
    });
  });
}

function initOrgTabs() {
  document.querySelectorAll('.org-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.org-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active');
      orgFilter = tab.dataset.college; renderOrgFeed();
    });
  });
}

function listenToOrgPosts() {
  const q = query(collection(db, 'posts'), where('isOrg', '==', true), orderBy('createdAt', 'desc'));
  onSnapshot(q, (snapshot) => {
    const changes = snapshot.docChanges();
    const isInitial = allOrgPosts.length === 0;

    // Keep data array updated
    allOrgPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // If it's just a modification, update in-place to avoid flicker
    if (!isInitial && changes.length > 0 && !changes.some(c => c.type === 'added' || c.type === 'removed')) {
      changes.forEach(change => {
        if (change.type === 'modified') {
          updateOrgPostUI(change.doc.id, change.doc.data());
        }
      });
      return;
    }

    // Otherwise (initial or structural change), full render
    if (activeSection === 'org') renderOrgFeed();
  }, (err) => {
    console.error("Org posts snapshot error:", err);
  });
}

function updateOrgPostUI(id, data) {
  const card = document.querySelector(`.bulletin-card[data-id="${id}"]`);
  if (!card) return;
  const currentUid = auth.currentUser?.uid;
  
  // Update Likes
  const likedBy = data.likedBy || [];
  const likeBtn = card.querySelector('.feed-reaction-btn[data-type="likes"]');
  if (likeBtn) {
    likeBtn.classList.toggle('heart-active', currentUid && likedBy.includes(currentUid));
    const countEl = likeBtn.querySelector('.likes-count');
    if (countEl) countEl.textContent = fmt(likedBy.length);
  }

  // Update Reposts
  const repostedBy = data.repostedBy || [];
  const repostBtn = card.querySelector('.feed-reaction-btn[data-type="reposts"]');
  if (repostBtn) {
    repostBtn.classList.toggle('repost-active', currentUid && repostedBy.includes(currentUid));
    const countEl = repostBtn.querySelector('.reposts-count');
    if (countEl) countEl.textContent = fmt(repostedBy.length);
  }

  // Update Comment Count
  const commentCount = data.comments || 0;
  const commentBtn = card.querySelector('.cn-comment-trigger');
  if (commentBtn) {
    const countEl = commentBtn.querySelector('.comments-count');
    if (countEl) countEl.textContent = fmt(commentCount);
  }
}

function renderOrgFeed(postsOverride) {
  const container = document.getElementById('org-feed-list');
  if (!container) return;
  if (postsOverride) allOrgPosts = postsOverride;
  let filtered = allOrgPosts;
  if (orgFilter === 'my' && currentUserCollege) {
    filtered = allOrgPosts.filter(p => p.college === currentUserCollege || p.college === 'UNIVERSITY_WIDE' || p.college === 'All');
  }
  [...container.querySelectorAll('.bulletin-card, .cn-no-results')].forEach(c => c.remove());
  if (filtered.length === 0) { document.getElementById('org-empty').style.display = 'flex'; return; }
  document.getElementById('org-empty').style.display = 'none';
  filtered.forEach(post => {
    container.insertAdjacentHTML('beforeend', renderOrgPostCard(post, currentUser?.uid));
    wireViewMore(`op-body-${post.id}`, `op-viewmore-${post.id}`);
    if (post.repostOf) {
      if (post.text) wireViewMore(`op-caption-${post.id}`, `op-viewmore-caption-${post.id}`);
      wireViewMore(`op-repost-${post.id}`, `op-viewmore-repost-${post.id}`);
    }
  });
  wireOrgReactionButtons();
  wireLightboxTriggers();
}

function renderOrgPostCard(post, uid) {
  const likeCount = (post.likedBy || []).length;
  const commentCount = post.comments || 0;
  const repostCount = (post.repostedBy || []).length;
  const iLiked = uid && (post.likedBy || []).includes(uid);
  const iReposted = uid && (post.repostedBy || []).includes(uid);
  const bodyHTML = (post.text || '').replace(/\n/g, '<br>');
  const avatarHTML = post.photoURL ? `<img src="${post.photoURL}" alt="" style="width:100%; height:100%; object-fit:cover; image-rendering:high-quality;" />` : `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  const photoGrid = (post.imageURLs && post.imageURLs.length > 0)
    ? `<div class="bulletin-media-col">${renderPhotoGrid(post.imageURLs)}</div>`
    : (post.imageURL ? `<div class="bulletin-media-col"><div class="bulletin-photo-grid collage-1" style="height:250px; border-radius:12px; overflow:hidden;"><div class="collage-cell lightbox-trigger" data-src="${post.imageURL}" style="height:100%;"><img src="${post.imageURL}" alt="" style="width:100%; height:100%; object-fit:cover;" /></div></div></div>` : '');

  let contentHTML = `
    <div class="bulletin-columns-wrap">
      <div class="bulletin-caption-col">
        ${post.title ? `<div class="bulletin-card-title">${escapeHTML(post.title)}</div>` : ''}
        <div class="bulletin-card-text clamped" id="op-body-${post.id}">${bodyHTML}</div>
        <button class="view-more-btn" id="op-viewmore-${post.id}">View more ▾</button>
      </div>
      ${photoGrid}
    </div>`;

  if (post.repostOf) {
    contentHTML = `
      ${post.text ? `
        <div class="repost-quote-text clamped" id="op-caption-${post.id}" style="margin-bottom:12px; font-weight:600; color:var(--text);">${escapeHTML(post.text).replace(/\n/g, '<br>')}</div>
        <button class="view-more-btn" id="op-viewmore-caption-${post.id}" style="margin-bottom:8px;">View more ▾</button>
      ` : ''}
      <div class="repost-quote-card" style="border:1.5px solid var(--border); border-radius:12px; padding:12px; background:rgba(255,255,255,0.4); cursor:pointer;">
        <div class="repost-quote-header" style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
          <div class="repost-quote-avatar" style="width:24px; height:24px; border-radius:50%; overflow:hidden;">
            <img src="${post.repostAuthorPhoto || '../assets/images/anon_avatar.jpg'}" style="width:100%; height:100%; object-fit:cover;">
          </div>
          <div class="repost-quote-meta">
            <div class="repost-quote-author" style="font-size:13px; font-weight:800; color:var(--text);">${post.repostAuthor || 'User'}</div>
            <div class="repost-quote-time" style="font-size:11px; color:var(--muted);">${post.repostTime || ''}</div>
          </div>
        </div>
        <div class="repost-quote-body clamped" id="op-repost-${post.id}" style="font-size:13px; color:var(--text); line-height:1.4;">
          ${post.repostTitle ? `<div class="bulletin-card-title" style="font-size:14px; margin-bottom:4px;">${escapeHTML(post.repostTitle)}</div>` : ''}
          ${escapeHTML(post.repostText || '').replace(/\n/g, '<br>')}
        </div>
        <button class="view-more-btn" id="op-viewmore-repost-${post.id}" style="margin-top:4px;">View more ▾</button>
        ${post.repostImage ? `<div class="post-images lightbox-trigger" data-src="${post.repostImage}" style="margin-top:8px; border-radius:8px; overflow:hidden; cursor:pointer;"><img src="${post.repostImage}" class="post-image" style="width:100%; max-height:300px; object-fit:cover;"></div>` : ''}
      </div>`;
  }

  return `
    <div class="bulletin-card" data-id="${post.id}">
      <div class="bulletin-card-header"><div class="bulletin-card-avatar">${avatarHTML}</div><div class="bulletin-card-meta-wrap"><div class="bulletin-card-author">${post.author || 'Organization'}</div><div class="bulletin-card-time">${timeAgo(post.createdAt)}</div></div></div>
      <div class="bulletin-card-body ${post.imageURL || post.repostImage ? '' : 'no-images'}">
        ${contentHTML}
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

function wireOrgReactionButtons() {
  console.log("Wiring Org Reaction Buttons...");
  document.querySelectorAll('#org-feed-list .feed-reaction-btn:not(.cn-comment-trigger)').forEach(el => {
    const fresh = el.cloneNode(true); el.replaceWith(fresh);
    const postId = fresh.dataset.id;
    const type = fresh.dataset.type;
    console.log(`[OrgFeed] Wired ${type} button for post ${postId}`);
    fresh.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log(`[OrgFeed] Clicked ${type} on post ${postId}`);
      handleOrgReaction(fresh);
    });
  });
  document.querySelectorAll('#org-feed-list .feed-reaction-btn.cn-comment-trigger').forEach(el => {
    const fresh = el.cloneNode(true); el.replaceWith(fresh);
    fresh.addEventListener('click', () => { activePostId = fresh.dataset.id; openCommentModal(activePostId); });
  });
}

async function handleOrgReaction(el) {
  if (!currentUser) { showToast('Sign in to react.'); return; }
  const postId = el.dataset.id; const type = el.dataset.type;
  console.log(`[OrgFeed] handleOrgReaction: role=${currentUserRole}, type=${type}, id=${postId}`);

  // REPOST LOGIC: If student clicks repost, open modal
  if (type === 'reposts' && currentUserRole === 'Student') {
    const already = el.classList.contains('repost-active');
    if (!already) {
      console.log("[OrgFeed] Opening repost modal for student");
      openRepostModal(postId);
      return;
    } else {
      console.log("[OrgFeed] Removing student repost...");
      try {
        // Find and delete the repost document from the 'posts' collection
        const q = query(collection(db, 'posts'), where('repostOf', '==', postId), where('userId', '==', currentUser.uid));
        const snap = await getDocs(q);
        const delPromises = snap.docs.map(d => deleteDoc(doc(db, 'posts', d.id)));
        await Promise.all(delPromises);
      } catch (err) { console.error('Error deleting repost doc:', err); }
    }
  }

  const field = { likes: 'likedBy', reposts: 'repostedBy' }[type];
  const already = type === 'likes' ? el.classList.contains('heart-active') : el.classList.contains('repost-active');

  const countEl = el.querySelector('.likes-count, .reposts-count');
  if (countEl) {
    let current = parseInt(countEl.textContent.replace(/[^\d]/g, '')) || 0;
    countEl.textContent = fmt(already ? Math.max(0, current - 1) : current + 1);
  }

  el.classList.toggle(type === 'likes' ? 'heart-active' : 'repost-active', !already);
  try {
    await updateDoc(doc(db, 'posts', postId), { [field]: already ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) });
    console.log(`[OrgFeed] Updated ${type} in Firestore for ${postId}`);
  } catch (err) { console.error('Org reaction error:', err); }
}

window.openRepostModal = async function(postId, collectionName = 'posts') {
  if (!currentUser) { showToast('Sign in to repost.'); return; }
  activePostId = postId;
  activeCollection = collectionName;
  
  const overlay = document.getElementById('cn-repost-modal-overlay');
  const modal = document.getElementById('cn-repost-modal');
  if (!overlay || !modal) return;

  // 1. Show overlay
  overlay.classList.add('open');
  overlay.style.display = 'flex';

  // 2. Clear previous data
  document.getElementById('repostContent').value = '';
  document.getElementById('repost-user-name').textContent = currentUserName || 'TUPian';
  const userAvatar = document.getElementById('repost-user-avatar');
  if (userAvatar && currentUserPhoto) {
    userAvatar.innerHTML = `<img src="${currentUserPhoto}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
  }

  // 3. Fetch original post for preview
  const previewBody = document.getElementById('quote-preview-body');
  const previewAuthor = document.getElementById('quote-preview-author');
  const previewAvatar = document.getElementById('quote-preview-avatar');
  const previewTitle = document.getElementById('quote-preview-title');
  const previewTime = document.getElementById('quote-preview-time');

  previewBody.textContent = 'Loading...';
  previewAuthor.textContent = '...';

  try {
    const postSnap = await getDoc(doc(db, collectionName, postId));
    if (postSnap.exists()) {
      const data = postSnap.data();
      previewAuthor.textContent = data.author || 'TUP Konek';
      previewBody.textContent = data.text || data.body || '';
      previewTitle.textContent = data.title || '';
      previewTime.textContent = data.createdAt ? timeAgo(data.createdAt) : 'Just now';
      
      if (data.photoURL) {
        previewAvatar.innerHTML = `<img src="${data.photoURL}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
      } else {
        previewAvatar.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      }

      // Add image preview if exists
      const existingImg = modal.querySelector('.cn-rm-quote-image');
      if (existingImg) existingImg.remove();
      const imageURL = data.imageURL || (data.imageURLs && data.imageURLs[0]) || null;
      if (imageURL) {
        const imgEl = document.createElement('img');
        imgEl.className = 'cn-rm-quote-image';
        imgEl.src = imageURL;
        imgEl.style.cssText = 'width:100%; max-height:200px; object-fit:cover; border-radius:8px; margin-top:8px;';
        document.getElementById('repost-quote-preview').appendChild(imgEl);
      }
    }
  } catch (err) {
    console.error("Error fetching for preview:", err);
    previewBody.textContent = 'Error loading preview.';
  }

  // 4. Focus
  setTimeout(() => document.getElementById('repostContent').focus(), 150);
};

window.closeRepostModal = function() {
  const overlay = document.getElementById('cn-repost-modal-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.style.display = 'none';
  }
  const content = document.getElementById('repostContent');
  if (content) content.value = '';
  activePostId = null;
};

window.closeRepostModalOnOverlay = function(e) {
  if (e.target.id === 'cn-repost-modal-overlay') window.closeRepostModal();
};

window.submitRepost = async function(skipQuote = false) {
  const quote = skipQuote ? "" : document.getElementById('repostContent').value.trim();
  if (!activePostId || !currentUser) return;

  const submitBtn = document.getElementById('repost-submit-btn');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const coll = activeCollection || 'posts';
    const postSnap = await getDoc(doc(db, coll, activePostId));
    if (!postSnap.exists()) {
      showToast("Original post not found.");
      return;
    }
    const original = postSnap.data();

    const repostData = {
      userId: currentUser.uid,
      author: currentUserName || "Student",
      photoURL: currentUserPhoto || currentUser.photoURL || null,
      text: quote,
      repostOf: activePostId,
      repostAuthor: original.author || "TUP Konek",
      repostAuthorPhoto: original.photoURL || null,
      repostTitle: original.title || "",
      repostText: original.text || original.body || "",
      repostImage: original.repostImage || original.imageURL || (original.imageURLs && original.imageURLs[0]) || null,
      createdAt: serverTimestamp(),
      likedBy: [],
      comments: 0,
      repostedBy: [],
      repostTime: document.getElementById('quote-preview-time').textContent || "",
      isOrg: currentUserRole === 'Organization',
      college: currentUserCollege || null
    };

    await addDoc(collection(db, "posts"), repostData);

    // Update the original post's repostedBy array (or 'reposts' for announcements)
    try {
      const field = coll === 'posts' ? 'repostedBy' : 'reposts';
      await updateDoc(doc(db, coll, activePostId), {
        [field]: arrayUnion(currentUser.uid)
      });
    } catch (e2) {
      console.warn("Could not update original post repost count. Continuing...", e2);
    }

    window.closeRepostModal();
    showToast("🔁 Reposted successfully!");

    // If we are in the Org feed, we might want to refresh or update the UI
    // The snapshot listener should handle it automatically if it's watching all posts
  } catch (err) {
    console.error("Repost failed:", err);
    showToast("Error reposting.");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
};

function initRightPanel() {
  // Immediate cache load to prevent flicker
  const cache = localStorage.getItem('tup_user_meta');
  if (cache) {
    try {
      const userData = JSON.parse(cache);
      updateRightPanel({
        name: userData.fullName || userData.name,
        email: userData.email,
        photoSrc: userData.photoURL || userData.photoSrc,
        id: userData.studentID || userData.id
      });
    } catch (e) {
      console.error("Right panel cache error:", e);
    }
  }

  document.getElementById('cn-btn-logout')?.addEventListener('click', async () => {
    try {
      const { getAuth, signOut } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
      await signOut(auth);
      localStorage.clear();
      window.location.href = '../index.html';
    } catch (err) { 
      console.error('Logout error:', err); 
      localStorage.clear();
      window.location.href = '../index.html'; 
    }
  });
}

function initAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      let userData = null;
      let studentDoc = null;
      let orgDoc = null;

      try {
        studentDoc = await getDoc(doc(db, 'users', user.uid));
      } catch (err) {
        // Silent catch: User might be an organization
      }

      try {
        orgDoc = await getDoc(doc(db, 'organizations', user.uid));
      } catch (err) {
        // Silent catch: User might be a student
      }

      if (studentDoc?.exists()) {
        const d = studentDoc.data();
        // Priority: Check if role is USG (Admin)
        if (d.role === 'USG') {
          currentUserRole = 'Admin';
        } else {
          currentUserRole = 'Student';
        }
        currentUserName = d.fullName;
        currentUserCollege = d.college;
        currentUserPhoto = d.photoURL;
        userData = { name: d.fullName, email: user.email, photoSrc: d.photoURL, id: d.studentID || 'Admin' };
      } else if (orgDoc?.exists()) {
        const d = orgDoc.data();
        currentUserRole = 'Organization';
        currentUserName = d.name;
        currentUserCollege = d.college;
        currentUserPhoto = d.photoURL;
        userData = { name: d.name, email: user.email, photoSrc: d.photoURL, id: d.college };
      }

      if (userData) updateRightPanel(userData);

      const myTab = document.querySelector('.org-tab[data-college="my"]');
      if (myTab && currentUserCollege) myTab.textContent = `My College (${currentUserCollege})`;
      listenToOrgPosts();
    } else {
      window.location.href = '../index.html';
    }
  });
}

function updateRightPanel(userData) {
  const nameEl = document.getElementById('cn-profile-name');
  const emailEl = document.getElementById('cn-profile-email');
  const photoWrap = document.getElementById('cn-profile-photo-wrap');
  const idEl = document.getElementById('cn-profile-id');

  if (nameEl) nameEl.textContent = userData.name || '—';
  if (emailEl) emailEl.textContent = userData.email || '—';
  if (idEl) idEl.textContent = userData.id || '—';
  if (photoWrap && userData.photoSrc) {
    photoWrap.innerHTML = `<img src="${userData.photoSrc}" class="profile-photo" alt="Profile" style="width:100%; height:100%; object-fit:cover; border-radius:12px; image-rendering:high-quality;">`;
  }
  
  // Comment modal avatar sync
  const commentAv = document.getElementById('comment-input-avatar');
  if (commentAv && userData.photoSrc) {
    commentAv.innerHTML = `<img src="${userData.photoSrc}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;image-rendering:high-quality;">`;
  }

  // Sidebar avatar sync
  const sidebarAv = document.querySelector('.nav-profile-avatar');
  if (sidebarAv && userData.photoSrc) {
    sidebarAv.innerHTML = `<img src="${userData.photoSrc}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;image-rendering:high-quality;">`;
  }
}

function listenToAnnouncements() {
  const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
  onSnapshot(q, (snapshot) => {
    const changes = snapshot.docChanges();
    const isInitial = allPosts.length === 0;

    // Keep data array updated
    allPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // If it's just a modification, update in-place to avoid flicker
    if (!isInitial && changes.length > 0 && !changes.some(c => c.type === 'added' || c.type === 'removed')) {
      changes.forEach(change => {
        if (change.type === 'modified') {
          updateAnnouncementUI(change.doc.id, change.doc.data());
        }
      });
      return;
    }

    // Otherwise (initial or structural change), full render
    renderBulletinPage(getFilteredPosts());
  }, (err) => {
    console.error("Announcements snapshot error:", err);
  });
}

function updateAnnouncementUI(id, data) {
  const card = document.querySelector(`.bulletin-card[data-id="${id}"], .pinned-post-card[data-id="${id}"]`);
  if (!card) return;
  const currentUid = auth.currentUser?.uid;
  
  // Handle Announcements structure (likes, reposts vs likedBy, repostedBy)
  const likes = data.likes || [];
  const reposts = data.reposts || [];
  const comments = data.comments || [];

  // Pinned Bar or Regular Button
  const likeBtn = card.querySelector('.feed-reaction-btn[data-type="likes"], .social-item[data-type="likes"]');
  if (likeBtn) {
    const isPinned = likeBtn.classList.contains('social-item');
    likeBtn.classList.toggle(isPinned ? 'reacted' : 'heart-active', currentUid && likes.includes(currentUid));
    const countEl = likeBtn.querySelector('.likes-count, .social-count');
    if (countEl) countEl.textContent = fmt(likes.length);
  }

  const repostBtn = card.querySelector('.feed-reaction-btn[data-type="reposts"], .social-item[data-type="reposts"]');
  if (repostBtn) {
    const isPinned = repostBtn.classList.contains('social-item');
    repostBtn.classList.toggle(isPinned ? 'reacted' : 'repost-active', currentUid && reposts.includes(currentUid));
    const countEl = repostBtn.querySelector('.reposts-count, .social-count');
    if (countEl) countEl.textContent = fmt(reposts.length);
  }

  const commentBtn = card.querySelector('.cn-comment-trigger, .comment-trigger-pinned');
  if (commentBtn) {
    const countEl = commentBtn.querySelector('.comments-count');
    if (countEl) {
      let count = 0;
      if (Array.isArray(comments)) count = comments.length;
      else if (typeof comments === 'number') count = comments;
      countEl.textContent = fmt(count);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAuth(); initSideTabs(); initOrgTabs(); initCommentModal(); initLightbox(); initRightPanel(); initSearch(); initFilterUI(); listenToAnnouncements();
  window.renderBulletinPage = renderBulletinPage;
  window.renderOrgFeed = renderOrgFeed;
});

async function sendMessage() {
  const input = document.getElementById('userInput');
  const body = document.getElementById('chatBody');
  const text = input.value.trim();
  if (!text) return;
  const userMsg = document.createElement('div'); userMsg.className = 'user-message'; userMsg.textContent = text; body.appendChild(userMsg);
  input.value = ''; body.scrollTop = body.scrollHeight;
  try {
    const result = await model.generateContent(text);
    const response = await result.response;
    const botText = response.text();
    let formattedResponse = botText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/^\* /gm, '• ').replace(/\n/g, '<br>');
    const botRow = document.createElement('div'); botRow.className = 'bot-row';
    botRow.innerHTML = `<img src="../assets/images/Tupee_logo.png" class="bot-row-avatar"><div class="bot-message">${formattedResponse}</div>`;
    body.appendChild(botRow); body.scrollTop = body.scrollHeight;
  } catch (error) { console.error("Gemini Error:", error); }
}
window.askSuggestion = (text) => { const input = document.getElementById('userInput'); if (input) { input.value = text; sendMessage(); } };
window.toggleChat = () => { document.getElementById('chatModal')?.classList.toggle('active'); };
window.sendMessage = sendMessage;