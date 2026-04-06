import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, increment, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const db   = getFirestore(app);

let USER = {
  name:     "TUPian",
  photoSrc: "../assets/images/anon_avatar.jpg"
};

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
        let width  = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth)  { height *= maxWidth / width;   width  = maxWidth;  }
        } else {
          if (height > maxHeight){ width  *= maxHeight / height; height = maxHeight; }
        }
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
    };
  });
}

// ========================
// AUTH STATE
// ========================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap   = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      USER.name     = userData.fullName || user.displayName || "TUPian";
      USER.photoSrc = userData.photoURL || user.photoURL   || "../assets/images/anon_avatar.jpg";
      updateProfileUI(userData, user.email);
      loadUserPosts(user.uid);
    }
  } else {
    window.location.href = "../index.html";
  }
});

// ========================
// PROFILE UI UPDATE
// ========================
function updateProfileUI(userData, email) {
  const profileImg = document.querySelector('.profile-avatar-inner');
  if (profileImg && userData.photoURL) profileImg.src = userData.photoURL;

  const bannerImg = document.querySelector('.banner-img');
  if (bannerImg && userData.coverURL) bannerImg.src = userData.coverURL;

  const nameEl  = document.querySelector('.profile-name');
  const idEl    = document.querySelector('.profile-id');
  const emailEl = document.querySelector('.profile-email');
  if (nameEl)  nameEl.textContent  = userData.fullName  || "TUPian";
  if (idEl)    idEl.textContent    = userData.studentID || "TUPM-XX-XXXX";
  if (emailEl) emailEl.textContent = email;

  const commentModalInputAv = document.querySelector('.comment-modal-avatar img');
  if (commentModalInputAv && userData.photoURL) commentModalInputAv.src = userData.photoURL;

  const sidebarImg = document.querySelector('.sidebar-avatar-img');
  if (sidebarImg && userData.photoURL) sidebarImg.src = userData.photoURL;

  const postInputImg = document.querySelector('.post-input-img');
  if (postInputImg && userData.photoURL) postInputImg.src = userData.photoURL;

  const modalAvatarEl = document.getElementById('modal-avatar');
  if (modalAvatarEl && userData.photoURL) {
    modalAvatarEl.innerHTML = `<img src="${userData.photoURL}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  }

  const modalNameEl = document.getElementById('modal-user-name');
  if (modalNameEl) modalNameEl.textContent = userData.fullName || "TUPian";
  
  const commentModalAv = document.querySelector('.comment-modal-avatar img');
  if (commentModalAv && userData.photoURL) commentModalAv.src = userData.photoURL;

  document.querySelectorAll('.comment-data').forEach(cd => {
    if (cd.dataset.author === (userData.fullName || "TUPian")) cd.dataset.avatar = userData.photoURL;
  });

  document.querySelectorAll('.post-card').forEach(card => {
    updateFeedCommentPreview(card);
  });
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
  if (dropdown && wrap && !wrap.contains(e.target)) dropdown.classList.remove('open');
});

// ========================
// PHOTO UPLOAD → FIREBASE
// ========================
document.getElementById('profilePhotoInput').addEventListener('change', async function (e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('changePhotoDropdown').classList.remove('open');
  const base64 = await compressImage(file, 400, 400);
  updateUserPhotosInFirebase('photoURL', base64);
});

document.getElementById('coverPhotoInput').addEventListener('change', async function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const base64 = await compressImage(file, 800, 400);
  updateUserPhotosInFirebase('coverURL', base64);
});

async function updateUserPhotosInFirebase(field, base64String) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await updateDoc(doc(db, "users", user.uid), { [field]: base64String });
    showToast("Photo updated successfully!");

    if (field === 'photoURL') {
      const imgSrc = base64String;
      USER.photoSrc = imgSrc;

      // Update past posts in Firebase
      const postsQuery = query(collection(db, "posts"), where("userId", "==", user.uid));
      const postsSnapshot = await getDocs(postsQuery);
      postsSnapshot.forEach(async (postDoc) => {
        await updateDoc(doc(db, "posts", postDoc.id), { photoURL: imgSrc });
      });

      const profileImg = document.querySelector('.profile-avatar-inner');
      if (profileImg) profileImg.src = imgSrc;

      const sidebarImg = document.querySelector('.sidebar-avatar-img');
      if (sidebarImg) sidebarImg.src = imgSrc;

      const navImg = document.querySelector('#nav-profile-avatar img');
      if (navImg) navImg.src = imgSrc;

      const postInputImg = document.querySelector('.post-input-img');
      if (postInputImg) postInputImg.src = imgSrc;

      const anonToggle = document.getElementById('anonToggle');
      if (anonToggle && !anonToggle.checked) {
        const modalAvatarEl = document.getElementById('modal-avatar');
        if (modalAvatarEl) modalAvatarEl.innerHTML = `<img src="${imgSrc}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      }

      document.querySelectorAll('.post-card').forEach(card => {
        const postData = card.dataset;
        if (postData.userId === user.uid || postData.uid === user.uid || postData.authorId === user.uid) {
          const av = card.querySelector('.post-avatar img');
          if (av) av.src = imgSrc;
        }
      });

      document.querySelectorAll('.comment-input-row .comment-avatar img').forEach(av => { av.src = imgSrc; });

      const commentModalAv = document.querySelector('.comment-modal-avatar img');
      if (commentModalAv) commentModalAv.src = imgSrc;

      document.querySelectorAll('.comment-data').forEach(cd => {
        if (cd.dataset.userId === user.uid) cd.dataset.avatar = imgSrc;
      });

      document.querySelectorAll('.post-card').forEach(card => {
        updateFeedCommentPreview(card);
      });

      document.querySelectorAll('.comment-modal-item').forEach(item => {
        if (item.dataset.userId === user.uid) {
          const img = item.querySelector('.comment-modal-item-avatar img');
          if (img) img.src = imgSrc;
        }
      });

      document.querySelectorAll('.feed-comment-preview .comment-modal-item').forEach(item => {
        if (item.dataset.userId === user.uid) {
          const img = item.querySelector('.comment-modal-item-avatar img');
          if (img) img.src = imgSrc;
        }
      });

    } else if (field === 'coverURL') {
      const bannerImg = document.querySelector('.banner-img');
      if (bannerImg) bannerImg.src = base64String;
    }
  } catch (error) {
    console.error("Error updating photo:", error);
    showToast("Failed to update photo.");
  }
}

