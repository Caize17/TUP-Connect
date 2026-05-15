import { auth, db } from "../firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, onSnapshot, serverTimestamp, query, orderBy, increment, where, doc, getDoc, addDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentProfile = { name: "TUPian", photo: null };
let updatePostBox = null;

const imageInput = document.getElementById('modal-file-input');
const imagePreview = document.getElementById('post-image-preview');
const addImageBtn = document.getElementById('modal-photo-btn');
const closeBtn = document.getElementById('modal-close-btn');

if (addImageBtn && imageInput) {
  addImageBtn.addEventListener('click', () => imageInput.click());
  
  imageInput.addEventListener('change', async function () {
    const attachments = document.getElementById('modal-attachments');
    if (!attachments) return;

    attachments.style.display = 'flex';

    for (const file of this.files) {
      try {
        const compressedBase64 = await compressImage(file);
        const thumb = document.createElement('div');
        thumb.className = 'modal-attach-thumb-wrapper';
        thumb.style.cssText = 'position:relative; width:80px; height:80px; flex-shrink:0;';
        
        thumb.innerHTML = `
          <img src="${compressedBase64}" class="modal-attach-thumb" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">
          <button class="modal-attach-remove" style="position:absolute; top:-5px; right:-5px; background:rgba(0,0,0,0.6); color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px;">✕</button>
        `;

        thumb.querySelector('.modal-attach-remove').addEventListener('click', () => {
          thumb.remove();
          if (attachments.querySelectorAll('.modal-attach-thumb-wrapper').length === 0) {
            attachments.style.display = 'none';
          }
        });

        attachments.appendChild(thumb);
      } catch (err) {
        console.error("Compression error:", err);
      }
    }
    imageInput.value = ''; // Reset for same-file re-upload
  });
}

async function compressImage(file, maxWidth = 1200, maxHeight = 1200) {
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
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });
}

async function getCompressedImageData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1600;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


const submitBtn = document.getElementById('modal-submit-btn');
const anonToggle = document.getElementById('modal-anon-toggle');
const overlay = document.getElementById('create-post-overlay');

window.resetPostModal = function () {
  const liveTextarea = document.getElementById('post-textarea');
  const attachments = document.getElementById('modal-attachments');
  const fileInput = document.getElementById('modal-file-input');
  const anonToggle = document.getElementById('modal-anon-toggle');

  if (liveTextarea) liveTextarea.value = '';

  if (fileInput) fileInput.value = "";

  if (attachments) {
    attachments.innerHTML = '';
    attachments.style.display = 'none';
  }

  if (anonToggle) {
    anonToggle.checked = false;
  }

  if (typeof updatePostBox === 'function' && currentProfile) {
    updatePostBox(currentProfile.name, currentProfile.photo);
  }
};

async function uploadPostToFirestore(text, imageURLs, isAnonymous) {
  const user = auth.currentUser;
  let name = currentProfile.name;
  let photo = currentProfile.photo;

  if (isAnonymous) {
    name = "Anonymous Puto";
    photo = "../assets/images/anon_avatar.jpg";
  }

  const cache = JSON.parse(localStorage.getItem('tup_user_meta') || '{}');
  const isAdmin = cache.role === 'Admin' || cache.role === 'USG';
  const isOrg = cache.role === 'Organization';
  const college = cache.college || null;

  if (isAdmin) {
    return await addDoc(collection(db, "announcements"), {
      body: text,
      imageURL: imageURLs.length > 0 ? imageURLs[0] : "", // Legacy support
      imageURLs: imageURLs || [],
      userId: user?.uid || "unknown",
      author: name,
      photoURL: photo,
      createdAt: serverTimestamp(),
      likes: [],
      comments: [],
      reposts: [],
      college: college
    });
  }

  return await addDoc(collection(db, "posts"), {
    text: text,
    imageURL: imageURLs.length > 0 ? imageURLs[0] : "", // Legacy support
    imageURLs: imageURLs || [],
    userId: user?.uid || "unknown",
    author: name,
    photoURL: photo,
    isAnonymous: isAnonymous,
    createdAt: serverTimestamp(),
    likes: 0,
    isOrg: isOrg,
    college: college
  });
}

