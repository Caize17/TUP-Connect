const USER = {
  name: document.getElementById('modal-user-name').textContent,
  photoSrc: document.querySelector('#modal-avatar img').src
};

// ========================
// TEMPLATE HELPER
// ========================
function getTemplate(id) {
  const tpl = document.getElementById(id);
  const div = document.createElement('div');
  div.appendChild(tpl.content.cloneNode(true));
  return div.innerHTML;
}

// ========================
// TOAST
// ========================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove('show'), 2200);
}

// ========================
// RELATIVE TIME FORMATTER
// ========================
function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

  // For older, return formatted date
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

// ========================
// CHANGE PHOTO MENU
// ========================
function toggleChangePhotoMenu(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('changePhotoDropdown');
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();

  dropdown.style.top = (rect.bottom + 8) + 'px';
  dropdown.style.right = (window.innerWidth - rect.right) + 'px';
  dropdown.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const wrap = document.querySelector('.change-photo-wrap');
  const dropdown = document.getElementById('changePhotoDropdown');
  if (dropdown && wrap && !wrap.contains(e.target)) {
    dropdown.classList.remove('open');
  }
});

// ========================
// REACTION HANDLER
// ========================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.feed-reaction-btn');
  if (!btn) return;

  const type = btn.dataset.type;

  // ── LIKE ──
  if (type === 'like') {
    const countEl = btn.querySelector('.likes-count');
    const postIdx = btn.dataset.post !== undefined ? parseInt(btn.dataset.post) : null;
    const base = (postIdx !== null && FEED_POSTS?.[postIdx])
      ? FEED_POSTS[postIdx].likes
      : (parseInt(countEl.textContent) || 0);

    const isActive = btn.classList.toggle('heart-active');
    const svg = btn.querySelector('svg');

    svg.style.animation = 'none';
    svg.offsetHeight;
    svg.style.animation = '';

    if (isActive) {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angles = [0, 45, 90, 135, 180, 225, 270, 315];
      angles.forEach(angle => {
        const p = document.createElement('div');
        p.className = 'heart-burst';
        const rad = angle * Math.PI / 180;
        const dist = 28 + Math.random() * 14;
        p.style.setProperty('--dx', `${Math.cos(rad) * dist}px`);
        p.style.setProperty('--dy', `${Math.sin(rad) * dist}px`);
        p.style.left = `${cx - 3}px`;
        p.style.top = `${cy - 3}px`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 600);
      });
    }

    countEl.textContent = isActive ? fmt(base + 1) : fmt(base);
  }

  // ── COMMENT ──
  else if (type === 'comment') {
    openCommentModal(btn);
  }

  // ── REPOST ──
  else if (type === 'repost') {
    const countSpan = btn.querySelector('.reaction-reposts-count');
    const postIdx = btn.dataset.post !== undefined ? parseInt(btn.dataset.post) : null;
    const base = (postIdx !== null && FEED_POSTS?.[postIdx])
      ? FEED_POSTS[postIdx].reposts
      : (parseInt(countSpan.textContent) || 0);

    const isActive = btn.classList.toggle('repost-active');
    const svg = btn.querySelector('svg');

    svg.style.animation = 'none';
    svg.offsetHeight;
    svg.style.animation = '';

    if (isActive) {
      btn.lastChild.textContent = ' Reposted';
      openRepostModal(btn);
    } else {
      countSpan.textContent = fmt(Math.max(0, base - 1));
      btn.lastChild.textContent = ' Repost';
      const originalCard = btn.closest('.post-card');
      const repostId = originalCard.dataset.repostCardId;
      if (repostId) {
        const repostCard = document.getElementById(repostId);
        if (repostCard) repostCard.remove();
        delete originalCard.dataset.repostCardId;
      }
      // Remove repost data from original post
      const repostsStore = originalCard.querySelector('.reposts-data');
      const repostDatas = repostsStore.querySelectorAll('.repost-data');
      if (repostDatas.length > 0) {
        repostDatas[repostDatas.length - 1].remove(); // Remove the last one (assuming it's the current user's)
      }

      // Update the repost info line below the post
      updateRepostInfo(originalCard);

      showToast('Repost removed!');
    }
  }
});

