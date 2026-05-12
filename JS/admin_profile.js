import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, increment, onSnapshot, deleteDoc, arrayUnion, arrayRemove, writeBatch } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { CONFIG } from "./config.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpGOdMpx_Mws2EcCq6rbOWfZ-FFuhhfo0",
  authDomain: "tup-connect-b162d.firebaseapp.com",
  projectId: "tup-connect-b162d",
  storageBucket: "tup-connect-b162d.firebasestorage.app",
  messagingSenderId: "193141013544",
  appId: "1:193141013544:web:72b403e84aa4d3313f091d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let USER = {
  name: "Admin",
  photoSrc: "../assets/images/anon_avatar.jpg"
};
let allOrgPosts = [];

// ========================
// IMAGE COMPRESSION
// ========================
async function compressImage(file, maxWidth = 400, maxHeight = 400) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
    };
  });
}

// ========================
// INSTANT UI PRE-FILL
// ========================
(function() {
    const cache = localStorage.getItem('tup_user_meta');
    if (cache) {
        try {
            const data = JSON.parse(cache);
            USER.name = data.fullName || USER.name;
            USER.photoSrc = data.photoURL || USER.photoSrc;
            document.addEventListener('DOMContentLoaded', () => {
              updateProfileUI(data, data.email || '');
            });
        } catch(e) {}
    }
})();

// ========================
// AUTH STATE
// ========================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loadOrgPosts(user.uid);

    const userDocRef = doc(db, "users", user.uid);
    try {
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        USER.name = userData.fullName || user.displayName || "Admin";
        USER.photoSrc = userData.photoURL || user.photoURL || "../assets/images/anon_avatar.jpg";
        USER.college = userData.college || null;
        
        localStorage.setItem('tup_user_meta', JSON.stringify({
          ...userData,
          email: user.email,
          uid: user.uid
        }));

        updateProfileUI(userData, user.email);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  } else {
    window.location.href = "../index.html";
  }
});

// ========================
// PROFILE UI UPDATE
// ========================
function updateProfileUI(userData, email) {
  const profileImg = document.getElementById('profile-avatar-inner');
  if (profileImg && userData.photoURL) profileImg.src = userData.photoURL;

  const bannerImg = document.getElementById('banner-img');
  if (bannerImg && userData.coverURL) bannerImg.src = userData.coverURL;

  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const collegeEl = document.getElementById('profile-college');

  if (nameEl) nameEl.textContent = userData.fullName || "Organization";
  if (emailEl) emailEl.textContent = email;

  if (collegeEl) {
    collegeEl.textContent = userData.position || userData.role || "Administrator";
  }

  const sidebarImg = document.querySelector('.sidebar-avatar-img');
  if (sidebarImg && userData.photoURL) sidebarImg.src = userData.photoURL;

  const postInputImg = document.getElementById('post-input-img');
  if (postInputImg && userData.photoURL) postInputImg.src = userData.photoURL;

  const modalAvatarEl = document.getElementById('modal-avatar');
  if (modalAvatarEl && userData.photoURL) {
    modalAvatarEl.innerHTML = `<img src="${userData.photoURL}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;image-rendering:high-quality;">`;
  }

  const modalNameEl = document.getElementById('modal-user-name');
  if (modalNameEl) modalNameEl.textContent = userData.fullName || "Organization";

  const commentModalAv = document.querySelector('.comment-modal-avatar img');
  if (commentModalAv && userData.photoURL) commentModalAv.src = userData.photoURL;
}

// ========================
// CHANGE PHOTO MENU
// ========================
window.toggleChangePhotoMenu = function(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('changePhotoDropdown');
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  dropdown.style.top = (rect.bottom + 8) + 'px';
  dropdown.style.right = (window.innerWidth - rect.right) + 'px';
  dropdown.classList.toggle('open');
};

document.addEventListener('click', (e) => {
  const wrap = document.querySelector('.change-photo-wrap');
  const dropdown = document.getElementById('changePhotoDropdown');
  if (dropdown && wrap && !wrap.contains(e.target)) dropdown.classList.remove('open');
});

// ========================
// PHOTO UPLOAD → FIREBASE
// ========================
document.getElementById('profilePhotoInput').addEventListener('change', async function (e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('changePhotoDropdown').classList.remove('open');
  const base64 = await compressImage(file, 800, 800);
  updateUserPhotosInFirebase('photoURL', base64);
});

document.getElementById('coverPhotoInput').addEventListener('change', async function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const base64 = await compressImage(file, 1920, 640);
  updateUserPhotosInFirebase('coverURL', base64);
});

