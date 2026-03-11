import { 
  getFirestore, doc, getDoc, collection, addDoc, query, orderBy, deleteDoc,
  onSnapshot, serverTimestamp, updateDoc, increment 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { 
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();


const firebaseConfig = {
  apiKey: "AIzaSyBpGOdMpx_Mws2EcCq6rbOWfZ-FFuhhfo0",
  authDomain: "tup-connect-b162d.firebaseapp.com",
  projectId: "tup-connect-b162d",
  storageBucket: "tup-connect-b162d.firebasestorage.app",
  messagingSenderId: "193141013544",
  appId: "1:193141013544:web:72b403e84aa4d3313f091d"
};

let unsubscribeComments = null;
let cachedPhoto = null;

const sendBtn = document.getElementById('comment-send-btn');
const inputField = document.getElementById('comment-input-field');
const commentList = document.getElementById('comment-list');
const overlay = document.getElementById('comment-modal-overlay');

function getAvatar(photo, name) {
    const initials = name ? name.charAt(0).toUpperCase() : '?';
    const hasPhoto = photo && typeof photo === 'string' && 
                    (photo.startsWith('http') || photo.startsWith('data:image'));

    if (hasPhoto) {
        return `
            <div class="avatar-container" style="width:100%; height:100%; position:relative;">
                <img src="${photo}" alt="${name}" 
                     style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="default-avatar" style="display:none; background:#7a1a1a; color:white; width:100%; height:100%; border-radius:50%; align-items:center; justify-content:center; position:absolute; top:0; left:0;">${initials}</div>
            </div>`;
    }
    
    return `<div class="default-avatar" style="background:#7a1a1a; color:white; width:100%; height:100%; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">${initials}</div>`;
}


async function updateModalInputAvatar() {
    const inputAvatar = document.getElementById('comment-input-avatar');
    if (!inputAvatar || !auth.currentUser) return;

    if (cachedPhoto) {
        inputAvatar.innerHTML = getAvatar(cachedPhoto, auth.currentUser.displayName);
        return;
    }
    const userRef = doc(db, "users", auth.currentUser.uid);
    try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data();
            cachedPhoto = data.photoURL || data.photoSrc;
            inputAvatar.innerHTML = getAvatar(cachedPhoto, auth.currentUser.displayName);
        }
    } catch (err) {
        console.error("Failed to fetch avatar from Firestore:", err);
        inputAvatar.innerHTML = getAvatar(null, auth.currentUser.displayName);
    }
}

window.openCommentModal = async function(postIdx) {
    const overlay = document.getElementById('comment-modal-overlay');
    
    await updateModalInputAvatar();

    if (overlay) {
        overlay.dataset.post = postIdx;
        overlay.classList.add('open');
        
        const inputField = document.getElementById('comment-input-field');
        if (inputField) inputField.value = '';

        if (window.renderComments) {
            window.renderComments(postIdx);
        }

        setTimeout(() => inputField.focus(), 150);
    }
};

const feedContainer = document.getElementById('feed-posts');

if (feedContainer) {
  feedContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-type="comment"]');
    if (!btn) return;

    if (inputField) inputField.value = ''; 

    const postId = btn.dataset.id;
    const postIdx = window.FEED_POSTS.findIndex(p => p.id === postId);

    if (postIdx !== -1 && window.FEED_POSTS[postIdx]) {
      listenForComments(postId); 
      
      if (typeof window.openCommentModal === 'function') {
          window.openCommentModal(postIdx);
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
      const user = auth.currentUser;

      let finalPhoto = data.photoURL || data.photoSrc || "anon";

      if (user && data.userId === user.uid) {
          finalPhoto = user.photoURL || "anon"; 
      }

      return {
        id: doc.id,
        ...data,
        photoURL: finalPhoto,
        isOwn: auth.currentUser ? (data.userId === auth.currentUser.uid) : false,
        time: data.createdAt ? data.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'
      };
    });

    const postIdx = window.FEED_POSTS.findIndex(p => p.id === postId);
    if (postIdx !== -1) {
      window.FEED_POSTS[postIdx].commentList = comments;
      
      window.FEED_POSTS[postIdx].comments = comments.length;

      if (window.renderComments) {
          window.renderComments(postIdx);
      }
      
      if (window.renderFeed) {
          window.renderFeed(); 
      }
    }
  });
}

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
    const currentUser = auth.currentUser;
    const photoToUpload = window.cachedPhoto || currentUser.photoURL || null;

    await addDoc(collection(db, "posts", post.id, "comments"), {
        text: text,
        author: currentUser.displayName || "Anonymous User",
        userId: currentUser.uid,
        photoURL: photoToUpload,
        createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, "posts", post.id), {
        comments: increment(1)
    });

    inputField.value = '';
    console.log("Input cleared. Waiting for Snapshot to render...");

} catch (err) {
    console.error("Failed to add comment:", err);
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

window.deleteComment = async function(postId, commentId) {
    const commentRef = doc(db, "posts", postId, "comments", commentId);
    await deleteDoc(commentRef);

    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
        comments: increment(-1)
    });
};
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

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            cachedPhoto = userData.photoURL || userData.photoSrc || null;
            window.cachedPhoto = cachedPhoto; 
            console.log("Global Cache filled!");
        }
        updateModalInputAvatar();
    }
});

window.getAvatar = getAvatar;
window.cachedPhoto = cachedPhoto;