// ========================
// BUILD REACTIONS BAR
// ========================
function buildReactions(idx = null, likes = 0, comments = 0, reposts = 0) {
  const postAttr = idx !== null ? `data-post="${idx}"` : '';
  return `
    <div class="feed-reactions">
      <button class="feed-reaction-btn" ${postAttr} data-type="like">
        <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span class="likes-count">${fmt(likes)}</span> Heart
      </button>
      <button class="feed-reaction-btn" ${postAttr} data-type="comment">
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span class="comments-count">${fmt(comments)}</span> Comments
      </button>
      <button class="feed-reaction-btn" ${postAttr} data-type="repost">
        <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        <span class="reposts-count">${fmt(reposts)}</span> Repost
      </button>
    </div>`;
}

// ========================
// REPOST CARD
// ========================
function createRepostCard(btn, quote = '') {
  const originalCard = btn.closest('.post-card');

  const author = originalCard.querySelector('.post-author')?.textContent || 'Unknown';
  const time = originalCard.querySelector('.post-time')?.textContent || '';
  const body = originalCard.querySelector('.post-body')?.innerHTML || '';
  const avatarEl = originalCard.querySelector('.post-avatar img');
  const avatar = avatarEl ? avatarEl.src : '';
  const imagesEl = originalCard.querySelector('.post-images');
  const imagesHTML = imagesEl ? imagesEl.outerHTML : '';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'long', day: '2-digit', year: 'numeric'
  }) + ' at ' + now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  const menuId = 'menu-' + Date.now();
  const repostId = 'repost-' + Date.now();
  const card = document.createElement('div');
  card.className = 'post-card';
  card.id = repostId;

  // Use getTemplate() to correctly read from <template> elements
  card.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">
        <img src="${USER.photoSrc || '../assets/images/anon_avatar.jpg'}" alt="Samantha" onerror="this.parentElement.textContent='👩'">
      </div>
      <div class="post-meta">
        <div class="post-author">Puto-Manila Organization</div>
        <div class="post-time">${dateStr}</div>
      </div>
      <button class="post-menu" onclick="toggleMenu(event, '${menuId}')">
        <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
        <div class="dropdown-menu" id="${menuId}">
          ${getTemplate('menu-template')}
        </div>
      </button>
    </div>

    <div class="repost-label">
      <svg viewBox="0 0 24 24" class="repost-label-icon"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> You Reposted
    </div>

    ${quote ? `<div class="repost-quote-text">${escapeHTML(quote).replace(/\n/g, '<br>')}</div>` : ''}

    <div class="repost-quote-card">
      <div class="repost-quote-header">
        <div class="repost-quote-avatar">
          ${avatar ? `<img src="${avatar}" alt="${author}">` : '👤'}
        </div>
        <div class="repost-quote-meta">
          <div class="repost-quote-author">${author}</div>
          <div class="repost-quote-time">${time}</div>
        </div>
      </div>
      <div class="repost-quote-body">${body}</div>
      ${imagesHTML}
    </div>

    <div class="comments-data" style="display:none;"></div>

    ${buildReactions()}

    <span class="view-comments" onclick="openCommentModal(this)" style="display:none;">View more comments</span>

    <div class="comment-input-row always-visible" onclick="openCommentModal(this)">
      <div class="comment-avatar">
        <img src="${USER.photoSrc || '../assets/images/anon_avatar.jpg'}" alt="You" onerror="this.parentElement.textContent='👩'">
      </div>
      <input class="comment-input" placeholder="Write a comment..." readonly>
    </div>`;

  originalCard.dataset.repostCardId = repostId;

  // Store repost data in original post
  const repostsStore = originalCard.querySelector('.reposts-data');
  const rd = document.createElement('div');
  rd.className = 'repost-data';
  rd.dataset.author = 'Puto-Manila Organization'; // Current user
  rd.dataset.avatar = USER.photoSrc || '../assets/images/anon_avatar.jpg';
  rd.dataset.quote = quote;
  rd.dataset.hasQuote = quote ? 'true' : 'false';
  rd.dataset.time = now.toISOString();
  repostsStore.appendChild(rd);

  // Update repost count
  const countEl = originalCard.querySelector('.reaction-reposts-count');
  if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;

  // Update the repost info line below the post
  updateRepostInfo(originalCard);

  const feed = document.getElementById('feed');
  feed.insertBefore(card, feed.firstChild);
}

// ========================
// POST MODAL
// ========================
const fileInput = document.getElementById('modal-file-input');
const attachWrap = document.getElementById('modal-attachments');
const submitBtn = document.getElementById('modal-submit-btn');
const textarea = document.getElementById('postContent') || document.getElementById('post-textarea');

function updateSubmitButton() {
  const hasContent = textarea && textarea.value.trim().length > 0;
  const hasImages = attachWrap && attachWrap.querySelectorAll('.modal-attach-thumb').length > 0;
  submitBtn.disabled = !hasContent && !hasImages;
}

if (textarea && submitBtn) {
  textarea.addEventListener('input', updateSubmitButton);
}

document.getElementById('btn-add-photo').addEventListener('click', e => {
  e.stopPropagation();
  openPostModal();                              // open the modal first
  setTimeout(() => fileInput.click(), 150);    // then open file picker (slight delay so modal renders)
});

// Add event listener to the modal's add photo button
document.querySelector('.modal-add-photo-btn').addEventListener('click', e => {
  e.stopPropagation();
  fileInput.click();
});

fileInput.addEventListener('change', function () {
  Array.from(this.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      const thumb = document.createElement('img');
      thumb.src = ev.target.result;
      thumb.className = 'modal-attach-thumb';
      thumb.title = 'Click to remove';
      thumb.addEventListener('click', () => {
        thumb.remove();
        updateSubmitButton(); // Update button state after removing image
      });
      attachWrap.appendChild(thumb);
    };
    reader.readAsDataURL(file);
  });
  updateSubmitButton(); // Update button state after adding images
});

function openPostModal() {
  document.getElementById('postModal').classList.add('open');
  setTimeout(() => document.getElementById('postContent').focus(), 120);
  updateSubmitButton(); // Ensure button state is correct on open
}

function closePostModal() {
  document.getElementById('postModal').classList.remove('open');
}

function closeModalOnOverlay(e) {
  if (e.target === document.getElementById('postModal')) closePostModal();
}

function submitPost() {
  const content = document.getElementById('postContent').value.trim();

  // Collect attached images from the modal
  const thumbs = Array.from(attachWrap.querySelectorAll('.modal-attach-thumb'));

  if (!content && thumbs.length === 0) { showToast('Write something first!'); return; }

  const author = 'Puto-Manila Organization';
  const avatar = USER.photoSrc;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'long', day: '2-digit', year: 'numeric'
  }) + ' at ' + now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  // Build image HTML from collected thumbnails
  const imagesHTML = thumbs.length > 0
    ? `<div class="post-images">${thumbs.map(img => `<img src="${img.src}" class="post-image">`).join('')}</div>`
    : '';

  const menuId = 'menu-' + Date.now();
  const card = document.createElement('div');
  card.className = 'post-card';

  card.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">
        ${avatar ? `<img src="${avatar}" alt="${author}" onerror="this.parentElement.textContent='👩'">` : '👤'}
      </div>
      <div class="post-meta">
        <div class="post-author">${author}</div>
        <div class="post-time">${dateStr}</div>
      </div>
      <button class="post-menu" onclick="toggleMenu(event, '${menuId}')">
        <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
        <div class="dropdown-menu" id="${menuId}">
          ${getTemplate('menu-template')}
        </div>
      </button>
    </div>

    ${content ? `<div class="post-body">${escapeHTML(content).replace(/\n/g, '<br>')}</div>` : ''}

    ${imagesHTML}

    <div class="comments-data" style="display:none;"></div>
    <div class="reposts-data" style="display:none;"></div>

    ${getTemplate('post-template')}

    <div class="post-repost-info" onclick="viewReposts(event)" style="display:none;">
      <svg width="193px" height="193px" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M14.2893 5.70708C13.8988 5.31655 13.2657 5.31655 12.8751 5.70708L7.98768 10.5993C7.20729 11.3805 7.2076 12.6463 7.98837 13.427L12.8787 18.3174C13.2693 18.7079 13.9024 18.7079 14.293 18.3174C14.6835 17.9269 14.6835 17.2937 14.293 16.9032L10.1073 12.7175C9.71678 12.327 9.71678 11.6939 10.1073 11.3033L14.2893 7.12129C14.6799 6.73077 14.6799 6.0976 14.2893 5.70708Z" fill="#0F0F0F"></path> </g></svg>
      <span class="repost-info-text"></span>
    </div>

    <span class="view-comments" onclick="openCommentModal(this)" style="display:none;">View more comments</span>

    <div class="comment-input-row always-visible" onclick="openCommentModal(this)">
      <div class="comment-avatar">
        <img src="${USER.photoSrc || '../assets/images/anon_avatar.jpg'}" alt="You" onerror="this.parentElement.textContent='👩'">
      </div>
      <input class="comment-input" placeholder="Write a comment..." readonly>
    </div>`;

  const feed = document.getElementById('feed');
  feed.insertBefore(card, feed.firstChild);

  // Reset form
  document.getElementById('postContent').value = '';
  attachWrap.innerHTML = '';       // ← clear thumbnails from modal
  fileInput.value = '';            // ← reset file input so same files can be re-selected
  closePostModal();
  showToast('Post shared!');
}