async function updateUserPhotosInFirebase(field, base64String) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await updateDoc(doc(db, "users", user.uid), { [field]: base64String });
    showToast("Photo updated successfully!");

    if (field === 'photoURL') {
      USER.photoSrc = base64String;
      updateProfileUI({ photoURL: base64String }, user.email);

      // Sync past posts
      const postsQuery = query(collection(db, "posts"), where("userId", "==", user.uid));
      const postsSnapshot = await getDocs(postsQuery);
      postsSnapshot.forEach(async (postDoc) => {
        await updateDoc(doc(db, "posts", postDoc.id), { photoURL: base64String });
      });
    } else if (field === 'coverURL') {
      const bannerImg = document.getElementById('banner-img');
      if (bannerImg) bannerImg.src = base64String;
    }
  } catch (error) {
    console.error("Error updating photo:", error);
    showToast("Failed to update photo.");
  }
}

// ========================
// LOGOUT
// ========================
const logoutBtn = document.getElementById('btn-logout-main') || document.getElementById('btn-logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
      localStorage.clear();
      window.location.href = "../index.html";
    });
  });
}

// ========================
// POST LOGIC
// ========================
window.openPostModal = function() {
  document.getElementById('postModal').classList.add('open');
  const postContent = document.getElementById('postContent');
  const postSubmitBtn = document.getElementById('modal-submit-btn');
  if (postContent) {
    postContent.focus();
    postSubmitBtn.disabled = !postContent.value.trim() && document.getElementById('modal-attachments').children.length === 0;
  }
};

// Handle Post Button state
document.addEventListener('DOMContentLoaded', () => {
  const postContent = document.getElementById('postContent');
  const postSubmitBtn = document.getElementById('modal-submit-btn');
  const attachWrap = document.getElementById('modal-attachments');

  if (postContent && postSubmitBtn) {
    const updateBtnState = () => {
      postSubmitBtn.disabled = !postContent.value.trim() && attachWrap.children.length === 0;
    };
    postContent.addEventListener('input', updateBtnState);
    
    // Mutation observer to watch for image attachments
    const observer = new MutationObserver(updateBtnState);
    if (attachWrap) observer.observe(attachWrap, { childList: true });
  }

  // Sidebar navigation
  (function () {
    const navWrap  = document.getElementById('sidebar-nav');
    const teardrop = document.getElementById('nav-teardrop');
    if (!navWrap || !teardrop) return;

    const navBtns = Array.from(navWrap.querySelectorAll('.nav-btn'));
    const profBtn = document.getElementById('sidebar-avatar-wrap');
    const allBtns = [...navBtns];
    if (profBtn) allBtns.push(profBtn);
    
    const TD_BASE_H = 66;

    function moveTo(item) {
      const wrapRect = navWrap.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      teardrop.style.top = (itemRect.top + itemRect.height / 2 - wrapRect.top - TD_BASE_H / 2) + 'px';
    }

    navBtns.forEach(item => {
      item.addEventListener('click', function () {
        const route = this.dataset.route;
        if (!route) return; // Ignore logout etc

        allBtns.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        moveTo(this);

        if (route === 'settings')    window.location.href = '../pages/setup_org.html';
        if (route === 'profile')     window.location.href = '../pages/org_profile.html';
      });
    });

    if (profBtn) {
      profBtn.addEventListener('click', function () {
        allBtns.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        moveTo(this);
        // Already on profile, but just in case
        // window.location.href = '../pages/org_profile.html';
      });
    }

    // Initial position
    const active = navWrap.querySelector('.nav-btn.active') || profBtn;
    if (active) {
      teardrop.style.transition = 'none';
      requestAnimationFrame(() => {
        moveTo(active);
        setTimeout(() => { teardrop.style.transition = ''; }, 50);
      });
    }

    // Update on resize
    window.addEventListener('resize', () => {
      const currentActive = navWrap.querySelector('.nav-btn.active') || profBtn;
      if (currentActive) moveTo(currentActive);
    });
  })();
});

window.closePostModal = function() {
  document.getElementById('postModal').classList.remove('open');
};

window.closeModalOnOverlay = function(e) {
  if (e.target.id === 'postModal') closePostModal();
};

window.submitPost = async function() {
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();
  const attachWrap = document.getElementById('modal-attachments');
  const thumbs = Array.from(attachWrap.querySelectorAll('.modal-attach-thumb'));
  
  if (!title && !content && thumbs.length === 0) { showToast('Write something first!'); return; }

  const user = auth.currentUser;
  if (!user) return;

  try {
    const postData = {
      userId: user.uid,
      author: USER.name,
      photoURL: USER.photoSrc,
      title: title,
      body: content,
      imageURLs: thumbs.map(t => t.src),
      createdAt: serverTimestamp(),
      likes: [],
      comments: [],
      reposts: [],
      college: USER.college || null
    };

    await addDoc(collection(db, "announcements"), postData);
    
    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
    attachWrap.innerHTML = '';
    closePostModal();
    showToast('Post shared!');
  } catch (err) {
    console.error("Error submitting post:", err);
    showToast("Failed to post.");
  }
};

