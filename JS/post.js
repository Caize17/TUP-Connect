import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, onSnapshot,
    serverTimestamp, 
    query, orderBy, increment,
    doc, getDoc, addDoc, deleteDoc, updateDoc,
    arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getStorage, ref, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpGOdMpx_Mws2EcCq6rbOWfZ-FFuhhfo0",
  authDomain: "tup-connect-b162d.firebaseapp.com",
  projectId: "tup-connect-b162d",
  storageBucket: "tup-connect-b162d.firebasestorage.app",
  messagingSenderId: "193141013544",
  appId: "1:193141013544:web:72b403e84aa4d3313f091d"
};

let currentProfile = { name: "TUPian", photo: null };
let updatePostBox = null;
let unsubscribeComments = null;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

const imageInput = document.getElementById('modal-file-input');
const imagePreview = document.getElementById('post-image-preview'); 
const addImageBtn = document.getElementById('modal-photo-btn');
const closeBtn = document.getElementById('modal-close-btn');

if (addImageBtn && imageInput) {
  imageInput.addEventListener('change', function() {
    const file = this.files[0];
    const attachments = document.getElementById('modal-attachments');
    const preview = document.getElementById('post-image-preview');

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        if (attachments) {
            attachments.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

async function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_WIDTH = 800;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
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
                const MAX_WIDTH = 800;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.onerror = reject;
            img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

const submitBtn  = document.getElementById('modal-submit-btn');
const anonToggle = document.getElementById('modal-anon-toggle');
const overlay    = document.getElementById('create-post-overlay');

window.resetPostModal = function() {
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

    console.log("Modal fully cleared: Text, Image, and Identity reset.");
};

async function uploadPostToFirestore(text, imageData, isAnonymous) {
    const user = auth.currentUser;
    let name = currentProfile.name;
    let photo = currentProfile.photo;

    if (isAnonymous) {
        name = "Anonymous Puto";
        photo = "../assets/images/anon_avatar.jpg";
    }

    return await addDoc(collection(db, "posts"), {
        text: text,
        imageURL: imageData,
        userId: user?.uid || "unknown",
        author: name,
        photoURL: photo,
        isAnonymous: isAnonymous,
        createdAt: serverTimestamp(),
        likes: 0
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
    const liveImageInput = document.getElementById('modal-file-input');
    const liveAnonToggle = document.getElementById('modal-anon-toggle');

    const text = liveTextarea ? liveTextarea.value.trim() : "";
    const imageFile = liveImageInput ? liveImageInput.files[0] : null;

    const isAnon = liveAnonToggle ? liveAnonToggle.checked : false;

    if (!text && !imageFile) return;

    try {
      submitBtn.disabled = true;

      let finalImageData = null;
      if (imageFile) {
        finalImageData = await getCompressedImageData(imageFile);
      }

      await uploadPostToFirestore(text, finalImageData, isAnon);
 
      setModalSelection(false); 
      
    } catch (err) {
      console.error("❌ Post Error:", err);
      alert("Failed to post: " + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = `<i class="fa-regular fa-paper-plane"></i> Share`;
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
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      currentProfile.name = userData.fullName || currentProfile.name;
      currentProfile.photo = userData.photoURL || currentProfile.photo;

      updatePostBox(currentProfile.name, currentProfile.photo);
    }
  } catch (err) { 
    console.error("Error fetching user doc:", err); 
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

function formatFirebaseData(snapshot) {
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const dateObj = data.createdAt ? data.createdAt.toDate() : new Date();
        const repostedBy = data.repostedBy || [];
        
        return {
            id: doc.id,
            name: data.author || "Anonymous Puto",
            body: data.text,
            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            likes: data.likedBy ? data.likedBy.length : 0,
            isLikedByMe: auth.currentUser ? (data.likedBy || []).includes(auth.currentUser.uid) : false,
            comments: data.comments || 0,
            reposts: repostedBy.length,
            isRepostedByMe: auth.currentUser ? repostedBy.includes(auth.currentUser.uid) : false,
            photoSrc: data.isAnonymous ? "../assets/images/anon_avatar.jpg" : (data.photoURL || null),
            postImage: data.imageURL || null
        };
    });
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
});

const feedContainer = document.getElementById('feed-posts');

if (feedContainer) {
  feedContainer.addEventListener('click', async (e) => {
    const btn = e.target.closest('.feed-reaction-btn[data-type="like"]');
    if (!btn) return;

    const postId = btn.dataset.id;
    const user = auth.currentUser;

    if (!user) {
      alert("Login to like posts!");
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

feedContainer.addEventListener('click', async (e) => {
    const btn = e.target.closest('.feed-reaction-btn[data-type="repost"]');
    if (!btn) return;

    const postId = btn.dataset.id; 

    const user = auth.currentUser;
    if (!user) return alert("Login to repost!");

    try {
        const postRef = doc(db, "posts", postId);
        const isReposted = btn.classList.contains('repost-active');

        await updateDoc(postRef, {
            repostedBy: isReposted ? arrayRemove(user.uid) : arrayUnion(user.uid)
        });
        
    } catch (err) {
        console.error("Repost failed:", err);
    }
});

if (feedContainer) {
  feedContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-type="comment"]');
    if (!btn) return;

    const postId = btn.dataset.id;
    const postIdx = window.FEED_POSTS.findIndex(p => p.id === postId);

    if (postIdx !== -1 && window.FEED_POSTS[postIdx]) {
    listenForComments(postId); 
    
    if (typeof window.openCommentModal === 'function') {
        window.openCommentModal(postIdx);
    } else {
        console.error("The openCommentModal function hasn't loaded yet!");
    }
}
  });
}

function listenForComments(postId) {
  if (unsubscribeComments) unsubscribeComments();
    
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );

  unsubscribeComments = onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        isOwn: auth.currentUser ? (data.userId === auth.currentUser.uid) : false,
        time: data.createdAt ? data.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'
      };
    });

    const postIdx = window.FEED_POSTS.findIndex(p => p.id === postId);
    if (postIdx !== -1) {
      window.FEED_POSTS[postIdx].commentList = comments;
      if (window.renderComments) {
          window.renderComments(postIdx);
      } else if (window.openCommentModal) {
          window.openCommentModal(postIdx);
      }
    }
  });
}