// ========================
// TOAST
// ========================
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) { console.log("Toast:", msg); return; }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove('show'), 2200);
}

// ========================
// HELPERS
// ========================
function getTemplate(id) {
  const tpl = document.getElementById(id);
  if (!tpl) return '';
  const div = document.createElement('div');
  div.appendChild(tpl.content.cloneNode(true));
  return div.innerHTML;
}

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

function escapeHTML(str) {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1).replace(/\.0$/, '')    + 'K';
  return String(n);
}

// ========================
// REACTIONS BAR
// ========================
function buildReactions(postId, likes = 0, comments = 0, reposts = 0, isLikedByMe = false) {
  return `
    <div class="feed-reactions">
      <button class="feed-reaction-btn ${isLikedByMe ? 'heart-active' : ''}" data-id="${postId}" data-type="like">
        <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span class="reaction-likes-count">${fmt(likes)}</span> Heart
      </button>
      <button class="feed-reaction-btn" data-id="${postId}" data-type="comment">
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span class="reaction-comments-count">${fmt(comments)}</span> Comment
      </button>
      <button class="feed-reaction-btn" data-id="${postId}" data-type="repost">
        <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        <span class="reaction-reposts-count">${fmt(reposts)}</span> Repost
      </button>
    </div>`;
}

