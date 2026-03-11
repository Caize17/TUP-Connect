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

let unsubscribeComments = null; 
const fmt = (num) => (num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num);

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
    if (file && imagePreview) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });
}

const submitBtn  = document.getElementById('modal-submit-btn');
const anonToggle = document.getElementById('modal-anon-toggle');
const overlay    = document.getElementById('create-post-overlay');

function resetPostModal() {
    const liveTextarea = document.getElementById('post-textarea');
    const attachments = document.getElementById('modal-attachments');
    const fileInput = document.getElementById('modal-file-input');

    if (liveTextarea) liveTextarea.value = '';

    if (fileInput) fileInput.value = ""; 

    if (attachments) {
        attachments.innerHTML = '';
        attachments.style.display = 'none';
    }

    console.log("Modal cleared successfully!");
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

if (submitBtn) {
  submitBtn.addEventListener('click', async (e) => {
    e.stopImmediatePropagation();

    const liveTextarea = document.getElementById('post-textarea');
    const text = liveTextarea ? liveTextarea.value.trim() : "";
    const imageFile = imageInput ? imageInput.files[0] : null;

    if (!text && !imageFile) return;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Posting...";

      let finalImageData = null;

      if (imageFile) {
        console.log("Compressing image...");
        finalImageData = await new Promise((resolve, reject) => {
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

              const compressedData = canvas.toDataURL('image/jpeg', 0.6);
              console.log("Compression complete. String length:", compressedData.length);
              resolve(compressedData);
            };
            img.onerror = reject;
            img.src = event.target.result;
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
      }

      console.log("Saving to Firestore...");
      await addDoc(collection(db, "posts"), {
        text: text,
        imageURL: finalImageData,
        userId: auth.currentUser?.uid || "unknown",
        author: anonToggle.checked ? "Anonymous Puto" : (auth.currentUser?.displayName || "TUPian"),
        photoURL: auth.currentUser?.photoURL || null,
        isAnonymous: anonToggle.checked,
        createdAt: serverTimestamp(),
        likes: 0
      });

      console.log("Post successful!");
      resetPostModal();
      if (overlay) overlay.classList.remove('open');

    } catch (err) {
      console.error("❌ Post Error:", err);
      alert("Failed to post: " + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Share";
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const updatePostBox = (name, photo) => {
    const postBoxNameEl = document.getElementById('modal-user-name');
    const postBoxPhotoEl = document.getElementById('modal-user-photo');

    if (postBoxNameEl) postBoxNameEl.textContent = name;
    if (postBoxPhotoEl && photo) postBoxPhotoEl.src = photo;
  };

  updatePostBox(user.displayName || "TUPian", user.photoURL);

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const fullName = userData.fullName || userData.displayName || user.displayName;
      const photoURL = userData.photoURL || user.photoURL;

      updatePostBox(fullName, photoURL);
    }
  } catch (error) {
    console.error("Error updating Post Box:", error);
  }
});

const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
    let needsFullRender = false;

snapshot.docChanges().forEach((change) => {
    const data = change.doc.data();
    const postId = change.doc.id;
    const currentUid = auth.currentUser?.uid;

    if (change.type === "modified") {
        const localPost = window.FEED_POSTS?.find(p => p.id === postId);

        const likeBtn = document.querySelector(`.feed-reaction-btn[data-id="${postId}"][data-type="like"]`);
        if (likeBtn) {
            const likeSpan = likeBtn.querySelector('.likes-count');
            const likedArray = data.likedBy || [];
            const newLikeCount = likedArray.length;

            if (likeSpan) {
                likeSpan.textContent = typeof fmt === 'function' ? fmt(newLikeCount) : newLikeCount;
            }

            const isLikedByMe = currentUid ? likedArray.includes(currentUid) : false;
            likeBtn.classList.toggle('heart-active', isLikedByMe);

            if (localPost) {
                localPost.likes = newLikeCount;
                localPost.isLikedByMe = isLikedByMe;
            }
        }

        const repostBtn = document.querySelector(`.feed-reaction-btn[data-id="${postId}"][data-type="repost"]`);
        if (repostBtn) {
            const repostSpan = repostBtn.querySelector('.reposts-count');
            const repostArray = data.repostedBy || [];
            const newRepostCount = repostArray.length;
            
            if (repostSpan) {
                repostSpan.textContent = typeof fmt === 'function' ? fmt(newRepostCount) : newRepostCount;
            }

            const isRepostedByMe = currentUid ? repostArray.includes(currentUid) : false;
            repostBtn.classList.toggle('repost-active', isRepostedByMe);

            if (localPost) {
                localPost.reposts = newRepostCount;
                localPost.isRepostedByMe = isRepostedByMe;
            }
        }

        const commentBtn = document.querySelector(`.feed-reaction-btn[data-id="${postId}"][data-type="comment"]`);
        if (commentBtn) {
            const countSpan = commentBtn.querySelector('.comments-count');
            const newCommentCount = data.comments || 0;
            if (countSpan) countSpan.textContent = typeof fmt === 'function' ? fmt(newCommentCount) : newCommentCount;
            if (localPost) localPost.comments = newCommentCount;
        } else {
            needsFullRender = true;
        }
    } else {
        needsFullRender = true;
    }
});

    if (needsFullRender || !window.FEED_POSTS || window.FEED_POSTS.length === 0) {
        const firebaseData = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            const dateObj = data.createdAt ? data.createdAt.toDate() : new Date();
            const repostedBy = data.repostedBy || [];
            
            firebaseData.push({
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
            });
        });

        window.FEED_POSTS = firebaseData;
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
        
        console.log("Success! Post ID used:", postId);
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




async function handleReportPost(postId, reportedUserId) {
    const user = auth.currentUser;
    if (!user) return alert("Please login to report posts.");

    const reportsRef = collection(db, "reports");

    await addDoc(reportsRef, {
        postId: postId,
        reportedUserId: reportedUserId,
        reportedBy: user.uid,
        timestamp: serverTimestamp(),
        status: "pending"
    });
}