// ========================
// DELETE POST
// ========================
function deletePost(e) {
  const card = e.target.closest('.post-card');
  card.style.transition = 'opacity 0.28s, transform 0.28s';
  card.style.opacity = '0';
  card.style.transform = 'scale(0.93)';
  setTimeout(() => card.remove(), 300);
  showToast('Post deleted.');
}

// ========================
// EDIT POST
// ========================
function editPost(e) {
  const card = e.target.closest('.post-card');
  const bodyEl = card.querySelector('.post-body');
  if (!bodyEl) return;

  const originalText = bodyEl.innerHTML.replace(/<br>/g, '\n').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');

  // Hide the body and show edit mode
  bodyEl.style.display = 'none';

  const editWrap = document.createElement('div');
  editWrap.className = 'post-edit-wrap';
  editWrap.innerHTML = `
    <textarea class="post-edit-textarea">${originalText}</textarea>
    <div class="post-edit-buttons">
      <button class="post-edit-save">Save</button>
      <button class="post-edit-cancel">Cancel</button>
    </div>
  `;

  bodyEl.parentNode.insertBefore(editWrap, bodyEl.nextSibling);

  const textarea = editWrap.querySelector('.post-edit-textarea');
  textarea.focus();

  // Save
  editWrap.querySelector('.post-edit-save').addEventListener('click', () => {
    const newText = textarea.value.trim();
    if (newText) {
      bodyEl.innerHTML = escapeHTML(newText).replace(/\n/g, '<br>');
    }
    editWrap.remove();
    bodyEl.style.display = '';
    showToast('Post updated.');
  });

  // Cancel
  editWrap.querySelector('.post-edit-cancel').addEventListener('click', () => {
    editWrap.remove();
    bodyEl.style.display = '';
  });
}