/**
 * Toggles the modal visibility and handles cleanup
 * @param {boolean} isOpen - true to open, false to close
 */
function setModalSelection(isOpen) {
  const overlay = document.getElementById('create-post-overlay');
  if (!overlay) return;

  if (isOpen) {
    overlay.classList.add('open');
    setTimeout(() => document.getElementById('post-textarea')?.focus(), 100);
  } else {
    overlay.classList.remove('open');
    resetPostModal();
  }
}

if (submitBtn) {
  submitBtn.addEventListener('click', async (e) => {
    e.stopImmediatePropagation();

    const liveTextarea = document.getElementById('post-textarea');
    const isAnon = document.getElementById('modal-anon-toggle')?.checked || false;
    const attachWrap = document.getElementById('modal-attachments');
    const thumbs = Array.from(attachWrap?.querySelectorAll('.modal-attach-thumb') || []);

    const text = liveTextarea ? liveTextarea.value.trim() : "";
    if (!text && thumbs.length === 0) return;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="loading-spinner"></span> Posting...`;

      const imageURLs = [];
      for (let i = 0; i < thumbs.length; i++) {
        const thumb = thumbs[i];
        imageURLs.push(thumb.src); // Already compressed base64 from fileInput listener
      }

      await uploadPostToFirestore(text, imageURLs, isAnon);

      setModalSelection(false);
      window.showToast('Post shared!', 'success');

    } catch (err) {
      console.error("❌ Post Error:", err);
      window.showToast("Failed to post: " + err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  updatePostBox = (name, photo) => {
    const postBoxNameEl = document.getElementById('modal-user-name');
    const avatarContainer = document.getElementById('modal-avatar');
    const feedBarAvatar = document.getElementById('comment-avatar-wrap');

    if (postBoxNameEl) postBoxNameEl.textContent = name;

    const imgHTML = photo
      ? `<img src="${photo}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
      : `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

    if (avatarContainer) avatarContainer.innerHTML = imgHTML;
    if (feedBarAvatar) feedBarAvatar.innerHTML = imgHTML;
  };

  currentProfile.name = user.displayName || "TUPian";
  currentProfile.photo = user.photoURL;

  updatePostBox(currentProfile.name, currentProfile.photo);

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      currentProfile.name = userData.fullName || currentProfile.name;
      currentProfile.photo = userData.photoURL || currentProfile.photo;

      // Update global cache for performance
      const cache = {
        ...userData,
        email: user.email,
        uid: user.uid
      };
      localStorage.setItem('tup_user_meta', JSON.stringify(cache));

      updatePostBox(currentProfile.name, currentProfile.photo);
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }

  const anonToggle = document.getElementById('modal-anon-toggle');
  if (anonToggle) {

    anonToggle.replaceWith(anonToggle.cloneNode(true));
    const newToggle = document.getElementById('modal-anon-toggle');

    newToggle.addEventListener('change', (e) => {
      const modalName = document.getElementById('modal-user-name');
      const modalAvatar = document.getElementById('modal-avatar');

      if (e.target.checked) {
        if (modalName) modalName.textContent = "Anonymous Puto";
        if (modalAvatar) {
          modalAvatar.innerHTML = `<img src="../assets/images/anon_avatar.jpg" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        }
      } else {
        if (modalName) modalName.textContent = currentProfile.name;
        if (modalAvatar) {
          modalAvatar.innerHTML = currentProfile.photo
            ? `<img src="${currentProfile.photo}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
            : `<svg>...</svg>`;
        }
      }
    });
  }
});

function updatePostUI(postId, data, currentUid) {
  const localPost = window.FEED_POSTS?.find(p => p.id === postId);

  const updateReaction = (type, countKey, activeClass, isMeKey) => {
    const btn = document.querySelector(`.feed-reaction-btn[data-id="${postId}"][data-type="${type}"]`);
    if (!btn) return false;

    const countSpan = btn.querySelector(`.${type}s-count`);

    const rawData = data[countKey];
    let count = 0;

    if (Array.isArray(rawData)) {
      count = rawData.length;
    } else if (typeof rawData === 'number') {
      count = rawData;
    } else {
      count = data[type] || 0;
    }

    if (countSpan) {

      countSpan.textContent = typeof fmt === 'function' ? fmt(count) : count;
    }

    const dataArray = Array.isArray(rawData) ? rawData : [];
    const isMe = currentUid ? dataArray.includes(currentUid) : false;

    if (activeClass) {
      btn.classList.toggle(activeClass, isMe);
    }

    if (localPost) {
      localPost[type + 's'] = count;
      localPost[isMeKey] = isMe;
    }

    return true;
  };

  const likeFound = updateReaction('like', 'likedBy', 'heart-active', 'isLikedByMe');
  const repostFound = updateReaction('repost', 'repostedBy', 'repost-active', 'isRepostedByMe');
  const commentFound = updateReaction('comment', 'comments', '', '');

  return likeFound && repostFound && commentFound;
}
window.formatSmartDate = function (dateObj) {
  if (!dateObj) return 'Just now';

  const now = new Date();
  const diffMs = now - dateObj;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  const isToday = now.toDateString() === dateObj.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = yesterday.toDateString() === dateObj.toDateString();

  if (isToday) {
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  }

  const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  const timeString = dateObj.toLocaleTimeString('en-US', timeOptions);

  if (isYesterday) {
    return `Yesterday at ${timeString}`;
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[dateObj.getMonth()];
  const day = dateObj.getDate();

  if (now.getFullYear() === dateObj.getFullYear()) {
    return `${month} ${day} at ${timeString}`;
  }
  return `${month} ${day}, ${dateObj.getFullYear()} at ${timeString}`;
};

function formatFirebaseData(snapshot) {
  return snapshot.docs.map(doc => {
    const data = doc.data();
    
    // Filter out Org posts from Homepage unless they are reposts
    if (data.isOrg === true && !data.repostOf) return null;

    const dateObj = data.createdAt ? data.createdAt.toDate() : new Date();
    const repostedBy = data.repostedBy || [];

    return {
      id: doc.id,
      name: data.author || "Anonymous Puto",
      userId: data.userId,
      photoSrc: data.isAnonymous ? "../assets/images/anon_avatar.jpg" : (data.photoURL || null),
      body: data.text,
      time: window.formatSmartDate(dateObj),
      likes: data.likedBy ? data.likedBy.length : 0,
      isLikedByMe: auth.currentUser ? (data.likedBy || []).includes(auth.currentUser.uid) : false,
      comments: data.comments || 0,
      reposts: repostedBy.length,
      isRepostedByMe: auth.currentUser ? repostedBy.includes(auth.currentUser.uid) : false,
      postImage: data.imageURL || null,
      imageURLs: data.imageURLs || [],
      repost: !!data.repostOf,
      repostIdRef: data.repostOf || null,
      isOwnPost: auth.currentUser ? data.userId === auth.currentUser.uid : false,
      quote: data.repostOf ? {
        body: data.repostText,
        name: data.repostAuthor,
        photoSrc: data.repostAuthorPhoto,
        repostImage: data.repostImage,
        repostTitle: data.repostTitle || "",
        time: data.repostTime || ""
      } : null,
      isOrg: !!data.isOrg
    };
  }).filter(Boolean);
}

const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  let needsFullRender = false;
  const currentUid = auth.currentUser?.uid;

  snapshot.docChanges().forEach((change) => {
    if (change.type === "modified") {
      const success = updatePostUI(change.doc.id, change.doc.data(), currentUid);
      if (!success) needsFullRender = true;
    } else {
      needsFullRender = true;
    }
  });

  if (needsFullRender || !window.FEED_POSTS || window.FEED_POSTS.length === 0) {
    window.FEED_POSTS = formatFirebaseData(snapshot);
    if (window.renderFeedPosts) window.renderFeedPosts();
  }
}, (error) => {
  console.error("[Post] Feed snapshot error:", error);
  const feed = document.getElementById('feed-posts');
  if (feed) {
    feed.innerHTML = `<div class="error-state" style="text-align:center; padding:40px; color:var(--maroon);">
      <p>Unable to load feed. ${error.code === 'permission-denied' ? 'Access denied.' : 'Please try again later.'}</p>
    </div>`;
  }
});

const feedContainer = document.getElementById('feed-posts');

if (feedContainer) {
  feedContainer.addEventListener('click', async (e) => {
    const btn = e.target.closest('.feed-reaction-btn[data-type="like"]');
    if (!btn) return;

    const postId = btn.dataset.id;
    const user = auth.currentUser;

    if (!user) {
      window.showToast("Login to like posts!", "warning");
      return;
    }

    const cache = JSON.parse(localStorage.getItem('tup_user_meta') || '{}');
    const myRole = cache.role;
    const postData = (window.FEED_POSTS || []).find(p => p.id === postId);

    if (myRole === 'Organization' && postData && !postData.isOrg) {
      const toast = document.getElementById('toast');
      if (toast) {
        window.showToast("Organizations cannot interact with student posts.", "warning");
      }
      return;
    }

    const isLiked = btn.classList.contains('heart-active');
    const postRef = doc(db, "posts", postId);

    try {
      if (!isLiked) {
        await updateDoc(postRef, {
          likedBy: arrayUnion(user.uid)
        });
        btn.classList.add('heart-active');
      } else {
        await updateDoc(postRef, {
          likedBy: arrayRemove(user.uid)
        });
        btn.classList.remove('heart-active');
      }
    } catch (err) {
      console.error("Like failed:", err);
    }
  });
}

let _currentRepostInfo = null;

feedContainer.addEventListener('click', async (e) => {
  const btn = e.target.closest('.feed-reaction-btn[data-type="repost"]');
  if (!btn) return;

  const postId = btn.dataset.id;
  const user = auth.currentUser;
  if (!user) { window.showToast("Login to repost!", "warning"); return; }

  const cache = JSON.parse(localStorage.getItem('tup_user_meta') || '{}');
  const myRole = cache.role;
  const postData = (window.FEED_POSTS || []).find(p => p.id === postId);

  if (myRole === 'Organization' && postData && !postData.isOrg) {
    const toast = document.getElementById('toast');
    if (toast) {
      window.showToast("Organizations cannot interact with student posts.", "warning");
    }
    return;
  }

  if (!postData) return;

  const isReposted = btn.classList.contains('repost-active');

  try {
    if (isReposted) {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        repostedBy: arrayRemove(user.uid)
      });
      btn.classList.remove('repost-active');

      const toast = document.getElementById('toast');
      if (toast) {
        window.showToast('Repost removed!', 'success');
      }
    } else {
      _currentRepostInfo = { btn, postId, postData };
      openRepostModalHP(postData);
    }
  } catch (err) {
    console.error("Repost failed:", err);
  }
});

window.deletePost = async function (postId, e) {
  const card = e.target.closest('.feed-post');
  const user = auth.currentUser;
  if (!user) return;

  window.showConfirm({
    title: '🗑️ Delete this post?',
    confirmText: 'Delete',
    onConfirm: async () => {
      try {
        const postRef = doc(db, "posts", postId);
        const snap = await getDoc(postRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.repostOf) {
            try {
              const originalRef = doc(db, "posts", data.repostOf);
              await updateDoc(originalRef, {
                repostedBy: arrayRemove(user.uid)
              });
            } catch (e1) {
              try {
                const annRef = doc(db, "announcements", data.repostOf);
                await updateDoc(annRef, {
                  reposts: arrayRemove(user.uid)
                });
              } catch (e2) {
                console.warn("Could not sync original post/announcement count (likely permission restricted):", e2);
              }
            }
          }
        }

        // Always attempt to delete the actual document regardless of sync results
        await deleteDoc(postRef);
        if (card) {
          card.style.transition = 'opacity 0.28s, transform 0.28s';
          card.style.opacity = '0';
          card.style.transform = 'scale(0.93)';
          setTimeout(() => card.remove(), 300);
        }
        window.showToast('Post deleted.', 'success');
      } catch (error) {
        console.error('Delete error:', error);
        window.showToast('Failed to delete post.', 'error');
      }
    }
  });
};

window.editPost = function (postId, e) {
  const card = e.target.closest('.feed-post');
  const bodyEl = card.querySelector('.feed-body');
  if (!bodyEl) return;

  const titleEl = card.querySelector('.post-title');
  const originalTitle = titleEl ? titleEl.textContent : '';

  const originalText = bodyEl.innerHTML
    .replace(/<br>/g, '\n')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');

  bodyEl.style.display = 'none';
  if (titleEl) titleEl.style.display = 'none';

  const editWrap = document.createElement('div');
  editWrap.className = 'post-edit-wrap';
  editWrap.innerHTML = `
      ${(titleEl || originalTitle) ? `<input type="text" class="post-edit-title" placeholder="Title..." value="${originalTitle}" style="width: 100%; margin-bottom: 8px; font-weight: 700; border: none; outline: none; border-bottom: 1px solid #eee; padding-bottom: 4px;">` : ''}
      <textarea class="post-edit-textarea">${originalText}</textarea>
      <div class="post-edit-buttons">
        <button class="post-edit-save" data-id="${postId}">Save</button>
        <button class="post-edit-cancel">Cancel</button>
      </div>
    `;
  bodyEl.parentNode.insertBefore(editWrap, bodyEl.nextSibling);

  setTimeout(() => {
    const ta = editWrap.querySelector('textarea');
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }, 50);
};

feedContainer.addEventListener('click', async (e) => {
  if (e.target.classList.contains('post-edit-save')) {
    const btn = e.target;
    const postId = btn.dataset.id;
    const card = btn.closest('.feed-post');
    const wrap = card.querySelector('.post-edit-wrap');
    const bodyEl = card.querySelector('.feed-body');
    const titleEl = card.querySelector('.post-title');
    const titleInput = wrap.querySelector('.post-edit-title');
    
    const newTitle = titleInput ? titleInput.value.trim() : null;
    const newText = wrap.querySelector('textarea').value.trim();

    if (newText || newTitle) {
      btn.disabled = true;
      btn.textContent = 'Saving...';
      try {
        const updateData = {
          text: newText,
          updatedAt: serverTimestamp()
        };
        if (newTitle !== null) updateData.title = newTitle;

        await updateDoc(doc(db, "posts", postId), { ...updateData });

        if (titleEl && newTitle !== null) {
          titleEl.textContent = newTitle;
          titleEl.style.display = newTitle ? '' : 'none';
        }
        bodyEl.innerHTML = newText.replace(/\n/g, '<br>');
        wrap.remove();
        bodyEl.style.display = '';
      } catch (error) {
        console.error("Failed to update post:", error);
        btn.disabled = false;
        btn.textContent = 'Save';
      }
    }
  }

  if (e.target.classList.contains('post-edit-cancel')) {
    const card = e.target.closest('.feed-post');
    const wrap = card.querySelector('.post-edit-wrap');
    const bodyEl = card.querySelector('.feed-body');
    const titleEl = card.querySelector('.post-title');
    if (wrap) wrap.remove();
    if (bodyEl) bodyEl.style.display = '';
    if (titleEl) titleEl.style.display = '';
  }
});

window.openRepostModalHP = openRepostModalHP;
function openRepostModalHP(postData, collectionName = 'posts') {
  const overlay = document.getElementById('hp-repost-modal-overlay');
  const modal = document.getElementById('hp-repost-modal');
  if (!overlay || !modal) return;

  _currentRepostInfo = {
      postId: postData.id,
      postData: postData,
      collection: collectionName
  };

  overlay.classList.add('open');
  overlay.style.display = 'flex';

  // Current User Info
  const cache = JSON.parse(localStorage.getItem('tup_user_meta') || '{}');
  document.getElementById('repost-user-name').textContent = currentProfile?.name || auth.currentUser?.displayName || "TUPian";
  const userAvatar = document.getElementById('repost-user-avatar');
  if (userAvatar && (currentProfile?.photo || auth.currentUser?.photoURL)) {
    userAvatar.innerHTML = `<img src="${currentProfile?.photo || auth.currentUser?.photoURL}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
  }

  // Original Post Preview
  const previewBody = document.getElementById('quote-preview-body');
  const previewAuthor = document.getElementById('quote-preview-author');
  const previewAvatar = document.getElementById('quote-preview-avatar');
  const previewTitle = document.getElementById('quote-preview-title');
  const previewTime = document.getElementById('quote-preview-time');

  previewAuthor.textContent = postData.author || postData.name || 'Anonymous';
  previewBody.textContent = postData.body || '';
  previewTitle.textContent = postData.title || '';
  previewTime.textContent = postData.time || 'JUST NOW';

  if (postData.photoSrc) {
    previewAvatar.innerHTML = `<img src="${postData.photoSrc}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
  } else {
    previewAvatar.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  }

  // Add image preview if exists
  const existingImg = modal.querySelector('.hp-rm-quote-image');
  if (existingImg) existingImg.remove();
  
  // Robust image identification
  const imgToPreview = postData.repostImage || postData.postImage || (postData.imageURLs && postData.imageURLs[0]) || postData.imageURL;
  
  if (imgToPreview) {
    const imgEl = document.createElement('img');
    imgEl.className = 'hp-rm-quote-image';
    imgEl.src = imgToPreview;
    imgEl.style.cssText = 'width:100%; max-height:200px; object-fit:cover; border-radius:8px; margin-top:8px;';
    document.getElementById('repost-quote-preview').appendChild(imgEl);
  }

  document.getElementById('repostContent').value = '';
  setTimeout(() => document.getElementById('repostContent').focus(), 150);
}

window.closeRepostModal = function () {
  const overlay = document.getElementById('hp-repost-modal-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.style.display = 'none';
  }
  _currentRepostInfo = null;
  const rc = document.getElementById('repostContent');
  if (rc) rc.value = '';
};

window.closeRepostModalOnOverlay = function (e) {
  if (e.target.id === 'hp-repost-modal-overlay') {
    window.closeRepostModal();
  }
};

window.submitRepost = async function (skipQuote = false) {
  if (!_currentRepostInfo) return;
  const quote = skipQuote ? "" : document.getElementById('repostContent').value.trim();
  const { postId, postData, collection: collectionNameArg } = _currentRepostInfo;

  const user = auth.currentUser;
  if (!user) return;

  const submitBtn = document.getElementById('repost-submit-btn');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const cache = JSON.parse(localStorage.getItem('tup_user_meta') || '{}');
    const isOrg = cache.role === 'Organization';
    const college = cache.college || null;

    const collectionName = collectionNameArg || 'posts';
    const isAnnouncement = collectionName === 'announcements';

    // Fetch fresh data to ensure we have all fields (especially for nested reposts or announcements)
    const postSnap = await getDoc(doc(db, collectionName, postId));
    if (!postSnap.exists()) {
      window.showToast("Original post not found.", "error");
      return;
    }
    const rawData = postSnap.data();

    const repostData = {
      userId: user.uid,
      author: (typeof currentProfile !== 'undefined' ? currentProfile.name : null) || user.displayName || "TUPian",
      photoURL: (typeof currentProfile !== 'undefined' ? currentProfile.photo : null) || user.photoURL || null,
      text: quote,
      imageURL: null,
      createdAt: serverTimestamp(),
      likedBy: [],
      comments: 0,
      repostOf: postId,
      repostAuthor: rawData.author || rawData.name || "Anonymous",
      repostText: rawData.text || rawData.body || "",
      repostImage: rawData.repostImage || rawData.imageURL || (rawData.imageURLs && rawData.imageURLs[0]) || null,
      repostAuthorPhoto: rawData.photoURL || rawData.photoSrc || '../assets/images/anon_avatar.jpg',
      repostTitle: rawData.title || "",
      repostTime: document.getElementById('quote-preview-time').textContent || "JUST NOW",
      isOrg: isOrg,
      college: college,
      repostCollection: collectionName
    };

    await addDoc(collection(db, "posts"), repostData);

    const postRef = doc(db, collectionName, postId);
    const repostField = isAnnouncement ? 'reposts' : 'repostedBy';
    
    await updateDoc(postRef, {
      [repostField]: arrayUnion(user.uid)
    });

    window.closeRepostModal();

    const toast = document.getElementById('toast');
    if (toast) {
      window.showToast('🔁 Reposted successfully!', 'repost');
    }
  } catch (err) {
    console.error("Repost submit failed:", err);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
};


