const avatarImg = document.querySelector('#modal-avatar img');
const USER = {
  name: document.getElementById('modal-user-name').textContent,
  photoSrc: avatarImg ? avatarImg.src : ''
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

  const userAvatar = USER.photoSrc || '../assets/images/anon_avatar.jpg';

  card.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">
        <img src="${userAvatar}" alt="${escapeHTML(USER.name)}" onerror="this.parentElement.textContent='👩'">
      </div>
      <div class="post-meta">
        <div class="post-author">${escapeHTML(USER.name)}</div>
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
          ${avatar ? `<img src="${avatar}" alt="${escapeHTML(author)}">` : '👤'}
        </div>
        <div class="repost-quote-meta">
          <div class="repost-quote-author">${escapeHTML(author)}</div>
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
        <img src="${userAvatar}" alt="You" onerror="this.parentElement.textContent='👩'">
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

  const author = USER.name;
  const avatar = USER.photoSrc || '../assets/images/anon_avatar.jpg';

  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'long', day: '2-digit', year: 'numeric'
  }) + ' at ' + now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  const menuId = 'menu-' + Date.now();
  const card   = document.createElement('div');
  card.className = 'post-card';

  card.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">
        <img src="${avatar}" alt="${escapeHTML(author)}" onerror="this.parentElement.textContent='👩'">
      </div>
      <div class="post-meta">
        <div class="post-author">${escapeHTML(author)}</div>
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
        <img src="${avatar}" alt="You" onerror="this.parentElement.textContent='👩'">
      </div>
      <input class="comment-input" placeholder="Write a comment..." readonly>
    </div>`;

  const feed = document.getElementById('feed');
  feed.insertBefore(card, feed.firstChild);
  document.getElementById('postContent').value = '';
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

  card.querySelectorAll('.comment-data').forEach(cd => {
    list.appendChild(buildCommentModalItem(
      cd.dataset.author,
      cd.dataset.avatar,
      cd.dataset.text,
      cd.dataset.time
    ));
  });

  document.getElementById('commentModal').classList.add('open');
  setTimeout(() => document.getElementById('commentModalInput').focus(), 120);
}

function buildCommentModalItem(author, avatar, text, time) {
  const item = document.createElement('div');
  item.className = 'comment-modal-item';
  item.innerHTML = `
    <div class="comment-modal-item-avatar">
      <img src="${avatar}" alt="${escapeHTML(author)}" onerror="this.parentElement.textContent='👩'">
    </div>
    <div class="comment-modal-item-content">
      <div class="comment-modal-item-bubble">
        <div class="comment-modal-item-author">${escapeHTML(author)}</div>
        <div class="comment-modal-item-text">${escapeHTML(text)}</div>
      </div>
      <div class="comment-modal-item-time">${time}</div>
    </div>`;
  return item;
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

  const userAvatar = USER.photoSrc || '../assets/images/anon_avatar.jpg';
  const list = document.getElementById('commentModalList');
  list.appendChild(buildCommentModalItem(USER.name, userAvatar, text, 'Just now'));
  list.scrollTop = list.scrollHeight;

  if (_currentPostCard) {
    const store = _currentPostCard.querySelector('.comments-data');
    const cd = document.createElement('div');
    cd.className      = 'comment-data';
    cd.dataset.author = USER.name;
    cd.dataset.avatar = userAvatar;
    cd.dataset.text   = text;
    cd.dataset.time   = 'Just now';
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

  // Nav buttons — click sets active, no mouseleave clearing
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

});