// ========================
// DROPDOWN MENU
// ========================
function toggleMenu(e, id) {
  e.stopPropagation();
  document.querySelectorAll('.dropdown-menu').forEach(m => {
    if (m.id !== id) m.classList.remove('open');
  });
  const menu = document.getElementById(id);
  if (menu) menu.classList.toggle('open');
}

document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
});

// ========================
// HELPER
// ========================
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function updateRepostInfo(card) {
  const info = card.querySelector('.post-repost-info');
  if (!info) return;

  const repostDatas = Array.from(card.querySelectorAll('.reposts-data .repost-data'));
  if (repostDatas.length === 0) {
    info.style.display = 'none';
    info.classList.remove('repost-active');
    return;
  }

  const count = repostDatas.length;
  const textEl = info.querySelector('.repost-info-text');
  if (textEl) textEl.textContent = count === 1
    ? 'View repost'
    : `View reposts (${count})`;

  info.style.display = 'flex';
  info.classList.add('repost-active');
}

// ========================
// COMMENT MODAL
// ========================

let _currentPostCard = null;
let _currentRepostBtn = null;

function openCommentModal(el) {
  const card = el.closest('.post-card');
  _currentPostCard = card;

  const list = document.getElementById('commentModalList');
  list.innerHTML = '';

  card.querySelectorAll('.comment-data').forEach((cd, cIdx) => {
    list.appendChild(buildCommentModalItem(
      cd.dataset.author,
      cd.dataset.avatar,
      cd.dataset.text,
      cd.dataset.time,
      cd.dataset.isOwn === 'true',
      cIdx
    ));
  });

  bindCommentActions();

  document.getElementById('commentModal').classList.add('open');
  setTimeout(() => document.getElementById('commentModalInput').focus(), 120);
}

