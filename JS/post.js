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
window.formatSmartDate = function(dateObj) {
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
            repost: !!data.repostOf,
            repostIdRef: data.repostOf || null,
            isOwnPost: auth.currentUser ? data.userId === auth.currentUser.uid : false,
            quote: data.repostOf ? {
                body: data.repostText,
                name: data.repostAuthor,
                photoSrc: data.repostAuthorPhoto,
                repostImage: data.repostImage
            } : null
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

let _currentRepostInfo = null;

feedContainer.addEventListener('click', async (e) => {
    const btn = e.target.closest('.feed-reaction-btn[data-type="repost"]');
    if (!btn) return;

    const postId = btn.dataset.id; 
    const user = auth.currentUser;
    if (!user) return alert("Login to repost!");

    const postData = window.FEED_POSTS?.find(p => p.id === postId);
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
                toast.textContent = 'Repost removed!';
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 2800);
            }
        } else {
            _currentRepostInfo = { btn, postId, postData };
            document.getElementById('repostModal').classList.add('open');
            document.getElementById('repostContent').focus();
        }
    } catch (err) {
        console.error("Repost failed:", err);
    }
});

window.deletePost = async function(postId, e) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    const card = e.target.closest('.feed-post');
    const user = auth.currentUser;
    if (!user) return;
  
    try {
        const postRef = doc(db, "posts", postId);
        const snap = await getDoc(postRef);
        if (snap.exists()) {
             const data = snap.data();
             if (data.repostOf) {
                 const originalRef = doc(db, "posts", data.repostOf);
                 await updateDoc(originalRef, {
                     repostedBy: arrayRemove(user.uid)
                 });
             }
        }

        await deleteDoc(postRef);
        if (card) {
            card.style.transition = 'opacity 0.28s, transform 0.28s';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.93)';
            setTimeout(() => card.remove(), 300);
        }
        
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = 'Post deleted.';
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2800);
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete post.');
    }
};

window.editPost = function(postId, e) {
    const card = e.target.closest('.feed-post');
    const bodyEl = card.querySelector('.feed-body');
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
        const newText = wrap.querySelector('textarea').value.trim();

        if (newText) {
            btn.disabled = true;
            btn.textContent = 'Saving...';
            try {
                await updateDoc(doc(db, "posts", postId), {
                    text: newText,
                    updatedAt: serverTimestamp()
                });
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
        if (wrap) wrap.remove();
        if (bodyEl) bodyEl.style.display = '';
    }
});

window.closeRepostModal = function() {
    document.getElementById('repostModal').classList.remove('open');
    _currentRepostInfo = null;
    const rc = document.getElementById('repostContent');
    if (rc) rc.value = '';
};

window.closeRepostModalOnOverlay = function(e) {
    if (e.target === document.getElementById('repostModal')) {
        window.closeRepostModal();
    }
};

window.submitRepost = async function() {
    if (!_currentRepostInfo) return;
    const quote = document.getElementById('repostContent').value.trim();
    const { btn, postId, postData } = _currentRepostInfo;
    
    const user = auth.currentUser;
    if (!user) return;

    try {
        await addDoc(collection(db, "posts"), {
            userId: user.uid,
            author: currentProfile.name || user.displayName || "TUPian",
            photoURL: currentProfile.photo || user.photoURL || null,
            text: quote,
            imageURL: null,
            createdAt: serverTimestamp(),
            likedBy: [],
            comments: 0,
            repostOf: postId,
            repostAuthor: postData.name,
            repostText: postData.body,
            repostImage: postData.postImage,
            repostAuthorPhoto: postData.photoSrc || '../assets/images/anon_avatar.jpg'
        });

        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
            repostedBy: arrayUnion(user.uid)
        });

        window.closeRepostModal();
        
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = 'Reposted successfully!';
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2800);
        }
    } catch (err) {
        console.error("Repost submit failed:", err);
    }
};


