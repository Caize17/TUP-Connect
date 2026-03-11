let USER = {
  name: "Loading...",
  email: "",
  studentId: "",
  photoSrc: null,
  logoSrc:   "../assets/images/logo.png",
};

let POST = null;
let FEED_POSTS = [];

(function () {

  /* ════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════ */

  /** Format large numbers: 1200 → "1.2k" */
  function fmt(n) {
    return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : n;
  }

  /** Build avatar HTML for a given photoSrc and name */
  function avatarHtmlFor(photoSrc, name) {
    return photoSrc
      ? `<img src="${photoSrc}" alt="${name}"/>`
      : `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  }

  /* ════════════════════════════════════════
     TOAST
  ════════════════════════════════════════ */

  let toastTimer = null;

  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  /* ════════════════════════════════════════
     LOGO
  ════════════════════════════════════════ */

  if (USER.logoSrc) {
    document.getElementById('sidebar-logo-inner').outerHTML =
      `<img class="TUP-Konek-logo" src="${USER.logoSrc}" alt="TUP Konek logo"/>`;
  }

  /* ════════════════════════════════════════
     USER DATA
  ════════════════════════════════════════ */

  document.getElementById('profile-name').textContent    = USER.name      || '—';
  document.getElementById('profile-email').textContent   = USER.email     || '—';
  document.getElementById('profile-id').textContent      = USER.studentId || '—';
  document.getElementById('modal-user-name').textContent = USER.name      || 'Guest';

  if (USER.photoSrc) {
    document.getElementById('profile-photo-wrap').innerHTML =
      `<img class="profile-photo" src="${USER.photoSrc}" alt="Profile photo"/>`;

    const navProfileAvatar = document.getElementById('nav-profile-avatar');
    if (navProfileAvatar) {
      navProfileAvatar.innerHTML =
        `<img src="${USER.photoSrc}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    }

    const el = document.getElementById('comment-avatar-wrap');
    el.innerHTML = `<img src="${USER.photoSrc}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`;

    document.getElementById('modal-avatar').innerHTML =
      `<img src="${USER.photoSrc}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  }

  /* ════════════════════════════════════════
     PINNED ANNOUNCEMENT
  ════════════════════════════════════════ */

  if (POST) {
    document.getElementById('count-likes').textContent    = fmt(POST.likes);
    document.getElementById('count-thumbsup').textContent = fmt(POST.thumbsUp);
    document.getElementById('count-reposts').textContent  = fmt(POST.reposts);
    document.getElementById('post-timestamp').textContent = POST.timestamp;
    document.getElementById('post-title').textContent     = POST.title;
    document.getElementById('post-body').innerHTML        = POST.body.map(p => `<p>${p}</p>`).join('');
    document.getElementById('poster-org').textContent      = POST.posterOrg;
    document.getElementById('poster-headline').textContent = POST.posterHeadline;
    document.getElementById('poster-subtext').textContent  = POST.posterSubtext;
    document.getElementById('poster-date').textContent     = POST.posterDate;
    document.getElementById('poster-desc').textContent     = POST.posterDesc;
    document.getElementById('poster-handle').textContent   = POST.posterHandle + ' ✉';
    document.getElementById('poster-colleges').innerHTML   =
      POST.posterColleges.map(c => `<div class="p-college">${c}</div>`).join('');
  } else {
    const annCard = document.getElementById('ann-card');
    if (annCard) {
      annCard.innerHTML = `
        <div class="pinned-empty">
          <svg viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-5-5.917V4a1 1 0 1 0-2 0v1.083A6 6 0 0 0 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"/></svg>
          <div class="pinned-empty-text">No announcements yet</div>
        </div>`;
    }
  }

  /* ── View More / Less for pinned announcement ── */
  if (POST) {
    (function () {
      const body = document.getElementById('post-body');
      const btn  = document.getElementById('view-more-btn');
      let expanded = false;
      body.classList.add('is-clamped');
      requestAnimationFrame(() => {
        if (body.scrollHeight > body.clientHeight) {
          btn.classList.add('visible');
        } else {
          body.classList.remove('is-clamped');
        }
      });
      btn.addEventListener('click', function () {
        expanded = !expanded;
        body.classList.toggle('is-clamped', !expanded);
        btn.textContent = expanded ? 'View less ▴' : 'View more ▾';
      });
    })();

    /* ── Media / image grid ── */
    const mediaGridEl2 = document.getElementById('media-grid');
    const imgs = POST.images || [];
    if (imgs.length > 0) {
      document.getElementById('poster-card-inner').style.display = 'none';
      const shown    = Math.min(imgs.length, 4);
      const extra    = imgs.length - shown;
      const countCls = imgs.length === 1 ? 'count-1'
                     : imgs.length === 2 ? 'count-2'
                     : imgs.length === 3 ? 'count-3'
                     : 'count-4';
      const cells = imgs.slice(0, shown).map((src, i) => {
        const isLast = i === shown - 1 && extra > 0;
        return `<div class="gi"><img src="${src}" alt="post image"/>${isLast ? `<div class="gi-more">+${extra + 1}</div>` : ''}</div>`;
      }).join('');
      const grid = document.createElement('div');
      grid.className = `img-grid ${countCls}`;
      grid.innerHTML = cells;
      mediaGridEl2.insertBefore(grid, mediaGridEl2.querySelector('.poster-hint').nextSibling);
    }
  }

  /* ════════════════════════════════════════
     FEED POSTS
  ════════════════════════════════════════ */

function renderFeedPosts() {
  const posts = window.FEED_POSTS || [];
  const feed = document.getElementById('feed-posts');
  if (!feed) return;

  if (posts.length === 0) {
    feed.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div class="empty-state-title">No posts yet</div>
          <div class="empty-state-sub">Be the first one to share something with your fellow TUPians!</div>
        </div>`;
    return;
  }

  feed.innerHTML = posts.map((fp, idx) => {
    const avatarHtml = fp.photoSrc ?
      `<img class="feed-avatar" src="${fp.photoSrc}" alt="${fp.name}"/>` :
      `<div class="feed-avatar-ph"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;

    // Safety: Header / Repost logic
    const headerMeta = fp.repost ?
      `<div class="feed-meta">
            <div class="feed-name">
              <svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:var(--muted);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:middle;margin-right:3px;"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              ${fp.name} <span style="font-weight:600;color:var(--muted);">reposted</span>
            </div>
            <div class="feed-time">${fp.time}</div>
           </div>` :
      `<div class="feed-meta">
            <div class="feed-name">${fp.name}</div>
            <div class="feed-time">${fp.time}</div>
           </div>`;

    // Safety Check for Quote
    const quoteHtml = (fp.quote && fp.quote.body) ? `
        <div class="feed-quote">
          <div class="feed-quote-header">
            ${fp.quote.photoSrc ? `<div class="feed-quote-avatar"><img src="${fp.quote.photoSrc}"/></div>` : `<div class="feed-quote-avatar"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`}
            <span class="feed-quote-name">${fp.quote.name}</span>
          </div>
          <div class="feed-quote-body">${fp.quote.body.replace(/\n/g, '<br>')}</div>
        </div>` : '';

    const imageTag = fp.postImage 
    ? `<img src="${fp.postImage}" class="feed-post-img" style="width:100%; border-radius:8px; margin-top:10px; display:block;">` 
    : '';

    const bodyHtml = fp.body ? `
    <div class="feed-body" id="feed-body-${idx}">${fp.body}</div>
    ${imageTag} <button class="feed-view-more" id="feed-vm-${idx}">View more ▾</button>` : (imageTag ? imageTag : '');

    // Safety Check for Comments
    const firstComment = (fp.commentList && fp.commentList.length > 0) ? fp.commentList[0] : null;
    const commentPreviewHtml = (fp.comments > 0 && firstComment) ? `
        <div class="feed-comments-section">
          <button class="feed-view-comments" data-post="${idx}">View all ${fp.comments} comments</button>
          <div class="feed-comment-preview">
            <div class="feed-comment-avatar">
              ${firstComment.photoSrc ? `<img src="${firstComment.photoSrc}"/>` : `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`}
            </div>
            <div class="feed-comment-bubble">
              <div class="feed-comment-name">${firstComment.name}</div>
              <div class="feed-comment-text">${firstComment.text}</div>
            </div>
          </div>
        </div>` : '';

    return `
      <div class="feed-post">
        <div class="feed-post-header">
          ${avatarHtml}
          ${headerMeta}
          <button class="post-menu-btn" data-post="${idx}">
            <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
          </button>
          <div class="post-menu-dropdown" id="post-menu-${idx}">
            <button class="post-menu-item" data-post="${idx}" data-action="report">Report Post</button>
          </div>
        </div>
        ${bodyHtml}
        ${quoteHtml}
        <div class="feed-reactions">
          <button class="feed-reaction-btn ${fp.isLikedByMe ? 'heart-active' : ''}" data-id="${fp.id}" data-type="like">
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span class="likes-count">${fp.likes || 0}</span> Heart
          </button>
          <button class="feed-reaction-btn" data-id="${fp.id}" data-type="comment" data-post="${idx}">
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span class="comments-count">${fmt(fp.comments)}</span> Comments
          </button>
          <button class="feed-reaction-btn ${fp.isRepostedByMe ? 'repost-active' : ''}" data-id="${fp.id}" data-type="repost">
            <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            <span class="reposts-count">${fp.reposts || 0}</span> Repost
          </button>
        </div>
        ${commentPreviewHtml}
      </div>`;
  }).join('');

  posts.forEach((fp, idx) => {
    if (!fp.body) return;
    const bodyEl = document.getElementById(`feed-body-${idx}`);
    const vmBtn = document.getElementById(`feed-vm-${idx}`);
    if (!bodyEl || !vmBtn) return;
    bodyEl.classList.add('is-clamped');
    if (bodyEl.scrollHeight > bodyEl.clientHeight) {
      vmBtn.classList.add('visible');
    }
    vmBtn.onclick = () => {
      const isExpanded = bodyEl.classList.toggle('is-clamped');
      vmBtn.textContent = isExpanded ? 'View more ▾' : 'View less ▴';
    };
  });
}

window.renderFeedPosts = renderFeedPosts;

  /* ════════════════════════════════════════
     LIGHTBOX
  ════════════════════════════════════════ */

  const lightbox    = document.getElementById('lightbox');
  const lbImg       = document.getElementById('lightbox-img');
  const openLB      = src => { lbImg.src = src; lightbox.classList.add('open'); };
  const closeLB     = ()  => { lightbox.classList.remove('open'); lbImg.src = ''; };
  const mediaGridEl = document.getElementById('media-grid');

  if (mediaGridEl) {
    mediaGridEl.addEventListener('click', () => {
      if (POST && POST.images && POST.images.length > 0) openLB(POST.images[0]);
    });
  }
  document.getElementById('lightbox-close').addEventListener('click', closeLB);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLB(); });

  /* ════════════════════════════════════════
     COMMENT MODAL
  ════════════════════════════════════════ */

  const commentOverlay = document.getElementById('comment-modal-overlay');
  const commentList    = document.getElementById('comment-list');

  window.renderComments = function(postIdx) {
    const fp = window.FEED_POSTS ? window.FEED_POSTS[postIdx] : null;
    const listElement = document.getElementById('comment-list'); 
    if (!fp || !listElement) return;

    listElement.innerHTML = (fp.commentList || []).map((c, cIdx) => {
    if(cIdx === 0) console.log("First comment data:", c);

    let rawPhoto = c.photoURL;
   
    if (c.isOwn && (rawPhoto === 'anon' || !rawPhoto)) {
            rawPhoto = window.cachedPhoto;
      }

    const validPhoto = (rawPhoto && rawPhoto !== 'anon') ? rawPhoto : null;
    const avatarHtml = window.getAvatar(validPhoto, c.author);
    

        return `
        <div class="comment-item" id="comment-item-${postIdx}-${cIdx}">
            <div class="comment-item-avatar">${avatarHtml}</div>
            <div class="comment-item-content">
                <div class="comment-item-bubble" id="comment-bubble-${postIdx}-${cIdx}">
                    <div class="comment-item-name">${c.author || "Anonymous User"}</div>
                    <div class="comment-item-text" id="comment-text-${postIdx}-${cIdx}">${c.text}</div>
                </div>
                <div class="comment-edit-wrap" id="comment-edit-${postIdx}-${cIdx}">
                    <input class="comment-edit-input" id="comment-edit-input-${postIdx}-${cIdx}" value="${c.text}"/>
                    <button class="comment-edit-save" data-post="${postIdx}" data-comment="${cIdx}">
                        <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                    <button class="comment-edit-cancel" data-post="${postIdx}" data-comment="${cIdx}">✕</button>
                </div>
                <div class="comment-item-time">${c.time || ''}</div>
                ${c.isOwn ? `
                <div class="comment-item-actions">
                    <button class="comment-action-btn edit-btn" data-post="${postIdx}" data-comment="${cIdx}">
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                    </button>
                    <button class="comment-action-btn delete-btn" data-post="${postIdx}" data-comment="${cIdx}">
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        Delete
                    </button>
                </div>` : ''}
            </div>
        </div>`;
    }).join('');

    attachCommentListeners(listElement);

    listElement.addEventListener('click', async function(e) {
    // 2. Check if a Delete button was clicked
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
        const pIdx = deleteBtn.dataset.post;
        const cIdx = deleteBtn.dataset.comment;
        const post = window.FEED_POSTS[pIdx];
        const comment = post.commentList[cIdx];

        if (confirm("Delete this comment?")) {
            try {
                await window.deleteComment(post.id, comment.id);
                showToast("Deleted!");
            } catch (err) {
                console.error(err);
            }
        }
        return; // Stop here
    }

    // 3. Check if an Edit button was clicked
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
        const pIdx = editBtn.dataset.post;
        const cIdx = editBtn.dataset.comment;
        
        // Hide the bubble, show the edit wrap
        document.getElementById(`comment-bubble-${pIdx}-${cIdx}`).style.display = 'none';
        document.getElementById(`comment-edit-${pIdx}-${cIdx}`).style.display = 'flex';
        return;
    }

    /* Cancel edit */
    commentList.querySelectorAll('.comment-edit-cancel').forEach(btn => {
      btn.addEventListener('click', function () {
        const p        = this.dataset.post;
        const c        = this.dataset.comment;
        const bubble   = document.getElementById(`comment-bubble-${p}-${c}`);
        const editWrap = document.getElementById(`comment-edit-${p}-${c}`);
        bubble.style.display = '';
        editWrap.classList.remove('open');
      });
    });

    /* Save edit */
    commentList.querySelectorAll('.comment-edit-save').forEach(btn => {
    btn.addEventListener('click', async function () {
      const pIdx = this.dataset.post;
      const cIdx = this.dataset.comment;
      const post = window.FEED_POSTS[pIdx];
      const commentData = post.commentList[cIdx]; 
      const commentId = commentData.id; 
      
      const input = document.getElementById(`comment-edit-input-${pIdx}-${cIdx}`);
      const newText = input.value.trim();
      if (!newText) return;

      const textEl = document.getElementById(`comment-text-${pIdx}-${cIdx}`);
      const bubble = document.getElementById(`comment-bubble-${pIdx}-${cIdx}`);
      const editWrap = document.getElementById(`comment-edit-${pIdx}-${cIdx}`);
      
      textEl.textContent = newText;
      bubble.style.display = '';
      editWrap.classList.remove('open');

      try {
        await saveCommentEdit(post.id, commentId, newText);
        showToast('Comment updated.');
      } catch (err) {
        console.error("Failed to save edit:", err);
        showToast('Error updating comment.');
      }
    });
  });

});
};

  function openCommentModal(postIdx) {
    const overlay = document.getElementById('comment-modal-overlay');
    const inputAvatar = document.getElementById('comment-input-avatar'); 
    const inputField = document.getElementById('comment-input-field');

    const currentUser = window.auth ? window.auth.currentUser : null;

    if (inputAvatar && currentUser) {
        inputAvatar.innerHTML = window.avatarHtmlFor(currentUser.photoURL, currentUser.displayName);
    }

    if (overlay) {
        overlay.dataset.post = postIdx;
        overlay.classList.add('open');

        if (window.renderComments) {
            window.renderComments(postIdx);
        }

        if (inputField) {
            setTimeout(() => inputField.focus(), 150);
        }
    }
  }

  function closeCommentModal() { 
    const overlay = document.getElementById('comment-modal-overlay');
    const inputField = document.getElementById('comment-input-field');
    if (overlay) overlay.classList.remove('open');

    if (inputField) inputField.value = '';
  }

  document.getElementById('comment-modal-close').addEventListener('click', closeCommentModal);
  commentOverlay.addEventListener('click', e => { if (e.target === commentOverlay) closeCommentModal(); });
  window.openCommentModal = openCommentModal;


  /* ════════════════════════════════════════
     CREATE POST MODAL
  ════════════════════════════════════════ */

  const overlay    = document.getElementById('create-post-overlay');
  const textarea   = document.getElementById('post-textarea');
  const submitBtn  = document.getElementById('modal-submit-btn');
  const attachWrap = document.getElementById('modal-attachments');
  const fileInput  = document.getElementById('modal-file-input');
  const anonToggle = document.getElementById('modal-anon-toggle');

  function openModal()  { overlay.classList.add('open'); setTimeout(() => textarea.focus(), 100); }
  function closeModal() { 
    if (overlay) overlay.classList.remove('open'); 

    if (typeof window.resetPostModal === 'function') {
        window.resetPostModal();
    } else {
        console.warn("resetPostModal function not found!");
    }
  }

  document.getElementById('open-create-post').addEventListener('click', openModal);

  document.getElementById('btn-add-photo').addEventListener('click', e => {
    e.stopPropagation();
    openModal();
    setTimeout(() => fileInput.click(), 150);
  });

  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  textarea.addEventListener('input', function () {
    submitBtn.disabled = this.value.trim().length === 0;
  });

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

  document.getElementById('modal-photo-btn').addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', function () {
    Array.from(this.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const thumb     = document.createElement('img');
        thumb.src       = e.target.result;
        thumb.className = 'modal-attach-thumb';
        thumb.title     = 'Click to remove';
        thumb.addEventListener('click', () => thumb.remove());
        attachWrap.appendChild(thumb);
      };
      reader.readAsDataURL(file);
    });
  });

  /* ════════════════════════════════════════
     QUICK ACTION BUTTONS
  ════════════════════════════════════════ */

  // BACKEND TEAM: wire these
  document.getElementById('btn-settings').addEventListener('click', () => { console.log('Settings'); });
  document.getElementById('btn-likes')?.addEventListener('click',    () => {});
  document.getElementById('btn-thumbsup')?.addEventListener('click', () => {});
  document.getElementById('btn-reposts')?.addEventListener('click',  () => {});

  /* ════════════════════════════════════════
     KEYBOARD SHORTCUTS
  ════════════════════════════════════════ */

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeLB(); closeModal(); closeCommentModal(); }
  });

  /* ════════════════════════════════════════
     SIDEBAR NAV — smooth sliding teardrop
  ════════════════════════════════════════ */

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
        console.log('Navigate to:', this.dataset.route);
      });
    });

    profBtn.addEventListener('click', function () {
      allBtns.forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      moveTo(this);
      console.log('Navigate to: profile');
    });

    /* Snap to active button on load (no transition) */
    const active = navWrap.querySelector('.nav-btn.active');
    if (active) {
      teardrop.style.transition = 'none';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        moveTo(active);
        teardrop.style.transition = '';
      }));
    }
  })();

})();

window.renderFeedPosts = renderFeedPosts;
window.FEED_POSTS = FEED_POSTS;