function buildCommentModalItem(author, avatar, text, time, isOwn, cIdx) {
  const item = document.createElement('div');
  item.className = 'comment-modal-item';
  item.id = `comment-modal-item-${cIdx}`;
  item.innerHTML = `
    <div class="comment-modal-item-avatar">
      <img src="${avatar}" alt="${escapeHTML(author)}" onerror="this.parentElement.textContent='👩'">
    </div>
    <div class="comment-modal-item-content">
      <div class="comment-modal-item-bubble" id="comment-modal-bubble-${cIdx}">
        <div class="comment-modal-item-author">${escapeHTML(author)}</div>
        <div class="comment-modal-item-text" id="comment-modal-text-${cIdx}">${escapeHTML(text)}</div>
      </div>
      <div class="comment-edit-wrap" id="comment-modal-edit-${cIdx}">
        <input class="comment-edit-input" id="comment-modal-edit-input-${cIdx}" value="${escapeHTML(text)}"/>
        <button class="comment-edit-save" data-comment="${cIdx}">
          <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
        <button class="comment-edit-cancel" data-comment="${cIdx}">✕</button>
      </div>
      <div class="comment-modal-item-time" data-timestamp="${time}">${formatRelativeTime(new Date(time))}</div>
      ${isOwn ? `
      <div class="comment-item-actions">
        <button class="comment-action-btn edit-btn" data-comment="${cIdx}">
          <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
        <button class="comment-action-btn delete-btn" data-comment="${cIdx}">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Delete
        </button>
      </div>` : ''}
    </div>`;
  return item;
}

function bindCommentActions() {
  const list = document.getElementById('commentModalList');

  /* Edit button */
  list.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const c = this.dataset.comment;
      const bubble = document.getElementById(`comment-modal-bubble-${c}`);
      const edit = document.getElementById(`comment-modal-edit-${c}`);
      bubble.style.display = 'none';
      edit.classList.add('open');
      document.getElementById(`comment-modal-edit-input-${c}`).focus();
    });
  });

  /* Cancel edit */
  list.querySelectorAll('.comment-edit-cancel').forEach(btn => {
    btn.addEventListener('click', function () {
      const c = this.dataset.comment;
      const bubble = document.getElementById(`comment-modal-bubble-${c}`);
      const edit = document.getElementById(`comment-modal-edit-${c}`);
      bubble.style.display = '';
      edit.classList.remove('open');
    });
  });

  /* Save edit */
  list.querySelectorAll('.comment-edit-save').forEach(btn => {
    btn.addEventListener('click', function () {
      const c = this.dataset.comment;
      const input = document.getElementById(`comment-modal-edit-input-${c}`);
      const newText = input.value.trim();
      if (!newText) return;
      const textEl = document.getElementById(`comment-modal-text-${c}`);
      const bubble = document.getElementById(`comment-modal-bubble-${c}`);
      const edit = document.getElementById(`comment-modal-edit-${c}`);
      textEl.textContent = newText;
      bubble.style.display = '';
      edit.classList.remove('open');

      /* Sync back to comment-data store */
      if (_currentPostCard) {
        const cds = _currentPostCard.querySelectorAll('.comment-data');
        if (cds[c]) cds[c].dataset.text = newText;
        updateFeedCommentPreview(_currentPostCard);
      }

      // BACKEND TEAM: update comment in Firebase here
      console.log('Edit comment:', { comment: c, newText });
      showToast('Comment updated.');
    });
  });

  /* Delete button */
  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const c = this.dataset.comment;
      const item = document.getElementById(`comment-modal-item-${c}`);
      item.style.transition = 'opacity 0.2s, transform 0.2s';
      item.style.opacity = '0';
      item.style.transform = 'translateX(12px)';
      setTimeout(() => item.remove(), 200);

      /* Sync back to comment-data store */
      if (_currentPostCard) {
        const cds = _currentPostCard.querySelectorAll('.comment-data');
        if (cds[c]) cds[c].remove();
        const countEl = _currentPostCard.querySelector('.reaction-comments-count');
        if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
        updateFeedCommentPreview(_currentPostCard);
      }

      // BACKEND TEAM: delete comment from Firebase here
      console.log('Delete comment:', { comment: c });
      showToast('Comment deleted.');
    });
  });
}