const fileInput = document.getElementById('modal-file-input');
const attachWrap = document.getElementById('modal-attachments');

const addPhotoBtn = document.getElementById('btn-add-photo');
if (addPhotoBtn) {
  addPhotoBtn.addEventListener('click', e => {
    e.stopPropagation();
    openPostModal();
    setTimeout(() => fileInput.click(), 150);
  });
}

const modalAddPhotoBtn = document.querySelector('.modal-add-photo-btn');
if (modalAddPhotoBtn) {
  modalAddPhotoBtn.addEventListener('click', e => {
    e.stopPropagation();
    fileInput.click();
  });
}

if (fileInput) {
  fileInput.addEventListener('change', function () {
    Array.from(this.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const thumb = document.createElement('img');
        thumb.src = ev.target.result;
        thumb.className = 'modal-attach-thumb';
        thumb.addEventListener('click', () => thumb.remove());
        attachWrap.appendChild(thumb);
      };
      reader.readAsDataURL(file);
    });
  });
}

// ========================
// FEED LOGIC
// ========================
function loadOrgPosts(userId) {
  const q = query(collection(db, "announcements"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    const feed = document.getElementById('feed');
    if (!feed) return;

    const changes = snapshot.docChanges();
    const isInitialLoad = !feed.querySelector('.post-card');
    
    if (!isInitialLoad && changes.length > 0 && !changes.some(c => c.type === 'added' || c.type === 'removed')) {
      changes.forEach(change => {
        if (change.type === 'modified') {
          updatePostInPlace(change.doc.id, change.doc.data());
        }
      });
      return;
    }

    feed.innerHTML = '';
    allOrgPosts = [];
    snapshot.forEach(docSnap => {
      const p = { id: docSnap.id, ...docSnap.data() };
      allOrgPosts.push(p);
      renderPost(p, docSnap.id);
    });
    wireLightboxTriggers();
  });
}

// ========================
// REACTIONS BAR
// ========================
function buildReactions(postId, likes = 0, comments = 0, reposts = 0, isLikedByMe = false) {
  return `
    <div class="feed-reactions">
      <button class="feed-reaction-btn ${isLikedByMe ? 'heart-active' : ''}" data-id="${postId}" data-type="like" onclick="toggleLike('${postId}', event)">
        <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span class="likes-count">${fmt(likes)}</span> Heart
      </button>
      <button class="feed-reaction-btn" data-id="${postId}" data-type="comment" onclick="openCommentModal('${postId}')">
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span class="comments-count">${fmt(comments)}</span> Comments
      </button>
      <button class="feed-reaction-btn" data-id="${postId}" data-type="repost" onclick="openRepostModal('${postId}', event)">
        <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        <span class="reposts-count">${fmt(reposts)}</span> Repost
      </button>
    </div>`;
}