const sendBtn = document.getElementById('comment-send-btn');
const inputField = document.getElementById('comment-input-field');

if (sendBtn) {
  sendBtn.addEventListener('click', async () => {
    const overlay = document.getElementById('comment-modal-overlay');
    const postIdx = overlay.dataset.post;
    const post = window.FEED_POSTS ? window.FEED_POSTS[postIdx] : null;
    const text = inputField.value.trim();

    if (!text || !post || !auth.currentUser) {
        console.error("Missing data:", { text, post, user: auth.currentUser });
        return;
    }

    try {
      await addDoc(collection(db, "posts", post.id, "comments"), {
        text: text,
        author: auth.currentUser.displayName || "Anonymous User",
        userId: auth.currentUser.uid,
        photoSrc: auth.currentUser.photoURL || null,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "posts", post.id), {
        comments: increment(1)
      });

      inputField.value = '';
    } catch (err) {
      console.error("Firebase Error:", err);
    }
  });
}

async function saveCommentEdit(postId, commentId, newText) {
  const commentRef = doc(db, "posts", postId, "comments", commentId);
  
  return await updateDoc(commentRef, {
    text: newText,
    isEdited: true,
    editedAt: serverTimestamp()
  });
}
window.saveCommentEdit = saveCommentEdit;

async function deleteComment(postId, commentId) {
  const commentRef = doc(db, "posts", postId, "comments", commentId);
  const postRef = doc(db, "posts", postId);

  await deleteDoc(commentRef); 

  await updateDoc(postRef, {
    comments: increment(-1)
  });
}
window.deleteComment = deleteComment;

document.addEventListener('click', async (e) => {
    const menuBtn = e.target.closest('.post-menu-btn');

    if (menuBtn) {
        e.stopPropagation(); 
        const idx = menuBtn.dataset.post;
        const dropdown = document.getElementById(`post-menu-${idx}`);

        document.querySelectorAll('.post-menu-dropdown.open').forEach(m => {
            if (m !== dropdown) m.classList.remove('open');
        });

        dropdown.classList.toggle('open');
        return;
    }

    const reportItem = e.target.closest('[data-action="report"]');
    if (reportItem) {
        const idx = reportItem.dataset.post;
        const post = window.FEED_POSTS ? window.FEED_POSTS[idx] : null;

        if (post && confirm("Report this post for community review?")) {
            try {
                await handleReportPost(post.id, post.userId);
                alert("Thank you. The post has been reported.");
            } catch (err) {
                console.error("Report failed:", err);
                alert("Could not submit report at this time.");
            }
        }

        const dropdown = reportItem.closest('.post-menu-dropdown');
        if (dropdown) dropdown.classList.remove('open');
        return;
    }

    document.querySelectorAll('.post-menu-dropdown.open').forEach(m => {
        m.classList.remove('open');
    });
});

window.handleReportPost = async function(postId, userId) {
    if (!auth.currentUser) return alert("Login to report.");
    console.log("Reporting Post:", postId, "User:", userId);

    if (!postId || !userId) {
        throw new Error("Missing Post ID or User ID. Check your data mapping.");
    }

    return await addDoc(collection(db, "reports"), {
        postId: postId,
        reportedUser: userId,
        reportedBy: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        status: "pending"
    });
};








