function closeCommentModal() {
  document.getElementById('commentModal').classList.remove('open');
  document.getElementById('commentModalInput').value = '';
  _currentPostCard = null;
}

function closeCommentModalOnOverlay(e) {
  if (e.target === document.getElementById('commentModal')) closeCommentModal();
}

function handleModalCommentKey(e) {
  if (e.key === 'Enter') submitModalComment();
}

function submitModalComment() {
  const input = document.getElementById('commentModalInput');
  const text = input.value.trim();
  if (!text) return;

  const now = new Date();
  const list = document.getElementById('commentModalList');
  const cIdx = list.querySelectorAll('.comment-modal-item').length;
  list.appendChild(buildCommentModalItem('Puto-Manila Organization', USER.photoSrc || '../assets/images/anon_avatar.jpg', text, now.toISOString(), true, cIdx));
  list.scrollTop = list.scrollHeight;

  bindCommentActions();

  if (_currentPostCard) {
    const store = _currentPostCard.querySelector('.comments-data');
    const cd = document.createElement('div');
    cd.className = 'comment-data';
    cd.dataset.author = 'Puto-Manila Organization';
    cd.dataset.avatar = USER.photoSrc || '../assets/images/anon_avatar.jpg';
    cd.dataset.text = text;
    cd.dataset.time = now.toISOString();
    cd.dataset.isOwn = 'true';
    store.appendChild(cd);

    const countEl = _currentPostCard.querySelector('.reaction-comments-count');
    if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;

    updateFeedCommentPreview(_currentPostCard);
  }

  input.value = '';
  showToast('Comment posted!');
}

// ========================
// REPOST MODAL
// ========================
let _repostSubmitted = false;

function openRepostModal(btn) {
  _currentRepostBtn = btn;
  _repostSubmitted = false;
  document.getElementById('repostModal').classList.add('open');
  document.getElementById('repostContent').focus();
}

function closeRepostModal() {
  if (!_repostSubmitted && _currentRepostBtn) {
    // Cancelled, so untoggle the button
    _currentRepostBtn.classList.remove('repost-active');
    _currentRepostBtn.lastChild.textContent = ' Repost';
  }
  document.getElementById('repostModal').classList.remove('open');
  document.getElementById('repostContent').value = '';
  _currentRepostBtn = null;
  _repostSubmitted = false;
}

function closeRepostModalOnOverlay(e) {
  if (e.target === document.getElementById('repostModal')) closeRepostModal();
}

function submitRepost() {
  const textarea = document.getElementById('repostContent');
  const quote = textarea.value.trim();
  _repostSubmitted = true;
  if (_currentRepostBtn) {
    createRepostCard(_currentRepostBtn, quote);
    showToast('You Reposted!');
  }
  closeRepostModal();
}

// ========================
// REPOST VIEW MODAL
// ========================
let _currentRepostViewCard = null;

function viewReposts(e) {
  const card = e.target.closest('.post-card');
  _currentRepostViewCard = card;

  const list = document.getElementById('repostViewModalList');
  list.innerHTML = '';

  card.querySelectorAll('.repost-data').forEach((rd, rIdx) => {
    list.appendChild(buildRepostViewItem(
      rd.dataset.author,
      rd.dataset.avatar,
      rd.dataset.quote,
      rd.dataset.hasQuote === 'true',
      rd.dataset.time,
      rIdx
    ));
  });

  document.getElementById('repostViewModal').classList.add('open');
}