// ========================
// RENDER POST (from Firebase)
// ========================
function renderPost(data, postId) {
  const feed     = document.getElementById('feed');
  const postCard = document.createElement('div');
  postCard.className  = 'post-card';
  postCard.dataset.id = postId;
  postCard.dataset.userId = data.userId || data.uid || data.authorId;

  const likeCount    = data.likedBy    ? data.likedBy.length    : 0;
  const commentCount = data.comments   || 0;
  const repostCount  = data.repostedBy ? data.repostedBy.length : 0;
  const isLikedByMe  = data.likedBy && data.likedBy.includes(auth.currentUser?.uid);
  const menuId       = 'menu-' + postId;

  let bodyHtml = '';
  if (data.repostOf) {
    // Repost
    bodyHtml = `
      <div class="repost-label">
        <svg viewBox="0 0 24 24" class="repost-label-icon"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> 
        ${data.userId === auth.currentUser?.uid ? 'You' : data.author} Reposted
        </div>
      ${data.text ? `<div class="repost-quote-text">${data.text}</div>` : ''}
      <div class="repost-quote-card">
        <div class="repost-quote-header">
          <div class="repost-quote-avatar">
            <img src="${data.repostAuthorPhoto || '../assets/images/anon_avatar.jpg'}" alt="${data.repostAuthor}">
          </div>
          <div class="repost-quote-meta">
            <div class="repost-quote-author">${data.repostAuthor}</div>
            <div class="repost-quote-time">${formatRelativeTime(data.createdAt.toDate())}</div>
          </div>
        </div>
        <div class="repost-quote-body">${data.repostText}</div>
        ${data.repostImage ? `<div class="post-images" style="display:flex; justify-content:center; align-items:center; text-align: center;"><img src="${data.repostImage}" style="max-width: 100%; height: auto;"></div>` : ''}
      </div>`;
  } else {
    bodyHtml = `${data.text ? `<div class="post-body">${data.text}</div>` : ''}${data.imageURL ? `<div class="post-images" style="display:flex; justify-content:center; align-items:center;"><img src="${data.imageURL}" style="max-width: 100%; height: auto; object-fit: cover;"></div>` : ''}`;
  }

  postCard.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">
        <img src="${data.photoURL || '../assets/images/anon_avatar.jpg'}" alt="Avatar">
      </div>
      <div class="post-meta">
        <div class="post-author">${data.author || "TUPian"}</div>
        <div class="post-time">${formatRelativeTime(data.createdAt.toDate())}</div>
      </div>
      <button class="post-menu" onclick="toggleMenu(event, '${menuId}')">
        <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
        <div class="dropdown-menu" id="${menuId}">${getTemplate('menu-template')}</div>
      </button>
    </div>
    ${bodyHtml}
    <div class="comments-data" style="display:none;"></div>
    <div class="reposts-data"  style="display:none;"></div>
    ${buildReactions(postId, likeCount, commentCount, repostCount, isLikedByMe)}
    <div class="post-repost-info" onclick="viewReposts(event)" style="display:none;">
      <svg width="193px" height="193px" viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M14.2893 5.70708C13.8988 5.31655 13.2657 5.31655 12.8751 5.70708L7.98768 10.5993C7.20729 11.3805 7.2076 12.6463 7.98837 13.427L12.8787 18.3174C13.2693 18.7079 13.9024 18.7079 14.293 18.3174C14.6835 17.9269 14.6835 17.2937 14.293 16.9032L10.1073 12.7175C9.71678 12.327 9.71678 11.6939 10.1073 11.3033L14.2893 7.12129C14.6799 6.73077 14.6799 6.0976 14.2893 5.70708Z" fill="#0F0F0F"></path> </g></svg>
      <span class="repost-info-text"></span>
    </div>
    <span class="view-comments" onclick="openCommentModal(this)" style="display:none;">View more comments</span>
    <div class="comment-input-row always-visible" onclick="openCommentModal(this)">
      <div class="comment-avatar">
        <img src="${USER.photoSrc || '../assets/images/anon_avatar.jpg'}" alt="You">
      </div>
      <input class="comment-input" placeholder="Write a comment..." readonly>
    </div>`;

  feed.appendChild(postCard);
  if (data.comments && data.comments > 0) {
    loadCommentsForPost(postId, postCard);
  }
  // Always load repost documents for this post so the "View repost(s)" line appears
  // even when the repost metadata field is missing or out of sync.
  loadRepostsForPost(postId, postCard);
}

async function loadCommentsForPost(postId, postCard) {
  if (!postCard) return;
  const commentsStore = postCard.querySelector('.comments-data');
  if (!commentsStore) return;

  try {
    const commentsQuery = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(commentsQuery);
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const cd = document.createElement('div');
      cd.className = 'comment-data';
      cd.dataset.commentId = docSnap.id;
      cd.dataset.userId = data.userId || '';
      cd.dataset.author = data.author || 'Anonymous';
      cd.dataset.avatar = data.photoURL || '../assets/images/anon_avatar.jpg';
      cd.dataset.text = data.text || '';
      cd.dataset.time = data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      cd.dataset.isOwn = data.userId === auth.currentUser?.uid ? 'true' : 'false';
      commentsStore.appendChild(cd);
    });
    updateFeedCommentPreview(postCard);
  } catch (error) {
    console.error('Could not load comments for post', postId, error);
  }
}

async function loadRepostsForPost(postId, postCard) {
  const repostsStore = postCard.querySelector('.reposts-data');
  if (!repostsStore) return;

  try {
    const repostsQuery = query(
      collection(db, "posts"),
      where("repostOf", "==", postId)
    );
    const snapshot = await getDocs(repostsQuery);
    const sortedDocs = snapshot.docs.sort((a, b) => {
      const aTime = a.data().createdAt ? a.data().createdAt.toDate().getTime() : 0;
      const bTime = b.data().createdAt ? b.data().createdAt.toDate().getTime() : 0;
      return aTime - bTime;
    });

    sortedDocs.forEach((docSnap) => {
      const data = docSnap.data();
      const rd = document.createElement('div');
      rd.className = 'repost-data';
      rd.dataset.repostDocId = docSnap.id;
      rd.dataset.author   = data.author || 'Unknown';
      rd.dataset.avatar   = data.photoURL || '../assets/images/anon_avatar.jpg';
      rd.dataset.quote    = data.text || '';
      rd.dataset.hasQuote = data.text ? 'true' : 'false';
      rd.dataset.time     = data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      repostsStore.appendChild(rd);
    });

    updateRepostInfo(postCard);

    const user = auth.currentUser;
    if (user) {
      const alreadyReposted = [...repostsStore.querySelectorAll('.repost-data')]
        .some(rd => rd.dataset.author === USER.name);
      if (alreadyReposted) {
        const btn = postCard.querySelector('[data-type="repost"]');
        if (btn) {
          btn.classList.add('repost-active');
          btn.lastChild.textContent = ' Reposted';
        }
      }
    }
  } catch (error) {
    console.error('Could not load reposts for post', postId, error);
  }
}

// ========================
// LOAD USER POSTS
// ========================
function loadUserPosts(userId) {
  const feedContainer = document.getElementById('feed');
  const q = query(
    collection(db, "posts"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      feedContainer.innerHTML = '<p class="no-posts">No posts found yet.</p>';
      return;
    }
    feedContainer.innerHTML = '';
    snapshot.forEach((d) => renderPost(d.data(), d.id));

    setTimeout(() => {
      const user = auth.currentUser;
      if (user) {
        document.querySelectorAll('.comment-data').forEach(cd => {
          if (cd.dataset.author === USER.name) cd.dataset.avatar = USER.photoSrc;
        });
        document.querySelectorAll('.post-card').forEach(card => {
          updateFeedCommentPreview(card);
        });
      }
    }, 500);
    
  }, (error) => {
    console.error("Feed Error:", error);
  });
}

// ========================
// LIKE TOGGLE → FIREBASE
// ========================
async function toggleLike(postId, btn) {
  const user = auth.currentUser;
  if (!user) return;

  const postRef       = doc(db, "posts", postId);
  const likeCountSpan = btn.querySelector('.reaction-likes-count');
  const isLiking      = !btn.classList.contains('heart-active');

  if (isLiking) {
    const rect   = btn.getBoundingClientRect();
    const cx     = rect.left + rect.width  / 2;
    const cy     = rect.top  + rect.height / 2;
    [0,45,90,135,180,225,270,315].forEach(angle => {
      const p   = document.createElement('div');
      p.className = 'heart-burst';
      const rad  = angle * Math.PI / 180;
      const dist = 28 + Math.random() * 14;
      p.style.setProperty('--dx', `${Math.cos(rad) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(rad) * dist}px`);
      p.style.left = `${cx - 3}px`;
      p.style.top  = `${cy - 3}px`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 600);
    });
  }

  try {
    if (isLiking) {
      btn.classList.add('heart-active');
      await updateDoc(postRef, { likedBy: arrayUnion(user.uid) });
      likeCountSpan.textContent = parseInt(likeCountSpan.textContent) + 1;
    } else {
      btn.classList.remove('heart-active');
      await updateDoc(postRef, { likedBy: arrayRemove(user.uid) });
      likeCountSpan.textContent = Math.max(0, parseInt(likeCountSpan.textContent) - 1);
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    showToast("Failed to update like.");
  }
}

// ========================
// REPOST CLICK
// ========================
function handleRepostClick(btn) {
  const isActive = btn.classList.toggle('repost-active');

  if (isActive) {
    btn.lastChild.textContent = ' Reposted';
    openRepostModal(btn);
  } else {
    const user = auth.currentUser;
    const originalCard = btn.closest('.post-card');
    const originalPostId = originalCard.dataset.id;
    const repostsStore = originalCard.querySelector('.reposts-data');

    // Find the repost-data belonging to the current user
    const myRepostData = repostsStore
      ? [...repostsStore.querySelectorAll('.repost-data')].find(rd => rd.dataset.author === USER.name)
      : null;

    if (myRepostData) {
      const repostDocId = myRepostData.dataset.repostDocId;
      if (repostDocId && user) {
        // Delete repost post doc
        deleteDoc(doc(db, "posts", repostDocId)).catch(console.error);
        // Remove user from repostedBy on original post
        updateDoc(doc(db, "posts", originalPostId), {
          repostedBy: arrayRemove(user.uid)
        }).catch(console.error);
      }
      myRepostData.remove();
    }

    const countSpan = btn.querySelector('.reaction-reposts-count');
    if (countSpan) countSpan.textContent = fmt(Math.max(0, parseInt(countSpan.textContent) - 1));
    btn.lastChild.textContent = ' Repost';
    updateRepostInfo(originalCard);
    showToast('Repost removed!');
  }
}

// ========================
// DROPDOWN MENU
// ========================
function toggleMenu(e, id) {
  e.stopPropagation();
  document.querySelectorAll('.dropdown-menu').forEach(m => {
    if (m.id !== id) m.classList.remove('open');
  });
  document.getElementById(id)?.classList.toggle('open');
}

document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
});

// ========================
// DELETE POST
// ========================
async function deletePost(e) {
  const card = e.target.closest('.post-card');
  const postId = card.dataset.id;
  const user = auth.currentUser;
  if (!user) return;

  try {
    await deleteDoc(doc(db, "posts", postId));
    card.style.transition = 'opacity 0.28s, transform 0.28s';
    card.style.opacity    = '0';
    card.style.transform  = 'scale(0.93)';
    setTimeout(() => card.remove(), 300);
    showToast('Post deleted.');
  } catch (error) {
    console.error('Delete error:', error);
    showToast('Failed to delete post.');
  }
}
// ========================
// EDIT POST
// ========================
async function editPost(e) {
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
      await updateDoc(doc(db, "posts", postId), { text: newText });
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
}

// ========================
// POST MODAL
// ========================
const fileInput  = document.getElementById('modal-file-input');
const attachWrap = document.getElementById('modal-attachments');
const submitBtn  = document.getElementById('modal-submit-btn');
const textarea   = document.getElementById('postContent') || document.getElementById('post-textarea');

function updateSubmitButton() {
  const hasContent = textarea && textarea.value.trim().length > 0;
  const hasImages  = attachWrap && attachWrap.querySelectorAll('.modal-attach-thumb').length > 0;
  if (submitBtn) submitBtn.disabled = !hasContent && !hasImages;
}

if (textarea) textarea.addEventListener('input', updateSubmitButton);

document.getElementById('btn-add-photo')?.addEventListener('click', e => {
  e.stopPropagation();
  openPostModal();
  setTimeout(() => fileInput?.click(), 150);
});

document.querySelector('.modal-add-photo-btn')?.addEventListener('click', e => {
  e.stopPropagation();
  fileInput?.click();
});

fileInput?.addEventListener('change', function () {
  Array.from(this.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      const thumb     = document.createElement('img');
      thumb.src       = ev.target.result;
      thumb.className = 'modal-attach-thumb';
      thumb.title     = 'Click to remove';
      thumb.addEventListener('click', () => { thumb.remove(); updateSubmitButton(); });
      attachWrap.appendChild(thumb);
    };
    reader.readAsDataURL(file);
  });
  updateSubmitButton();
});

function openPostModal() {
  document.getElementById('postModal').classList.add('open');
  setTimeout(() => document.getElementById('postContent')?.focus(), 120);
  updateSubmitButton();
}

function closePostModal() {
  document.getElementById('postModal').classList.remove('open');
}

function closeModalOnOverlay(e) {
  if (e.target === document.getElementById('postModal')) closePostModal();
}

async function submitPost() {
  const content = document.getElementById('postContent').value.trim();
  const thumbs  = Array.from(attachWrap.querySelectorAll('.modal-attach-thumb'));
  if (!content && thumbs.length === 0) { showToast('Write something first!'); return; }

  const user = auth.currentUser;
  if (!user) { showToast('Login to post!'); return; }

  const isAnon = document.getElementById('anonToggle').checked;
  const author = isAnon ? 'Anonymous' : USER.name;
  const avatar = isAnon ? '../assets/images/anon_avatar.jpg' : USER.photoSrc;

  const imageURLs = thumbs.map(img => img.src);

  try {
    await addDoc(collection(db, "posts"), {
      userId: user.uid,
      author: author,
      photoURL: avatar,
      text: content,
      imageURL: imageURLs.length > 0 ? imageURLs[0] : null, // For simplicity, take first image
      createdAt: serverTimestamp(),
      likedBy: [],
      comments: 0
    });

    showToast('Post created!');
    closePostModal();
    document.getElementById('postContent').value = '';
    document.getElementById('anonToggle').checked = false;
    attachWrap.innerHTML = '';
    updateSubmitButton();
  } catch (error) {
    console.error('Post error:', error);
    showToast('Failed to create post.');
  }
}

// ========================
// COMMENT MODAL
// ========================
let _currentPostCard = null;

async function openCommentModal(el) {
  const card = el.closest('.post-card');
  if (!card) return;
  _currentPostCard = card;
  const list = document.getElementById('commentModalList');
  list.innerHTML = '';

  const existingComments = card.querySelectorAll('.comment-data');
  if (existingComments.length === 0) {
    const commentCount = parseInt(card.querySelector('.reaction-comments-count')?.textContent || '0');
    if (commentCount > 0) {
      await loadCommentsForPost(card.dataset.id, card);
    }
  }

  card.querySelectorAll('.comment-data').forEach((cd, cIdx) => {
    list.appendChild(buildCommentModalItem(
      cd.dataset.author, cd.dataset.avatar,
      cd.dataset.text,   cd.dataset.time,
      cd.dataset.isOwn === 'true', cIdx,
      cd.dataset.userId
    ));
  });

  bindCommentActions();
  document.getElementById('commentModal').classList.add('open');
  setTimeout(() => document.getElementById('commentModalInput')?.focus(), 120);
}

function buildCommentModalItem(author, avatar, text, time, isOwn, cIdx, userId = '') {
  const item = document.createElement('div');
  item.className = 'comment-modal-item';
  item.id = `comment-modal-item-${cIdx}`;
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

      if (_currentPostCard) {
        const postId = _currentPostCard.dataset.id;
        const cds    = _currentPostCard.querySelectorAll('.comment-data');
        const commentId = cds[c]?.dataset.commentId;

        try {
          if (postId && commentId) {
            await updateDoc(doc(db, "posts", postId, "comments", commentId), { text: newText });
          }
          document.getElementById(`comment-modal-text-${c}`).textContent = newText;
          document.getElementById(`comment-modal-bubble-${c}`).style.display = '';
          document.getElementById(`comment-modal-edit-${c}`).classList.remove('open');
          if (cds[c]) cds[c].dataset.text = newText;
          updateFeedCommentPreview(_currentPostCard);
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

      if (_currentPostCard) {
        const postId = _currentPostCard.dataset.id;
        const cds    = _currentPostCard.querySelectorAll('.comment-data');
        const commentId = cds[c]?.dataset.commentId;

        try {
          if (postId && commentId) {
            await deleteDoc(doc(db, "posts", postId, "comments", commentId));
            await updateDoc(doc(db, "posts", postId), { comments: increment(-1) });
          }
          item.style.transition = 'opacity 0.2s, transform 0.2s';
          item.style.opacity    = '0';
          item.style.transform  = 'translateX(12px)';
          setTimeout(() => item.remove(), 200);
          if (cds[c]) cds[c].remove();
          const countEl = _currentPostCard.querySelector('.reaction-comments-count');
          if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
          updateFeedCommentPreview(_currentPostCard);
          showToast('Comment deleted.');
        } catch (error) {
          console.error('Delete comment error:', error);
          showToast('Failed to delete comment.');
        }
      }
    });
  });
}

function closeCommentModal() {
  document.getElementById('commentModal').classList.remove('open');
  const inp = document.getElementById('commentModalInput');
  if (inp) inp.value = '';
  _currentPostCard = null;
}

function closeCommentModalOnOverlay(e) {
  if (e.target === document.getElementById('commentModal')) closeCommentModal();
}

function handleModalCommentKey(e) {
  if (e.key === 'Enter') submitModalComment();
}

async function submitModalComment() {
  const input = document.getElementById('commentModalInput');
  const text  = input.value.trim();
  if (!text) return;

  const now  = new Date();
  const list = document.getElementById('commentModalList');
  const cIdx = list.querySelectorAll('.comment-modal-item').length;

  list.appendChild(buildCommentModalItem(
    USER.name,
    USER.photoSrc || '../assets/images/anon_avatar.jpg',
    text, now.toISOString(), true, cIdx,
    auth.currentUser?.uid || ''
  ));
  list.scrollTop = list.scrollHeight;
  bindCommentActions();

  if (!_currentPostCard) { input.value = ''; return; }

  const postId = _currentPostCard.dataset.id;
  if (!postId) { input.value = ''; return; }

  const store      = _currentPostCard.querySelector('.comments-data');
  const cd         = document.createElement('div');
  cd.className     = 'comment-data';
  cd.dataset.commentId = '';
  cd.dataset.userId = auth.currentUser?.uid || '';
  cd.dataset.author = USER.name;
  cd.dataset.avatar = USER.photoSrc || '../assets/images/anon_avatar.jpg';
  cd.dataset.text  = text;
  cd.dataset.time  = now.toISOString();
  cd.dataset.isOwn = 'true';
  if (store) store.appendChild(cd);

  try {
    const commentRef = await addDoc(collection(db, "posts", postId, "comments"), {
      text: text,
      author: USER.name,
      userId: auth.currentUser?.uid || null,
      photoURL: USER.photoSrc || '../assets/images/anon_avatar.jpg',
      createdAt: serverTimestamp()
    });
    cd.dataset.commentId = commentRef.id;

    await updateDoc(doc(db, "posts", postId), {
      comments: increment(1)
    });
  } catch (error) {
    console.error('Failed to save comment:', error);
  }

  const countEl = _currentPostCard.querySelector('.reaction-comments-count');
  if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
  updateFeedCommentPreview(_currentPostCard);

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
      <div class="comment-modal-item" data-user-id="${latest.dataset.userId || ''}">
        <div class="comment-modal-item-avatar">
          <img src="${latest.dataset.avatar}" alt="${escapeHTML(latest.dataset.author)}" onerror="this.parentElement.textContent='👤'">
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
// REPOST MODAL
// ========================
let _currentRepostBtn = null;
let _repostSubmitted = false;

function openRepostModal(btn) {
  _currentRepostBtn = btn;
  _repostSubmitted = false;
  document.getElementById('repostModal').classList.add('open');
  document.getElementById('repostContent').focus();
}

function closeRepostModal() {
  if (!_repostSubmitted && _currentRepostBtn) {
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

async function submitRepost() {
  const quote = document.getElementById('repostContent').value.trim();
  _repostSubmitted = true;
  if (_currentRepostBtn) {
    await createRepost(_currentRepostBtn, quote);
    showToast('You Reposted!');
  }
  closeRepostModal();
}

async function createRepost(btn, quote = '') {
  const user = auth.currentUser;
  if (!user) return;

  const originalCard = btn.closest('.post-card');
  const originalPostId = originalCard.dataset.id;
  const originalAuthor = originalCard.querySelector('.post-author')?.textContent || 'Unknown';
  const originalText = originalCard.querySelector('.post-body')?.innerHTML || '';
  const originalImage = originalCard.querySelector('.post-images img')?.src || null;
  const originalAuthorPhoto = originalCard.querySelector('.post-avatar img')?.src || '../assets/images/anon_avatar.jpg';

  try {
    const repostRef = await addDoc(collection(db, "posts"), {
      userId: user.uid,
      author: USER.name,
      photoURL: USER.photoSrc,
      text: quote,
      imageURL: null,
      createdAt: serverTimestamp(),
      likedBy: [],
      comments: 0,
      repostOf: originalPostId,
      repostAuthor: originalAuthor,
      repostText: originalText,
      repostImage: originalImage,
      repostAuthorPhoto: originalAuthorPhoto
    });

    const originalPostRef = doc(db, "posts", originalPostId);
    await updateDoc(originalPostRef, {
      repostedBy: arrayUnion(user.uid)
    });

    const countSpan = btn.querySelector('.reaction-reposts-count');
    if (countSpan) countSpan.textContent = fmt(parseInt(countSpan.textContent || '0') + 1);
    btn.lastChild.textContent = ' Reposted';

    const repostsStore = originalCard.querySelector('.reposts-data');
    if (repostsStore) {
      const rd = document.createElement('div');
      rd.className = 'repost-data';
      rd.dataset.repostDocId = repostRef.id; // store doc ID
      rd.dataset.author   = USER.name;
      rd.dataset.avatar   = USER.photoSrc;
      rd.dataset.quote    = quote;
      rd.dataset.hasQuote = quote ? 'true' : 'false';
      rd.dataset.time     = new Date().toISOString();
      repostsStore.appendChild(rd);
    }

    updateRepostInfo(originalCard);

  } catch (error) {
    console.error('Repost error:', error);
    showToast('Failed to repost.');
  }
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

// ========================
// LOGOUT
// ========================
document.getElementById('btn-logout')?.addEventListener('click', () => {
  signOut(auth).then(() => {
    localStorage.clear();
    window.location.href = "../index.html";
  }).catch(console.error);
});

// ========================
// DOM CONTENT LOADED
// ========================
document.addEventListener('DOMContentLoaded', () => {

  const commentInput  = document.getElementById('commentModalInput');
  const commentSubmit = document.querySelector('.comment-modal-submit');
  if (commentInput && commentSubmit) {
    commentInput.addEventListener('input', () => {
      commentSubmit.style.opacity = commentInput.value.trim() ? '1' : '0.35';
    });
  }

  const anonToggle = document.getElementById('anonToggle');
  if (anonToggle) {
    anonToggle.addEventListener('change', function () {
      const nameEl   = document.getElementById('modal-user-name');
      const avatarEl = document.getElementById('modal-avatar');
      if (this.checked) {
        if (nameEl)   nameEl.textContent = 'Anonymous';
        if (avatarEl) avatarEl.innerHTML = `<img src="../assets/images/anon_avatar.jpg" alt="Anonymous" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        if (nameEl)   nameEl.textContent = USER.name;
        if (avatarEl) avatarEl.innerHTML = USER.photoSrc
          ? `<img src="${USER.photoSrc}" alt="Me" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
          : `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      }
    });
  }

  document.addEventListener('click', function (e) {
    const bubble = e.target.closest('.feed-comment-preview .comment-modal-item-bubble');
    if (bubble) openCommentModal(bubble);
  });

  setInterval(() => {
    document.querySelectorAll('.comment-modal-item-time').forEach(el => {
      if (el.dataset.timestamp) el.textContent = formatRelativeTime(new Date(el.dataset.timestamp));
    });
  }, 60000);

  // Sidebar navigation
  (function () {
    const navWrap  = document.getElementById('sidebar-nav');
    const teardrop = document.getElementById('nav-teardrop');
    if (!navWrap || !teardrop) return;

    const navBtns = Array.from(navWrap.querySelectorAll('.nav-btn'));
    const profBtn = document.getElementById('sidebar-avatar-wrap');
    const allBtns = profBtn ? [...navBtns, profBtn] : [...navBtns];
    const TD_BASE_H = 66;

    function moveTo(item) {
      const wrapRect = navWrap.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      teardrop.style.top = (itemRect.top + itemRect.height / 2 - wrapRect.top - TD_BASE_H / 2) + 'px';
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

    if (profBtn) {
      profBtn.addEventListener('click', function () {
        allBtns.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        moveTo(this);
        window.location.href = '../pages/profile.html';
      });
    }

    const active = navWrap.querySelector('.nav-btn.active') || profBtn;
    if (active) {
      teardrop.style.transition = 'none';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        moveTo(active);
        teardrop.style.transition = '';
      }));
    }
  })();
});

