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
// CHANGE PHOTO MENU
// ========================
function toggleChangePhotoMenu(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('changePhotoDropdown');
  const btn      = e.currentTarget;
  const rect     = btn.getBoundingClientRect();

  dropdown.style.top   = (rect.bottom + 8) + 'px';
  dropdown.style.right = (window.innerWidth - rect.right) + 'px';
  dropdown.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const wrap     = document.querySelector('.change-photo-wrap');
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
    // Read base BEFORE toggling
    const countEl = btn.querySelector('.reaction-likes-count');
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
        p.style.top  = `${cy - 3}px`;
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
    // Read base BEFORE toggling
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
      countSpan.textContent = fmt(base + 1);
      btn.lastChild.textContent = ' Reposted';
      createRepostCard(btn);
      showToast('You Reposted!');
    } else {
      countSpan.textContent = fmt(base);
      btn.lastChild.textContent = ' Repost';
      const originalCard = btn.closest('.post-card');
      const repostId = originalCard.dataset.repostCardId;
      if (repostId) {
        const repostCard = document.getElementById(repostId);
        if (repostCard) repostCard.remove();
        delete originalCard.dataset.repostCardId;
      }
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
        <span class="reaction-likes-count">${fmt(likes)}</span> Heart
      </button>
      <button class="feed-reaction-btn" ${postAttr} data-type="comment">
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span class="reaction-comments-count">${comments}</span> Comment
      </button>
      <button class="feed-reaction-btn" ${postAttr} data-type="repost">
        <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        <span class="reaction-reposts-count">${fmt(reposts)}</span> Repost
      </button>
    </div>`;
}

// ========================
// REPOST CARD
// ========================
function createRepostCard(btn) {
  const originalCard = btn.closest('.post-card');

  const author   = originalCard.querySelector('.post-author')?.textContent || 'Unknown';
  const time     = originalCard.querySelector('.post-time')?.textContent   || '';
  const body     = originalCard.querySelector('.post-body')?.innerHTML     || '';
  const avatarEl = originalCard.querySelector('.post-avatar img');
  const avatar   = avatarEl ? avatarEl.src : '';

  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'long', day: '2-digit', year: 'numeric'
  }) + ' at ' + now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  const menuId   = 'menu-' + Date.now();
  const repostId = 'repost-' + Date.now();
  const card     = document.createElement('div');
  card.className = 'post-card';
  card.id        = repostId;

  // Use getTemplate() to correctly read from <template> elements
  card.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">
        <img src="../assets/images/anon_avatar.jpg" alt="Samantha" onerror="this.parentElement.textContent='👩'">
      </div>
      <div class="post-meta">
        <div class="post-author">Puto Imnida</div>
        <div class="post-time">${dateStr}</div>
      </div>
      <div class="post-menu" onclick="toggleMenu(event, '${menuId}')">···
        <div class="dropdown-menu" id="${menuId}">
          ${getTemplate('menu-template')}
        </div>
      </div>
    </div>

    <div class="repost-label">
      <img src="../assets/images/reposted.png" class="repost-label-icon"> You Reposted
    </div>

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
    </div>

    <div class="comments-data" style="display:none;"></div>

    ${buildReactions()}

    <span class="view-comments" onclick="openCommentModal(this)" style="display:none;">View more comments</span>

    <div class="comment-input-row always-visible" onclick="openCommentModal(this)">
      <div class="comment-avatar">
        <img src="../assets/images/anon_avatar.jpg" alt="You" onerror="this.parentElement.textContent='👩'">
      </div>
      <input class="comment-input" placeholder="Write a comment..." readonly>
    </div>`;

  originalCard.dataset.repostCardId = repostId;

  const feed = document.getElementById('feed');
  feed.insertBefore(card, feed.firstChild);
}

// ========================
// POST MODAL
// ========================
function openPostModal() {
  document.getElementById('postModal').classList.add('open');
  setTimeout(() => document.getElementById('postContent').focus(), 120);
}