function buildRepostViewItem(author, avatar, quote, hasQuote, time, rIdx) {
  const item = document.createElement('div');
  item.className = 'comment-modal-item';
  item.id = `repost-view-item-${rIdx}`;
  item.innerHTML = `
    <div class="comment-modal-item-avatar">
      <img src="${avatar}" alt="${escapeHTML(author)}" onerror="this.parentElement.textContent='👩'">
    </div>
    <div class="comment-modal-item-content">
      <div class="comment-modal-item-bubble">
        <div class="comment-modal-item-author">${escapeHTML(author)}</div>
        ${hasQuote ? `<div class="comment-modal-item-text">${escapeHTML(quote)}</div>` : '<div class="reposted-without-quote"><em>Reposted without quote</em></div>'}
      </div>
      <div class="comment-modal-item-time" data-timestamp="${time}">${formatRelativeTime(new Date(time))}</div>
    </div>`;
  return item;
}

function closeRepostViewModal() {
  document.getElementById('repostViewModal').classList.remove('open');
  _currentRepostViewCard = null;
}

function closeRepostViewModalOnOverlay(e) {
  if (e.target === document.getElementById('repostViewModal')) closeRepostViewModal();
}

function updateFeedCommentPreview(card) {
  const allComments = card.querySelectorAll('.comment-data');
  const count = allComments.length;
  const viewMore = card.querySelector('.view-comments');
  let preview = card.querySelector('.feed-comment-preview');

  if (viewMore) viewMore.style.display = count > 1 ? 'block' : 'none';

  if (count > 0) {
    const latest = allComments[allComments.length - 1];
    if (!preview) {
      preview = document.createElement('div');
      preview.className = 'feed-comment-preview';
      const ref = card.querySelector('.view-comments') || card.querySelector('.comment-input-row');
      card.insertBefore(preview, ref);
    }
    preview.innerHTML = `
      <div class="comment-modal-item">
        <div class="comment-modal-item-avatar">
          <img src="${latest.dataset.avatar}" alt="${escapeHTML(latest.dataset.author)}" onerror="this.parentElement.textContent='👩'">
        </div>
        <div class="comment-modal-item-content">
          <div class="comment-modal-item-bubble">
            <div class="comment-modal-item-author">${escapeHTML(latest.dataset.author)}</div>
            <div class="comment-modal-item-text">${escapeHTML(latest.dataset.text)}</div>
          </div>
          <div class="comment-modal-item-time" data-timestamp="${latest.dataset.time}">${formatRelativeTime(new Date(latest.dataset.time))}</div>
        </div>
      </div>`;
  } else if (preview) {
    preview.remove();
  }
}