// ========================
// EXPOSE TO HTML onclick
// ========================
window.toggleChangePhotoMenu         = toggleChangePhotoMenu;
window.toggleMenu                    = toggleMenu;
window.deletePost                    = deletePost;
window.editPost                      = editPost;
window.openPostModal                 = openPostModal;
window.closePostModal                = closePostModal;
window.closeModalOnOverlay           = closeModalOnOverlay;
window.submitPost                    = submitPost;
window.openCommentModal              = openCommentModal;
window.closeCommentModal             = closeCommentModal;
window.closeCommentModalOnOverlay    = closeCommentModalOnOverlay;
window.handleModalCommentKey         = handleModalCommentKey;
window.submitModalComment            = submitModalComment;
window.openRepostModal               = openRepostModal;
window.closeRepostModal              = closeRepostModal;
window.closeRepostModalOnOverlay     = closeRepostModalOnOverlay;
window.submitRepost                  = submitRepost;
window.viewReposts                   = viewReposts;
window.closeRepostViewModal          = closeRepostViewModal;
window.closeRepostViewModalOnOverlay = closeRepostViewModalOnOverlay;
window.askSuggestion                 = askSuggestion;
window.toggleChat                    = toggleChat;
window.sendMessage                   = sendMessage;  

// ========================
// FEED CLICK HANDLER
// ========================
document.getElementById('feed').addEventListener('click', async (e) => {
  const btn = e.target.closest('.feed-reaction-btn');
  if (!btn) return;

  const postId = btn.dataset.id;
  const type   = btn.dataset.type;
  const user   = auth.currentUser;
  if (!user) { showToast('Login to interact!'); return; }

  const postRef = doc(db, "posts", postId);

  try {
    if (type === 'like') {
      const isLiked = btn.classList.contains('heart-active');
      if (!isLiked) {
        await updateDoc(postRef, { likedBy: arrayUnion(user.uid) });
        btn.classList.add('heart-active');
        const countEl = btn.querySelector('.reaction-likes-count');
        if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
      } else {
        await updateDoc(postRef, { likedBy: arrayRemove(user.uid) });
        btn.classList.remove('heart-active');
        const countEl = btn.querySelector('.reaction-likes-count');
        if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
      }
    } else if (type === 'comment') {
      openCommentModal(btn);
    } else if (type === 'repost') {
      handleRepostClick(btn);
    }
  } catch (error) {
    console.error('Reaction error:', error);
    showToast('Failed to update reaction.');
  }
});

// ========================
// CHATBOT
// ========================

function toggleChat() {
  const modal = document.getElementById('chatModal');
  modal.classList.toggle('active');
}

function askSuggestion(text) {
  document.getElementById('userInput').value = text;
  sendMessage();
}

function sendMessage() {
  const input = document.getElementById('userInput');
  const body = document.getElementById('chatBody');
  const text = input.value.trim();
  if (!text) return;

  // Remove suggestions once user sends a message
  const suggestions = body.querySelector('.suggestions');
  if (suggestions) suggestions.remove();

  // User message
  const userMsg = document.createElement('div');
  userMsg.className = 'user-message';
  userMsg.textContent = text;
  body.appendChild(userMsg);
  input.value = '';
  body.scrollTop = body.scrollHeight;

  // Bot reply
  setTimeout(() => {
    const botRow = document.createElement('div');
    botRow.className = 'bot-row';
    botRow.innerHTML = `
      <img src="../assets/images/Tupee_logo.png" class="bot-row-avatar">
      <div class="bot-message">I'm still learning! Check back soon. 😊</div>
    `;
    body.appendChild(botRow);
    body.scrollTop = body.scrollHeight;
  }, 500);
}