// ========================
// RENDER POST (from Firebase)
// ========================
function renderPost(data, postId) {
  const feed = document.getElementById('feed');
  const postCard = document.createElement('div');
  postCard.className = 'post-card';
  postCard.dataset.id = postId;

  const likeCount    = data.likes      ? data.likes.length      : 0;
  const commentCount = data.comments   ? data.comments.length   : 0;
  const repostCount  = data.reposts    ? data.reposts.length    : 0;
  const isLikedByMe  = data.likes      && data.likes.includes(auth.currentUser?.uid);
  const menuId       = 'menu-' + postId;

  const dateStr = data.createdAt ? formatRelativeTime(data.createdAt.toDate()) : 'Just now';

  let bodyHtml = '';
  if (data.repostOf) {
    bodyHtml = `
      ${data.text ? `<div class="repost-quote-text">${escapeHTML(data.text)}</div>` : ''}
      <div class="repost-quote-card">
        <div class="repost-quote-header">
          <div class="repost-quote-avatar">
            <img src="${data.repostAuthorPhoto || '../assets/images/anon_avatar.jpg'}" alt="${data.repostAuthor}" style="image-rendering: high-quality;">
          </div>
          <div class="repost-quote-meta">
            <div class="repost-quote-author">${data.repostAuthor}</div>
            <div class="repost-quote-time" style="font-size:11px; color:var(--muted);">${data.repostTime || ''}</div>
          </div>
        </div>
        <div class="repost-quote-content">
          ${data.repostTitle ? `<div class="repost-quote-title">${escapeHTML(data.repostTitle)}</div>` : ''}
          <div class="repost-quote-body">
            ${escapeHTML(data.repostText || '')}
          </div>
        </div>
        ${data.repostImage ? `<div class="post-images lightbox-trigger" data-src="${data.repostImage}" style="display:flex; justify-content:center; align-items:center; text-align: center; cursor:pointer;"><img src="${data.repostImage}" class="post-image" style="image-rendering: high-quality;"></div>` : ''}
      </div>`;
  } else {
    bodyHtml = `
      ${data.title ? `<div class="post-title">${escapeHTML(data.title)}</div>` : ''}
      ${data.body ? `<div class="post-body">${escapeHTML(data.body)}</div>` : ''}
      ${data.imageURLs && data.imageURLs.length > 0 ? renderPhotoGrid(data.imageURLs) : ''}
    `;
  }

  postCard.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">
        <img src="${data.photoURL || '../assets/images/anon_avatar.jpg'}" alt="Avatar" style="image-rendering: high-quality; object-fit: cover;">
      </div>
      <div class="post-meta">
        <div class="post-author">
          ${data.repostOf ? `<svg viewBox="0 0 24 24" style="width:12px; height:12px; stroke:var(--muted); fill:none; stroke-width:2.5; stroke-linecap:round; stroke-linejoin:round; vertical-align:middle; margin-right:4px; margin-top:-2px;"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>` : ''}
          ${data.author || "Organization"}
        </div>
        <div class="post-time">${dateStr}</div>
      </div>
      <button class="post-menu" onclick="toggleMenu(event, '${menuId}')">
        <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
        <div class="dropdown-menu" id="${menuId}">
          <div class="dropdown-item" onclick="editPost(event)">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit Post
          </div>
          <div class="dropdown-item" onclick="togglePinPost('${postId}', ${data.pinned || false})">
            <svg viewBox="0 0 24 24" style="fill:${data.pinned ? 'var(--accent)' : 'none'}; stroke:${data.pinned ? 'var(--accent)' : 'currentColor'};">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg> 
            ${data.pinned ? 'Unpin' : 'Pin Announcement'}
          </div>
          <div class="dropdown-item danger" onclick="deletePost('${postId}')">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Delete
          </div>
        </div>
      </button>
    </div>
    ${bodyHtml}
    <div class="comments-data" style="display:none;"></div>
    <div class="reposts-data"  style="display:none;"></div>
    ${buildReactions(postId, likeCount, commentCount, repostCount, isLikedByMe)}
    <div class="post-repost-info" onclick="viewReposts('${postId}', event)" style="display:${repostCount > 0 ? 'flex' : 'none'};">
      <svg width="193px" height="193px" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M14.2893 5.70708C13.8988 5.31655 13.2657 5.31655 12.8751 5.70708L7.98768 10.5993C7.20729 11.3805 7.2076 12.6463 7.98837 13.427L12.8787 18.3174C13.2693 18.7079 13.9024 18.7079 14.293 18.3174C14.6835 17.9269 14.6835 17.2937 14.293 16.9032L10.1073 12.7175C9.71678 12.327 9.71678 11.6939 10.1073 11.3033L14.2893 7.12129C14.6799 6.73077 14.6799 6.0976 14.2893 5.70708Z" fill="#0F0F0F"></path> </g></svg>
      <span class="repost-info-text">${repostCount} ${repostCount === 1 ? 'student reposted' : 'students reposted'} this</span>
    </div>
  `;
  feed.appendChild(postCard);
}

window.toggleMenu = function(e, id) {
  e.stopPropagation();
  document.querySelectorAll('.dropdown-menu').forEach(m => {
    if (m.id !== id) m.classList.remove('open');
  });
  const menu = document.getElementById(id);
  if (menu) menu.classList.toggle('open');
};

window.deletePost = async function(postId) {
  if (confirm("Delete this post?")) {
    try {
      await deleteDoc(doc(db, "announcements", postId));
      const card = document.querySelector(`.post-card[data-id="${postId}"]`);
      if (card) card.remove();
      showToast("Post deleted.");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete.");
    }
  }
};

window.togglePinPost = async function(postId, currentlyPinned) {
  try {
    if (!currentlyPinned) {
      // 1. Unpin any currently pinned post first
      const q = query(collection(db, "announcements"), where("pinned", "==", true));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach(d => {
        batch.update(doc(db, "announcements", d.id), { pinned: false });
      });
      
      // 2. Pin the new one
      batch.update(doc(db, "announcements", postId), { pinned: true });
      await batch.commit();
      showToast("Post pinned to homepage!");
    } else {
      // Just unpin
      await updateDoc(doc(db, "announcements", postId), { pinned: false });
      showToast("Post unpinned.");
    }
  } catch (err) {
    console.error("Pin error:", err);
    showToast("Failed to update pin status.");
  }
};

window.editPost = async function(e) {
  const card   = e.target.closest('.post-card');
  const postId = card.dataset.id;
  const bodyEl = card.querySelector('.post-body');
  if (!bodyEl) return;

  const originalText = bodyEl.innerHTML
    .replace(/<br>/g,  '\n')
    .replace(/&lt;/g,  '<')
    .replace(/&gt;/g,  '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');

  bodyEl.style.display = 'none';
  const editWrap = document.createElement('div');
  editWrap.className = 'post-edit-wrap';
  editWrap.innerHTML = `
    <textarea class="post-edit-textarea">${originalText}</textarea>
    <div class="post-edit-buttons">
      <button class="post-edit-save">Save</button>
      <button class="post-edit-cancel">Cancel</button>
    </div>`;
  bodyEl.parentNode.insertBefore(editWrap, bodyEl.nextSibling);
  editWrap.querySelector('.post-edit-textarea').focus();

  editWrap.querySelector('.post-edit-save').addEventListener('click', async () => {
    const newText = editWrap.querySelector('.post-edit-textarea').value.trim();
    if (!newText) return;
    try {
      await updateDoc(doc(db, "announcements", postId), { body: newText });
      bodyEl.innerHTML = escapeHTML(newText).replace(/\n/g, '<br>');
      editWrap.remove();
      bodyEl.style.display = '';
      showToast('Post updated.');
    } catch (error) {
      console.error('Edit post error:', error);
      showToast('Failed to update post.');
    }
  });

  editWrap.querySelector('.post-edit-cancel').addEventListener('click', () => {
    editWrap.remove();
    bodyEl.style.display = '';
  });
};

// ========================
// LIKE LOGIC
// ========================
window.toggleLike = async function(postId, e) {
  e.stopPropagation();
  const user = auth.currentUser;
  if (!user) { showToast('Sign in to react.'); return; }

  const btn = e.currentTarget;
  const isLiked = btn.classList.contains('heart-active');
    const postRef = doc(db, "announcements", postId);

    try {
      // Optimistic UI
      btn.classList.toggle('heart-active', !isLiked);
      const countEl = btn.querySelector('.likes-count');
      if (countEl) {
        let count = parseInt(countEl.textContent);
        countEl.textContent = isLiked ? Math.max(0, count - 1) : count + 1;
      }

      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
  } catch (err) {
    console.error("Like error:", err);
    // Rollback
    btn.classList.toggle('heart-active', isLiked);
  }
};

// ========================
// COMMENT LOGIC
// ========================
let activePostId = null;
let _currentPostCard = null;
let unsubscribeComments = null;

window.openCommentModal = async function(postId) {
  activePostId = postId;
  _currentPostCard = document.querySelector(`.post-card[data-id="${postId}"]`);
  const modal = document.getElementById('commentModal');
  
  // Update modal input avatar
  const inputAvatarImg = modal.querySelector('.comment-modal-avatar img');
  if (inputAvatarImg && USER && USER.photoSrc) {
    inputAvatarImg.src = USER.photoSrc;
  }

  modal.classList.add('open');
  loadComments(postId);
};

window.closeCommentModal = function() {
  document.getElementById('commentModal').classList.remove('open');
  if (unsubscribeComments) {
    unsubscribeComments();
    unsubscribeComments = null;
  }
  activePostId = null;
  _currentPostCard = null;
};

window.closeCommentModalOnOverlay = function(e) {
  if (e.target.id === 'commentModal') closeCommentModal();
};

async function loadComments(postId) {
  const list = document.getElementById('commentModalList');
  list.innerHTML = '<div class="loading">Loading comments...</div>';

  if (unsubscribeComments) unsubscribeComments();

  try {
    const q = query(collection(db, "announcements", postId, "comments"), orderBy("createdAt", "asc"));
    unsubscribeComments = onSnapshot(q, (snapshot) => {
      list.innerHTML = '';
      if (snapshot.empty) {
        list.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
        return;
      }
      snapshot.forEach((docSnap, cIdx) => {
        const c = docSnap.data();
        const isOwn = c.userId === auth.currentUser?.uid;
        list.appendChild(buildCommentModalItem(
          c.author, 
          c.photoURL || '../assets/images/anon_avatar.jpg',
          c.text, 
          c.createdAt ? c.createdAt.toDate().toISOString() : new Date().toISOString(), 
          isOwn, 
          docSnap.id,
          cIdx,
          c.userId
        ));
      });
      bindCommentActions();
      list.scrollTop = list.scrollHeight;
    });
  } catch (err) {
    console.error("Load comments error:", err);
  }
}

function buildCommentModalItem(author, avatar, text, time, isOwn, commentId, cIdx, userId = '') {
  const item = document.createElement('div');
  item.className = 'comment-modal-item';
  item.id = `comment-modal-item-${cIdx}`;
  item.dataset.commentId = commentId;
  item.dataset.userId = userId;
  item.innerHTML = `
    <div class="comment-modal-item-avatar">
      <img src="${avatar}" alt="${escapeHTML(author)}" onerror="this.parentElement.textContent='👤'">
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
      <div class="comment-footer" style="display:flex; align-items:center; gap:12px; margin-top:4px;">
        <div class="comment-modal-item-time" style="margin:0;">${(() => {
          const d = new Date(time);
          const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          return `${dateStr} at ${timeStr}`;
        })()}</div>
        ${isOwn ? `
        <div class="comment-item-actions" style="display:flex; align-items:center; gap:8px;">
          <button class="comment-action-btn edit-btn" data-comment="${cIdx}" style="margin:0; padding:0; background:none;">
            <svg viewBox="0 0 24 24" width="13" height="13" style="stroke:currentColor;fill:none;stroke-width:2.5;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit
          </button>
          <button class="comment-action-btn delete-btn" data-comment="${cIdx}" style="margin:0; padding:0; background:none;">
            <svg viewBox="0 0 24 24" width="13" height="13" style="stroke:currentColor;fill:none;stroke-width:2.5;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Delete
          </button>
        </div>` : ''}
      </div>
    </div>
  `;
  return item;
}

function bindCommentActions() {
  const list = document.getElementById('commentModalList');

  list.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const c = this.dataset.comment;
      document.getElementById(`comment-modal-bubble-${c}`).style.display = 'none';
      document.getElementById(`comment-modal-edit-${c}`).classList.add('open');
      document.getElementById(`comment-modal-edit-input-${c}`).focus();
    });
  });

  list.querySelectorAll('.comment-edit-cancel').forEach(btn => {
    btn.addEventListener('click', function () {
      const c = this.dataset.comment;
      document.getElementById(`comment-modal-bubble-${c}`).style.display = '';
      document.getElementById(`comment-modal-edit-${c}`).classList.remove('open');
    });
  });

  list.querySelectorAll('.comment-edit-save').forEach(btn => {
    btn.addEventListener('click', async function () {
      const c       = this.dataset.comment;
      const newText = document.getElementById(`comment-modal-edit-input-${c}`).value.trim();
      if (!newText) return;

      if (activePostId) {
        const item = document.getElementById(`comment-modal-item-${c}`);
        const commentId = item.dataset.commentId;

        try {
          await updateDoc(doc(db, "announcements", activePostId, "comments", commentId), { text: newText });
          document.getElementById(`comment-modal-text-${c}`).textContent = newText;
          document.getElementById(`comment-modal-bubble-${c}`).style.display = '';
          document.getElementById(`comment-modal-edit-${c}`).classList.remove('open');
          showToast('Comment updated.');
        } catch (error) {
          console.error('Edit comment error:', error);
          showToast('Failed to update comment.');
        }
      }
    });
  });

  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async function () {
      const c    = this.dataset.comment;
      const item = document.getElementById(`comment-modal-item-${c}`);
      const commentId = item.dataset.commentId;

      if (activePostId && confirm("Delete this comment?")) {
        try {
          await deleteDoc(doc(db, "announcements", activePostId, "comments", commentId));
          await updateDoc(doc(db, "announcements", activePostId), { comments: arrayRemove(auth.currentUser.uid) });
          
          item.style.transition = 'opacity 0.2s, transform 0.2s';
          item.style.opacity    = '0';
          item.style.transform  = 'translateX(12px)';
          setTimeout(() => item.remove(), 200);
          
          const countEl = _currentPostCard?.querySelector('.comments-count');
          if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
          
          showToast('Comment deleted.');
        } catch (error) {
          console.error('Delete comment error:', error);
          showToast('Failed to delete comment.');
        }
      }
    });
  });
}

window.submitModalComment = async function() {
  const input = document.getElementById('commentModalInput');
  const text = input.value.trim();
  if (!text || !activePostId) return;

  const user = auth.currentUser;
  if (!user) return;

  try {
    await addDoc(collection(db, "announcements", activePostId, "comments"), {
      userId: user.uid,
      authorId: user.uid,
      author: USER.name,
      photoURL: USER.photoSrc,
      text: text,
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, "announcements", activePostId), {
      comments: arrayUnion(user.uid)
    });

    input.value = '';
  } catch (err) {
    console.error("Submit comment error:", err);
  }
};

window.handleModalCommentKey = function(e) {
  if (e.key === 'Enter') submitModalComment();
};

// ========================
// REPOST LOGIC
// ========================
let repostPostId = null;

window.openRepostModal = async function(postId, e) {
  if (e) e.stopPropagation();
  repostPostId = postId;
  
  const overlay = document.getElementById('hp-repost-modal-overlay');
  const modal = document.getElementById('hp-repost-modal');
  if (!overlay || !modal) return;

  // 1. Show overlay
  overlay.classList.add('open');
  overlay.style.display = 'flex';

  // 2. Clear previous data
  document.getElementById('repostContent').value = '';
  document.getElementById('repost-user-name').textContent = USER.name || 'Organization';
  const userAvatar = document.getElementById('repost-user-avatar');
  if (userAvatar && USER.photoSrc) {
    userAvatar.innerHTML = `<img src="${USER.photoSrc}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; image-rendering:high-quality;">`;
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
    const postSnap = await getDoc(doc(db, "announcements", postId));
    if (postSnap.exists()) {
      const data = postSnap.data();
      previewAuthor.textContent = data.author || 'TUP Konek';
      previewBody.textContent = data.text || data.body || '';
      previewTitle.textContent = data.title || '';
      previewTime.textContent = data.createdAt ? formatRelativeTime(data.createdAt.toDate()) : 'Just now';

      if (data.photoURL) {
        previewAvatar.innerHTML = `<img src="${data.photoURL}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; image-rendering:high-quality;">`;
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
        imgEl.style.cssText = 'width:100%; max-height:200px; object-fit:cover; border-radius:8px; margin-top:8px; image-rendering:high-quality;';
        document.getElementById('repost-quote-preview').appendChild(imgEl);
      }
    }
  } catch (err) {
    console.error("Error fetching for preview:", err);
    previewBody.textContent = 'Error loading preview.';
  }

  setTimeout(() => document.getElementById('repostContent').focus(), 150);
};

window.closeRepostModal = function() {
  const overlay = document.getElementById('hp-repost-modal-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.style.display = 'none';
  }
  document.getElementById('repostContent').value = '';
  repostPostId = null;
};

window.closeRepostModalOnOverlay = function(e) {
  if (e.target.id === 'hp-repost-modal-overlay') window.closeRepostModal();
};

window.submitRepost = async function(skipQuote = false) {
  const quote = skipQuote ? "" : document.getElementById('repostContent').value.trim();
  if (!repostPostId) return;

  const user = auth.currentUser;
  if (!user) return;

  try {
    const postSnap = await getDoc(doc(db, "announcements", repostPostId));
    if (!postSnap.exists()) return;
    const original = postSnap.data();

    const repostData = {
      userId: user.uid,
      author: USER.name,
      photoURL: USER.photoSrc,
      body: quote,
      repostOf: repostPostId,
      repostAuthor: original.author,
      repostAuthorPhoto: original.photoURL,
      repostTitle: original.title || "",
      repostText: original.body || original.text,
      repostImage: original.imageURLs ? original.imageURLs[0] : original.imageURL,
      repostTime: document.getElementById('quote-preview-time').textContent || "",
      createdAt: serverTimestamp(),
      college: USER.college || null,
      likes: [],
      comments: [],
      reposts: []
    };

    await addDoc(collection(db, "announcements"), repostData);

    const reposts = original.reposts || [];
    if (!reposts.includes(user.uid)) {
      reposts.push(user.uid);
      await updateDoc(doc(db, "announcements", repostPostId), { reposts });
    }

    document.getElementById('repostContent').value = '';
    closeRepostModal();
    showToast("Reposted!");
  } catch (err) {
    console.error("Repost error:", err);
  }
};

function updatePostInPlace(postId, data) {
  const card = document.querySelector(`.post-card[data-id="${postId}"]`);
  if (!card) return;

  const user = auth.currentUser;
  if (!user) return;

  // Update Likes
  const likes = data.likes || [];
  const isLikedByMe = likes.includes(user.uid);
  const likeBtn = card.querySelector('.feed-reaction-btn:nth-child(1)');
  if (likeBtn) {
    likeBtn.classList.toggle('heart-active', isLikedByMe);
    likeBtn.querySelector('.likes-count').textContent = likes.length;
  }

  // Update Comments
  const commentBtn = card.querySelector('.feed-reaction-btn:nth-child(2)');
  if (commentBtn) {
    commentBtn.querySelector('.comments-count').textContent = (data.comments || []).length;
  }

  // Update Reposts
  const reposts = data.reposts || [];
  const repostBtn = card.querySelector('.feed-reaction-btn:nth-child(3)');
  if (repostBtn) {
    repostBtn.querySelector('.reposts-count').textContent = reposts.length;
  }

  // Update Pin Status in Menu
  const pinItem = Array.from(card.querySelectorAll('.dropdown-item')).find(el => el.textContent.includes('Pin') || el.textContent.includes('Unpin'));
  if (pinItem) {
    const isPinned = data.pinned || false;
    pinItem.setAttribute('onclick', `togglePinPost('${postId}', ${isPinned})`);
    pinItem.innerHTML = `
      <svg viewBox="0 0 24 24" style="fill:${isPinned ? 'var(--accent)' : 'none'}; stroke:${isPinned ? 'var(--accent)' : 'currentColor'};">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg> 
      ${isPinned ? 'Unpin' : 'Pin Announcement'}
    `;
  }
}

// ========================
// HELPERS
// ========================
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function formatRelativeTime(date) {
  if (!date) return 'Just now';
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return date.toLocaleDateString();
}
function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1).replace(/\.0$/, '')    + 'K';
  return String(n);
}

window.viewReposts = async function(postId, e) {
  if (e) e.stopPropagation();
  const modal = document.getElementById('repostViewModal');
  const list = document.getElementById('repostViewModalList');
  if (!modal || !list) return;

  modal.classList.add('open');
  modal.style.display = 'flex';
  list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);">Loading reposts...</div>';

  try {
    const q = query(collection(db, "posts"), where("repostOf", "==", postId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);">No reposts found.</div>';
      return;
    }

    list.innerHTML = '';
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const item = document.createElement('div');
      item.className = 'comment-modal-item';
      
      const avatar = data.photoURL || '../assets/images/anon_avatar.jpg';
      const author = data.author || 'TUPian';
      let time = 'Just now';
      if (data.createdAt) {
        const d = data.createdAt.toDate();
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        time = `${dateStr} at ${timeStr}`;
      }
      const text = data.text || data.body || '';
      
      item.innerHTML = `
        <div class="comment-modal-item-avatar">
          <img src="${avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
        </div>
        <div class="comment-modal-item-content">
          <div class="comment-modal-item-bubble">
            <div class="comment-modal-item-author">${escapeHTML(author)}</div>
            ${text ? `<div class="comment-modal-item-text">${escapeHTML(text)}</div>` : '<div class="reposted-without-quote">Reposted without quote</div>'}
          </div>
          <div class="comment-footer">
            <div class="comment-modal-item-time">${time}</div>
          </div>
        </div>
      `;
      list.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading reposts:", err);
    list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);">Error loading reposts.</div>';
  }
};

window.closeRepostViewModal = function() {
  const modal = document.getElementById('repostViewModal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
};

window.closeRepostViewModalOnOverlay = function(e) {
  if (e.target.id === 'repostViewModal') window.closeRepostViewModal();
};

// ========================
// LIGHTBOX
// ========================
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
    updateLightbox();
  });
  document.getElementById('lb-next')?.addEventListener('click', (e) => {
    e.stopPropagation();
    window.currentIndex = (window.currentIndex < window.currentGallery.length - 1) ? window.currentIndex + 1 : 0;
    updateLightbox();
  });
}

function updateLightbox() {
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

function wireLightboxTriggers() {
  document.querySelectorAll('.lightbox-trigger').forEach(el => {
    const fresh = el.cloneNode(true); el.replaceWith(fresh);
    fresh.addEventListener('click', (e) => {
      e.stopPropagation();
      const src = fresh.dataset.src;
      if (!src) return;

      const card = fresh.closest('.post-card');
      const pid = card?.dataset.id;
      const post = allOrgPosts.find(p => p.id === pid);
      
      if (post && post.imageURLs && post.imageURLs.length > 0) {
        window.currentGallery = post.imageURLs;
        window.currentIndex = post.imageURLs.indexOf(src);
        if (window.currentIndex === -1) window.currentIndex = 0;
        updateLightbox();
      } else {
        window.currentGallery = [src];
        window.currentIndex = 0;
        updateLightbox();
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
    return `<div class="lightbox-trigger" data-src="${imgs[0]}" style="cursor:pointer; margin-top:12px; border-radius:${borderRadius}; overflow:hidden; display:block;">
              <img src="${imgs[0]}" style="width:100%; display:block; object-fit:cover; max-height:500px;" />
            </div>`;
  }

  let style = `display: grid !important; height: 340px !important; gap: ${gap} !important; width: 100% !important; margin-top:12px; border-radius:${borderRadius}; overflow:hidden;`;
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

// Boot lightbox
initLightbox();