/*

const sendBtn = document.getElementById('comment-send-btn');
const inputField = document.getElementById('comment-input-field');

window.handleCommentClick = function(postId) {
    const postIdx = window.FEED_POSTS?.findIndex(p => p.id === postId);
    
    if (postIdx !== -1 && window.FEED_POSTS[postIdx]) {
        if (typeof listenForComments === 'function') listenForComments(postId); 
        
        if (typeof window.openCommentModal === 'function') {
            window.openCommentModal(postIdx);
        }
    }
};

if (feedContainer) {
    feedContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-type="comment"]');
        if (btn && btn.dataset.id) {
            window.handleCommentClick(btn.dataset.id);
        }
    });
}

function formatCommentData(doc, currentUid) {
    const data = doc.data();

    let finalPhoto = data.photoURL || data.photoSrc;

    if (!finalPhoto || finalPhoto.includes('anon_avatar')) {
      finalPhoto = "anon"; 
    }

    return {
    id: doc.id,
    ...data,
    photoURL: finalPhoto,
    isOwn: auth.currentUser ? (data.userId === auth.currentUser.uid) : false,
    time: data.createdAt ? data.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'
  };
}
























/*






function avatarHtmlFor(photo, name) {
  if (photo && photo !== 'anon') {
    return `<img src="${photo}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  }
  return `<div class="anon-placeholder">...SVG HERE...</div>`;
}

function updateLocalPostComments(postId, comments) {
    const postIdx = window.FEED_POSTS?.findIndex(p => p.id === postId);
    if (postIdx === -1 || !window.FEED_POSTS) return;

    window.FEED_POSTS[postIdx].commentList = comments;

    if (typeof window.renderComments === 'function') {
        window.renderComments(postIdx);
    }
}

function listenForComments(postId) {
    if (unsubscribeComments) unsubscribeComments();

    const currentUid = auth.currentUser?.uid;
    const q = query(
        collection(db, "posts", postId, "comments"),
        orderBy("createdAt", "asc")
    );

    unsubscribeComments = onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map(doc => formatCommentData(doc, currentUid));

        updateLocalPostComments(postId, comments);
    }, (error) => {
        console.error("❌ Comment Listener Error:", error);
    });
}


if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
        const overlay = document.getElementById('comment-modal-overlay');
        const postIdx = overlay.dataset.post;
        const post = window.FEED_POSTS ? window.FEED_POSTS[postIdx] : null;
        const text = inputField.value.trim();

        if (!text || !post) return;

        try {
            sendBtn.disabled = true;
            await uploadCommentToFirestore(post.id, text);
            inputField.value = '';
        } catch (err) {
            console.error("Comment Error:", err);
            alert("Could not send comment.");
        } finally {
            sendBtn.disabled = false;
        }
    });
}

function closeCommentModal() {
  commentOverlay.classList.remove('open');
  const field = document.getElementById('comment-input-field');
  if (field) field.value = '';
  const list = document.getElementById('comment-list');
  if (list) list.innerHTML = '';
  if (typeof unsubscribeComments === 'function') unsubscribeComments();
}




/*
async function saveCommentEdit(postId, commentId, newText) {
  const commentRef = doc(db, "posts", postId, "comments", commentId);
  
  return await updateDoc(commentRef, {
    text: newText,
    isEdited: true,
    editedAt: serverTimestamp()
  });
}
window.saveCommentEdit = saveCommentEdit;


async function saveCommentEdit(postId, commentId, newText) {
  const commentRef = doc(db, "posts", postId, "comments", commentId);
  
  return await updateDoc(commentRef, {
    text: newText,
    isEdited: true,
    editedAt: serverTimestamp()
  });
}
window.saveCommentEdit = saveCommentEdit;

async function deleteComment(postId, commentId) {
  const commentRef = doc(db, "posts", postId, "comments", commentId);
  const postRef = doc(db, "posts", postId);

  await deleteDoc(commentRef); 

  await updateDoc(postRef, {
    comments: increment(-1)
  });
}
window.deleteComment = deleteComment;

document.addEventListener('click', async (e) => {
    const menuBtn = e.target.closest('.post-menu-btn');

    if (menuBtn) {
        e.stopPropagation(); 
        const idx = menuBtn.dataset.post;
        const dropdown = document.getElementById(`post-menu-${idx}`);

        document.querySelectorAll('.post-menu-dropdown.open').forEach(m => {
            if (m !== dropdown) m.classList.remove('open');
        });

        dropdown.classList.toggle('open');
        return;
    }

    const reportItem = e.target.closest('[data-action="report"]');
    if (reportItem) {
        const idx = reportItem.dataset.post;
        const post = window.FEED_POSTS ? window.FEED_POSTS[idx] : null;

        if (post && confirm("Report this post for community review?")) {
            try {
                await handleReportPost(post.id, post.userId);
                alert("Thank you. The post has been reported.");
            } catch (err) {
                console.error("Report failed:", err);
                alert("Could not submit report at this time.");
            }
        }

        const dropdown = reportItem.closest('.post-menu-dropdown');
        if (dropdown) dropdown.classList.remove('open');
        return;
    }

    document.querySelectorAll('.post-menu-dropdown.open').forEach(m => {
        m.classList.remove('open');
    });
});

window.handleReportPost = async function(postId, userId) {
    if (!auth.currentUser) return alert("Login to report.");
    console.log("Reporting Post:", postId, "User:", userId);

    if (!postId || !userId) {
        throw new Error("Missing Post ID or User ID. Check your data mapping.");
    }

    return await addDoc(collection(db, "reports"), {
        postId: postId,
        reportedUser: userId,
        reportedBy: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        status: "pending"
    });
};*/