// ========================
// SUBMIT BUTTON OPACITY
// ========================
document.addEventListener('DOMContentLoaded', () => {
  const commentInput = document.getElementById('commentModalInput');
  const commentSubmit = document.querySelector('.comment-modal-submit');
  commentInput.addEventListener('input', () => {
    commentSubmit.style.opacity = commentInput.value.trim() ? '1' : '0.35';
  });

  // Profile photo change
  document.querySelector('.profile-avatar').addEventListener('click', () => {
    document.getElementById('profilePhotoInput').click();
  });

  document.getElementById('profilePhotoInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const imgSrc = e.target.result;
        document.querySelector('.profile-avatar-inner').src = imgSrc;
        document.querySelector('.post-input-img').src = imgSrc;
        document.querySelector('.sidebar-avatar-img').src = imgSrc;
        // Update USER.photoSrc
        USER.photoSrc = imgSrc;

        // Update modal avatar
        const modalAvatarEl = document.getElementById('modal-avatar');
        modalAvatarEl.innerHTML = `<img src="${imgSrc}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;

        // Update all post avatars on the page
        document.querySelectorAll('.post-avatar img').forEach(avatar => {
          // Only update if the post is from the current user (not anonymous/reposts)
          const postCard = avatar.closest('.post-card');
          const postAuthor = postCard?.querySelector('.post-author')?.textContent;
          if (postAuthor === 'Puto-Manila Organization') {
            avatar.src = imgSrc;
          }
        });

        // Update repost quote avatars in all posts
        document.querySelectorAll('.repost-quote-avatar img').forEach(avatar => {
          const repostCard = avatar.closest('.repost-quote-card');
          const repostAuthor = repostCard?.querySelector('.repost-quote-author')?.textContent;
          if (repostAuthor === 'Puto-Manila Organization') {
            avatar.src = imgSrc;
          }
        });

        // Update comment input avatars in all post cards
        document.querySelectorAll('.comment-input-row .comment-avatar img').forEach(avatar => {
          avatar.src = imgSrc;
        });

        // Update comment modal avatars in all posts
        document.querySelectorAll('.comment-modal-item-avatar img').forEach(avatar => {
          const commentItem = avatar.closest('.comment-modal-item');
          const commentAuthor = commentItem?.querySelector('.comment-modal-item-author')?.textContent;
          if (commentAuthor === 'Puto-Manila Organization') {
            avatar.src = imgSrc;
          }
        });

        // Update comment modal input avatar
        const commentModalAvatar = document.querySelector('.comment-modal-avatar img');
        if (commentModalAvatar) {
          commentModalAvatar.src = imgSrc;
        }

        // Update repost view modal avatars
        document.querySelectorAll('#repostViewModal .comment-modal-item-avatar img').forEach(avatar => {
          const repostViewItem = avatar.closest('.comment-modal-item');
          const repostViewAuthor = repostViewItem?.querySelector('.comment-modal-item-author')?.textContent;
          if (repostViewAuthor === 'Puto-Manila Organization') {
            avatar.src = imgSrc;
          }
        });
      };
      reader.readAsDataURL(file);
    }
  });

  // Cover photo change
  document.querySelector('.banner-img').addEventListener('click', () => {
    document.getElementById('coverPhotoInput').click();
  });

  document.getElementById('coverPhotoInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        document.querySelector('.banner-img').src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Event listener for comment preview bubble
  document.addEventListener('click', function (e) {
    const bubble = e.target.closest('.feed-comment-preview .comment-modal-item-bubble');
    if (bubble) {
      openCommentModal(bubble);
    }
  });

  // Update comment times every minute
  setInterval(() => {
    document.querySelectorAll('.comment-modal-item-time').forEach(el => {
      const timeStr = el.dataset.timestamp;
      if (timeStr) {
        el.textContent = formatRelativeTime(new Date(timeStr));
      }
    });
  }, 60000); // 1 minute

  (function () {
    const navWrap = document.getElementById('sidebar-nav');
    const teardrop = document.getElementById('nav-teardrop');
    const navBtns = Array.from(navWrap.querySelectorAll('.nav-btn'));
    const profBtn = document.getElementById('sidebar-avatar-wrap');
    const allBtns = [...navBtns, profBtn];
    const TD_BASE_H = 66;

    function moveTo(item) {
      const wrapRect = navWrap.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const centerY = itemRect.top + itemRect.height / 2 - wrapRect.top;
      teardrop.style.top = (centerY - TD_BASE_H / 2) + 'px';
    }

    navBtns.forEach(item => {
      item.addEventListener('click', function () {
        allBtns.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        moveTo(this);

        const route = this.dataset.route;
        if (route === 'home') window.location.href = '../pages/homepage.html';
        if (route === 'campus news') window.location.href = '../pages/campus_news.html';
        if (route === 'campus') window.location.href = '../pages/campus_directory.html';
      });
    });

    profBtn.addEventListener('click', function () {
      allBtns.forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      moveTo(this);
      window.location.href = '../pages/profile.html';
    });

    /* Snap to active button on load */
    let active = navWrap.querySelector('.nav-btn.active, .nav-btn-profile.active');

    /* Default to profile if none active */
    if (!active) {
      active = profBtn;
      profBtn.classList.add('active');
    }

    teardrop.style.transition = 'none';

    requestAnimationFrame(() => requestAnimationFrame(() => {
      moveTo(active);
      teardrop.style.transition = '';
    }));

  })();

});