function closePostModal() {
  document.getElementById('postModal').classList.remove('open');
}

function closeModalOnOverlay(e) {
  if (e.target === document.getElementById('postModal')) closePostModal();
}

function submitPost() {
  const content = document.getElementById('postContent').value.trim();
  if (!content) { showToast('Write something first!'); return; }

  const isAnon  = document.getElementById('anonToggle').checked;
  const author  = isAnon ? 'Anonymous' : 'Puto Imnida';
  const avatar  = isAnon ? '../assets/images/anon_avatar.jpg' : '../assets/images/anon_avatar.jpg';

  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'long', day: '2-digit', year: 'numeric'
  }) + ' at ' + now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  const menuId = 'menu-' + Date.now();
  const card   = document.createElement('div');
  card.className = 'post-card';

  // Use getTemplate() to correctly read from <template> elements
  card.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">
        ${avatar ? `<img src="${avatar}" alt="${author}" onerror="this.parentElement.textContent='👩'">` : '👤'}
      </div>
      <div class="post-meta">
        <div class="post-author">${author}</div>
        <div class="post-time">${dateStr}</div>
      </div>
      <div class="post-menu" onclick="toggleMenu(event, '${menuId}')">···
        <div class="dropdown-menu" id="${menuId}">
          ${getTemplate('menu-template')}
        </div>
      </div>
    </div>

    <div class="post-body">${escapeHTML(content).replace(/\n/g, '<br>')}</div>

    <div class="comments-data" style="display:none;"></div>

    ${getTemplate('post-template')}

    <span class="view-comments" onclick="openCommentModal(this)" style="display:none;">View more comments</span>

    <div class="comment-input-row always-visible" onclick="openCommentModal(this)">
      <div class="comment-avatar">
        <img src="../assets/images/anon_avatar.jpg" alt="You" onerror="this.parentElement.textContent='👩'">
      </div>
      <input class="comment-input" placeholder="Write a comment..." readonly>
    </div>`;

  const feed = document.getElementById('feed');
  feed.insertBefore(card, feed.firstChild);
  document.getElementById('postContent').value = '';
  document.getElementById('anonToggle').checked = false;
  closePostModal();
  showToast('Post shared!');
}

// ========================
// DELETE POST
// ========================
function deletePost(e) {
  const card = e.target.closest('.post-card');
  card.style.transition = 'opacity 0.28s, transform 0.28s';
  card.style.opacity    = '0';
  card.style.transform  = 'scale(0.93)';
  setTimeout(() => card.remove(), 300);
  showToast('Post deleted.');
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
  if (n >= 1000)    return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

// ========================
// COMMENT MODAL
// ========================

let _currentPostCard = null;

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
      <div class="comment-modal-item-time">${time}</div>
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
      const c      = this.dataset.comment;
      const bubble = document.getElementById(`comment-modal-bubble-${c}`);
      const edit   = document.getElementById(`comment-modal-edit-${c}`);
      bubble.style.display = 'none';
      edit.classList.add('open');
      document.getElementById(`comment-modal-edit-input-${c}`).focus();
    });
  });

  /* Cancel edit */
  list.querySelectorAll('.comment-edit-cancel').forEach(btn => {
    btn.addEventListener('click', function () {
      const c      = this.dataset.comment;
      const bubble = document.getElementById(`comment-modal-bubble-${c}`);
      const edit   = document.getElementById(`comment-modal-edit-${c}`);
      bubble.style.display = '';
      edit.classList.remove('open');
    });
  });

  /* Save edit */
  list.querySelectorAll('.comment-edit-save').forEach(btn => {
    btn.addEventListener('click', function () {
      const c       = this.dataset.comment;
      const input   = document.getElementById(`comment-modal-edit-input-${c}`);
      const newText = input.value.trim();
      if (!newText) return;
      const textEl = document.getElementById(`comment-modal-text-${c}`);
      const bubble = document.getElementById(`comment-modal-bubble-${c}`);
      const edit   = document.getElementById(`comment-modal-edit-${c}`);
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
      const c    = this.dataset.comment;
      const item = document.getElementById(`comment-modal-item-${c}`);
      item.style.transition = 'opacity 0.2s, transform 0.2s';
      item.style.opacity    = '0';
      item.style.transform  = 'translateX(12px)';
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
  const text  = input.value.trim();
  if (!text) return;

  const list = document.getElementById('commentModalList');
  const cIdx = list.querySelectorAll('.comment-modal-item').length;
  list.appendChild(buildCommentModalItem('Puto Imnida', '../assets/images/anon_avatar.jpg', text, 'Just now', true, cIdx));
  list.scrollTop = list.scrollHeight;

  bindCommentActions();

  if (_currentPostCard) {
    const store = _currentPostCard.querySelector('.comments-data');
    const cd = document.createElement('div');
    cd.className        = 'comment-data';
    cd.dataset.author   = 'Puto Imnida';
    cd.dataset.avatar   = '../assets/images/anon_avatar.jpg';
    cd.dataset.text     = text;
    cd.dataset.time     = 'Just now';
    cd.dataset.isOwn    = 'true';
    store.appendChild(cd);

    const countEl = _currentPostCard.querySelector('.reaction-comments-count');
    if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;

    updateFeedCommentPreview(_currentPostCard);
  }

  input.value = '';
  showToast('Comment posted!');
}

function updateFeedCommentPreview(card) {
  const allComments = card.querySelectorAll('.comment-data');
  const count       = allComments.length;
  const viewMore    = card.querySelector('.view-comments');
  let   preview     = card.querySelector('.feed-comment-preview');

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
          <div class="comment-modal-item-time">${latest.dataset.time}</div>
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
  const postContent = document.getElementById('postContent');
  const postSubmit  = document.querySelector('.modal-submit-btn');
  postContent.addEventListener('input', () => {
    postSubmit.style.opacity = postContent.value.trim() ? '1' : '0.35';
  });

  const commentInput  = document.getElementById('commentModalInput');
  const commentSubmit = document.querySelector('.comment-modal-submit');
  commentInput.addEventListener('input', () => {
    commentSubmit.style.opacity = commentInput.value.trim() ? '1' : '0.35';
  });

  const anonToggle = document.getElementById('anonToggle');
  anonToggle.addEventListener('change', function () {
    const nameEl   = document.getElementById('modal-user-name');
    const avatarEl = document.getElementById('modal-avatar');
    if (this.checked) {
      nameEl.textContent = 'Anonymous Puto';
      avatarEl.innerHTML = `<img src="../assets/images/anon_avatar.jpg" alt="Anonymous" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      nameEl.textContent = USER.name;
      avatarEl.innerHTML = USER.photoSrc
        ? `<img src="${USER.photoSrc}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    }
  });

    (function () {
    const navWrap  = document.getElementById('sidebar-nav');
    const teardrop = document.getElementById('nav-teardrop');
    const navBtns  = Array.from(navWrap.querySelectorAll('.nav-btn'));
    const profBtn  = document.getElementById('sidebar-avatar-wrap');
    const allBtns  = [...navBtns, profBtn];
    const TD_BASE_H = 66;

    function moveTo(item) {
      const wrapRect = navWrap.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const centerY  = itemRect.top + itemRect.height / 2 - wrapRect.top;
      teardrop.style.top = (centerY - TD_BASE_H / 2) + 'px';
    }

    navBtns.forEach(item => {
      item.addEventListener('click', function () {
        allBtns.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        moveTo(this);

        const route = this.dataset.route;
        if (route === 'home')        window.location.href = '../pages/homepage.html';
        if (route === 'campus news') window.location.href = '../pages/campus_news.html';
        if (route === 'campus')      window.location.href = '../pages/campus_directory.html';
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