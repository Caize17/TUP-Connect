
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
// LIKE
// ========================
function toggleLike(btn, base) {
  const liked = btn.classList.toggle('liked');
  const icon  = btn.querySelector('.icon');
  const count = btn.querySelector('.count');
  if (icon.tagName === 'IMG') {
    icon.src = liked ? '../assets/images/heart_reacted.png' : '../assets/images/heart_react.png';
  }
  count.textContent = liked ? base + 1 : base;
  btn.style.transform = 'scale(1.15)';
  setTimeout(() => (btn.style.transform = ''), 180);
}

// ========================
// REPOST
// ========================
function toggleRepost(btn) {
  const reposted = btn.classList.toggle('reposted');
  const icon     = btn.querySelector('.icon');
  const label    = btn.querySelector('span:not(.icon)');

  if (icon.tagName === 'IMG') {
    icon.src = reposted ? '../assets/images/reposted.png' : '../assets/images/repost.png';
  }
  if (label) label.textContent = reposted ? 'Reposted' : 'Repost';
  btn.style.color = reposted ? 'var(--maroon)' : '';

  if (reposted) {
    createRepostCard(btn);
    showToast('Reposted!');
  } else {
    // Remove repost card if un-reposted
    const originalCard = btn.closest('.post-card');
    const repostId     = originalCard.dataset.repostCardId;
    if (repostId) {
      const repostCard = document.getElementById(repostId);
      if (repostCard) repostCard.remove();
      delete originalCard.dataset.repostCardId;
    }
    showToast('Repost removed!');
  }
}

function createRepostCard(btn) {
  const originalCard = btn.closest('.post-card');

  // Get original post info
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

  card.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">
        <img src="../assets/images/anon_avatar.jpg" alt="Samantha" onerror="this.parentElement.textContent='👩'">
      </div>
      <div class="post-meta">
        <div class="post-author">Samantha Egar</div>
        <div class="post-time">${dateStr}</div>
      </div>
      <div class="post-menu" onclick="toggleMenu(event, '${menuId}')">···
        <div class="dropdown-menu" id="${menuId}">
          ${document.getElementById('menu-template').innerHTML}
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

    ${document.getElementById('post-template').innerHTML}

    <span class="view-comments" onclick="openCommentModal(this)" style="display:none;">View more comments</span>

    <div class="comment-input-row always-visible" onclick="openCommentModal(this)">
      <div class="comment-avatar">
        <img src="../assets/images/anon_avatar.jpg" alt="You" onerror="this.parentElement.textContent='👩'">
      </div>
      <input class="comment-input" placeholder="Write a comment..." readonly>
    </div>`;

  // Store reference so we can remove it if un-reposted
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
  const author  = isAnon ? 'Anonymous' : 'Samantha Egar';
  const avatar  = isAnon ? '' : '../assets/images/anon_avatar.jpg';

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
        ${avatar ? `<img src="${avatar}" alt="${author}" onerror="this.parentElement.textContent='👩'">` : '👤'}
      </div>
      <div class="post-meta">
        <div class="post-author">${author}</div>
        <div class="post-time">${dateStr}</div>
      </div>
      <div class="post-menu" onclick="toggleMenu(event, '${menuId}')">···
        <div class="dropdown-menu" id="${menuId}">
          ${document.getElementById('menu-template').innerHTML}
        </div>
      </div>
    </div>

    <div class="post-body">${escapeHTML(content).replace(/\n/g, '<br>')}</div>

    <div class="comments-data" style="display:none;"></div>

    ${document.getElementById('post-template').innerHTML}

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

  const list = document.getElementById('commentModalList');
  list.appendChild(buildCommentModalItem('Samantha Egar', '../assets/images/anon_avatar.jpg', text, 'Just now'));
  list.scrollTop = list.scrollHeight;

  if (_currentPostCard) {
    const store = _currentPostCard.querySelector('.comments-data');
    const cd = document.createElement('div');
    cd.className    = 'comment-data';
    cd.dataset.author = 'Samantha Egar';
    cd.dataset.avatar = '../assets/images/anon_avatar.jpg';
    cd.dataset.text   = text;
    cd.dataset.time   = 'Just now';
    store.appendChild(cd);

    const countEl = _currentPostCard.querySelector('.comment-count');
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

  // Show "View more comments" only when more than 1 comment
  if (viewMore) viewMore.style.display = count > 1 ? 'block' : 'none';

  // Show the latest comment as a preview in the feed
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
  // Post modal input
  const postContent = document.getElementById('postContent');
  const postSubmit  = document.querySelector('.modal-submit-btn');
  postContent.addEventListener('input', () => {
    postSubmit.style.opacity = postContent.value.trim() ? '1' : '0.35';
  });

  // Comment modal input — permanent listener
  const commentInput  = document.getElementById('commentModalInput');
  const commentSubmit = document.querySelector('.comment-modal-submit');
  commentInput.addEventListener('input', () => {
    commentSubmit.style.opacity = commentInput.value.trim() ? '1' : '0.35';
  });

  const navBtns = document.querySelectorAll('.nav-btn');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
    btn.addEventListener('mouseleave', () => {
      updateNav(navBtns);
    });
    
  // set third button active by default
  navBtns[2].classList.add('active');
});
